/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
* Math volume processing tools
* @module lib/scripts/loaders/voltools
*/

// ****************************************************************************
// Imports
// ****************************************************************************

// ****************************************************************************
// Consts
// ****************************************************************************

/** @constant {number} maximum smoothing neighbourhood size */
// eslint-disable-next-line
const GAUSS_SMOOTH_MAX_SIDE = (11 * 2 + 1);

/** @constant {number} maximum side for input volume */
const MAX_VOLUME_SIDE_INPUT = 4096;

// ****************************************************************************
// Classes
// ****************************************************************************

/** Class VolumeTools for some volume math operations */
export default class VolumeTools {

  /**
  * Constructor create array for Gaussian weight koefficients
  */
  constructor() {
    this.m_gaussWeights = new Float32Array(GAUSS_SMOOTH_MAX_SIDE * GAUSS_SMOOTH_MAX_SIDE * GAUSS_SMOOTH_MAX_SIDE);
  }

  /**
  * Smooth volume (3d matrix) with given parameters
  * @param {object} volBuffer - source volume
  * @param {number} xDim - source volume x dimension
  * @param {number} yDim - source volume y dimension
  * @param {number} zDim - source volume z dimension
  * @param {number} gaussRadius - radius for smoothing
  * @param {number} gaussSigma - sigma koefficient for smoothing
  * @return {number} 1, if everything fine
  */
  gaussSmooth(volBuffer,
    xDim,
    yDim,
    zDim,
    gaussRadius,
    gaussSigma) {
    // eslint-disable-next-line
    const side = Math.floor(gaussRadius * 2 + 1);
    // check valid arguments
    const ERR_SIDE = -1;
    const ERR_BAD_SIGMA = -2;
    const ERR_DIM_NEGATIVE = -3;
    const ERR_DIM_LARGE = -4;
    const ERR_VOL_BUF_NULL = -5;
    const ERR_WRONG_BUF_SIZE = -6;
    if (side > GAUSS_SMOOTH_MAX_SIDE) {
      return ERR_SIDE;
    }
    const SIGMA_MIN = 0.0;
    const SIGMA_MAX = 8.0;
    if ((gaussSigma < SIGMA_MIN) || (gaussSigma > SIGMA_MAX)) {
      return ERR_BAD_SIGMA;
    }
    if ((xDim <= 0) || (yDim <= 0) || (zDim <= 0)) {
      return ERR_DIM_NEGATIVE;
    }
    if ((xDim > MAX_VOLUME_SIDE_INPUT) || (yDim > MAX_VOLUME_SIDE_INPUT) || (zDim > MAX_VOLUME_SIDE_INPUT)) {
      return ERR_DIM_LARGE;
    }
    // check valid buffer size
    if (volBuffer === null) {
      return ERR_VOL_BUF_NULL;
    }
    const bufSize = volBuffer.length;
    if (bufSize < xDim * yDim * zDim) {
      return ERR_WRONG_BUF_SIZE;
    }

    const side2 = side * side;
    const side3 = side2 * side;
    // eslint-disable-next-line
    const koefSpatial = 1.0 / (2.0 * gaussSigma * gaussSigma);

    // console.log(`Start Gauss smoothing`);

    const xyzDim = xDim * yDim * zDim;
    const volDst = new Uint8Array(xyzDim);
    // if (volDst === null) {
    //   return -10;
    // }

    // Fill gauss convolution matrix
    let weightSum = 0.0;
    let off = 0;
    for (let z = 0; z < side; z++) {
      const dz = z - gaussRadius;
      for (let y = 0; y < side; y++) {
        const dy = y - gaussRadius;
        for (let x = 0; x < side; x++) {
          const dx = x - gaussRadius;
          const dist2 = dx * dx + dy * dy + dz * dz;
          const w = 1.0 / Math.exp((dist2) * koefSpatial);
          this.m_gaussWeights[off] = w;
          weightSum += this.m_gaussWeights[off];
          off += 1;
        }  // for (x)
      }  // for (y)
    }  // for (z)

    // Normalize gauss matrix
    const scale = 1.0 / weightSum;
    for (let x = 0; x < side3; x++) {
      this.m_gaussWeights[x] *= scale;
    }

    const xyDim = xDim * yDim;
    // process whole image using gauss matrix
    for (let z = 0; z < zDim; z++) {
      for (let y = 0; y < yDim; y++) {
        for (let x = 0; x < xDim; x++) {
          let sum = 0.0;
          let offConv = 0;
          for (let dz = -gaussRadius; dz <= +gaussRadius; dz++) {
            let zz = z + dz;
            zz = (zz < 0) ? 0 : zz;
            zz = (zz >= zDim) ? (zDim - 1) : zz;
            for (let dy = -gaussRadius; dy <= +gaussRadius; dy++) {
              let yy = y + dy;
              yy = (yy < 0) ? 0 : yy;
              yy = (yy >= yDim) ? (yDim - 1) : yy;
              for (let dx = -gaussRadius; dx <= +gaussRadius; dx++) {
                let xx = x + dx;
                xx = (xx < 0) ? 0 : xx;
                xx = (xx >= xDim) ? (xDim - 1) : xx;
                const w = this.m_gaussWeights[offConv];
                offConv += 1;
                const offImage = zz * xyDim + yy * xDim + xx;
                const val = volBuffer[offImage];
                sum += val * w;
              }   // for (dx)
            }     // for (dy)
          }       // for (dz)
          let iSum = Math.floor(sum);
          const MAX_BYTE = 255;
          iSum = (iSum <= MAX_BYTE) ? iSum : MAX_BYTE;
          const offImage = z * xyDim + y * xDim + x;
          volDst[offImage] = iSum;
        }         // for (x)
      }           // for (y)
    }             // for (z)

    // copy filtered volume back to source
    // volBuffer.set(volDst, 0);
    for (let i = 0; i < xyzDim; i++) {
      volBuffer[i] = volDst[i];
    }
    // console.log(`End Gauss smoothing`);
    return 1;
  }

