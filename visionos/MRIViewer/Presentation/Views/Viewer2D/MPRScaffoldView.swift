import SwiftUI

struct MPRScaffoldView: View {
    let study: StudyCardModel
    @Bindable var viewModel: MPRScaffoldViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 5) {
                    SectionEyebrow(text: "2D / Multi-planar")
                    Text("Slice review with reference planes")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 3) {
                    Text(study.patientName)
                        .font(.headline)
                    Text("\(study.modality) \(study.bodyRegion) · \(viewModel.windowPreset)")
                        .font(.caption)
                        .foregroundStyle(ScaffoldTheme.secondaryText)
                }
            }

            HStack(spacing: 14) {
                SliceViewport(
                    plane: .axial,
                    seed: study.thumbnailSeed,
                    position: $viewModel.axialPosition,
                    isPrimary: true
                )
                .layoutPriority(2)

                VStack(spacing: 14) {
                    SliceViewport(
                        plane: .sagittal,
                        seed: study.thumbnailSeed + 10,
                        position: $viewModel.sagittalPosition
                    )

                    SliceViewport(
                        plane: .coronal,
                        seed: study.thumbnailSeed + 20,
                        position: $viewModel.coronalPosition
                    )
                }
                .frame(minWidth: 300, idealWidth: 350, maxWidth: 390)
            }
            .padding(.bottom, 76)
        }
        .padding(22)
        .background(ScaffoldTheme.background.opacity(0.7))
    }
}

private struct SliceViewport: View {
    let plane: AnatomicalPlaneLabel
    let seed: Int
    @Binding var position: Double
    var isPrimary = false

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack {
                Text(plane.rawValue)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(ScaffoldTheme.accentBright)
                Spacer()
                Text("SLICE \(Int(position * 100) + 1)")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundStyle(Color.black.opacity(0.36))
            }

            ScanPlaceholderView(seed: seed, plane: plane, showsGrid: true)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .frame(minHeight: isPrimary ? 390 : 185)

            Slider(value: $position, in: 0...1)
                .tint(ScaffoldTheme.accent)
                .accessibilityLabel("\(plane.rawValue.capitalized) slice position")
        }
        .padding(13)
        .foregroundStyle(.black)
        .background(Color.white.opacity(0.93), in: RoundedRectangle(cornerRadius: 5, style: .continuous))
        .environment(\.colorScheme, .light)
    }
}
