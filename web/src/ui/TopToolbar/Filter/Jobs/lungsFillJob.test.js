/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { lungsFillJob } from './lungsFillJob';
jest.mock('../../../../engine/actvolume/lungsfill/seedPoints', () => {
  return function () {
    return {
      findSeedPointOnCentralSlice: jest.fn(() => false),
      findSeedPointOnFirstSlice: jest.fn(() => false),
    };
  };
});

describe('Test lungsFillJob', () => {
  it('should run job', () => {
    const job = lungsFillJob({ m_xDim: 0, m_yDim: 0, m_zDim: 0, m_dataArray: [] });
    expect(job.getProgress()).toBe(0);

    expect(job.run()).toBe(false);
    expect(job.getProgress()).toBe(20);

    expect(job.run()).toBe(false);
    expect(job.getProgress()).toBe(50);

    expect(job.run()).toBe(false);
    expect(job.getProgress()).toBe(80);

    expect(job.run()).toBe(false);
    expect(job.getProgress()).toBe(90);

    expect(job.run()).toBe(true);
    expect(job.getProgress()).toBe(0);
  });
});
