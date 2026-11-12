import { resamplePixels } from './resamplePixels';

const makeCoded = (w, h) => {
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
  return px;
};

const at = (px, w, x, y) => Array.from(px.slice((y * w + x) * 4, (y * w + x) * 4 + 4));

describe('resamplePixels', () => {
  it('upscales by an integer factor keeping every source pixel at its own position', () => {
    const out = resamplePixels(makeCoded(4, 2), 4, 2, 8, 4);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        expect(at(out, 8, x, y)).toEqual([Math.floor(x / 2) + 1, Math.floor(y / 2) + 1, 7, 255]);
      }
    }
  });

  it('downscales without row shear', () => {
    const out = resamplePixels(makeCoded(8, 4), 8, 4, 4, 2);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 4; x++) {
        expect(at(out, 4, x, y)).toEqual([x * 2 + 2, y * 2 + 2, 7, 255]);
      }
    }
  });

  it('keeps the exact bytes when the size is unchanged', () => {
    const src = makeCoded(5, 3);
    expect(Array.from(resamplePixels(src, 5, 3, 5, 3))).toEqual(Array.from(src));
  });

  it('returns a zeroed buffer of the target size for a degenerate source', () => {
    const out = resamplePixels(new Uint8ClampedArray(0), 0, 0, 3, 2);
    expect(out.length).toBe(3 * 2 * 4);
    expect(out.every((v) => v === 0)).toBe(true);
  });
});
