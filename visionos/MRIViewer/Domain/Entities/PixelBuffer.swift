import Foundation

struct PixelBuffer: Sendable {
    let width: Int
    let height: Int
    let bitsPerPixel: Int
    let bytes: [UInt8]

    var bytesPerRow: Int { width * (bitsPerPixel / 8) }
}
