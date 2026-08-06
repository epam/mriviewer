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
