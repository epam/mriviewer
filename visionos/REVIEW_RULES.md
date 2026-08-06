# visionOS Review Rules

Review only the changes in the pull request and relevant surrounding code.

- Report concrete bugs, regressions, security or privacy risks, and missing
  tests that allow changed behavior to fail undetected.
- Do not treat planned Rust/DICOM integration or documented prototype stubs as
  implemented behavior.
- Prioritize medical-data correctness, parsing and allocation bounds,
  concurrency, memory safety, rendering state, and secret or patient-data
  exposure.
- For volume work, verify dimensions, checked size arithmetic, voxel count,
  spacing, orientation, slice order, intensity representation, and windowing.
- For renderer work, cross-check Swift, Metal, and `ShaderTypes.h`; inspect
  semaphore balance, frame lifecycle, drawable lifetime, stereo layouts,
  transforms, depth state, and resource-allocation failures.
- For concurrency work, inspect actor isolation, task lifetime and cancellation,
  `Sendable` claims, locks, unsafe pointers, and render-thread blocking.
- Treat real or plausibly real patient identifiers, study metadata, paths,
  screenshots, and fixtures as privacy defects when committed or logged.
- Rank each finding as `P0` (critical), `P1` (high), `P2` (medium), or `P3` (low).
- Include the affected file and line, the failure scenario, and user impact.
- Do not report style preferences unless they affect correctness or maintenance.
- Do not include praise or rewrite the pull request.
- Do not report a pre-existing issue unless a changed line worsens it or makes
  it reachable.

If there are no actionable findings, say so and briefly list only material
remaining test or device-verification risks.