  /**
  * Smooth 1d histogram function
  * @param {object} histSrc - source histogram
  * @param {object} histDst - destination histogram
  * @param {number} numEntries - number of entries in histogram
  * @param {number} gaussSigma - sigma koefficient for smoothing
  * @return {number} 1, if everything fine
  */
  static buildSmoothedHistogram(histSrc, histDst, numEntries, gaussSigma) {
    // check args
    const ERR_NO_SRC = -1;
    const ERR_NO_DST = -2;
    const ERR_SRC_DST_DIF_LEN = -3;
    const ERR_SRC_LEN_NOT_MATCH = -4;
    const ERR_SIGMA_RANGE = -5;
    if (histSrc === null) {
      return ERR_NO_SRC;
    }
    if (histDst === null) {
      return ERR_NO_DST;
    }
    if (histSrc.length !== histDst.length) {
      return ERR_SRC_DST_DIF_LEN;
    }
    if (histSrc.length !== numEntries) {
      return ERR_SRC_LEN_NOT_MATCH;
    }
    const SIGMA_MIN = 0.0;
    const SIGMA_MAX = 64.0;
    if ((gaussSigma < SIGMA_MIN) || (gaussSigma > SIGMA_MAX)) {
      return ERR_SIGMA_RANGE;
    }

    const SIZE_DIV = 60;
    let windowSize = Math.floor(numEntries / SIZE_DIV);
    // avoid too large neighbourhood window size
    const SIZE_LARGE = 32;
    if (windowSize > SIZE_LARGE) {
      windowSize = SIZE_LARGE;
    }

    for (let i = 0; i < numEntries; i++) {
      let sum = 0.0;
      let sumKoef = 0.0;
      for (let j = -windowSize; j <= +windowSize; j++) {
        // t in [-1..+1]
        let t = j / windowSize;
        // t in [0..1]
        t = (t >= 0.0) ? t : -t;
        let idx = i + j;
        idx = (idx >= 0) ? idx : 0;
        idx = (idx < numEntries) ? idx : (numEntries - 1);
        const val = histSrc[idx];
        const koef = Math.exp(-t * gaussSigma);
        sum += val * koef;
        sumKoef += koef;
      } // for j around neighbourhood
      // divide by window range
      // sum /= (2 * windowSize + 1);
      // normalize average
      sum /= sumKoef;
      histDst[i] = Math.floor(sum);
    } // for i all entries
    return 1;
  } // buildSmoothedHistogram

  /**
  * Scale down xy plane twice
  * @param {object} loader - Loader object
  * @param {array} dataArray - sorce volume
  * @return {array} modified (scalewd down) volume
  */
  static scaleDownXYtwice(loader, dataArray) {
    const VAL_2 = 2;
    const VAL_4 = 4;
    const xDim = Math.floor(loader.m_xDim / VAL_2);
    const yDim = Math.floor(loader.m_yDim / VAL_2);
    const zDim = loader.m_zDim;
    // console.log(`Performimg scale down to ${xDim} * ${yDim} ...`);
    const xyDimSrc = loader.m_xDim * loader.m_yDim;
    const xyDimDst = xDim * yDim;
    const dataSizeNew = xDim * yDim * zDim;
    const dataNew = new Uint8Array(dataSizeNew);
    for (let z = 0; z < loader.m_zDim; z++) {
      const offSrcZ = z * xyDimSrc;
      const offDstZ = z * xyDimDst;
      for (let y = 0; y < yDim; y++) {
        const ySrc = y + y;
        const offSrcY = ySrc * loader.m_xDim;
        const offDstY = y * xDim;
        for (let x = 0; x < xDim; x++) {
          const xSrc = x + x;
          const offSrc = offSrcZ + offSrcY + xSrc;
          const aveSrc = (dataArray[offSrc + 0] + dataArray[offSrc + 1] +
            dataArray[offSrc + loader.m_xDim] + dataArray[offSrc + loader.m_xDim + 1]) / VAL_4;
          dataNew[offDstZ + offDstY + x] = aveSrc;
        } // for x
      } // for y
    } // for z all slices
    // assign new array
    loader.m_xDim = xDim;
    loader.m_yDim = yDim;
    if (loader.m_pixelSpacing !== undefined) {
      // number of pixels is twice smaller (on x,y) now:
      // we need to increase size of voxel in physic space to keep correct
      // proportions for the whole volume visualization
      loader.m_pixelSpacing.x *= 2.0;
      loader.m_pixelSpacing.y *= 2.0;
    }
    return dataNew;
  }
  /**
  * Scale down
  * @param {object} loader - Loader object
  * @param {array} pixelSrc - source volume pixels
  * @param {number} xDimDst - destination volume size on x
  * @param {number} yDimDst - destination volume size on y
  * @param {number} zDimDst - destination volume size on z
  * @return {array} modified (scaled) volume
  */
  static scaleTextureDown(loader, pixelsSrc, xDimDst, yDimDst, zDimDst) {
    const ACC_BITS = 10;
    const ACC_HALF = 1 << (ACC_BITS - 1);
    const xyzDimDst = xDimDst * yDimDst * zDimDst;
    const pixelsDst = new Uint8Array(xyzDimDst);

    const xDimSrc = loader.m_xDim;
    const yDimSrc = loader.m_yDim;
    const zDimSrc = loader.m_zDim;

    const isCorrectDim = (xDimSrc > xDimDst) || (yDimSrc > yDimDst) || (zDimSrc > zDimDst);
    if (!isCorrectDim) {
      return null;
    }
    const xyDimSrc = xDimSrc * yDimSrc;

    const xStep = Math.floor((xDimSrc << ACC_BITS) / xDimDst);
    const yStep = Math.floor((yDimSrc << ACC_BITS) / yDimDst);
    const zStep = Math.floor((zDimSrc << ACC_BITS) / zDimDst);
    let indDst = 0;
    let zSrcAccL = ACC_HALF;
    let zSrcAccH = zSrcAccL + zStep;
    for (let zDst = 0; zDst < zDimDst; zDst++, zSrcAccL += zStep, zSrcAccH += zStep) {
      const zSrcL = zSrcAccL >> ACC_BITS;
      const zSrcH = zSrcAccH >> ACC_BITS;

      let ySrcAccL = ACC_HALF;
      let ySrcAccH = ySrcAccL + yStep;
      for (let yDst = 0; yDst < yDimDst; yDst++, ySrcAccL += yStep, ySrcAccH += yStep) {
        const ySrcL = ySrcAccL >> ACC_BITS;
        const ySrcH = ySrcAccH >> ACC_BITS;

        let xSrcAccL = ACC_HALF;
        let xSrcAccH = xSrcAccL + xStep;
        for (let xDst = 0; xDst < xDimDst; xDst++, xSrcAccL += xStep, xSrcAccH += xStep) {
          const xSrcL = xSrcAccL >> ACC_BITS;
          const xSrcH = xSrcAccH >> ACC_BITS;

          // Accumulate sum
          let sum = 0;
          let numPixels = 0;
          for (let z = zSrcL, zOff = zSrcL * xyDimSrc; z < zSrcH; z++, zOff += xyDimSrc) {
            for (let y = ySrcL, yOff = ySrcL * xDimSrc; y < ySrcH; y++, yOff += xDimSrc) {
              for (let x = xSrcL; x < xSrcH; x++) {
                const offSrc = x + yOff + zOff;
                sum += pixelsSrc[offSrc];
                numPixels++;
              } // for (x)
            }  // for (y)
          }  // for (z)
          sum = Math.floor(sum / numPixels);
          pixelsDst[indDst++] = sum;
        } // for (xDst)
      }  // for (yDst)
    }  // for (zDst)
    loader.m_xDim = xDimDst;
    loader.m_yDim = yDimDst;
    loader.m_zDim = zDimDst;
    return pixelsDst;
  }  // end of scaleTextureDown

