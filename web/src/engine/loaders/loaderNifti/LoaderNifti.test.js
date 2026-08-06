/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import LoaderNifti from './LoaderNifti';
import LoadResult from '../../LoadResult';

const HEADER_SIZE = 348;
const MAGIC_OFFSET = 344;
const VOX_OFFSET_FIELD = 108;
const NIFTI_DATA_TYPE_UINT8 = 2;

const buildNiftiBuffer = ({ x, y, z, voxOffset, dataValue = 100, padValue = 250 }) => {
  const numVoxels = x * y * z;
  const dataOff = voxOffset;
  const bufLen = Math.max(dataOff + numVoxels, HEADER_SIZE);
  const arrBuf = new ArrayBuffer(bufLen);
  const view = new DataView(arrBuf);
  const bytes = new Uint8Array(arrBuf);

  view.setInt32(0, HEADER_SIZE, true);
  view.setInt16(40, 3, true);
  view.setInt16(42, x, true);
  view.setInt16(44, y, true);
  view.setInt16(46, z, true);
  view.setInt16(70, NIFTI_DATA_TYPE_UINT8, true);
  view.setInt16(72, 8, true);
  view.setFloat32(80, 1.0, true);
  view.setFloat32(84, 1.0, true);
  view.setFloat32(88, 1.0, true);
  view.setFloat32(VOX_OFFSET_FIELD, voxOffset, true);

  bytes[MAGIC_OFFSET + 0] = 110;
  bytes[MAGIC_OFFSET + 1] = 43;
  bytes[MAGIC_OFFSET + 2] = 49;
  bytes[MAGIC_OFFSET + 3] = 0;

  for (let i = HEADER_SIZE; i < dataOff; i++) {
    bytes[i] = padValue;
  }
  for (let i = 0; i < numVoxels; i++) {
    bytes[dataOff + i] = dataValue;
  }
  return arrBuf;
};

describe('LoaderNiftiTests', () => {
  it('honors vox_offset = 352 (spec-valid file with 4 pad bytes)', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 352 });
    const loader = new LoaderNifti();
    const volDst = {};
    let completeCode = null;
    const ok = loader.readFromBuffer(volDst, arrBuf, null, (code) => {
      completeCode = code;
    });

    expect(ok).toBe(true);
    expect(completeCode).toBe(LoadResult.SUCCESS);
    expect(volDst.m_xDim).toBe(4);
    expect(volDst.m_yDim).toBe(4);
    expect(volDst.m_zDim).toBe(4);

    const interiorIndex = 1 * 16 + 1 * 4 + 1;
    expect(volDst.m_dataArray[interiorIndex]).toBeGreaterThan(200);
    expect(volDst.m_dataArray[0]).toBe(0);
  });

  it('honors legacy vox_offset = 348 (self-saved file, backward compatibility)', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 348 });
    const loader = new LoaderNifti();
    const volDst = {};
    let completeCode = null;
    const ok = loader.readFromBuffer(volDst, arrBuf, null, (code) => {
      completeCode = code;
    });

    expect(ok).toBe(true);
    expect(completeCode).toBe(LoadResult.SUCCESS);
    expect(volDst.m_xDim).toBe(4);
    expect(volDst.m_yDim).toBe(4);
    expect(volDst.m_zDim).toBe(4);

    const interiorIndex = 1 * 16 + 1 * 4 + 1;
    expect(volDst.m_dataArray[interiorIndex]).toBeGreaterThan(200);
  });

  it('rejects vox_offset past end of buffer with a proper error code (no crash)', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 352 });
    const view = new DataView(arrBuf);
    view.setFloat32(VOX_OFFSET_FIELD, 100000, true);

    const loader = new LoaderNifti();
    const volDst = {};
    let completeCode = 'unset';
    let ok;
    expect(() => {
      ok = loader.readFromBuffer(volDst, arrBuf, null, (code) => {
        completeCode = code;
      });
    }).not.toThrow();

    expect(ok).toBe(false);
    expect(completeCode).toBe(LoadResult.BAD_HEADER);
  });

  it('clamps a too-small vox_offset up to the header size', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 348 });
    const view = new DataView(arrBuf);
    view.setFloat32(VOX_OFFSET_FIELD, 0, true);

    const loader = new LoaderNifti();
    const volDst = {};
    let completeCode = null;
    const ok = loader.readFromBuffer(volDst, arrBuf, null, (code) => {
      completeCode = code;
    });

    expect(ok).toBe(true);
    expect(completeCode).toBe(LoadResult.SUCCESS);
    expect(volDst.m_xDim).toBe(4);
  });

  it('delivers WRONG_HEADER_MAGIC (not undefined) for a bad magic', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 352 });
    const bytes = new Uint8Array(arrBuf);
    bytes[MAGIC_OFFSET + 0] = 0;
    bytes[MAGIC_OFFSET + 1] = 0;
    bytes[MAGIC_OFFSET + 2] = 0;

    const loader = new LoaderNifti();
    let completeCode = 'unset';
    const ok = loader.readFromBuffer({}, arrBuf, null, (code) => {
      completeCode = code;
    });

    expect(ok).toBe(false);
    expect(completeCode).toBe(LoadResult.WRONG_HEADER_MAGIC);
    expect(completeCode).not.toBeUndefined();
  });

  it('delivers WRONG_HEADER_DATA_TYPE (not undefined) for an unsupported data type', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 352 });
    const view = new DataView(arrBuf);
    view.setInt16(70, 999, true);

    const loader = new LoaderNifti();
    let completeCode = 'unset';
    const ok = loader.readFromBuffer({}, arrBuf, null, (code) => {
      completeCode = code;
    });

    expect(ok).toBe(false);
    expect(completeCode).toBe(LoadResult.WRONG_HEADER_DATA_TYPE);
    expect(completeCode).not.toBeUndefined();
  });

  it('delivers WRONG_HEADER_DIMENSIONS (not undefined) for too few dimensions', () => {
    const arrBuf = buildNiftiBuffer({ x: 4, y: 4, z: 4, voxOffset: 352 });
    const view = new DataView(arrBuf);
    view.setInt16(40, 2, true);

    const loader = new LoaderNifti();
    let completeCode = 'unset';
    const ok = loader.readFromBuffer({}, arrBuf, null, (code) => {
      completeCode = code;
    });

    expect(ok).toBe(false);
    expect(completeCode).toBe(LoadResult.WRONG_HEADER_DIMENSIONS);
    expect(completeCode).not.toBeUndefined();
  });
});
