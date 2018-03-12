/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
'License'); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
/**
* Hdr volume structure, used by hdr loader
* @module lib/scripts/loaders/hdrvolume
*/

// ******************************************************************
// imports
// ******************************************************************

import LoadResult from './loadresult';
import VolumeTools from './voltools';

// ******************************************************************
// const
// ******************************************************************

/** Need to make texture z dimension evenly aligned */
const NEED_EVEN_TEXTURE_SIZE = false;

const HDR_DT_NONE = 0;
// const HDR_DT_BINARY = 1;
const HDR_DT_UNSIGNED_CHAR = 2;
const HDR_DT_SIGNED_SHORT = 4;
// const HDR_DT_SIGNED_INT = 8;
// const HDR_DT_FLOAT = 16;
// const HDR_DT_COMPLEX = 32;
// const HDR_DT_DOUBLE = 64;
// const HDR_DT_ARGB = 128;
// const HDR_DT_ALL = 255;

// *******************************************************************
// HdrVolume
// *******************************************************************

/** Class HdrVolume stores volume details */
export default class HdrVolume {
  /**
  * Create volume
  */
  constructor(needScaleDownTexture) {
    this.m_needScaleDownTexture = needScaleDownTexture;
    /** Data type from header */
    this.m_dataType = HDR_DT_NONE;
    /** Volume Pixels */
    this.m_dataArray = null;
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
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
  }
  getBoxSize() {
    return this.m_boxSize;
  }

  getDicomInfo() {
    return this.m_dicomInfo;
  }

