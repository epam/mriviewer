import Foundation

/// Fully in-memory repository. Returns synthetic data so UI/rendering can be developed
/// before DicomCore.xcframework is wired in.
struct MockDICOMRepository: DICOMRepositoryProtocol {
    func loadStudy(url: URL) async throws -> DICOMStudy {
        // Simulate load latency
        try await Task.sleep(nanoseconds: 500_000_000)

        let dicomSeries = DICOMSeries(
            id: "1.2.3.4.5.6.7.8.1",
            modality: "MR",
            format: .dicom,
            slices: makeMockSlices(count: 64, seriesID: "dicom")
        )
        let ktxSeries = DICOMSeries(
            id: "1.2.3.4.5.6.7.8.2",
            modality: "CT",
            format: .ktx,
            slices: makeMockSlices(count: 64, seriesID: "ktx")
        )
        let niftiSeries = DICOMSeries(
            id: "1.2.3.4.5.6.7.8.3",
            modality: "MR",
            format: .nifti,
            slices: makeMockSlices(count: 64, seriesID: "nifti")
        )

        return DICOMStudy(
            id: "1.2.3.4.5.6.7.8",
            date: Date(),
            anonymizedPatientName: "ANON^001",
            series: [dicomSeries, ktxSeries, niftiSeries]
        )
    }

    func loadVolume(series: DICOMSeries) async throws -> VolumeData {
        try await Task.sleep(nanoseconds: 300_000_000)
        return makeSpherePhantomt(format: series.format)
    }

    // MARK: - Private

    private func makeMockSlices(count: Int, seriesID: String) -> [DICOMSlice] {
        (0..<count).map { i in
            DICOMSlice(
                id: "\(seriesID)-slice-\(i)",
                sliceIndex: i,
                imagePosition: SIMD3<Float>(0, 0, Float(i) * 3.0),
                pixelBufferKey: "\(seriesID)-\(i)"
            )
        }
    }

    /// Generates a 128×128×128 sphere phantom with HU-like UInt16 values.
    private func makeSpherePhantomt(format: ExportFormat) -> VolumeData {
        let size = 128
        let center = Float(size) / 2
        let outerRadius: Float = 54
        let innerRadius: Float = 30

        var voxels = [UInt16](repeating: 0, count: size * size * size)

        for z in 0..<size {
            for y in 0..<size {
                for x in 0..<size {
                    let dx = Float(x) - center
                    let dy = Float(y) - center
                    let dz = Float(z) - center
                    let dist = (dx * dx + dy * dy + dz * dz).squareRoot()

                    let value: UInt16
                    if dist < innerRadius {
                        // Soft tissue core ~40 HU → mapped to mid-range UInt16
                        value = UInt16.random(in: 1060...1090)
                    } else if dist < outerRadius {
                        // Shell ~400 HU → bone-like
                        value = UInt16.random(in: 1400...1500)
                    } else {
                        value = 0
                    }
                    voxels[z * size * size + y * size + x] = value
                }
            }
        }

        return VolumeData(
            voxels: voxels,
            dimensions: .init(x: size, y: size, z: size),
            spacing: .init(x: 1.0, y: 1.0, z: 1.0),
            windowCenter: 40,
            windowWidth: 400,
            sourceFormat: format
        )
    }
}
