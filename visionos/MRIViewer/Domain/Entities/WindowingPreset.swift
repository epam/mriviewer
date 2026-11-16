import Foundation

/// HU-based windowing preset for display optimization.
struct WindowingPreset: Identifiable, Hashable, Sendable {
    let id: UUID
    let name: String
    let center: Float  // HU
    let width: Float   // HU

    init(name: String, center: Float, width: Float) {
        self.id = UUID()
        self.name = name
        self.center = center
        self.width = width
    }
}
