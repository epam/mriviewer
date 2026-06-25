import Foundation

protocol DICOMRepositoryProtocol: Sendable {
    /// Load study metadata. URL may point to a DICOM, KTX, or NIfTI file/directory.
    func loadStudy(url: URL) async throws -> DICOMStudy

    /// Load full 3D volume for a series.
    func loadVolume(series: DICOMSeries) async throws -> VolumeData
}
