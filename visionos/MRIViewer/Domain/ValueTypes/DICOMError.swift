import Foundation

enum DICOMError: Error, Sendable {
    case fileNotFound(URL)
    case invalidFormat(String)
    case unsupportedTransferSyntax(TransferSyntax)
    case renderingFailed(String)
    case cacheFailure(String)
    case unsupportedFormat(ExportFormat)
    case volumeDataUnavailable
}

extension DICOMError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .fileNotFound(let url):
            return "File not found: \(url.lastPathComponent)"
        case .invalidFormat(let detail):
            return "Invalid file format: \(detail)"
        case .unsupportedTransferSyntax(let syntax):
            return "Unsupported transfer syntax: \(syntax.rawValue)"
        case .renderingFailed(let detail):
            return "Rendering failed: \(detail)"
        case .cacheFailure(let detail):
            return "Cache error: \(detail)"
        case .unsupportedFormat(let format):
            return "Format not yet supported: \(format.rawValue)"
        case .volumeDataUnavailable:
            return "Volume data is not loaded"
        }
    }
}
