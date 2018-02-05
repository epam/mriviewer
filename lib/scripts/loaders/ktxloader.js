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
* KTX volume files loader
* @module app/scripts/loaders/ktxloader
*/

// ******************************************************************
// imports
// ******************************************************************

import FileLoader from './fileloader';
import LocalFileLoader from './localfile';
import LoadResult from './loadresult';
import KtxHeader from './ktxheader';
import VolumeTools from './voltools';

const NEED_CONTAST_DATA = false;

/** Class KtxLoader Load KTX volum files */
export default class KtxLoader {

  /**
  * Create loader.
  */
  constructor() {
    /** @property {object} m_fileLoader - low level file loader */
    this.m_fileLoader = null;
    /** @property {object} m_header - KTX header */
    this.m_header = new KtxHeader();
    /** @property {boolean} m_isLoadedSuccessfull - Loaded flag: success o not */
    this.m_isLoadedSuccessfull = false;
    /** @property {number} m_dataSize - Volume data size in bytes */
    this.m_dataSize = 0;
    /** @property {array} m_dataArray - byte array for volume data */
    this.m_dataArray = null;
    /** @property {object} m_boxSize - vertex3f with physic volume dimension */
    this.m_boxSize = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
  }

  getBoxSize() {
    return this.m_boxSize;
  }

  /**
  * Read integer value from byte array
  * @param {array} bufBytes - Array with bytes
  * @param {number} buBOff - Offset to read starting from
  * @return {number} Integer number, bitwicely concatenated
  */
  static readInt(bufBytes, bufOff) {
    let iVal = 0;
    const BYTES_IN_INT = 4;
    const BITS_IN_BYTE = 8;
    const LAST_INDEX = 3;
    for (let i = 0; i < BYTES_IN_INT; i++) {
      const iShifted = iVal << BITS_IN_BYTE;
      iVal = iShifted + bufBytes[bufOff + LAST_INDEX - i];
    }
    return iVal;
  }

