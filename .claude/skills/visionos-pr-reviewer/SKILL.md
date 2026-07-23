---
name: visionos-pr-reviewer
description: Review pull requests and diffs that change the MRI Viewer visionOS app, Swift parsers, SwiftUI state, ARKit, Compositor Services, Metal shaders, medical-data handling, tests, or visionOS CI. Use for risk-ranked code review or as the Claude CI review contract; do not use to implement fixes.
---

# visionOS PR Reviewer

Find actionable correctness, safety, privacy, performance, and regression risks. Treat `visionos/MVP_ROADMAP.md` and `visionos/REVIEW_RULES.md` as the local contract.

## Review workflow

1. Read the PR description, changed files, tests, and relevant surrounding code. Review the diff against the target branch, not isolated snippets.
2. Identify the claimed user journey and exact format variants affected.
3. Trace data from file access through parsing, `VolumeData`, view models, render state, texture upload, and shader use where applicable.
4. Check tests and CI evidence. Do not infer correctness from a successful compile alone.
5. Report only concrete findings with file and tight line references. Rank by user impact and likelihood.

## Mandatory checks

- Parsing: bounds, endian handling, overflow, dimension/voxel limits, truncated input, datatype/transfer-syntax rejection, orientation, spacing, rescale, and series order.
- Concurrency/state: main-actor blocking, stale tasks, cancellation, duplicated sources of truth, unsafe cross-thread Metal state, and immersive lifecycle races.
- Renderer: Swift/Metal interface parity, buffer lifetime/alignment, semaphore release on every path, texture/device ownership, nil texture behavior, foveation/layout assumptions, and recoverable failures hidden by force operations.
- Privacy: PHI in fixtures, UI, logs, screenshots, paths, comments, CI artifacts, or AI prompts.
- Product claims: newly advertised extensions or formats must be backed by parsing and golden tests.
- CI/secrets: untrusted PR code must not receive Apple or Anthropic secrets; permissions and secret output must be minimal.
- Tests: require focused regression coverage for new domain/parser/state behavior and physical-device follow-up for renderer or gesture changes.

## Output format

List findings first, highest severity first. For each finding include:

- `[P0–P3]` concise title.
- Exact file and line.
- Failure scenario and user impact.
- Minimal direction for correction when useful.

Then list open questions and a short verification summary. If no actionable findings exist, say so and name the remaining test/device risks. Do not rewrite the PR or praise routine work.

## Safety

Never reproduce secret values, patient metadata, or identifiable fixture content in the review. Redact them and report the exposure location only.
