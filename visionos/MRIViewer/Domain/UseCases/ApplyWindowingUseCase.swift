import Foundation

protocol ApplyWindowingUseCaseProtocol: Sendable {
    func execute(volume: VolumeData, preset: WindowingPreset) -> VolumeData
}

struct ApplyWindowingUseCase: ApplyWindowingUseCaseProtocol {
    func execute(volume: VolumeData, preset: WindowingPreset) -> VolumeData {
        VolumeData(
            voxels: volume.voxels,
            dimensions: volume.dimensions,
            spacing: volume.spacing,
            windowCenter: preset.center,
            windowWidth: preset.width,
            sourceFormat: volume.sourceFormat
        )
    }
}
