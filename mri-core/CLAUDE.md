# CLAUDE.md — mri-core/

Rust crate — DICOM parsing, pixel extraction, anonymization.
Compiled to `DicomCore.xcframework` consumed by `visionos/`.
Inherits all rules from `../CLAUDE.md`.

---

## Path reference

```
mri-core/
├── Cargo.toml
├── build.rs                    # swift-bridge code generation — do not rename
├── src/
│   ├── lib.rs                  # crate root, re-exports public API
│   ├── ffi.rs                  # ONLY file that imports swift-bridge
│   ├── service.rs              # public API surface — composes all modules
│   ├── parser.rs               # dicom-rs tag + object parsing
│   ├── pixel.rs                # pixel extraction, decompression, normalisation
│   ├── anonymizer.rs           # dicom-anonymization profile application
│   └── series.rs               # multi-slice sorting, rayon parallel loading
└── tests/
    ├── parser_tests.rs
    ├── pixel_tests.rs
    └── anonymizer_tests.rs
```

---

## Build & test commands

```bash
# Run from mri-core/

# Run all tests (no Apple toolchain needed)
cargo test

# Run a specific test module
cargo test --test parser_tests

# Check without building
cargo check

# Build for visionOS device (ARM64)
cargo build --target aarch64-apple-visionos --release

# Build for visionOS simulator (ARM64 sim)
cargo build --target aarch64-apple-visionos-simulator --release

# Lint
cargo clippy -- -D warnings

# Format
cargo fmt --check
```

---

## Module responsibilities

| File | Owns | Does not own |
|---|---|---|
| `parser.rs` | Reading `.dcm` files, tag extraction, transfer syntax detection | Pixel data decoding |
| `pixel.rs` | Pixel decompression, 8/16-bit normalisation, windowing LUT | File I/O |
| `anonymizer.rs` | PHI tag removal, UID remapping, profile rule application | Pixel data |
| `series.rs` | Multi-slice sorting by `ImagePositionPatient`, parallel loading | Anonymization |
| `service.rs` | Composing modules into clean public functions | FFI, Swift types |
| `ffi.rs` | Exposing `service.rs` functions to Swift via `swift-bridge` | Business logic |

---

## FFI rules

- `ffi.rs` is the **only** file that imports `swift_bridge`
- All Swift-facing types use the `Rust` prefix: `RustDicomObject`, `RustPixelBuffer`, `RustAnonymizationResult`
- Opaque types in `ffi.rs` wrap `service.rs` types — never expose internal module types directly
- Async functions in `ffi.rs` use `async fn` — swift-bridge generates the Swift `async` binding automatically
- Zero-copy pixel buffer: expose `RustPixelBuffer` as an opaque type; Swift reads via pointer, never copies

---

## Rust conventions

- All public functions in `service.rs` have a `///` doc comment
- Error types are `enum` implementing `std::error::Error` — never `String` errors
- Use `rayon` for parallel slice loading in `series.rs` — never `std::thread::spawn`
- No `unwrap()` or `expect()` in production code paths — propagate errors with `?`
- `clippy` must pass with zero warnings before a PR is merged
- `rustfmt` formatting is enforced in CI

---

## Never do (Rust / mri-core)

- Never import `swift_bridge` outside `ffi.rs`
- Never put FFI logic in `service.rs` or any other module
- Never expose internal `dicom-rs` types directly through `ffi.rs` — always wrap in a `Rust*` opaque type
- Never use `unwrap()` in `parser.rs`, `pixel.rs`, `anonymizer.rs`, or `service.rs`
- Never add iOS/macOS/visionOS platform-specific `#[cfg]` gates outside `ffi.rs` and `build.rs`
- Never add network I/O to this crate — it is a pure processing library
