import SwiftUI

struct CompareScaffoldView: View {
    let studies: [StudyCardModel]
    @Bindable var viewModel: CompareScaffoldViewModel

    private var baseline: StudyCardModel { studies[1] }
    private var followUp: StudyCardModel { studies[0] }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 5) {
                    SectionEyebrow(text: "Compare")
                    Text("Track change across studies")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                }

                Spacer()

                Toggle("Link positions", isOn: $viewModel.isLinked)
                    .toggleStyle(.switch)
                    .font(.caption.weight(.semibold))
                    .frame(width: 170)
            }

            HStack(spacing: 14) {
                ComparisonViewport(
                    label: "BASELINE — JAN 2026",
                    study: baseline,
                    position: Binding(
                        get: { viewModel.baselinePosition },
                        set: viewModel.updateBaseline
                    )
                )

                ComparisonViewport(
                    label: "FOLLOW-UP — JUL 2026",
                    study: followUp,
                    position: Binding(
                        get: { viewModel.followUpPosition },
                        set: viewModel.updateFollowUp
                    )
                )
            }
            .padding(.bottom, 76)
        }
        .padding(22)
        .background(ScaffoldTheme.background.opacity(0.7))
    }
}

private struct ComparisonViewport: View {
    let label: String
    let study: StudyCardModel
    @Binding var position: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack {
                Text(label)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(ScaffoldTheme.accent)
                Spacer()
                Text(study.patientName)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.black.opacity(0.48))
            }

            ScanPlaceholderView(
                seed: study.thumbnailSeed,
                plane: .axial,
                showsGrid: false
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .frame(minHeight: 430)

            Slider(value: $position, in: 0...1)
                .tint(ScaffoldTheme.accent)

            HStack {
                Text("SLICE \(Int(position * 100) + 1)")
                Spacer()
                Text("\(study.modality) · \(study.bodyRegion)")
            }
            .font(.system(size: 9, weight: .medium, design: .monospaced))
            .foregroundStyle(Color.black.opacity(0.4))
        }
        .padding(14)
        .background(Color.white.opacity(0.93), in: Rectangle())
        .environment(\.colorScheme, .light)
    }
}
