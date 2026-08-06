/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import SaverNifti from './SaverNifti';
import LoaderNifti from '../loaders/loaderNifti/LoaderNifti';
import LoadResult from '../LoadResult';

const DATA_OFFSET = 352;
const SCALE_TO_16BIT = 4095 / 255;

const idx = (x, y, z, xDim, yDim) => z * xDim * yDim + y * xDim + x;

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

  it('relative voxel intensities are recoverable (higher input -> higher output)', () => {
    const x = 8;
    const y = 8;
    const z = 8;
    const HIGH = 255;
    const LOW = 64;
    const volumeData = new Uint8Array(x * y * z);
    for (let zz = 0; zz < z; zz++) {
      const value = zz < z / 2 ? HIGH : LOW;
      for (let yy = 0; yy < y; yy++) {
        for (let xx = 0; xx < x; xx++) {
          volumeData[idx(xx, yy, zz, x, y)] = value;
        }
      }
    }
    const volumeSize = { x, y, z, pixdim1: 1.0, pixdim2: 1.0, pixdim3: 1.0 };

    const { volDst, ok, completeCode } = roundTrip(volumeData, volumeSize);

    expect(ok).toBe(true);
    expect(completeCode).toBe(LoadResult.SUCCESS);

    const highVoxel = volDst.m_dataArray[idx(4, 4, 2, x, y)];
    const lowVoxel = volDst.m_dataArray[idx(4, 4, 5, x, y)];

    expect(highVoxel).toBeGreaterThan(0);
    expect(highVoxel).toBeGreaterThanOrEqual(lowVoxel);
  });
});
