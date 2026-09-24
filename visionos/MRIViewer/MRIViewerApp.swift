import SwiftUI

@main
struct MRIViewerApp: App {
    @State private var workspace = UIWorkspaceViewModel()
    @State private var mpr = MPRScaffoldViewModel()
    @State private var volume = VolumeScaffoldViewModel()
    @State private var compare = CompareScaffoldViewModel()
    @State private var settings = SettingsScaffoldViewModel()

    var body: some Scene {
        WindowGroup {
            MainWorkspaceView(
                workspace: workspace,
                mpr: mpr,
                volume: volume,
                compare: compare,
                settings: settings
            )
            .frame(minWidth: 980, minHeight: 680)
        }
        .windowStyle(.plain)
        .defaultSize(width: 1360, height: 860)
    }
}
