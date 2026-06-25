import Foundation

enum TransferSyntax: String, Sendable {
    case implicitVRLittleEndian     = "1.2.840.10008.1.2"
    case explicitVRLittleEndian     = "1.2.840.10008.1.2.1"
    case explicitVRBigEndian        = "1.2.840.10008.1.2.2"
    case jpegBaseline               = "1.2.840.10008.1.2.4.50"
    case jpegLossless               = "1.2.840.10008.1.2.4.70"
    case jpeg2000Lossless           = "1.2.840.10008.1.2.4.90"
    case jpeg2000                   = "1.2.840.10008.1.2.4.91"
    case rleEncoding                = "1.2.840.10008.1.2.5"

    var isCompressed: Bool {
        switch self {
        case .implicitVRLittleEndian, .explicitVRLittleEndian, .explicitVRBigEndian:
            return false
        default:
            return true
        }
    }
}
