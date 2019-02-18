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
* Dicom folder loader
* @module lib/scripts/loaders/dicomloader
*/

// ******************************************************************
// imports
// ******************************************************************

import FileLoader from './fileloader';
import LocalFileLoader from './localfile';
import LoadResult from './loadresult';
import DicomDictionary from './dicomdict';
import DicomInfo from './dicominfo';
import VolumeTools from './voltools';

// ******************************************************************
// Constants
// ******************************************************************

const DEBUG_PRINT_TAGS_INFO = false;
const DEBUG_PRINT_INDI_SLICE_INFO = false;

/** deep artificially fix volume texture size to even numbers */
const NEED_EVEN_TEXTURE_SIZE = false;

const NEED_SCAN_EMPTY_BORDER = false;
const NEED_APPLY_GAUSS_SMOOTHING = false;
/* eslint-disable */
const MAGIC_DICM = [68, 73, 67, 77];
const DICOM_ERROR_OK = 0;
const DICOM_ERROR_WRONG_HEADER = -1;
const DICOM_ERROR_TOO_SMALL_FILE = -2;

const UNDEFINED_LENGTH = 0xFFFFFFFF;

const TAG_IMAGE_INSTANCE_NUMBER = [0x0020, 0x0013];
const TAG_PIXEL_DATA = [0x7FE0, 0x0010];
const TAG_TRANSFER_SYNTAX = [0x0002, 0x0010];
const TAG_META_LENGTH = [0x0002, 0x0000];
const TAG_BITS_ALLOCATED = [0x0028, 0x0100];
const TAG_IMAGE_ROWS = [0x0028, 0x0010];
const TAG_IMAGE_COLS = [0x0028, 0x0011];
const TAG_IMAGE_HIGH_BIT = [0x0028, 0x0102];
const TAG_IMAGE_SMALL_PIX_VAL = [0x0028, 0x0106];
const TAG_IMAGE_LARGE_PIX_VAL = [0x0028, 0x0107];
const TAG_PIXEL_PADDING_VALUE = [0x0028, 0x0120];
const TAG_PIXEL_SPACING = [0x0028, 0x0030];
const TAG_IMAGE_POSITION = [0x0020, 0x0032];
const TAG_SLICE_LOCATION = [0x0020, 0x1041];
const TAG_SAMPLES_PER_PIXEL = [0x0028, 0x0002];
const TAG_SERIES_DESCRIPTION = [0x0008, 0x103E];
const TAG_END_OF_ITEMS = [0xFFFE, 0xE00D];
const TAG_END_OF_SEQUENCE = [0xFFFE, 0xE0DD];
const TAG_SERIES_NUMBER = [0x0020, 0x0011];
const TAG_SLICE_THICKNESS = [0x0018, 0x0050];

const TRANSFER_SYNTAX_IMPLICIT_LITTLE = '1.2.840.10008.1.2';
const TRANSFER_SYNTAX_EXPLICIT_BIG = '1.2.840.10008.1.2.2';
const TRANSFER_SYNTAX_COMPRESSION_DEFLATE = '1.2.840.10008.1.2.1.99';

// Information from dicom tags, displayed in 2d screen
const TAG_PATIENT_NAME = [0x0010, 0x0010];
const TAG_PATIENT_ID = [0x0010, 0x0020];
const TAG_PATIENT_BIRTH_DATE = [0x0010, 0x0030];
const TAG_PATIENT_GENDER = [0x0010, 0x0040];
const TAG_STUDY_DATE = [0x0008, 0x0020];
const TAG_ACQUISION_TIME = [0x0008, 0x0032];
const TAG_INSTITUTION_NAME = [0x0008, 0x0080];
const TAG_PHYSICANS_NAME = [0x0008, 0x0090];
const TAG_MANUFACTURER_NAME = [0x0008, 0x0070];
/* eslint-enable */

/**
* class DicomTag is used for parse tags inside dicom file structure
*/
class DicomTag {
  /**
   * @param {number} group - group in pair group:element
   * @param {number} element - element in pair group:element
   * @param {string} vr - special string for tag
   * @param {object} value - tag value: data array
   * @param {number} offsetStart - start of tag
   * @param {number} offsetValue - offset value
   * @param {number} offsetEnd - offset in stream
   * @param {number} littleEndian - is in little endian mode numbers encoding
   */
  constructor(group,
    element,
    vr,
    value,
    offsetStart,
    offsetValue,
    offsetEnd,
    littleEndian) {
    /** @property {number} m_group - group for group:element pair */
    this.m_group = group;
    /** @property {number} m_element - element for group:element pair */
    this.m_element = element;
    /** @property {string} m_vr - special VR text for tag */
    this.m_vr = vr;
    /** @property {object} m_value - array with content */
    this.m_value = value;
    /** @property {number} m_offsetStart - start of tag */
    this.m_offsetStart = offsetStart;
    /** @property {number} m_offsetValue - value of tag */
    this.m_offsetValue = offsetValue;
    /** @property {number} m_offsetEnd - end of tag */
    this.m_offsetEnd = offsetEnd;
    /** @property {number} m_littleEndian - is in big/little endian */
    this.m_littleEndian = littleEndian;
  }
  /**
  * get value
  * @return {object} data content of this tag
  */
  value() {
    return this.m_value;
  }

  /**
  * check has transform syntax or not
  * @return {boolean} is transform
  */
  isTransformSyntax() {
    if ((this.m_group === TAG_TRANSFER_SYNTAX[0]) && (this.m_element === TAG_TRANSFER_SYNTAX[1])) {
      return true;
    }
    return false;
  }
  /**
  * check is this tag meta
  * @return {boolean} true, if this tag is meta tag
  */
  isMetaLength() {
    if ((this.m_group === TAG_META_LENGTH[0]) && (this.m_element === TAG_META_LENGTH[1])) {
      return true;
    }
    return false;
  }
  /**
  * check has image bits in this tag data
  * @return {boolean} true, if image bits is inside tag data
  */
  isPixelData() {
    if ((this.m_group === TAG_PIXEL_DATA[0]) && (this.m_element === TAG_PIXEL_DATA[1])) {
      return true;
    }
    return false;
  }
}

/**
* Class DicomSlice Single slice
*/
class DicomSlice {
  constructor() {
    this.m_image = null;
    this.m_sliceNumber = 0;
    this.m_sliceLocation = 0.0;
  }
}

/** Maximum possible slices in volume */
const MAX_SLICES_IN_VOLUME = 1024;
const FLOAT_TOO_STANGE_VALUE = -5555555.5;

/**
* Class DicomSlicesVolume Collected volume (from slices)
*/
class DicomSlicesVolume {
  /** Create empty volume */
  constructor() {
    this.m_numSlices = 0;
    this.m_slices = [];
    for (let i = 0; i < MAX_SLICES_IN_VOLUME; i++) {
      const slice = new DicomSlice();
      slice.m_sliceNumber = -1;
      slice.m_sliceLocation = FLOAT_TOO_STANGE_VALUE;
      slice.m_image = null;
      this.m_slices.push(slice);
    }
    // eslint-disable-next-line
    this.m_minSlice = +1000000;
    this.m_maxSlice = -1;
  }

  /** Destroy volume and initialize values */
  destroy() {
    for (let i = 0; i < this.m_numSlices; i++) {
      this.m_slices[i].m_sliceNumber = -1;
      this.m_slices[i].m_sliceLocation = FLOAT_TOO_STANGE_VALUE;
      this.m_slices[i].m_image = null;
    }
    this.m_numSlices = 0;
    // eslint-disable-next-line
    this.m_minSlice = +1000000;
    this.m_maxSlice = -1;
  }
  getNewSlice() {
    if (this.m_numSlices >= MAX_SLICES_IN_VOLUME) {
      return null;
    }
    const slice = this.m_slices[this.m_numSlices];
    this.m_numSlices += 1;
    return slice;
  }
  updateSliceNumber(sliceNumber) {
    this.m_minSlice = (sliceNumber < this.m_minSlice) ? sliceNumber : this.m_minSlice;
    this.m_maxSlice = (sliceNumber > this.m_maxSlice) ? sliceNumber : this.m_maxSlice;
  }
}

/**
* Class DicomFolderLoader Load dicom files
*/
export default class DicomFolderLoader {

