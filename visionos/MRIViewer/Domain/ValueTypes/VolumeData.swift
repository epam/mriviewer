import Foundation
import simd

/// Format-agnostic 3D voxel grid. All sources (DICOM, KTX, NIfTI) produce this type.
struct VolumeData: Sendable {
    struct Dimensions: Sendable {
        let x: Int
        let y: Int
        let z: Int

        var totalVoxels: Int { x * y * z }
    }

    struct VoxelSpacing: Sendable {
        let x: Float  // mm
        let y: Float  // mm
        let z: Float  // mm
    }

    let voxels: [UInt16]
    let dimensions: Dimensions
    let spacing: VoxelSpacing
    let windowCenter: Float
    let windowWidth: Float
    let sourceFormat: ExportFormat

    var normalizedWindowMin: Float { windowCenter - windowWidth / 2 }
    var normalizedWindowMax: Float { windowCenter + windowWidth / 2 }
}

extension VolumeData {
    static let windowPresets: [WindowingPreset] = [
        WindowingPreset(name: "Brain",     center: 40,   width: 80),
        WindowingPreset(name: "Lung",      center: -600, width: 1500),
        WindowingPreset(name: "Bone",      center: 400,  width: 1800),
        WindowingPreset(name: "Abdomen",   center: 60,   width: 400),
        WindowingPreset(name: "Full Range",center: 1024, width: 4096),
    ]
}
