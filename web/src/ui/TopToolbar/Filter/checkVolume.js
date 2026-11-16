/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

export const checkVolume = (volume) => {
  if (volume === undefined || volume === null) {
    console.log('onButtonDetectBrain: no volume!');
    return false;
  }
  const { m_xDim, m_yDim, m_zDim } = volume;
  if (m_xDim * m_yDim * m_zDim < 1) {
    console.log(`onButtonDetectBrain: bad volume! dims = ${m_xDim}*${m_yDim}*${m_zDim}`);
    return false;
  }
  const ONE = 1;
  if (volume.m_bytesPerVoxel !== ONE) {
    console.log('onButtonDetectBrain: supported only 1bpp volumes');
    return false;
  }
  return true;
};
