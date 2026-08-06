# 2D Canvas Sizing Model (aspect + DPR + resize)

How the 2D MRI slice viewer sizes its canvas so the image stays aspect-correct,
sharp on HiDPI displays, and re-fits when the window or container changes size.

Relevant issue: **#251** (image squished on width change, blurry on Retina).

---

## Problem

The 2D path in `web/src/engine/Graphics2d.jsx` previously had two independent defects:

1. **Aspect ratio destroyed** — the final `drawImage(...)` stretched the aspect-correct
   source bitmap into the *full* canvas rectangle, so any width change squished the image.
2. **Blur + stale backing store** — the canvas backing store was set to
   `clientWidth`/`clientHeight` with no `devicePixelRatio`, and there was no resize
   handling, so CSS stretched a stale, low-resolution bitmap.

---

## Model

Three concerns are separated into pure, testable helpers plus thin wiring in the component.

### 1. Layout math — `web/src/engine/canvasSizing.js`

```
computeCanvasLayout(containerW, containerH, imageAspect, dpr = 1, zoom = 1)
  → { backingW, backingH, drawW, drawH, offsetX, offsetY }
```

- **Backing store**: `backingW/H = round(containerCSS * dpr)` — the pixel dimensions the
  canvas element's `width`/`height` attributes are set to. Scaling by
  `devicePixelRatio` is what keeps the image sharp on HiDPI/Retina.
- **Fit (letterbox)**: the image is fitted inside the backing store preserving
  `imageAspect`. When the image is wider than the container it is width-fitted; otherwise
  height-fitted. This is what prevents horizontal squish on a width change.
- **Zoom**: `drawW/H = fit * zoom`, applied consistently to both axes.
- **Centering**: `offsetX/Y = (backing - draw) / 2`, so the letterboxed image stays
  centered.
- **Degenerate inputs** (zero/negative size or aspect, non-positive dpr/zoom) return safe
  zeroed draw dimensions rather than throwing.

At `dpr = 1`, `zoom = 1`, and a container matching the image aspect, the output matches
the pre-fix native-size draw (aside from the corrected centering) — backward compatible.

### 2. Resize wiring — `web/src/engine/resizeObserver.js`

```
observeCanvasResize(target, onResize) → cleanup()
```

- Attaches a `ResizeObserver` on the canvas wrapper (container-driven re-fit) and a
  window `resize` listener (catches `devicePixelRatio` changes, e.g. moving the window
  between monitors).
- Guards missing `ResizeObserver`/`window` (jsdom, SSR) and invalid arguments, always
  returning a no-op-safe cleanup so `componentWillUnmount` can call it unconditionally.

### 3. Component integration — `web/src/engine/Graphics2d.jsx`

- `prepareImageForRender()` computes the backing store from
  `computeCanvasLayout(clientWidth, clientHeight, imageAspect, dpr)` and sets
  `objCanvas.width/height`.
- The blit calls `computeCanvasLayout(..., zoom)` and draws with the helper's
  `drawW/drawH` and `offsetX/offsetY` as the destination rect, instead of the full-canvas
  rect. All three orientations (TRANSVERSE / SAGITTAL / CORONAL) go through the same
  corrected path.
- `componentDidMount` subscribes via `observeCanvasResize(wrapper, handleResize)`;
  `handleResize` re-runs `prepareImageForRender()` + `renderReadyImage()`.
  `componentWillUnmount` invokes the returned cleanup.

---

## Why pure helpers

jsdom has no real 2D canvas context, and `Graphics2d.test.js` mocks the whole component.
Extracting the sizing math (`canvasSizing.js`) and the observer wiring
(`resizeObserver.js`) into pure modules makes the behavior unit-testable without a
browser. See `canvasSizing.test.js` (aspect preserved wide/narrow, non-square no-squish,
DPR backing store, centering, zoom) and `resizeObserver.test.js` (recompute wiring).

---

## Data flow

```
container resize / window resize / dpr change
        │
        ▼
observeCanvasResize ──► handleResize
        │
        ▼
prepareImageForRender ──► computeCanvasLayout ──► set canvas backing store (× dpr)
        │
        ▼
renderReadyImage ──────► computeCanvasLayout(zoom) ──► drawImage(dst = offset + drawW/H)
```
