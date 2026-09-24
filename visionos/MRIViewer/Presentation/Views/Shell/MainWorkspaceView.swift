import SwiftUI

struct MainWorkspaceView: View {
    @Bindable var workspace: UIWorkspaceViewModel
    @Bindable var mpr: MPRScaffoldViewModel
    @Bindable var volume: VolumeScaffoldViewModel
    @Bindable var compare: CompareScaffoldViewModel
    @Bindable var settings: SettingsScaffoldViewModel

    var body: some View {
        VStack(spacing: 14) {
            header

            HStack(spacing: 14) {
                AppSidebarView(viewModel: workspace)

                ZStack(alignment: .bottom) {
                    workspaceContent
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    if workspace.selectedSection == .patients {
                        WorkspaceModePicker(
                            selection: workspace.selectedMode,
                            onSelect: workspace.selectMode
                        )
                        .padding(.bottom, 18)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
            }
        }
        .padding(18)
        .background {
            ZStack {
                ScaffoldTheme.background
                RadialGradient(
                    colors: [ScaffoldTheme.accent.opacity(0.10), .clear],
                    center: .topLeading,
                    startRadius: 20,
                    endRadius: 780
                )
            }
            .ignoresSafeArea()
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            BrandLockupView()
            Spacer()
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.green.opacity(0.9))
                    .frame(width: 7, height: 7)
                Text("UI PROTOTYPE")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .tracking(0.8)
                    .foregroundStyle(ScaffoldTheme.secondaryText)
            }
        }
        .padding(.horizontal, 18)
        .frame(height: 66)
        .scaffoldPanel(cornerRadius: 24)
    }

    @ViewBuilder
    private var workspaceContent: some View {
        if workspace.selectedSection == .patients {
            switch workspace.selectedMode {
            case .studies:
                StudyBrowserScaffoldView(viewModel: workspace)
            case .multiPlanar:
                MPRScaffoldView(study: workspace.selectedStudy, viewModel: mpr)
            case .volume:
                VolumeScaffoldView(study: workspace.selectedStudy, viewModel: volume)
            case .compare:
                CompareScaffoldView(studies: workspace.studies, viewModel: compare)
            }
        } else {
            SupportScaffoldView(section: workspace.selectedSection, settings: settings)
        }
    }
}

private struct AppSidebarView: View {
    @Bindable var viewModel: UIWorkspaceViewModel

    private var width: CGFloat { viewModel.isSidebarExpanded ? 212 : 78 }

    var body: some View {
        VStack(spacing: 8) {
            ForEach(AppSection.allCases) { section in
                SidebarButton(
                    section: section,
                    isSelected: viewModel.selectedSection == section,
                    isExpanded: viewModel.isSidebarExpanded
                ) {
                    viewModel.selectSection(section)
                }
            }

            Spacer()

            Button {
                withAnimation(.snappy(duration: 0.28)) {
                    viewModel.isSidebarExpanded.toggle()
                }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: viewModel.isSidebarExpanded ? "chevron.left" : "chevron.right")
                        .frame(width: 30)
                    if viewModel.isSidebarExpanded {
                        Text("Collapse")
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                    }
                }
                .foregroundStyle(ScaffoldTheme.secondaryText)
                .frame(maxWidth: .infinity, minHeight: 46)
                .padding(.horizontal, 10)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(viewModel.isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar")
        }
        .padding(12)
        .frame(width: width)
        .scaffoldPanel(cornerRadius: 26)
        .animation(.snappy(duration: 0.28), value: viewModel.isSidebarExpanded)
    }
}

private struct SidebarButton: View {
    let section: AppSection
    let isSelected: Bool
    let isExpanded: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: section.symbol)
                    .font(.system(size: 18, weight: .medium))
                    .frame(width: 30)

                if isExpanded {
                    Text(section.title)
                        .font(.system(size: 15, weight: .semibold))
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Spacer(minLength: 0)
                }
            }
            .foregroundStyle(isSelected ? Color.white : ScaffoldTheme.secondaryText)
            .frame(maxWidth: .infinity, minHeight: 48)
            .padding(.horizontal, 10)
            .background(
                isSelected ? ScaffoldTheme.accent.opacity(0.82) : Color.clear,
                in: RoundedRectangle(cornerRadius: 15, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(section.title)
    }
}

private struct WorkspaceModePicker: View {
    let selection: WorkspaceMode
    let onSelect: (WorkspaceMode) -> Void

    var body: some View {
        HStack(spacing: 6) {
            ForEach(WorkspaceMode.allCases) { mode in
                Button {
                    onSelect(mode)
                } label: {
                    Image(systemName: mode.symbol)
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(selection == mode ? Color.white : ScaffoldTheme.secondaryText)
                        .frame(width: 48, height: 42)
                        .background(
                            selection == mode ? ScaffoldTheme.accent : Color.clear,
                            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel(mode.title)
                .accessibilityAddTraits(selection == mode ? .isSelected : [])
            }
        }
        .padding(7)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 17, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.32), radius: 18, y: 8)
    }
}
