# MRI Viewer — Architecture

## Dependency rule

```mermaid
flowchart LR
    P["Presentation<br/>SwiftUI · ViewModels · visionOS"]
    D["Domain<br/>Entities · Use Cases · Protocols"]
    DA["Data<br/>Repositories · Bridge · Cache"]
    R["mri-core<br/>Rust · dicom-rs · FFI"]

    P -->|"imports protocols"| D
    DA -->|"implements protocols"| D
    DA -->|"calls via actor"| R

    style D fill:#3d3a7a,stroke:#6b67c4,color:#d4d2f5
    style P fill:#1a5c52,stroke:#2e9e8a,color:#b8ede6
    style DA fill:#7a5a10,stroke:#c49a28,color:#f5e0a0
    style R fill:#1a3a6b,stroke:#3472c4,color:#b0cdf5
```

---

## Layer 1 — Domain

> No imports. Pure Swift structs and protocols. Zero framework dependencies.

```mermaid
classDiagram
    namespace Entities {
        class DICOMStudy {
            +studyUID: String
            +patientID: String
            +studyDate: Date
            +series: [DICOMSeries]
        }
        class DICOMSeries {
            +seriesUID: String
            +modality: String
            +slices: [DICOMSlice]
        }
        class DICOMSlice {
            +instanceUID: String
            +slicePosition: Float
            +pixelDataRef: PixelDataReference
        }
        class WindowingPreset {
            +center: Float
            +width: Float
            +label: String
        }
        class PixelBuffer {
            +width: Int
            +height: Int
            +bytes: Data
            +bitsAllocated: Int
        }
    }

    namespace UseCases {
        class LoadStudyUseCaseProtocol {
            <<protocol>>
            +execute(url: URL) async throws DICOMStudy
        }
        class LoadSeriesUseCaseProtocol {
            <<protocol>>
            +execute(study: DICOMStudy) AsyncStream~DICOMSeries~
        }
        class ApplyWindowingUseCaseProtocol {
            <<protocol>>
            +execute(slice, preset) async throws PixelBuffer
        }
        class AnonymizeStudyUseCaseProtocol {
            <<protocol>>
            +execute(study, profile) async throws DICOMStudy
        }
        class ExportSliceUseCaseProtocol {
            <<protocol>>
            +execute(slice, format) async throws Data
        }
    }

    namespace RepositoryProtocols {
        class DICOMRepositoryProtocol {
            <<protocol>>
            +load(url: URL) async throws DICOMStudy
            +save(study: DICOMStudy) async throws
            +delete(uid: String) async throws
            +list() async throws [DICOMStudy]
        }
        class PixelCacheProtocol {
            <<protocol>>
            +store(key: String, buffer: PixelBuffer)
            +retrieve(key: String) PixelBuffer?
            +evict(key: String)
        }
    }

    namespace ValueTypes {
        class DICOMTag {
            +group: UInt16
            +element: UInt16
        }
        class TransferSyntax {
            <<enum>>
            implicitVRLittleEndian
            explicitVRLittleEndian
            jpeg2000
            jpegBaseline
        }
        class AnonymizationProfile {
            <<enum>>
            basic
            retainDates
            full
        }
        class DICOMError {
            <<enum>>
            fileNotFound
            invalidTransferSyntax
            corruptPixelData
            unsupportedModality
        }
    }

    DICOMStudy "1" --> "many" DICOMSeries
    DICOMSeries "1" --> "many" DICOMSlice
    LoadStudyUseCaseProtocol ..> DICOMStudy : returns
    LoadSeriesUseCaseProtocol ..> DICOMSeries : streams
    ApplyWindowingUseCaseProtocol ..> PixelBuffer : returns
    ApplyWindowingUseCaseProtocol ..> WindowingPreset : uses
```

---

## Layer 2 — Data

> Implements domain protocols. Rust types confined here — never cross into Domain or Presentation.

```mermaid
flowchart TB
    subgraph Bridge["Bridge — DicomCore.xcframework"]
        B1["DicomBridge.swift<br/>wraps swift-bridge bindings"]
        B2["RustDicomObject<br/>opaque handle"]
        B3["RustPixelBuffer<br/>zero-copy bytes"]
        B4["RustAnonymizationResult<br/>opaque handle"]
    end

    subgraph Mappers["Mappers — firewall between Rust and Domain"]
        M1["DicomStudyMapper<br/>RustDicomObject → DICOMStudy"]
        M2["PixelBufferMapper<br/>RustPixelBuffer → PixelBuffer"]
        M3["AnonymizationResultMapper<br/>RustAnonResult → DICOMStudy"]
        M4["DomainToRustMapper<br/>DICOMStudy → RustAnonInput"]
    end

    subgraph Repos["Repository implementations"]
        R1["LocalDICOMRepository<br/>implements DICOMRepositoryProtocol<br/>reads .dcm from local filesystem"]
        R2["DICOMwebRepository<br/>implements DICOMRepositoryProtocol<br/>future: PACS REST API"]
        R3["MockDICOMRepository<br/>implements DICOMRepositoryProtocol<br/>unit tests — no Rust calls"]
    end

    subgraph Services["Services & cache"]
        S1["DicomRustService (actor)<br/>serialises all FFI calls<br/>prevents data races"]
        S2["PixelBufferCache<br/>NSCache + disk<br/>implements PixelCacheProtocol"]
        S3["FileAccessService<br/>FileManager abstraction<br/>visionOS sandbox handling"]
        S4["AnonymizationService<br/>applies profiles via Rust"]
    end

    Bridge --> Mappers
    Mappers --> Repos
    Mappers --> Services
    S1 --> Bridge

    style Bridge fill:#5a2a1a,stroke:#c4623a,color:#f5c8b8
    style Mappers fill:#7a5a10,stroke:#c49a28,color:#f5e0a0
    style Repos fill:#7a5a10,stroke:#c49a28,color:#f5e0a0
    style Services fill:#7a5a10,stroke:#c49a28,color:#f5e0a0
```

