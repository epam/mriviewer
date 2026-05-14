# CLAUDE.md — visionos/

Swift + SwiftUI visionOS app. Inherits all rules from `../CLAUDE.md`.

---

## Path reference

```
visionos/
├── MRIViewer.xcodeproj
└── MRIViewer/
    ├── MRIViewerApp.swift          # Composition root — only DI wiring here
    ├── Domain/
    │   ├── Entities/               # DICOMStudy, DICOMSeries, DICOMSlice, PixelBuffer, WindowingPreset
    │   ├── UseCases/               # Use case protocol + implementation pairs
    │   ├── Protocols/              # DICOMRepositoryProtocol, PixelCacheProtocol, AnonymizationProfileProtocol
    │   └── ValueTypes/             # DICOMTag, TransferSyntax, AnonymizationProfile, ExportFormat, DICOMError
    ├── Data/
    │   ├── Bridge/                 # DicomCore.xcframework + DicomBridge.swift (do not edit generated files)
    │   ├── Mappers/                # Rust ↔ Domain type converters
    │   ├── Repositories/           # LocalDICOMRepository, DICOMwebRepository, MockDICOMRepository
    │   └── Services/               # DicomRustService (actor), PixelBufferCache, FileAccessService
    └── Presentation/
        ├── ViewModels/             # @Observable actors — receive use case protocols via init
        ├── Views/
        │   ├── Browser/            # StudyBrowserView, StudyListItemView
        │   ├── Viewer2D/           # SliceScrollView, SliceImageView, WindowingPanelView
        │   ├── Viewer3D/           # VolumeView (ImmersiveSpace), RealityViewContainer
        │   └── Shared/             # LoadingView, ErrorView
        └── Coordinators/           # AppCoordinator
```

---

## Build & test commands

```bash
# Build for visionOS simulator
xcodebuild -scheme MRIViewer \
           -destination 'platform=visionOS Simulator,name=Apple Vision Pro' \
           build

# Run unit tests
xcodebuild test \
           -scheme MRIViewer \
           -destination 'platform=visionOS Simulator,name=Apple Vision Pro'

# Run only domain tests
xcodebuild test \
           -scheme MRIViewer \
           -only-testing MRIViewerTests/DomainTests

# Update xcframework from mri-core (run after Rust changes)
make build-rust
cp -R mri-core/target/DicomCore.xcframework visionos/MRIViewer/Data/Bridge/
```

---

## Layer rules — where each file lives

| What you are creating | Correct path |
|---|---|
| New domain entity | `Domain/Entities/` |
| New use case | `Domain/UseCases/` — protocol + impl in same file |
| New repository protocol | `Domain/Protocols/` |
| New value type or error | `Domain/ValueTypes/` |
| New repository implementation | `Data/Repositories/` |
| New Rust type mapper | `Data/Mappers/` |
| New service or cache | `Data/Services/` |
| New ViewModel | `Presentation/ViewModels/` |
| New SwiftUI view | `Presentation/Views/<feature-folder>/` |
| New navigation logic | `Presentation/Coordinators/` |
| DI wiring | `MRIViewerApp.swift` only |

When unsure which layer a file belongs to, ask: does it contain business logic (Domain), I/O or external calls (Data), or UI state and rendering (Presentation)?

---

## Swift conventions

- All ViewModels are `@Observable` — never `ObservableObject`
- Use `async/await` and `AsyncStream` — never `Combine` for new code
- All actors are explicitly marked `actor` — never use `DispatchQueue` for thread safety
- Use `@MainActor` on ViewModels, not on individual methods
- Prefer `struct` for entities and value types; `actor` for services; `final class` only when required by a framework
- Error handling: always use typed `enum` errors conforming to `Error` — never `NSError` or `String`
- Access control: `internal` by default; `public` only for types crossing module boundaries; `private` for single-file helpers

---

## visionOS-specific conventions

- `WindowGroup` for 2D panel content — never use `ImmersiveSpace` for flat UI
- `ImmersiveSpace` for the 3D volume viewer only
- Hand gestures go in `RealityViewContainer` — not in SwiftUI views
- `openImmersiveSpace` / `dismissImmersiveSpace` called from `AppCoordinator` only — never from a View directly
- `RealityView` update closures must be side-effect free — all state changes go through the ViewModel

---

## Never do (Swift / visionOS)

- Never import `Data/` from `Presentation/`
- Never import `DicomBridge` or any `Rust*` type outside `Data/`
- Never put business logic in a SwiftUI `View` body
- Never call `DicomBridge` directly — always go through `DicomRustService` actor
- Never use `@EnvironmentObject` for use cases or repositories — use init injection
- Never instantiate a concrete repository or service outside `MRIViewerApp.swift`
- Never use `ObservableObject` — use `@Observable`
- Never use raw DICOM tag tuples — always `DICOMTag`