  getBytesPerPixel() {
    if (this.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      return 1;
    } else if (this.m_dataType === HDR_DT_SIGNED_SHORT) {
      const TWO = 2;
      return TWO;
    }
    return -1;
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

  static readByteFromBuffer(buf, off) {
    return buf[off];
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
  * Convert DaataView object into string
  * @param {object} buf - buffer
  * @param {number} off - current offset in buffer, when string started
  * @param {number} lengthBuf - number of bytes to convert to string
  * @return {string} string presentation of DataView
  */
  static getStringAt(buf, off, lengthBuf) {
    let str = '';
    for (let i = 0; i < lengthBuf; i++) {
      const ch = buf[off + i];
      if (ch === 0) {
        break;
      }
      str += String.fromCharCode(ch);
    }
    return str;
  }
  /**
  * Read hdr file set from buffer array
  *
  * Data structure is described in:
  * http://dclunie.com/medical-image-faq/html/part5.html
  *
  * @param {object} arrBuf - binary byte buffer with file content
  * @param {object} callbackComplete - function, invoked after read binary file into byte array
  * @param {object} callbackProgress - function, invoked during read periodically
  * @return {boolean} true, if read success
  */
  readBufferHead(arrBuf, callbackComplete, callbackProgress) {
    if (callbackProgress) {
      callbackProgress(0.0);
    }
    const bufBytes = new Uint8Array(arrBuf);
    const bufLen = bufBytes.length;

    const HDR_HEADER_SIZE = 348;
    // Hdr file header size should be 348 bytes: check this fact
    if (bufLen < HDR_HEADER_SIZE) {
      console.log('Hdr header too small');
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }

    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;
    const SIZE_BYTE = 1;

    let bufOff = 0;
    // read sizeof header
    const sizeofHdr = HdrVolume.readIntFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    if (sizeofHdr !== HDR_HEADER_SIZE) {
      console.log(`Hdr first int wrong: ${sizeofHdr}, but should be ${HDR_HEADER_SIZE}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }
    // read dataType char[10]
    const DATA_TYPE_LEN = 10;
    const strDataType = HdrVolume.getStringAt(bufBytes, bufOff, DATA_TYPE_LEN);
    bufOff += DATA_TYPE_LEN;
    this.m_dataType = HDR_DT_NONE;
    if (strDataType === 'CHAR') {
      this.m_dataType = HDR_DT_UNSIGNED_CHAR;
    }
    if (strDataType === 'SHORT') {
      this.m_dataType = HDR_DT_SIGNED_SHORT;
    }
    if (this.m_dataType === HDR_DT_NONE) {
      console.log(`Hdr wrong data type. Should be CHAR or SHORT, but found: ${strDataType}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }
    console.log(`Hdr read data type = ${strDataType}`);

    // read dbName char[18]
    const DB_NAME_LEN = 18;
    bufOff += DB_NAME_LEN;

    // reads extents int
    const iExtents = HdrVolume.readIntFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const MAGIC_EXTENTS = 16384;
    if (iExtents !== MAGIC_EXTENTS) {
      console.log(`Hdr wrong extents in header. Should be ${MAGIC_EXTENTS}, but found: ${iExtents}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }

    // read session error
    // const iSessionError = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // read regular
    const iRegular = HdrVolume.readByteFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_BYTE;

    const  MAGIC_REGULAR = 114;
    if (iRegular !== MAGIC_REGULAR) {
      console.log(`Hdr wrong regular in header. Should be ${MAGIC_REGULAR}, but found: ${iRegular}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }

    // read hKeyUn
    // const hKeyUn = HdrVolume.readByteFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_BYTE;

    // read ushort dim[8]
    // const dim0 = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim1 = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim2 = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim3 = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    this.m_xDim = dim1;
    this.m_yDim = dim2;
    this.m_zDim = dim3;
    console.log(`HDR: volume dim = ${this.m_xDim} * ${this.m_yDim} * ${this.m_zDim} `);

    // read unused dim [4,5,6,7]
    const NUM_DIM_UNUSED = 4;
    bufOff += SIZE_SHORT * NUM_DIM_UNUSED;

    // read voxUnits
    const VOX_UNITS_SIZE = 4;
    bufOff += VOX_UNITS_SIZE;

    // read calUnits char[8]
    const CAL_UNITS_SIZE = 8;
    bufOff += CAL_UNITS_SIZE;

    // read unused
    // const unusedH = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // read dataType
    const dataTypeH = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    if (this.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      if (dataTypeH !== HDR_DT_UNSIGNED_CHAR) {
        console.log('Wrong data tye for char typed header');
        return false;
      }
    }
    if (this.m_dataType === HDR_DT_SIGNED_SHORT) {
      if (dataTypeH !== HDR_DT_SIGNED_SHORT) {
        console.log('Wrong data tye for signed short typed header');
        return false;
      }
    }

    // read bitPix
    const BITS_IN_CHAR = 8;
    const BITS_IN_WORD = 16;

    const bitPixH = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    if (this.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      if (bitPixH !== BITS_IN_CHAR) {
        console.log('Wrong bits pix for char typed header');
        return false;
      }
    }
    if (this.m_dataType === HDR_DT_SIGNED_SHORT) {
      if (bitPixH !== BITS_IN_WORD) {
        console.log('Wrong bits pix for word typed header');
        return false;
      }
    }

    // read dimUn
    // const dimUn = HdrVolume.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // read pixDim : voxelDim
    // const pixDim0 = HdrVolume.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim1 = HdrVolume.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim2 = HdrVolume.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim3 = HdrVolume.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;

    // read rest of pixDim
    const NUM_REST_PIX_DIM = 4;
    bufOff += SIZE_DWORD * NUM_REST_PIX_DIM;

    this.m_boxSize.x = this.m_xDim * pixDim1;
    this.m_boxSize.y = this.m_yDim * pixDim2;
    this.m_boxSize.z = this.m_zDim * pixDim3;
    console.log(`HDR: physic size = ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z} `);

    return true;
  }

  /**
  * Read image file from pair (HDR + IMG)
  *
  * Data structure is described in:
  * http://dclunie.com/medical-image-faq/html/part5.html
  *
  * @param {object} arrBuf - binary byte buffer with file content (only raw pixels data)
  * @param {object} callbackComplete - function, invoked after read binary file into byte array
  * @param {object} callbackProgress - function, invoked during read periodically
  * @return {boolean} true, if read success
  */
  readBufferImg(arrBuf, callbackComplete, callbackProgress) {
    if (callbackProgress) {
      callbackProgress(0.0);
    }
    const NUM_BYTES_CHAR = 1;
    const NUM_BYTES_WORD = 2;
    let bytesPerPixel = 0;
    if (this.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      bytesPerPixel = NUM_BYTES_CHAR;
    }
    if (this.m_dataType === HDR_DT_SIGNED_SHORT) {
      bytesPerPixel = NUM_BYTES_WORD;
    }
    const bufBytes = new Uint8Array(arrBuf);
    const bufSize = bufBytes.length;

    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    const estimatedVolSize = numPixels * bytesPerPixel;
    if (estimatedVolSize !== bufSize) {
      console.log(`HDR: wrong IMG data size. Read: ${bufSize}, but expected ${estimatedVolSize} `);
      return false;
    }

    // read volume intensity pixels: usually this data in 16 bpp format
    if (this.m_dataType === HDR_DT_SIGNED_SHORT) {
      const dataArray16 = new Uint16Array(arrBuf);
      this.m_dataArray = new Uint8Array(numPixels);
      // convert 16 bpp -> 8 bpp
      let i;
      let valMax = 0;
      for (i = 0; i < numPixels; i++) {
        valMax = (dataArray16[i] > valMax) ? dataArray16[i] : valMax;
      }
      // console.log(`IMG: maximum input color is ${valMax}`);
      valMax++;

      // scale down to 256 colors
      const MAX_COLOR_BYTE = 255;
      for (i = 0; i < numPixels; i++) {
        this.m_dataArray[i] = Math.floor(MAX_COLOR_BYTE * dataArray16[i] / valMax);
      }
    } else if (this.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      // Read color indices info: usually this is 1 bpp data
      this.m_dataArray = bufBytes;
    }

    console.log(`HDR: Read finished with ${bufSize} bytes`);

    // Special volume texture size fix (z dim should be even)
    if (NEED_EVEN_TEXTURE_SIZE) {
      const xDim = this.m_xDim;
      const yDim = this.m_yDim;
      const zDim = this.m_zDim;
      const NUM3 = 3;
      const NUM4 = 4;
      if (((xDim % NUM4) !== 0) || ((yDim % NUM4) !== 0) || ((zDim % NUM4) !== 0)) {
        const volDataAlignedSize = VolumeTools.makeTextureSizeEven(this.m_dataArray, xDim, yDim, zDim);
        this.m_xDim = (xDim + NUM3) & (~NUM3);
        this.m_yDim = (yDim + NUM3) & (~NUM3);
        this.m_zDim = (zDim + NUM3) & (~NUM3);
        this.m_dataArray = volDataAlignedSize;
      }
    }
    if (callbackProgress) {
      callbackProgress(1.0);
    }
    return true;
  } // readBufferImg
}
