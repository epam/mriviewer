/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
import TetrahedronGenerator from './tetra';
import GeoRender from './georender';
import LaplasianSmoother from './lapsmooth';
import VolumeGenerator from './volgen';
import VolumeTools from '../loaders/voltools';

// Minimum volume size (for volume scale down: increase performance)
const X_MAX_DIM = 256;
const Y_MAX_DIM = 256;
const Z_MAX_DIM = 256;

const AV_NUM_COLORS = 256;

const AV_STATE_NA = -1;
const AV_STATE_NOT_STARTED = 0;
const AV_STATE_PREPARE_GAUSS = 1;
const AV_STATE_PREPARE_UNIFORMITY = 2;
const AV_STATE_UPDATE_GEO = 3;
const AV_STATE_FINISHED = 4;

const AV_METHOD_NORMALS = 1;
const AV_METHOD_UNIFORMITY = 2;
const AV_METHOD_COLOR_KOEFS = 4;
const AV_METHOD_ALL = 0xffff;

/**
 * Class ActiveVolume perform skull detection and removal
 * @class ActiveVolume
 */
export default class ActiveVolume {
  constructor() {
    this.m_state = AV_STATE_NA;
    this.m_pixelsSrc = null;
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_imageGauss = null;
    this.m_imageUniformity = null;
    this.m_verticesNew = null;
    this.m_lapSmoother = null;
    this.m_imageSrc = null;
    this.m_imageGrad = null;
    this.m_gaussStage = -1;
    this.m_uniformityStage = -1;
    this.m_geoStage = -1;
    this.m_histogram = new Int32Array(AV_NUM_COLORS);
    this.m_colorProbability = new Float32Array(AV_NUM_COLORS);
    this.m_colorKoefs = new Float32Array(AV_NUM_COLORS);
    for (let i = 0; i < AV_NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
      this.m_colorProbability[i] = 0.0;
      this.m_colorKoefs[i] = 0.0;
    }
    this.m_sphereCenter = null;
    this.m_sphereRadius = null;
    this.m_indexMinColor = -1;
    // debug counter to save geo
    this.m_updateCounter = 0;
    // for display 3d geo
    this.m_geoRender = null;
    this.m_xScale = 1;
    this.m_yScale = 1;
    this.m_zScale = 1;
  }

  save() {
    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    let volTexDst = new Uint8Array(numPixels);
    // create clipped volume

    let i;
    for (i = 0; i < numPixels; i++) {
      volTexDst[i] = 0;
    }
    const WITH_FILL = true;
    const resBoolFill = VolumeGenerator.generateFromFaces(this.m_xDim, this.m_yDim, this.m_zDim, volTexDst, this.m_geoRender, WITH_FILL);

    if (resBoolFill) {
      console.log('perform clip of source volume by generated mask ...');
      const DECREASE_NON_VIS = 6;
      for (i = 0; i < numPixels; i++) {
        if (volTexDst[i] === 0) {
          this.m_pixelsSrc[i] = Math.floor(this.m_pixelsSrc[i] / DECREASE_NON_VIS);
        }
      }
    } else {
      console.log(`generateFromFaces returned ${resBoolFill} !`);
    }
    volTexDst = null;
  }

  /**
   *
   * @param {*} xDim
   * @param {*} yDim
   * @param {*} zDim
   * @param {*} volTexSrc
   * @param {*} volTexDst
   * @param {*} createType
   * @param {*} needLog
   */
  skullRemoveStart(xDim, yDim, zDim, volTexSrc, volTexDst, createType, needLog) {
    const TOO_MUCH_SIZE = 8192;
    if (createType !== ActiveVolume.REMOVE_SKULL && createType !== ActiveVolume.CREATE_MASK) {
      console.log('skullRemoveStart: wrong argument createType');
    }
    if (xDim >= TOO_MUCH_SIZE || yDim >= TOO_MUCH_SIZE || zDim >= TOO_MUCH_SIZE) {
      console.log(`Too bad volume dimension: ${xDim} * ${yDim} * ${zDim}`);
      return -1;
    }
    if (xDim <= 1 || yDim <= 1 || zDim <= 1) {
      console.log(`Too bad volume dimension: ${xDim} * ${yDim} * ${zDim}`);
      return -1;
    }
    const volSizeSrc = volTexSrc.length;
    const numPixSrc = xDim * yDim * zDim;
    if (volSizeSrc !== numPixSrc) {
      console.log(`skullRemoveStart: bad vol size = ${volSizeSrc}, expected ${numPixSrc}`);
      return -1;
    }
    const okCreate = this.create(xDim, yDim, zDim, volTexSrc);
    if (okCreate !== 1) {
      return okCreate;
    }
    const genTetra = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 3;
    const okCreateTetra = genTetra.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return okCreateTetra;
    }
    const geoRender = new GeoRender();
    const errGeo = geoRender.createFromTetrahedronGenerator(genTetra);
    const GEO_OK = 1;
    if (errGeo !== GEO_OK) {
      const ERR_CREATE_GEO = -3;
      return ERR_CREATE_GEO;
    }

    // get half from volume dimension
    const xDim2 = Math.floor((this.m_xDim - 1) * 0.5);
    const yDim2 = Math.floor((this.m_yDim - 1) * 0.5);
    const zDim2 = Math.floor((this.m_zDim - 1) * 0.5);

    // scale geo render vertices
    const numVertices = geoRender.getNumVertices();
    const vertices = geoRender.getVertices();
    const COORDS_IN_VERTEX = 4;
    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;
    for (let i = 0, i4 = 0; i < numVertices; i++, i4 += COORDS_IN_VERTEX) {
      vertices[i4 + NUM_0] = xDim2 + xDim2 * vertices[i4 + NUM_0];
      vertices[i4 + NUM_1] = yDim2 + yDim2 * vertices[i4 + NUM_1];
      vertices[i4 + NUM_2] = zDim2 + zDim2 * vertices[i4 + NUM_2];
    } // for (i) all vertices

    // save render geo to obj file
    const NEED_SAVE_INITIAL_GEO = false;
    if (NEED_SAVE_INITIAL_GEO) {
      const TEST_SAVE_INIT_GEO_FILE_NAME = 'geo_init.obj';
      geoRender.saveGeoToObjFile(TEST_SAVE_INIT_GEO_FILE_NAME);
    }

