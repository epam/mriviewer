---
applyTo: "visionos/**"
---

# visionOS pull request review

- Follow `visionos/REVIEW_RULES.md`.
- Evaluate the current Swift/SwiftUI/Metal prototype, not unimplemented
  future-state architecture.
- Enforce the `Presentation -> Domain <- Data` dependency direction, allowing
  the app composition root to construct concrete Data implementations.
- Check actor isolation, `Sendable` correctness, task lifetime, cancellation,
  reentrancy, lock scope, render-thread blocking, and balanced semaphores.
- Scrutinize `@unchecked Sendable`, unsafe pointers, forced casts, force
  unwraps, `try!`, integer arithmetic, and Metal resource assumptions.
- For volume inputs, verify positive dimensions and spacing, checked byte/count
  arithmetic, exact voxel count, valid bit depth, endianness, signedness, slice
  order, orientation, rescale values, and windowing domain.
- Treat incorrect patient orientation, spacing, intensity, windowing, or slice
  order as correctness defects even when the output still looks plausible.
- Check that buffer indices, struct layout, alignment, formats, sample counts,
  depth conventions, stereo views, and texture bindings agree across Swift,
  `ShaderTypes.h`, and `Shaders.metal`.
- Check every render-frame early return for balanced frame state and semaphore
  signaling. Check caches and drawable-keyed state for bounded lifetime.
- Verify ARKit authorization, provider support/failure, pause, invalidation,
  foveation, and layout fallbacks for changed immersive code.
- Patient identifiers or study metadata must not leak through UI, logs,
  analytics, errors, screenshots, or fixtures.
- Require deterministic Swift Testing coverage for changed Domain/use-case
  behavior and malformed/empty/boundary inputs.
- Do not claim a simulator run validates device-only tracking, gestures,
  foveation, physical scale, thermal behavior, or sustained performance.
