# CLAUDE.md — mriviewer monorepo root

This file is read by Claude Code in any sub-project of this monorepo.
Sub-project CLAUDE.md files extend these rules — they never contradict them.

---

## Monorepo layout

```
mriviewer/
├── mri-core/       # Rust crate — DICOM engine, compiled to DicomCore.xcframework
├── visionos/       # Xcode project — Swift / visionOS app
├── web/            # Web app — documentation site or companion interface
├── docs/           # Markdown documentation (monorepo-wide)
│   ├── architecture.md
│   ├── build-guide.md
│   ├── decisions/
│   ├── visionos/
│   └── mri-core/
├── CLAUDE.md       # this file
├── Makefile        # top-level build shortcuts
└── rust-toolchain.toml
```

---

## Dependency rule — never violate

```
Presentation  →  Domain  ←  Data  →  [mri-core Rust bridge]
```

- `visionos/` Presentation layer imports Domain protocols only
- `visionos/` Data layer imports Domain + Apple I/O + DicomCore.xcframework only
- `visionos/` Domain layer imports nothing outside Swift stdlib
- `web/` never imports Swift types or Rust crate types directly
- `mri-core/` knows nothing about Swift, visionOS, or web

---

## Naming conventions (all sub-projects)

| Context | Convention |
|---|---|
| Swift types | `PascalCase` |
| Swift protocols | `PascalCase` + `Protocol` suffix |
| Swift use case protocols | `PascalCase` + `UseCaseProtocol` suffix |
| Rust modules | `snake_case` |
| Rust public types | `PascalCase` |
| Rust FFI-exposed types | `Rust` prefix (e.g. `RustDicomObject`) |
| Markdown docs | `kebab-case.md` |
| DICOM tags | Always typed — never raw string literals in any language |

---

## Git rules

- Branch naming: `feat/`, `fix/`, `docs/`, `refactor/` prefixes
- Commits that touch `mri-core/` and `visionos/` are separate commits
- Never commit `DicomCore.xcframework` — it is a build artifact, listed in `.gitignore`
- ADRs in `docs/decisions/` are append-only — never edit a merged ADR

---

## Documentation rules

- Every new protocol, entity, or public Rust function gets a doc comment
- Architecture changes require updating `docs/architecture.md` in the same PR
- Mermaid diagrams use `<br/>` for line breaks inside node labels — never `\n`
- `docs/visionos/` covers the Swift app only
- `docs/mri-core/` covers the Rust crate only
- `docs/decisions/` ADRs cover the whole monorepo

---

## Build shortcuts (Makefile targets)

```bash
make build-rust        # cargo build --target aarch64-apple-visionos --release
make build-ios         # xcodebuild -scheme MRIViewer -destination 'visionOS Simulator'
make test-rust         # cargo test --manifest-path mri-core/Cargo.toml
make test-swift        # xcodebuild test -scheme MRIViewer
make docs              # generate web docs (web/ build)
```

---

## Hard rules across the whole monorepo

- Never put business logic in a view (SwiftUI or web)
- Never commit secrets, API keys, or patient data (even synthetic)
- Never use raw DICOM tag strings — always typed wrappers
- Never skip writing a doc comment for a public API