  /**
  * Scale down
  * @param {array} pixelSrc - source volume pixels
  * @param {number} xDimSrc - destination volume size on x
  * @param {number} yDimSrc - destination volume size on y
  * @param {number} zDimSrc - destination volume size on z
  */
  static scaleDown(pixelsSrc, xDimSrc, yDimSrc, zDimSrc, pixelsDst, xScale, yScale, zScale) {
    const xDimDst = Math.floor(xDimSrc / xScale);
    const yDimDst = Math.floor(yDimSrc / yScale);
    const zDimDst = Math.floor(zDimSrc / zScale);
    let offDst = 0;
    for (let z = 0; z < zDimDst; z++) {
      const zSrcMin = (z + 0) * zScale;
      const zSrcMax = (z + 1) * zScale;
      for (let y = 0; y < yDimDst; y++) {
        const ySrcMin = (y + 0) * yScale;
        const ySrcMax = (y + 1) * yScale;
        for (let x = 0; x < xDimDst; x++) {
          const xSrcMin = (x + 0) * xScale;
          const xSrcMax = (x + 1) * xScale;

          // get ave value
          let valAve = 0;
          let numPixelsAve = 0;

          for (let zz = zSrcMin; zz < zSrcMax; zz++) {
            const zOff = zz * xDimSrc * yDimSrc;
            for (let yy = ySrcMin; yy < ySrcMax; yy++) {
              const yOff = yy * xDimSrc;
              for (let xx = xSrcMin; xx < xSrcMax; xx++) {
                const offSrc = xx + yOff + zOff;
                const val = pixelsSrc[offSrc];
                valAve += val;
                numPixelsAve++;
              }   // for (xx)
            }     // for (yy)
          }       // for (zz)
          valAve /= numPixelsAve;
          pixelsDst[offDst++] = Math.floor(valAve);
        } // for (x)
      } // for (y)
    } // for (z)
  }

