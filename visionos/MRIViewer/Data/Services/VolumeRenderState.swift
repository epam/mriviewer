import Metal
import os
import simd

/// Thread-safe bridge between VolumeViewModel (writer, MainActor) and Renderer (reader, render thread).
/// Uses a lock so the render loop can call snapshotSync() without async overhead.
final class VolumeRenderState: @unchecked Sendable {

    private let lock = OSAllocatedUnfairLock()

    private var _volumeTexture: MTLTexture?
    private var _windowMin: Float = 0.0
    private var _windowMax: Float = 0.5
    private var _anchorTransform: simd_float4x4 = matrix_identity_float4x4
    private var _volumeScale: SIMD3<Float> = SIMD3<Float>(0.3, 0.3, 0.3)

    func setVolume(_ texture: MTLTexture, windowMin: Float, windowMax: Float) {
        lock.withLock {
            _volumeTexture = texture
            _windowMin     = windowMin
            _windowMax     = windowMax
        }
    }

    func setWindowing(min: Float, max: Float) {
        lock.withLock {
            _windowMin = min
            _windowMax = max
        }
    }

    /// Called when user taps a detected horizontal plane to place the volume anchor.
    func setAnchor(_ transform: simd_float4x4) {
        lock.withLock { _anchorTransform = transform }
    }

    func setScale(_ scale: SIMD3<Float>) {
        lock.withLock { _volumeScale = scale }
    }

    /// Synchronous snapshot — safe to call from render loop without await.
    func snapshotSync() -> (texture: MTLTexture?, windowMin: Float, windowMax: Float,
                             anchor: simd_float4x4, scale: SIMD3<Float>) {
        lock.withLock {
            (_volumeTexture, _windowMin, _windowMax, _anchorTransform, _volumeScale)
        }
    }
}
