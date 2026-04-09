/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import SeedPoints from '../../../../engine/actvolume/lungsfill/seedPoints';
import FloodFillTool from '../../../../engine/actvolume/lungsfill/floodfill';

const getSeedPointOnCentralSlice = (volTexSrc, xDim, yDim, zDim) => {
  let vSeed = { x: 0, y: 0, z: 0 };
  const seedPoints = new SeedPoints(volTexSrc, xDim, yDim, zDim);
  const resFind = seedPoints.findSeedPointOnCentralSlice(vSeed);
  if (resFind) {
    console.log('Lungs Central fill run: seed point not found');
    return false;
  }
  return vSeed;
};

const getSeedPointOnFirstSlice = (volTexSrc, xDim, yDim, zDim) => {
  let vSeed = { x: 0, y: 0, z: 0 };
  const seedPoints = new SeedPoints(volTexSrc, xDim, yDim, zDim);
  const resFind = seedPoints.findSeedPointOnFirstSlice(vSeed);
  if (resFind) {
    console.log('Airway fill run: seed point not found');
    return false;
  }
  return vSeed;
};

const copyFilled = (volTexMask, xyzDim) => {
  for (let x = 0; x < xyzDim; x++) {
    volTexMask[x] = volTexMask[x] === 255 ? 255 : 0;
  }
};

const floodFill = (xDim, yDim, zDim, texMask, vSeed, threshold) => {
  const fillTool = new FloodFillTool();
  fillTool.floodFill3dThreshold(xDim, yDim, zDim, texMask, vSeed, threshold);
};

const detectNonEmptyBox = (xDim, yDim, zDim, volTexMask) => {
  const MIN_VAL_BARRIER = 8;
  const xDimHalf = Math.floor(xDim / 2);
  const yDimHalf = Math.floor(yDim / 2);
  const xyDim = xDim * yDim;

  const checkIsEmptyPlane = (x, y, isReturnX = true) => {
    for (let z = 0; z < zDim; z++) {
      const off = z * xyDim + y * xDim + x;
      if (volTexMask[off] > MIN_VAL_BARRIER) {
        return isReturnX ? x : y;
      }
    }
    return false;
  };

  const getXBorderMin = () => {
    for (let x = 0; x < xDimHalf; x++) {
      for (let y = 0; y < yDim; y++) {
        const res = checkIsEmptyPlane(x, y, true);
        if (res) {
          return res;
        }
      }
    }
    return xDimHalf - 1;
  };

  const getXBorderMax = () => {
    for (let x = xDim - 1; x > xDimHalf; x--) {
      for (let y = 0; y < yDim; y++) {
        const res = checkIsEmptyPlane(x, y, true);
        if (res) {
          return res;
        }
      }
    }
    return xDimHalf + 1;
  };

  const getYBorderMin = () => {
    for (let y = 0; y < yDimHalf; y++) {
      for (let x = 0; x < xDim; x++) {
        const res = checkIsEmptyPlane(x, y, false);
        if (res) {
          return res;
        }
      }
    }
    return yDimHalf - 1;
  };

  const getYBorderMax = () => {
    for (let y = yDim - 1; y > yDimHalf; y--) {
      for (let x = 0; x < xDim; x++) {
        const res = checkIsEmptyPlane(x, y, false);
        if (res) {
          return res;
        }
      }
    }
    return yDimHalf + 1;
  };

  const xBorderMin = getXBorderMin();
  const xBorderMax = getXBorderMax();

  const yBorderMin = getYBorderMin();
  const yBorderMax = getYBorderMax();
  return { xBorderMin, xBorderMax, yBorderMin, yBorderMax };
};