  /**
  * Contrast enhance by unsharpen mask
  *
  * Wiki ref: https://en.wikipedia.org/wiki/Unsharp_masking
  *
  * main formula: sharpened =
  *                           original + (original - blurred) * multiplier, if (original - blurred > EPS)
  *                           original, otherwise
  *
  * @param {array} pixelsSrc - source volume pixels
  * @param {number} xDim - volume size on x
  * @param {number} yDim - volume size on y
  * @param {number} zDim - volume size on z
  * @param {array} pixelsDst - destination pixels
  * @param {number} radSmooth - radius of smoothing for unsharp mask
  * @param {number} sigmaSmooth - smoothing sigma for unsharp mask
  * @param {number} multiplier - multiplier for formula above
  * @return {number} 1, if OK
  */
  static contrastEnchanceUnsharpMask(pixelsSrc,
    xDim,
    yDim,
    zDim,
    pixelsDst,
    radSmooth,
    sigmaSmooth,
    multiplier,
    needConsoleLog = false) {
    // check input arguments
    if ((typeof xDim !== 'number') || (typeof yDim !== 'number') || (typeof zDim !== 'number')) {
      return VolumeTools.VOLTOOLS_ERROR_BAD_NUMBER;
    }
    if (typeof pixelsSrc !== 'object') {
      return VolumeTools.VOLTOOLS_ERROR_BAD_ARRAY;
    }
    if (typeof pixelsDst !== 'object') {
      return VolumeTools.VOLTOOLS_ERROR_BAD_ARRAY;
    }
    if (multiplier < 1.0) {
      return VolumeTools.VOLTOOLS_ERROR_BAD_MULTIPLIER;
    }
    const MAX_POSSIBLE_MULTIPLIER = 256.0;
    if (multiplier >= MAX_POSSIBLE_MULTIPLIER) {
      return VolumeTools.VOLTOOLS_ERROR_BAD_MULTIPLIER;
    }
    if ((xDim <= 1) || (yDim <= 1) || (zDim <= 1)) {
      return VolumeTools.VOLTOOLS_ERROR_BAD_DIMENSION;
    }
    const MAX_POSSIBLE_DIM = 4096;
    if ((xDim >= MAX_POSSIBLE_DIM) || (yDim >= MAX_POSSIBLE_DIM) || (zDim >= MAX_POSSIBLE_DIM)) {
      return VolumeTools.VOLTOOLS_ERROR_BAD_DIMENSION;
    }
    const TWO = 2;
    const side = TWO * radSmooth + 1;
    const side3 = side * side * side;
    const xyDim = xDim * yDim;

    // allocate gauss convolution 3d matrix
    const gaussWeights = new Float32Array(side3);

    // flll gauss convolution matrix
    const koefSpatial = 1.0 / (TWO * sigmaSmooth * sigmaSmooth);
    let weightSum = 0.0;
    let off = 0;
    for (let z = 0; z < side; z++) {
      const dz = z - radSmooth;
      for (let y = 0; y < side; y++) {
        const dy = y - radSmooth;
        for (let x = 0; x < side; x++) {
          const dx = x - radSmooth;
          const dist2 = 1.0 * dx * dx + dy * dy + dz * dz;
          const w = 1.0 / Math.exp((dist2) * koefSpatial);
          gaussWeights[off] = w;
          weightSum += gaussWeights[off];
          off++;
        }   // for (x)
      }     // for (y)
    }       // for (z)
    // Normalize gauss matrix
    const scale = 1.0 / weightSum;
    for (let x = 0; x < side3; x++) {
      gaussWeights[x] *= scale;
    }
    // Process image
    for (let zc = 0; zc < zDim; zc++) {
      for (let yc = 0; yc < yDim; yc++) {
        for (let xc = 0; xc < xDim; xc++) {
          let valSmoothed = 0.0;
          let offConv = 0;
          for (let dz = -radSmooth; dz <= +radSmooth; dz++) {
            let z = zc + dz;
            z = (z < 0) ? 0 : (z >= zDim) ? (zDim - 1) : z;
            const zOff = z * xyDim;
            for (let dy = -radSmooth; dy <= +radSmooth; dy++) {
              let y = yc + dy;
              y = (y < 0) ? 0 : (y >= yDim) ? (yDim - 1) : y;
              const yOff = y * xDim;
              for (let dx = -radSmooth; dx <= +radSmooth; dx++) {
                let x = xc + dx;
                x = (x < 0) ? 0 : (x >= xDim) ? (xDim - 1) : x;

                const w = gaussWeights[offConv];
                offConv++;
                const offImage = x + yOff + zOff;
                const val = pixelsSrc[offImage];
                valSmoothed += w * val;

              } // for (dx)
            } // for (dy)
          } // for (dz)

          // now valSmoothed is smoothed pixel intensity at (xc, yc)
          off = xc + yc * xDim + zc * xyDim;
          let val = pixelsSrc[off];
          const valDif = val - valSmoothed;
          const MIN_DIF_UNSHARP_VAL = 2.0;
          const valAdd = ((valDif > MIN_DIF_UNSHARP_VAL) || (valDif < -MIN_DIF_UNSHARP_VAL)) ?
            (valDif * multiplier) : 0.0;
          let  valSharpened = val + valAdd;
          valSharpened = (valSharpened < 0.0) ? 0.0 : valSharpened;
          val = Math.floor(valSharpened);
          const MAX_COLOR = 255;
          val = (val > MAX_COLOR) ? MAX_COLOR : val;
          pixelsDst[off] = val;
          if (needConsoleLog) {
            const MASK_MANY = 16383;
            if ((off & MASK_MANY) === 0) {
              const HUNDR = 100.0;
              const ratioPrc = off * HUNDR / (xDim * yDim * zDim);
              console.log(`contrastEnchanceUnsharpMask: ${ratioPrc} %`);
            }
          } // if ned console
        } // for (xc)
      }  // for (yc)
    }  // for (zc)

    return VolumeTools.VOLTOOLS_ERROR_OK;
  }
  /**
  * Make texture size (z dimension) even number.
  * Odd numbers are lead to render artifacts during 3d texture packing into 2d texture.
  * @param {array} pixelsSrc - source volume pixels
  * @param {number} xDim - volume size on x
  * @param {number} yDim - volume size on y
  * @param {number} zDim - volume size on z
  */
  static makeTextureSizeEven(pixelsSrc, xDim, yDim, zDim) {
    const BYTES_IN_DWORD = 4;
    const NUM3 = 3;
    if (((xDim % BYTES_IN_DWORD) === 0) && ((yDim % BYTES_IN_DWORD) === 0) && ((zDim % BYTES_IN_DWORD) === 0)) {
      return pixelsSrc;
    }
    const xDimNew = (xDim + NUM3) & (~NUM3);
    const yDimNew = (yDim + NUM3) & (~NUM3);
    const zDimNew = (zDim + NUM3) & (~NUM3);

    const numPixelsNew = xDimNew * yDimNew * zDimNew;
    const pixelsDst = new Uint8Array(numPixelsNew);

    let i;
    for (i = 0; i < numPixelsNew; i++) {
      pixelsDst[i] = 0;
    }

    for (let z = 0; z < zDim; z++) {
      const zOffSrc = z * xDim * yDim;
      const zOffDst = z * xDimNew * yDimNew;
      for (let y = 0; y < yDim; y++) {
        const yOffSrc = y * xDim;
        const yOffDst = y * xDimNew;
        for (let x = 0; x < xDim; x++) {
          const offSrc = x + yOffSrc + zOffSrc;
          const val = pixelsSrc[offSrc];
          const offDst = x + yOffDst + zOffDst;
          pixelsDst[offDst] = val;
        }
      }
    }

    console.log(`modified texture size is: ${xDimNew} * ${yDimNew} * ${zDimNew}`);
    return pixelsDst;
  } // makeTextureSizeEven