  /**
  * Create loader
  */
  constructor(needScaleDownTexture) {
    this.m_needScaleDownTexture = needScaleDownTexture;
    /** @property {object} m_fileLoader - low level file loader */
    this.m_folder = null;
    /** @property {boolean} m_isLoadedSuccessfull - Loaded flag: success o not */
    this.m_isLoadedSuccessfull = false;
    /** @property {number} m_dataSize - Volume data size in bytes */
    this.m_dataSize = 0;
    /** @property {array} m_dataArray - byte array for volume data */
    this.m_dataArray = null;
    /** dictionary */
    this.m_dictionary = new DicomDictionary();
    /** index of the image in slices set */
    this.m_imageNumber = -1;
    /** @property {array} m_errors - array  with error after file read, used internally */
    this.m_errors = [];
    /** @property {array} m_loaders - array with objects for individual file loading */
    this.m_loaders = [];
    /** @property {number} m_xDim - volume dimension on x (width) */
    this.m_xDim = -1;
    /** @property {number} m_yDim - volume dimension on y (height) */
    this.m_yDim = -1;
    /** @property {number} m_zDim - volume dimension on z (depth) */
    this.m_zDim = -1;
    /** @property {number} m_bitsPerPixel - bits per pixe;. Can be 8, 16, 32 */
    this.m_bitsPerPixel = -1;
    /** @property {number} m_seriesNumber - Index of series to check the same image set in slices */
    this.m_seriesNumber = -1;
    /** @property {string} m_seriesDescription - Description of series */
    this.m_seriesDescription = '';
    /** @property {object} m_boxSize - vertex3f with physic volume dimension */
    this.m_boxSize = {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    };
    /** @property {object} m_boxSize - vertex3f with physic volume dimension */
    this.m_nonEmptyBoxMin = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
    /** @property {object} m_boxSize - vertex3f with physic volume dimension */
    this.m_nonEmptyBoxMax = {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    };

    /** @property {object} m_slicesVolume - Volume, where slices are collected */
    this.m_slicesVolume = new DicomSlicesVolume();
    /** @property {object} m_newTagEvent - custom event, that is send on new tag reading */
    this.m_newTagEvent = new CustomEvent('newTag', {
      detail: {
        group: null,
        element: null,
        desc: null,
        value: null,
        imageNumber: null,
        fileName: null,
      },
    });
    /** @property {Object} m_info - Patient name, patient gender, ... */
    this.m_dicomInfo = new DicomInfo();
  }
  getBoxSize() {
    return this.m_boxSize;
  }
  getNonEmptyBoxMin() {
    return this.m_nonEmptyBoxMin;
  }
  getNonEmptyBoxMax() {
    return this.m_nonEmptyBoxMax;
  }

  getDicomInfo() {
    return this.m_dicomInfo;
  }

