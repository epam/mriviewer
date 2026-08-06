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

  describe('backing-store dims (Graphics2d prepareImageForRender)', () => {
    it('matches todays dims (clientWidth/clientHeight) when dpr=1', () => {
      const clientWidth = 640;
      const clientHeight = 480;
      const layout = computeCanvasLayout(clientWidth, clientHeight, 4 / 3, 1);
      expect(layout.backingW).toBe(clientWidth);
      expect(layout.backingH).toBe(clientHeight);
    });

    it('scales backing dims by dpr independent of image aspect', () => {
      const clientWidth = 640;
      const clientHeight = 480;
      const square = computeCanvasLayout(clientWidth, clientHeight, 1, 3);
      const wide = computeCanvasLayout(clientWidth, clientHeight, 3, 3);
      expect(square.backingW).toBe(clientWidth * 3);
      expect(square.backingH).toBe(clientHeight * 3);
      expect(wide.backingW).toBe(square.backingW);
      expect(wide.backingH).toBe(square.backingH);
    });

    it('rounds fractional dpr backing dims to integers', () => {
      const layout = computeCanvasLayout(300, 200, 1, 1.5);
      expect(layout.backingW).toBe(450);
      expect(layout.backingH).toBe(300);
      expect(Number.isInteger(layout.backingW)).toBe(true);
      expect(Number.isInteger(layout.backingH)).toBe(true);
    });
  });

  describe('dest rect + offsets (Graphics2d renderReadyImage blit)', () => {
    it('draws a non-square (wide) image without distortion inside a square container', () => {
      const imageAspect = 16 / 9;
      const layout = computeCanvasLayout(600, 600, imageAspect, 1, 1);
      expect(layout.drawW / layout.drawH).toBeCloseTo(imageAspect);
      expect(layout.drawW).toBeCloseTo(600);
      expect(layout.drawH).toBeCloseTo(600 / imageAspect);
      expect(layout.offsetX).toBeCloseTo(0);
      expect(layout.offsetY).toBeCloseTo((600 - layout.drawH) / 2);
    });

    it('draws a non-square (tall) image without distortion inside a square container', () => {
      const imageAspect = 9 / 16;
      const layout = computeCanvasLayout(600, 600, imageAspect, 1, 1);
      expect(layout.drawW / layout.drawH).toBeCloseTo(imageAspect);
      expect(layout.drawH).toBeCloseTo(600);
      expect(layout.drawW).toBeCloseTo(600 * imageAspect);
      expect(layout.offsetY).toBeCloseTo(0);
      expect(layout.offsetX).toBeCloseTo((600 - layout.drawW) / 2);
    });

    it('keeps the dest rect centered within the DPR-scaled backing store', () => {
      const imageAspect = 2;
      const layout = computeCanvasLayout(500, 400, imageAspect, 2, 1);
      expect(layout.offsetX).toBeCloseTo((layout.backingW - layout.drawW) / 2);
      expect(layout.offsetY).toBeCloseTo((layout.backingH - layout.drawH) / 2);
      expect(layout.drawW / layout.drawH).toBeCloseTo(imageAspect);
    });

    it('scales the dest rect by zoom while preserving aspect and centering', () => {
      const imageAspect = 4 / 3;
      const base = computeCanvasLayout(800, 600, imageAspect, 1, 1);
      const zoomed = computeCanvasLayout(800, 600, imageAspect, 1, 1.5);
      expect(zoomed.drawW).toBeCloseTo(base.drawW * 1.5);
      expect(zoomed.drawH).toBeCloseTo(base.drawH * 1.5);
      expect(zoomed.drawW / zoomed.drawH).toBeCloseTo(imageAspect);
      expect(zoomed.offsetX).toBeCloseTo((zoomed.backingW - zoomed.drawW) / 2);
      expect(zoomed.offsetY).toBeCloseTo((zoomed.backingH - zoomed.drawH) / 2);
    });
  });
});
