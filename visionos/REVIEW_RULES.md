# visionOS Review Rules

Review only the changes in the pull request and relevant surrounding code.

- Report concrete bugs, regressions, security or privacy risks, and missing tests.
- Prioritize medical-data correctness, parsing bounds, concurrency, memory safety,
  rendering state, and secret or patient-data exposure.
- Rank each finding as `P0` (critical), `P1` (high), `P2` (medium), or `P3` (low).
- Include the affected file and line, the failure scenario, and user impact.
- Do not report style preferences unless they affect correctness or maintenance.
- Do not include praise or rewrite the pull request.

If there are no actionable findings, say so and briefly list any remaining test or
device-verification risks.
