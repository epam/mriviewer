import SwiftUI

struct StudyListItemView: View {
    let series: DICOMSeries

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: modalityIcon)
                .font(.title2)
                .foregroundStyle(.secondary)
                .frame(width: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(series.modality)
                    .font(.headline)
                Text("\(series.sliceCount) slices")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            FormatBadge(format: series.format)
        }
        .padding(.vertical, 8)
    }

    private var modalityIcon: String {
        switch series.modality {
        case "MR": return "waveform.path.ecg"
        case "CT": return "cube.transparent"
        default:   return "doc.richtext"
        }
    }
}

private struct FormatBadge: View {
    let format: ExportFormat

    var body: some View {
        Text(format.rawValue)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(badgeColor.opacity(0.2))
            .foregroundStyle(badgeColor)
            .clipShape(Capsule())
    }

    private var badgeColor: Color {
        switch format {
        case .dicom: return .blue
        case .ktx:   return .green
        case .nifti: return .orange
        }
    }
}