    // Test save bounding sphere
    const NEED_SAVE_BOUND_SPHERE = false;
    if (NEED_SAVE_BOUND_SPHERE) {
      const vMin = new THREE.Vector3();
      const vMax = new THREE.Vector3();
      ActiveVolume.getBoundingBox(this.m_xDim, this.m_yDim, this.m_zDim, this.m_pixelsSrc, vMin, vMax);
      const geoSphere = new GeoRender();
      const vCenter = new THREE.Vector3();
      const vRad = new THREE.Vector3();
      vCenter.x = (vMin.x + vMax.x) * 0.5;
      vCenter.y = (vMin.y + vMax.y) * 0.5;
      vCenter.z = (vMin.z + vMax.z) * 0.5;
      vRad.x = (vMax.x - vMin.x) * 0.5;
      vRad.y = (vMax.y - vMin.y) * 0.5;
      vRad.z = (vMax.z - vMin.z) * 0.5;

      const NUM_SEGM_HOR = 16;
      const NUM_SEGM_VER = 8;
      geoSphere.createFromEllipse(vCenter, vRad, NUM_SEGM_HOR, NUM_SEGM_VER);
      const TEST_SAVE_BSPHERE_GEO_FILE_NAME = 'geo_bsph.obj';
      geoSphere.saveGeoToObjFile(TEST_SAVE_BSPHERE_GEO_FILE_NAME);
    }
    let numPredSteps = this.getPredictedStepsForActiveVolumeUpdate();
    const SOME_ADD_STEPS = 12;
    numPredSteps += SOME_ADD_STEPS;

    const strTypeArr = ['REMOVE_SKULL', 'CREATE_MASK'];
    const strType = strTypeArr[createType];
    console.log(`skullRemoveStart. Will be ${numPredSteps} updates approximately. In ${strType} mode `);

    this.m_updateCounter = 0;
    this.m_isFinished = false;
    this.m_numPredSteps = numPredSteps;
    this.m_createType = createType;
    this.m_volTexSrc = volTexSrc;
    this.m_volTexDst = volTexDst;
    this.m_needLog = needLog;

