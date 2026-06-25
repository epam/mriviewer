import Foundation
import simd

struct DICOMSlice: Identifiable, Sendable {
    let id: String
    let sliceIndex: Int
    let imagePosition: SIMD3<Float>  // mm, patient coordinate system
    let pixelBufferKey: String       // cache key for PixelBuffer lookup
}
