import SwiftUI

/// 2D slice browser — horizontal scroll through axial slices.
/// Phase 1 stub: shows slice index only; real pixel rendering in later phase.
struct SliceScrollView: View {
    let series: DICOMSeries
    @State private var selectedIndex = 0

    var body: some View {
        VStack(spacing: 12) {
            Text("Slice \(selectedIndex + 1) / \(series.sliceCount)")
                .font(.caption)
                .foregroundStyle(.secondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(0..<series.sliceCount, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(i == selectedIndex ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 48, height: 48)
                            .overlay(Text("\(i + 1)").font(.caption2))
                            .onTapGesture { selectedIndex = i }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}
