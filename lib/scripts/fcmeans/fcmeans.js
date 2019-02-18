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
* FCMeans almost automatic (need setup seed  point) segmentation
* @module lib/scripts/fcmeans/fcmeans
*/

// absolute imports
// import * as THREE from 'three';

// relative imports

// ****************************************************************************
// Const
// ****************************************************************************

const FCM_DEFAULT_IMAGE_S = 128;
// selected pixels sub set
const FCM_NUM_PIXELS = (FCM_DEFAULT_IMAGE_S * FCM_DEFAULT_IMAGE_S);
// iterations to build median image
const FCM_NUM_MEDIAN_STEPS = 8;

// deep debug only: save central slice into bmp file
const NEED_SAVE_SLICE_TO_BMP = false;
// ****************************************************************************
// Class
// ****************************************************************************

/**
* Class FCMeans perform segmentation
* @class FCMeans
*/
export default class FCMeans {
  /**
  * Init all internal data
  * @constructs FCMeans
  */
  constructor() {
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    // in MUint8 format
    this.m_imageSrc = null;
    this.m_imageDst = null;
    this.m_numClusters = 0;
    this.m_clusterCenters = null;
    this.m_maxIterations = 0;
    this.m_itertaion = 0;
    this.m_u = null;
    this.m_uNew = null;
    this.m_uNew = null;
    // in float array
    this.m_pixelsSrc = null;
    this.m_pixelsMedian = null;
    this.m_medianStep = 0;
    this.m_totalSteps = 0;
    this.m_pixelIndices = null;
    this.m_xPixelSet = null;
    this.m_yPixelSet = null;
    this.m_zPixelSet = null;
    // random generator
    this.m_w = 123456789;
    this.m_z = 987654321;
  }

