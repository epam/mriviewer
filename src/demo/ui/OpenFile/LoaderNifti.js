/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import UiHistogram from '../UiHistogram';

class LoaderNifti {
  constructor() {
    this.m_littleEndian = true;
    this.m_header = {
      m_id: '',
      m_endianness: 0,
      m_glType: 0,
      m_glTypeSize: 0,
      m_glFormat: 0,
      m_glInternalFormat: 0,
      m_glBaseInternalFormat: 0,
      m_pixelWidth: 0,
      m_pixelHeight: 0,
      m_pixelDepth: 0,
      m_numberOfArrayElements: 0,
      m_numberOfFaces: 0,
      m_numberOfMipmapLevels: 0,
      m_bytesOfKeyValueData: 0
    };
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_boxSize = {
      x: 0.0,
      y: 0.0,
      z: 0.0
    };
  }

  /**
  * Read 32 bit integer from input buffer
  * @param {object} buf - source buffer
  * @param {number} off - offset in buffer
  * @return 32 bit integer number
  */
  readIntFromBuffer(buf, off) {
    let res = 0;
    if (this.m_littleEndian) {
      res = ((buf[off]) |
        // eslint-disable-next-line
        (buf[off + 1] << 8) |
        // eslint-disable-next-line
        (buf[off + 2] << 16) |
        // eslint-disable-next-line
        (buf[off + 3] << 24));
    } else {
      res = ((buf[off + 3]) |
        // eslint-disable-next-line
        (buf[off + 2] << 8) |
        // eslint-disable-next-line
        (buf[off + 1] << 16) |
        // eslint-disable-next-line
        (buf[off] << 24));
    }
    return res;
  }

  /**
  * Read 16 bit short integer from input buffer
  * @param {object} buf - source buffer
  * @param {number} off - offset in buffer
  * @return 16 bit short integer number
  */
  readShortFromBuffer(buf, off) {
    let res = 0;
    if (this.m_littleEndian) {
      // eslint-disable-next-line
      res = ((buf[off + 0]) | (buf[off + 1] << 8));
    } else {
      // eslint-disable-next-line
      res = ((buf[off + 1]) | (buf[off + 0] << 8));
    }
    return res;
  }

  /**
  * Read 32 bit float from input buffer
  * @param {object} buf - source buffer
  * @param {number} off - offset in buffer
  * @return float number, loaded from buffer
  */
  readFloatFromBuffer(buf, off) {
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
    const res = dataArray.getFloat32(0, this.m_littleEndian);
    return res;
  }