    return geoRender;
  }

  skullRemoveUpdate(geoRender) {
    const isLoopComplete = this.m_updateCounter >= this.m_numPredSteps || this.m_isFinished;
    if (isLoopComplete) {
      return true;
    }
    this.updateGeo(geoRender, AV_METHOD_ALL);
    this.m_isFinished = this.m_state === AV_STATE_FINISHED;
    this.m_updateCounter++;
    return false;
  }

  skullRemoveStop(geoRender) {
    // save geo render after all modification iterations
    const NEED_SAVE_FINAL_GEO_RENDER = false;
    if (NEED_SAVE_FINAL_GEO_RENDER) {
      this.finalizeUpdatesGeo(geoRender, NEED_SAVE_FINAL_GEO_RENDER);
    }
    const NUM_2 = 2;

    // Save smoothed image into file
    const NEED_SAVE_NONCLIPPED_SLICE_BMP = false;
    if (NEED_SAVE_NONCLIPPED_SLICE_BMP) {
      const TEST_SAVE_VOL_FILE_NAME = 'test_nonclipped_slice.bmp';
      const zSlice = Math.floor(this.m_zDim / NUM_2);
      ActiveVolume.saveVolumeSliceToFile(this.m_pixelsSrc, this.m_xDim, this.m_yDim, this.m_zDim, zSlice, TEST_SAVE_VOL_FILE_NAME);
    }

    if (this.m_createType === ActiveVolume.REMOVE_SKULL) {
      const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
      const volMask = new Uint8Array(numPixels);

      // create volume mask. 255: visible part, 0 - invisible
      const WITH_FILL = 1;
      const resFill = VolumeGenerator.generateFromFaces(this.m_xDim, this.m_yDim, this.m_zDim, volMask, geoRender, WITH_FILL);
      if (resFill < 0) {
        console.log(`generateFromFaces returned ${resFill} !`);
      }
      // apply  volMask to volSrc
      for (let i = 0; i < numPixels; i++) {
        this.m_volTexDst[i] = volMask[i] !== 0 ? this.m_volTexSrc[i] : 0;
      }
    } else if (this.m_createType === ActiveVolume.CREATE_MASK) {
      // create volume mask. 255: visible part, 0 - invisible
      const WITH_FILL = 1;
      const resFill = VolumeGenerator.generateFromFaces(this.m_xDim, this.m_yDim, this.m_zDim, this.m_volTexDst, geoRender, WITH_FILL);
      if (resFill < 0) {
        console.log(`generateFromFaces returned ${resFill} !`);
      }
    }

    // save result for deep debug
    const NEED_SAVE_CLIPPED_SLICE_BMP = false;
    if (this.m_needLog && NEED_SAVE_CLIPPED_SLICE_BMP) {
      const TEST_SLICE_SAVE_FILE_NAME = 'test_clipped_slice.bmp';
      const zSlice = Math.floor(this.m_zDim / NUM_2);
      ActiveVolume.saveVolumeSliceToFile(this.m_volTexDst, this.m_xDim, this.m_yDim, this.m_zDim, zSlice, TEST_SLICE_SAVE_FILE_NAME);
    }

    return +1;
  }

  static getBoundingBox(xDim, yDim, zDim, volTexSrc, vMin, vMax) {
    const MIN_VIS_COLOR = 50;
    let x, y, z;
    vMax.set(0.0, 0.0, 0.0);
    vMin.set(xDim, yDim, zDim);
    let ind = 0;
    for (z = 0; z < zDim; z++) {
      for (y = 0; y < yDim; y++) {
        for (x = 0; x < xDim; x++) {
          const val = volTexSrc[ind];
          ind++;
          if (val < MIN_VIS_COLOR) {
            continue;
          }
          // update bbox
          vMin.x = x < vMin.x ? x : vMin.x;
          vMin.y = y < vMin.y ? y : vMin.y;
          vMin.z = z < vMin.z ? z : vMin.z;
          vMax.x = x > vMax.x ? x : vMax.x;
          vMax.y = y > vMax.y ? y : vMax.y;
          vMax.z = z > vMax.z ? z : vMax.z;
        } // for (x)
      } // for (y)
    } // for (z)
  }

  /**
   * Save volume slice to BMP file. Only for deep debug
   * @param {array} pixelsSrc array of source voxels in volume
   * @param {number} xDim Volume dimension on x
   * @param {number} yDim Volume dimension on y
   * @param {number} zDim Volume dimension on z
   * @param {number} zSlice index of slice in volume
   * @param {string } fileName save file name
   */
  static saveVolumeSliceToFile(pixelsSrc, xDim, yDim, zDim, zSlice, fileName) {
    const SIZE_HEADER = 14;
    const SIZE_INFO = 40;
    const COMPS_IN_COLOR = 3;
    const numPixels = xDim * yDim;
    let pixStride = COMPS_IN_COLOR * xDim;
    pixStride = (pixStride + COMPS_IN_COLOR) & ~COMPS_IN_COLOR;
    const totalBufSize = SIZE_HEADER + SIZE_INFO + numPixels * COMPS_IN_COLOR;
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
    buf[i++] = 0x4d;
    // bfSize[32]
    let bfSize = SIZE_HEADER + SIZE_INFO + pixStride * yDim;
    buf[i++] = bfSize & BYTE_MASK;
    bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK;
    bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK;
    bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK;
    // bfReserved1 + bfReserved2
    i += BYTES_IN_DWORD;
    // bfOffBits[32]
    let bfOffBits = SIZE_HEADER + SIZE_INFO;
    buf[i++] = bfOffBits & BYTE_MASK;
    bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK;
    bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK;
    bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK;

    // write info

    // biSize[32]
    let biSize = SIZE_INFO;
    buf[i++] = biSize & BYTE_MASK;
    biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK;
    biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK;
    biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK;
    // biWidth[32]
    let biWidth = xDim;
    buf[i++] = biWidth & BYTE_MASK;
    biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK;
    biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK;
    biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK;
    // biHeight[32]
    let biHeight = yDim;
    buf[i++] = biHeight & BYTE_MASK;
    biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK;
    biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK;
    biHeight >>= BITS_IN_BYTE;
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
    buf[i++] = biSizeImage & BYTE_MASK;
    biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK;
    biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK;
    biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK;
    // biXPelsPerMeter[32]
    i += BYTES_IN_DWORD;
    // biYPelsPerMeter[32]
    i += BYTES_IN_DWORD;
    // biClrUsed[32]
    i += BYTES_IN_DWORD;
    // biClrImportant[32]
    i += BYTES_IN_DWORD;

    let j;
    // get max volume
    const offSlice = zSlice * xDim * yDim;
    let valMax = 0;
    for (j = 0; j < numPixels; j++) {
      const valGrey = pixelsSrc[offSlice + j];
      valMax = valGrey > valMax ? valGrey : valMax;
    } // for (j)
    console.log(`saveVolumeSlice. valMax = ${valMax}`);

    // write pixels
    const MAX_COLOR = 255;
    for (j = 0; j < numPixels; j++) {
      const valGrey = Math.floor((pixelsSrc[offSlice + j] * MAX_COLOR) / valMax);
      // write rgb components
      buf[i++] = valGrey;
      buf[i++] = valGrey;
      buf[i++] = valGrey;
    } // for (j)

    // write buffer to file
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const linkGen = document.createElement('a');
    linkGen.setAttribute('href', url);
    linkGen.setAttribute('download', fileName);
    const eventGen = document.createEvent('MouseEvents');
    eventGen.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    linkGen.dispatchEvent(eventGen);
  }

  getPredictedStepsForActiveVolumeUpdate() {
    const TWO = 2;
    const hx = this.m_xDim;
    const hy = this.m_yDim;
    const hz = this.m_zDim;
    const xyMax = hx > hy ? hx : hy;
    const xyzMax = xyMax > hz ? xyMax : hz;
    const SCAN_RAD = 4;
    const stepsByRad = xyzMax - SCAN_RAD;
    const SOME_ADD_STEPS = 4;
    const stepsAll = stepsByRad + TWO * ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES + SOME_ADD_STEPS;
    return stepsAll;
  }

  /**
   * Create members for iterations later
   * @return {number} 1, if success. <0 if failed
   */
  create(xDim, yDim, zDim, volTexSrc) {
    if (xDim > X_MAX_DIM || yDim > Y_MAX_DIM || zDim > Z_MAX_DIM) {
      // scale down twice or 4
      this.m_xScale = Math.floor(xDim / X_MAX_DIM);
      this.m_yScale = Math.floor(yDim / Y_MAX_DIM);
      this.m_zScale = Math.floor(zDim / Z_MAX_DIM);
      let maxScale = this.m_xScale > this.m_yScale ? this.m_xScale : this.m_yScale;
      maxScale = this.m_zScale > maxScale ? this.m_zScale : maxScale;
      const TWO = 2;
      if (maxScale <= 1) {
        this.m_xScale = this.m_yScale = this.m_zScale = TWO;
      }
      this.m_xScale = this.m_xScale >= 1 ? this.m_xScale : 1;
      this.m_yScale = this.m_yScale >= 1 ? this.m_yScale : 1;
      this.m_zScale = this.m_zScale >= 1 ? this.m_zScale : 1;

      const xScaled = Math.floor(xDim / this.m_xScale);
      const yScaled = Math.floor(yDim / this.m_yScale);
      const zScaled = Math.floor(zDim / this.m_zScale);
      const numPixelsScaled = xScaled * yScaled * zScaled;
      const pixelsScaled = new Uint8Array(numPixelsScaled);
      VolumeTools.scaleDown(volTexSrc, xDim, yDim, zDim, pixelsScaled, this.m_xScale, this.m_yScale, this.m_zScale);
      this.m_pixelsSrc = pixelsScaled;
      this.m_wasAllocated = true;
      this.m_xDim = xScaled;
      this.m_yDim = yScaled;
      this.m_zDim = zScaled;
      console.log(`ActiveVolume. Scaled down to ${xScaled} * ${yScaled} * ${zScaled}`);
    } else {
      this.m_xDim = xDim;
      this.m_yDim = yDim;
      this.m_zDim = zDim;
      this.m_pixelsSrc = volTexSrc;
      this.m_wasAllocated = false;
    }

    this.m_state = AV_STATE_NOT_STARTED;
    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    this.m_imageGauss = new Float32Array(numPixels);
    this.m_imageUniformity = new Float32Array(numPixels);
    this.m_verticesNew = null;
    // add checks
    if (this.m_pixelsSrc.length !== numPixels) {
      // console.log(`ActiveVolume.create: Bad vol.expect data len=${numPixels},actual len=${volTexSrc.length}`);
      return 0;
    }
    return 1;
  }

  /**
   * Make special unifoirmity image for whole volume
   */
  makeUniformityImage(pixelsSrc, xDim, yDim, zDim, zStart, zEnd, pixelsGrad, pixelsDst, koefAlpha) {
    // radius neighbours
    const TWICE = 2;
    const RAD_UNI = 1;
    const DIA_UNI = 1 + TWICE * RAD_UNI;

    const SCALE_ALL_ELEMS = 1.0 / (DIA_UNI * DIA_UNI * DIA_UNI);
    // let maxLen = 0.0;
    let cx, cy, cz;

    const zs = zStart > RAD_UNI ? zStart : RAD_UNI;
    const ze = zEnd < zDim - RAD_UNI ? zEnd : zDim - RAD_UNI;

    for (cz = zs; cz < ze; cz++) {
      const czOff = cz * xDim * yDim;
      for (cy = RAD_UNI; cy < yDim - RAD_UNI; cy++) {
        const cyOff = cy * xDim;
        for (cx = RAD_UNI; cx < xDim - RAD_UNI; cx++) {
          let sumDx = 0.0;
          let sumDy = 0.0;
          let sumDz = 0.0;
          let dx, dy, dz;

          for (dz = -RAD_UNI; dz <= +RAD_UNI; dz++) {
            const z = cz + dz;
            const zOff = z * xDim * yDim;
            for (dy = -RAD_UNI; dy <= +RAD_UNI; dy++) {
              const y = cy + dy;
              const yOff = y * xDim;
              for (dx = -RAD_UNI; dx <= +RAD_UNI; dx++) {
                const x = cx + dx;
                const offSrc = x + yOff + zOff;
                // if ((offSrc < 0) || (offSrc >= numPixelsVol)) {
                //   console.log('!!! Out of array');
                // }
                const val = pixelsSrc[offSrc];
                sumDx += val * dx;
                sumDy += val * dy;
                sumDz += val * dz;
              } // for (dx)
            } // for (dy)
          } // for (dz)

          sumDx *= SCALE_ALL_ELEMS;
          sumDy *= SCALE_ALL_ELEMS;
          sumDz *= SCALE_ALL_ELEMS;

          // maxLen = (gradLen > maxLen) ? gradLen : maxLen;

          const gradLen = Math.sqrt(sumDx * sumDx + sumDy * sumDy + sumDz * sumDz);
          pixelsGrad[cx + cyOff + czOff] = gradLen;
          pixelsDst[cx + cyOff + czOff] = Math.exp(-koefAlpha * gradLen);
        } // for (cx)
      } // for (cy)
    } // for (cz)
    // console.log(`makeUniformityImage done for z = ${zs} to ${ze}`);
  }

  /**
   * Start image smoothimg by Gauss convolution
   */
  startImageSmooth() {
    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    let i;
    for (i = 0; i < numPixels; i++) {
      this.m_imageGauss[i] = 0.0;
      this.m_imageUniformity[i] = 0.0;
    }
    this.m_imageSrc = new Float32Array(numPixels);
    this.m_imageGrad = new Float32Array(numPixels);
    for (i = 0; i < numPixels; i++) {
      this.m_imageGrad[i] = 0.0;
      const val = this.m_pixelsSrc[i];
      this.m_imageSrc[i] = val;
    }
    return 1;
  }

  /**
   * Stop volume smothing by Gauss
   */
  stopImageSmooth() {
    this.m_imageGrad = null;
    this.m_imageSrc = null;
  }

  applyPartGaussSmooth(zStart, zEnd, rad, sigma) {
    const TWICE = 2;
    const dia = 1 + TWICE * rad;
    // fill gauss matrix
    const THREE_DIMS = 3.0;
    const koef = 1.0 / (THREE_DIMS * sigma * sigma);
    let dx, dy, dz;
    let j = 0;
    if (zStart === 0) {
      const GAUSS_MAX_RAD = 9;
      const GAUSS_MAX_DIA = 1 + TWICE * GAUSS_MAX_RAD;
      this.m_gaussMatrix = new Float32Array(GAUSS_MAX_DIA * GAUSS_MAX_DIA * GAUSS_MAX_DIA);
      let wSum = 0.0;
      for (dz = -rad; dz <= +rad; dz++) {
        const fz = dz / rad;
        for (dy = -rad; dy <= +rad; dy++) {
          const fy = dy / rad;
          for (dx = -rad; dx <= +rad; dx++) {
            const fx = dx / rad;
            const dist2 = fx * fx + fy * fy + fz * fz;
            const weight = Math.exp(-1.0 * dist2 * koef);
            this.m_gaussMatrix[j++] = weight;
            wSum += weight;
          }
        }
      } // for (dz)
      // normalize weights
      const numGaussElems = dia * dia * dia;
      const gScale = 1.0 / wSum;
      for (j = 0; j < numGaussElems; j++) {
        this.m_gaussMatrix[j] *= gScale;
      }
      const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
      for (j = 0; j < numPixels; j++) {
        this.m_imageGauss[j] = this.m_imageSrc[j];
      }
    }
    // apply gauss matrix to source image
    const zs = zStart > rad ? zStart : rad;
    const ze = zEnd < this.m_zDim - rad ? zEnd : this.m_zDim - rad;
    let cx, cy, cz;
    for (cz = zs; cz < ze; cz++) {
      const czOff = cz * this.m_xDim * this.m_yDim;
      for (cy = rad; cy < this.m_yDim - rad; cy++) {
        const cyOff = cy * this.m_xDim;
        for (cx = rad; cx < this.m_xDim - rad; cx++) {
          let sum = 0.0;
          j = 0;
          for (dz = -rad; dz <= +rad; dz++) {
            const z = cz + dz;
            const zOff = z * this.m_xDim * this.m_yDim;
            for (dy = -rad; dy <= +rad; dy++) {
              const y = cy + dy;
              const yOff = y * this.m_xDim;
              for (dx = -rad; dx <= +rad; dx++) {
                const x = cx + dx;
                const weight = this.m_gaussMatrix[j++];
                const val = this.m_imageSrc[x + yOff + zOff];
                sum += val * weight;
              } // for (dx)
            } // for (dy)
          } // for (dz)
          this.m_imageGauss[cx + cyOff + czOff] = sum;
          // this.m_imageGauss[cx + cyOff + czOff] = 0.0;
        } // for (cx)
      } // for (cy)
    } // for (cz)
  }

  /**
   * Smooth step
   */
  static smoothStep(minRange, maxRange, arg) {
    let t = (arg - minRange) / (maxRange - minRange);
    t = t > 0.0 ? t : 0.0;
    t = t < 1.0 ? t : 1.0;
    const NUM_2 = 2.0;
    const NUM_3 = 3.0;
    const res = t * t * (NUM_3 - NUM_2 * t);
    return res;
  }

  /**
   * Smooth 1d float array
   */
  static smoothArray(values, numValues, gaussRad, gaussSigma) {
    const dst = new Float32Array(AV_NUM_COLORS);
    const mult = 1.0 / (gaussSigma * gaussSigma);
    for (let ci = 0; ci < numValues; ci++) {
      let sum = 0.0;
      let sumWeight = 0.0;
      for (let di = -gaussRad; di <= +gaussRad; di++) {
        let i = ci + di;
        i = i >= 0 ? i : 0;
        i = i < numValues ? i : numValues - 1;
        const t = di / gaussRad;
        const weight = 1.0 / Math.exp(t * t * mult);
        sumWeight += weight;
        sum += values[i] * weight;
      }
      const valSmoothed = sum / sumWeight;
      dst[ci] = valSmoothed;
    }
    // copy back
    for (let i = 0; i < numValues; i++) {
      values[i] = dst[i];
    }
  }

  /**
   * Get histogram from gaussian smoothed image
   * and detect "dark" color range
   */
  getHistogram() {
    const MAX_COLOR = 255;

    let i;
    // clear histogram
    for (i = 0; i < AV_NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
    }

    const TWO = 2;
    // scan central image part
    const SCAN_RANGE = 4;
    const zMin = Math.floor(this.m_zDim / TWO - SCAN_RANGE);
    const zMax = Math.floor(this.m_zDim / TWO + SCAN_RANGE);
    const yMin = Math.floor(this.m_yDim / TWO - SCAN_RANGE);
    const yMax = Math.floor(this.m_yDim / TWO + SCAN_RANGE);

    let x, y, z;
    let numPixels = 0;
    for (z = zMin; z < zMax; z++) {
      const zOff = z * this.m_xDim * this.m_yDim;
      for (y = yMin; y < yMax; y++) {
        const yOff = y * this.m_xDim;
        for (x = 0; x < this.m_xDim; x++) {
          const off = x + yOff + zOff;
          let val = this.m_imageGauss[off];
          val = val < MAX_COLOR ? val : MAX_COLOR;
          this.m_histogram[Math.floor(val)]++;
          numPixels++;
        } // for (x)
      } // for (y)
    } // for (z)
    // get probabilities of each color in histogram
    for (i = 0; i < AV_NUM_COLORS; i++) {
      const h = this.m_histogram[i];
      this.m_colorProbability[i] = h / numPixels;
    }

    // smooth prob
    const GAUSS_RAD = 5;
    const GAUSS_SIGMA = 1.6;
    ActiveVolume.smoothArray(this.m_colorProbability, AV_NUM_COLORS, GAUSS_RAD, GAUSS_SIGMA);

    //
    // Histogram looks like this
    // Brain
    //
    // +----------------------->
    //   ***           ********
    //   *  **  ****   *
    //  *     * *  *  *
    //  *      *    * *
    //  *            *
    //  *
    // *
    // *
    // *

    // Lungs
    // +----------------------->
    //      *****   **********
    //     *    *  *
    //    *      * *
    // ** *       *
    //  * *
    //  * *
    //  * *
    //   *
    //

    // Find las local maximum: this is most frequent bright (white) color intensity
    let j;
    let indBrightColor = -1;
    const DIST_DETECT_LOC_MAX = 9;
    for (i = AV_NUM_COLORS - DIST_DETECT_LOC_MAX; i > DIST_DETECT_LOC_MAX; i--) {
      let isLocMax = 1;
      let isLarger = 0;
      for (j = i - DIST_DETECT_LOC_MAX; j <= i + DIST_DETECT_LOC_MAX; j++) {
        if (this.m_colorProbability[i] > this.m_colorProbability[j]) {
          isLarger = 1;
        }
        if (this.m_colorProbability[i] < this.m_colorProbability[j]) {
          isLocMax = 0;
          break;
        }
      } // for (j) around i
      if (isLocMax && isLarger) {
        indBrightColor = i;
        break;
      }
    }
    if (indBrightColor === -1) {
      console.log('Bright color cant be detected !');
    }
    // console.log(`indBrightColor = ${indBrightColor}`);

    // Find first local maximum
    let indDarkColor = -1;
    for (i = 0; i < indBrightColor; i++) {
      let isLocMax = true;
      let isLarger = false;
      const indScanMin = i - DIST_DETECT_LOC_MAX >= 0 ? i - DIST_DETECT_LOC_MAX : 0;
      const indScanMax = i + DIST_DETECT_LOC_MAX <= MAX_COLOR ? i + DIST_DETECT_LOC_MAX : MAX_COLOR;
      for (j = indScanMin; j <= indScanMax; j++) {
        if (this.m_colorProbability[i] > this.m_colorProbability[j]) {
          isLarger = true;
        }
        if (this.m_colorProbability[i] < this.m_colorProbability[j]) {
          isLocMax = false;
          break;
        }
      } // for (j) around i
      if (isLocMax && isLarger) {
        indDarkColor = i;
        break;
      }
    } // for (i) ind dark color
    if (indDarkColor === -1) {
      console.log('indDarkColor should not be -1');
    }
    if (indDarkColor >= indBrightColor) {
      console.log('indDarkColor should not less then indBrightColor');
    }
    // console.log(`indDarkColor = ${indDarkColor}`);

    // Half of bright color is barrier to detect "black" / "white" change
    const indBrightHalf = Math.floor(indBrightColor / TWO);

    // clear histogram
    for (i = 0; i < AV_NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
    }

    // Get histogram of part image
    numPixels = 0;
    for (z = zMin; z < zMax; z++) {
      const zOff = z * this.m_xDim * this.m_yDim;
      for (y = yMin; y < yMax; y++) {
        const yOff = y * this.m_xDim;
        let isExitFromBrightZoneDetected = false;
        let numPixelsDarkZone = 0;
        for (x = 0; x < this.m_xDim - 1; x++) {
          const off = x + yOff + zOff;
          const valCur = Math.floor(this.m_imageGauss[off + 0]);
          const valNex = Math.floor(this.m_imageGauss[off + 1]);
          const isCurGreat = valCur > indBrightHalf ? 1 : 0;
          const isNexLess = valNex <= indBrightHalf ? 1 : 0;
          if ((isCurGreat & isNexLess) !== 0) {
            isExitFromBrightZoneDetected = true;
            continue;
          }
          if (isExitFromBrightZoneDetected) {
            const TOO_MUCH_BRIGHT_ZONE = 40;
            if (numPixelsDarkZone > TOO_MUCH_BRIGHT_ZONE) {
              break;
            }
            if (isCurGreat) {
              break;
            }
            numPixelsDarkZone++;
            const valOrig = Math.floor(this.m_pixelsSrc[off + 0]);
            this.m_histogram[valOrig]++;
            numPixels++;
          } // if was exit from bright zone
        } // for (x)
      } // for (y)
    } // for (z)

    // get probabilities of each color in histogram
    for (i = 0; i < AV_NUM_COLORS; i++) {
      const h = this.m_histogram[i];
      this.m_colorProbability[i] = h / numPixels;
    }

    // smooth prob
    const GAUSS_RAD_FOR_LOC = 8;
    const GAUSS_SIGMA_FOR_LOC = 2.4;
    ActiveVolume.smoothArray(this.m_colorProbability, AV_NUM_COLORS, GAUSS_RAD_FOR_LOC, GAUSS_SIGMA_FOR_LOC);

    // Find first local maximum
    indDarkColor = -1;
    for (i = 0; i < indBrightColor; i++) {
      let isLocMax = true;
      let isLarger = false;
      const indScanMin = i - DIST_DETECT_LOC_MAX >= 0 ? i - DIST_DETECT_LOC_MAX : 0;
      const indScanMax = i + DIST_DETECT_LOC_MAX <= MAX_COLOR ? i + DIST_DETECT_LOC_MAX : MAX_COLOR;
      for (j = indScanMin; j <= indScanMax; j++) {
        if (this.m_colorProbability[i] > this.m_colorProbability[j]) {
          isLarger = true;
        }
        if (this.m_colorProbability[i] < this.m_colorProbability[j]) {
          isLocMax = false;
          break;
        }
      } // for (j) around i
      if (isLocMax && isLarger) {
        indDarkColor = i;
        break;
      }
    } // for (i) bright color
    // console.log(`indDarkColor = ${indDarkColor}`);

    // Find next local min
    let indDarkColorMax = -1;
    for (i = indDarkColor + 1; i < indBrightColor; i++) {
      let isLocMin = true;
      let isLess = false;
      const indScanMin = i - DIST_DETECT_LOC_MAX >= 0 ? i - DIST_DETECT_LOC_MAX : 0;
      const indScanMax = i + DIST_DETECT_LOC_MAX <= MAX_COLOR ? i + DIST_DETECT_LOC_MAX : MAX_COLOR;
      for (j = indScanMin; j <= indScanMax; j++) {
        if (this.m_colorProbability[i] < this.m_colorProbability[j]) {
          isLess = 1;
        }
        if (this.m_colorProbability[i] > this.m_colorProbability[j]) {
          isLocMin = false;
          break;
        }
      } // for (j) around i
      if (isLocMin && isLess) {
        indDarkColorMax = i;
        break;
      }
    }
    if (indDarkColorMax <= indDarkColor) {
      console.log('indDarkColorMax should be more indDarkColor!');
    }

    if (indDarkColorMax >= indBrightColor) {
      console.log('indDarkColorMax should be less indBrightColor!');
    }
    console.log(`ActiveVolume. Dark colors range is [${indDarkColor}, ${indDarkColorMax}]`);

    // Make smooth step function for range [indDarkColor .. indDarkColorMax]
    for (i = 0; i < AV_NUM_COLORS; i++) {
      this.m_colorProbability[i] = ActiveVolume.smoothStep(indDarkColor, indDarkColorMax, i);
    }
    // Debug here
    indDarkColorMax++;
    return 1;
  }

  resetStateForGeoUpdates() {
    this.m_geoStage = 0;
    this.m_state = AV_STATE_UPDATE_GEO;
    this.m_geoRender.createNormalsForGeometry();
  }

  resetStateToStartUpdates() {
    this.m_geoStage = 0;
    this.m_gaussStage = 0;
    this.m_state = AV_STATE_NOT_STARTED;
  }

  /**
   * Update render geo
   * @param {object} geo RederGeo to modify
   * @param {number} method Method
   * @return {number} 1, if success. < 0, if failed
   */
  updateGeo(geo, method) {
    if (geo === 'undefined') {
      console.log('ActiveVolume. updateGeo: geo undefined');
      const FAIL_UNDEF = -1;
      return FAIL_UNDEF;
    }
    if (geo === null) {
      console.log('ActiveVolume. updateGeo: geo null');
      const FAIL_NULL = -2;
      return FAIL_NULL;
    }

    if (this.m_state === AV_STATE_FINISHED) {
      return 1;
    }
    if (this.m_state === AV_STATE_NOT_STARTED) {
      // first update
      const okCreateNormals = geo.createNormalsForGeometry();
      if (okCreateNormals !== 1) {
        console.log('geo.createNormalsForGeometry returned fail');
        return okCreateNormals;
      }

      this.startImageSmooth();
      this.m_gaussStage = 0;
      this.m_state = AV_STATE_PREPARE_GAUSS;
    }
    if (this.m_state === AV_STATE_PREPARE_GAUSS) {
      const GAUSS_RAD = 2;
      const GAUSS_SIGMA = 1.8;
      const zStart = Math.floor((this.m_zDim * (this.m_gaussStage + 0)) / ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES);
      const zEnd = Math.floor((this.m_zDim * (this.m_gaussStage + 1)) / ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES);
      this.applyPartGaussSmooth(zStart, zEnd, GAUSS_RAD, GAUSS_SIGMA);

      this.m_gaussStage++;
      if (this.m_gaussStage >= ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES) {
        this.m_state = AV_STATE_PREPARE_UNIFORMITY;
        this.m_uniformityStage = 0;
        console.log('UpdateGeo. AV_STATE_PREPARE_UNIFORMITY.');
        return 1;
      }
    }
    if (this.m_state === AV_STATE_PREPARE_UNIFORMITY) {
      const zStart = Math.floor((this.m_zDim * (this.m_uniformityStage + 0)) / ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES);
      const zEnd = Math.floor((this.m_zDim * (this.m_uniformityStage + 1)) / ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES);
      const KOEF_UNIFORMITY = 0.07;
      this.makeUniformityImage(
        this.m_imageGauss,
        this.m_xDim,
        this.m_yDim,
        this.m_zDim,
        zStart,
        zEnd,
        this.m_imageGrad,
        this.m_imageUniformity,
        KOEF_UNIFORMITY
      );
      this.m_uniformityStage++;
      if (this.m_uniformityStage >= ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES) {
        // DEBUG save
        const DEBUG_SAVE_UNI = false;
        if (DEBUG_SAVE_UNI) {
          const TEST_SAVE_UNI_FILE_NAME = 'uni.bmp';
          const TWO = 2;
          const zSlice = this.m_zDim / TWO;
          ActiveVolume.saveVolumeSliceToFile(
            this.m_imageUniformity,
            this.m_xDim,
            this.m_yDim,
            this.m_zDim,
            zSlice,
            TEST_SAVE_UNI_FILE_NAME
          );
        }

        // finally get image histogram
        // console.log('UpdateGeo. getHistogram...');
        this.getHistogram();
        this.stopImageSmooth();
        this.m_geoStage = 0;
        this.m_state = AV_STATE_UPDATE_GEO;
        // console.log('UpdateGeo. AV_STATE_UPDATE_GEO.');
        return 1;
      }
    }

    if (this.m_state === AV_STATE_UPDATE_GEO) {
      if (this.m_verticesNew === null) {
        const numVertices = geo.getNumVertices();
        const COORDS_IN_VERTREX = 4;
        this.m_verticesNew = new Float32Array(numVertices * COORDS_IN_VERTREX);
      }

      const updateNormals = (method & AV_METHOD_NORMALS) !== 0;
      const updateUniformity = (method & AV_METHOD_UNIFORMITY) !== 0;
      const updateColorKoefs = (method & AV_METHOD_COLOR_KOEFS) !== 0;

      const SPEED_NORMALS = 1.1;
      if (updateNormals && !updateUniformity) {
        this.updateGeoByVertexNormals(geo, SPEED_NORMALS);
      }
      if (updateNormals && updateUniformity && !updateColorKoefs) {
        this.updateGeoByVertexNormalsAndUniformity(geo, SPEED_NORMALS);
      }
      if (updateNormals && updateUniformity && updateColorKoefs) {
        const isFinished = this.updateGeoNormalsUniformityColors(geo, SPEED_NORMALS);
        if (isFinished) {
          console.log(`updateGeoNormalsUniformityColors is FINISHED. m_geoStage = ${this.m_geoStage}`);
          this.m_state = AV_STATE_FINISHED;
        }
      }
      this.m_geoStage++;
    } // if state is update geo
    return 1;
  }

  getAveUniformityForGeoVertices(geo) {
    let i, i4;
    const numVertices = geo.getNumVertices();
    const vertices = geo.getVertices();
    const xyDim = this.m_xDim * this.m_yDim;
    let uniAve = 0.0;
    const NUM_COMPS_VERTEX = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERTEX) {
      // pixel coordinate in the volume
      const x = Math.floor(vertices[i4 + OFF_0]);
      const y = Math.floor(vertices[i4 + OFF_1]);
      const z = Math.floor(vertices[i4 + OFF_2]);

      const off = x + y * this.m_xDim + z * xyDim;
      const uni = this.m_imageUniformity[off];
      uniAve += uni;
    }
    uniAve /= numVertices;
    return uniAve;
  }

  finalizeUpdatesGeo(geo, inDebugMode) {
    if (inDebugMode) {
      console.log(`geoUpdates are finished in ${this.m_updateCounter} steps`);
      const FILE_NAME_GEO = 'geo_final.obj';
      geo.saveGeoToObjFile(FILE_NAME_GEO);
    }
  }

  /**
   * Update geometry with normals, uniformity map and colors distribution
   * @param {object} geo RederGeo to modify
   * @param {number} normalSpeed speed for increase geo size
   */
  updateGeoNormalsUniformityColors(geo, normalSpeed) {
    const numVertices = geo.getNumVertices();
    // float array
    const vertices = geo.getVertices();
    // THREE.Vector3 array
    const normals = geo.getNormals();
    const numTriangles = geo.getNumTriangles();
    const indices = geo.getIndices();

    // perform laplasian smoother
    // ...
    if (this.m_lapSmoother === null) {
      this.m_lapSmoother = new LaplasianSmoother();
    }

    this.m_lapSmoother.performSmoothStep(numVertices, vertices, numTriangles, indices, this.m_verticesNew);

    const DEEP_DEBUG = false;

    // use smoothed vertices to update geo
    const NUM_COMPS_VERTEX = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    let i, i4;

    // when sphere touch edges, this definately means iterations end
    let sphereTouchEdge = false;
    // if too much matched, than stop iterations
    // let numMatchedToColor = 0;

    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERTEX) {
      let vx = vertices[i4 + OFF_0];
      let vy = vertices[i4 + OFF_1];
      let vz = vertices[i4 + OFF_2];
      const vn = normals[i];

      // pixel coordinate in the volume
      let x = Math.floor(vx);
      let y = Math.floor(vy);
      let z = Math.floor(vz);

      if (DEEP_DEBUG && i === 0) {
        console.log(`v = ${vx}, ${vy}, ${vz}. int xyz = ${x},${y},${z}`);
        console.log(`vn = ${vn.x}, ${vn.y}, ${vn.z}`);
      }

      if (x >= this.m_xDim) {
        sphereTouchEdge = true;
        x = this.m_xDim - 1;
      }
      if (y >= this.m_yDim) {
        sphereTouchEdge = true;
        y = this.m_yDim - 1;
      }
      if (z >= this.m_zDim) {
        sphereTouchEdge = true;
        z = this.m_zDim - 1;
      }
      if (x < 0) {
        sphereTouchEdge = true;
        x = 0;
      }
      if (y < 0) {
        sphereTouchEdge = true;
        y = 0;
      }
      if (z < 0) {
        sphereTouchEdge = true;
        z = 0;
      }

      const xyDim = this.m_xDim * this.m_yDim;
      const off = x + y * this.m_xDim + z * xyDim;
      const uni = this.m_imageUniformity[off];
      const valGaussCur = this.m_imageGauss[off];

      if (DEEP_DEBUG && i === 0) {
        console.log(`uni = ${uni}, valGaussCur = ${valGaussCur}`);
      }

      let compSum = uni;
      // predict next position
      const NEXT_STEP = 2.5;
      let nx = Math.floor(vx + vn.x * NEXT_STEP);
      let ny = Math.floor(vy + vn.y * NEXT_STEP);
      let nz = Math.floor(vz + vn.z * NEXT_STEP);

      if (DEEP_DEBUG && i === 0) {
        console.log(`nx = ${nx}, ny = ${ny}, nz = ${nz}`);
      }
      if (nx < 0 || ny < 0 || nz < 0 || nx >= this.m_xDim || ny >= this.m_yDim || nz >= this.m_zDim) {
        sphereTouchEdge = true;
      }
      nx = nx >= 0 ? nx : 0;
      ny = ny >= 0 ? ny : 0;
      nz = nz >= 0 ? nz : 0;
      nx = nx < this.m_xDim ? nx : this.m_xDim - 1;
      ny = ny < this.m_yDim ? ny : this.m_yDim - 1;
      nz = nz < this.m_zDim ? nz : this.m_zDim - 1;

      const nextOff = nx + ny * this.m_xDim + nz * xyDim;
      const valGaussNext = this.m_imageGauss[nextOff];
      const KOEF_GAUSS_DEC_MULT = 0.3;
      if (valGaussNext > valGaussCur) {
        compSum *= KOEF_GAUSS_DEC_MULT;
      }

      if (DEEP_DEBUG && i === 0) {
        console.log(`valGaussNext = ${valGaussNext}`);
      }

      // use colors
      const koef = this.m_colorProbability[Math.floor(valGaussCur)];
      compSum *= koef;
      const COLOR_MATCH = 0.9;
      const isColorMatch = koef <= COLOR_MATCH;
      // numMatchedToColor += (isColorMatch) ? 1 : 0;

      if (DEEP_DEBUG && i === 0) {
        console.log(`koef = ${koef}, isColorMatch = ${isColorMatch}`);
      }

      const vAddSmooth = new THREE.Vector3();
      vAddSmooth.x = this.m_verticesNew[i4 + OFF_0] - vx;
      vAddSmooth.y = this.m_verticesNew[i4 + OFF_1] - vy;
      vAddSmooth.z = this.m_verticesNew[i4 + OFF_2] - vz;
      vAddSmooth.normalize();
      vAddSmooth.multiplyScalar(normalSpeed);

      const vAddGeo = new THREE.Vector3();
      vAddGeo.x = vn.x * compSum * normalSpeed;
      vAddGeo.y = vn.y * compSum * normalSpeed;
      vAddGeo.z = vn.z * compSum * normalSpeed;

      if (DEEP_DEBUG && i === 0) {
        console.log(`vAddSmooth = ${vAddSmooth.x}, ${vAddSmooth.y}, ${vAddSmooth.z}`);
        console.log(`vAddGeo = ${vAddGeo.x}, ${vAddGeo.y}, ${vAddGeo.z}`);
      }

      const KOEF_ADD_SMOOTH = 0.3;
      const KOEF_ADD_GEO = 1.0 - KOEF_ADD_SMOOTH;

      if (isColorMatch) {
        // do nothing
      } else {
        const vNew = new THREE.Vector3();
        vNew.x = vx + vAddGeo.x * KOEF_ADD_GEO + vAddSmooth.x * KOEF_ADD_SMOOTH;
        vNew.y = vy + vAddGeo.y * KOEF_ADD_GEO + vAddSmooth.y * KOEF_ADD_SMOOTH;
        vNew.z = vz + vAddGeo.z * KOEF_ADD_GEO + vAddSmooth.z * KOEF_ADD_SMOOTH;

        vx = vNew.x;
        vy = vNew.y;
        vz = vNew.z;
      }

      this.m_verticesNew[i4 + OFF_0] = vx;
      this.m_verticesNew[i4 + OFF_1] = vy;
      this.m_verticesNew[i4 + OFF_2] = vz;
    } // for i

    // debug
    // if (numMatchedToColor > 0) {
    //   console.log(`numMatchedToColor = ${numMatchedToColor}. geoStage = ${this.m_geoStage}`);
    // }

    // copy back
    let errAve = 0.0;
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERTEX) {
      // estimate error of modification
      const dx = this.m_verticesNew[i4 + OFF_0] - vertices[i4 + OFF_0];
      const dy = this.m_verticesNew[i4 + OFF_1] - vertices[i4 + OFF_1];
      const dz = this.m_verticesNew[i4 + OFF_2] - vertices[i4 + OFF_2];
      const err = dx * dx + dy * dy + dz * dz;
      errAve += err;

      vertices[i4 + OFF_0] = this.m_verticesNew[i4 + OFF_0];
      vertices[i4 + OFF_1] = this.m_verticesNew[i4 + OFF_1];
      vertices[i4 + OFF_2] = this.m_verticesNew[i4 + OFF_2];
    }
    errAve /= numVertices;
    errAve = Math.sqrt(errAve);
    const DIF_VERTICES_LIMIT = 0.12;
    if (errAve < DIF_VERTICES_LIMIT) {
      this.finalizeUpdatesGeo(geo, DEEP_DEBUG);
      return true;
    }
    const aveUni = this.getAveUniformityForGeoVertices(geo);
    const MIN_POSSIBLE_UNIFORMITY = 0.6;
    if (aveUni < MIN_POSSIBLE_UNIFORMITY) {
      this.finalizeUpdatesGeo(geo, DEEP_DEBUG);
      return true;
    }
    if (sphereTouchEdge) {
      this.finalizeUpdatesGeo(geo, DEEP_DEBUG);
      return true;
    }

    const DEEP_ERR_DEBUG = false;
    if (DEEP_ERR_DEBUG) {
      const VERTICES_UNIFORMITY = 1024;
      console.log(`Iters errAve = ${errAve} < ${DIF_VERTICES_LIMIT}. aveUni = ${aveUni} < ${VERTICES_UNIFORMITY}`);
    }
    return false;
  } // updateGeoNormalsUniformityColors
} // class ActiveVolume

/** Output flags */
ActiveVolume.REMOVE_SKULL = 0;
ActiveVolume.CREATE_MASK = 1;

/** Sphere evolve direction */
ActiveVolume.SPHERE_EVOLVE_FROM_INSIDE = 0;
ActiveVolume.SPHERE_EVOLVE_FROM_OUTSIDE = 1;

/** num iteration stages */
ActiveVolume.ACT_VOL_NUM_SMOOTH_STAGES = 64;
