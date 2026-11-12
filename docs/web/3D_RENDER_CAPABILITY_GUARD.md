# 3D Render Capability Guard & Error States

Reference for the capability guard that fronts the 3D volume renderer, the error
states it can surface, and troubleshooting guidance for environment-specific
black-screen reports (#208, #238).

Before this guard existed, a 3D render failure produced a **silent black canvas**
with no message. The guard turns each failure into a specific, on-screen reason.

---

## Requirements for 3D rendering

The 3D ray-casting path uploads the volume as a `THREE.DataTexture3D` and renders
into `THREE.FloatType` render targets. Both need a fully-featured WebGL2 context:

| Requirement | Why it is needed |
|---|---|
| **WebGL2 context** | `DataTexture3D` / `texImage3D` is WebGL2-only. WebGL1 cannot upload the volume texture. |
| **`EXT_color_buffer_float`** | Float render targets (front/back face position buffers) require this extension to be color-renderable. |
| **`OES_texture_float_linear`** | The float front/back-face targets are sampled with `LinearFilter` (`texture2D`) inside the ray-casting shaders; without this extension WebGL2 treats the RGBA32F textures as incomplete and samples them as black — a silent black volume. |
| **Shaders compile & link** | The scene becomes ready only after the ray-casting materials finish async compile. |
| **Complete framebuffer** | The offscreen render targets must report `FRAMEBUFFER_COMPLETE`. |

On fully-capable WebGL2 hardware the render path is the same except for two additions that
run on every device, not only on failing ones:

- **A real framebuffer check.** `render()` used to hard-code the framebuffer check to OK. It now
  calls `checkFramebufferStatus` once on the back-face target. A device that reports the
  extensions but cannot make that target complete used to render something and now stops
  rendering on every frame and shows the `framebuffer` overlay.
- **A ready timeout.** `evaluateReadyTimeout()` runs while the scene is not ready. After
  `SCENE_READY_TIMEOUT_MS` (10 s) it reports `shader`. A legitimately slow first frame (large
  volume, cold shader cache) therefore shows "3D shaders failed to load." until the materials
  arrive; the overlay clears by itself once the scene becomes ready.

---

## Error states

The guard resolves every failure to one of the reasons below. The reason is mapped
to a user-facing message by `web/src/engine/gl/render3dErrorMessage.js` and shown
as an overlay in `Graphics3d.jsx` instead of a black canvas.

| Reason (`RENDER_ERROR`) | Trigger | Message shown |
|---|---|---|
| `webgl2` | Context is not WebGL2 (WebGL1 fallback, or no context) | *3D rendering requires WebGL2, which is not available in this browser.* |
| `colorBufferFloat` | WebGL2 present but `EXT_color_buffer_float` missing | *3D rendering requires float color buffer support (EXT_color_buffer_float), which is unavailable on this device.* |
| `floatLinear` | WebGL2 + `EXT_color_buffer_float` present but `OES_texture_float_linear` missing | *3D rendering requires linear filtering of float textures (OES_texture_float_linear), which is unavailable on this device.* |
| `shader` | Scene never reaches ready state within the timeout (shader compile/link failed) | *3D shaders failed to load.* |
| `framebuffer` | Render target reports an incomplete framebuffer | *3D render target (framebuffer) is incomplete.* |
| `null` (`NONE`) | Everything OK — normal render | *(no overlay)* |

---

## How the guard is wired

The logic lives in pure, unit-tested helpers under `web/src/engine/gl/`; the
renderer only wires them into the existing flow.

- **`detect3dCapabilities.js`** — `detect3dCapabilities(gl)` inspects the live
  context and returns `{ webgl2, colorBufferFloat, floatLinear, reason }`. Pure; testable with
  stub `gl` objects.
- **`gate3dCapability.js`** — `decide3dCapabilityGate(caps)` turns detected
  capabilities into a decision `{ proceed, isWebGL2, error }`. The gate's
  `isWebGL2` replaces `glSelector.useWebGL2()` in `VolumeRenderer3d.js`.
- **`volumeFilter3d.js` behaviour change.** `isWebGL2` used to be assigned `1` unconditionally; it
  is now `isWebGL2Context(this.context) ? 1 : 0` and feeds `mat.defines.useWebGL2`, which selects
  the shader branch (`#if useWebGL2 == 0` in `gfx/mattex2d.js`). On a WebGL1 context the filter
  now compiles the WebGL1 branch where it previously always compiled the WebGL2 branch. On
  WebGL2 contexts nothing changes. No test covers the WebGL1 filter path.
- **`render3dReadyState.js`** — `evaluateReadyState(...)` detects a stuck
  `sceneReadyCounter` (async shader compile never completed) via a
  `SCENE_READY_TIMEOUT_MS` timeout and surfaces `shader`;
  `mapFramebufferStatus(status, FRAMEBUFFER_COMPLETE)` re-enables a real
  framebuffer completeness check (previously stubbed to `CHECK_MODE_RESULT_OK`).
- **`render3dErrorMessage.js`** — `render3dErrorMessage(reason)` maps a reason to
  the user-facing string (or `null` when there is no error).

Integration points:

- `VolumeRenderer3d.js` computes `decide3dCapabilityGate(...)` at init, sets
  `renderErrorReason` when the gate fails, on the missing-`EXT_color_buffer_float`
  branch, and from the ready-state / framebuffer checks in `render()`.
- `Graphics3d.jsx` reads `getRenderErrorReason()` each render, maps it with
  `render3dErrorMessage(...)`, and shows the overlay when a message is present.

---

## Troubleshooting

### "3D rendering requires WebGL2" / "float color buffer unavailable"
The device or browser genuinely lacks the capability. Confirm via
`about:gpu` / a WebGL report; software renderers and older mobile GPUs frequently
lack `EXT_color_buffer_float`. This is a hardware/driver limitation, not a bug.

### "3D shaders failed to load" (env-specific black screen — #238)
This may be the signal behind **#238**, where 3D works on **Prod** but shows black on
**Dev/Tst**. The capability is present, yet the scene never becomes ready.

Two readings, not distinguished by this repo:

1. A **deploy / CDN / asset-loading difference** between environments (shader chunks served from
   a different base path, blocked by CSP, or 404/MIME-mismatched by the CDN).
2. A **renderer that cannot draw the scene at all**. The checked-in e2e baseline
   `web/e2e-tests/tests/test.spec.ts-snapshots/Displaying-a-2D-model-should-check-the-3D-viewer-1-chromium-linux.png`
   is a black 3D canvas next to a fully drawn settings panel, so the 3D viewer already renders
   nothing in the headless Chromium that the e2e job uses. A software-rendered environment can
   therefore reproduce the black screen without any deploy difference.

To tell them apart: the three capability reasons (`webgl2`, `colorBufferFloat`, `floatLinear`)
mean the context lacks something and are reported immediately. `shader` means the capabilities
were present and the scene still was not ready after 10 s, which can also be a slow first frame.
Check `about:gpu` and the capability reason first; only then look at deploy differences.

When the `shader` error appears in a given environment, check:
- Network tab for failed/`404`/wrong-MIME shader or chunk requests.
- The asset base path / `publicPath` used by that environment's build vs Prod.
- CSP or CDN rewrite rules that could block or alter shader chunk delivery.
- The browser console for WebGL shader compile/link errors.

The surfaced `shader` error is precisely the diagnostic that makes this failure
visible in the affected environment instead of a silent black frame.

### "3D render target (framebuffer) is incomplete"
The float render targets could not be allocated as complete framebuffers even
though the extension reported available — typically a driver/size limitation.
Reproduce with a smaller volume and check console for GL errors.

---

## Related

- Issues: **#208** (silent black 3D in a production build — capability guard),
  **#238** (env-specific black 3D on Dev/Tst — diagnosable via the `shader` error).
- Empty-volume black-3D caused by `ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED` is a
  **separate** loader-side cause tracked in the compressed-DICOM plan.
- Issue status: this guard only makes the failures visible; it does not fix #208 or #238. Link them
  as `Refs`, not `Closes`.

## Tests

- `web/src/engine/gl/*.test.js`: the pure helpers.
- `web/src/engine/VolumeRenderer3d.test.js`: the wiring, through the real class with a stubbed WebGL
  layer: the capability gate in `initWithVolume`, the framebuffer check and the ready timeout.
- `web/src/engine/Graphics3d.test.jsx`: the overlay and its messages.
