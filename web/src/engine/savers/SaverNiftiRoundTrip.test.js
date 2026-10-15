/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import SaverNifti from './SaverNifti';
import LoaderNifti from '../loaders/loaderNifti/LoaderNifti';
import LoadResult from '../LoadResult';
import { voxelIndex, makePositionCodedVolume, interiorIndices, isStrictlyIncreasingMapping } from './niftiTestHelpers';

const DATA_OFFSET = 352;
const SCALE_TO_16BIT = 4095 / 255;

const idx = voxelIndex;

const roundTrip = (volumeData, volumeSize) => {
  const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
  const loader = new LoaderNifti();
  const volDst = {};
  let completeCode = null;
  const ok = loader.readFromBuffer(volDst, arrBuf, null, (code) => {
    completeCode = code;
  });
  return { arrBuf, volDst, ok, completeCode };
};

describe('SaverNiftiRoundTripTests', () => {
  it('dims and uniform interior survive save -> read', () => {
    const x = 6;
    const y = 6;
    const z = 6;
    const volumeData = new Uint8Array(x * y * z).fill(255);
    const volumeSize = { x, y, z, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };

    const { volDst, ok, completeCode } = roundTrip(volumeData, volumeSize);

    expect(ok).toBe(true);
    expect(completeCode).toBe(LoadResult.SUCCESS);
    expect(volDst.m_xDim).toBe(x);
    expect(volDst.m_yDim).toBe(y);
    expect(volDst.m_zDim).toBe(z);

    const interior = idx(2, 2, 2, x, y);
    expect(volDst.m_dataArray[interior]).toBe(255);
    expect(volDst.m_dataArray[0]).toBe(0);
  });

  it('saver applies the known 4095/255 up-scale to written voxels', () => {
    const x = 4;
    const y = 4;
    const z = 4;
    const inputValue = 100;
    const volumeData = new Uint8Array(x * y * z).fill(inputValue);
    const volumeSize = { x, y, z, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };

    const arrBuf = SaverNifti.writeBuffer(volumeData, volumeSize);
    const view = new DataView(arrBuf);

    const sampleIndex = idx(2, 2, 2, x, y);
    const written = view.getInt16(DATA_OFFSET + sampleIndex * 2, true);
    expect(written).toBe(Math.round(inputValue * SCALE_TO_16BIT));
  });

  it('maps every distinct input intensity to a distinct, order-preserving output at its own voxel', () => {
    const x = 10;
    const y = 9;
    const z = 8;
    const volumeData = makePositionCodedVolume(x, y, z);
    const volumeSize = { x, y, z, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };

    const { volDst, ok, completeCode } = roundTrip(volumeData, volumeSize);

    expect(ok).toBe(true);
    expect(completeCode).toBe(LoadResult.SUCCESS);
    const interior = interiorIndices(x, y, z);
    expect(new Set(interior.map((i) => volumeData[i])).size).toBeGreaterThan(50);
    expect(isStrictlyIncreasingMapping(volumeData, volDst.m_dataArray, interior)).toBe(true);
  });

  it('the oracle rejects a volume shifted by one voxel along x, y or z', () => {
    const x = 10;
    const y = 9;
    const z = 8;
    const volumeData = makePositionCodedVolume(x, y, z);
    const volumeSize = { x, y, z, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };
    const { volDst } = roundTrip(volumeData, volumeSize);
    const interior = interiorIndices(x, y, z);

    [1, x, x * y].forEach((shift) => {
      const shifted = new Uint8Array(volDst.m_dataArray.length);
      for (let i = 0; i < shifted.length; i++) {
        shifted[i] = volDst.m_dataArray[(i + shift) % shifted.length];
      }
      expect(isStrictlyIncreasingMapping(volumeData, shifted, interior)).toBe(false);
    });
  });

  it('the oracle rejects two distinct inputs collapsing to one output', () => {
    const input = new Uint8Array([10, 20, 30, 40]);
    const output = new Uint8Array([5, 9, 9, 12]);
    expect(isStrictlyIncreasingMapping(input, output, [0, 1, 2, 3])).toBe(false);
  });
});
