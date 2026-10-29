import ARKit
import CompositorServices
import Metal
import MetalKit
import ModelIO
import simd

nonisolated let alignedUniformsSize       = (MemoryLayout<VolumeUniforms>.size + 0xFF) & -0x100
nonisolated let alignedViewProjectionSize = (MemoryLayout<ViewProjectionArray>.size + 0xFF) & -0x100
nonisolated let maxBuffersInFlight        = 3

// MARK: - Helpers

extension LayerRenderer.Clock.Instant {
    nonisolated var timeInterval: TimeInterval {
        let c = LayerRenderer.Clock.Instant.epoch.duration(to: self).components
        return TimeInterval(c.seconds) + TimeInterval(c.attoseconds / 1_000_000_000) / TimeInterval(NSEC_PER_SEC)
    }
}

final class RendererTaskExecutor: TaskExecutor {
    private let queue = DispatchQueue(label: "com.epam.mriviewer.RenderThread", qos: .userInteractive)
    func enqueue(_ job: UnownedJob) {
        queue.async { job.runSynchronously(on: self.asUnownedSerialExecutor()) }
    }
    nonisolated func asUnownedSerialExecutor() -> UnownedTaskExecutor {
        UnownedTaskExecutor(ordinary: self)
    }
    static let shared = RendererTaskExecutor()
}

// MARK: - Renderer

