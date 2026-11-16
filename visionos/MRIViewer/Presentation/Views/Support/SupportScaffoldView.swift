import SwiftUI

struct SupportScaffoldView: View {
    let section: AppSection
    @Bindable var settings: SettingsScaffoldViewModel

    var body: some View {
        Group {
            switch section {
            case .patients:
                EmptyView()
            case .loadData:
                LoadDataScaffoldView()
            case .settings:
                SettingsScaffoldView(viewModel: settings)
            case .about:
                AboutScaffoldView()
            case .gestures:
                GestureSetupScaffoldView()
            case .tutorial:
                TutorialScaffoldView()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(ScaffoldTheme.background.opacity(0.7))
    }
}

private struct LoadDataScaffoldView: View {
    @State private var selectedSource = 0

    var body: some View {
        SupportPage(title: "Load imaging data", eyebrow: "Data source") {
            HStack(spacing: 16) {
                SourceCard(
                    symbol: "folder",
                    title: "Open local files",
                    message: "Choose a DICOM folder, NIfTI volume, or KTX file.",
                    isSelected: selectedSource == 0
                ) { selectedSource = 0 }

                SourceCard(
                    symbol: "externaldrive",
                    title: "Recent locations",
                    message: "Reconnect to a previously authorized folder.",
                    isSelected: selectedSource == 1
                ) { selectedSource = 1 }

                SourceCard(
                    symbol: "network",
                    title: "Clinical archive",
                    message: "PACS and DICOMweb are represented as UI only.",
                    isSelected: selectedSource == 2
                ) { selectedSource = 2 }
            }

            VStack(spacing: 14) {
                Image(systemName: "square.and.arrow.down.on.square")
                    .font(.system(size: 46, weight: .light))
                    .foregroundStyle(ScaffoldTheme.accentBright)
                Text("Drop a study here")
                    .font(.title2.bold())
                Text("This scaffold does not read files yet. The action below demonstrates the intended hierarchy.")
                    .foregroundStyle(ScaffoldTheme.secondaryText)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 520)
                Button("Choose data") {}
                    .buttonStyle(.borderedProminent)
                    .tint(ScaffoldTheme.accent)
            }
            .frame(maxWidth: .infinity, minHeight: 280)
            .scaffoldPanel()
        }
    }
}

private struct SourceCard: View {
    let symbol: String
    let title: String
    let message: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(ScaffoldTheme.accentBright)
                Text(title)
                    .font(.headline)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(ScaffoldTheme.secondaryText)
                    .multilineTextAlignment(.leading)
                Spacer()
            }
            .padding(18)
            .frame(maxWidth: .infinity, minHeight: 158, alignment: .topLeading)
            .background(
                isSelected ? ScaffoldTheme.accent.opacity(0.16) : Color.white.opacity(0.035),
                in: Rectangle()
            )
            .overlay {
                Rectangle()
                    .stroke(isSelected ? ScaffoldTheme.accentBright : ScaffoldTheme.border, lineWidth: 1)
            }
        }
        .buttonStyle(ScaffoldButtonStyle())
    }
}

private struct SettingsScaffoldView: View {
    @Bindable var viewModel: SettingsScaffoldViewModel

    var body: some View {
        SupportPage(title: "Viewer settings", eyebrow: "Preferences") {
            VStack(spacing: 0) {
                SettingsToggleRow(
                    title: "Orientation labels",
                    message: "Show anatomical orientation in every viewport.",
                    isOn: $viewModel.showOrientationLabels
                )
                Divider().overlay(ScaffoldTheme.border)
                SettingsToggleRow(
                    title: "Synchronize planes",
                    message: "Keep axial, sagittal, and coronal reference positions linked.",
                    isOn: $viewModel.synchronizePlanes
                )
                Divider().overlay(ScaffoldTheme.border)
                SettingsToggleRow(
                    title: "Gesture hints",
                    message: "Show interaction guidance in the volume scaffold.",
                    isOn: $viewModel.showGestureHints
                )
            }
            .scaffoldPanel()

            HStack(spacing: 16) {
                SettingPickerCard(
                    title: "Default window preset",
                    selection: $viewModel.defaultWindowPreset,
                    values: ["T1", "T2 FLAIR", "Brain", "Bone"]
                )
                SettingPickerCard(
                    title: "Appearance",
                    selection: $viewModel.appearance,
                    values: ["System", "Dark", "High Contrast"]
                )
            }
        }
    }
}

private struct SettingsToggleRow: View {
    let title: String
    let message: String
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(ScaffoldTheme.secondaryText)
            }
            Spacer()
            Toggle(title, isOn: $isOn)
                .labelsHidden()
        }
        .padding(18)
    }
}

private struct SettingPickerCard: View {
    let title: String
    @Binding var selection: String
    let values: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            Picker(title, selection: $selection) {
                ForEach(values, id: \.self) { Text($0).tag($0) }
            }
            .pickerStyle(.menu)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .scaffoldPanel()
    }
}

