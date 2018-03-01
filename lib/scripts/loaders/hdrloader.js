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
* Hdr file loader
* @module lib/scripts/loaders/hdrloader
*/

// ******************************************************************
// imports
// ******************************************************************

import LoadResult from './loadresult';
import LoadFilePromise from './loadpromise';
import VolumeTools from './voltools';

// ******************************************************************
// const
// ******************************************************************

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

/** deep artificially fix volume texture size to even numbers */
const NEED_EVEN_TEXTURE_SIZE = true;

// *******************************************************************
// HdrLoader
// *******************************************************************

/** Class HdrLoader implements HDR format reading */
export default class HdrLoader {
  /**
  * Create loader
  */
  constructor(needScaleDownTexture) {
    this.m_needScaleDownTexture = needScaleDownTexture;
    // Data type from header
    this.m_dataType = HDR_DT_NONE;
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_folder = null;
    this.m_isLoadedSuccessfull = false;
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
    const sizeofHdr = HdrLoader.readIntFromBuffer(bufBytes, bufOff);
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
    const strDataType = HdrLoader.getStringAt(bufBytes, bufOff, DATA_TYPE_LEN);
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
    const iExtents = HdrLoader.readIntFromBuffer(bufBytes, bufOff);
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
    // const iSessionError = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // read regular
    const iRegular = HdrLoader.readByteFromBuffer(bufBytes, bufOff);
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
    // const hKeyUn = HdrLoader.readByteFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_BYTE;

    // read ushort dim[8]
    // const dim0 = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim1 = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim2 = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim3 = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
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
    // const unusedH = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // read dataType
    const dataTypeH = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
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

    const bitPixH = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
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
    // const dimUn = HdrLoader.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    // read pixDim : voxelDim
    // const pixDim0 = HdrLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim1 = HdrLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim2 = HdrLoader.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim3 = HdrLoader.readFloatFromBuffer(bufBytes, bufOff);
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
  * Read img file from pair (HDR + IMG)
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
    const dataSize = numPixels;

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
      if ((zDim & 1) !== 0) {
        const volDataAlignedSize = VolumeTools.makeTextureSizeEven(this.m_dataArray, xDim, yDim, zDim);
        this.m_zDim = (zDim + 1);
        this.m_dataArray = volDataAlignedSize;
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
      let isRoiPalette = false;
      if (this.m_dataType === HDR_DT_UNSIGNED_CHAR) {
        isRoiPalette = true;
      }
      callbackComplete(LoadResult.SUCCESS, header, dataSize, this.m_dataArray, isRoiPalette);
    } // if callbackComplete ready

    return true;
  }

  /**
  * Read hdr file set from given file
  * @param {object} files - selected files from app GUI
  * @param {object} callbackComplete - function, invoked after completed read
  * @param {object} callbackProgress - function, invoked during reading
  * @return {boolean} true, if read success
  */
  readFromFiles(files, callbackComplete, callbackProgress) {
    const numFiles = files.length;
    const NUM_FILES_IN_SET = 2;
    if (numFiles === NUM_FILES_IN_SET) {
      let fileHdr = files[0];
      let fileImg = files[1];
      const loaderHdr = new LoadFilePromise();
      const loaderImg = new LoadFilePromise();
      let indPointH = fileHdr.name.indexOf('.h');
      if (indPointH === -1) {
        indPointH = fileHdr.name.indexOf('.hdr');
      }
      if (indPointH === -1) {
        const fileCopy = fileHdr;
        fileHdr = fileImg;
        fileImg = fileCopy;
      }
      indPointH = fileHdr.name.indexOf('.h');
      if (indPointH === -1) {
        indPointH = fileHdr.name.indexOf('.hdr');
      }
      if (indPointH === -1) {
        console.log('Hdr file [0] should be with h/hdr extension');
        return false;
      }
      const indPointImg = fileImg.name.indexOf('.img');
      if (indPointImg < 0) {
        console.log('Hdr file [1] should be with img extension');
        return false;
      }
      loaderHdr.readLocal(fileHdr).then((arrBufHdr) => {
        this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${fileHdr.name}`);
        loaderImg.readLocal(fileImg).then((arrBufImg) => {
          this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${fileImg.name}`);
        });
      }, (error) => {
        console.log('HDR File read error', error);
        return false;
      });
    } else {
      console.log(`Error read hdr files. Should be ${NUM_FILES_IN_SET} files`);
      return false;
    }// if number of files equal to 2
    return true;
  } // readFromFiles

  /**
  * Read hdr+img file set from URL
  * @param {string} arrUrls - array with string URLs of 2 files: hdr + img
  * @param {object} callbackComplete - function, invoked after completed read
  * @param {object} callbackProgress - function, invoked during reading
  * @return {boolean} true, if read success
  */
  readFromURLS(arrUrls, callbackComplete, callbackProgress) {
    const numUrls = arrUrls.length;
    const NUM_URLS_IN_SET = 2;
    if (numUrls === NUM_URLS_IN_SET) {
      let urlHdr = arrUrls[0];
      let urlImg = arrUrls[1];
      const loaderHdr = new LoadFilePromise();
      const loaderImg = new LoadFilePromise();
      let indPointH = urlHdr.indexOf('.h');
      if (indPointH === -1) {
        indPointH = urlHdr.indexOf('.hdr');
      }
      if (indPointH === -1) {
        const strCopy = urlHdr;
        urlHdr = urlImg;
        urlImg = strCopy;
      }

      loaderHdr.readFromUrl(urlHdr).then((arrBufHdr) => {
        this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${urlHdr}`);
        loaderImg.readFromUrl(urlImg).then((arrBufImg) => {
          this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${urlImg}`);
        });
      }, (error) => {
        console.log('HDR File read error', error);
        callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
        return false;
      });
    } else {
      console.log(`Error read hdr files. Should be ${NUM_URLS_IN_SET} files`);
      return false;
    }// if number of files equal to 2
    return true;
  } // readFromFile
}
