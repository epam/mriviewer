/**
 * @fileOverview LoaderDicom
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

// import gdcm from 'gdcm-js';

import LoadResult from '../LoadResult';

import DicomDictionary from './dicomdict';
import DicomInfo from './dicominfo';
import DicomTag from './dicomtag';
import DicomSlicesVolume from './dicomslicesvolume';
import DicomSliceInfo from './dicomsliceinfo';
import DicomTagInfo from './dicomtaginfo';
import UiHistogram from '../../ui/UiHistogram';
import FileTools from './FileTools';
import FileLoader from './FileLoader';
import Hash from '../utils/Hash';

// ********************************************************
// Const
// ********************************************************

const DEBUG_PRINT_TAGS_INFO = false;
const DEBUG_PRINT_INDI_SLICE_INFO = false;
const NEED_SCAN_EMPTY_BORDER = false;
const NEED_APPLY_GAUSS_SMOOTHING = false;

/** deep artificially fix volume texture size to even numbers */
const NEED_EVEN_TEXTURE_SIZE = false;

/* eslint-disable */
const MAGIC_DICM = [68, 73, 67, 77];

const DICOM_ERROR_OK = 0;
const DICOM_ERROR_WRONG_HEADER = -1;
const DICOM_ERROR_TOO_SMALL_FILE = -2;

const UNDEFINED_LENGTH = 0xFFFFFFFF;

const TAG_IMAGE_INSTANCE_NUMBER = [0x0020, 0x0013];
const TAG_PIXEL_DATA = [0x7FE0, 0x0010];

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
const TAG_SERIES_TIME = [0x0008, 0x31];
const TAG_END_OF_ITEMS = [0xFFFE, 0xE00D];
const TAG_END_OF_SEQUENCE = [0xFFFE, 0xE0DD];
const TAG_SERIES_NUMBER = [0x0020, 0x0011];
const TAG_SLICE_THICKNESS = [0x0018, 0x0050];
const TAG_BODY_PART_EXAMINED = [0x0018, 0x0015];

const TRANSFER_SYNTAX_IMPLICIT_LITTLE = '1.2.840.10008.1.2';
const TRANSFER_SYNTAX_EXPLICIT_BIG = '1.2.840.10008.1.2.2';
const TRANSFER_SYNTAX_COMPRESSION_DEFLATE = '1.2.840.10008.1.2.1.99';

// Information from dicom tags, displayed in 2d screen
const TAG_PATIENT_NAME = [0x0010, 0x0010];
const TAG_PATIENT_ID = [0x0010, 0x0020];
const TAG_PATIENT_BIRTH_DATE = [0x0010, 0x0030];
const TAG_PATIENT_GENDER = [0x0010, 0x0040];
const TAG_STUDY_DATE = [0x0008, 0x0020];
const TAG_STUDY_DESCR = [0x0008, 0x1030];
const TAG_ACQUISION_TIME = [0x0008, 0x0032];
const TAG_INSTITUTION_NAME = [0x0008, 0x0080];
const TAG_PHYSICANS_NAME = [0x0008, 0x0090];
const TAG_MANUFACTURER_NAME = [0x0008, 0x0070];
const TAG_OPERATORS_NAME = [0x0008, 0x1070];

// const NEED_EVEN_TEXTURE_SIZE = false;

// ********************************************************
// Class
// ********************************************************

/**
 * Class LoaderDicom some text later...
 */
