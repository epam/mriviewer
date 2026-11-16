/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import { DEFAULT_WIN_MAX, DEFAULT_WIN_MIN } from '../../ui/Constants/WindowSet.constants';
/**
 * Apply window range data (min,max)
 */
export const applyWindowRangeData = (store, windowMin = DEFAULT_WIN_MIN, windowMax = DEFAULT_WIN_MAX) => {
  const loaderDicom = store.loaderDicom;
  const volSet = store.volumeSet;
  // set loader features according current modal properties (window min, max)
  loaderDicom.m_windowCenter = (windowMin + windowMax) * 0.5;
  loaderDicom.m_windowWidth = windowMax - windowMin;
  // apply for single slice dicom read
  // select 1st slice and hash
  const series = loaderDicom.m_slicesVolume.getSeries();
  const numSeries = series.length;
  for (let i = 0; i < numSeries; i++) {
    const hashCode = series[i].m_hash;
    loaderDicom.createVolumeFromSlices(volSet, i, hashCode);
  }
};