private struct AboutScaffoldView: View {
    var body: some View {
        SupportPage(title: "Clinical imaging in space", eyebrow: "About MRI Viewer") {
            HStack(spacing: 24) {
                BrandLockupView()
                    .padding(26)
                    .scaffoldPanel(raised: true)

                VStack(alignment: .leading, spacing: 12) {
                    Text("MRI Viewer is a visionOS interface concept for reviewing volumetric medical imaging as a set of focused, floating instruments.")
                        .font(.title3.weight(.medium))
                    Text("This build contains deterministic dummy data and UI-only scan placeholders. It is not connected to clinical systems and is not for diagnostic use.")
                        .foregroundStyle(ScaffoldTheme.secondaryText)
                }
            }

            HStack(spacing: 16) {
                AboutMetric(value: "2D", label: "Multi-planar scaffold")
                AboutMetric(value: "3D", label: "Controls scaffold")
                AboutMetric(value: "2×", label: "Comparison workspace")
            }
        }
    }
}

private struct AboutMetric: View {
    let value: String
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(value)
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(ScaffoldTheme.accentBright)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(ScaffoldTheme.secondaryText)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .scaffoldPanel()
    }
}

private struct GestureSetupScaffoldView: View {
    var body: some View {
        SupportPage(title: "Use natural spatial gestures", eyebrow: "Setup gestures") {
            HStack(spacing: 16) {
                GestureCard(number: "01", symbol: "eye", title: "Look", message: "Direct your gaze to a control to bring it into focus.")
                GestureCard(number: "02", symbol: "hand.pinch", title: "Pinch", message: "Tap thumb and finger together to select the focused control.")
                GestureCard(number: "03", symbol: "rotate.3d", title: "Manipulate", message: "Pinch and drag to rotate; use two hands to scale.")
            }

            HStack {
                Label("Gesture recognition is represented by UI only in this scaffold.", systemImage: "info.circle")
                    .foregroundStyle(ScaffoldTheme.secondaryText)
                Spacer()
                Button("Practice selection") {}
                    .buttonStyle(.borderedProminent)
                    .tint(ScaffoldTheme.accent)
            }
            .padding(18)
            .scaffoldPanel()
        }
    }
}

private struct GestureCard: View {
    let number: String
    let symbol: String
    let title: String
    let message: String

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(number)
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundStyle(ScaffoldTheme.accentBright)
                Spacer()
                Image(systemName: symbol)
                    .font(.system(size: 28, weight: .light))
                    .foregroundStyle(ScaffoldTheme.accentBright)
            }
            Text(title).font(.title2.bold())
            Text(message)
                .font(.subheadline)
                .foregroundStyle(ScaffoldTheme.secondaryText)
            Spacer()
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 210, alignment: .topLeading)
        .scaffoldPanel()
    }
}

private struct TutorialScaffoldView: View {
    @State private var currentStep = 0

    private let steps = [
        ("Choose a study", "Use search or status filters to find the patient study you want to review."),
        ("Review three planes", "Open the 2D workspace and adjust axial, sagittal, and coronal positions."),
        ("Explore volume controls", "Switch to the 3D scaffold to preview render modes and gesture guidance."),
        ("Compare over time", "Place baseline and follow-up studies side by side with linked positions."),
    ]

    var body: some View {
        SupportPage(title: "Learn the review workflow", eyebrow: "Tutorial") {
            HStack(spacing: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(steps.indices, id: \.self) { index in
                        Button {
                            currentStep = index
                        } label: {
                            HStack(spacing: 12) {
                                Text("\(index + 1)")
                                    .font(.caption.bold())
                                    .frame(width: 30, height: 30)
                                    .background(
                                        currentStep == index ? ScaffoldTheme.accent : Color.white.opacity(0.06),
                                        in: Circle()
                                    )
                                Text(steps[index].0)
                                    .font(.headline)
                                Spacer()
                            }
                            .padding(12)
                            .background(
                                currentStep == index ? ScaffoldTheme.accent.opacity(0.12) : Color.clear,
                                in: Rectangle()
                            )
                        }
                        .buttonStyle(ScaffoldButtonStyle())
                    }
                }
                .frame(width: 300)

                VStack(spacing: 18) {
                    Image(systemName: ["person.text.rectangle", "square.grid.2x2", "cube.transparent", "rectangle.split.2x1"][currentStep])
                        .font(.system(size: 68, weight: .ultraLight))
                        .foregroundStyle(ScaffoldTheme.accentBright)
                    Text(steps[currentStep].0)
                        .font(.title.bold())
                    Text(steps[currentStep].1)
                        .font(.title3)
                        .foregroundStyle(ScaffoldTheme.secondaryText)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 520)
                    HStack {
                        Button("Back") { currentStep = max(0, currentStep - 1) }
                            .disabled(currentStep == 0)
                        Button(currentStep == steps.count - 1 ? "Finish" : "Next") {
                            currentStep = min(steps.count - 1, currentStep + 1)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(ScaffoldTheme.accent)
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 360)
                .scaffoldPanel()
            }
        }
    }
}

private struct SupportPage<Content: View>: View {
    let title: String
    let eyebrow: String
    @ViewBuilder let content: Content

    init(title: String, eyebrow: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.eyebrow = eyebrow
        self.content = content()
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 5) {
                    SectionEyebrow(text: eyebrow)
                    Text(title)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                }
                content
            }
            .padding(26)
        }
    }
}