  /**
  * Create volume data array from individual slices, loaded from different files
  * @return {LoadResult} LoadResult.SUCCESS if success
  */
  createVolumeFromSlices() {
    let i;
    let dataSize = 0;
    let dataArray = null;

    // normal copy volume with transform 16 -> 8 bit
    dataSize = this.m_xDim * this.m_yDim * this.m_zDim;
    dataArray = new Uint8Array(dataSize);
    if (dataArray === null) {
      console.log('no memory');
      return LoadResult.ERROR_NO_MEMORY;
    }
    for (i = 0; i < dataSize; i++) {
      dataArray[i] = 0;
    }
    let xyDim = this.m_xDim * this.m_yDim;
    let maxVal = 0;

    if (this.m_slicesVolume.m_numSlices !== this.m_zDim) {
      console.log('Error logic zDim');
      return LoadResult.ERROR_WRONG_NUM_SLICES;
    }

    const numSlices = this.m_slicesVolume.m_numSlices;
    for (let s = 0; s < numSlices; s++) {
      const slice = this.m_slicesVolume.m_slices[s];
      const sliceData16 = slice.m_image;
      for (i = 0; i < xyDim; i++) {
        const val16 = sliceData16[i];
        maxVal = (val16 > maxVal) ? val16 : maxVal;
      } // for (i) all slice pixels
    }  // for (s) all slices
    // allocate one more entry for values
    maxVal++;

    console.log(`Build Volume. max value=${maxVal}. Volume dim = ${this.m_xDim}*${this.m_yDim}*${this.m_zDim}`);
    console.log(`Min slice number = ${this.m_slicesVolume.m_minSlice}`);
    console.log(`Max slice number = ${this.m_slicesVolume.m_maxSlice}`);

    const histogram = new Int32Array(maxVal);
    for (i = 0; i < maxVal; i++) {
      histogram[i] = 0;
    }
    for (let s = 0; s < numSlices; s++) {
      const slice = this.m_slicesVolume.m_slices[s];
      const sliceData16 = slice.m_image;
      for (i = 0; i < xyDim; i++) {
        const val16 = sliceData16[i];
        histogram[val16]++;
      }
    }
    const histSmooothed = new Int32Array(maxVal);
    const HIST_SMOOTH_SIGMA = 0.8;
    const okBuild = VolumeTools.buildSmoothedHistogram(histogram, histSmooothed, maxVal, HIST_SMOOTH_SIGMA);
    if (okBuild !== 1) {
      console.log('Error build histogram');
      return LoadResult.ERROR_PROCESS_HISTOGRAM;
    }

    // Find val max in smoothed histogram
    const VAL_8 = 8;
    maxVal -= 1;
    for (; maxVal > VAL_8; maxVal--) {
      if (histSmooothed[maxVal] > 0) {
        break;
      }
    }
    // Find last local max in smoothed historgam
    let idxLastLocalMax = 0;
    for (i = maxVal - VAL_8; i > VAL_8; i--) {
      let iL = i - 1;
      let iR = i + 1;
      while ((histSmooothed[i] === histSmooothed[iL]) && (iL >= VAL_8)) {
        iL -= 1;
      }
      while ((histSmooothed[i] === histSmooothed[iR]) && (iR < maxVal - VAL_8)) {
        iR += 1;
      }
      if ((histSmooothed[i] > histSmooothed[iL]) && (histSmooothed[i] > histSmooothed[iR])) {
        idxLastLocalMax = i;
        break;
      } // if
    } // for i
    const TWICE = 2;
    const idxSomeAfterMax = Math.floor((idxLastLocalMax + maxVal) / TWICE);
    const yLocMax = histSmooothed[idxLastLocalMax];
    const yAftMax = histSmooothed[idxSomeAfterMax];
    console.log(`Build Volume. idxLastLocalMax = ${idxLastLocalMax}, maxVal = ${maxVal}`);

    if (yLocMax !== yAftMax) {
      // linear approximation
      const deltaIndex = idxSomeAfterMax - idxLastLocalMax;
      if (deltaIndex === 0) {
        console.log('Critical error build 8bit volume');
        return LoadResult.ERROR_HISTOGRAM_DETECT_RIDGES;
      }
      const koefA = (yAftMax - yLocMax) / deltaIndex;
      const koefB = yAftMax - koefA * idxSomeAfterMax;
      const xMax = koefB / (-koefA);
      maxVal = Math.floor(xMax);
    } else {
      // same function level: just select minimum x
      maxVal = idxLastLocalMax;
    }
    console.log(`Build Volume. max value after search last hill ${maxVal}`);

    const BITS_ACCUR = 11;
    const BITS_IN_BYTE = 8;
    const scale = Math.floor((1 << (BITS_IN_BYTE + BITS_ACCUR)) / maxVal);
    const TOO_MIN_SCALE = 4;
    if (scale <= TOO_MIN_SCALE) {
      console.log('Bad scaling: image will be 0');
      return LoadResult.ERROR_SCALING;
    }

    // remove unused objects in slices (make length equal to actual number of slices)
    this.m_slicesVolume.m_slices = this.m_slicesVolume.m_slices.slice(0, numSlices);
    const srcSlices = this.m_slicesVolume.m_slices;

    const numSlicesByTags = this.m_slicesVolume.m_maxSlice - this.m_slicesVolume.m_minSlice + 1;
    if (numSlicesByTags !== numSlices) {
      console.log(`Sort by location! N slices by tags = ${numSlicesByTags}, but N readed slices = ${numSlices}`);
      // sort slices via slice location
      srcSlices.sort((a, b) => {
        const zDif = a.m_sliceLocation - b.m_sliceLocation;
        return zDif;
      });
      // assign new slice numbers according accending location
      for (let s = 0; s < numSlices; s++) {
        srcSlices[s].m_sliceNumber = s;
      }
    }

    const MAX_BYTE = 255;
    for (let s = 0; s < numSlices; s++) {
      const slice = srcSlices[s];
      const sliceData16 = slice.m_image;
      // console.log(`Slice[${s}] sliceNumber = ${slice.m_sliceNumber} sliceLocation = ${slice.m_sliceLocation}`);

      // const z = slice.m_sliceNumber - this.m_slicesVolume.m_minSlice;
      let z = slice.m_sliceNumber;
      if (z >= this.m_slicesVolume.m_numSlices) {
        z = slice.m_sliceNumber - this.m_slicesVolume.m_minSlice;
        if ((z < 0) || (z >= this.m_zDim)) {
          console.log('Invalid z slice reference');
          return LoadResult.ERROR_INVALID_SLICE_INDEX;
        } // if z invalid
      } // if z more num slices

      if (sliceData16 !== null) {
        const offZ = z * xyDim;
        for (i = 0; i < xyDim; i++) {
          const val16 = sliceData16[i];
          let val = (val16 * scale) >> BITS_ACCUR;
          val = (val <= MAX_BYTE) ? val : MAX_BYTE;
          dataArray[offZ + i] = val;
        } // for i
      } // if has slice data
    } // for(s) all slices

    this.m_slicesVolume.destroy();

    // Scale down volume by slices
    const numPixelsInVolume = this.m_xDim * this.m_yDim * this.m_zDim;
    // eslint-disable-next-line
    const MAX_VOLUME_PIXELS = 512 * 512 * 256;
    if (this.m_needScaleDownTexture && (numPixelsInVolume > MAX_VOLUME_PIXELS)) {
      const XY_MAX_DIM = 512;
      const Z_LOW_DIM = 120;
      const xDimDst = (this.m_xDim <= XY_MAX_DIM) ? this.m_xDim : XY_MAX_DIM;
      const yDimDst = (this.m_yDim <= XY_MAX_DIM) ? this.m_yDim : XY_MAX_DIM;
      const zDimDst = Z_LOW_DIM;
      const dataNew = VolumeTools.scaleTextureDown(this, dataArray, xDimDst, yDimDst, zDimDst);
      dataArray = dataNew;
      xyDim = this.m_xDim * this.m_yDim;
      console.log(`Volume scaled down to: ${xDimDst} * ${yDimDst} * ${zDimDst}.`);
    }

    // Scan for empty voxels on border sides
    if (NEED_SCAN_EMPTY_BORDER) {
      const xDim = this.m_xDim;
      const yDim = this.m_yDim;
      const zDim = this.m_zDim;

      const minValBarrier = 16;
      let x;
      let y;
      let z;
      let isEmpty;
      isEmpty = true;
      for (x = 0; (x < xDim / TWICE) && (isEmpty); x++) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (dataArray[off] > minValBarrier) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      const xBorderMin = x;

      isEmpty = true;
      for (x = xDim - 1; (x > xDim / TWICE) && (isEmpty); x--) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (dataArray[off] > minValBarrier) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      const xBorderMax = x;

      isEmpty = true;
      for (y = 0; (y < yDim / TWICE) && (isEmpty); y++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (dataArray[off] > minValBarrier) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      const yBorderMin = y;

      isEmpty = true;
      for (y = yDim - 1; (y > yDim / TWICE) && (isEmpty); y--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (dataArray[off] > minValBarrier) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      const yBorderMax = y;

      isEmpty = true;
      for (z = 0; (z < zDim / TWICE) && (isEmpty); z++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (y = 0; (y < yDim) && (isEmpty); y++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (dataArray[off] > minValBarrier) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      const zBorderMin = z;

      isEmpty = true;
      for (z = zDim - 1; (z > zDim / TWICE) && (isEmpty); z--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (y = 0; (y < yDim) && (isEmpty); y++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (dataArray[off] > minValBarrier) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      const zBorderMax = z;

      // console.log(`Border scan: xBorderMin = ${xBorderMin}, xBorderMax = ${xBorderMax}. xDim = ${xDim}`);
      // console.log(`Border scan: yBorderMin = ${yBorderMin}, yBorderMax = ${yBorderMax}. yDim = ${yDim}`);
      // console.log(`Border scan: zBorderMin = ${zBorderMin}, zBorderMax = ${zBorderMax}. zDim = ${zDim}`);
      this.m_nonEmptyBoxMin.x = xBorderMin / xDim;
      this.m_nonEmptyBoxMin.y = yBorderMin / yDim;
      this.m_nonEmptyBoxMin.z = zBorderMin / zDim;
      this.m_nonEmptyBoxMax.x = xBorderMax / xDim;
      this.m_nonEmptyBoxMax.y = yBorderMax / yDim;
      this.m_nonEmptyBoxMax.z = zBorderMax / zDim;

      this.m_boxSize.z = (zBorderMax - zBorderMin) * this.m_pixelSpacing.z;
      this.m_boxSize.x = (xBorderMax - xBorderMin) * this.m_pixelSpacing.x;
      this.m_boxSize.y = (yBorderMax - yBorderMin) * this.m_pixelSpacing.y;

      const neMin = this.m_nonEmptyBoxMin;
      const neMax = this.m_nonEmptyBoxMax;
      console.log(`Border scan min: ${neMin.x}, ${neMin.y}, ${neMin.z}`);
      console.log(`Border scan max: ${neMax.x}, ${neMax.y}, ${neMax.z}`);
    } // if need scan empty borders

    // Special volume texture size fix (z dim should be even)
    if (NEED_EVEN_TEXTURE_SIZE) {
      const xDim = this.m_xDim;
      const yDim = this.m_yDim;
      const zDim = this.m_zDim;
      if ((zDim & 1) !== 0) {
        const volDataAlignedSize = VolumeTools.makeTextureSizeEven(dataArray, xDim, yDim, zDim);
        // Align all dims to 4*x
        const NUM3 = 3;
        this.m_xDim = (xDim + NUM3) & (~NUM3);
        this.m_yDim = (yDim + NUM3) & (~NUM3);
        this.m_zDim = (zDim + NUM3) & (~NUM3);
        dataArray = volDataAlignedSize;
      }
    }

    // Apply Gauss smooth filter
    if (NEED_APPLY_GAUSS_SMOOTHING) {
      const volTools = new VolumeTools();
      const GAUSS_RADIUS = 2;
      const GAUSS_SIGMA = 1.4;
      volTools.gaussSmooth(dataArray, this.m_xDim, this.m_yDim, this.m_zDim, GAUSS_RADIUS, GAUSS_SIGMA);
    }

    // Apply 0 to the edges of volume
    const MIN_NUM_SLICES_FOR_VOL = 4;
    if (this.m_zDim > MIN_NUM_SLICES_FOR_VOL) {
      let x;
      let y;
      let z;
      let yOff;
      let zOff;
      // z planes
      z = 0;
      const zOffMin = z * this.m_xDim * this.m_yDim;
      z = this.m_zDim - 1;
      const zOffMax = z * this.m_xDim * this.m_yDim;
      for (y = 0; y < this.m_yDim; y++) {
        yOff = y * this.m_xDim;
        for (x = 0; x < this.m_xDim; x++) {
          dataArray[zOffMin + yOff + x] = 0;
          dataArray[zOffMax + yOff + x] = 0;
        } // for x
      }  // for y

      // x planes
      x = 0;
      const xOffMin = x;
      x = this.m_xDim - 1;
      const xOffMax = x;
      for (z = 0; z < this.m_zDim; z++) {
        zOff = z * this.m_xDim * this.m_yDim;
        for (y = 0; y < this.m_yDim; y++) {
          yOff = y * this.m_xDim;
          dataArray[zOff + yOff + xOffMin] = 0;
          dataArray[zOff + yOff + xOffMax] = 0;
        }
      }
      // y planes
      y = 0;
      const yOffMin = y * this.m_xDim;
      y = this.m_yDim - 1;
      const yOffMax = y * this.m_xDim;
      for (z = 0; z < this.m_zDim; z++) {
        zOff = z * this.m_xDim * this.m_yDim;
        for (x = 0; x < this.m_xDim; x++) {
          dataArray[zOff + x + yOffMin] = 0;
          dataArray[zOff + x + yOffMax] = 0;
        } // for x
      } // for z
    } // if zDim more min possible for volume

    const KTX_GL_RED = 0x1903;
    const KTX_UNSIGNED_BYTE = 0x1401;
    const header = {
      m_pixelWidth: this.m_xDim,
      m_pixelHeight: this.m_yDim,
      m_pixelDepth: this.m_zDim,
      m_glType: KTX_UNSIGNED_BYTE,
      m_glTypeSize: 1,
      m_glFormat: KTX_GL_RED,
      m_glInternalFormat: KTX_GL_RED,
      m_glBaseInternalFormat: KTX_GL_RED,
    };
    const callbackRead = this.m_callbackRead;
    if (callbackRead) {
      callbackRead(LoadResult.SUCCESS, header, dataSize, dataArray);
    } // if callback ready
    return LoadResult.SUCCESS;
  } // createVolumeFromSlices

  /**
  * Read dicom folder from URL
  * @param {string} strFolder - Folder to read dicom from.
  * @param {object} callbackFunc - function, invoked after read binary file into byte array
  * @return {boolean} true, if read success
  */
  readFolder(strFolder, callbackRead, callbackProgress) {
    this.m_folder = strFolder;
    this.m_slicesVolume.destroy();
    const urlFileList = `${this.m_folder}/file_list.txt`;
    const fileLoader = new FileLoader(urlFileList);
    // some hack to avoid load twice
    this.m_callbackRead = callbackRead;
    this.m_callbackProgress = callbackProgress;

    this.m_fileListCounter = 0;
    fileLoader.readFile((arrBuf) => {
      this.m_fileListCounter += 1;
      if (this.m_fileListCounter === 1) {
        const okRead = this.readReadyFileList(arrBuf);
        return okRead;
      }
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      callbackRead(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
      return false;
    }); // get file from server
    return true;
  }  // readFile

  /**
  * Run loader to read dicom file
  * @param {string} fileName - File to read
  * @param {object} loader - loader object with file inside
  * @param {number} i - index of file in files array
  */
  runLoader(fileName, loader, i, callbackProgress) {
    loader.readFile((fileArrBu) => {
      const VAL_MASK = 7;
      if ((callbackProgress !== undefined) && ((this.m_filesLoadedCounter & VAL_MASK) === 0)) {
        const ratioLoaded = this.m_filesLoadedCounter / this.m_numLoadedFiles;
        callbackProgress(ratioLoaded);
      }
      if ((callbackProgress !== undefined) &&
        (this.m_filesLoadedCounter + 1 === this.m_numLoadedFiles)) {
        callbackProgress(1.0);
      }
      this.m_newTagEvent.detail.fileName = fileName;
      const status = this.parseDicomFileBuffer(i, fileArrBu);
      if ((status !== LoadResult.SUCCESS) && (this.m_numFailsLoad === 0)) {
        this.m_numFailsLoad += 1;
        if (this.m_callbackRead !== null) {
          this.m_callbackRead(status, null, 0, null, fileName);
          return false;
        }
      }
      // update total files counter
      this.m_filesLoadedCounter += 1;
      if (DEBUG_PRINT_INDI_SLICE_INFO) {
        console.log(`Loaded local indi slice: ${fileName}. Total loaded slices: ${this.m_filesLoadedCounter}`);
      }
      if (this.m_filesLoadedCounter === this.m_numLoadedFiles) {
        // Finalize physic dimension
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`slice location (min, max) = ${this.m_sliceLocMin}, ${this.m_sliceLocMax}`);
        }
        const imagePosBox = {
          x: this.m_imagePosMax.x - this.m_imagePosMin.x,
          y: this.m_imagePosMax.y - this.m_imagePosMin.y,
          z: this.m_imagePosMax.z - this.m_imagePosMin.z
        };
        const TOO_MIN = 0.00001;
        let zBox;
        if (Math.abs(this.m_pixelSpacing.z) > TOO_MIN) {
          zBox = this.m_pixelSpacing.z * this.m_zDim;
        } else {
          zBox = imagePosBox.z;
          if (Math.abs(zBox) < TOO_MIN) {
            zBox = imagePosBox.x;
            if (Math.abs(zBox) < TOO_MIN) {
              zBox = imagePosBox.y;
            }
          }
        } // if pixel spacing 0
        this.m_pixelSpacing.z = zBox / this.m_zDim;
        this.m_boxSize.z = this.m_zDim * this.m_pixelSpacing.z;
        this.m_boxSize.x = this.m_xDim * this.m_pixelSpacing.x;
        this.m_boxSize.y = this.m_yDim * this.m_pixelSpacing.y;
        console.log(`Volume local phys dim: ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
        const errStatus = this.createVolumeFromSlices();
        if (errStatus !== LoadResult.SUCCESS) {
          if (this.m_callbackRead !== null) {
            this.m_callbackRead(errStatus, null, 0, null, fileName);
            return false;
          }
          return false;
        }
      }
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      return false;
    }); // end of readfile
    return true;
  }

  /**
  * Read dicom files set from given files array
  * @param {array} files - array with selected files, used in GUI
  * @param {object} callbackRead - function, invoked after read binary file into byte array
  * @param {object} callbackProgress - function, invoked after read each file in
  *                                    dicom structure (organize percent show)
  * @return {boolean} true, if read success
  */
  readFiles(files, callbackRead, callbackProgress) {
    this.m_folder = null;
    this.m_callbackRead = callbackRead;
    this.m_callbackProgress = callbackProgress;
    this.m_fileListCounter = 0;
    this.m_numFailsLoad = 0;
    this.m_slicesVolume.destroy();
    const numFiles = files.length;

    this.m_zDim = numFiles;
    console.log(`Loaded loal file list. ${numFiles} files will be loaded. 1st file in list is = ${files[0].name}`);

    // declare slices array
    for (let i = 0; i < numFiles; i++) {
      // this.m_slices[i] = null;
      this.m_errors[i] = -1;
      this.m_loaders[i] = null;
    }

    // physical dimension
    this.m_pixelSpacing = {
      x: 0.0,
      y: 0.0,
      z: 0.0
    };
    this.m_filesLoadedCounter = 0;
    this.m_numLoadedFiles = numFiles;

    this.m_imagePosMin = {
      // eslint-disable-next-line
      x: +1.0e12,
      // eslint-disable-next-line
      y: +1.0e12,
      // eslint-disable-next-line
      z: +1.0e12
    };
    this.m_imagePosMax = {
      // eslint-disable-next-line
      x: -1.0e12,
      // eslint-disable-next-line
      y: -1.0e12,
      // eslint-disable-next-line
      z: -1.0e12
    };

    // eslint-disable-next-line
    this.m_sliceLocMin = +1.0e12;
    // eslint-disable-next-line
    this.m_sliceLocMax = -1.0e12;

    for (let i = 0; (i < this.m_numLoadedFiles) && (this.m_numFailsLoad < 1); i++) {
      const file = files[i];
      this.m_loaders[i] = new LocalFileLoader(file);
      const loader = this.m_loaders[i];
      const okLoad = this.runLoader(file.name, loader, i, callbackProgress);
      if (!okLoad) {
        return false;
      }
    }
    return true;
  }

  /**
  * Read loaded files list using callback
  * @param {object} arrBuf - content of file list. Content is a text file
  * @param {object} callbackFunc - user callback after read is completed
  * @return {boolean} true, if read success
  */
  readReadyFileList(arrBuf) {
    const uint8Arr = new Uint8Array(arrBuf);
    // const strFileContent = new TextDecoder('utf-8').decode(uint8Arr);
    const strFileContent = String.fromCharCode.apply(null, uint8Arr);

    const LEN_LOG = 32;
    const strLog = strFileContent.substr(0, LEN_LOG);
    console.log(`Loaded file list. Started with:  ${strLog}`);

    const arrFileNames = strFileContent.split('\n');
    let numFiles = arrFileNames.length;
    // check last empty elements
    const MIN_FILE_NAME_SIZE = 4;
    for (let i = numFiles - 1; i > 0; i--) {
      if (arrFileNames[i].length < MIN_FILE_NAME_SIZE) {
        arrFileNames.pop();
      }
    }
    numFiles = arrFileNames.length;

    this.m_zDim = numFiles;
    console.log(`Loaded file list. ${numFiles} files will be loaded. 1st file in list is = ${arrFileNames[0]}`);

    // declare slices array
    for (let i = 0; i < numFiles; i++) {
      // this.m_slices[i] = null;
      this.m_errors[i] = -1;
      this.m_loaders[i] = null;
    }

    // physical dimension
    this.m_pixelSpacing = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
    this.m_filesLoadedCounter = 0;
    this.m_numFailsLoad = 0;
    this.m_numLoadedFiles = numFiles;

    this.m_imagePosMin = {
      // eslint-disable-next-line
      x: +1.0e12,
      // eslint-disable-next-line
      y: +1.0e12,
      // eslint-disable-next-line
      z: +1.0e12
    };
    this.m_imagePosMax = {
      // eslint-disable-next-line
      x: -1.0e12,
      // eslint-disable-next-line
      y: -1.0e12,
      // eslint-disable-next-line
      z: -1.0e12
    };

    // eslint-disable-next-line
    this.m_sliceLocMin = +1.0e12;
    // eslint-disable-next-line
    this.m_sliceLocMax = -1.0e12;

    const callbackProgress = this.m_callbackProgress;
    for (let i = 0; (i < this.m_numLoadedFiles) && (this.m_numFailsLoad < 1); i++) {
      const urlFile = `${this.m_folder}/${arrFileNames[i]}`;
      this.m_loaders[i] = new FileLoader(urlFile);
      const loader = this.m_loaders[i];
      const okLoader = this.runLoader(arrFileNames[i], loader, i, callbackProgress);
      if (!okLoader) {
        return false;
      }
    }  // for i all files-slices in folder
    return true;
  }    // readReadyFileList

  /**
  * Parse individual DCM file from folder
  * @param {number} indexFile - index of file
  * @param {array} arrayBuf - ArrayBuffer with source file content
  * @return {LoadResult} result code
  */
  parseDicomFileBuffer(indexFile, arrayBuf) {
    // build 8 byte buffer from abstract arrau buffer
    const dataView = new DataView(arrayBuf);
    if (dataView === null) {
      console.log('No memory');
      return LoadResult.ERROR_NO_MEMORY;
    }
    const fileSize = dataView.byteLength;
    // check dicom header
    const SIZE_HEAD = 144;
    if (fileSize < SIZE_HEAD) {
      this.m_errors[indexFile] = DICOM_ERROR_TOO_SMALL_FILE;
      return LoadResult.WRONG_HEADER_DATA_SIZE;
    }
    const OFF_MAGIC = 128;
    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;
    for (let i = 0; i < SIZE_DWORD; i++) {
      const v = dataView.getUint8(OFF_MAGIC + i);
      if (v !== MAGIC_DICM[i]) {
        this.m_errors[indexFile] = DICOM_ERROR_WRONG_HEADER;
        console.log('DICM header NOT found');
        return LoadResult.WRONG_HEADER_MAGIC;
      }
    }
    let offset = OFF_MAGIC;
    offset += SIZE_DWORD;

    this.m_littleEndian = true;
    this.m_explicit = true;
    this.m_metaFound = false;
    this.m_metaFinished = false;
    this.m_metaFinishedOffset = -1;
    this.m_needsDeflate = false;

    this.m_imageNumber = -1;
    this.m_xDim = -1;
    this.m_yDim = -1;
    this.m_bitsPerPixel = -1;
    let pixelBitMask = 0;
    let pixelPaddingValue = 0;
    let pixelsTagReaded = false;
    let pixelMinValue = -1;
    let pixelMaxValue = -1;

    // read tag by tag, until image tag
    let tag;
    for (tag = this.getNextTag(dataView, offset); tag !== null;) {
      if (tag.isPixelData()) {
        pixelsTagReaded = true;
        break;
      }
      offset = tag.m_offsetEnd;
      tag = this.getNextTag(dataView, offset);
      if (tag === null) {
        break;
      }
      // get important info from tag: image number
      if ((tag.m_group === TAG_IMAGE_INSTANCE_NUMBER[0]) && (tag.m_element === TAG_IMAGE_INSTANCE_NUMBER[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strNum = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        this.m_imageNumber = parseInt(strNum, 10) - 1;
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`Str = ${strNum}, ImageNumber = ${this.m_imageNumber}`);
        }
      }
      // get important tag: image rows
      if ((tag.m_group === TAG_IMAGE_ROWS[0]) && (tag.m_element === TAG_IMAGE_ROWS[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const yDim = (dataLen === SIZE_SHORT) ?
          dv.getUint16(0, this.m_littleEndian) : dv.getUint32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`yDim = ${yDim}`);
        }
        if (this.m_yDim < 0) {
          this.m_yDim = yDim;
        } else if (this.m_yDim !== yDim) {
          console.log('Bad image size y');
          return LoadResult.WRONG_IMAGE_DIM_Y;
        }
      }
      // get important tag: image cols
      if ((tag.m_group === TAG_IMAGE_COLS[0]) && (tag.m_element === TAG_IMAGE_COLS[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const xDim = (dataLen === SIZE_SHORT) ?
          dv.getUint16(0, this.m_littleEndian) : dv.getUint32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`xDim = ${xDim}`);
        }
        if (this.m_xDim < 0) {
          this.m_xDim = xDim;
        } else if (this.m_xDim !== xDim) {
          console.log('Bad image size x');
          return LoadResult.WRONG_IMAGE_DIM_X;
        }
      }
      // get important tag: bits allocated
      if ((tag.m_group === TAG_BITS_ALLOCATED[0]) && (tag.m_element === TAG_BITS_ALLOCATED[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_bitsPerPixel = (dataLen === SIZE_SHORT) ?
          dv.getUint16(0, this.m_littleEndian) : dv.getUint32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`bitsPerPixel = ${this.m_bitsPerPixel}`);
        }
      }

      // get series number
      if ((tag.m_group === TAG_SERIES_NUMBER[0]) && (tag.m_element === TAG_SERIES_NUMBER[1])) {
        if ((tag.m_value != null) && (tag.m_value.byteLength > 0)) {
          const dataLen = tag.m_value.byteLength;
          const dv = new DataView(tag.m_value);
          const strNum = DicomFolderLoader.getStringAt(dv, 0, dataLen);
          this.m_seriesNumber = parseInt(strNum, 10);
          if (DEBUG_PRINT_TAGS_INFO) {
            console.log(`Str = ${strNum}, SeriesNumber = ${this.m_seriesNumber}`);
          }
        } // if non zero data
      } // series number

      // get important tag: series description
      if ((tag.m_group === TAG_SERIES_DESCRIPTION[0]) && (tag.m_element === TAG_SERIES_DESCRIPTION[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_seriesDescription = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`Series description = ${this.m_seriesDescription}`);
        }
      }

      // get important tag: hight bit
      if ((tag.m_group === TAG_IMAGE_HIGH_BIT[0]) && (tag.m_element === TAG_IMAGE_HIGH_BIT[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const highBit = (dataLen === SIZE_SHORT) ?
          dv.getUint16(0, this.m_littleEndian) : dv.getUint32(0, this.m_littleEndian);
        pixelBitMask = (1 << (highBit + 1)) - 1;
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`highBit = ${highBit}`);
        }
      }

      // get important tag: min pixel value
      if ((tag.m_group === TAG_IMAGE_SMALL_PIX_VAL[0]) && (tag.m_element === TAG_IMAGE_SMALL_PIX_VAL[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        pixelMinValue = (dataLen === SIZE_SHORT) ?
          dv.getInt16(0, this.m_littleEndian) : dv.getInt32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`pixelMinValue = ${pixelMinValue}`);
        }
      }

      // get important tag: max pixel value
      if ((tag.m_group === TAG_IMAGE_LARGE_PIX_VAL[0]) && (tag.m_element === TAG_IMAGE_LARGE_PIX_VAL[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        pixelMaxValue = (dataLen === SIZE_SHORT) ?
          dv.getInt16(0, this.m_littleEndian) : dv.getInt32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`pixelMaxValue = ${pixelMaxValue}`);
        }
      }

      // get important tag: pixel padding value
      if ((tag.m_group === TAG_PIXEL_PADDING_VALUE[0]) && (tag.m_element === TAG_PIXEL_PADDING_VALUE[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        pixelPaddingValue = (dataLen === SIZE_SHORT) ?
          dv.getUint16(0, this.m_littleEndian) : dv.getUint32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`pixelPaddingValue = ${pixelPaddingValue}`);
        }
      }
      // get important tag: pixel spacing in 2d (xy)
      if ((tag.m_group === TAG_PIXEL_SPACING[0]) && (tag.m_element === TAG_PIXEL_SPACING[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strPixelSpacing = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        const strArr = strPixelSpacing.split('\\');
        if (strArr.length === SIZE_SHORT) {
          this.m_pixelSpacing.x = parseFloat(strArr[0]);
          this.m_pixelSpacing.y = parseFloat(strArr[1]);
          if (DEBUG_PRINT_TAGS_INFO) {
            console.log(`TAG. pixel spacing xy = ${this.m_pixelSpacing.x} * ${this.m_pixelSpacing.y}`);
          }
        }
      }
      // get important tag: image position (x,y,z)
      if ((tag.m_group === TAG_IMAGE_POSITION[0]) && (tag.m_element === TAG_IMAGE_POSITION[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strImagePosition = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        const strArr = strImagePosition.split('\\');
        const NUM_COMPONENTS_3 = 3;
        if (strArr.length === NUM_COMPONENTS_3) {
          // eslint-disable-next-line
          const xPos = parseFloat(strArr[0]);
          // eslint-disable-next-line
          const yPos = parseFloat(strArr[1]);
          // eslint-disable-next-line
          const zPos = parseFloat(strArr[2]);
          this.m_imagePosMin.x = (xPos < this.m_imagePosMin.x) ? xPos : this.m_imagePosMin.x;
          this.m_imagePosMin.y = (yPos < this.m_imagePosMin.y) ? yPos : this.m_imagePosMin.y;
          this.m_imagePosMin.z = (zPos < this.m_imagePosMin.z) ? zPos : this.m_imagePosMin.z;
          this.m_imagePosMax.x = (xPos > this.m_imagePosMax.x) ? xPos : this.m_imagePosMax.x;
          this.m_imagePosMax.y = (yPos > this.m_imagePosMax.y) ? yPos : this.m_imagePosMax.y;
          this.m_imagePosMax.z = (zPos > this.m_imagePosMax.z) ? zPos : this.m_imagePosMax.z;
          if (DEBUG_PRINT_TAGS_INFO) {
            console.log(`TAG. image position x,y,z = ${xPos}, ${yPos}, ${zPos}`);
          }
        }
      }

      // slice thickness
      if ((tag.m_group === TAG_SLICE_THICKNESS[0]) && (tag.m_element === TAG_SLICE_THICKNESS[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strSliceThickness = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        this.m_pixelSpacing.z = parseFloat(strSliceThickness);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`TAG. slice thickness = ${this.m_pixelSpacing.z}`);
        }
      }

      // get important tag: slice location (x,y,z)
      if ((tag.m_group === TAG_SLICE_LOCATION[0]) && (tag.m_element === TAG_SLICE_LOCATION[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strSliceLocation = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        const sliceLoc = parseFloat(strSliceLocation);
        this.m_sliceLocation = sliceLoc;
        this.m_sliceLocMin = (sliceLoc < this.m_sliceLocMin) ? sliceLoc : this.m_sliceLocMin;
        this.m_sliceLocMax = (sliceLoc > this.m_sliceLocMax) ? sliceLoc : this.m_sliceLocMax;
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`TAG. Slice location = ${strSliceLocation}`);
        }
      }

      // get important tag: samples per pixel
      if ((tag.m_group === TAG_SAMPLES_PER_PIXEL[0]) && (tag.m_element === TAG_SAMPLES_PER_PIXEL[1])) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_samplesPerPixel = (dataLen === SIZE_SHORT) ?
          dv.getUint16(0, this.m_littleEndian) : dv.getUint32(0, this.m_littleEndian);
        if (DEBUG_PRINT_TAGS_INFO) {
          console.log(`samplesPerPixel = ${this.m_samplesPerPixel}`);
        }
      }
      // dicom info
      if ((tag.m_group === TAG_PATIENT_NAME[0]) && (tag.m_element === TAG_PATIENT_NAME[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_patientName = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_patientName = ${this.m_dicomInfo.m_patientName}`);
      }
      if ((tag.m_group === TAG_PATIENT_ID[0]) && (tag.m_element === TAG_PATIENT_ID[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_patientId = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_patientId = ${this.m_dicomInfo.m_patientId}`);
      }
      if ((tag.m_group === TAG_PATIENT_GENDER[0]) && (tag.m_element === TAG_PATIENT_GENDER[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_patientGender = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_patientGender = ${this.m_dicomInfo.m_patientGender}`);
      }
      if ((tag.m_group === TAG_PATIENT_BIRTH_DATE[0]) && (tag.m_element === TAG_PATIENT_BIRTH_DATE[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strDateMerged = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // eslint-disable-next-line
        const strY = strDateMerged.substring(0, 4);
        // eslint-disable-next-line
        const strM = strDateMerged.substring(4, 6);
        // eslint-disable-next-line
        const strD = strDateMerged.substring(6);
        this.m_dicomInfo.m_patientDateOfBirth = `${strD}/${strM}/${strY}`;
        // console.log(`m_patientDateOfBirth = ${this.m_dicomInfo.m_patientDateOfBirth}`);
      }
      if ((tag.m_group === TAG_STUDY_DATE[0]) && (tag.m_element === TAG_STUDY_DATE[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        const strDateMerged = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // eslint-disable-next-line
        const strY = strDateMerged.substring(0, 4);
        // eslint-disable-next-line
        const strM = strDateMerged.substring(4, 6);
        // eslint-disable-next-line
        const strD = strDateMerged.substring(6);
        this.m_dicomInfo.m_studyDate = `${strD}/${strM}/${strY}`;
        // console.log(`m_studyDate = ${this.m_dicomInfo.m_studyDate}`);
      }
      if ((tag.m_group === TAG_ACQUISION_TIME[0]) && (tag.m_element === TAG_ACQUISION_TIME[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_acquisionTime = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_acquisionTime = ${this.m_dicomInfo.m_acquisionTime}`);
      }
      if ((tag.m_group === TAG_INSTITUTION_NAME[0]) && (tag.m_element === TAG_INSTITUTION_NAME[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_institutionName = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_institutionName = ${this.m_dicomInfo.m_institutionName}`);
      }
      if ((tag.m_group === TAG_PHYSICANS_NAME[0]) && (tag.m_element === TAG_PHYSICANS_NAME[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_physicansName = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_physicansName = ${this.m_dicomInfo.m_physicansName}`);
      }
      if ((tag.m_group === TAG_MANUFACTURER_NAME[0]) && (tag.m_element === TAG_MANUFACTURER_NAME[1]) &&
        (tag.m_value !== null)) {
        const dataLen = tag.m_value.byteLength;
        const dv = new DataView(tag.m_value);
        this.m_dicomInfo.m_manufacturerName = DicomFolderLoader.getStringAt(dv, 0, dataLen);
        // console.log(`m_manufacturerName = ${this.m_dicomInfo.m_manufacturerName}`);
      }
    } // for all tags readed
    if (!pixelsTagReaded) {
      return LoadResult.ERROR_PIXELS_TAG_NOT_FOUND;
    }

    // check correct data from tags
    const BITS_IN_BYTE = 8;
    const imageSizeBytes = Math.floor(this.m_xDim * this.m_yDim * (this.m_bitsPerPixel / BITS_IN_BYTE));
    if ((imageSizeBytes !== tag.m_value.byteLength) || (pixelBitMask === 0)) {
      console.log(`Wrong image pixels size. Readed ${tag.m_value.byteLength}, but expected ${imageSizeBytes}`);
      return LoadResult.WRONG_HEADER_DATA_SIZE;
    }

    const numPixels = this.m_xDim * this.m_yDim;
    const volSlice = this.m_slicesVolume.getNewSlice();
    if (volSlice === null) {
      console.log('No memory');
      return LoadResult.ERROR_NO_MEMORY;
    }

    // this.m_slices[this.m_imageNumber] = new Uint16Array(numPixels);
    volSlice.m_image = new Uint16Array(numPixels);
    if (volSlice.m_image === null) {
      console.log('No memory');
      return LoadResult.ERROR_NO_MEMORY;
    }
    volSlice.m_sliceNumber = this.m_imageNumber;
    volSlice.m_sliceLocation = this.m_sliceLocation;

    this.m_slicesVolume.updateSliceNumber(this.m_imageNumber);

    // Fill slice image
    // const imageDst = this.m_slices[this.m_imageNumber];
    const imageDst = volSlice.m_image;
    const imageSrc = new DataView(tag.m_value);
    if (imageSrc === null) {
      console.log('No memory');
      return LoadResult.ERROR_NO_MEMORY;
    }

    const BITS_16 = 16;
    let i;
    if (this.m_bitsPerPixel === BITS_16) {
      let i2 = 0;
      const pixValDif = pixelMaxValue - pixelMinValue;
      if ((pixelMaxValue === -1) || (pixValDif === 0)) {
        for (i = 0; i < numPixels; i++) {
          let val = imageSrc.getUint16(i2, this.m_littleEndian);
          i2 += SIZE_SHORT;
          val = (val !== pixelPaddingValue) ? val : 0;
          val &= pixelBitMask;
          // some tricky read form gm dicom data volume
          const MASK_TRICK = 0x7000;
          val = (val & MASK_TRICK) ? 0 : val;
          imageDst[i] = val;
        } // for (i) all pixels
      } else { // if no max value
        const SCALE_BIT_ACC = 12;
        const MAX_SCALED_VAL = 4095;
        const valScale = Math.floor((MAX_SCALED_VAL << SCALE_BIT_ACC) / (pixelMaxValue - pixelMinValue));
        for (i = 0; i < numPixels; i++) {
          let val = imageSrc.getInt16(i2, this.m_littleEndian);
          i2 += SIZE_SHORT;

          // val &= pixelBitMask;
          val = (val !== pixelPaddingValue) ? val : 0;
          val = (val >= pixelMinValue) ? val : pixelMinValue;
          val = (val <= pixelMaxValue) ? val : pixelMaxValue;
          val -= pixelMinValue;
          val = (val * valScale) >> SCALE_BIT_ACC;
          imageDst[i] = val;
        } // for (i) all pixels
      } // if pixel max value
    } else { // if 16 bpp
      console.log('TODO: need to implement reading non-16 bit dicom images');
    }
    this.m_errors[this.m_imageNumber] = DICOM_ERROR_OK;
    return LoadResult.SUCCESS;
  } // parseDicomFileBuffer

  static getVrsStringIndex(vr) {
    const VRS = [
      'AE', 'AS', 'AT', 'CS', 'DA', 'DS', 'DT', 'FL',
      'FD', 'IS', 'LO', 'LT', 'OB', 'OD', 'OF', 'OW',
      'PN', 'SH', 'SL', 'SS', 'ST', 'TM', 'UI', 'UL',
      'UN', 'US', 'UT',
    ];
    const numElems = VRS.length;
    for (let i = 0; i < numElems; i++) {
      if (VRS[i] === vr) {
        return i;
      }
    }
    return -1;
  }

  static getDataVrsStringIndex(vr) {
    const DATA_VRS = [
      'OB', 'OW', 'OF', 'SQ', 'UT', 'UN',
    ];
    const numElems = DATA_VRS.length;
    for (let i = 0; i < numElems; i++) {
      if (DATA_VRS[i] === vr) {
        return i;
      }
    }
    return -1;
  }

  /**
  * Convert DaataView object into string
  * @param {object} dataView - DataView object (created from ArrayBuffer)
  * @param {number} offset - current offset in buffer, when string started
  * @param {number} lengthBuf - number of bytes to convert to string
  * @return {string} string presentation of DataView
  */
  static getStringAt(dataView, offset, lengthBuf) {
    let str = '';
    for (let i = 0; i < lengthBuf; i++) {
      const ch = dataView.getUint8(offset + i);
      if (ch !== 0) {
        str += String.fromCharCode(ch);
      }
    }
    return str;
  }

  static getAttrValueAsString(tag) {
    if (tag.m_value === null) {
      if (tag.m_vr === 'SQ') { // sequence of items
        return '(Sequence Data)';
      }
      return null;
    }
    const SIZE_SHORT = 2;
    const SIZE_DWORD = 4;
    const dvTag = new DataView(tag.m_value);
    let tmp = null;
    let res = null;
    let date = null;
    let readBytes = 0;
    // to do: add AT, OB?, OD?, OF?, OW?, Unknown?
    switch (tag.m_vr) {
      case 'AE': // application entity
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'AS': // age string
        tmp = DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
        // eslint-disable-next-line
        res = Number(tmp.slice(0, 3)).toString();
        switch (tmp[3]) {
          case 'D':
            return `${res} days`;
          case 'W':
            return `${res} weeks`;
          case 'M':
            return `${res} months`;
          case 'Y':
            return `${res} years`;
          default:
            return null;
        }
      case 'CS': // code string
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'DA': // date
        tmp = DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
        // eslint-disable-next-line
        date = new Date(`${tmp.slice(0, 4)}-${tmp.slice(4, 6)}-${tmp.slice(6, 8)}`);
        return date.toLocaleDateString();
      case 'DS': // decimal string
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'DT': // date time
        // to do: parse date-time as YYYYMMDDHHMMSS.FFFFFF&ZZXX
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'FL': // floating point single
        res = dvTag.getFloat32(0, tag.m_littleEndian).toString();
        readBytes = SIZE_DWORD;
        while (readBytes + SIZE_DWORD <= dvTag.byteLength) {
          res = `${res} \\ ${dvTag.getFloat32(readBytes, tag.m_littleEndian).toString()}`;
          readBytes += SIZE_DWORD;
        }
        return res;
      case 'FD': // floating point double
        res = dvTag.getFloat64(0, tag.m_littleEndian).toString();
        readBytes = (SIZE_DWORD + SIZE_DWORD);
        while (readBytes + SIZE_DWORD + SIZE_DWORD <= dvTag.byteLength) {
          res = `${res} \\ ${dvTag.getFloat64(readBytes, tag.m_littleEndian).toString()}`;
          readBytes += (SIZE_DWORD + SIZE_DWORD);
        }
        return res;
      case 'IS': // integer string
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'LO': // long string
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'LT': // long text
        // to do: check if it works for several paragraphs
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'PN': // person name
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'SH': // short string
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'SL': // signed long
        res = dvTag.getInt32(0, tag.m_littleEndian).toString();
        readBytes = SIZE_DWORD;
        while (readBytes + SIZE_SHORT <= dvTag.byteLength) {
          res = `${res} \\ ${dvTag.getInt16(readBytes, tag.m_littleEndian).toString()}`;
          readBytes += SIZE_DWORD;
        }
        return res;
      case 'SS': // signed short
        res = dvTag.getInt16(0, tag.m_littleEndian).toString();
        readBytes = SIZE_SHORT;
        while (readBytes + SIZE_SHORT <= dvTag.byteLength) {
          res = `${res} \\ ${dvTag.getInt16(readBytes, tag.m_littleEndian).toString()}`;
          readBytes += SIZE_SHORT;
        }
        return res;
      case 'ST': // short text
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'TM': // time
        tmp = DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
        if (tag.m_value.byteLength >= SIZE_SHORT) {
          // eslint-disable-next-line
          res = `${Number(tmp.slice(0, 2))}h`;
        }
        if (tag.m_value.byteLength >= SIZE_DWORD) {
          // eslint-disable-next-line
          res = `${res} ${Number(tmp.slice(2, 4))}m`;
        }
        if (tag.m_value.byteLength > SIZE_DWORD) {
          // eslint-disable-next-line
          res = `${res} ${parseFloat(tmp.slice(4, tag.m_value.byteLength))}s`;
        }
        return res;
      case 'UI': // unique identifier
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'UL': // unsigned long
        res = dvTag.getUint32(0, tag.m_littleEndian).toString();
        readBytes = SIZE_DWORD;
        while (readBytes + SIZE_DWORD <= dvTag.byteLength) {
          res = `${res} \\ ${dvTag.getUint32(readBytes, tag.m_littleEndian).toString()}`;
          readBytes += SIZE_DWORD;
        }
        return res;
      case 'US': // unsigned short
        res = dvTag.getUint16(0, tag.m_littleEndian).toString();
        readBytes = SIZE_SHORT;
        while (readBytes + SIZE_SHORT <= dvTag.byteLength) {
          res = `${res} \\ ${dvTag.getUint16(readBytes, tag.m_littleEndian).toString()}`;
          readBytes += SIZE_SHORT;
        }
        return res;
      case 'UT': // unlimited text
        // to do: check if it works for several paragraphs
        return DicomFolderLoader.getStringAt(dvTag, 0, tag.m_value.byteLength);
      default:
        return null;
    }
  }

  /**
  * Get next tag from stream
  * @param {object} dataView - array
  * @param {number} offset - current offset in buffer
  * @return {object} if success or null, when fail. Fail reasons: invalid tag length read.
  */
  getNextTag(dataView, offset) {
    // check end of buffer
    if (offset >= dataView.byteLengh) {
      return null;
    }
    const SIZE_SHORT = 2;
    const SIZE_DWORD = 4;

    let little = true;
    let group = 0;
    let element = 0;
    let lenData = 0;
    const offsetStart = offset;
    let vr = '';

    const MAGIC_GROUP = 0x0002;

    if (this.m_metaFinished) {
      little = this.m_littleEndian;
      group = dataView.getUint16(offset, little);
    } else {
      group = dataView.getUint16(offset, 1);
      if (((this.m_metaFinishedOffset !== -1) && (offset >= this.m_metaFinishedOffset)) || (group !== MAGIC_GROUP)) {
        this.m_metaFinished = 1;
        little = this.m_littleEndian;
        group = dataView.getUint16(offset, little);
      } else {
        little = true;
      }
    }
    if (!this.m_metaFound && (group === MAGIC_GROUP)) {
      this.m_metaFound = true;
    }
    offset += SIZE_SHORT; // skip group number

    element = dataView.getUint16(offset, little);
    offset += SIZE_SHORT; // skip element number

    if (this.m_explicit || !this.m_metaFinished) {
      vr = DicomFolderLoader.getStringAt(dataView, offset, SIZE_SHORT);
      if (!this.m_metaFound && this.m_metaFinished && (DicomFolderLoader.getVrsStringIndex(vr) === -1)) {
        vr = DicomDictionary.getVr(group, element);
        lenData = dataView.getUint32(offset, little);
        // assert for lenData < 1024 * 1024 * 32
        offset += SIZE_DWORD;
        this.m_explicit = false;
      } else {
        offset += SIZE_SHORT;
        if (DicomFolderLoader.getDataVrsStringIndex(vr) !== -1) {
          offset += SIZE_SHORT;
          lenData = dataView.getUint32(offset, little);
          // assert for lenData < 1024 * 1024 * 32
          offset += SIZE_DWORD;
        } else {
          lenData = dataView.getUint16(offset, little);
          // assert for lenData < 1024 * 1024 * 32
          offset += SIZE_SHORT;
        }
      }
    } else {
      vr = this.m_dictionary.getVr(group, element);
      lenData = dataView.getUint32(offset, little);
      // assert for lenData < 1024 * 1024 * 32
      if (lenData === UNDEFINED_LENGTH) {
        vr = 'SQ';
      }
      offset += SIZE_DWORD;
    }
    const offsetValue = offset;
    let dataValue = null;
    if (vr === 'SQ') {
      // see nema dicom Table 7.5-3
      // for now just skip sequence items
      if (lenData === UNDEFINED_LENGTH) {
        let sqGroup = 0;
        let sqElement = 0;
        while (!((sqGroup === TAG_END_OF_SEQUENCE[0]) && (sqElement === TAG_END_OF_SEQUENCE[1]))) {
          sqGroup = dataView.getUint16(offset, little);
          offset += SIZE_SHORT;
          sqElement = dataView.getUint16(offset, little);
          offset += SIZE_SHORT;
          const sqLength = dataView.getUint32(offset, little);
          offset += SIZE_DWORD;
          if (sqLength === UNDEFINED_LENGTH) {
            // item delim. tag (fffe, e00d)
            while (!(((sqGroup === TAG_END_OF_ITEMS[0]) && (sqElement === TAG_END_OF_ITEMS[1])) ||
              ((sqGroup === TAG_END_OF_SEQUENCE[0]) && (sqElement === TAG_END_OF_SEQUENCE[1])))) {
              const tagNew = this.getNextTag(dataView, offset);
              offset = tagNew.m_offsetEnd;
              sqGroup = dataView.getUint16(offset, little);
              sqElement = dataView.getUint16(offset + SIZE_SHORT, little);
            }
            offset += (SIZE_DWORD + SIZE_DWORD); // 4 for group and element + 4 for length field
          } else { // if sqLength is ffffffff
            offset += sqLength;
          }
        } // while not end tag sequence
        lenData = 0;
      } // if length equal to ffffffff
    } else if (lenData > 0) {
      if (lenData === UNDEFINED_LENGTH) {
        if ((group === TAG_PIXEL_DATA[0]) && (element === TAG_PIXEL_DATA[1])) {
          lenData = (dataView.byteLength - offset);
        }
      }
      // Get data from buffer, starting from offset
      dataValue = dataView.buffer.slice(offset, offset + lenData);
    }
    const VAL_16 = 16;
    if (DEBUG_PRINT_TAGS_INFO) {
      const strDesc = this.m_dictionary.getTextDesc(group, element);
      const strGr = group.toString(VAL_16);
      const strEl = element.toString(VAL_16);
      console.log(`Tag {${strGr},${strEl}}, VR='${vr}', Length=${lenData}, Desc=${strDesc}`);
    }
    const VAL_MIN_ONE = 0xffffffff;
    if (lenData === VAL_MIN_ONE) {
      return null;
    }

    offset += lenData;
    const tag = new DicomTag(group, element, vr, dataValue, offsetStart, offsetValue, offset, this.m_littleEndian);

    if (tag) {
      this.m_newTagEvent.detail.group = group.toString(VAL_16);
      this.m_newTagEvent.detail.element = element.toString(VAL_16);
      this.m_newTagEvent.detail.desc = this.m_dictionary.getTextDesc(group, element);
      this.m_newTagEvent.detail.value = DicomFolderLoader.getAttrValueAsString(tag);
      if ((group === TAG_IMAGE_INSTANCE_NUMBER[0]) && (element === TAG_IMAGE_INSTANCE_NUMBER[1])) {
        this.m_newTagEvent.detail.imageNumber = parseInt(this.m_newTagEvent.detail.value, 10);
      } else {
        this.m_newTagEvent.detail.imageNumber = -1;
      }
      dispatchEvent(this.m_newTagEvent);
    }

    if (tag.isTransformSyntax()) {
      const tagDataLen = tag.m_value.byteLength;
      const dvTag = new DataView(tag.m_value);
      const strTagVal = DicomFolderLoader.getStringAt(dvTag, 0, tagDataLen);
      if (strTagVal === TRANSFER_SYNTAX_IMPLICIT_LITTLE) {
        this.m_explicit = false;
        this.m_littleEndian = true;
      } else if (strTagVal === TRANSFER_SYNTAX_EXPLICIT_BIG) {
        this.m_explicit = true;
        this.m_littleEndian = false;
      } else if (strTagVal === TRANSFER_SYNTAX_COMPRESSION_DEFLATE) {
        this.m_needsDeflate = true;
        this.m_explicit = true;
        this.m_littleEndian = true;
      } else {
        this.m_explicit = true;
        this.m_littleEndian = true;
      }
    } else if (tag.isMetaLength()) {
      this.m_metaFinishedOffset = tag.m_value[0] + offset;
    }
    return tag;
  } // getNextTag
}
