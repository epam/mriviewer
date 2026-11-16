import Foundation
import Metal

/// Converts VolumeData into a GPU-resident MTLTexture3D.
/// The actual rendering loop lives in Renderer.swift (Compositor Services).
actor VolumeTextureBuilder {

    private let device: MTLDevice

    init(device: MTLDevice) {
        self.device = device
    }

    /// Uploads voxel data into a 3D texture sampled as r16Unorm (0..65535 → 0.0..1.0).
    func buildTexture(from volume: VolumeData) throws -> MTLTexture {
        let desc = MTLTextureDescriptor()
        desc.textureType  = .type3D
        desc.pixelFormat  = .r16Unorm
        desc.width        = volume.dimensions.x
        desc.height       = volume.dimensions.y
        desc.depth        = volume.dimensions.z
        desc.usage        = .shaderRead
        desc.storageMode  = .shared

        guard let texture = device.makeTexture(descriptor: desc) else {
            throw DICOMError.renderingFailed("Failed to allocate 3D volume texture (\(volume.dimensions.x)×\(volume.dimensions.y)×\(volume.dimensions.z))")
        }

        let bytesPerRow   = volume.dimensions.x * MemoryLayout<UInt16>.stride
        let bytesPerImage = bytesPerRow * volume.dimensions.y

        volume.voxels.withUnsafeBytes { ptr in
            texture.replace(
                region: MTLRegion(
                    origin: MTLOriginMake(0, 0, 0),
                    size: MTLSizeMake(volume.dimensions.x, volume.dimensions.y, volume.dimensions.z)
                ),
                mipmapLevel: 0,
                slice: 0,
                withBytes: ptr.baseAddress!,
                bytesPerRow: bytesPerRow,
                bytesPerImage: bytesPerImage
            )
        }
        return texture
    }
}
