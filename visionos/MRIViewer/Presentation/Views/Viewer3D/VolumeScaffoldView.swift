import SwiftUI

struct VolumeScaffoldView: View {
    let study: StudyCardModel
    @Bindable var viewModel: VolumeScaffoldViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 5) {
                    SectionEyebrow(text: "3D Volume")
                    Text("Manipulate the reconstruction in space")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                }
                Spacer()
                Text("UI scaffold · renderer not connected")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ScaffoldTheme.secondaryText)
            }

            HStack(alignment: .top, spacing: 14) {
                volumeViewport
                    .layoutPriority(2)

                VStack(spacing: 14) {
                    renderModePanel
                    gesturePanel
                    transformPanel
                    Spacer()
                }
                .frame(minWidth: 300, idealWidth: 350, maxWidth: 390)
            }
            .padding(.bottom, 76)
        }
        .padding(22)
        .background(ScaffoldTheme.background.opacity(0.7))
    }

    private var volumeViewport: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.015, green: 0.035, blue: 0.055),
                    Color(red: 0.03, green: 0.08, blue: 0.12),
                    Color(red: 0.012, green: 0.02, blue: 0.032),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            RadialGradient(
                colors: [ScaffoldTheme.accent.opacity(0.34), .clear],
                center: .center,
                startRadius: 12,
                endRadius: 260
            )

            VStack(spacing: 17) {
                Image(systemName: "cube.transparent")
                    .font(.system(size: 100, weight: .ultraLight))
                    .foregroundStyle(.white.opacity(0.68), ScaffoldTheme.accentBright.opacity(0.56))
                    .rotationEffect(.degrees(viewModel.rotation))
                    .scaleEffect(viewModel.scale)
                Text("3D VOLUME PLACEHOLDER")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(.white.opacity(0.42))
                Text("\(study.patientName) · \(study.bodyRegion)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.35))
            }

            CalloutLabel(text: "Pinch + drag to rotate")
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(20)

            CalloutLabel(text: "Two-hand pinch to scale")
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .padding(20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .frame(minHeight: 520)
        .overlay {
            Rectangle()
                .stroke(Color.white.opacity(0.82), lineWidth: 10)
        }
        .clipShape(Rectangle())
    }

    private var renderModePanel: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RENDER MODE")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(ScaffoldTheme.accent)

            HStack(spacing: 6) {
                ForEach(DummyRenderMode.allCases) { mode in
                    Button {
                        viewModel.renderMode = mode
                    } label: {
                        Text(mode.rawValue)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(viewModel.renderMode == mode ? Color.white : Color.black.opacity(0.68))
                        .frame(maxWidth: .infinity, minHeight: 38)
                        .background(
                            viewModel.renderMode == mode ? ScaffoldTheme.accent : Color.black.opacity(0.04),
                            in: Rectangle()
                        )
                    }
                    .buttonStyle(ScaffoldButtonStyle())
                    .accessibilityAddTraits(viewModel.renderMode == mode ? .isSelected : [])
                }
            }
        }
        .lightControlPanel()
    }

    private var gesturePanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("GAZE + PINCH")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.black.opacity(0.42))
            Text("Look at a control and pinch to select it — no controller required.")
                .font(.subheadline)
                .foregroundStyle(Color.black.opacity(0.62))
        }
        .lightControlPanel()
    }

    private var transformPanel: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack {
                Text("SCAFFOLD CONTROLS")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(ScaffoldTheme.accent)
                Spacer()
                Button("Reset") {
                    viewModel.scale = 1
                    viewModel.rotation = 0
                }
                .font(.caption.weight(.semibold))
            }

            LabeledContent("Scale") {
                Slider(value: $viewModel.scale, in: 0.75...1.25)
                    .frame(width: 150)
            }
            LabeledContent("Rotation") {
                Slider(value: $viewModel.rotation, in: -25...25)
                    .frame(width: 150)
            }
        }
        .font(.caption)
        .lightControlPanel()
    }
}

private struct CalloutLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption.weight(.medium))
            .foregroundStyle(.white.opacity(0.78))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.black.opacity(0.32), in: Rectangle())
            .overlay {
                Rectangle()
                    .stroke(Color.white.opacity(0.28), lineWidth: 1)
            }
    }
}

private extension View {
    func lightControlPanel() -> some View {
        self
            .padding(15)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.93), in: Rectangle())
            .environment(\.colorScheme, .light)
    }
}
