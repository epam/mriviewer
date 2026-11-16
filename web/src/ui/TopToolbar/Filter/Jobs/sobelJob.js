/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import SobelEdgeDetector from '../../../../engine/imgproc/Sobel';

export const sobelJob = (volume) => {
  let xDim = volume.m_xDim;
  let yDim = volume.m_yDim;
  let zDim = volume.m_zDim;
  const xyzDim = xDim * yDim * zDim;
  let progress = 0;

  const sobel = new SobelEdgeDetector();

  const setProgress = (value) => {
    progress = value;
  };
  const getProgress = () => progress;

  const run = () => {
    if (getProgress() === 0) {
      sobel.start(volume);

      setProgress(2);
      return false;
    }

    if (getProgress() > 0) {
      sobel.update();

      let ratioUpdate = sobel.getRatio();
      ratioUpdate = ratioUpdate < 1.0 ? ratioUpdate : 1.0;
      ratioUpdate *= 100;
      let currentProgress = ratioUpdate < 2 ? 2 : Math.floor(ratioUpdate);

      setProgress(currentProgress);

      const isFinished = sobel.isFinished();

      if (isFinished) {
        sobel.normalizeDstImage();

        // copy result pixels into source
        const pixelsDst = sobel.getPixelsDst();
        for (let i = 0; i < xyzDim; i++) {
          volume.m_dataArray[i] = Math.floor(pixelsDst[i]);
        }
        sobel.stop();

        setProgress(0);
        return true;
      }
      return false;
    }

    return true;
  };

  return { run, getProgress };
};
