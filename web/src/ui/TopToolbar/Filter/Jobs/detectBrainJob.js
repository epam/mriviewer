/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import ActiveVolume from '../../../../engine/actvolume/actvol';

export const detectBrainJob = (volume) => {
  let xDim = volume.m_xDim;
  let yDim = volume.m_yDim;
  let zDim = volume.m_zDim;
  let volTexSrc = volume.m_dataArray;
  const xyzDim = xDim * yDim * zDim;
  const volTextureDst = new Uint8Array(xyzDim);
  let progress = 0;
  let actVolume = null;
  let geoRender = null;

  const setProgress = (value) => {
    progress = value;
  };
  const getProgress = () => progress;

  const run = () => {
    if (getProgress() === 0) {
      const NEED_LOG = true;
      const CREATE_TYPE = ActiveVolume.REMOVE_SKULL;
      actVolume = new ActiveVolume();

      geoRender = actVolume.skullRemoveStart(xDim, yDim, zDim, volTexSrc, volTextureDst, CREATE_TYPE, NEED_LOG);

      setProgress(2);
      return false;
    }

    if (getProgress() > 0) {
      const { m_updateCounter, m_numPredSteps } = actVolume;

      let ratioUpdate = m_updateCounter / m_numPredSteps;
      ratioUpdate = ratioUpdate < 1.0 ? ratioUpdate : 1.0;
      ratioUpdate *= 100;
      let currentProgress = ratioUpdate < 2 ? 2 : ratioUpdate;

      setProgress(currentProgress);

      const isFinished = actVolume.skullRemoveUpdate(geoRender);
      if (isFinished) {
        actVolume.skullRemoveStop(geoRender);

        // perform finalize skull remove
        volume.m_dataArray = actVolume.m_volTexDst;

        setProgress(0);
        return true;
      }
      return false;
    }

    return true;
  };

  return { run, getProgress };
};
