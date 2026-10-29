import Foundation

/// A typed DICOM tag — never use raw (group, element) tuples.
struct DICOMTag: Hashable, Sendable {
    let group: UInt16
    let element: UInt16

    var description: String { String(format: "(%04X,%04X)", group, element) }
}

extension DICOMTag {
    static let patientName        = DICOMTag(group: 0x0010, element: 0x0010)
    static let patientID          = DICOMTag(group: 0x0010, element: 0x0020)
    static let studyInstanceUID   = DICOMTag(group: 0x0020, element: 0x000D)
    static let seriesInstanceUID  = DICOMTag(group: 0x0020, element: 0x000E)
    static let studyDate          = DICOMTag(group: 0x0008, element: 0x0020)
    static let modality           = DICOMTag(group: 0x0008, element: 0x0060)
    static let rows               = DICOMTag(group: 0x0028, element: 0x0010)
    static let columns            = DICOMTag(group: 0x0028, element: 0x0011)
    static let numberOfFrames     = DICOMTag(group: 0x0028, element: 0x0008)
    static let pixelSpacing       = DICOMTag(group: 0x0028, element: 0x0030)
    static let sliceThickness     = DICOMTag(group: 0x0050, element: 0x0030)
    static let windowCenter       = DICOMTag(group: 0x0028, element: 0x1050)
    static let windowWidth        = DICOMTag(group: 0x0028, element: 0x1051)
    static let transferSyntaxUID  = DICOMTag(group: 0x0002, element: 0x0010)
    static let pixelData          = DICOMTag(group: 0x7FE0, element: 0x0010)
}
