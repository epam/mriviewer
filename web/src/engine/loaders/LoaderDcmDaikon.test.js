/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import LoaderDcmDaikon from './LoaderDcmDaikon';
import LoaderDicom from './LoaderDicom';

describe('LoaderDcmDaikon single-file orientation flip', () => {
  const NO_FLIP = { x: false, y: false, z: false };

  const _srcBuffer16 = (values) => {
    const arr = new Uint16Array(values);
    return arr.buffer;
  };

  it('identity orientation copies the single slice byte-for-byte unchanged', () => {
    const dst = new Uint16Array(6);
    LoaderDcmDaikon.copySlicePixels(dst, _srcBuffer16([1, 2, 3, 4, 5, 6]), 3, 2, 1, NO_FLIP);
    expect(Array.from(dst)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('negative row cosine mirrors X in the single-file path', () => {
    const dst = new Uint16Array(6);
    const flip = LoaderDicom.getOrientationFlipFlags([-1, 0, 0, 0, 1, 0]);
    LoaderDcmDaikon.copySlicePixels(dst, _srcBuffer16([1, 2, 3, 4, 5, 6]), 3, 2, 1, flip);
    expect(Array.from(dst)).toEqual([3, 2, 1, 6, 5, 4]);
  });

  it('negative column cosine mirrors Y in the single-file path', () => {
    const dst = new Uint16Array(6);
    const flip = LoaderDicom.getOrientationFlipFlags([1, 0, 0, 0, -1, 0]);
    LoaderDcmDaikon.copySlicePixels(dst, _srcBuffer16([1, 2, 3, 4, 5, 6]), 3, 2, 1, flip);
    expect(Array.from(dst)).toEqual([4, 5, 6, 1, 2, 3]);
  });

  it('combined negative row and column cosines mirror both axes', () => {
    const dst = new Uint16Array(6);
    const flip = LoaderDicom.getOrientationFlipFlags([-1, 0, 0, 0, -1, 0]);
    LoaderDcmDaikon.copySlicePixels(dst, _srcBuffer16([1, 2, 3, 4, 5, 6]), 3, 2, 1, flip);
    expect(Array.from(dst)).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('applies the same flip for 3-samples-per-pixel (rgb averaged) data', () => {
    const rgb = new Uint8Array([10, 10, 10, 20, 20, 20, 30, 30, 30, 40, 40, 40]);
    const dst = new Uint16Array(4);
    const flip = LoaderDicom.getOrientationFlipFlags([-1, 0, 0, 0, 1, 0]);
    LoaderDcmDaikon.copySlicePixels(dst, rgb.buffer, 2, 2, 3, flip);
    expect(Array.from(dst)).toEqual([20, 10, 40, 30]);
  });

  it('parses daikon orientation tag values into flip flags', () => {
    expect(LoaderDcmDaikon.orientationFlipFromTagValue([1, 0, 0, 0, 1, 0])).toEqual(NO_FLIP);
    expect(LoaderDcmDaikon.orientationFlipFromTagValue([-1, 0, 0, 0, 1, 0])).toEqual({ x: true, y: false, z: false });
    expect(LoaderDcmDaikon.orientationFlipFromTagValue(['1', '0', '0', '0', '-1', '0'])).toEqual({ x: false, y: true, z: false });
    expect(LoaderDcmDaikon.orientationFlipFromTagValue(null)).toEqual(NO_FLIP);
    expect(LoaderDcmDaikon.orientationFlipFromTagValue([1, 0, 0])).toEqual(NO_FLIP);
  });
});