  /**
  * Read from local file buffer
  * @param {object} volDst - Destination volume object to be fiiied
  * @param {object} arrBuf - source byte buffer
  * @param {func} callbackProgress - function invoked during read
  * @param {func} callbackComplete - function invoked after reading
  * @return true, if success
  */
  readFromBuffer(volDst, arrBuf) {
    const bufBytes = new Uint8Array(arrBuf);
    const bufLen = bufBytes.length;
    const MIN_BUF_SIZE = 8;
    const MAX_BUF_SIZE = (1024 * 1024 * 230);
    if (bufLen < MIN_BUF_SIZE) {
      return false;
    }
    if (bufLen >= MAX_BUF_SIZE) {
      return false;
    }
    const NIFTI_HEADER_SIZE = 348;
    // Nifti file header size is 348 bytes
    if (bufLen < NIFTI_HEADER_SIZE) {
      return false;
    }
    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;

    let bufOff = 0;
    let headSize = this.readIntFromBuffer(bufBytes, bufOff);
    if (headSize > (2 << 24)) {
      this.m_littleEndian = false;
      headSize = this.readIntFromBuffer(bufBytes, bufOff);
    }

    bufOff += SIZE_DWORD;
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
    bufOff += SIZE_SHORT;
    this.m_xDim = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    this.m_yDim = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    this.m_zDim = this.readShortFromBuffer(bufBytes, bufOff);
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
    const dataType = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const bitPix = this.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    const NIFTI_DATA_TYPE_UINT8 = 2;
    const NIFTI_DATA_TYPE_INT16 = 4;
    const NIFTI_DATA_TYPE_FLOAT32 = 16;
    const NIFTI_DATA_TYPE_INT8 = 256;
    const NIFTI_DATA_TYPE_UINT16 = 512;

    let isDataTypeCorrect = 0;
    isDataTypeCorrect |= (dataType === NIFTI_DATA_TYPE_UINT8);
    isDataTypeCorrect |= (dataType === NIFTI_DATA_TYPE_INT16);
    isDataTypeCorrect |= (dataType === NIFTI_DATA_TYPE_FLOAT32);
    isDataTypeCorrect |= (dataType === NIFTI_DATA_TYPE_INT8);
    isDataTypeCorrect |= (dataType === NIFTI_DATA_TYPE_UINT16);
  

    if (!isDataTypeCorrect) {
      console.log(`Nifti header read. This data type (${dataType}) is not supported`);
      return false;
    }
    const BIT_PIXELS_8 = 8;
    const BIT_PIXELS_16 = 16;
    const BIT_PIXELS_32 = 32;
    const isSupported = (bitPix === BIT_PIXELS_8) | 
      (bitPix === BIT_PIXELS_16) | (bitPix === BIT_PIXELS_32);
    if (!isSupported) {
      return false;
    }
    // slice start
    bufOff += SIZE_SHORT;

    // grid spacing
    // const pixdim0 = this.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixdim1 = this.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixdim2 = this.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixdim3 = this.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
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

    // 4 last bytes are magic
    bufOff = NIFTI_HEADER_SIZE - SIZE_DWORD;
    // 'n' == 110, '+' == 43, '1' == 49
    const MAG_0 = 110;
    const MAG_1 = 43;
    const MAG_2 = 49;
    const isCorrectMagic = (bufBytes[bufOff] === MAG_0) &&
      // eslint-disable-next-line
      (bufBytes[bufOff + 1] === MAG_1) &&
      // eslint-disable-next-line
      (bufBytes[bufOff + 2] === MAG_2);
    if (!isCorrectMagic) {
      return false;
    }
    bufOff += SIZE_DWORD; // last magic bytes in header

    const numVoxels = this.m_xDim * this.m_yDim * this.m_zDim;
    const dataOff = bufOff;

    let i, j;
    // scan min max in array
    let valMax = 0;
    j = 0;
    if ((dataType === NIFTI_DATA_TYPE_INT16) || (dataType === NIFTI_DATA_TYPE_UINT16)) {
      for (i = 0; i < numVoxels; i++) {
        const val = this.readShortFromBuffer(bufBytes, dataOff + j);
        // eslint-disable-next-line
        j += 2;
        if (val > valMax) {
          valMax = val;
        }
      }
    }
    if ((dataType === NIFTI_DATA_TYPE_INT8) || (dataType === NIFTI_DATA_TYPE_UINT8)) {
      for (i = 0; i < numVoxels; i++) {
        const val = bufBytes[dataOff + j];
        // eslint-disable-next-line
        j ++;
        if (val > valMax) {
          valMax = val;
        }
      }
    }
    if (dataType === NIFTI_DATA_TYPE_FLOAT32) {
      for (i = 0; i < numVoxels; i++) {
        const fval = this.readFloatFromBuffer(bufBytes, dataOff + j);
        const val = Math.floor(fval) + 1;
        // eslint-disable-next-line
        j += 4;
        if (val > valMax) {
          valMax = val;
        }
      }
    }
    const histArray = new Float32Array(valMax + 1);
    for (i = 0; i < valMax + 1; i++) {
      histArray[i] = 0.0;
    }
    j = 0;
    if ((dataType === NIFTI_DATA_TYPE_INT16) || (dataType === NIFTI_DATA_TYPE_UINT16)) {
      for (i = 0; i < numVoxels; i++) {
        const val = this.readShortFromBuffer(bufBytes, dataOff + j);
        // eslint-disable-next-line
        j += 2;
        histArray[val] ++;
      }
    } // if
    if (dataType === NIFTI_DATA_TYPE_FLOAT32) {
      for (i = 0; i < numVoxels; i++) {
        const val = Math.floor(this.readFloatFromBuffer(bufBytes, dataOff + j));
        // eslint-disable-next-line
        j += 4;
        histArray[val] ++;
      }
    } // if
    if ((dataType === NIFTI_DATA_TYPE_INT8) || (dataType === NIFTI_DATA_TYPE_UINT8)) {
      for (i = 0; i < numVoxels; i++) {
        const val = bufBytes[dataOff + j];
        // eslint-disable-next-line
        j ++;
        histArray[val] ++;
      }
    } // if

    const histogram = new UiHistogram();
    histogram.assignArray(valMax, histArray);

    const HIST_SMOOTH_SIGMA = 0.8;
    const NORMALIZATION_APPLY = false;
    histogram.smoothHistogram(HIST_SMOOTH_SIGMA, NORMALIZATION_APPLY);
    const VAL_MIN = 4.0;
    // fix max index if maximum not found
    let indMax = histogram.getLastMaxIndex(VAL_MIN);
    if (indMax < 4) {
      indMax = valMax;
    }
    valMax = indMax;
    const MAX_BYTE = 255;
    let dataArray = new Uint8Array(numVoxels);
    const ACC_DEGREE = 9;
    const scale = (MAX_BYTE << ACC_DEGREE) / valMax;
    const TOO_MIN_SCALE = 4;
    if (scale <= TOO_MIN_SCALE) {
      return false;
    }
    j = 0;
    if ((dataType === NIFTI_DATA_TYPE_INT16) || (dataType === NIFTI_DATA_TYPE_UINT16)) {
      for (i = 0; i < numVoxels; i++) {
        let val = this.readShortFromBuffer(bufBytes, dataOff + j);
        // eslint-disable-next-line
        j += 2;
        // scale down to [0..255]
        val = (val * scale) >> ACC_DEGREE;
        // check [0..255] range for some voxels out from histogram peak
        val = (val <= MAX_BYTE) ? val : MAX_BYTE;
        dataArray[i] = val;
      } // for (i) all voxels
    } // if 16 bit
    if ((dataType === NIFTI_DATA_TYPE_INT8) || (dataType === NIFTI_DATA_TYPE_UINT8)) {
      for (i = 0; i < numVoxels; i++) {
        let val = bufBytes[dataOff + j];
        // eslint-disable-next-line
        j ++;
        // scale down to [0..255]
        val = (val * scale) >> ACC_DEGREE;
        // check [0..255] range for some voxels out from histogram peak
        val = (val <= MAX_BYTE) ? val : MAX_BYTE;
        dataArray[i] = val;
      } // for (i) all voxels
    } // if 8 bit
    if (dataType === NIFTI_DATA_TYPE_FLOAT32) {
      for (i = 0; i < numVoxels; i++) {
        let val = Math.floor(this.readFloatFromBuffer(bufBytes, dataOff + j));
        // eslint-disable-next-line
        j += 4;
        // scale down to [0..255]
        val = (val * scale) >> ACC_DEGREE;
        // check [0..255] range for some voxels out from histogram peak
        val = (val <= MAX_BYTE) ? val : MAX_BYTE;
        dataArray[i] = val;
      } // for (i) all voxels
    } // if 16 bit


    let xyDim = this.m_xDim * this.m_yDim;
    let x; let y;
    let z;
    const zOffMax = (this.m_zDim - 1) * xyDim;
    for (y = 0; y < this.m_yDim; y++) {
      const yOff = y * this.m_xDim;
      for (x = 0; x < this.m_xDim; x++) {
        let off;
        off = yOff + x;
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

    // save to result volume
    volDst.m_xDim = this.m_xDim;
    volDst.m_yDim = this.m_yDim;
    volDst.m_zDim = this.m_zDim;
    volDst.m_bytesPerVoxel = 1;
    volDst.m_dataArray = dataArray;
    volDst.m_dataSize = numVoxels;
    volDst.m_boxSize = this.m_boxSize;
    return true;
  }
}

export default LoaderNifti;
