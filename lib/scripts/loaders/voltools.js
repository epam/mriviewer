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
    const side = gaussRadius * 2 + 1;
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

    const xStep = (xDimSrc << ACC_BITS) / xDimDst;
    const yStep = (yDimSrc << ACC_BITS) / yDimDst;
    const zStep = (zDimSrc << ACC_BITS) / zDimDst;
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
      console.log(`extract2dSlice... fz = ${fz}`);
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

} // class VolumeTools

VolumeTools.VOLTOOLS_ERROR_OK = 1;
VolumeTools.VOLTOOLS_ERROR_BAD_MULTIPLIER = -1;
VolumeTools.VOLTOOLS_ERROR_BAD_DIMENSION = -2;
VolumeTools.VOLTOOLS_ERROR_BAD_ARRAY = -3;
VolumeTools.VOLTOOLS_ERROR_BAD_NUMBER = -4;
