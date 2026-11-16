import Foundation
import Metal

@MainActor
@Observable
final class VolumeViewModel {
    private(set) var isLoading = false
    private(set) var isVolumeLoaded = false
    private(set) var error: DICOMError?
    var currentPreset: WindowingPreset = VolumeData.windowPresets[0]

    private let loadVolumeUseCase: any LoadVolumeUseCaseProtocol
    private let applyWindowingUseCase: any ApplyWindowingUseCaseProtocol
    private let textureBuilder: VolumeTextureBuilder
    private let renderState: VolumeRenderState

    private var currentVolume: VolumeData?

    init(
        loadVolumeUseCase: any LoadVolumeUseCaseProtocol,
        applyWindowingUseCase: any ApplyWindowingUseCaseProtocol,
        textureBuilder: VolumeTextureBuilder,
        renderState: VolumeRenderState
    ) {
        self.loadVolumeUseCase    = loadVolumeUseCase
        self.applyWindowingUseCase = applyWindowingUseCase
        self.textureBuilder        = textureBuilder
        self.renderState           = renderState
    }

    func loadVolume(series: DICOMSeries) async {
        isLoading = true
        error = nil
        do {
            let volume = try await loadVolumeUseCase.execute(series: series)
            currentVolume = volume
            try await pushToRenderer(volume: volume, preset: currentPreset)
            isVolumeLoaded = true
        } catch let e as DICOMError {
            error = e
        } catch {
            self.error = .renderingFailed(error.localizedDescription)
        }
        isLoading = false
    }

    func applyPreset(_ preset: WindowingPreset) async {
        guard let volume = currentVolume else { return }
        currentPreset = preset
        let windowed = applyWindowingUseCase.execute(volume: volume, preset: preset)
        currentVolume = windowed
        do {
            try await pushToRenderer(volume: windowed, preset: preset)
        } catch let e as DICOMError {
            error = e
        } catch {
            self.error = .renderingFailed(error.localizedDescription)
        }
    }

    func placeVolumeAt(transform: simd_float4x4) {
        renderState.setAnchor(transform)
    }

    func clearError() { error = nil }

    // MARK: - Private

    private func pushToRenderer(volume: VolumeData, preset: WindowingPreset) async throws {
        let texture = try await textureBuilder.buildTexture(from: volume)
        // Normalize HU window to [0,1] for the shader
        let range: Float = 65535
        let wMin = (preset.center - preset.width / 2 + 1024) / 4096
        let wMax = (preset.center + preset.width / 2 + 1024) / 4096
        renderState.setVolume(texture,
                               windowMin: max(0, wMin / (range / 4096)),
                               windowMax: min(1, wMax / (range / 4096)))
    }
}
