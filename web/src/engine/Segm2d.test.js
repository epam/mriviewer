import { vi } from 'vitest';

vi.mock('@tensorflow/tfjs', () => ({}));

import Segm2d from './Segm2d';

const STAGE_SEGMENTATION_READY = 4;

const makeReadySegm = (w, h) => {
  const segm = new Segm2d({ store: { dispatch: () => {} }, forceRender: () => {} });
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      px[i] = x + 1;
      px[i + 1] = y + 1;
      px[i + 2] = 7;
      px[i + 3] = 255;
    }
  }
  segm.model = {};
  segm.stage = STAGE_SEGMENTATION_READY;
  segm.pixels = px;
  segm.pixelsWidth = w;
  segm.pixelsHeight = h;
  return segm;
};

const makeCtx = () => {
  const ctx = {
    drawn: null,
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: (img) => {
      ctx.drawn = img;
    },
  };
  return ctx;
};

const pixelAt = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

describe('Segm2d.renderImage after the canvas size changed', () => {
  it('draws the completed segmentation unscrambled at the new size', () => {
    const segm = makeReadySegm(4, 2);
    const ctx = makeCtx();

    segm.renderImage(ctx, 8, 4, null);

    expect(ctx.drawn.width).toBe(8);
    expect(ctx.drawn.height).toBe(4);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        expect(pixelAt(ctx.drawn, x, y)).toEqual([Math.floor(x / 2) + 1, Math.floor(y / 2) + 1, 7, 255]);
      }
    }
  });

  it('draws unscrambled when the canvas shrinks', () => {
    const segm = makeReadySegm(8, 4);
    const ctx = makeCtx();

    segm.renderImage(ctx, 4, 2, null);

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 4; x++) {
        expect(pixelAt(ctx.drawn, x, y)).toEqual([x * 2 + 2, y * 2 + 2, 7, 255]);
      }
    }
  });

  it('keeps the cache dimensions in sync so a repeated render at the same size is stable', () => {
    const segm = makeReadySegm(4, 2);
    const ctx = makeCtx();

    segm.renderImage(ctx, 8, 4, null);
    const first = Array.from(ctx.drawn.data);
    segm.renderImage(ctx, 8, 4, null);

    expect(segm.pixelsWidth).toBe(8);
    expect(segm.pixelsHeight).toBe(4);
    expect(Array.from(ctx.drawn.data)).toEqual(first);
  });

  it('draws the cache as is when the size did not change', () => {
    const segm = makeReadySegm(4, 2);
    const ctx = makeCtx();

    segm.renderImage(ctx, 4, 2, null);

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 4; x++) {
        expect(pixelAt(ctx.drawn, x, y)).toEqual([x + 1, y + 1, 7, 255]);
      }
    }
  });
});
