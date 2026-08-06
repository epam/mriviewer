/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { computeCanvasLayout } from './canvasSizing';

describe('computeCanvasLayout', () => {
  it('scales the backing store by devicePixelRatio', () => {
    const layout = computeCanvasLayout(400, 300, 1, 2, 1);
    expect(layout.backingW).toBe(800);
    expect(layout.backingH).toBe(600);
  });

  it('backing store equals CSS size at dpr=1', () => {
    const layout = computeCanvasLayout(400, 300, 1, 1, 1);
    expect(layout.backingW).toBe(400);
    expect(layout.backingH).toBe(300);
  });

  it('preserves aspect ratio in a wide container (letterboxed horizontally)', () => {
    const imageAspect = 1;
    const layout = computeCanvasLayout(800, 400, imageAspect, 1, 1);
    expect(layout.drawH).toBeCloseTo(400);
    expect(layout.drawW).toBeCloseTo(400);
    expect(layout.drawW / layout.drawH).toBeCloseTo(imageAspect);
  });

  it('preserves aspect ratio in a narrow container (letterboxed vertically)', () => {
    const imageAspect = 1;
    const layout = computeCanvasLayout(400, 800, imageAspect, 1, 1);
    expect(layout.drawW).toBeCloseTo(400);
    expect(layout.drawH).toBeCloseTo(400);
    expect(layout.drawW / layout.drawH).toBeCloseTo(imageAspect);
  });

  it('does not squish a non-square image when the container widens', () => {
    const imageAspect = 2;
    const narrow = computeCanvasLayout(400, 400, imageAspect, 1, 1);
    const wide = computeCanvasLayout(1200, 400, imageAspect, 1, 1);
    expect(narrow.drawW / narrow.drawH).toBeCloseTo(imageAspect);
    expect(wide.drawW / wide.drawH).toBeCloseTo(imageAspect);
  });

  it('centers the image with symmetric offsets', () => {
    const layout = computeCanvasLayout(800, 400, 1, 1, 1);
    expect(layout.offsetX).toBeCloseTo((layout.backingW - layout.drawW) / 2);
    expect(layout.offsetY).toBeCloseTo((layout.backingH - layout.drawH) / 2);
    expect(layout.offsetX).toBeCloseTo(200);
    expect(layout.offsetY).toBeCloseTo(0);
  });

  it('applies the zoom factor to the drawn size', () => {
    const base = computeCanvasLayout(400, 400, 1, 1, 1);
    const zoomed = computeCanvasLayout(400, 400, 1, 1, 2);
    expect(zoomed.drawW).toBeCloseTo(base.drawW * 2);
    expect(zoomed.drawH).toBeCloseTo(base.drawH * 2);
  });

  it('combines dpr and aspect fit', () => {
    const layout = computeCanvasLayout(400, 400, 2, 2, 1);
    expect(layout.backingW).toBe(800);
    expect(layout.backingH).toBe(800);
    expect(layout.drawW).toBeCloseTo(800);
    expect(layout.drawH).toBeCloseTo(400);
  });

  it('returns a zero draw rect for degenerate inputs', () => {
    const layout = computeCanvasLayout(0, 0, 1, 1, 1);
    expect(layout.drawW).toBe(0);
    expect(layout.drawH).toBe(0);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(0);
  });

  it('falls back to safe defaults for non-positive dpr and zoom', () => {
    const layout = computeCanvasLayout(400, 300, 1, 0, 0);
    expect(layout.backingW).toBe(400);
    expect(layout.backingH).toBe(300);
    expect(layout.drawW).toBeGreaterThan(0);
  });
});