  /**
  * Extract 2d texture from normal 3d array
  * @param {number} xDim - volume dimension x
  * @param {number} yDim - volume dimension x
  * @param {number} zDim - volume dimension x
  * @param {array} pixelsSrc - volume array of ARGB pixels (xDim * yDim * zDim)
  * @param {number} sliceType - plane index. 0: x, 1: y, 2: z
  * @param {number} sliceINdex - number of required slice
  * @param {array} pixelsDst - result 2d image in ARGB format
  */
  static extract2dSliceFrom3dTexture(xDim, yDim, zDim, pixelsSrc, sliceType, sliceIndex, pixelsDst) {
    const BYTES_IN_DWORD = 4;
    const numPixVol = xDim * yDim * zDim;
    if (numPixVol * BYTES_IN_DWORD !== pixelsSrc.length) {
      console.log(`!!! wrong volume texture size: ${numPixVol}`);
    }
    const X_SLICE = 0;
    const Y_SLICE = 1;
    const Z_SLICE = 2;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    const OFF_3 = 3;
    const VAL255 = 255;
    if (sliceType === X_SLICE) {
      const x = sliceIndex;
      console.log(`x slice is: ${x} from ${xDim}*${yDim}*${zDim} volume`);
      const w = yDim;
      const h = zDim;
      let cx, cy;
      let j = 0;
      for (cy = 0; cy < h; cy++) {
        const zOff = cy * xDim * yDim;
        for (cx = 0; cx < w; cx++) {
          const yOff = cx * xDim;
          const off = zOff + yOff + x;
          const off4 = off * BYTES_IN_DWORD;
          pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_0];
          pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_1];
          pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_2];
          pixelsDst[j + OFF_3] = VAL255;
          j += BYTES_IN_DWORD;
        } // for (x)
      } // for (y)
    } // if x slice

    if (sliceType === Y_SLICE) {
      const y = sliceIndex;
      const yOff = y * xDim;
      console.log(`y slice is: ${y} from ${xDim}*${yDim}*${zDim} volume`);
      const w = xDim;
      const h = zDim;
      let cx, cy;
      let j = 0;
      for (cy = 0; cy < h; cy++) {
        const zOff = cy * xDim * yDim;
        for (cx = 0; cx < w; cx++) {
          const xOff = cx;
          const off = zOff + yOff + xOff;
          const off4 = off * BYTES_IN_DWORD;
          pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_0];
          pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_1];
          pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_2];
          pixelsDst[j + OFF_3] = VAL255;
          j += BYTES_IN_DWORD;
        } // for (x)
      } // for (y)
    } // if x slice

    if (sliceType === Z_SLICE) {
      const z = sliceIndex;
      console.log(`z slice is: ${z} from ${xDim}*${yDim}*${zDim} volume`);
      const zOff = z * xDim * yDim;
      const w = xDim;
      const h = yDim;
      let x, y;
      let j = 0;
      for (y = 0; y < h; y++) {
        const yOff = y * xDim;
        for (x = 0; x < w; x++) {
          const off = zOff + yOff + x;
          const off4 = off * BYTES_IN_DWORD;
          pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_0];
          pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_1];
          pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_2];
          pixelsDst[j + OFF_3] = VAL255;
          j += BYTES_IN_DWORD;
        } // for (x)
      } // for (y)
    } // if z slice
  } // end of extract2dSliceFrom3dTexture

  /**
  * Get 2d coordinate in tiled texture from original 3d coordinate
  * @param {number} xDim - volume dimension x
  * @param {number} yDim - volume dimension x
  * @param {number} zDim - volume dimension x
  * @param {number} tilesHor - number of tiles
  * @param {number} fx - texture coordinate in 3d
  * @param {number} fy - texture coordinate in 3d
  * @param {number} fz - texture coordinate in 3d
  * @param {object} vec2coord - output 2d coordinates
  */
  static get2dCoordFromTiled3dCoord(xDim, yDim, zDim, tilesHor, fx, fy, fz, vec2coord) {
    const tileScale = 1.0 / tilesHor;
    let x = fx * tileScale;
    let y = fy * tileScale;
    const zSliceIndex = Math.floor(fz * zDim);
    // add tile x corner
    x += (zSliceIndex % tilesHor) * tileScale;
    // add tile y corner
    y += Math.floor(zSliceIndex / tilesHor) * tileScale;
    // add some 0.5 value
    const xSize = xDim * tilesHor;
    const ySize = yDim * tilesHor;
    const HALF = 0.5;
    x += HALF / xSize;
    y += HALF / ySize;
    // assign to destination 2d coords
    vec2coord.x = x;
    vec2coord.y = y;
  }

  /**
  * Extract 2d texture from normal 3d array
  * @param {number} xDim - volume dimension x
  * @param {number} yDim - volume dimension x
  * @param {number} zDim - volume dimension x
  * @param {array} pixelsSrc - tiled 2d matrix of ARGB pixels, made from source 3d texture
  * @param {number} sliceType - plane index. 0: x, 1: y, 2: z
  * @param {number} sliceIndex - number of required slice
  * @param {array} pixelsDst - result 2d image in ARGB format
  * @param {number} isRoi - is palette should be applied to data or not
  */
  static extract2dSliceFromTiled3dTexture(xDim, yDim, zDim, pixelsSrc, sliceType, sliceIndex, pixelsDst, isRoi) {
    const BYTES_IN_DWORD = 4;
    //const zDimSqrt = Math.ceil(Math.sqrt(zDim));
    const TWO = 2;
    const ONE = 1;
    const zDimSqrt = TWO ** (ONE + Math.floor(Math.log(Math.sqrt(zDim)) / Math.log(TWO)));
    const lenSrc = pixelsSrc.length;
    const xSize = xDim * zDimSqrt;
    const ySize = yDim * zDimSqrt;
    if (lenSrc !== xSize * ySize * BYTES_IN_DWORD) {
      console.log(`Wrong 2d tiled vol size. Size = ${lenSrc}`);
    }
    const X_SLICE = 0;
    const Y_SLICE = 1;
    const Z_SLICE = 2;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    const OFF_3 = 3;
    const VAL255 = 255;
    if (sliceType === X_SLICE) {
      const fx = sliceIndex / xDim;
      console.log(`extract2dSlice... fx = ${fx}`);
      let cx, cy;
      const w = yDim;
      const h = zDim;
      let j = 0;
      for (cy = 0; cy < h; cy++) {
        const fz = cy / h;
        for (cx = 0; cx < w; cx++) {
          const fy = cx / w;
          const vec2coord = {
            x: 0.0,
            y: 0.0
          };
          VolumeTools.get2dCoordFromTiled3dCoord(xDim, yDim, zDim, zDimSqrt, fx, fy, fz, vec2coord);
          const ux = Math.floor(vec2coord.x * xSize);
          const uy = Math.floor(vec2coord.y * ySize);
          const off = ux + uy * xSize;
          const off4 = off * BYTES_IN_DWORD;
          if (isRoi) {
            pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_0];
            pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_1];
            pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_2];
            pixelsDst[j + OFF_3] = VAL255;
          } else {
            pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_3] = VAL255;
          }
          j += BYTES_IN_DWORD;
        }
      }
    } // if x slice
    if (sliceType === Y_SLICE) {
      const fy = sliceIndex / yDim;
      console.log(`extract2dSlice... fy = ${fy}`);
      let cx, cy;
      const w = xDim;
      const h = zDim;
      let j = 0;
      for (cy = 0; cy < h; cy++) {
        const fz = cy / h;
        for (cx = 0; cx < w; cx++) {
          const fx = cx / w;
          const vec2coord = {
            x: 0.0,
            y: 0.0
          };
          VolumeTools.get2dCoordFromTiled3dCoord(xDim, yDim, zDim, zDimSqrt, fx, fy, fz, vec2coord);
          const ux = Math.floor(vec2coord.x * xSize);
          const uy = Math.floor(vec2coord.y * ySize);
          const off = ux + uy * xSize;
          const off4 = off * BYTES_IN_DWORD;
          if (isRoi) {
            pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_0];
            pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_1];
            pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_2];
            pixelsDst[j + OFF_3] = VAL255;
          } else {
            pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_3] = VAL255;
          }
          j += BYTES_IN_DWORD;
        }
      }
    } // if y slice
    if (sliceType === Z_SLICE) {
      const fz = sliceIndex / zDim;
      console.log(`extract2dSlice... fz = ${fz}. dim = ${xDim}*${yDim}*${zDim}. zDimSqrt = ${zDimSqrt}`);
      let cx, cy;
      const w = xDim;
      const h = yDim;
      let j = 0;
      for (cy = 0; cy < h; cy++) {
        const fy = cy / h;
        for (cx = 0; cx < w; cx++) {
          const fx = cx / w;
          const vec2coord = {
            x: 0.0,
            y: 0.0
          };
          VolumeTools.get2dCoordFromTiled3dCoord(xDim, yDim, zDim, zDimSqrt, fx, fy, fz, vec2coord);
          const ux = Math.floor(vec2coord.x * xSize);
          const uy = Math.floor(vec2coord.y * ySize);
          const off = ux + uy * xSize;
          const off4 = off * BYTES_IN_DWORD;
          if (isRoi) {
            pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_0];
            pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_1];
            pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_2];
            pixelsDst[j + OFF_3] = VAL255;
          } else {
            pixelsDst[j + OFF_0] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_1] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_2] = pixelsSrc[off4 + OFF_3];
            pixelsDst[j + OFF_3] = VAL255;
          }
          j += BYTES_IN_DWORD;
        }
      }
    } // if z slice
  }

  /**
  * Show debugged texture (2d slice) in special container. Need to deeb debug only
  * @param {number} xDim - 2d image dimension x
  * @param {number} yDim - 2d image dimension y
  * @param {array} pixelsSrc - array of ARGB pixels
  */
  static showTexture2d(xDim, yDim, pixelsSrc) {
    // check correct buffer size
    const FOUR = 4;
    const numPixSrc = xDim * yDim * FOUR;
    if (numPixSrc !== pixelsSrc.length) {
      console.log(`!!! wrong volume texture size: ${numPixSrc}`);
    }
    const containter3d = $('#med3web-container-3d');
    const containter2d = $('#med3web-container-2d');
    const elemDiv = $('#med3web-container-debug');

    containter3d.hide();
    containter2d.hide();
    elemDiv.show();

    // const containterCanvas = document.getElementById('canvas');
    const elemCanvas = $('#med3web-canvas');
    elemCanvas.width(xDim).height(yDim);
    const ctx = document.getElementById('med3web-canvas').getContext('2d');

    const idata = ctx.createImageData(xDim, yDim);
    idata.data.set(pixelsSrc);
    ctx.putImageData(idata, 0, 0);
    return 1;
  } // showTexture2d

  /**
  * Test int value: is this 2^N
  * @param {number} val - tested value
  * @return  {boolean} Is power of 2 or not
  */
  static isPowerOfTwo(val) {
    const MAX_PWR = 31;
    for (let i = 1; i < MAX_PWR; i++) {
      const vpwr = 1 << i;
      if (val === vpwr) {
        return true;
      }
    }
    return false;
  }

  /**
  * Get closest power of 2: greater or equal then imput argument
  * @param {number} val - tested value
  * @return  {number} Closest (greater or equal) power of two
  */
  static getGreatOrEqualPowerOfTwo(val) {
    const MAX_PWR = 31;
    for (let i = 1; i < MAX_PWR; i++) {
      const vpwr = 1 << i;
      if (val === vpwr) {
        return val;
      }
      const vpwrNext = 1 << (i + 1);
      if ((val > vpwr) && (val < vpwrNext)) {
        return vpwrNext;
      }
    }
    return -1;
  }

  /**
  * Get closest power of 2: less or equal then imput argument
  * @param {number} val - tested value
  * @return  {number} Closest (less or equal) power of two
  */
  static getLessOrEqualPowerOfTwo(val) {
    const MAX_PWR = 31;
    for (let i = MAX_PWR; i > 0; i--) {
      const vpwr = 1 << i;
      if (val === vpwr) {
        return val;
      }
      const vpwrLess = 1 << (i - 1);
      if ((val > vpwrLess) && (val < vpwr)) {
        return vpwrLess;
      }
    }
    return -1;
  }

  /**
  * Make texture size equal to power of 2 for x, y dimensions
  * @param {array} pixelsSrc - source volume pixels
  * @param {number} xDimSrc - volume size on x
  * @param {number} yDimSrc - volume size on y
  * @param {number} zDimSrc - volume size on z
  * @param {number} xDimDst - new x dimension
  * @param {number} yDimDst - new y dimension
  * @return {array} new array
  */
  static makeTextureSizePowerOfTwoUp(pixelsSrc, xDimSrc, yDimSrc, zDimSrc, xDimDst, yDimDst) {
    const zDimDst = zDimSrc;
    const HALF = 2;
    if (xDimDst < xDimSrc) {
      console.log(`Error: ${xDimDst} < ${xDimSrc}`);
    }
    if (yDimDst < yDimSrc) {
      console.log(`Error: ${yDimDst} < ${yDimSrc}`);
    }
    const xShift =  Math.floor((xDimDst - xDimSrc) / HALF);
    const yShift =  Math.floor((yDimDst - yDimSrc) / HALF);
    const numPixelsSrc = xDimSrc * yDimSrc * zDimSrc;
    const numBytesPerPixel = Math.floor(pixelsSrc.length / numPixelsSrc);
    const FOUR = 4;
    if ((numBytesPerPixel !== 1) && (numBytesPerPixel !== FOUR)) {
      console.log(`Error source volume bpp:  = ${xDimSrc} * ${yDimSrc} * ${zDimSrc}, bpp = ${numBytesPerPixel}`);
    }
    const numPixelsDst = xDimDst * yDimDst * zDimDst * numBytesPerPixel;
    const pixelsDst = new Uint8Array(numPixelsDst);
    let i;
    for (i = 0; i < numPixelsDst; i++) {
      pixelsDst[i] = 0;
    }
    let offSrc = 0;
    if (numBytesPerPixel === 1) {
      for (let z = 0; z < zDimSrc; z++) {
        const zOffDst = z * xDimDst * yDimDst;
        for (let y = 0; y < yDimSrc; y++) {
          const yOffDst = (y + yShift) * xDimDst;
          let offDst = xShift + yOffDst + zOffDst;
          for (let x = 0; x < xDimSrc; x++, offDst++) {
            const val = pixelsSrc[offSrc];
            pixelsDst[offDst] = val;
            offSrc++;
          } // for (x) source
        } // for (y) source
      } // for (z) source
    } else if (numBytesPerPixel === FOUR) {
      for (let z = 0; z < zDimSrc; z++) {
        const zOffDst = z * xDimDst * yDimDst;
        for (let y = 0; y < yDimSrc; y++) {
          const yOffDst = (y + yShift) * xDimDst;
          let offDst = xShift + yOffDst + zOffDst;
          for (let x = 0; x < xDimSrc; x++, offDst++) {
            let offSrc4 = offSrc + offSrc + offSrc + offSrc;
            let offDst4 = offDst + offDst + offDst + offDst;
            let val;

            val = pixelsSrc[offSrc4];
            pixelsDst[offDst4] = val;
            offSrc4++;
            offDst4++;

            val = pixelsSrc[offSrc4];
            pixelsDst[offDst4] = val;
            offSrc4++;
            offDst4++;

            val = pixelsSrc[offSrc4];
            pixelsDst[offDst4] = val;
            offSrc4++;
            offDst4++;

            val = pixelsSrc[offSrc4];
            pixelsDst[offDst4] = val;

            offSrc++;
          } // for (x) source
        } // for (y) source
      } // for (z) source
    }
    return pixelsDst;
  } // end of makeTextureSizePowerOfTwoUp
  /**
   *
  * Make texture size equal to power of 2 for x, y dimensions
  * @param {array} pixelsSrc - source volume pixels
  * @param {number} xDimSrc - volume size on x
  * @param {number} yDimSrc - volume size on y
  * @param {number} zDimSrc - volume size on z
  * @param {number} xDimDst - new x dimension
  * @param {number} yDimDst - new y dimension
  * @return {array} new array
  */
  static makeTextureSizePowerOfTwoDown(pixelsSrc, xDimSrc, yDimSrc, zDimSrc, xDimDst, yDimDst) {
    const zDimDst = zDimSrc;
    if (xDimDst >= xDimSrc) {
      console.log(`Error: ${xDimDst} >= ${xDimSrc}`);
    }
    if (yDimDst >= yDimSrc) {
      console.log(`Error: ${yDimDst} >= ${yDimSrc}`);
    }
    const xScale = xDimSrc / xDimDst;
    const yScale = yDimSrc / yDimDst;
    const numPixelsSrc = xDimSrc * yDimSrc * zDimSrc;
    const numBytesPerPixel = Math.floor(pixelsSrc.length / numPixelsSrc);
    const FOUR = 4;
    if ((numBytesPerPixel !== 1) && (numBytesPerPixel !== FOUR)) {
      console.log(`Error source volume bpp:  = ${xDimSrc} * ${yDimSrc} * ${zDimSrc}, bpp = ${numBytesPerPixel}`);
    }
    const numPixelsDst = xDimDst * yDimDst * zDimDst * numBytesPerPixel;
    const pixelsDst = new Uint8Array(numPixelsDst);
    let i;
    for (i = 0; i < numPixelsDst; i++) {
      pixelsDst[i] = 0;
    }
    let offDst = 0;
    if (numBytesPerPixel === 1) {
      for (let z = 0; z < zDimDst; z++) {
        const zOffSrc = z * xDimSrc * yDimSrc;
        for (let y = 0; y < yDimDst; y++) {

          const ySrcMin = Math.floor((y + 0) * yScale);
          const ySrcMax = Math.floor((y + 1) * yScale);

          for (let x = 0; x < xDimDst; x++) {

            const xSrcMin = Math.floor((x + 0) * xScale);
            const xSrcMax = Math.floor((x + 1) * xScale);

            let val = 0; let numPix = 0;
            for (let ySrc = ySrcMin; ySrc < ySrcMax; ySrc++) {
              for (let xSrc = xSrcMin; xSrc < xSrcMax; xSrc++) {
                const offSrc = zOffSrc + (ySrc * xDimSrc) + xSrc;
                val += pixelsSrc[offSrc];
                numPix++;
              }   // for xSrc
            }     // for ySrc
            val /= numPix;
            pixelsDst[offDst] = val;
            offDst++;
          } // for (x) source
        } // for (y) source
      } // for (z) source
    } else if (numBytesPerPixel === FOUR) {
      for (let z = 0; z < zDimDst; z++) {
        const zOffSrc = z * xDimSrc * yDimSrc;
        for (let y = 0; y < yDimDst; y++) {

          const ySrcMin = Math.floor((y + 0) * yScale);
          const ySrcMax = Math.floor((y + 1) * yScale);

          for (let x = 0; x < xDimDst; x++, offDst++) {

            const xSrcMin = Math.floor((x + 0) * xScale);
            const xSrcMax = Math.floor((x + 1) * xScale);

            let valA = 0; let valR = 0;
            let valG = 0; let valB = 0;
            let numPix = 0;

            for (let ySrc = ySrcMin; ySrc < ySrcMax; ySrc++) {
              for (let xSrc = xSrcMin; xSrc < xSrcMax; xSrc++) {
                let offSrc = (zOffSrc + (ySrc * xDimSrc) + xSrc) * FOUR;
                valB += pixelsSrc[offSrc]; offSrc++;
                valG += pixelsSrc[offSrc]; offSrc++;
                valR += pixelsSrc[offSrc]; offSrc++;
                valA += pixelsSrc[offSrc];
                numPix++;
              }   // for xSrc
            }     // for ySrc
            valB /= numPix;
            valG /= numPix;
            valR /= numPix;
            valA /= numPix;
            pixelsDst[offDst] = valB;
            offDst++;
            pixelsDst[offDst] = valG;
            offDst++;
            pixelsDst[offDst] = valR;
            offDst++;
            pixelsDst[offDst] = valA;
            offDst++;

          } // for (x) source
        } // for (y) source
      } // for (z) source
    }
    return pixelsDst;

    /*
    let offDst = 0;
    for (let z = 0; z < zDimDst; z++) {
      const zSrcMin = (z + 0) * zScale;
      const zSrcMax = (z + 1) * zScale;
      for (let y = 0; y < yDimDst; y++) {
        const ySrcMin = (y + 0) * yScale;
        const ySrcMax = (y + 1) * yScale;
        for (let x = 0; x < xDimDst; x++) {
          const xSrcMin = (x + 0) * xScale;
          const xSrcMax = (x + 1) * xScale;

          // get ave value
          let valAve = 0;
          let numPixelsAve = 0;

          for (let zz = zSrcMin; zz < zSrcMax; zz++) {
            const zOff = zz * xDimSrc * yDimSrc;
            for (let yy = ySrcMin; yy < ySrcMax; yy++) {
              const yOff = yy * xDimSrc;
              for (let xx = xSrcMin; xx < xSrcMax; xx++) {
                const offSrc = xx + yOff + zOff;
                const val = pixelsSrc[offSrc];
                valAve += val;
                numPixelsAve++;
              }   // for (xx)
            }     // for (yy)
          }       // for (zz)
          valAve /= numPixelsAve;
          pixelsDst[offDst++] = Math.floor(valAve);
        } // for (x)
      } // for (y)
    } // for (z)
    */
  }

  /**
  * Scan volume for non-empty box (with non-zero voxels)
  * fill resul in [0..1] range. Use 8 as "black" color barrier
  * @param {array} pixelsSrc - source volume pixels
  * @param {number} xDim - volume size on x
  * @param {number} yDim - volume size on y
  * @param {number} zDim - volume size on z
  * @param {number} boxMin - Object (x,y,z) with minumim non-empty box coords
  * @param {number} boxMax - Object (x,y,z) with maximum non-empty box coords
  */
  static detectNonEmptyBox(pixelsSrc, xDim, yDim, zDim, boxMin, boxMax) {
    const MIN_VAL_BARRIER = 8;
    const TWICE = 2;
    const FOUR = 4;
    const xyDim = xDim * yDim;
    const xDimHalf = Math.floor(xDim / TWICE);
    const yDimHalf = Math.floor(yDim / TWICE);
    const zDimHalf = Math.floor(zDim / TWICE);
    let x, y, z;
    let isEmpty;

    let xBorderMin = 0;
    let yBorderMin = 0;
    let zBorderMin = 0;
    let xBorderMax = 0;
    let yBorderMax = 0;
    let zBorderMax = 0;

    const numBytesPerPixel = Math.floor(pixelsSrc.length / (xDim * yDim * zDim));
    if (numBytesPerPixel === 1) {
      isEmpty = true;
      for (x = 0; (x < xDimHalf) && isEmpty; x++) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      xBorderMin = x;

      isEmpty = true;
      for (x = xDim - 1; (x > xDimHalf) && (isEmpty); x--) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      xBorderMax = x;

      isEmpty = true;
      for (y = 0; (y < yDimHalf) && (isEmpty); y++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      yBorderMin = y;

      isEmpty = true;
      for (y = yDim - 1; (y > yDimHalf) && (isEmpty); y--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      yBorderMax = y;

      isEmpty = true;
      for (z = 0; (z < zDimHalf) && (isEmpty); z++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (y = 0; (y < yDim) && (isEmpty); y++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      zBorderMin = z;

      isEmpty = true;
      for (z = zDim - 1; (z > zDimHalf) && (isEmpty); z--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (y = 0; (y < yDim) && (isEmpty); y++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      zBorderMax = z;
    } else if (numBytesPerPixel === FOUR) {
      // 4 bpp image scan
      const OFF_3 = 3;
      isEmpty = true;
      for (x = 0; (x < xDimHalf) && isEmpty; x++) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off * FOUR + OFF_3] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      xBorderMin = x;

      isEmpty = true;
      for (x = xDim - 1; (x > xDimHalf) && (isEmpty); x--) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off * FOUR + OFF_3] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      xBorderMax = x;

      isEmpty = true;
      for (y = 0; (y < yDimHalf) && (isEmpty); y++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off * FOUR + OFF_3] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      yBorderMin = y;

      isEmpty = true;
      for (y = yDim - 1; (y > yDimHalf) && (isEmpty); y--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off * FOUR + OFF_3] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      yBorderMax = y;

      isEmpty = true;
      for (z = 0; (z < zDimHalf) && (isEmpty); z++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (y = 0; (y < yDim) && (isEmpty); y++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off * FOUR + OFF_3] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      zBorderMin = z;

      isEmpty = true;
      for (z = zDim - 1; (z > zDimHalf) && (isEmpty); z--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (y = 0; (y < yDim) && (isEmpty); y++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off * FOUR + OFF_3] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      zBorderMax = z;
    }
    boxMin.x = xBorderMin / xDim;
    boxMin.y = yBorderMin / yDim;
    boxMin.z = zBorderMin / zDim;
    boxMax.x = xBorderMax / xDim;
    boxMax.y = yBorderMax / yDim;
    boxMax.z = zBorderMax / zDim;
  }

} // class VolumeTools

VolumeTools.VOLTOOLS_ERROR_OK = 1;
VolumeTools.VOLTOOLS_ERROR_BAD_MULTIPLIER = -1;
VolumeTools.VOLTOOLS_ERROR_BAD_DIMENSION = -2;
VolumeTools.VOLTOOLS_ERROR_BAD_ARRAY = -3;
VolumeTools.VOLTOOLS_ERROR_BAD_NUMBER = -4;
