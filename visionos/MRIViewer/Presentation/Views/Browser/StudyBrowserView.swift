import SwiftUI

struct StudyBrowserView: View {
    @Bindable var viewModel: StudyBrowserViewModel
    @Bindable var coordinator: AppCoordinator
    var volumeViewModel: VolumeViewModel

    @Environment(\.openImmersiveSpace)    private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    LoadingView(message: "Loading study…")
                } else if let error = viewModel.error {
                    ErrorView(error: error) {
                        viewModel.clearError()
                        Task { await viewModel.loadMockStudy() }
                    }
                } else if viewModel.studies.isEmpty {
                    emptyState
                } else {
                    studyList
                }
            }
            .navigationTitle("MRI Viewer")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Load Sample") {
                        Task { await viewModel.loadMockStudy() }
                    }
                }
            }
        }
        .task {
            coordinator.configure(open: openImmersiveSpace, dismiss: dismissImmersiveSpace)
            await viewModel.loadMockStudy()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "square.stack.3d.up.slash")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)
            Text("No studies loaded")
                .font(.title2)
        }
    }

    private var studyList: some View {
        List {
            ForEach(viewModel.studies) { study in
                Section {
                    ForEach(study.series) { series in
                        StudyListItemView(series: series)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                Task {
                                    await volumeViewModel.loadVolume(series: series)
                                    await coordinator.openVolumeViewer(series: series)
                                }
                            }
                    }
                } header: {
                    Text(study.anonymizedPatientName)
                        .font(.subheadline.bold())
                }
            }
        }
    }
}
