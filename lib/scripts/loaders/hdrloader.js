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
import HdrVolume from './hdrvolume';

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
    // HdrVolume for intensity
    this.m_volIntensity = null;
    // HdrVolume for roi
    this.m_volRoi = null;
  }
  getBoxSize() {
    if (this.m_volIntensity !== null) {
      return this.m_volIntensity.getBoxSize();
    } else if (this.m_volRoi !== null) {
      return this.m_volRoi.getBoxSize();
    }
    return null;
  }

  getDicomInfo() {
    if (this.m_volIntensity !== null) {
      return this.m_volIntensity.getDicomInfo();
    } else if (this.m_volRoi !== null) {
      return this.m_volRoi.getDicomInfo();
    }
    return null;
  }

  completeVolume(vol, callbackComplete) {
    // Finally invoke user callback after file was read
    const KTX_GL_RED = 0x1903;
    const KTX_UNSIGNED_BYTE = 0x1401;
    const header = {
      m_pixelWidth: vol.m_xDim,
      m_pixelHeight: vol.m_yDim,
      m_pixelDepth: vol.m_zDim,
      m_glType: KTX_UNSIGNED_BYTE,
      m_glTypeSize: 1,
      m_glFormat: KTX_GL_RED,
      m_glInternalFormat: KTX_GL_RED,
      m_glBaseInternalFormat: KTX_GL_RED,
    };
    if (callbackComplete) {
      let isRoiPalette = false;
      if (vol.getBytesPerPixel() === 1) {
        isRoiPalette = true;
      }
      const numPixels = vol.m_xDim * vol.m_yDim * vol.m_zDim;
      callbackComplete(LoadResult.SUCCESS, header, numPixels, vol.m_dataArray, isRoiPalette);
    } // if callbackComplete ready
  }

  completeVolume4(vol, callbackComplete) {
    // Finally invoke user callback after file was read
    const KTX_GL_RGBA = 0x1908;
    const KTX_UNSIGNED_BYTE = 0x1401;
    const header = {
      m_pixelWidth: vol.m_xDim,
      m_pixelHeight: vol.m_yDim,
      m_pixelDepth: vol.m_zDim,
      m_glType: KTX_UNSIGNED_BYTE,
      m_glTypeSize: 1,
      m_glFormat: KTX_GL_RGBA,
      m_glInternalFormat: KTX_GL_RGBA,
      m_glBaseInternalFormat: KTX_GL_RGBA,
    };
    if (callbackComplete) {
      const isRoiPalette = true;
      const numPixels = vol.m_xDim * vol.m_yDim * vol.m_zDim;
      callbackComplete(LoadResult.SUCCESS, header, numPixels, vol.m_dataArray, isRoiPalette);
    } // if callbackComplete ready
  }

  mixIntensityWithRoi(volInt, volRoi) {
    const HDR_DT_SIGNED_INT = 8;
    volInt.m_dataType = HDR_DT_SIGNED_INT;
    const numPixels = volInt.m_xDim * volInt.m_yDim * volInt.m_zDim;
    const BYTES_IN_RGBA = 4;
    const volNew = new Uint8Array(numPixels * BYTES_IN_RGBA);
    const OFF0 = 0; const OFF1 = 1;
    const OFF2 = 2; const OFF3 = 3;
    let j = 0;
    for (let i = 0; i < numPixels; i++, j += BYTES_IN_RGBA) {
      volNew[j + OFF0] = volInt.m_dataArray[i];
      volNew[j + OFF1] = 0;
      volNew[j + OFF2] = 0;
      volNew[j + OFF3] = volRoi.m_dataArray[i];
    }
    volInt.m_dataArray = volNew;
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
    const NUM_FILES_VOL_SINGLE = 2;
    const NUM_FILES_VOL_INT_ROI = 4;
    // read 2 files
    if (numFiles === NUM_FILES_VOL_SINGLE) {
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
      this.m_volIntensity = new HdrVolume(this.m_needScaleDownTexture);
      loaderHdr.readLocal(fileHdr).then((arrBufHdr) => {
        this.m_volIntensity.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        // this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${fileHdr.name}`);
        loaderImg.readLocal(fileImg).then((arrBufImg) => {
          this.m_volIntensity.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          // this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${fileImg.name}`);

          // perform complete
          this.completeVolume(this.m_volIntensity, callbackComplete);

        });
      }, (error) => {
        console.log('HDR File read error', error);
        return false;
      });
    } else if (numFiles === NUM_FILES_VOL_INT_ROI) {
      // read 4 files

      // console.log(`Load hdr names are: ${files[0].name}, ${files[1].name}, ${files[2].name}, ${files[3].name}`);

      // convert to lower case
      const fileNames = new Array(NUM_FILES_VOL_INT_ROI);
      fileNames[0] = files[0].name.toLowerCase();
      fileNames[1] = files[1].name.toLowerCase();
      fileNames[2] = files[2].name.toLowerCase();
      fileNames[3] = files[3].name.toLowerCase();

      // detect correct file names template
      //
      // expect XXX_intn.hdr
      // expect XXX_intn.img
      // expect XXX_mask.hdr
      // expect XXX_mask.img
      //
      const STR_SUFFIX_INT_HDR = '_intn.hdr';
      const STR_SUFFIX_INT_IMG = '_intn.img';
      const STR_SUFFIX_ROI_HDR = '_mask.hdr';
      const STR_SUFFIX_ROI_IMG = '_mask.img';

      let indexIntHdr = -1;
      let indexIntImg = -1;
      let indexRoiHdr = -1;
      let indexRoiImg = -1;
      let i;
      for (i = 0; i < NUM_FILES_VOL_INT_ROI; i++) {
        if (fileNames[i].endsWith(STR_SUFFIX_INT_HDR)) {
          indexIntHdr = i;
        }
        if (fileNames[i].endsWith(STR_SUFFIX_INT_IMG)) {
          indexIntImg = i;
        }
        if (fileNames[i].endsWith(STR_SUFFIX_ROI_HDR)) {
          indexRoiHdr = i;
        }
        if (fileNames[i].endsWith(STR_SUFFIX_ROI_IMG)) {
          indexRoiImg = i;
        }
      } // for
      if ((indexIntHdr === -1) || (indexIntImg === -1) ||
        (indexRoiHdr === -1) || (indexRoiImg === -1)) {
        console.log('Read 4 files. Error. Expect xxx_intn.hdr, xxx_intn.img, xxx_mask.hdr, xxx_mask.img');
        return false;
      }


      const fileHdrInt = files[indexIntHdr];
      const fileImgInt = files[indexIntImg];
      const fileHdrRoi = files[indexRoiHdr];
      const fileImgRoi = files[indexRoiImg];

      const loaderHdrInt = new LoadFilePromise();
      const loaderImgInt = new LoadFilePromise();

      const loaderHdrRoi = new LoadFilePromise();
      const loaderImgRoi = new LoadFilePromise();

      this.m_volIntensity = new HdrVolume(this.m_needScaleDownTexture);
      this.m_volRoi = new HdrVolume(this.m_needScaleDownTexture);

      loaderHdrInt.readLocal(fileHdrInt).then((arrBufHdr) => {
        this.m_volIntensity.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        // this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${fileHdrInt.name}`);
        loaderImgInt.readLocal(fileImgInt).then((arrBufImg) => {
          this.m_volIntensity.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          // this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${fileImgInt.name}`);

          loaderHdrRoi.readLocal(fileHdrRoi).then((arrBufferHdr) => {
            this.m_volRoi.readBufferHead(arrBufferHdr, callbackComplete, callbackProgress);
            loaderImgRoi.readLocal(fileImgRoi).then((arrBufferImg) => {
              this.m_volRoi.readBufferImg(arrBufferImg, callbackComplete, callbackProgress);

              // mix intensity + roi
              this.mixIntensityWithRoi(this.m_volIntensity, this.m_volRoi);

              // complete volume
              this.completeVolume4(this.m_volIntensity, callbackComplete);
            }); // loaderImgRoi
          }); // loaderHdrRoi

        }); // loaderImgInt
      }, (error) => {
        console.log('HDR File read error', error);
        return false;
      }); // loaderHdrInt
    } else {
      console.log(`Error read hdr files. Should be ${NUM_FILES_VOL_SINGLE} or ${NUM_FILES_VOL_INT_ROI} files`);
      return false;
    } // if number of files equal to 2
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

      this.m_volIntensity = new HdrVolume(this.m_needScaleDownTexture);

      loaderHdr.readFromUrl(urlHdr).then((arrBufHdr) => {
        this.m_volIntensity.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        // this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${urlHdr}`);
        loaderImg.readFromUrl(urlImg).then((arrBufImg) => {
          this.m_volIntensity.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          // this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${urlImg}`);

          // perform complete
          this.completeVolume(this.m_volIntensity, callbackComplete);

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

      this.m_volIntensity = new HdrVolume(this.m_needScaleDownTexture);
      this.m_volRoi = new HdrVolume(this.m_needScaleDownTexture);
      loaderHdrInt.readFromUrl(urlHdrInt).then((arrBufHdr) => {
        this.m_volIntensity.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        // this.readBufferHead(arrBufHdr, callbackComplete, callbackProgress);
        console.log(`Load success HDR file: ${urlHdrInt}`);
        loaderImgInt.readFromUrl(urlImgInt).then((arrBufImg) => {
          this.m_volIntensity.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          // this.readBufferImg(arrBufImg, callbackComplete, callbackProgress);
          console.log(`Load success IMG file: ${urlImgInt}`);

          loaderHdrRoi.readFromUrl(urlHdrRoi).then((arrBufferHdr) => {
            this.m_volRoi.readBufferHead(arrBufferHdr, callbackComplete, callbackProgress);
            loaderImgRoi.readFromUrl(urlImgRoi).then((arrBufferImg) => {
              this.m_volRoi.readBufferImg(arrBufferImg, callbackComplete, callbackProgress);

              // mix intensity + roi
              this.mixIntensityWithRoi(this.m_volIntensity, this.m_volRoi);

              // complete volume
              this.completeVolume4(this.m_volIntensity, callbackComplete);
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
  } // readFromFile
}
