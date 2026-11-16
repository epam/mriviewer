import Foundation

/// Top-level DICOM study. Patient name is always anonymized before storage.
struct DICOMStudy: Identifiable, Sendable {
    let id: String  // studyInstanceUID
    let date: Date
    let anonymizedPatientName: String
    let series: [DICOMSeries]
}