actor Renderer {

    private let device: MTLDevice
    private let commandQueue: MTLCommandQueue
    private let pipelineState: MTLRenderPipelineState
    private let depthState: MTLDepthStencilState
    private let volumeProxyMesh: MTKMesh

    // Triple-buffered uniform buffer
    private let dynamicUniformBuffer: MTLBuffer
    private var uniformBufferOffset = 0
    private var uniformBufferIndex  = 0
    private var uniforms: UnsafeMutablePointer<VolumeUniforms>
    private let inFlightSemaphore = DispatchSemaphore(value: maxBuffersInFlight)

    private var perDrawableTarget = [LayerRenderer.Drawable.Target: DrawableTarget]()

    private let worldTracking:  WorldTrackingProvider
    private let planeDetection: PlaneDetectionProvider
    private let layerRenderer:  LayerRenderer
    private let renderState:    VolumeRenderState

    // MARK: Init

    init(_ layerRenderer: LayerRenderer, renderState: VolumeRenderState) {
        self.layerRenderer = layerRenderer
        self.renderState   = renderState
        self.device        = layerRenderer.device

        guard let queue = device.makeCommandQueue() else {
            fatalError("Failed to create Metal command queue")
        }
        self.commandQueue = queue

        let vtxDesc = Self.buildVertexDescriptor()
        self.pipelineState = try! Self.buildRenderPipeline(
            device: device, layerRenderer: layerRenderer, vtxDesc: vtxDesc)
        self.depthState       = Self.buildDepthState(device: device)
        self.volumeProxyMesh  = try! Self.buildProxyMesh(device: device, vtxDesc: vtxDesc)

        self.dynamicUniformBuffer = device.makeBuffer(
            length: alignedUniformsSize * maxBuffersInFlight,
            options: .storageModeShared)!
        self.dynamicUniformBuffer.label = "VolumeUniforms"
        self.uniforms = UnsafeMutableRawPointer(dynamicUniformBuffer.contents())
            .bindMemory(to: VolumeUniforms.self, capacity: 1)

        self.worldTracking  = WorldTrackingProvider()
        self.planeDetection = PlaneDetectionProvider(alignments: [.horizontal])
    }

    // MARK: ARKit

    private func startARSession() async {
        let session = ARKitSession()
        do {
            try await session.run([worldTracking, planeDetection])
        } catch {
            try? await session.run([worldTracking])
        }
    }

    @MainActor
    static func startRenderLoop(_ layerRenderer: LayerRenderer, renderState: VolumeRenderState) {
        Task(executorPreference: RendererTaskExecutor.shared) {
            let renderer = Renderer(layerRenderer, renderState: renderState)
            await renderer.startARSession()
            await renderer.renderLoop()
        }
    }

    // MARK: Frame loop

    func renderLoop() {
        while true {
            switch layerRenderer.state {
            case .invalidated: return
            case .paused:      layerRenderer.waitUntilRunning()
            default:           autoreleasepool { renderFrame() }
            }
        }
    }

    private func renderFrame() {
        guard let frame = layerRenderer.queryNextFrame() else { return }

        _ = inFlightSemaphore.wait(timeout: .distantFuture)

        frame.startUpdate()
        updateUniformBuffer()
        let state = renderState.snapshotSync()
        updateVolumeUniforms(state)
        frame.endUpdate()

        guard let timing = frame.predictTiming() else {
            inFlightSemaphore.signal()
            return
        }
        LayerRenderer.Clock().wait(until: timing.optimalInputTime)

        let drawables = frame.queryDrawables()
        guard !drawables.isEmpty else {
            inFlightSemaphore.signal()
            return
        }

        guard let cmdBuffer = commandQueue.makeCommandBuffer() else {
            inFlightSemaphore.signal()
            return
        }
        cmdBuffer.label = "VolumeRenderBuffer"

        let sem = inFlightSemaphore
        cmdBuffer.addCompletedHandler { _ in sem.signal() }

        frame.startSubmission()
        for drawable in drawables {
            render(drawable: drawable, cmdBuffer: cmdBuffer, volumeTexture: state.texture)
        }
        cmdBuffer.commit()
        frame.endSubmission()
    }

    // MARK: Uniforms

    private func updateUniformBuffer() {
        uniformBufferIndex  = (uniformBufferIndex + 1) % maxBuffersInFlight
        uniformBufferOffset = alignedUniformsSize * uniformBufferIndex
        uniforms = UnsafeMutableRawPointer(dynamicUniformBuffer.contents() + uniformBufferOffset)
            .bindMemory(to: VolumeUniforms.self, capacity: 1)
    }

    private func updateVolumeUniforms(
        _ state: (texture: MTLTexture?, windowMin: Float, windowMax: Float,
                   anchor: simd_float4x4, scale: SIMD3<Float>)
    ) {
        let scaleM = simd_float4x4(diagonal: SIMD4<Float>(state.scale.x, state.scale.y, state.scale.z, 1))
        let model  = state.anchor * scaleM
        uniforms[0].modelMatrix    = model
        uniforms[0].modelMatrixInv = simd_inverse(model)
        uniforms[0].windowMin      = state.windowMin
        uniforms[0].windowMax      = state.windowMax
        uniforms[0].stepSize       = 0.004
    }

    // MARK: Draw

    private func render(drawable: LayerRenderer.Drawable,
                        cmdBuffer: MTLCommandBuffer,
                        volumeTexture: MTLTexture?) {
        let time         = drawable.frameTiming.presentationTime.timeInterval
        let deviceAnchor = worldTracking.queryDeviceAnchor(atTimestamp: time)
        drawable.deviceAnchor = deviceAnchor

        if perDrawableTarget[drawable.target] == nil {
            perDrawableTarget[drawable.target] = DrawableTarget(drawable: drawable, device: device)
        }
        let target = perDrawableTarget[drawable.target]!
        target.update(uniformBufferIndex: uniformBufferIndex, drawable: drawable)

        let rpd = MTLRenderPassDescriptor()
        if let msaa = target.msaaTargets?[uniformBufferIndex] {
            rpd.colorAttachments[0].texture        = msaa.color
            rpd.colorAttachments[0].resolveTexture = drawable.colorTextures[0]
            rpd.colorAttachments[0].storeAction    = .multisampleResolve
            rpd.depthAttachment.texture            = msaa.depth
            rpd.depthAttachment.resolveTexture     = drawable.depthTextures[0]
            rpd.depthAttachment.storeAction        = .multisampleResolve
        } else {
            rpd.colorAttachments[0].texture     = drawable.colorTextures[0]
            rpd.colorAttachments[0].storeAction = .store
            rpd.depthAttachment.texture         = drawable.depthTextures[0]
            rpd.depthAttachment.storeAction     = .store
        }
        rpd.colorAttachments[0].loadAction  = .clear
        rpd.colorAttachments[0].clearColor  = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 0)
        rpd.depthAttachment.loadAction      = .clear
        rpd.depthAttachment.clearDepth      = 0.0
        rpd.rasterizationRateMap            = drawable.rasterizationRateMaps.first
        if layerRenderer.configuration.layout == .layered {
            rpd.renderTargetArrayLength = drawable.views.count
        }

        guard let enc = cmdBuffer.makeRenderCommandEncoder(descriptor: rpd) else { return }
        enc.label = "VolumeEncoder"
        enc.setCullMode(.none)
        enc.setFrontFacing(.counterClockwise)
        enc.setRenderPipelineState(pipelineState)
        enc.setDepthStencilState(depthState)
        enc.setViewports(drawable.views.map { $0.textureMap.viewport })

        if drawable.views.count > 1 {
            let mappings = (0..<drawable.views.count).map {
                MTLVertexAmplificationViewMapping(viewportArrayIndexOffset: UInt32($0),
                                                  renderTargetArrayIndexOffset: UInt32($0))
            }
            enc.setVertexAmplificationCount(drawable.views.count, viewMappings: mappings)
        }

        // Vertex buffers
        enc.setVertexBuffer(dynamicUniformBuffer,
                            offset: uniformBufferOffset,
                            index: BufferIndex.uniforms.rawValue)
        enc.setVertexBuffer(target.viewProjectionBuffer,
                            offset: target.viewProjectionBufferOffset,
                            index: BufferIndex.viewProjection.rawValue)
        for (i, vb) in volumeProxyMesh.vertexBuffers.enumerated() {
            enc.setVertexBuffer(vb.buffer, offset: vb.offset, index: i + 2)
        }

        // Fragment buffers + volume texture
        enc.setFragmentBuffer(dynamicUniformBuffer,
                              offset: uniformBufferOffset,
                              index: BufferIndex.uniforms.rawValue)
        enc.setFragmentBuffer(target.viewProjectionBuffer,
                              offset: target.viewProjectionBufferOffset,
                              index: BufferIndex.viewProjection.rawValue)
        if let vt = volumeTexture {
            enc.setFragmentTexture(vt, index: TextureIndex.volume.rawValue)
        }

        for sub in volumeProxyMesh.submeshes {
            enc.drawIndexedPrimitives(type: sub.primitiveType,
                                       indexCount: sub.indexCount,
                                       indexType: sub.indexType,
                                       indexBuffer: sub.indexBuffer.buffer,
                                       indexBufferOffset: sub.indexBuffer.offset)
        }
        enc.endEncoding()
        drawable.encodePresent(commandBuffer: cmdBuffer)
    }

    // MARK: Static builders

    static func buildVertexDescriptor() -> MTLVertexDescriptor {
        let d = MTLVertexDescriptor()
        d.attributes[VertexAttribute.position.rawValue].format      = .float3
        d.attributes[VertexAttribute.position.rawValue].offset      = 0
        d.attributes[VertexAttribute.position.rawValue].bufferIndex = BufferIndex.meshPositions.rawValue
        d.attributes[VertexAttribute.texcoord.rawValue].format      = .float2
        d.attributes[VertexAttribute.texcoord.rawValue].offset      = 0
        d.attributes[VertexAttribute.texcoord.rawValue].bufferIndex = BufferIndex.meshGenerics.rawValue
        d.layouts[BufferIndex.meshPositions.rawValue].stride      = 12
        d.layouts[BufferIndex.meshPositions.rawValue].stepRate    = 1
        d.layouts[BufferIndex.meshPositions.rawValue].stepFunction = .perVertex
        d.layouts[BufferIndex.meshGenerics.rawValue].stride       = 8
        d.layouts[BufferIndex.meshGenerics.rawValue].stepRate     = 1
        d.layouts[BufferIndex.meshGenerics.rawValue].stepFunction = .perVertex
        return d
    }

    static func buildRenderPipeline(device: MTLDevice,
                                    layerRenderer: LayerRenderer,
                                    vtxDesc: MTLVertexDescriptor) throws -> MTLRenderPipelineState {
        let lib = device.makeDefaultLibrary()
        let pld = MTLRenderPipelineDescriptor()
        pld.label               = "VolumePipeline"
        pld.vertexFunction      = lib?.makeFunction(name: "volumeVertex")
        pld.fragmentFunction    = lib?.makeFunction(name: "volumeFragment")
        pld.vertexDescriptor    = vtxDesc
        pld.rasterSampleCount   = layerRenderer.device.supportsTextureSampleCount(4) ? 4 : 1
        pld.colorAttachments[0].pixelFormat           = layerRenderer.configuration.colorFormat
        pld.colorAttachments[0].isBlendingEnabled     = true
        pld.colorAttachments[0].rgbBlendOperation     = .add
        pld.colorAttachments[0].alphaBlendOperation   = .add
        pld.colorAttachments[0].sourceRGBBlendFactor  = .sourceAlpha
        pld.colorAttachments[0].destinationRGBBlendFactor  = .oneMinusSourceAlpha
        pld.colorAttachments[0].sourceAlphaBlendFactor     = .sourceAlpha
        pld.colorAttachments[0].destinationAlphaBlendFactor = .oneMinusSourceAlpha
        pld.depthAttachmentPixelFormat      = layerRenderer.configuration.depthFormat
        pld.maxVertexAmplificationCount     = layerRenderer.properties.viewCount
        return try device.makeRenderPipelineState(descriptor: pld)
    }

    static func buildDepthState(device: MTLDevice) -> MTLDepthStencilState {
        let d = MTLDepthStencilDescriptor()
        d.depthCompareFunction = .greater
        d.isDepthWriteEnabled  = false
        return device.makeDepthStencilState(descriptor: d)!
    }

    static func buildProxyMesh(device: MTLDevice,
                               vtxDesc: MTLVertexDescriptor) throws -> MTKMesh {
        let alloc = MTKMeshBufferAllocator(device: device)
        let mdl   = MDLMesh.newBox(withDimensions: SIMD3<Float>(1, 1, 1),
                                   segments:       SIMD3<UInt32>(1, 1, 1),
                                   geometryType:   .triangles,
                                   inwardNormals:  false,
                                   allocator:      alloc)
        let mdlVtx = MTKModelIOVertexDescriptorFromMetal(vtxDesc)
        guard let attrs = mdlVtx.attributes as? [MDLVertexAttribute] else {
            throw DICOMError.renderingFailed("Bad vertex descriptor")
        }
        attrs[VertexAttribute.position.rawValue].name = MDLVertexAttributePosition
        attrs[VertexAttribute.texcoord.rawValue].name = MDLVertexAttributeTextureCoordinate
        mdl.vertexDescriptor = mdlVtx
        return try MTKMesh(mesh: mdl, device: device)
    }
}

