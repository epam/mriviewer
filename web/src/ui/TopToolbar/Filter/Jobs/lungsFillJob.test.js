/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import SeedPoints from '../../../../engine/actvolume/lungsfill/seedPoints';
import { lungsFillJob } from './lungsFillJob';

vi.mock('../../../../engine/actvolume/lungsfill/seedPoints', () => ({
  default: vi.fn(),
}));

const findSeedPointOnCentralSlice = vi.fn();
const findSeedPointOnFirstSlice = vi.fn();

const voxelIndex = (x, y, z) => x + y * 8 + z * 8 * 8;

const createVolume = () => {
  const data = new Uint8Array(8 * 8 * 8).fill(100);
  // Two connected lung voxels, two connected airway voxels, and an isolated dark voxel.
  data[voxelIndex(3, 3, 4)] = 10;
  data[voxelIndex(4, 3, 4)] = 20;
  data[voxelIndex(5, 5, 2)] = 5;
  data[voxelIndex(5, 4, 2)] = 8;
  data[voxelIndex(1, 1, 4)] = 15;
  return { m_xDim: 8, m_yDim: 8, m_zDim: 8, m_dataArray: data };
};

describe('lungsFillJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    SeedPoints.mockImplementation(function SeedPointsMock() {
      return { findSeedPointOnCentralSlice, findSeedPointOnFirstSlice };
    });
    findSeedPointOnCentralSlice.mockImplementation((seed) => {
      Object.assign(seed, { x: 3, y: 3, z: 4 });
      return 0;
    });
    findSeedPointOnFirstSlice.mockImplementation((seed) => {
      // The first-slice finder stores the airway intensity threshold in z.
      Object.assign(seed, { x: 5, y: 5, z: 10 });
      return 0;
    });
  });

  it('completes segmentation and writes lung and airway labels into the source volume', () => {
    const volume = createVolume();
    const originalData = volume.m_dataArray.slice();
    const setSeed = vi.fn();
    const job = lungsFillJob(volume, setSeed);
    expect(job.getProgress()).toBe(0);

    for (const progress of [20, 50, 80, 90]) {
      expect(job.run()).toBe(false);
      expect(job.getProgress()).toBe(progress);
      expect(volume.m_dataArray).toEqual(originalData);
    }
    expect(job.run()).toBe(true);
    expect(job.getProgress()).toBe(0);

    // Run the real flood fill and morphology: lungs become 127, airways 255, and background 0.
    const expected = new Uint8Array(originalData.length);
    expected[voxelIndex(3, 3, 4)] = 127;
    expected[voxelIndex(4, 3, 4)] = 127;
    expected[voxelIndex(5, 5, 2)] = 255;
    expected[voxelIndex(5, 4, 2)] = 255;
    expect(volume.m_dataArray).toEqual(expected);
    expect(setSeed).not.toHaveBeenCalled();
    expect(SeedPoints).toHaveBeenCalledTimes(2);
    expect(SeedPoints).toHaveBeenNthCalledWith(1, volume.m_dataArray, 8, 8, 8);
    expect(SeedPoints).toHaveBeenNthCalledWith(2, volume.m_dataArray, 8, 8, 8);
    expect(findSeedPointOnCentralSlice).toHaveBeenCalledTimes(1);
    expect(findSeedPointOnFirstSlice).toHaveBeenCalledTimes(1);
  });

  it('reports a missing central seed and finishes without modifying the volume', () => {
    findSeedPointOnCentralSlice.mockReturnValue(1);
    const volume = createVolume();
    const originalData = volume.m_dataArray.slice();
    const setSeed = vi.fn();
    const job = lungsFillJob(volume, setSeed);

    expect(job.run()).toBe(true);

    expect(setSeed).toHaveBeenCalledExactlyOnceWith(true);
    expect(job.getProgress()).toBe(0);
    expect(volume.m_dataArray).toEqual(originalData);
    expect(SeedPoints).toHaveBeenCalledTimes(1);
    expect(findSeedPointOnCentralSlice).toHaveBeenCalledTimes(1);
    expect(findSeedPointOnFirstSlice).not.toHaveBeenCalled();
  });

  it('reports a missing airway seed and finishes without writing partial segmentation', () => {
    findSeedPointOnFirstSlice.mockReturnValue(1);
    const volume = createVolume();
    const originalData = volume.m_dataArray.slice();
    const setSeed = vi.fn();
    const job = lungsFillJob(volume, setSeed);

    for (let step = 0; step < 3; step++) {
      expect(job.run()).toBe(false);
    }
    expect(job.run()).toBe(true);

    expect(setSeed).toHaveBeenCalledExactlyOnceWith(true);
    expect(job.getProgress()).toBe(0);
    expect(volume.m_dataArray).toEqual(originalData);
    expect(SeedPoints).toHaveBeenCalledTimes(2);
    expect(findSeedPointOnCentralSlice).toHaveBeenCalledTimes(1);
    expect(findSeedPointOnFirstSlice).toHaveBeenCalledTimes(1);
  });
});
