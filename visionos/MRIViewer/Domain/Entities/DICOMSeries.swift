import Foundation

struct DICOMSeries: Identifiable, Sendable {
    let id: String  // seriesInstanceUID
    let modality: String
    let format: ExportFormat
    let slices: [DICOMSlice]

    var sliceCount: Int { slices.count }
}
