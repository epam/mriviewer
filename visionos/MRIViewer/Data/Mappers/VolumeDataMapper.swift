import Foundation

/// Format-specific VolumeData converters. All are stubs — real parsing comes via DicomCore.xcframework.
struct VolumeDataMapper {
    /// DICOM → VolumeData. Phase 1: delegate to MockDICOMRepository phantom.
    static func mapFromDICOM(data: Data) throws -> VolumeData {
        throw DICOMError.unsupportedFormat(.dicom)
    }

    /// KTX → VolumeData. KTX2 is a GPU-native container — will parse header then decompress.
    static func mapFromKTX(data: Data) throws -> VolumeData {
        throw DICOMError.unsupportedFormat(.ktx)
    }

    /// NIfTI-1/2 → VolumeData. Parse 348-byte header, then voxel slab.
    static func mapFromNIfTI(data: Data) throws -> VolumeData {
        throw DICOMError.unsupportedFormat(.nifti)
    }
}
