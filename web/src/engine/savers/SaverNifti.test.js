/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import SaverNifti from './SaverNifti';

const HEADER_SIZE = 348;
const DATA_OFFSET = 352;
const VOX_OFFSET_FIELD = 108;
const MAGIC_OFFSET = 344;

const makeVolume = (x, y, z) => {
  const numPixels = x * y * z;
  const volumeData = new Uint8Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    volumeData[i] = i % 256;
  }
  const volumeSize = { x, y, z, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };
  return { volumeData, volumeSize, numPixels };
};

describe('SaverNiftiTests', () => {
  it('buffer byteLength equals 352 + N*2', () => {
    const { volumeData, volumeSize, numPixels } = makeVolume(2, 3, 4);
    const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    expect(arrBuf.byteLength).toBe(DATA_OFFSET + numPixels * 2);
  });

  it('vox_offset header field reads back 352', () => {
    const { volumeData, volumeSize } = makeVolume(2, 3, 4);
    const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    const view = new DataView(arrBuf);
    expect(view.getFloat32(VOX_OFFSET_FIELD, true)).toBe(352);
  });

  it('magic bytes at offset 344 are n + 1', () => {
    const { volumeData, volumeSize } = makeVolume(2, 3, 4);
    const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    const bytes = new Uint8Array(arrBuf);
    expect(bytes[MAGIC_OFFSET + 0]).toBe(110);
    expect(bytes[MAGIC_OFFSET + 1]).toBe(43);
    expect(bytes[MAGIC_OFFSET + 2]).toBe(49);
  });

  it('sizeof_hdr at offset 0 equals 348', () => {
    const { volumeData, volumeSize } = makeVolume(2, 3, 4);
    const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    const view = new DataView(arrBuf);
    expect(view.getInt32(0, true)).toBe(HEADER_SIZE);
  });

  it('pad bytes 348..351 are zero', () => {
    const { volumeData, volumeSize } = makeVolume(2, 3, 4);
    const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    const bytes = new Uint8Array(arrBuf);
    for (let i = HEADER_SIZE; i < DATA_OFFSET; i++) {
      expect(bytes[i]).toBe(0);
    }
  });

  it('degenerate input still yields a structurally valid header without throwing', () => {
    const volumeData = new Uint8Array(0);
    const volumeSize = { x: 0, y: 0, z: 0, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };
    let arrBuf;
    expect(() => {
      arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    }).not.toThrow();
    expect(arrBuf.byteLength).toBe(DATA_OFFSET);
    const view = new DataView(arrBuf);
    expect(view.getInt32(0, true)).toBe(HEADER_SIZE);
    expect(view.getFloat32(VOX_OFFSET_FIELD, true)).toBe(352);
  });

  it('dimension-mismatch input warns but does not throw', () => {
    const volumeData = new Uint8Array(5);
    const volumeSize = { x: 2, y: 2, z: 2, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };
    expect(() => SaverNifti.writeBuffer(volumeData, volumeSize)).not.toThrow();
  });
});
