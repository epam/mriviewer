import Foundation

protocol LoadVolumeUseCaseProtocol: Sendable {
    func execute(series: DICOMSeries) async throws -> VolumeData
}

struct LoadVolumeUseCase: LoadVolumeUseCaseProtocol {
    private let repository: any DICOMRepositoryProtocol

    init(repository: any DICOMRepositoryProtocol) {
        self.repository = repository
    }

    func execute(series: DICOMSeries) async throws -> VolumeData {
        try await repository.loadVolume(series: series)
    }
}