// MARK: - DrawableTarget

extension Renderer {
    final class DrawableTarget {
        var viewProjectionBuffer: MTLBuffer
        var viewProjectionBufferOffset = 0
        var viewProjectionArray: UnsafeMutablePointer<ViewProjectionArray>
        var msaaTargets: [(color: MTLTexture, depth: MTLTexture)]?

        init(drawable: LayerRenderer.Drawable, device: MTLDevice) {
            viewProjectionBuffer = device.makeBuffer(
                length: alignedViewProjectionSize * maxBuffersInFlight,
                options: .storageModeShared)!
            viewProjectionArray = UnsafeMutableRawPointer(viewProjectionBuffer.contents())
                .bindMemory(to: ViewProjectionArray.self, capacity: 1)

            if device.supportsTextureSampleCount(4) {
                func msaa(_ resolve: MTLTexture) -> MTLTexture {
                    let d = MTLTextureDescriptor.texture2DDescriptor(
                        pixelFormat: resolve.pixelFormat,
                        width: resolve.width, height: resolve.height, mipmapped: false)
                    d.usage = .renderTarget
                    d.textureType = .type2DMultisampleArray
                    d.sampleCount = 4
                    d.storageMode = .memoryless
                    d.arrayLength = resolve.arrayLength
                    return device.makeTexture(descriptor: d)!
                }
                msaaTargets = .init(
                    repeating: (msaa(drawable.colorTextures[0]), msaa(drawable.depthTextures[0])),
                    count: maxBuffersInFlight)
            }
        }

