import Foundation

protocol LoadStudyUseCaseProtocol: Sendable {
    func execute(url: URL) async throws -> DICOMStudy
}

struct LoadStudyUseCase: LoadStudyUseCaseProtocol {
    private let repository: any DICOMRepositoryProtocol

    init(repository: any DICOMRepositoryProtocol) {
        self.repository = repository
    }

    func execute(url: URL) async throws -> DICOMStudy {
        try await repository.loadStudy(url: url)
    }
}
