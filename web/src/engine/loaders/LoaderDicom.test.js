/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import LoaderDicom from './LoaderDicom';

describe('LoaderDicom orientation parsing', () => {
  const _tagStream = (strValue) => {
    const buf = new ArrayBuffer(strValue.length);
    const dv = new DataView(buf);
    for (let i = 0; i < strValue.length; i++) {
      dv.setUint8(i, strValue.charCodeAt(i));
    }
    return dv;
  };

  it('parses 6 direction cosines from a minimal tag stream', () => {
    const dv = _tagStream('1\\0\\0\\0\\1\\0');
    const strOrient = LoaderDicom.getStringAt(dv, 0, dv.byteLength);
    const cosines = LoaderDicom.parseDirectionCosines(strOrient);
    expect(cosines).toEqual([1, 0, 0, 0, 1, 0]);
  });

  it('parses signed floating point cosines', () => {
    const dv = _tagStream('-1\\0\\0\\0\\-1\\0');
    const strOrient = LoaderDicom.getStringAt(dv, 0, dv.byteLength);
    const cosines = LoaderDicom.parseDirectionCosines(strOrient);
    expect(cosines).toEqual([-1, 0, 0, 0, -1, 0]);
  });

  it('returns null for a malformed tag stream', () => {
    expect(LoaderDicom.parseDirectionCosines('1\\0\\0')).toBeNull();
    expect(LoaderDicom.parseDirectionCosines('a\\b\\c\\d\\e\\f')).toBeNull();
    expect(LoaderDicom.parseDirectionCosines(null)).toBeNull();
  });

  it('identity orientation yields all flip flags false', () => {
    const flip = LoaderDicom.getOrientationFlipFlags([1, 0, 0, 0, 1, 0]);
    expect(flip.x).toBe(false);
    expect(flip.y).toBe(false);
    expect(flip.z).toBe(false);
  });

  it('negative row cosine sets X flip true', () => {
    const flip = LoaderDicom.getOrientationFlipFlags([-1, 0, 0, 0, 1, 0]);
    expect(flip.x).toBe(true);
    expect(flip.y).toBe(false);
  });

  it('negative column cosine sets Y flip true', () => {
    const flip = LoaderDicom.getOrientationFlipFlags([1, 0, 0, 0, -1, 0]);
    expect(flip.x).toBe(false);
    expect(flip.y).toBe(true);
  });

  it('combined negative row and column cosines set both flips true', () => {
    const flip = LoaderDicom.getOrientationFlipFlags([-1, 0, 0, 0, -1, 0]);
    expect(flip.x).toBe(true);
    expect(flip.y).toBe(true);
  });

  it('missing orientation defaults to no flip', () => {
    const flip = LoaderDicom.getOrientationFlipFlags(null);
    expect(flip.x).toBe(false);
    expect(flip.y).toBe(false);
    expect(flip.z).toBe(false);
  });
});

describe('LoaderDicom targeted sign-flip', () => {
  const NO_FLIP = { x: false, y: false, z: false };

  const _copyWithFlip = (src, xDim, yDim, flip) => {
    const dst = new src.constructor(src.length);
    for (let i = 0; i < src.length; i++) {
      dst[LoaderDicom.computeDestIndex(i, xDim, yDim, flip)] = src[i];
    }
    return dst;
  };

  it('identity orientation copies the buffer byte-for-byte unchanged', () => {
    const src = new Uint16Array([1, 2, 3, 4, 5, 6]);
    const out = _copyWithFlip(src, 3, 2, NO_FLIP);
    expect(Array.from(out)).toEqual([1, 2, 3, 4, 5, 6]);
    for (let i = 0; i < src.length; i++) {
      expect(LoaderDicom.computeDestIndex(i, 3, 2, NO_FLIP)).toBe(i);
    }
  });

  it('X flip mirrors each row', () => {
    const src = new Uint16Array([1, 2, 3, 4, 5, 6]);
    const out = _copyWithFlip(src, 3, 2, { x: true, y: false, z: false });
    expect(Array.from(out)).toEqual([3, 2, 1, 6, 5, 4]);
  });

  it('Y flip mirrors the rows', () => {
    const src = new Uint16Array([1, 2, 3, 4, 5, 6]);
    const out = _copyWithFlip(src, 3, 2, { x: false, y: true, z: false });
    expect(Array.from(out)).toEqual([4, 5, 6, 1, 2, 3]);
  });

  it('combined X and Y flip mirrors both axes', () => {
    const src = new Uint16Array([1, 2, 3, 4, 5, 6]);
    const out = _copyWithFlip(src, 3, 2, { x: true, y: true, z: false });
    expect(Array.from(out)).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('a negative-cosine orientation mirrors vs. the identity buffer', () => {
    const src = new Uint16Array([10, 20, 30, 40]);
    const identityFlip = LoaderDicom.getOrientationFlipFlags([1, 0, 0, 0, 1, 0]);
    const negRowFlip = LoaderDicom.getOrientationFlipFlags([-1, 0, 0, 0, 1, 0]);
    const identityOut = _copyWithFlip(src, 2, 2, identityFlip);
    const flippedOut = _copyWithFlip(src, 2, 2, negRowFlip);
    expect(Array.from(identityOut)).toEqual([10, 20, 30, 40]);
    expect(Array.from(flippedOut)).toEqual([20, 10, 40, 30]);
  });
});
