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
/**
* Nifti file loader
* @module lib/scripts/loaders/niiloader
*/

// ******************************************************************
// imports
// ******************************************************************

import FileLoader from './fileloader';
import LocalFileLoader from './localfile';
import LoadResult from './loadresult';
import VolumeTools from './voltools';
import DicomInfo from './dicominfo';

// ******************************************************************
// Constants
// ******************************************************************

/** deep artificially fix volume texture size to even numbers */
const NEED_EVEN_TEXTURE_SIZE = false;

// ******************************************************************
// Class
// ******************************************************************

export default class NiftiLoader {
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
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
    this.m_nonEmptyBoxMin = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
    this.m_nonEmptyBoxMax = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };

    /** @property {object} m_slicesVolume - Volume, where slices are collected */
    // this.m_slicesVolume = new DicomSlicesVolume();
    /** @property {Object} m_info - Patient name, patient gender, ... */
    this.m_dicomInfo = null; // new DicomInfo();
  } // end of constructor

  getBoxSize() {
    return this.m_boxSize;
  }

  getDicomInfo() {
    return this.m_dicomInfo;
  }

  static readIntFromBuffer(buf, off) {
    const res = ((buf[off + 0]) |
      // eslint-disable-next-line
      (buf[off + 1] << 8) |
      // eslint-disable-next-line
      (buf[off + 2] << 16) |
      // eslint-disable-next-line
      (buf[off + 3] << 24)
    );
    return res;
  }

  static readShortFromBuffer(buf, off) {
    // eslint-disable-next-line
    const res = ((buf[off + 0]) | (buf[off + 1] << 8));
    return res;
  }

  static readFloatFromBuffer(buf, off) {
    const BYTES_IN_FLOAT = 4;
    const arBuf = new ArrayBuffer(BYTES_IN_FLOAT);
    const dataArray = new DataView(arBuf);
    // eslint-disable-next-line
    dataArray.setUint8(0, buf[off + 0]);
    // eslint-disable-next-line
    dataArray.setUint8(1, buf[off + 1]);
    // eslint-disable-next-line
    dataArray.setUint8(2, buf[off + 2]);
    // eslint-disable-next-line
    dataArray.setUint8(3, buf[off + 3]);
    const IS_LITTLE_ENDIAN = true;
    const res = dataArray.getFloat32(0, IS_LITTLE_ENDIAN);
    return res;
  }

  /**
  * Read nifti file set from buffer array
  * @param {object} arrBuf - binary byte buffer with file content
  * @param {object} callbackComplete - function, invoked after read binary file into byte array
  * @param {object} callbackProgress - function, invoked during read periodically
  * @return {boolean} true, if read success
  */
  readBuffer(arrBuf, callbackComplete, callbackProgress) {
    if (callbackProgress) {
      callbackProgress(0.0);
    }
    const bufBytes = new Uint8Array(arrBuf);
    const bufLen = bufBytes.length;
    const NIFTI_HEADER_SIZE = 348;
    // Nifti file header size is 348 bytes
    if (bufLen < NIFTI_HEADER_SIZE) {
      console.log('Nifti header too small');
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }

    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;

    let bufOff = 0;
    const headSize = NiftiLoader.readIntFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    if (headSize !== NIFTI_HEADER_SIZE) {
      console.log(`Nifti first int wrong: ${headSize}, but should be ${NIFTI_HEADER_SIZE}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }

    // data type
    // eslint-disable-next-line
    bufOff += 10;
    // db name
    // eslint-disable-next-line
    bufOff += 18;
    // extents
    bufOff += SIZE_DWORD;
    // session error
    bufOff += SIZE_SHORT;
    // regular
    bufOff += 1;
    // dim info
    bufOff += 1;

    // read number of dimensions
    const numDimensions = NiftiLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const NUM_DIMS = 3;
    if (numDimensions !== NUM_DIMS) {
      console.log(`Nifti header wrong num dimensions: ${numDimensions}, but should be 3`);
      if (callbackComplete) {
        callbackComplete(LoadResult.WRONG_HEADER_DIMENSIONS, null, 0, null);
      }
      return false;
    }
    this.m_xDim = NiftiLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    this.m_yDim = NiftiLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    this.m_zDim = NiftiLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // eslint-disable-next-line
    bufOff += 8;

    // intent_p1
    bufOff += SIZE_DWORD;
    // intent_p2
    bufOff += SIZE_DWORD;
    // intent_p3
    bufOff += SIZE_DWORD;
    // intent_code
    bufOff += SIZE_SHORT;
    const dataType = NiftiLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const bitPix = NiftiLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    const DATA_TYPE_SUPPORED = 4;
    if (dataType !== DATA_TYPE_SUPPORED) {
      console.log('Nifti header wrong data type');
      if (callbackComplete) {
        callbackComplete(LoadResult.WRONG_HEADER_DATA_TYPE, null, 0, null);
      }
      return false;
    }
    const BIT_PIXELS_SUPPORTED = 16;
    if (bitPix !== BIT_PIXELS_SUPPORTED) {
      console.log(`Nifti wrong bitPix: ${bitPix}, but should be 16`);
      if (callbackComplete) {
        callbackComplete(LoadResult.WRONG_HEADER_BITS_PER_PIXEL, null, 0, null);
      }
      return false;
    }
    // slice start
    bufOff += SIZE_SHORT;

    // grid spacing
    // const pixdim0 = NiftiLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixdim1 = NiftiLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixdim2 = NiftiLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixdim3 = NiftiLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;

    // console.log(`Nifti pixdim0: ${pixdim0}`);
    // console.log(`Nifti pixdim1: ${pixdim1}`);
    // console.log(`Nifti pixdim2: ${pixdim2}`);
    // console.log(`Nifti pixdim3: ${pixdim3}`);

    this.m_boxSize.x = this.m_xDim * pixdim1;
    this.m_boxSize.y = this.m_yDim * pixdim2;
    this.m_boxSize.z = this.m_zDim * pixdim3;
    const TOO_SMALL_SIZE = 1.0e-5;
    if (this.m_boxSize.x < TOO_SMALL_SIZE) {
      const SOME_MAGIC_BOX_DIM = 312.0;
      this.m_boxSize.x = SOME_MAGIC_BOX_DIM;
      this.m_boxSize.y = SOME_MAGIC_BOX_DIM;
      this.m_boxSize.z = SOME_MAGIC_BOX_DIM;
    }
    console.log(`Nifti physic volume size: ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);

    // read m_description field (max 80 characters)
    const OFF_DESC = 148;
    const MAX_STR_DECS = 80;
    const arrDesc = bufBytes.slice(OFF_DESC, OFF_DESC + MAX_STR_DECS);
    // const strDescr = decodeURIComponent(escape(String.fromCharCode.apply(null, arrDesc)));
    let strDescr = '';
    let isGoodSym = true;
    const CODE_MIN = 20;
    const CODE_MAX = 255;
    for (let i = 0; (i < MAX_STR_DECS) && isGoodSym; i++) {
      isGoodSym = ((arrDesc[i] >= CODE_MIN) && (arrDesc[i] < CODE_MAX));
      if (isGoodSym) {
        strDescr = strDescr.concat(String.fromCharCode(arrDesc[i]));
      }
    }
    // console.log(`Nifti description = ${strDescr}`);

    this.m_dicomInfo = new DicomInfo();
    this.m_dicomInfo.m_patientName = strDescr;
    this.m_dicomInfo.m_patientId = '';
    this.m_dicomInfo.m_patientGender = '';
    this.m_dicomInfo.m_patientDateOfBirth = '';
    this.m_dicomInfo.m_studyDate = '';
    this.m_dicomInfo.m_acquisionTime = '';
    this.m_dicomInfo.m_institutionName = '';
    this.m_dicomInfo.m_physicansName = '';
    this.m_dicomInfo.m_manufacturerName = '';

    // 4 last bytes are magic
    bufOff = NIFTI_HEADER_SIZE - SIZE_DWORD;
    // 'n' == 110, '+' == 43, '1' == 49
    const MAG_0 = 110;
    const MAG_1 = 43;
    const MAG_2 = 49;
    const isCorrectMagic = (bufBytes[bufOff + 0] === MAG_0) &&
      // eslint-disable-next-line
      (bufBytes[bufOff + 1] === MAG_1) &&
      // eslint-disable-next-line
      (bufBytes[bufOff + 2] === MAG_2);
    if (!isCorrectMagic) {
      // eslint-disable-next-line
      console.log(`Nifti hdr bad magic: ${bufBytes[bufOff + 0]}, ${bufBytes[bufOff + 1]}, ${bufBytes[bufOff + 2]}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.WRONG_HEADER_MAGIC, null, 0, null);
      }
      return false;
    }
    bufOff += SIZE_DWORD; // last magic bytes in header

    const numVoxels = this.m_xDim * this.m_yDim * this.m_zDim;
    const dataOff = bufOff;

    // get power of 2 for data size
    let pwr2;
    let pwrFinish = false;
    // eslint-disable-next-line
    for (pwr2 = 29; (pwr2 >= 0) && (!pwrFinish); pwr2--) {
      const val = 1 << pwr2;
      if (val < numVoxels) {
        pwrFinish = true;
      }
    }
    pwr2++;
    // console.log(`pwr2 = ${pwr2}`);
    // build mask for progress update
    // eslint-disable-next-line
    pwr2 -= 3;
    if (pwr2 <= 0) {
      pwr2 = 1;
    }
    const progressMask = (1 << pwr2) - 1;

    let j;
    // scan min max in array
    let valMax = 0;
    j = 0;
    for (let i = 0; i < numVoxels; i++) {
      const val = NiftiLoader.readShortFromBuffer(bufBytes, dataOff + j);
      // eslint-disable-next-line
      j += 2;
      if (val > valMax) {
        valMax = val;
      }
      // progress update
      if (callbackProgress && ((i & progressMask) === 0) && (i > 0)) {
        const ratio = 0.0 + 0.5 * (i / numVoxels);
        callbackProgress(ratio);
      }
    } // for (i) al voxels
    // console.log(`Nifti 16 data max val: ${valMax}`);

    // create histogram
    const histogram = new Int32Array(valMax);
    for (let i = 0; i < valMax; i++) {
      histogram[i] = 0;
    }
    j = 0;
    for (let i = 0; i < numVoxels; i++) {
      const val = NiftiLoader.readShortFromBuffer(bufBytes, dataOff + j);
      // eslint-disable-next-line
      j += 2;
      histogram[val] += 1;
    }

    const histSmooothed = new Int32Array(valMax);
    const HIST_SMOOTH_SIGMA = 0.8;
    const okBuild = VolumeTools.buildSmoothedHistogram(histogram, histSmooothed, valMax, HIST_SMOOTH_SIGMA);
    if (okBuild !== 1) {
      console.log('Error build histogram');
      return false;
    }

    // find last max in smoothed histogram
    const MAX_VALUE_IN_HISTOGRAM = 325;
    let indMax;
    const HIST_RANGE_CHECK = 4;
    for (indMax = valMax - 1; indMax > HIST_RANGE_CHECK; indMax--) {
      if (histSmooothed[indMax - 1] >= MAX_VALUE_IN_HISTOGRAM) {
        break;
      }
    } // for (indMax)
    // console.log(`Nifti smooth hist max peak: ${indMax}`);

    // replace val max to extracted maximum from histogram
    valMax = indMax;
    const MAX_BYTE = 255;
    // convert 16 bit data to 8 bit array
    const BITS_IN_BYTE = 8;
    const dataSize = numVoxels * (bitPix / BITS_IN_BYTE);
    let dataArray = new Uint8Array(numVoxels);
    const ACC_DEGREE = 9;
    const scale = (MAX_BYTE << ACC_DEGREE) / valMax;
    const TOO_MIN_SCALE = 4;
    if (scale <= TOO_MIN_SCALE) {
      console.log('Bad scaling: image will be 0');
      if (callbackComplete) {
        callbackComplete(LoadResult.ERROR_PROCESS_HISTOGRAM, null, 0, null);
      }
      return false;
    }
    j = 0;
    for (let i = 0; i < numVoxels; i++) {
      let val = NiftiLoader.readShortFromBuffer(bufBytes, dataOff + j);
      // eslint-disable-next-line
      j += 2;
      // scale down to [0..255]
      val = (val * scale) >> ACC_DEGREE;
      // check [0..255] range for some voxels out from histogram peak
      val = (val <= MAX_BYTE) ? val : MAX_BYTE;
      dataArray[i] = val;
      // progress update
      if (callbackProgress && ((i & progressMask) === 0) && (i > 0)) {
        const ratio = 0.5 + 0.5 * (i / numVoxels);
        callbackProgress(ratio);
      }
    } // for (i) all voxels
    let xyDim = this.m_xDim * this.m_yDim;
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

    // clear borders
    let x; let y;
    let z;
    const zOffMin = 0 * xyDim;
    const zOffMax = (this.m_zDim - 1) * xyDim;
    for (y = 0; y < this.m_yDim; y++) {
      const yOff = y * this.m_xDim;
      for (x = 0; x < this.m_xDim; x++) {
        let off;
        off = zOffMin + yOff + x;
        dataArray[off] = 0;
        off = zOffMax + yOff + x;
        dataArray[off] = 0;
      } // for (x)
    }   // for (y)
    const xOffMin = 0;
    const xOffMax = this.m_xDim - 1;
    for (z = 0; z < this.m_zDim; z++) {
      const zOff = z * xyDim;
      for (y = 0; y < this.m_yDim; y++) {
        let off;
        off = zOff + (y * this.m_xDim) + xOffMin;
        dataArray[off] = 0;
        off = zOff + (y * this.m_xDim) + xOffMax;
        dataArray[off] = 0;
      }
    }
    const yOffMin = 0;
    const yOffMax = (this.m_yDim - 1) * this.m_xDim;
    for (z = 0; z < this.m_zDim; z++) {
      const zOff = z * xyDim;
      for (x = 0; x < this.m_xDim; x++) {
        let off;
        off = zOff + yOffMin + x;
        dataArray[off] = 0;
        off = zOff + yOffMax + x;
        dataArray[off] = 0;
      }
    }

    // Finally invoke user callback after file was read
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
    if (callbackProgress) {
      callbackProgress(1.0);
    }
    if (callbackComplete) {
      callbackComplete(LoadResult.SUCCESS, header, dataSize, dataArray);
    } // if callbackComplete ready

    console.log(`Nifti header read OK. Volume pixels = ${this.m_xDim} * ${this.m_yDim} * ${this.m_zDim}`);
    return true;
  }

  /**
  * Read nifti file set from given file
  * @param {object} file - selected file from app GUI
  * @param {object} callbackFunc - function, invoked after read binary file into byte array
  * @return {boolean} true, if read success
  */
  readFromFile(file, callbackComplete, callbackProgress) {
    this.m_folder = null;
    // this.m_slicesVolume.destroy();
    this.m_localFileLoader = new LocalFileLoader(file);
    this.m_localFileLoader.readFile((arrBuf) => {
      this.readBuffer(arrBuf, callbackComplete, callbackProgress);
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
      return false;
    }); // end of readFile
    // console.log(`NIFTI loader. Will be load ${numFiles}. File name: ${files[0].name}`);
    return true;
  } // readFromFile

  /**
  * Read nifti file set from URL
  * @param {string} strUrl - where file open
  * @param {object} callbackFunc - function, invoked after read binary file into byte array
  * @return {boolean} true, if read success
  */
  readFromURL(strUrl, callbackComplete, callbackProgress) {
    this.m_folder = null;
    // this.m_slicesVolume.destroy();
    this.m_fileLoader = new FileLoader(strUrl);
    this.m_isLoadedSuccessfull = false;
    this.m_dataSize = 0;
    this.m_dataArray = null;

    this.m_fileLoader.readFile((arrBuf) => {
      this.readBuffer(arrBuf, callbackComplete, callbackProgress);
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
      return false;
    });
    console.log(`NIFTI loader from URL: ${strUrl}`);
    return true;
  } // readFromFile

} // end of class
