import Foundation

enum ExportFormat: String, Sendable, CaseIterable {
    case dicom = "DICOM"
    case ktx   = "KTX"
    case nifti = "NIfTI"

    var fileExtensions: [String] {
        switch self {
        case .dicom: return ["dcm", "dicom", "ima"]
        case .ktx:   return ["ktx", "ktx2"]
        case .nifti: return ["nii", "nii.gz"]
        }
    }

    static func detect(from url: URL) -> ExportFormat? {
        let ext = url.pathExtension.lowercased()
        return allCases.first { $0.fileExtensions.contains(ext) }
    }
}