export const lungsFillJob = (volume) => {
  let xDim = volume.m_xDim;
  let yDim = volume.m_yDim;
  let zDim = volume.m_zDim;
  let volTexSrc = volume.m_dataArray;
  let volTexMask = new Uint8Array(xDim * yDim * zDim);
  let volTexMask1 = new Uint8Array(xDim * yDim * zDim);
  let volTexMask2 = new Uint8Array(xDim * yDim * zDim);
  const xyzDim = xDim * yDim * zDim;
  let seedOnCentralSlice = null;
  let seedOnFirstSlice = null;
  let minv = 0;
  let progress = 0;

  const setProgress = (value) => {
    progress = value;
  };
  const getProgress = () => progress;

  const delatation = (boxBorder) => {
    const { xBorderMin, xBorderMax, yBorderMin, yBorderMax } = boxBorder;

    let x, y, z;
    let x1, y1, z1;
    let zOff = 0;
    let yOff = 0;
    let count = 0;
    for (z = 0; z < zDim; z++) {
      for (y = yBorderMin; y < yBorderMax; y++) {
        for (x = xBorderMin; x < xBorderMax; x++) {
          count = 0;
          for (z1 = -1; z1 < 2; z1++) {
            zOff = (z + z1) * xDim * yDim;
            for (y1 = -1; y1 < 2; y1++) {
              yOff = (y + y1) * xDim;
              for (x1 = -1; x1 < 2; x1++) {
                if (volTexMask[x + x1 + yOff + zOff] === 255) {
                  count++;
                }
              }
            }
          }
          volTexMask1[x + y * xDim + z * xDim * yDim] = count > 0 ? 255 : 0;
        }
      }
    }
  };

  const erosion = (boxBorder) => {
    const { xBorderMin, xBorderMax, yBorderMin, yBorderMax } = boxBorder;

    let x, y, z;
    let x1, y1, z1;
    let zOff = 0;
    let yOff = 0;
    let off = 0;
    let count = 0;
    for (z = 0; z < zDim; z++) {
      for (y = yBorderMin; y < yBorderMax; y++) {
        for (x = xBorderMin; x < xBorderMax; x++) {
          off = x + y * xDim + z * xDim * yDim;
          volTexMask2[off] = volTexMask1[off];
          if (volTexMask1[off] !== volTexMask[off]) {
            count = 0;
            for (z1 = -1; z1 < 2; z1++) {
              zOff = (z + z1) * xDim * yDim;
              for (y1 = -1; y1 < 2; y1++) {
                yOff = (y + y1) * xDim;
                for (x1 = -1; x1 < 2; x1++) {
                  if (volTexMask1[x + x1 + yOff + zOff] === 0) {
                    count++;
                  }
                }
              }
            }
            if (count > 0) {
              volTexMask2[off] = 0;
            }
          }
        }
      }
    }
  };

  const run = () => {
    if (getProgress() === 0) {
      seedOnCentralSlice = getSeedPointOnCentralSlice(volTexSrc, xDim, yDim, zDim);
      if (!seedOnCentralSlice) {
        setProgress(0);
        return true;
      }
      // copy dst volume before fill
      for (let i = 0; i < xyzDim; i++) {
        volTexMask[i] = volTexSrc[i];
      }
      setProgress(20);
      return false;
    }

    if (getProgress() === 20) {
      floodFill(xDim, yDim, zDim, volTexMask, seedOnCentralSlice, 40);
      setProgress(50);
      return false;
    }

    if (getProgress() === 50) {
      copyFilled(volTexMask, xyzDim);
      setProgress(80);
      return false;
    }

    if (getProgress() === 80) {
      const boxBorder = detectNonEmptyBox(xDim, yDim, zDim, volTexMask);
      delatation(boxBorder);
      erosion(boxBorder);

      for (let i = 0; i < xyzDim; i++) {
        volTexMask1[i] = volTexSrc[i];
      }

      seedOnFirstSlice = getSeedPointOnFirstSlice(volTexSrc, xDim, yDim, zDim);
      if (!seedOnFirstSlice) {
        setProgress(0);
        return true;
      }

      minv = seedOnFirstSlice.z;
      seedOnFirstSlice.z = 2;
      console.log(`Airway fill run: seed point: ${seedOnFirstSlice.x} ${seedOnFirstSlice.y} ${seedOnFirstSlice}`);

      setProgress(90);
      return false;
    }

    if (getProgress() === 90) {
      floodFill(xDim, yDim, zDim, volTexMask1, seedOnFirstSlice, minv);

      const HALF = 128.0;
      for (let x = 0; x < xyzDim; x++) {
        let val = 0.5 * volTexMask[x];
        if (volTexMask2[x] - volTexMask[x] === 255) {
          val = HALF + volTexSrc[x];
        }
        if (volTexMask1[x] === 255) {
          val = 255;
        }
        volTexSrc[x] = val;
      }
      setProgress(0);
    }

    return true;
  };
  return { run, getProgress };
};
