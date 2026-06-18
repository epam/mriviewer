import Foundation

protocol PixelCacheProtocol: Sendable {
    func store(_ buffer: PixelBuffer, forKey key: String) async
    func retrieve(forKey key: String) async -> PixelBuffer?
    func evictAll() async
}
