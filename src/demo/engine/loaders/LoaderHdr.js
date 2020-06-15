/**
 * @fileOverview LoaderHdr
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import LoadResult from '../LoadResult';
import FileTools from './FileTools';
import LoadFilePromise from './LoadPromise';
import Volume from '../Volume';
import VolumeSet from '../VolumeSet';


// ********************************************************
// Const
// ********************************************************

// const NEED_EVEN_TEXTURE_SIZE = false;

const HDR_DT_NONE = 0;
const HDR_DT_UNSIGNED_CHAR = 2;
const HDR_DT_SIGNED_SHORT = 4;

// ********************************************************
// Class
// ********************************************************

/**
 * Class LoaderHdr some text later...
 */
class LoaderHdr {
  static readByteFromBuffer(buf, off) {
    return buf[off];
  }
  /**
  * Read 32 bit integer from input buffer
  * @param {object} buf - source buffer
  * @param {number} off - offset in buffer
  * @return 32 bit integer number
  */
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
  /**
  * Read 16 bit short integer from input buffer
  * @param {object} buf - source buffer
  * @param {number} off - offset in buffer
  * @return 16 bit short integer number
  */
  static readShortFromBuffer(buf, off) {
    // eslint-disable-next-line
    const res = ((buf[off + 0]) | (buf[off + 1] << 8));
    return res;
  }
  /**
  * Read 32 bit float from input buffer
  * @param {object} buf - source buffer
  * @param {number} off - offset in buffer
  * @return 32 bit float number
  */
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
  * Convert DataView object into string
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
  //
  // read header file
  //
  readFromBufferHeader(volumeDst, arrBuf, callbackProgress, callbackComplete) {
    // check arguments
    console.assert(volumeDst != null, "Null volume");
    console.assert(volumeDst instanceof Volume, "Should be volume");
    console.assert(arrBuf != null, "Null array");
    console.assert(arrBuf.constructor.name === "ArrayBuffer", "Should be ArrayBuf in arrBuf");

    const bufBytes = new Uint8Array(arrBuf);
    const bufLen = bufBytes.length;
    const HDR_HEADER_SIZE = 348;
    // console.log(`Header buf size === ${bufLen}`);
    if (bufLen !== HDR_HEADER_SIZE) {
      if (callbackComplete) {
        callbackComplete(LoadResult.WRONG_HEADER_DATA_SIZE, null, 0, null);
      }
      return false;
    }

    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;
    const SIZE_BYTE = 1;

    let bufOff = 0;
    // read sizeof header
    const sizeofHdr = LoaderHdr.readIntFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    if (sizeofHdr !== HDR_HEADER_SIZE) {
      console.log(`Hdr first int wrong: ${sizeofHdr}, but should be ${HDR_HEADER_SIZE}`);
      if (callbackComplete) {
        callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      }
      return false;
    }
    const ONE = 1;
    const TWO = 2;

    // read dataType char[10]
    const DATA_TYPE_LEN = 10;
    const strDataType = LoaderHdr.getStringAt(bufBytes, bufOff, DATA_TYPE_LEN);
    bufOff += DATA_TYPE_LEN;
    volumeDst.m_dataType = HDR_DT_NONE;
    if (strDataType === 'CHAR') {
      volumeDst.m_dataType = HDR_DT_UNSIGNED_CHAR;
      volumeDst.m_bytesPerVoxel = ONE;
    }
    if (strDataType === 'SHORT') {
      volumeDst.m_dataType = HDR_DT_SIGNED_SHORT;
      volumeDst.m_bytesPerVoxel = TWO;
    }
    if (volumeDst.m_dataType === HDR_DT_NONE) {
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
    const iExtents = LoaderHdr.readIntFromBuffer(bufBytes, bufOff);
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
    const iRegular = LoaderHdr.readByteFromBuffer(bufBytes, bufOff);
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
    const dim1 = LoaderHdr.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim2 = LoaderHdr.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    const dim3 = LoaderHdr.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;

    volumeDst.m_xDim = dim1;
    volumeDst.m_yDim = dim2;
    volumeDst.m_zDim = dim3;
    console.log(`HDR: volume dim = ${volumeDst.m_xDim} * ${volumeDst.m_yDim} * ${volumeDst.m_zDim} `);

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
    const dataTypeH = LoaderHdr.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    if (volumeDst.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      if (dataTypeH !== HDR_DT_UNSIGNED_CHAR) {
        console.log('Wrong data tye for char typed header');
        return false;
      }
    }
    if (volumeDst.m_dataType === HDR_DT_SIGNED_SHORT) {
      if (dataTypeH !== HDR_DT_SIGNED_SHORT) {
        console.log('Wrong data tye for signed short typed header');
        return false;
      }
    }

    // read bitPix
    const BITS_IN_CHAR = 8;
    const BITS_IN_WORD = 16;

    const bitPixH = LoaderHdr.readShortFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_SHORT;
    if (volumeDst.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      if (bitPixH !== BITS_IN_CHAR) {
        console.log('Wrong bits pix for char typed header');
        return false;
      }
    }
    if (volumeDst.m_dataType === HDR_DT_SIGNED_SHORT) {
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
    const pixDim1 = LoaderHdr.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim2 = LoaderHdr.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;
    const pixDim3 = LoaderHdr.readFloatFromBuffer(bufBytes, bufOff);
    bufOff += SIZE_DWORD;

    // read rest of pixDim
    const NUM_REST_PIX_DIM = 4;
    bufOff += SIZE_DWORD * NUM_REST_PIX_DIM;

    volumeDst.m_boxSize.x = volumeDst.m_xDim * pixDim1;
    volumeDst.m_boxSize.y = volumeDst.m_yDim * pixDim2;
    volumeDst.m_boxSize.z = volumeDst.m_zDim * pixDim3;
    console.log(`HDR: physic size = ${volumeDst.m_boxSize.x} * ${volumeDst.m_boxSize.y} * ${volumeDst.m_boxSize.z} `);

    return true;
  }
  //
  // read image file
  //
  readFromBufferImage(volumeDst, arrBuf, callbackProgress, callbackComplete) {
    // check arguments
    console.assert(volumeDst != null, "Null volume");
    console.assert(volumeDst instanceof Volume, "Should be volume");
    console.assert(arrBuf != null, "Null array");
    console.assert(arrBuf.constructor.name === "ArrayBuffer", "Should be ArrayBuf in arrBuf");

    const bufBytes = new Uint8Array(arrBuf);
    const bufLen = bufBytes.length;
    const MIN_BUF_SIZE = 8;
    const MAX_BUF_SIZE = (1024 * 1024 * 230);
    if (bufLen < MIN_BUF_SIZE) {
      if (callbackComplete) {
        callbackComplete(LoadResult.ERROR_TOO_SMALL_DATA_SIZE , null, 0, null);
      }
      return false;
    }
    if (bufLen >= MAX_BUF_SIZE) {
      if (callbackComplete) {
        callbackComplete(LoadResult.ERROR_TOO_LARGE_DATA_SIZE , null, 0, null);
      }
      return false;
    }
    volumeDst.m_imageBufferSize = bufLen;
    volumeDst.m_arrBuf = arrBuf;
    console.log(`readFromBufferImage complete with ${bufLen} bytes in image `);
    return true;
  } // end readFromBufferImage
  //
  // create volume from 2 components
  //
  createVolumeFromHeaderAndImage(volDst) {
    // check arguments
    console.assert(volDst != null, "Null volume");
    console.assert(volDst instanceof Volume, "Should be volume");
  
    const NUM_BYTES_CHAR = 1;
    const NUM_BYTES_WORD = 2;

    let bytesPerPixel = 0;
    if (volDst.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      bytesPerPixel = NUM_BYTES_CHAR;
    }
    if (volDst.m_dataType === HDR_DT_SIGNED_SHORT) {
      bytesPerPixel = NUM_BYTES_WORD;
    }
    const numPixels = volDst.m_xDim * volDst.m_yDim * volDst.m_zDim;
    const estimatedVolSize = numPixels * bytesPerPixel;
    if (estimatedVolSize !== volDst.m_imageBufferSize) {
      console.log(`HDR: wrong IMG data size. Read: ${volDst.m_imageBufferSize}, but expected ${estimatedVolSize} `);
      return false;
    }
    const arrBuf = volDst.m_arrBuf;
    if (volDst.m_dataType === HDR_DT_SIGNED_SHORT) {
      const dataArray16 = new Uint16Array(arrBuf);
      volDst.m_dataArray = new Uint8Array(numPixels);
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
        volDst.m_dataArray[i] = Math.floor(MAX_COLOR_BYTE * dataArray16[i] / valMax);
      }
    } else if (volDst.m_dataType === HDR_DT_UNSIGNED_CHAR) {
      // Read color indices info: usually this is 1 bpp data
      const bufBytes = new Uint8Array(arrBuf);
      volDst.m_dataArray = bufBytes;
    }

    // save to result volume
    const ONE = 1;
    volDst.m_bytesPerVoxel = ONE;
    volDst.m_dataSize = volDst.m_imageBufferSize;
    return true;
  }
  //
  // create vol from 2 volumes: intensity and hdr
  //
  createRoiVolumeFromHeaderAndImage(volDst, volRoi) {
    // check arguments
    console.assert(volDst != null, "Null volume");
    console.assert(volDst instanceof Volume, "Should be volume");
    console.assert(volRoi != null, "Null volume");
    console.assert(volRoi instanceof Volume, "Should be volume");

    // both volumes are in 1 byte format
    const ONE = 1;
    if (volDst.m_bytesPerVoxel !== ONE) {
      console.log('createRoiVolumeFromHeaderAndImage: bad volDst. m_bytesPerVoxel should be 1');
      return false;
    }
    if (volRoi.m_bytesPerVoxel !== ONE) {
      console.log('createRoiVolumeFromHeaderAndImage: bad volRoi');
      return false;
    }
    // compare size
    if ((volDst.m_xDim !== volRoi.m_xDim) || (volDst.m_yDim !== volRoi.m_yDim) || (volDst.m_zDim !== volRoi.m_zDim)) {
      console.log('createRoiVolumeFromHeaderAndImage: different volumes sizes');
      return false;
    }
    const numPixels = volDst.m_xDim * volDst.m_yDim * volDst.m_zDim;
    const BYTES_IN_RGBA = 4;
    const dataNew = new Uint8Array(numPixels * BYTES_IN_RGBA);

    const arrBuf = volRoi.m_arrBuf;
    const dataArrayRoi8 = new Uint8Array(arrBuf);

    const OFF0 = 0; const OFF1 = 1;
    const OFF2 = 2; const OFF3 = 3;
    let j = 0;
    for (let i = 0; i < numPixels; i++, j += BYTES_IN_RGBA) {
      dataNew[j + OFF0] = volDst.m_dataArray[i];
      dataNew[j + OFF1] = 0;
      dataNew[j + OFF2] = 0;
      dataNew[j + OFF3] = dataArrayRoi8[i];
    }
    volDst.m_dataArray = dataNew;
    const FOUR = 4;
    volDst.m_bytesPerVoxel = FOUR;
    console.log('createRoiVolumeFromHeaderAndImage: success');
    return true;
  } //
  /**
   * Read hdr (h + img) files from URL
   * 
   * @param {object} volSet - volume set
   * @param {string} strUrl - url string
   * @param {func} callbackProgress - callback during read progress
   * @param {func} callbackComplete - callback after complete (good or bad)
   * @return true, if success
   */
  readFromUrl(volSet, strUrl, callbackProgress, callbackComplete) {
    console.log(`readFromUrl. going to read from ${strUrl} ...`);

    const ft = new FileTools();
    const isValidUrl = ft.isValidUrl(strUrl);
    if (!isValidUrl) {
      console.log(`readFromUrl: not vaild URL = = ${strUrl} `);
      return false;
    }
    this.m_folder = ft.getFolderNameFromUrl(strUrl);
    const fileName = ft.getFileNameFromUrl(strUrl);
    // console.log(`readFromUrl: folder =  ${this.m_folder} filename = ${fileName}`);

    const regExp = /(\w+)_intn.(h|hdr)/;
    const arrGrp = regExp.exec(fileName);
    if (arrGrp.length !== 3) {
      console.log(`LoaderHdr.readFromUrl: bad URL name = ${strUrl}. Should be in template NNN_intn.h `);
      return false;
    }
    const namePrefix = arrGrp[1];
    //console.log(`readFromUrl: name prefix = ${namePrefix}, grpLen = ${arrGrp.length}`);

    const fileNameIntensityHeader = this.m_folder + '/' + namePrefix + '_intn.h';
    const fileNameIntensityImage = this.m_folder + '/' + namePrefix + '_intn.img';
    const fileNameMaskHeader = this.m_folder + '/' + namePrefix + '_mask.h';
    const fileNameMaskImage = this.m_folder + '/' + namePrefix + '_mask.img';


    const arrUrls = [];
    arrUrls.push(fileNameIntensityHeader);
    arrUrls.push(fileNameIntensityImage);
    arrUrls.push(fileNameMaskHeader);
    arrUrls.push(fileNameMaskImage);
    const ok = this.readFromUrls(arrUrls, volSet, callbackProgress, callbackComplete);

    return ok;
  } // end of readFromUrl
  /**
   * 
   * @param {object} arrUrls  - array of strings urls
   * @param {*} volSet  - dest volume set
   * @param {*} callbackProgress - callback during read
   * @param {*} callbackComplete - callback after end fo read
   */
  readFromUrls(arrUrls, volSet, callbackProgress, callbackComplete) {

    // check arguments
    console.assert(volSet != null, "Null volume set");
    console.assert(volSet instanceof VolumeSet, "Should be volume set");
    

    const numUrls = arrUrls.length;
    const NUM_URLS_IN_SET = 2;
    const NUM_FILES_VOL_INT_ROI = 4;
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

      // this.m_volIntensity = new HdrVolume(this.m_needScaleDownTexture);

      const volDst = volSet.getVolume(0);
      loaderHdr.readFromUrl(urlHdr).then((arrBufHdr) => {
        this.readFromBufferHeader(volDst, arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${urlHdr}`);
        loaderImg.readFromUrl(urlImg).then((arrBufImg) => {
          this.readFromBufferImage(volDst, arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${urlImg}`);

          // complete 2 images
          this.createVolumeFromHeaderAndImage(volDst);

          // invoke callback for good loading end
          callbackComplete(LoadResult.SUCCESS);

        });
      }, (error) => {
        console.log('HDR File read error', error);
        callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
        return false;
      });
    } else if (numUrls === NUM_FILES_VOL_INT_ROI) {
      // read 4 files
      const urlHdrInt = arrUrls[0];
      const urlImgInt = arrUrls[1];
      const urlHdrRoi = arrUrls[2];
      const urlImgRoi = arrUrls[3];

      const loaderHdrInt = new LoadFilePromise();
      const loaderImgInt = new LoadFilePromise();
      const loaderHdrRoi = new LoadFilePromise();
      const loaderImgRoi = new LoadFilePromise();

      // this.m_volIntensity = new HdrVolume(this.m_needScaleDownTexture);
      // this.m_volRoi = new HdrVolume(this.m_needScaleDownTexture);

      const volRoi = new Volume();
      const volDst = volSet.getVolume(0);

      loaderHdrInt.readFromUrl(urlHdrInt).then((arrBufHdr) => {
        // this.m_volIntensity.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        // this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        this.readFromBufferHeader(volDst, arrBufHdr, callbackComplete, callbackProgress);

        console.log(`Load success HDR file: ${urlHdrInt}`);
        loaderImgInt.readFromUrl(urlImgInt).then((arrBufImg) => {
          // this.m_volIntensity.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          // this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          this.readFromBufferImage(volDst, arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${urlImgInt}`);

          loaderHdrRoi.readFromUrl(urlHdrRoi).then((arrBufferHdr) => {
            //this.m_volRoi.readBufferHead(arrBufferHdr, callbackComplete, callbackProgress);
            this.readFromBufferHeader(volRoi, arrBufferHdr, callbackComplete, callbackProgress);

            loaderImgRoi.readFromUrl(urlImgRoi).then((arrBufferImg) => {

              // this.m_volRoi.readBufferImg(arrBufferImg, callbackComplete, callbackProgress);
              this.readFromBufferImage(volRoi, arrBufferImg, callbackComplete, callbackProgress);

              // transform intensity data from 16 bpp -> 8 bpp
              this.createVolumeFromHeaderAndImage(volDst);

              // mix intensity + roi
              this.createRoiVolumeFromHeaderAndImage(volDst, volRoi);

              // invoke callback for good loading end
              callbackComplete(LoadResult.SUCCESS);

            }); // loaderImgRoi
          }); // loaderHdrRoi

        }); // loaderImgInt
      }, (error) => {
        console.log('HDR File read error', error);
        return false;
      }); // loaderHdrInt

    } else {
      console.log(`Error read hdr files. Should be ${NUM_URLS_IN_SET} files`);
      return false;
    }// if number of files equal to 2
    return true;
  } // end of readFromUrls
} // end class LoaderHdr

export default LoaderHdr;