class LoaderDicom{
  /**
   * @param {object} props - props from up level object
   */
  constructor(numFiles, needScaleDownTexture = false) {
    this.m_xDim = -1;
    this.m_yDim = -1;
    this.m_zDim = numFiles;
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
    /** @property {number} m_bitsPerPixel - bits per pixe;. Can be 8, 16, 32 */
    this.m_bitsPerPixel = -1;
    /** @property {number} m_seriesNumber - Index of series to check the same image set in slices */
    this.m_seriesNumber = -1;
    /** @property {string} m_seriesDescr - Description of series */
    this.m_seriesDescr = '';
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

    this.runLoader = this.runLoader.bind(this);
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
   * 
   * Create volume data array from individual slices, loaded from different files
   * @param {object} volDst  - destination volume, will be created
   * @param {number} hashSelected  - desired serie hash
   * @param {number} hashSelected - use only slices with this hash
   * @return {LoadResult} LoadResult.SUCCESS if success
   */
 createVolumeFromSlices(volDst, hashSelected) {
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
  if (zBox < TOO_MIN) {
    zBox = 1.0;
  }
  // check empty pixel spacing
  if (this.m_pixelSpacing.x * this.m_pixelSpacing.y < TOO_MIN) {
    this.m_pixelSpacing.x = 1.0;
    this.m_pixelSpacing.y = 1.0;
  }
  this.m_pixelSpacing.z = zBox / this.m_zDim;
  this.m_boxSize.z = this.m_zDim * this.m_pixelSpacing.z;
  this.m_boxSize.x = this.m_xDim * this.m_pixelSpacing.x;
  this.m_boxSize.y = this.m_yDim * this.m_pixelSpacing.y;
  console.log(`createVolumeFromSlices. Volume local phys dim: ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);

  let i;
  let dataSize = 0;
  let dataArray = null;

  let xyDim = this.m_xDim * this.m_yDim;
  let maxVal = 0;

  if (this.m_slicesVolume.m_numSlices !== this.m_zDim) {
    console.log('Error logic zDim');
    return LoadResult.ERROR_WRONG_NUM_SLICES;
  }

  const numSlices = this.m_slicesVolume.m_numSlices;
  for (let s = 0; s < numSlices; s++) {
    const slice = this.m_slicesVolume.m_slices[s];
    if (slice.m_hash === hashSelected) {
      const sliceData16 = slice.m_image;
      for (i = 0; i < xyDim; i++) {
        const val16 = sliceData16[i];
        maxVal = (val16 > maxVal) ? val16 : maxVal;
      } // for (i) all slice pixels
    } // if hash correct
  }  // for (s) all slices
  // allocate one more entry for values
  maxVal++;

  console.log(`Build Volume. max value=${maxVal}. Volume dim = ${this.m_xDim}*${this.m_yDim}*${this.m_zDim}`);
  console.log(`Min slice number = ${this.m_slicesVolume.m_minSlice}`);
  console.log(`Max slice number = ${this.m_slicesVolume.m_maxSlice}`);

  const histogram = new Float32Array(maxVal);
  for (i = 0; i < maxVal; i++) {
    histogram[i] = 0;
  }
  for (let s = 0; s < numSlices; s++) {
    const slice = this.m_slicesVolume.m_slices[s];
    if (slice.m_hash === hashSelected) {
      const sliceData16 = slice.m_image;
      for (i = 0; i < xyDim; i++) {
        const val16 = sliceData16[i];
        histogram[val16]++;
      } // for all pixels
    } // if hash
  }
  //console.log(`histogram[0] = ${histogram[0]}`);
  //console.log(`histogram[1] = ${histogram[1]}`);
  //console.log(`histogram[maxVal - 2] = ${histogram[maxVal - 2]}`);
  //console.log(`histogram[maxVal - 1] = ${histogram[maxVal - 1]}`);
  let numDifHistValues = 0;
  for (i = 0; i < maxVal; i++) {
    numDifHistValues += (histogram[i] !== 0.0) ? 1: 0;
  }
  console.log(`num different histogram values = ${numDifHistValues}`);

  const hist = new UiHistogram();
  hist.assignArray(maxVal, histogram);
  const HIST_SMOOTH_SIGMA = 0.8;
  const NEED_NORMALIZE = false;
  hist.smoothHistogram(HIST_SMOOTH_SIGMA, NEED_NORMALIZE);
  const histSmooothed = hist.m_histogram;

  // Find val max in smoothed histogram
  const VAL_8 = 8;
  maxVal -= 1;
  for (; maxVal > VAL_8; maxVal--) {
    if (histSmooothed[maxVal] > 0) {
      break;
    }
  }
  // Find last local max in smoothed historgam
  const HIST_MIN_VAL = Math.floor((xyDim * numSlices) / (9 * 15));
  let idxLastLocalMax = 0;
  for (i = maxVal - VAL_8; i > VAL_8; i--) {
    if (histSmooothed[i] > HIST_MIN_VAL) {
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
    } // if more min val
  } // for i

  // if not found local max: find some more or less bright value ending
  if (idxLastLocalMax === 0) {
    const HIST_BARRIER_VAL = Math.floor((xyDim * numSlices) / (1024 * 10));
    for (i = maxVal - 8; i > 8; i--)
    {
      if (histSmooothed[i] > HIST_BARRIER_VAL)
      {
        idxLastLocalMax = i;
        maxVal = i;
        break;
      }
    } // for
  } // if not found loc max

  const TWICE = 2;
  const idxSomeAfterMax = Math.floor((idxLastLocalMax + maxVal) / TWICE);
  const yLocMax = histSmooothed[idxLastLocalMax];
  const yAftMax = histSmooothed[idxSomeAfterMax];
  console.log(`Build Volume. idxLastLocalMax = ${idxLastLocalMax}, maxVal = ${maxVal}`);

  if (idxLastLocalMax > 0) {
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
  }
  console.log(`Build Volume. max value after search last hill: ${maxVal}`);

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
  }
  // sort slices via slice location OR slice number
  let minSliceNum = srcSlices[0].m_sliceNumber;
  let maxSliceNum = srcSlices[0].m_sliceNumber;
  for (let s = 0; s < numSlices; s++) {
    const num = srcSlices[s].m_sliceNumber;
    minSliceNum = (num < minSliceNum) ? num : minSliceNum;
    maxSliceNum = (num > maxSliceNum) ? num : maxSliceNum;
  }
  const difSlceNum = maxSliceNum - minSliceNum;
  if (difSlceNum > 0) {
    // sort slices by slice number (read from dicom tag)
    srcSlices.sort((a, b) => {
      const zDif = a.m_sliceNumber - b.m_sliceNumber;
      return zDif;
    });
  } else {
    // sort slices by slice location (read from diocom tag)
    srcSlices.sort((a, b) => {
      const zDif = a.m_sliceLocation - b.m_sliceLocation;
      return zDif;
    });
  }
  // assign new slice numbers according accending location
  for (let s = 0; s < numSlices; s++) {
    srcSlices[s].m_sliceNumber = s;
  }

  // reassign slice numbers according to hash 
  let numSlicesActaullyBuild = 0;
  for (let s = 0; s < numSlices; s++) {
    const slice = srcSlices[s];
    if (slice.m_hash === hashSelected) {
      slice.m_sliceNumber = numSlicesActaullyBuild;
      numSlicesActaullyBuild++;
    } else {
      slice.m_sliceNumber = -1;
    }
  }
  // correct zDim according to actaul slice count
  this.m_zDim = numSlicesActaullyBuild;

  // create out volume data array
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


  const MAX_BYTE = 255;
  for (let s = 0; s < numSlices; s++) {
    const slice = srcSlices[s];
    if (slice.m_hash !== hashSelected) {
      continue;
    }
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
  const callbackComplete = this.m_callbackComplete;
  if (callbackComplete) {
    callbackComplete(LoadResult.SUCCESS, header, dataSize, dataArray);
  } // if callback ready
  const ONE = 1;

  volDst.m_xDim = this.m_xDim;
  volDst.m_yDim = this.m_yDim;
  volDst.m_zDim = this.m_zDim;
  volDst.m_dataArray = dataArray;
  volDst.m_dataSize = dataSize;
  volDst.m_bytesPerVoxel = ONE;
  volDst.m_boxSize.x = this.m_boxSize.x;
  volDst.m_boxSize.y = this.m_boxSize.y;
  volDst.m_boxSize.z = this.m_boxSize.z;

  volDst.m_patientName = this.m_dicomInfo.m_patientName;
  volDst.m_patientBirth = this.m_dicomInfo.m_patientDateOfBirth;
  volDst.m_seriesDescr = this.m_dicomInfo.m_seriesDescr;


  volDst.m_studyDescr = this.m_dicomInfo.m_studyDescr;
  volDst.m_studyDate = this.m_dicomInfo.m_studyDate;
  volDst.m_seriesTime = this.m_dicomInfo.m_seriesTime;
  volDst.m_bodyPartExamined = this.m_dicomInfo.m_bodyPartExamined;
  volDst.m_institutionName = this.m_dicomInfo.m_institutionName;
  volDst.m_operatorsName = this.m_dicomInfo.m_operatorsName;
  volDst.m_physicansName = this.m_dicomInfo.m_physicansName;


  return LoadResult.SUCCESS;
} // createVolumeFromSlices

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
  * Convert DataView object into string
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
  static getUtf8StringAt(dataView, offset, lengthBuf) {
    let str = '';
    let i = 0;
    while (i < lengthBuf) {
      let c = dataView.getUint8(offset + i); i++;
      if (c == 0x5e) {
        c = 32;
      }
      switch (c >> 4) {
        case 0: case 1:
        case 2: case 3:
        case 4: case 5:
        case 6: case 7:
          str += String.fromCharCode(c);
          break;
        case 12: case 13:
          const char2 = dataView.getUint8(offset + i); i++;
          str += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          const ch2 = dataView.getUint8(offset + i); i++;
          const ch3 = dataView.getUint8(offset + i); i++;
          str += String.fromCharCode(((c & 0x0F) << 12) |
                                     ((ch2 & 0x3F) << 6) |
                                     ((ch3 & 0x3F) << 0));
          break;          
      } // switch
 
    } // while not end string
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
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'AS': // age string
        tmp = LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
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
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'DA': // date
        tmp = LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
        // eslint-disable-next-line
        date = new Date(`${tmp.slice(0, 4)}-${tmp.slice(4, 6)}-${tmp.slice(6, 8)}`);
        return date.toLocaleDateString();
      case 'DS': // decimal string
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'DT': // date time
        // to do: parse date-time as YYYYMMDDHHMMSS.FFFFFF&ZZXX
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
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
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'LO': // long string
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'LT': // long text
        // to do: check if it works for several paragraphs
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'PN': // person name
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'SH': // short string
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
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
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
      case 'TM': // time
        tmp = LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
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
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
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
        return LoaderDicom.getStringAt(dvTag, 0, tag.m_value.byteLength);
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
    vr = LoaderDicom.getStringAt(dataView, offset, SIZE_SHORT);
    if (!this.m_metaFound && this.m_metaFinished && (LoaderDicom.getVrsStringIndex(vr) === -1)) {
      vr = DicomDictionary.getVr(group, element);
      lenData = dataView.getUint32(offset, little);
      // assert for lenData < 1024 * 1024 * 32
      offset += SIZE_DWORD;
      this.m_explicit = false;
    } else {
      offset += SIZE_SHORT;
      if (LoaderDicom.getDataVrsStringIndex(vr) !== -1) {
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
    this.m_newTagEvent.detail.value = LoaderDicom.getAttrValueAsString(tag);
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
    const strTagVal = LoaderDicom.getStringAt(dvTag, 0, tagDataLen);
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
  static numberToHexString(val) {
    const str = val.toString(16);
    const len = str.length;
    const numLeadZeros = 4 - len;
    let strZeros = '';
    for (let i = 0; i < numLeadZeros; i++) {
      strZeros += '0';
    }
    const strRes = '0x' + strZeros + str;
    return strRes;
  }
  readFromGoogleBuffer(i, fileName, ratioLoaded, arrBuf, callbackProgress, callbackComplete)
  {
    const dataView = new DataView(arrBuf);
    let fileSize = dataView.byteLength;
    // fileSize = (fileSize) & (~1);
    // console.log(`readFromGoogleBuffer. fileSize = ${fileSize}`);
    // fileSize = (fileSize <= 512) ? fileSize : 512;

    // const strHeader = LoaderDicom.getStringAt(dataView, 0, 512);
    // console.log(`readFromGoogleBuffer. header = ${strHeader}`);

    const OFF_CONTENT_TYPE = 64;
    const LEN_CONTENT_TYPE = 32;
    const strCtx = LoaderDicom.getStringAt(dataView, OFF_CONTENT_TYPE, LEN_CONTENT_TYPE);
    const STR_CTX_MATCH = 'Content-Type: application/dicom;';
    const isEqCtxStr = (strCtx === STR_CTX_MATCH);
    if (isEqCtxStr) {
      const SIZE_GOOGLE_HEADER = 136;
      const arrBufWoHead = arrBuf.slice(SIZE_GOOGLE_HEADER);
      const dataViewWoGoogle = new DataView(arrBufWoHead);
      const okRet = this.readFromBuffer(i, fileName, ratioLoaded, arrBufWoHead, callbackProgress, callbackComplete)
      return okRet;
    } else {
      console.log(`readFromGoogleBuffer. bad content type = ${strCtx}`);
      return LoadResult.BAD_HEADER;
    }
  }
  /**
  * Read from local file buffer
  * @param {number} indexFile - index of slice loaded
  * @param {string} fileName - Loaded file
  * @param {number} ratioLoaded - ratio from 0 to 1.0.
  * @param {object} arrBuf - source byte buffer, ArrayBuffer type
  * @return LoadResult.XXX
  */
 readFromBuffer(indexFile, fileName, ratioLoaded, arrBuf, callbackProgress, callbackComplete) {
  if (typeof indexFile !== 'number') {
    console.log('LoaderDicom.readFromBuffer: bad indexFile argument');
  }
  if (typeof fileName !== 'string') {
    console.log('LoaderDicom.readFromBuffer: bad fileName argument');
  }
  if (typeof arrBuf !== 'object') {
    console.log('LoaderDicom.readFromBuffer: bad arrBuf argument');
  }
  // const bufBytes = new Uint8Array(arrBuf);
  // const isUint8Arr = bufBytes instanceof Uint8Array;
  // if (!isUint8Arr) {
  //   console.log('LoaderDicom. readFromBuffer. Error read buffer');
  //   return false;
  // }

  // console.log(`LoaderDicom. readFromBuffer. file = ${fileName}, ratio = ${ratioLoaded}`);

  // add info
  const dicomInfo = this.m_dicomInfo;
  const sliceInfo = new DicomSliceInfo();
  const strSlice = 'Slice ' + indexFile.toString();
  sliceInfo.m_sliceName = strSlice;
  sliceInfo.m_fileName = fileName;
  sliceInfo.m_tags = [];
  dicomInfo.m_sliceInfo.push(sliceInfo);

  const dataView = new DataView(arrBuf);
  if (dataView === null) {
    console.log('No memory');
    return LoadResult.ERROR_NO_MEMORY;
  }
  const fileSize = dataView.byteLength;
  // check dicom header
  const SIZE_HEAD = 144;
  if (fileSize < SIZE_HEAD) {
    // this.m_errors[indexFile] = DICOM_ERROR_TOO_SMALL_FILE;
    this.m_error = LoadResult.ERROR_TOO_SMALL_DATA_SIZE;
    if (callbackComplete !== undefined) {
      callbackComplete(LoadResult.ERROR_TOO_SMALL_DATA_SIZE);
    }
    return LoadResult.ERROR_TOO_SMALL_DATA_SIZE;
  }
  const OFF_MAGIC = 128;
  const SIZE_DWORD = 4;
  const SIZE_SHORT = 2;
  for (let i = 0; i < SIZE_DWORD; i++) {
    const v = dataView.getUint8(OFF_MAGIC + i);
    if (v !== MAGIC_DICM[i]) {
      this.m_errors[indexFile] = DICOM_ERROR_WRONG_HEADER;
      console.log(`Dicom readFromBuffer. Wrong header in file: ${fileName}`);
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.WRONG_HEADER_MAGIC);
      }
      return LoadResult.WRONG_HEADER_MAGIC;
    }
  }
  let offset = OFF_MAGIC;
  offset += SIZE_DWORD;

  //
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

    // add to tag info
    const dicomInfo = this.m_dicomInfo;
    const numlices = dicomInfo.m_sliceInfo.length;
    const sliceInfo = dicomInfo.m_sliceInfo[numlices - 1];
    const tagInfo = new DicomTagInfo();
    tagInfo.m_tag = '(' + 
      LoaderDicom.numberToHexString(tag.m_group) + ',' + 
      LoaderDicom.numberToHexString(tag.m_element) + ')';
    const strTagName = this.m_dictionary.getTextDesc(tag.m_group, tag.m_element);
    tagInfo.m_attrName = (strTagName.length > 1) ? strTagName : '';

    let strVal = LoaderDicom.getAttrValueAsString(tag);
    strVal = (strVal !== null) ? strVal : '';

    tagInfo.m_attrValue = strVal;
    sliceInfo.m_tags.push(tagInfo);

    // console.log(`Add tag info. tag = ${tagInfo.m_tag} atNa = ${tagInfo.m_attrName} atVal = ${tagInfo.m_attrValue} `);

    // get important info from tag: image number
    if ((tag.m_group === TAG_IMAGE_INSTANCE_NUMBER[0]) && (tag.m_element === TAG_IMAGE_INSTANCE_NUMBER[1])) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      const strNum = LoaderDicom.getStringAt(dv, 0, dataLen);
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
        if (callbackComplete !== undefined) {
          callbackComplete(LoadResult.WRONG_IMAGE_DIM_Y);
        }
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
        if (callbackComplete !== undefined) {
          callbackComplete(LoadResult.WRONG_IMAGE_DIM_X);
        }
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
        const strNum = LoaderDicom.getStringAt(dv, 0, dataLen);
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
      this.m_seriesDescr = LoaderDicom.getStringAt(dv, 0, dataLen);
      if (DEBUG_PRINT_TAGS_INFO) {
        console.log(`Series description = ${this.m_seriesDescr}`);
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
      const strPixelSpacing = LoaderDicom.getStringAt(dv, 0, dataLen);
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
      const strImagePosition = LoaderDicom.getStringAt(dv, 0, dataLen);
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
      const strSliceThickness = LoaderDicom.getStringAt(dv, 0, dataLen);
      this.m_pixelSpacing.z = parseFloat(strSliceThickness);
      if (DEBUG_PRINT_TAGS_INFO) {
        console.log(`TAG. slice thickness = ${this.m_pixelSpacing.z}`);
      }
    }

    // get important tag: slice location (x,y,z)
    if ((tag.m_group === TAG_SLICE_LOCATION[0]) && (tag.m_element === TAG_SLICE_LOCATION[1])) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      const strSliceLocation = LoaderDicom.getStringAt(dv, 0, dataLen);
      const sliceLoc = parseFloat(strSliceLocation);
      this.m_sliceLocation = sliceLoc;
      this.m_sliceLocMin = (sliceLoc < this.m_sliceLocMin) ? sliceLoc : this.m_sliceLocMin;
      this.m_sliceLocMax = (sliceLoc > this.m_sliceLocMax) ? sliceLoc : this.m_sliceLocMax;
      if (DEBUG_PRINT_TAGS_INFO) {
        console.log(`TAG. Slice location = ${this.m_sliceLocation}`);
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
    if ((tag.m_group === TAG_SERIES_DESCRIPTION[0]) && (tag.m_element === TAG_SERIES_DESCRIPTION[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      const strDescr = LoaderDicom.getStringAt(dv, 0, dataLen);
      // console.log(`DicomLoader. Series descr read = ${strDescr}`);
      this.m_dicomInfo.m_seriesDescr = strDescr;
    }
    if ((tag.m_group === TAG_SERIES_TIME[0]) && (tag.m_element === TAG_SERIES_TIME[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      const strTimeMerged = LoaderDicom.getStringAt(dv, 0, dataLen);
      // eslint-disable-next-line
      const strHour = strTimeMerged.substring(0, 2);
      // eslint-disable-next-line
      const strMinute = strTimeMerged.substring(2, 4);
      // eslint-disable-next-line
      const strSec = strTimeMerged.substring(4, strTimeMerged.length);
      const strTimeBuild = `${strHour}:${strMinute}:${strSec}`;
      // console.log(`Series time read = ${strTimeBuild}`);
      this.m_dicomInfo.m_seriesTime = strTimeBuild;
      if (DEBUG_PRINT_TAGS_INFO) {
        console.log(`Series time = ${this.m_dicomInfo.m_seriesTime}`);
      }
    }
    if ((tag.m_group === TAG_PATIENT_NAME[0]) && (tag.m_element === TAG_PATIENT_NAME[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_patientName = LoaderDicom.getUtf8StringAt(dv, 0, dataLen);
      this.m_dicomInfo.m_patientName = this.m_dicomInfo.m_patientName.trim();
      //console.log(`m_patientName = ${this.m_dicomInfo.m_patientName}`);
    }
    if ((tag.m_group === TAG_PATIENT_ID[0]) && (tag.m_element === TAG_PATIENT_ID[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_patientId = LoaderDicom.getStringAt(dv, 0, dataLen);
      // console.log(`m_patientId = ${this.m_dicomInfo.m_patientId}`);
    }
    if ((tag.m_group === TAG_PATIENT_GENDER[0]) && (tag.m_element === TAG_PATIENT_GENDER[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_patientGender = LoaderDicom.getStringAt(dv, 0, dataLen);
      // console.log(`m_patientGender = ${this.m_dicomInfo.m_patientGender}`);
    }
    if ((tag.m_group === TAG_PATIENT_BIRTH_DATE[0]) && (tag.m_element === TAG_PATIENT_BIRTH_DATE[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      const strDateMerged = LoaderDicom.getStringAt(dv, 0, dataLen);
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
      const strDateMerged = LoaderDicom.getStringAt(dv, 0, dataLen);
      // eslint-disable-next-line
      const strY = strDateMerged.substring(0, 4);
      // eslint-disable-next-line
      const strM = strDateMerged.substring(4, 6);
      // eslint-disable-next-line
      const strD = strDateMerged.substring(6);
      this.m_dicomInfo.m_studyDate = `${strD}/${strM}/${strY}`;
      // console.log(`m_studyDate = ${this.m_dicomInfo.m_studyDate}`);
    }
    if ((tag.m_group === TAG_STUDY_DESCR[0]) && (tag.m_element === TAG_STUDY_DESCR[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      const strDescr = LoaderDicom.getStringAt(dv, 0, dataLen);
      this.m_dicomInfo.m_studyDescr = strDescr;
      this.m_dicomInfo.m_studyDescr = this.m_dicomInfo.m_studyDescr.trim();
      // console.log(`m_studyDescr = ${this.m_dicomInfo.m_studyDescr}`);
    }
    if ((tag.m_group === TAG_BODY_PART_EXAMINED[0]) && (tag.m_element === TAG_BODY_PART_EXAMINED[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_bodyPartExamined = LoaderDicom.getStringAt(dv, 0, dataLen);
      // console.log(`m_patientName = ${this.m_dicomInfo.m_patientName}`);
    }


    if ((tag.m_group === TAG_ACQUISION_TIME[0]) && (tag.m_element === TAG_ACQUISION_TIME[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_acquisionTime = LoaderDicom.getStringAt(dv, 0, dataLen);
      // console.log(`m_acquisionTime = ${this.m_dicomInfo.m_acquisionTime}`);
    }
    if ((tag.m_group === TAG_INSTITUTION_NAME[0]) && (tag.m_element === TAG_INSTITUTION_NAME[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_institutionName = LoaderDicom.getUtf8StringAt(dv, 0, dataLen);
      this.m_dicomInfo.m_institutionName = this.m_dicomInfo.m_institutionName.trim();
      // console.log(`m_institutionName = ${this.m_dicomInfo.m_institutionName}`);
    }

    if ((tag.m_group === TAG_OPERATORS_NAME[0]) && (tag.m_element === TAG_OPERATORS_NAME[1]) &&
    (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_operatorsName = LoaderDicom.getUtf8StringAt(dv, 0, dataLen);
      this.m_dicomInfo.m_operatorsName = this.m_dicomInfo.m_operatorsName.trim();
      // console.log(`m_operatorsName = ${this.m_dicomInfo.m_operatorsName}`);
    }
    if ((tag.m_group === TAG_PHYSICANS_NAME[0]) && (tag.m_element === TAG_PHYSICANS_NAME[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_physicansName = LoaderDicom.getUtf8StringAt(dv, 0, dataLen);
      this.m_dicomInfo.m_physicansName = this.m_dicomInfo.m_physicansName.trim();
      // console.log(`m_physicansName = ${this.m_dicomInfo.m_physicansName}`);
    }
    if ((tag.m_group === TAG_MANUFACTURER_NAME[0]) && (tag.m_element === TAG_MANUFACTURER_NAME[1]) &&
      (tag.m_value !== null)) {
      const dataLen = tag.m_value.byteLength;
      const dv = new DataView(tag.m_value);
      this.m_dicomInfo.m_manufacturerName = LoaderDicom.getStringAt(dv, 0, dataLen);
      this.m_dicomInfo.m_manufacturerName = this.m_dicomInfo.m_manufacturerName.trim();
      // console.log(`m_manufacturerName = ${this.m_dicomInfo.m_manufacturerName}`);
    }
  } // for all tags readed
  if (!pixelsTagReaded) {
    if (callbackComplete !== undefined) {
      callbackComplete(LoadResult.ERROR_PIXELS_TAG_NOT_FOUND);
    }
    return LoadResult.ERROR_PIXELS_TAG_NOT_FOUND;
  }

  // check correct data from tags
  const BITS_IN_BYTE = 8;
  const imageSizeBytes = Math.floor(this.m_xDim * this.m_yDim * (this.m_bitsPerPixel / BITS_IN_BYTE));
  if ((imageSizeBytes !== tag.m_value.byteLength) || (pixelBitMask === 0)) {
    console.log(`Wrong image pixels size. Readed ${tag.m_value.byteLength}, but expected ${imageSizeBytes}`);
    if (callbackComplete !== undefined) {
      callbackComplete(LoadResult.ERROR_COMPRESSED_IMAGE_NOT_SUPPORTED);
    }
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
  volSlice.m_patientName = this.m_dicomInfo.m_patientName;
  volSlice.m_studyDescr = this.m_dicomInfo.m_studyDescr;
  volSlice.m_studyDate = this.m_dicomInfo.m_studyDate;
  volSlice.m_seriesTime = this.m_dicomInfo.m_seriesTime;
  volSlice.m_seriesDescr = this.m_dicomInfo.m_seriesDescr;
  volSlice.m_bodyPartExamined = this.m_dicomInfo.m_bodyPartExamined;
  volSlice.m_institutionName = this.m_dicomInfo.m_institutionName;
  volSlice.m_operatorsName = this.m_dicomInfo.m_operatorsName;
  volSlice.m_physicansName = this.m_dicomInfo.m_physicansName;

  // get hash from all slice text features
  const strMix = volSlice.m_patientName + volSlice.m_studyDescr +
    volSlice.m_studyDate + volSlice.m_seriesTime + 
    volSlice.m_seriesDescr + volSlice.m_bodyPartExamined;
  volSlice.m_hash = Hash.getHash(strMix);

  // console.log(`patName = ${volSlice.m_patientName}`);
  // console.log(`studyDescr = ${volSlice.m_studyDescr}`);
  // console.log(`studyDate = ${volSlice.m_studyDate}`);
  // console.log(`seriesTime = ${volSlice.m_seriesTime}`);
  // console.log(`seriesDescr = ${volSlice.m_seriesDescr}`);
  // console.log(`bodyPartExamined = ${volSlice.m_bodyPartExamined}`);

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
  this.m_error = DICOM_ERROR_OK;

  // console.log(`Dicom read OK. Volume pixels = ${this.m_xDim} * ${this.m_yDim} * ${this.m_zDim}`);
  if (callbackComplete !== undefined) {
    callbackComplete(LoadResult.SUCCESS);
  }
  return LoadResult.SUCCESS;
  } // end readFromBuffer

  readFromUrl(volDst, strUrl, callbackProgress, callbackComplete) {
    // replace file name to 'file_list.txt'
    const ft = new FileTools();
    const isValidUrl = ft.isValidUrl(strUrl);
    if (!isValidUrl) {
      console.log(`readFromUrl: not vaild URL = = ${strUrl} `);
      return false;
    }
    this.m_folder = ft.getFolderNameFromUrl(strUrl);
    const urlFileList = this.m_folder + '/file_list.txt';
    console.log(`readFromUrl: load file = ${urlFileList} `);

    const fileLoader = new FileLoader(urlFileList);
    this.m_callbackComplete = callbackComplete;
    this.m_callbackProgress = callbackProgress;
    this.m_fileListCounter = 0;
    fileLoader.readFile((arrBuf) => {
      this.m_fileListCounter += 1;
      if (this.m_fileListCounter === 1) {
        const okRead = this.readReadyFileList(volDst, arrBuf, callbackProgress, callbackComplete);
        return okRead;
      }
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
      return false;
    }); // get file from server
    return true;
  }
  readReadyFileList(volDst, arrBuf, callbackProgress, callbackComplete) {
    const uint8Arr = new Uint8Array(arrBuf);
    // const strFileContent = new TextDecoder('utf-8').decode(uint8Arr);
    const strFileContent = String.fromCharCode.apply(null, uint8Arr);

    const LEN_LOG = 64;
    const strLog = strFileContent.substr(0, LEN_LOG);
    console.log(`Loaded file list. Started with:  ${strLog}`);

    const arrFileNames = strFileContent.split('\n');

    let numFiles = arrFileNames.length;
    // check last empty elements
    const MIN_FILE_NAME_SIZE = 4;
    for (let i = numFiles - 1; i >= 0; i--) {
      if (arrFileNames[i].endsWith('\r')) {
        arrFileNames[i] = arrFileNames[i].substring(0, arrFileNames[i].length - 1);
      }
      if (arrFileNames[i].length < MIN_FILE_NAME_SIZE) {
        arrFileNames.pop();
      }
    }
    numFiles = arrFileNames.length;

    this.m_zDim = numFiles;
    console.log(`Loaded file list. ${numFiles} files will be loaded. 1st file in list is = ${arrFileNames[0]}`);
    console.log(`Loaded file list. Last file in list is = ${arrFileNames[numFiles - 1]}`);

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

    for (let i = 0; (i < this.m_numLoadedFiles) && (this.m_numFailsLoad < 1); i++) {
      const urlFile = `${this.m_folder}/${arrFileNames[i]}`;
      // console.log(`Loading (${i})-th url: ${urlFile}`);
      this.m_loaders[i] = new FileLoader(urlFile);
      const loader = this.m_loaders[i];
      const NOT_FROM_GOOGLE = false;
      const okLoader = this.runLoader(volDst, arrFileNames[i], loader, i, callbackProgress, callbackComplete, NOT_FROM_GOOGLE);
      if (!okLoader) {
        return false;
      }
    }  // for i all files-slices in folder
    return true;
  } // end readReadyFileList(arrBuf)
  /**
  * Run loader to read dicom file
  * @param {object} volDst - destination volumee
  * @param {string} fileName - File to read
  * @param {object} loader - loader object with file inside
  * @param {number} i - index of file in files array
  * @param {func} callbackProgress - callback for continiuos load reporting
  * @param {func} callbackComplete - callback after load finish
  * @param {bool} fromGoogle - true, if from google store
  *
  */
  runLoader(volDst, fileName, loader, i, callbackProgress, callbackComplete, fromGoogle) {
    this.m_fromGoogle = fromGoogle;
    // console.log(`Loading url: ${fileName}`);
    loader.readFile((fileArrBu) => {
      const ratioLoaded = this.m_filesLoadedCounter / this.m_numLoadedFiles;
      const VAL_MASK = 7;
      if ((callbackProgress !== undefined) && ((this.m_filesLoadedCounter & VAL_MASK) === 0)) {
        callbackProgress(ratioLoaded);
      }
      if ((callbackProgress !== undefined) &&
        (this.m_filesLoadedCounter + 1 === this.m_numLoadedFiles)) {
        callbackProgress(1.0);
      }
      this.m_newTagEvent.detail.fileName = fileName;

      let status;
      if (this.m_fromGoogle) {
        status = this.readFromGoogleBuffer(i, fileName, ratioLoaded, fileArrBu, callbackProgress, callbackComplete);
      } else {
        status = this.readFromBuffer(i, fileName, ratioLoaded, fileArrBu, callbackProgress, callbackComplete);
      }

      if ((status !== LoadResult.SUCCESS) && (this.m_numFailsLoad === 0)) {
        this.m_numFailsLoad += 1;
        if (callbackComplete !== null) {
          callbackComplete(status, null, 0, null, fileName);
          return false;
        }
      }
      // update total files counter
      this.m_filesLoadedCounter += 1;
      if (DEBUG_PRINT_INDI_SLICE_INFO) {
        console.log(`Loaded local indi slice: ${fileName}. Total loaded slices: ${this.m_filesLoadedCounter}`);
      }
      // console.log(`!!!!!!!!! m_filesLoadedCounter = ${this.m_filesLoadedCounter} / ${this.m_numLoadedFiles}`);

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
        if (zBox < TOO_MIN) {
          zBox = 1.0;
        }

        this.m_pixelSpacing.z = zBox / this.m_zDim;
        this.m_boxSize.z = this.m_zDim * this.m_pixelSpacing.z;
        this.m_boxSize.x = this.m_xDim * this.m_pixelSpacing.x;
        this.m_boxSize.y = this.m_yDim * this.m_pixelSpacing.y;
        console.log(`Volume local phys dim: ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
        // TODO: add hash
        let series = this.m_slicesVolume.getSeries();
        if (series.length === 0) {
          this.m_slicesVolume.buildSeriesInfo();
          series = this.m_slicesVolume.getSeries();
        }
        const hash = series[0].m_hash;
        const errStatus = this.createVolumeFromSlices(volDst, hash);
        if (callbackComplete !== null) {
          callbackComplete(errStatus);
          return true;
        }
      } // if last file was loaded
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      return false;
    }); // end of readfile
    return true;
  } // end runLoader



} // end class LoaderDicom

export default LoaderDicom;

 