---

## Layer 3 — Presentation

> Imports Domain protocols only. Never imports Data, Bridge, or Rust types.

```mermaid
flowchart TB
    subgraph ViewModels["ViewModels — @Observable actors"]
        VM1["StudyBrowserViewModel<br/>file picker · study list · loading state"]
        VM2["SeriesViewerViewModel<br/>slice index · windowing preset · scroll"]
        VM3["VolumeViewerViewModel<br/>3D transform · gesture state · render mode"]
        VM4["WindowingPanelViewModel<br/>WL/WW sliders · preset selection"]
    end

    subgraph Views["Views"]
        V1["StudyBrowserView<br/>WindowGroup root · file picker entry"]
        V2["SliceScrollView<br/>2D multi-slice panel viewer"]
        V3["VolumeView<br/>ImmersiveSpace root"]
        V4["RealityViewContainer<br/>RealityKit scene + hand gestures"]
        V5["WindowingPanelView<br/>WL/WW slider controls"]
    end

    subgraph Nav["Navigation & DI"]
        N1["AppCoordinator<br/>openImmersiveSpace · dismiss · routes"]
        N2["MRIViewerApp.swift<br/>Composition root<br/>wires Data impls → Domain protocols"]
    end

    V1 --> VM1
    V2 --> VM2
    V3 --> VM3
    V4 --> VM3
    V5 --> VM4
    N2 --> VM1
    N2 --> VM2
    N2 --> VM3
    N1 --> V3

    style ViewModels fill:#1a5c52,stroke:#2e9e8a,color:#b8ede6
    style Views fill:#1a5c52,stroke:#2e9e8a,color:#b8ede6
    style Nav fill:#1a5c52,stroke:#2e9e8a,color:#b8ede6
```

---

## Rust crate — mri-core

> Pure Rust. No Swift, no visionOS. Compiled to DicomCore.xcframework.

```mermaid
flowchart TB
    subgraph Deps["Cargo.toml dependencies"]
        D1["dicom<br/>core DICOM parsing"]
        D2["dicom-anonymization<br/>PHI scrubbing"]
        D3["swift-bridge<br/>FFI code generation"]
        D4["rayon<br/>parallel slice loading"]
        D5["image<br/>pixel format conversion"]
    end

    subgraph Modules["src/ modules"]
        parser["parser.rs<br/>Opens .dcm · tag extraction<br/>transfer syntax handling"]
        pixel["pixel.rs<br/>Decompression · 8/16-bit normalisation<br/>windowing LUT"]
        anon["anonymizer.rs<br/>PHI tag removal · UID remapping<br/>profile-based rules"]
        series["series.rs<br/>Slice sorting by position<br/>rayon parallel loading"]
        service["service.rs<br/>Public API surface<br/>composes all modules · no FFI"]
        ffi["ffi.rs<br/>#[swift_bridge::bridge]<br/>only file that knows Swift"]
    end

    Deps --> Modules
    parser --> service
    pixel --> service
    anon --> service
    series --> service
    service --> ffi

    style ffi fill:#5a2a1a,stroke:#c4623a,color:#f5c8b8
    style service fill:#1a3a6b,stroke:#3472c4,color:#b0cdf5
    style Deps fill:#2a2a2a,stroke:#666,color:#ccc
    style Modules fill:#1a2a4a,stroke:#3472c4,color:#b0cdf5
```

---

## Project folder structure

```mermaid
flowchart LR
    root["mriviewer/"]

    root --> core["mri-core/<br/>Rust crate"]
    root --> app["visionos/<br/>Xcode project"]
    root --> docs["docs/<br/>Markdown documentation"]

    core --> c1["Cargo.toml<br/>build.rs<br/>src/<br/>tests/"]

    app --> a1["Domain/<br/>Entities · UseCases<br/>Protocols · ValueTypes"]
    app --> a2["Data/<br/>Bridge · Mappers<br/>Repositories · Services"]
    app --> a3["Presentation/<br/>ViewModels · Views<br/>Coordinators"]
    app --> a4["MRIViewerApp.swift<br/>Composition root"]

    docs --> d1["architecture.md<br/>build-guide.md<br/>decisions/"]
    docs --> d2["visionos/<br/>overview · layers<br/>windowing · testing"]
    docs --> d3["mri-core/<br/>overview · tags<br/>pixel pipeline · ffi"]

    style root fill:#2a2a2a,stroke:#888,color:#eee
    style core fill:#1a3a6b,stroke:#3472c4,color:#b0cdf5
    style app fill:#1a5c52,stroke:#2e9e8a,color:#b8ede6
    style docs fill:#1a4a1a,stroke:#3a9a3a,color:#b8f0b8
```