  setRandomSeed(seed) {
    this.m_w = Math.floor(seed);
    this.m_z = 987654321;
  }
  getRandom() {
    const mask = 0x7fffffff;
    const SHIFT = 16;
    // eslint-disable-next-line
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> SHIFT)) & mask;
    // eslint-disable-next-line
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> SHIFT)) & mask;
    const result = ((this.m_z << SHIFT) + this.m_w) & mask;
    const MAX_INT32 = 4294967296.0;
    const fr = (result / MAX_INT32);
    return fr;
  }

  static extractSlice(xDim, yDim, zDim, pixelsSrc, zIndex, pixelsDst) {
    if (zIndex >= zDim) {
      return 0;
    }
    if (pixelsSrc.length !== xDim * yDim * zDim) {
      console.log(`extractSlice. bad src pixels format. ${pixelsSrc.length} != ${xDim * yDim * zDim}`);
    }
    if (pixelsDst.length !== xDim * yDim) {
      console.log(`extractSlice. bad dst pixels format. ${pixelsDst.length} != ${xDim * yDim}`);
    }
    const zOff = zIndex * xDim * yDim;
    const numPixels = xDim * yDim;
    for (let i = 0; i < numPixels; i++) {
      pixelsDst[i] = pixelsSrc[zOff + i];
    }
    return 1;
  }
  static saveBitmap(xDim, yDim, pixelsSrc, fileName) {
    // check args
    if (typeof xDim !== 'number') {
      console.log(`saveBitmap. bad xDim = ${xDim}`);
    }
    if (typeof yDim !== 'number') {
      console.log(`saveBitmap. bad yDim = ${yDim}`);
    }
    if (typeof pixelsSrc !== 'object') {
      console.log(`saveBitmap. bad pixelsSrc = ${typeof pixelsSrc}`);
    }
    if (pixelsSrc.length !== xDim * yDim) {
      console.log(`saveBitmap. bad pixels format. ${pixelsSrc.length} != ${xDim * yDim}`);
    }

    const SIZE_HEADER = 14;
    const SIZE_INFO = 40;
    const COMPS_IN_COLOR = 3;
    const numPixels = xDim * yDim;
    let pixStride = COMPS_IN_COLOR  * xDim;
    pixStride = (pixStride + COMPS_IN_COLOR) & (~COMPS_IN_COLOR);
    const totalBufSize = SIZE_HEADER + SIZE_INFO + (numPixels * COMPS_IN_COLOR);
    const buf = new Uint8Array(totalBufSize);
    for (let j = 0; j < totalBufSize; j++) {
      buf[j] = 0;
    }
    const BYTE_MASK = 255;
    const BITS_IN_BYTE = 8;
    // write header
    const BYTES_IN_DWORD = 4;

    let i = 0;
    // bfType[16]
    buf[i++] = 0x42;
    buf[i++] = 0x4D;
    // bfSize[32]
    let bfSize = SIZE_HEADER + SIZE_INFO + pixStride * yDim;
    buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK;
    // bfReserved1 + bfReserved2
    i += BYTES_IN_DWORD;
    // bfOffBits[32]
    let bfOffBits = SIZE_HEADER + SIZE_INFO;
    buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK;

    // write info

    // biSize[32]
    let biSize = SIZE_INFO;
    buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK;
    // biWidth[32]
    let biWidth = xDim;
    buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK;
    // biHeight[32]
    let biHeight = yDim;
    buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK;
    // biPlanes[16]
    buf[i++] = 1;
    buf[i++] = 0;
    // biBitCount[16]
    buf[i++] = 24;
    buf[i++] = 0;
    // biCompression[32]
    i += BYTES_IN_DWORD;
    // biSizeImage[32]
    let biSizeImage = pixStride * yDim;
    buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK;

    // biXPelsPerMeter[32]
    let pelsPerMeter;
    const PELSM = 0x1EC2;
    pelsPerMeter = PELSM;
    buf[i++] = pelsPerMeter & BYTE_MASK; pelsPerMeter >>= BITS_IN_BYTE;
    buf[i++] = pelsPerMeter & BYTE_MASK; pelsPerMeter >>= BITS_IN_BYTE;
    buf[i++] = pelsPerMeter & BYTE_MASK; pelsPerMeter >>= BITS_IN_BYTE;
    buf[i++] = pelsPerMeter & BYTE_MASK;

    // biYPelsPerMeter[32]
    pelsPerMeter = PELSM;
    buf[i++] = pelsPerMeter & BYTE_MASK; pelsPerMeter >>= BITS_IN_BYTE;
    buf[i++] = pelsPerMeter & BYTE_MASK; pelsPerMeter >>= BITS_IN_BYTE;
    buf[i++] = pelsPerMeter & BYTE_MASK; pelsPerMeter >>= BITS_IN_BYTE;
    buf[i++] = pelsPerMeter & BYTE_MASK;

    // biClrUsed[32]
    i += BYTES_IN_DWORD;
    // biClrImportant[32]
    i += BYTES_IN_DWORD;

    let j;
    let valMax = 0;
    for (j = 0; j < numPixels; j++) {
      const valGrey = pixelsSrc[j];
      valMax = (valGrey > valMax) ? valGrey : valMax;
    } // for (j)
    console.log(`saveBitmap. valMax = ${valMax}`);
    if (valMax === 0) {
      valMax++;
    }
    const MAX_COLOR = 255;
    if (valMax < MAX_COLOR) {
      // need not scale down colors
      valMax = MAX_COLOR;
    }

    // write pixels
    for (j = 0; j < numPixels; j++) {
      const valGrey = Math.floor(pixelsSrc[j] * MAX_COLOR / valMax);
      // write rgb components
      buf[i++] = valGrey;
      buf[i++] = valGrey;
      buf[i++] = valGrey;
    } // for (j)

    // const buf = NiftiSaver.writeBuffer(volDataPlain, volSize);
    const textToSaveAsBlob = new Blob([buf], { type: 'application/octet-stream' });
    const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    const downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.innerHTML = 'Download File';
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = event => document.body.removeChild(event.target);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  // static getRandomInt(imin, imax) {
  //   return Math.floor(Math.random() * (imax - imin)) + imin;
  // }

  create(xDim, yDim, zDim,
    imageSrc, imageDst,
    maxIterations,
    numClusters,
    clusterCenters) {
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    this.m_imageSrc = imageSrc;
    this.m_imageDst = imageDst;
    this.m_maxIterations = maxIterations;
    this.m_numClusters = numClusters;
    this.m_clusterCenters = clusterCenters;
    const xyDim = xDim * yDim;
    const xyzDim = xDim * yDim * zDim;
    // check entry params
    if (imageSrc.length !== xyzDim) {
      console.log(`FCMeans.create. Wrong pixel dim ${imageSrc.length} != ${xyzDim}`);
    }
    const TWO = 2;
    if (maxIterations <= TWO) {
      console.log(`FCMeans.create. Too small max iterations = ${maxIterations}`);
    }
    if (numClusters <= TWO) {
      console.log(`FCMeans.create. Too small number of clusters = ${numClusters}`);
    }
    if (typeof clusterCenters === 'undefined') {
      console.log('FCMeans.create. clusterCenters undefined');
    }
    if (clusterCenters === null) {
      console.log('FCMeans.create. clusterCenters is null');
    }

    console.log(`FCMeans.create. vol dim = ${xDim} * ${yDim} * ${zDim}`);

    // const xyzDim = xDim * yDim * zDim;
    const numPixels = FCM_NUM_PIXELS;

    this.m_pixelIndices  = new Int32Array(numPixels);
    this.m_xPixelSet     = new Int32Array(numPixels);
    this.m_yPixelSet     = new Int32Array(numPixels);
    this.m_zPixelSet     = new Int32Array(numPixels);

    let i;
    // generate random indices
    const FCM_RAND_SEED = 0x9aa654;
    this.setRandomSeed(FCM_RAND_SEED);
    for (i = 0; i < numPixels; i++)  {
      // const x = FCMeans.getRandomInt(0, xDim - 1);
      // const y = FCMeans.getRandomInt(0, yDim - 1);
      // const z = FCMeans.getRandomInt(0, zDim - 1);
      const x = Math.floor(this.getRandom() * (xDim - 1));
      const y = Math.floor(this.getRandom() * (yDim - 1));
      const z = Math.floor(this.getRandom() * (zDim - 1));
      this.m_xPixelSet[i] = x;
      this.m_yPixelSet[i] = y;
      this.m_zPixelSet[i] = z;
      this.m_pixelIndices[i] = x + (y * xDim) + (z * xyDim);
    } // for (i)

    this.m_pixelsSrc     = new Float32Array(numPixels);
    this.m_pixelsMedian  = new Float32Array(numPixels);

    // convert source image into float pixels
    const NUM_256 = 256;
    const ONE_PER_256 = 1.0 / NUM_256;
    for (i = 0; i < numPixels; i++) {
      // const MUint8 val = pixSrc[i];
      const val = imageSrc[this.m_pixelIndices[i]];
      this.m_pixelsSrc[i] = val * ONE_PER_256;
    }
    this.m_u       = new Float32Array(numPixels * numClusters);
    this.m_uNew    = new Float32Array(numPixels * numClusters);

    let j;
    // init membership koefs (u matrix)
    const STEP_EQUALS = 1.0 / (numClusters);
    for (i = 0; i < numPixels; i++) {
      const row = i * numClusters;
      for (j = 0; j < numClusters; j++) {
        this.m_u[row + j] = 0.0;
      }
      const v = this.m_pixelsSrc[i];
      const nearestCluster = Math.floor(v / STEP_EQUALS);
      const part = v - STEP_EQUALS * nearestCluster;
      // assert(part >= 0.0);
      // assert(part <= 1.0);
      if ((part < 0.0) || (part > 1.0)) {
        console.log(`Wrong logic: part ${part} in not in [0..1]`);
      }

      this.m_u[row + nearestCluster] = 1.0 - part;
      if (nearestCluster < numClusters - 1) {
        this.m_u[row + nearestCluster + 1] = part;
      }
    } // for (i) all pixels
    this.m_iteration = 0;
    this.m_medianStep = 0;
    this.m_totalSteps = 0;

    return 1;

  } // create

  destroy() {
    const NUM_PALETTE_ENTRIES = 4;
    const PAL_AMYGDALA = 139;
    const PAL_ANGULAR_GYRUS = 19;
    const PAL_ANTEROID_LIMB = 128;
    const palette = [
      // background
      0,
      // amygdala (0.247059 0.584314 0.27058)
      PAL_AMYGDALA,
      // angular gyrus (0.686275 0.231373 0.152941)
      PAL_ANGULAR_GYRUS,
      // anterior limb of internal capsule
      PAL_ANTEROID_LIMB
      // 250, 232, 203, 154,
      // 140, 139, 118, 105,
      // 101,  97,  85,  75,
    ];
    if (this.m_numClusters > NUM_PALETTE_ENTRIES) {
      console.log(`FCMeans.destroy. num clusters (${this.m_numClusters}) is not eq ${NUM_PALETTE_ENTRIES}`);
    }
    const pixelsDst = this.m_imageDst;
    const xyzDim = this.m_xDim * this.m_yDim * this.m_zDim;
    const pixSrc = this.m_imageSrc;
    const NUM_256 = 256.0;
    const ONE_PER_256 = 1.0 /  NUM_256;

    // debug: check histogram of dest image
    // const histDest = [0, 0, 0, 0];

    const TOO_MUCH = 100000.0;
    let i, j;
    for (i = 0; i < xyzDim; i++) {
      const val = pixSrc[i] * ONE_PER_256;
      let minDif = TOO_MUCH;
      let jBest = -1;
      for (j = 0; j < this.m_numClusters; j++) {
        let dif = val - this.m_clusterCenters[j];
        dif = (dif >= 0.0) ? dif : -dif;
        if (dif < minDif)  {
          minDif = dif;
          jBest = j;
        }
      } // for (j)
      pixelsDst[i] = palette[jBest];
      // histDest[jBest]++;
    } // for (i)

    // final histogram of colors
    // for (i = 0; i < this.m_numClusters; i++) {
    //   console.log(`FCMeans. histDest[${i}]=${histDest[i]}`);
    // }

    // dump cluster centers
    for (j = 0; j < this.m_numClusters; j++) {
      const NUM_255 = 255;
      const clustVal = this.m_clusterCenters[j] * NUM_255;
      console.log(`FCMeans. destroy. clusterCenter[${j}] = ${clustVal}`);
    }

    // free memory
    this.m_u = null;
    this.m_uNew = null;
    this.m_pixelsSrc = null;
    this.m_pixelsMedian = null;
    this.m_pixelIndices = null;
    this.m_xPixelSet = null;
    this.m_yPixelSet = null;
    this.m_zPixelSet = null;

    // deep debug: save central z slice into bmp file
    if (NEED_SAVE_SLICE_TO_BMP) {
      const TWO = 2;
      const zIndex = Math.floor(this.m_zDim / TWO);
      const pixelsSlice = new Uint8Array(this.m_xDim * this.m_yDim);
      FCMeans.extractSlice(this.m_xDim, this.m_yDim, this.m_zDim, pixelsDst, zIndex, pixelsSlice);
      const DUMP_FILE_NAME = 'dumpslice.bmp';
      FCMeans.saveBitmap(this.m_xDim, this.m_yDim, pixelsSlice, DUMP_FILE_NAME);
    }
  } // destroy

  static createPartMedianImage(xDim, yDim, zDim,
    indFrom, indTo,
    pixSrc,
    xIndices, yIndices, zIndices,
    radius, pixelsMedian) {

    const TWO = 2;
    const DIA = 1 + TWO * radius;
    const INDEX_AVE = Math.floor((DIA * DIA * DIA) / TWO);
    const locality = new Float32Array(DIA * DIA * DIA);
    const MAX_RAD = 8;
    if (radius > MAX_RAD) {
      console.log('FCMeans.createPartMedianImage. too much radius');
      return;
    }
    const xyDim = xDim * yDim;
    const NUM_256 = 256.0;
    const ONE_PER_256 = (1.0 / NUM_256);

    let ind;
    for (ind = indFrom; ind < indTo; ind++) {
      const xc  = xIndices[ind];
      const yc = yIndices[ind];
      const zc = zIndices[ind];

      let k;
      k = 0;
      let dx, dy, dz;

      for (dz = -radius; dz <= +radius; dz++) {
        let z = zc + dz;
        z = (z >= 0) ? z : 0;
        z = (z < zDim) ? z : (zDim - 1);
        const zOff = z * xyDim;
        for (dy = -radius; dy <= +radius; dy++) {
          let y = yc + dy;
          y = (y >= 0) ? y : 0;
          y = (y < yDim) ? y : (yDim - 1);
          const yOff = y * xDim;
          for (dx = -radius; dx <= +radius; dx++) {
            let x = xc + dx;
            x = (x >= 0) ? x : 0;
            x = (x < xDim) ? x : (xDim - 1);
            const off = x + yOff + zOff;
            const val = pixSrc[off] * ONE_PER_256;
            locality[k++] = val;
          } // for (dx)
        }   // for (dy)
      }     // for (dz)

      // sort locality
      // qsort(locality, DIA * DIA * DIA, sizeof(float), _compareFloat);
      locality.sort();

      const valMedian = locality[INDEX_AVE];

      // write
      pixelsMedian[ind] = valMedian;
    } // for (ind)

  }

  static getMaxDifArrays(arrA, arrB, numElems) {
    let maxDif = 0.0;
    for (let i = 0; i < numElems; i++) {
      let dif = arrA[i] - arrB[i];
      dif = (dif >= 0.0) ? dif : -dif;
      maxDif = (dif > maxDif) ? dif : maxDif;
    }
    return maxDif;
  }
  static calcNewCenters(numPixels,
    numClusters,
    pixelsSrc,
    pixelsMedian,
    u,
    M,
    alpha,
    clusterCenters) {

    let i, j;
    for (j = 0; j < numClusters; j++) {
      let sumUp = 0.0;
      let sumLo = 0.0;
      for (i = 0; i < numPixels; i++) {
        // const upow = Math.pow(u[i * numClusters + j], M);
        const upow = (u[i * numClusters + j]) ** M;
        sumUp += upow * (pixelsSrc[i] + alpha * pixelsMedian[i]);
        sumLo += upow;
      }
      const v = sumUp / ((1.0 + alpha) * sumLo);
      clusterCenters[j] = v;
    } // for (j)
  } // calc new centers

  static distPow(a, b) {
    let d = a - b;
    d = (d >= 0.0) ? d : -d;
    // const float POW = 0.2f;
    const POW = 1.2;
    // return Math.pow(d, POW);
    return d ** POW;
  }

  static calcNewMemberships(numPixels,
    numClusters,
    pixelsSrc,
    pixelsMedian,
    clusterCenters,
    M,
    alpha,
    uNew) {

    let i, j, k;
    const POW = -1.0 / (M - 1.0);
    // minimum arg for pow(x,-3.33) to avoid infinity result
    const MIN_ARG = 1.0e-8;

    for (i = 0; i < numPixels; i++) {
      const row = i * numClusters;
      for (j = 0; j < numClusters; j++) {
        let sum = 0.0;
        for (k = 0; k < numClusters; k++) {
          let xkvj = FCMeans.distPow(pixelsSrc[i], clusterCenters[k]);
          let xkavevj = FCMeans.distPow(pixelsMedian[i], clusterCenters[k]);
          xkvj *= xkvj;
          xkavevj *= xkavevj;
          let vlo = xkvj + alpha * xkavevj;
          // limit arg to avoid infinity result
          vlo = (vlo > MIN_ARG) ? vlo : MIN_ARG;
          // const vloPow = Math.pow(vlo, POW);
          const vloPow = (vlo ** POW);
          sum += vloPow;
        }
        let xkvj = FCMeans.distPow(pixelsSrc[i], clusterCenters[j]);
        let xkavevj = FCMeans.distPow(pixelsMedian[i], clusterCenters[j]);
        xkvj *= xkvj;
        xkavevj *= xkavevj;
        let varg = xkvj + alpha * xkavevj;
        // limit arg to avoid infinity result
        varg = (varg > MIN_ARG) ? varg : MIN_ARG;
        const vup = (varg ** POW);
        const result = vup / sum;
        uNew[row + j] = result;
      } // for (j)
    } // for (i)

  }

  step() {
    const numPixels = FCM_NUM_PIXELS;
    this.m_totalSteps++;
    if (this.m_medianStep < FCM_NUM_MEDIAN_STEPS) {
      const indFrom = (this.m_medianStep + 0) * numPixels / FCM_NUM_MEDIAN_STEPS;
      const indTo   = (this.m_medianStep + 1) * numPixels / FCM_NUM_MEDIAN_STEPS;
      const pixSrc  = this.m_imageSrc;
      const RADIUS_NEIB_MEDIAN = 1;
      FCMeans.createPartMedianImage(this.m_xDim, this.m_yDim, this.m_zDim,
        indFrom, indTo,
        pixSrc,
        this.m_xPixelSet, this.m_yPixelSet, this.m_zPixelSet,
        RADIUS_NEIB_MEDIAN, this.m_pixelsMedian);
      this.m_medianStep++;
      return FCMeans.RESULT_CONTINUE;
    } // if median steps
    this.m_iteration++;
    if (this.m_iteration >= this.m_maxIterations) {
      return FCMeans.RESULT_MAX_ITERS_REACHED;
    }

    const M = 1.3;
    const EPS = 0.01;
    const ALPHA = 0.4;
    // cals new centers
    FCMeans.calcNewCenters(numPixels, this.m_numClusters,
      this.m_pixelsSrc, this.m_pixelsMedian, this.m_u, M, ALPHA, this.m_clusterCenters);

    // update memberships (u matrix): uNew
    FCMeans.calcNewMemberships(numPixels, this.m_numClusters,
      this.m_pixelsSrc, this.m_pixelsMedian, this.m_clusterCenters, M, ALPHA, this.m_uNew);

    // calc distance between u AND uNew
    const distU = FCMeans.getMaxDifArrays(this.m_u, this.m_uNew, numPixels * this.m_numClusters);
    // console.log(`FCMeans. step. dist = ${distU}, EPS = ${EPS}`);
    if (distU < EPS) {
      return FCMeans.RESULT_COMPLETED;
    }

    // assign new memberships
    const N = numPixels * this.m_numClusters;
    let i;
    for (i = 0; i < N; i++) {
      this.m_u[i] = this.m_uNew[i];
    }
    return FCMeans.RESULT_CONTINUE;
  } // step

} // class FCMeans

// errors
FCMeans.RESULT_NA = 0;
FCMeans.RESULT_CONTINUE = 1;
FCMeans.RESULT_COMPLETED = 2;
FCMeans.RESULT_MAX_ITERS_REACHED = 3;