  static readFloat(buf, off) {
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

  readBuffer(arrBuf, callbackComplete, callbackProgress) {
    const bufBytes = new Uint8Array(arrBuf);
    let bufOff = 0;
    if (callbackProgress) {
      callbackProgress(0.0);
    }

    // read header
    // eslint-disable-next-line
    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;
    let isHeaderSignCorrect = true;
    for (let i = 0; i < lenHeaderSign; i++) {
      if (bufBytes[bufOff] !== arrayHeaderSign[i]) {
        isHeaderSignCorrect = false;
        break;
      }
      this.m_header.m_id += String.fromCharCode(bufBytes[bufOff]);
      bufOff += 1;
    }
    if (!isHeaderSignCorrect) {
      console.log('HEADER IS WRONG');
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }
    const SIZE_DWORD = 4;
    const ENDIANNESS_16 = 16;
    const ENDIAN_CONST = 0x04030201;
    // read endianess
    this.m_header.m_endianness = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    if (this.m_header.m_endianness !== ENDIAN_CONST) {
      const strFoundEndns = this.m_header.m_endianness.toString(ENDIANNESS_16);
      // eslint-disable-next-line
      console.log(`ENDIANNESS IS WRONG. Found = ${strFoundEndns} , but should be = ${ENDIAN_CONST.toString(16)}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.UNSUPPORTED_ENDIANNESS, null, 0, null);
      }
      return false;
    }

    // read
    this.m_header.m_glType = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_glTypeSize = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_glFormat = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;

    if (
      (this.m_header.m_glFormat !== KtxHeader.KTX_GL_RED) &&
      (this.m_header.m_glFormat !== KtxHeader.KTX_GL_RGB) &&
      (this.m_header.m_glFormat !== KtxHeader.KTX_GL_RGBA)) {
      console.log('KTX header.m_glFormat is WRONG');
      if (callbackComplete) {
        callbackComplete(LoadResult.UNSUPPORTED_COLOR_FORMAT, null, 0, null);
      }
      return false;
    }

    this.m_header.m_glInternalFormat = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_glBaseInternalFormat = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_pixelWidth = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_pixelHeight = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_pixelDepth = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_numberOfArrayElements = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_numberOfFaces = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_numberOfMipmapLevels = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_bytesOfKeyValueData = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;

    let bytesPerVoxel = 0;
    const SIZE_BYTE = 1;
    const SIZE_COLOR3 = 3;
    const SIZE_COLOR4 = 4;
    if (this.m_header.m_glFormat === KtxHeader.KTX_GL_RED) {
      bytesPerVoxel = SIZE_BYTE;
    } else if (this.m_header.m_glFormat === KtxHeader.KTX_GL_RGB) {
      bytesPerVoxel = SIZE_COLOR3;
    } else if (this.m_header.m_glFormat === KtxHeader.KTX_GL_RGBA) {
      bytesPerVoxel = SIZE_COLOR4;
    }

    // read user data
    if (this.m_header.m_bytesOfKeyValueData > 0) {
      let udataOff = bufOff;
      bufOff += this.m_header.m_bytesOfKeyValueData;

      let xMin, yMin, zMin, xMax, yMax, zMax;
      while (udataOff < bufOff) {
        // read pair len
        // const pairLen = KtxLoader.readInt(bufBytes, udataOff);
        udataOff += SIZE_DWORD;

        // read string until 0
        let str = '';
        let b;
        for (b = bufBytes[udataOff]; b !== 0; udataOff++) {
          b = bufBytes[udataOff];
          if (b !== 0) {
            str = str.concat(String.fromCharCode(b));
          }
        } // for
        console.log(`UDataString = ${str}`);
        // read vector
        if (str === 'fBoxMin') {
          xMin = KtxLoader.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          yMin = KtxLoader.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          zMin = KtxLoader.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          console.log(`vBoxMix = ${xMin} * ${yMin} * ${zMin}`);
        } else if (str === 'fBoxMax') {
          xMax = KtxLoader.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          yMax = KtxLoader.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          zMax = KtxLoader.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          this.m_boxSize.x = xMax - xMin;
          this.m_boxSize.y = yMax - yMin;
          this.m_boxSize.z = zMax - zMin;
          console.log(`vBox = ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
          break;
        }
      }

    }

    // read image data size
    this.m_dataSize = KtxLoader.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    const dataSizeCalculated =
      this.m_header.m_pixelWidth *
      this.m_header.m_pixelHeight *
      this.m_header.m_pixelDepth * bytesPerVoxel;
    if (this.m_dataSize !== dataSizeCalculated) {
      console.log('!!! TODO: not implemented yet');
      if (callbackComplete) {
        callbackComplete(LoadResult.WRONG_HEADER_DATA_SIZE, null, 0, null);
      }
      return false;
    }
    this.m_dataArray = new Uint8Array(this.m_dataSize);
    // get power of 2 for data size
    let pwr2;
    let pwrFinish = false;
    const MAX_POWER = 29;
    for (pwr2 = MAX_POWER; (pwr2 >= 0) && (!pwrFinish); pwr2--) {
      const val = 1 << pwr2;
      if (val < this.m_dataSize) {
        pwrFinish = true;
      }
    }
    pwr2++;
    // build mask for progress update
    const SOME_POWER_MIN = 3;
    pwr2 -= SOME_POWER_MIN;
    if (pwr2 <= 0) {
      pwr2 = 1;
    }
    const progressMask = (1 << pwr2) - 1;

    for (let i = 0; i < this.m_dataSize; i++) {
      this.m_dataArray[i] = bufBytes[bufOff];
      bufOff += 1;
      // progress update
      if (callbackProgress && ((i & progressMask) === 0) && (i > 0)) {
        const ratio = i / this.m_dataSize;
        callbackProgress(ratio);
      }
    }
    // update box, if not read
    if (this.m_boxSize.x === 0.0) {
      // Some artificial size: just proportional to pixels dimension
      const MM_PER_PIXEL = 0.3;
      this.m_boxSize.x = MM_PER_PIXEL * this.m_header.m_pixelWidth;
      this.m_boxSize.y = MM_PER_PIXEL * this.m_header.m_pixelHeight;
      this.m_boxSize.z = MM_PER_PIXEL * this.m_header.m_pixelDepth;
      console.log(`vBox = ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
    }

    if (NEED_CONTAST_DATA) {
      const xDim = this.m_header.m_pixelWidth;
      const yDim = this.m_header.m_pixelHeight;
      const zDim = this.m_header.m_pixelDepth;
      const numPixels = xDim * yDim * zDim;
      const pixelsDst = new Uint8Array(numPixels);
      const RAD = 3;
      const SIGMA = 1.6;
      const MULT = 48;
      const NEED_CONSOLE = true;
      VolumeTools.contrastEnchanceUnsharpMask(this.m_dataArray,
        xDim, yDim, zDim, pixelsDst, RAD, SIGMA, MULT, NEED_CONSOLE);
      for (let i = 0; i < numPixels; i++) {
        this.m_dataArray[i] = pixelsDst[i];
      }
    }

    this.m_isLoadedSuccessfull = true;
    if (callbackProgress) {
      callbackProgress(1.0);
    }
    if (callbackComplete) {
      callbackComplete(LoadResult.SUCCESS, this.m_header, this.m_dataSize, this.m_dataArray);
    }
    return true;
  }

  /**
  * Read file from URL
  * @param {object} callbackComplete - function, invoked after read binary file into byte array
  * @param {object} callbackProgress - function, invoked for loading progress indication
  * return {boolean} true, if read success
  */
  readFromURL(strUrl, callbackComplete, callbackProgress) {
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
    return true;
  }

  /**
  * Read from local file
  * @param {object} callbackComplete - function, invoked after read binary file into byte array
  * @param {object} callbackProgress - function, invoked for loading progress indication
  * return {boolean} true, if read success
  */
  readFromFile(file, callbackComplete, callbackProgress) {
    this.m_localFileLoader = new LocalFileLoader(file);
    this.m_localFileLoader.readFile((arrBuf) => {
      this.readBuffer(arrBuf, callbackComplete, callbackProgress);
      return true;
    });
    return true;
  }
}  // end class KtxLoader

