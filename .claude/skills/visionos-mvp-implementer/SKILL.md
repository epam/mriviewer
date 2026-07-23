---
name: visionos-mvp-implementer
description: Implement scoped MRI Viewer MVP features under `visionos/`, especially local KTX, NIfTI, or DICOM import, 2D/3D viewing, SwiftUI state, Metal rendering, parser safety, tests, and CI fixes. Use when asked to build or fix a visionOS roadmap slice; do not use for web-only work or App Store submission.
---

# visionOS MVP Implementer

Implement one independently shippable slice from `visionos/MVP_ROADMAP.md`.

## Workflow

1. Read `visionos/MVP_ROADMAP.md`, `visionos/REVIEW_RULES.md`, and the files on the requested path before editing.
2. State the chosen slice and its observable acceptance criteria. Do not silently expand format support.
3. Preserve the format-neutral boundary: parsers and repositories produce `VolumeData`; SwiftUI, ARKit, and Metal consume it.
4. Add a failing test or fixture assertion first when the change contains parser, mapping, state, or error-handling logic.
5. Implement the smallest complete path, including typed errors and cancellation/resource cleanup where relevant.
6. Run targeted tests, then the repository's unsigned `build-for-testing` command. Report an environment failure separately from a code failure.
7. Update the compatibility matrix or roadmap only when behavior or support claims change.

## Guardrails

- Keep all user-controlled parsing off the main actor.
- Validate offsets, dimensions, multiplication overflow, file length, voxel count, and allocation limits before reading or allocating.
- Support only format variants proved by fixtures. Reject unknown transfer syntaxes, datatypes, orientations, compression, or container versions explicitly.
- Use synthetic or verified anonymized fixtures. Never commit PHI or log patient name, ID, metadata, or sensitive paths.
- Keep one source of truth for render/session state. Synchronize renderer reads through `VolumeRenderState`.
- Avoid `try!`, force unwraps, and `fatalError` for file, device-capability, texture-allocation, or other recoverable failures.
- Keep Apple signing credentials and `ANTHROPIC_API_KEY` out of source, logs, tests, generated artifacts, and prompts.
- Do not start a general `mri-core` migration unless the requested slice explicitly includes it.

## Verification by change type

- Parser: valid, truncated, corrupt, unsupported, oversized, endian, overflow, and golden-voxel cases.
- State/view model: loading, success, cancellation, failure, retry, repeated open/close, and stale-task behavior.
- Metal/renderer: shader compilation, buffer/interface consistency, early-return semaphore release, lifecycle recovery, and physical-device follow-up.
- UI: empty/loading/error/success states, accessibility labels, immersive open/close, and no PHI display by default.
- CI: least-privilege permissions, pinned toolchain assumptions, no secret echoing, and deterministic gates before advisory AI review.

## Completion report

Report the delivered user journey, supported variants, tests/builds executed, known limitations, and physical-device checks still required.
