# 2D Canvas Re-fit on Resize

How the 2D MRI slice viewer keeps its canvas aspect-correct and re-fits when the
window or container changes size.

Relevant issue: **#251** (image squished and blurry after a window width change).

---

## Problem

The 2D path in `web/src/engine/Graphics2d.jsx` builds an aspect-correct source bitmap
(`wScreen × hScreen`, fitted to the container in `prepareImageForRender`) and blits it,
uniformly scaled, into the canvas. That math is correct — but `prepareImageForRender`
(which sizes the canvas backing store and recomputes the fitted bitmap) only ran on mount
and on Redux prop changes. A window resize changes neither, so on resize:

- the backing store kept its old pixel dimensions while CSS stretched the canvas element
  to the new container size, so the stale bitmap was scaled non-uniformly — **squished**
  horizontally on a width change and **blurred** by the CSS upscale.

---

## Fix — re-fit on resize

The canvas is re-fitted whenever its container changes size.

### Resize wiring — `web/src/engine/resizeObserver.js`

```
observeCanvasResize(target, onResize) → cleanup()
```

- Attaches a `ResizeObserver` on the canvas wrapper and calls `onResize` on every size
  change. Returns a cleanup that disconnects the observer.
- Guards a missing target / callback / `ResizeObserver` (jsdom) by returning a no-op-safe
  cleanup, so `componentWillUnmount` can call it unconditionally.

### Component integration — `web/src/engine/Graphics2d.jsx`

- `componentDidMount` subscribes via `observeCanvasResize(wrapper, handleResize)`.
- `handleResize` re-runs `prepareImageForRender()` + `renderReadyImage()`, which resizes
  the backing store to the new `clientWidth/clientHeight` and rebuilds the aspect-fitted
  bitmap — so the image re-fits without squish or CSS-stretch blur.
- `componentWillUnmount` invokes the returned cleanup.

---

## Why a pure helper

jsdom has no real 2D canvas context, and `Graphics2d.test.js` mocks the whole component.
Extracting the observer wiring into a pure module (`resizeObserver.js`) makes the
subscribe/cleanup behavior unit-testable without a browser. See `resizeObserver.test.js`.

---

## Not covered — HiDPI backing-store scaling

Scaling the backing store by `window.devicePixelRatio` for crisper HiDPI rendering was
attempted but reverted: doing it correctly requires a single canvas transform reconciled
with the existing source-crop zoom/pan model, the `tools2d/*` overlay coordinate math, and
the segmentation `putImageData` path (which ignores canvas transforms), plus on-device
HiDPI visual verification. It is deferred to a dedicated, manually-verified change.
