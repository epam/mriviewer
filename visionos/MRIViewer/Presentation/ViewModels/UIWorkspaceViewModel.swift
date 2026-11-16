import Foundation

enum AppSection: String, CaseIterable, Identifiable {
    case patients
    case loadData
    case settings
    case about
    case gestures
    case tutorial

    var id: Self { self }

    var title: String {
        switch self {
        case .patients: "Create Patient"
        case .loadData: "Load Data"
        case .settings: "Settings"
        case .about: "About"
        case .gestures: "Setup Gestures"
        case .tutorial: "Tutorial"
        }
    }

    var compactTitle: String {
        switch self {
        case .patients: "Patients"
        case .loadData: "Load"
        case .settings: "Settings"
        case .about: "About"
        case .gestures: "Gestures"
        case .tutorial: "Tutorial"
        }
    }

    var symbol: String {
        switch self {
        case .patients: "person.badge.plus"
        case .loadData: "square.and.arrow.down"
        case .settings: "gearshape"
        case .about: "info.circle"
        case .gestures: "hand.tap"
        case .tutorial: "book"
        }
    }
}

enum WorkspaceMode: String, CaseIterable, Identifiable {
    case studies
    case multiPlanar
    case volume
    case compare

    var id: Self { self }

    var title: String {
        switch self {
        case .studies: "Studies"
        case .multiPlanar: "2D / MPR"
        case .volume: "3D Volume"
        case .compare: "Compare"
        }
    }

    var symbol: String {
        switch self {
        case .studies: "list.bullet.rectangle"
        case .multiPlanar: "square.grid.2x2"
        case .volume: "cube.transparent"
        case .compare: "rectangle.split.2x1"
        }
    }
}

enum StudyFilter: String, CaseIterable, Identifiable {
    case all
    case flagged
    case pending

    var id: Self { self }

    var title: String { rawValue.uppercased() }
}

enum StudyReviewStatus: String {
    case new = "New"
    case pending = "Pending"
    case reviewed = "Reviewed"
}

struct StudyCardModel: Identifiable, Hashable {
    let id: UUID
    let patientName: String
    let mrn: String
    let modality: String
    let bodyRegion: String
    let status: StudyReviewStatus
    let date: String
    let isFlagged: Bool
    let thumbnailSeed: Int

    init(
        id: UUID = UUID(),
        patientName: String,
        mrn: String,
        modality: String,
        bodyRegion: String,
        status: StudyReviewStatus,
        date: String,
        isFlagged: Bool = false,
        thumbnailSeed: Int
    ) {
        self.id = id
        self.patientName = patientName
        self.mrn = mrn
        self.modality = modality
        self.bodyRegion = bodyRegion
        self.status = status
        self.date = date
        self.isFlagged = isFlagged
        self.thumbnailSeed = thumbnailSeed
    }
}

@MainActor
@Observable
final class UIWorkspaceViewModel {
    var selectedSection: AppSection = .patients
    var selectedMode: WorkspaceMode = .studies
    var selectedFilter: StudyFilter = .all
    var searchText = ""
    var isSidebarExpanded = true
    var selectedStudyID: StudyCardModel.ID?
    var currentPage = 1

    let studies: [StudyCardModel] = [
        StudyCardModel(
            patientName: "Ortega, M.", mrn: "88213", modality: "MRI",
            bodyRegion: "Brain", status: .new, date: "Jul 28, 2026",
            isFlagged: true, thumbnailSeed: 1
        ),
        StudyCardModel(
            patientName: "Whitfield, R.", mrn: "40219", modality: "MRI",
            bodyRegion: "C-Spine", status: .reviewed, date: "Jul 25, 2026",
            thumbnailSeed: 2
        ),
        StudyCardModel(
            patientName: "Adeyemi, T.", mrn: "55871", modality: "MRI",
            bodyRegion: "Knee", status: .reviewed, date: "Jul 22, 2026",
            thumbnailSeed: 3
        ),
        StudyCardModel(
            patientName: "Nakamura, S.", mrn: "12904", modality: "MRI",
            bodyRegion: "Brain", status: .pending, date: "Jul 19, 2026",
            thumbnailSeed: 4
        ),
        StudyCardModel(
            patientName: "Bennett, A.", mrn: "71408", modality: "CT",
            bodyRegion: "Chest", status: .pending, date: "Jul 16, 2026",
            thumbnailSeed: 5
        ),
        StudyCardModel(
            patientName: "Dubois, L.", mrn: "36715", modality: "MRI",
            bodyRegion: "Lumbar", status: .reviewed, date: "Jul 12, 2026",
            isFlagged: true, thumbnailSeed: 6
        ),
    ]

    var selectedStudy: StudyCardModel {
        studies.first(where: { $0.id == selectedStudyID }) ?? studies[0]
    }

    var filteredStudies: [StudyCardModel] {
        studies.filter { study in
            let matchesFilter: Bool = switch selectedFilter {
            case .all: true
            case .flagged: study.isFlagged
            case .pending: study.status == .pending
            }

            let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesSearch = query.isEmpty
                || study.patientName.localizedCaseInsensitiveContains(query)
                || study.mrn.localizedCaseInsensitiveContains(query)
                || study.bodyRegion.localizedCaseInsensitiveContains(query)

            return matchesFilter && matchesSearch
        }
    }

    func selectSection(_ section: AppSection) {
        selectedSection = section
        if section == .patients {
            selectedMode = .studies
        }
    }

    func selectStudy(_ study: StudyCardModel, mode: WorkspaceMode = .multiPlanar) {
        selectedStudyID = study.id
        selectedSection = .patients
        selectedMode = mode
    }

    func selectMode(_ mode: WorkspaceMode) {
        selectedSection = .patients
        selectedMode = mode
    }
}

enum AnatomicalPlaneLabel: String, CaseIterable, Identifiable {
    case axial = "AXIAL"
    case sagittal = "SAGITTAL"
    case coronal = "CORONAL"

    var id: Self { self }
}

@MainActor
@Observable
final class MPRScaffoldViewModel {
    var axialPosition = 0.58
    var sagittalPosition = 0.44
    var coronalPosition = 0.62
    var windowPreset = "T2 FLAIR"
}

enum DummyRenderMode: String, CaseIterable, Identifiable {
    case volume = "Volume"
    case mip = "MIP"
    case surface = "Surface"

    var id: Self { self }
}

@MainActor
@Observable
final class VolumeScaffoldViewModel {
    var renderMode: DummyRenderMode = .volume
    var scale = 1.0
    var rotation = 0.0
}

@MainActor
@Observable
final class CompareScaffoldViewModel {
    var baselinePosition = 0.47
    var followUpPosition = 0.47
    var isLinked = true

    func updateBaseline(_ value: Double) {
        baselinePosition = value
        if isLinked { followUpPosition = value }
    }

    func updateFollowUp(_ value: Double) {
        followUpPosition = value
        if isLinked { baselinePosition = value }
    }
}

@MainActor
@Observable
final class SettingsScaffoldViewModel {
    var showOrientationLabels = true
    var synchronizePlanes = true
    var showGestureHints = true
    var defaultWindowPreset = "T2 FLAIR"
    var appearance = "System"
}
