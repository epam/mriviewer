import ARKit
import CompositorServices
import Metal
import SwiftUI

// MARK: - Compositor Services ImmersiveSpace content

// TEST Review

struct VolumeImmersiveContent: CompositorContent {
    let renderState: VolumeRenderState

    var body: some CompositorContent {
        CompositorLayer(configuration: ImmersiveLayerConfig()) { @MainActor layerRenderer in
            Renderer.startRenderLoop(layerRenderer, renderState: renderState)
        }
    }
}

private struct ImmersiveLayerConfig: CompositorLayerConfiguration {
    func makeConfiguration(capabilities: LayerRenderer.Capabilities,
                            configuration: inout LayerRenderer.Configuration) {
        let foveation = capabilities.supportsFoveation
        configuration.isFoveationEnabled = foveation
        let opts: LayerRenderer.Capabilities.SupportedLayoutsOptions = foveation ? [.foveationEnabled] : []
        let layouts = capabilities.supportedLayouts(options: opts)
        configuration.layout = layouts.contains(.layered) ? .layered : .dedicated
    }
}

// MARK: - App entry point

@main
struct MRIViewerApp: App {

    // Shared render state — passed to both ViewModel and Renderer
    private let renderState = VolumeRenderState()

    // Services
    private let repository: any DICOMRepositoryProtocol = MockDICOMRepository()

    // ViewModels — created once, injected via init
    @State private var coordinator: AppCoordinator
    @State private var browserViewModel: StudyBrowserViewModel
    @State private var volumeViewModel: VolumeViewModel

    init() {
        let renderState  = VolumeRenderState()
        let repository: any DICOMRepositoryProtocol = MockDICOMRepository()

        guard let device = MTLCreateSystemDefaultDevice() else {
            fatalError("No Metal device")
        }

        let textureBuilder = VolumeTextureBuilder(device: device)

        let loadStudy   = LoadStudyUseCase(repository: repository)
        let loadVolume  = LoadVolumeUseCase(repository: repository)
        let applyWindow = ApplyWindowingUseCase()

        let coordinator = AppCoordinator()
        let browser     = StudyBrowserViewModel(loadStudyUseCase: loadStudy)
        let volume      = VolumeViewModel(
            loadVolumeUseCase: loadVolume,
            applyWindowingUseCase: applyWindow,
            textureBuilder: textureBuilder,
            renderState: renderState
        )

        self._coordinator     = State(initialValue: coordinator)
        self._browserViewModel = State(initialValue: browser)
        self._volumeViewModel  = State(initialValue: volume)
    }

    var body: some Scene {
        WindowGroup {
            StudyBrowserView(
                viewModel: browserViewModel,
                coordinator: coordinator,
                volumeViewModel: volumeViewModel
            )
        }

        ImmersiveSpace(id: "VolumeViewer") {
            VolumeImmersiveContent(renderState: renderState)
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
    }
}
