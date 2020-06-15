/**
 * @fileOverview LoaderKtx
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import LoadResult from '../LoadResult';
import FileLoader from './FileLoader';

// ********************************************************
// Const
// ********************************************************

export const KtxHeader = {
  KTX_GL_RED: 0x1903,
  KTX_GL_RGB: 0x1907,
  KTX_GL_RGBA: 0x1908,
  KTX_GL_R8_EXT: 0x8229,
  KTX_GL_RGB8_OES: 0x8051,
  KTX_GL_RGBA8_OES: 0x8058,
};

// ********************************************************
// Class
// ********************************************************

/**
 * Class LoaderKtx some text later...
 */
export default class LoaderKtx {
  /**
   * @param {object} props - props from up level object
   */
  constructor() {
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
    this.m_boxSize = {
      x: 0.0,
      y: 0.0,
      z: 0.0
    };
  } // constructor
  //
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
  //
  static readFloat(buf, off) {
    const BYTES_IN_FLOAT = 4;
    const arBuf = new ArrayBuffer(BYTES_IN_FLOAT);
    const dataArray = new DataView(arBuf);
    const OFF_0 = 0; const OFF_1 = 1;
    const OFF_2 = 2; const OFF_3 = 3;
    dataArray.setUint8(OFF_0, buf[off + OFF_0]);
    dataArray.setUint8(OFF_1, buf[off + OFF_1]);
    dataArray.setUint8(OFF_2, buf[off + OFF_2]);
    dataArray.setUint8(OFF_3, buf[off + OFF_3]);
    const IS_LITTLE_ENDIAN = true;
    const res = dataArray.getFloat32(0, IS_LITTLE_ENDIAN);
    return res;
  } // readFloat
  //
  //
  //
  readFromBuffer(volDst, arrBuf, callbackProgress, callbackComplete) {
    // prepare KTX header
    const bufBytes = new Uint8Array(arrBuf);
    let bufOff = 0;
    if (callbackProgress !== undefined) {
      callbackProgress(0.0);
    }
    if (bufBytes.length === 0) {
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.BAD_HEADER);
      }
      return LoadResult.BAD_HEADER;
    }

    // console.log(`readFromKtx. len = ${bufBytes.length}`);
    // console.log(`readFromKtx. data = ${bufBytes}`);

    // read header
    const arrayHeaderSign = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const lenHeaderSign = arrayHeaderSign.length;
    let isHeaderSignCorrect = true;
    let i;
    // for (i = 0; i < lenHeaderSign; i++) {
    //   console.log(`${bufBytes[i]}`);
    // }
    for (i = 0; i < lenHeaderSign; i++) {
      if (bufBytes[bufOff] !== arrayHeaderSign[i]) {
        isHeaderSignCorrect = false;
        break;
      }
      this.m_header.m_id += String.fromCharCode(bufBytes[bufOff]);
      bufOff += 1;
    }
    if (!isHeaderSignCorrect) {
      console.log('KTX HEADER IS WRONG');
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.BAD_HEADER);
      }
      return LoadResult.BAD_HEADER;
    }
    const SIZE_DWORD = 4;
    const ENDIANNESS_16 = 16;
    const ENDIAN_CONST = 0x04030201;
    // read endianess
    this.m_header.m_endianness = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    if (this.m_header.m_endianness !== ENDIAN_CONST) {
      const strFoundEndns = this.m_header.m_endianness.toString(ENDIANNESS_16);
      // eslint-disable-next-line
      console.log(`ENDIANNESS IS WRONG. Found = ${strFoundEndns} , but should be = ${ENDIAN_CONST.toString(16)}`);
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.UNSUPPORTED_ENDIANNESS);
      }
      return LoadResult.UNSUPPORTED_ENDIANNESS;
    }

    // read
    this.m_header.m_glType = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_glTypeSize = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_glFormat = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;

    if (
      (this.m_header.m_glFormat !== KtxHeader.KTX_GL_RED) &&
      (this.m_header.m_glFormat !== KtxHeader.KTX_GL_RGB) &&
      (this.m_header.m_glFormat !== KtxHeader.KTX_GL_RGBA)) {
      console.log('KTX header.m_glFormat is WRONG');
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.UNSUPPORTED_COLOR_FORMAT);
      }
      return LoadResult.UNSUPPORTED_COLOR_FORMAT;
    }
    this.m_header.m_glInternalFormat = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_glBaseInternalFormat = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_pixelWidth = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_pixelHeight = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_pixelDepth = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;

    // save to result volume
    volDst.m_xDim = this.m_header.m_pixelWidth;
    volDst.m_yDim = this.m_header.m_pixelHeight;
    volDst.m_zDim = this.m_header.m_pixelDepth;

    // check dim
    const head = this.m_header;
    // console.log(`check dim: ${head.m_pixelWidth} * ${head.m_pixelHeight} * ${head.m_pixelDepth}`);
    const MIN_DIM = 4;
    const MAX_DIM = (1024 * 8);
    if ((head.m_pixelWidth < MIN_DIM) || (head.m_pixelHeight < MIN_DIM) 
      || (head.m_pixelDepth < MIN_DIM)) {
      console.log(`KTX dims too small: ${head.m_pixelWidth} * ${head.m_pixelHeight} * ${head.m_pixelDepth}`);
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.WRONG_IMAGE_DIM_X);
      }
      return LoadResult.WRONG_IMAGE_DIM_X;
    }
    if ((head.m_pixelWidth > MAX_DIM) || (head.m_pixelHeight > MAX_DIM) 
      || (head.m_pixelDepth > MAX_DIM)) {
      console.log(`KTX dims too large: ${head.m_pixelWidth} * ${head.m_pixelHeight} * ${head.m_pixelDepth}`);
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.WRONG_IMAGE_DIM_X);
      }
      return LoadResult.WRONG_IMAGE_DIM_X;
    }

    this.m_header.m_numberOfArrayElements = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_numberOfFaces = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_numberOfMipmapLevels = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    this.m_header.m_bytesOfKeyValueData = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;

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
          xMin = LoaderKtx.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          yMin = LoaderKtx.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          zMin = LoaderKtx.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          console.log(`vBoxMix = ${xMin} * ${yMin} * ${zMin}`);
        } else if (str === 'fBoxMax') {
          xMax = LoaderKtx.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          yMax = LoaderKtx.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          zMax = LoaderKtx.readFloat(bufBytes, udataOff); udataOff += SIZE_DWORD;
          this.m_boxSize.x = xMax - xMin;
          this.m_boxSize.y = yMax - yMin;
          this.m_boxSize.z = zMax - zMin;
          console.log(`vBox = ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
          break;
        } // if fbox max
      } // while udata not ended
    } // if have key data
    // read image data size
    this.m_dataSize = LoaderKtx.readInt(bufBytes, bufOff); bufOff += SIZE_DWORD;
    const dataSizeCalculated =
      this.m_header.m_pixelWidth *
      this.m_header.m_pixelHeight *
      this.m_header.m_pixelDepth * bytesPerVoxel;
    if (this.m_dataSize !== dataSizeCalculated) {
      console.log('!!! not implemented yet');
      if (callbackComplete !== undefined) {
        callbackComplete(LoadResult.WRONG_HEADER_DATA_SIZE);
      }
      return LoadResult.WRONG_HEADER_DATA_SIZE;
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
      if ((callbackProgress !== undefined) && ((i & progressMask) === 0) && (i > 0)) {
        const ratio = i / this.m_dataSize;
        callbackProgress(ratio);
      }
    }
    // update box, if not read
    if (this.m_boxSize.x === 0.0) {
      // Some artificial size: just proportional to pixels dimension
      const MM_PER_PIXEL = 0.3;
      this.m_boxSize.x = MM_PER_PIXEL * this.m_header.m_pixelWidth;
      this.m_boxSize.x = MM_PER_PIXEL * this.m_header.m_pixelWidth;
      this.m_boxSize.y = MM_PER_PIXEL * this.m_header.m_pixelHeight;
      this.m_boxSize.z = MM_PER_PIXEL * this.m_header.m_pixelDepth;
      console.log(`vBox = ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);
    }

    volDst.m_bytesPerVoxel = bytesPerVoxel;
    volDst.m_dataArray = this.m_dataArray;
    volDst.m_dataSize = this.m_dataSize;
    volDst.m_boxSize = this.m_boxSize;
    console.log(`KTX Loaded successfully with dim = ${volDst.m_xDim}*${volDst.m_yDim}*${volDst.m_zDim}. bpp=${volDst.m_bytesPerVoxel}`);

    this.m_isLoadedSuccessfull = true;
    if (callbackProgress !== undefined) {
      callbackProgress(1.0);
    }
    if (callbackComplete !== undefined) {
      callbackComplete(LoadResult.SUCCESS);
    }
    return LoadResult.SUCCESS;
  } // end readFromBuffer
  /**
  *
  * Read Ktx file from URL
  * @param {object} volDst volume to read
  * @param {string} strUrl from where
  * @param {Function} callbackProgress invoke during loading
  * @param {Function} callbackComplete invoke at the end with final success code
  */
  readFromUrl(volDst, strUrl, callbackProgress, callbackComplete) {
    console.log(`LoadedKtx. staring read ${strUrl}`);
    this.m_fileLoader = new FileLoader(strUrl);
    this.m_fileLoader.readFile((arrBuf) => {
      this.readFromBuffer(volDst, arrBuf, callbackProgress, callbackComplete);
      return;
    }, (errMsg) => {
      console.log(`LoaderKtx. Error read file: ${errMsg}`);
      callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
      return;
    });
  } // end of readFromUrl
} // end class
