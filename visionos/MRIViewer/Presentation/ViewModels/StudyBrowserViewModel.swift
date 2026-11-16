import Foundation

@MainActor
@Observable
final class StudyBrowserViewModel {
    private(set) var studies: [DICOMStudy] = []
    private(set) var isLoading = false
    private(set) var error: DICOMError?

    private let loadStudyUseCase: any LoadStudyUseCaseProtocol

    init(loadStudyUseCase: any LoadStudyUseCaseProtocol) {
        self.loadStudyUseCase = loadStudyUseCase
    }

    func loadStudy(url: URL) async {
        isLoading = true
        error = nil
        do {
            let study = try await loadStudyUseCase.execute(url: url)
            studies.append(study)
        } catch let dicomeError as DICOMError {
            error = dicomeError
        } catch {
            self.error = .invalidFormat(error.localizedDescription)
        }
        isLoading = false
    }

    func loadMockStudy() async {
        // Synthetic URL — MockDICOMRepository ignores it.
        await loadStudy(url: URL(fileURLWithPath: "/mock/study.dcm"))
    }

    func clearError() {
        error = nil
    }
}
