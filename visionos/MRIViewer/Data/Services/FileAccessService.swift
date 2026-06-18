import Foundation

/// Stub file picker. Real impl will use UIDocumentPickerViewController.
actor FileAccessService {
    func pickFile(allowedExtensions: [String]) async throws -> URL {
        // Phase 1 stub — returns a placeholder URL.
        // Real implementation: present document picker, await user selection.
        throw DICOMError.fileNotFound(URL(fileURLWithPath: "/stub"))
    }

    func pickFiles(allowedExtensions: [String]) async throws -> [URL] {
        throw DICOMError.fileNotFound(URL(fileURLWithPath: "/stub"))
    }
}