        func update(uniformBufferIndex: Int, drawable: LayerRenderer.Drawable) {
            viewProjectionBufferOffset = alignedViewProjectionSize * uniformBufferIndex
            viewProjectionArray = UnsafeMutableRawPointer(
                viewProjectionBuffer.contents() + viewProjectionBufferOffset)
                .bindMemory(to: ViewProjectionArray.self, capacity: 1)

            let deviceAnchor = drawable.deviceAnchor?.originFromAnchorTransform ?? matrix_identity_float4x4
            for i in 0..<min(drawable.views.count, 2) {
                let view       = drawable.views[i]
                let viewMatrix = (deviceAnchor * view.transform).inverse
                let proj       = drawable.computeProjection(viewIndex: i)
                if i == 0 {
                    viewProjectionArray[0].viewProjectionMatrix.0 = proj * viewMatrix
                    viewProjectionArray[0].eyePositionWorld.0     = viewMatrix.inverse.columns.3
                } else {
                    viewProjectionArray[0].viewProjectionMatrix.1 = proj * viewMatrix
                    viewProjectionArray[0].eyePositionWorld.1     = viewMatrix.inverse.columns.3
                }
            }
        }
    }
}

// MARK: - Matrix helpers

nonisolated func matrix4x4_rotation(radians: Float, axis: SIMD3<Float>) -> simd_float4x4 {
    let u = normalize(axis), ct = cosf(radians), st = sinf(radians), ci = 1 - ct
    return .init(columns: (
        SIMD4(ct + u.x*u.x*ci,    u.y*u.x*ci + u.z*st, u.z*u.x*ci - u.y*st, 0),
        SIMD4(u.x*u.y*ci - u.z*st, ct + u.y*u.y*ci,    u.z*u.y*ci + u.x*st, 0),
        SIMD4(u.x*u.z*ci + u.y*st, u.y*u.z*ci - u.x*st, ct + u.z*u.z*ci,   0),
        SIMD4<Float>(0, 0, 0, 1)
    ))
}

nonisolated func matrix4x4_translation(_ x: Float, _ y: Float, _ z: Float) -> simd_float4x4 {
    .init(columns: (SIMD4(1,0,0,0), SIMD4(0,1,0,0), SIMD4(0,0,1,0), SIMD4(x,y,z,1)))
}
