import Foundation

actor PixelBufferCache: PixelCacheProtocol {
    private var storage: [String: PixelBuffer] = [:]
    private let maxEntries = 256

    nonisolated func store(_ buffer: PixelBuffer, forKey key: String) async {
        await _store(buffer, forKey: key)
    }

    nonisolated func retrieve(forKey key: String) async -> PixelBuffer? {
        await _retrieve(forKey: key)
    }

    nonisolated func evictAll() async {
        await _evictAll()
    }

    private func _store(_ buffer: PixelBuffer, forKey key: String) {
        if storage.count >= maxEntries {
            storage.removeValue(forKey: storage.keys.first!)
        }
        storage[key] = buffer
    }

    private func _retrieve(forKey key: String) -> PixelBuffer? {
        storage[key]
    }

    private func _evictAll() {
        storage.removeAll()
    }
}
