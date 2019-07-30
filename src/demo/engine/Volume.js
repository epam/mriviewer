/**
 * @fileOverview Volume
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

// import LoadResult from './LoadResult';
import LoaderKtx from './loaders/LoaderKtx';
import LoaderNifti from './loaders/LoaderNifti';
import LoaderDicom from './loaders/LoaderDicom';
import LoaderHdr from './loaders/LoaderHdr';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class Volume  some text later...
 */
class Volume extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_bytesPerVoxel = 0;
    this.m_dataArray = null;
    this.m_dataSize = 0;
    this.m_boxSize = {
      x: 0.0, y: 0.0, z: 0.0
    };
    this.m_patientName = '';
    this.m_patientBirth = '';
    this.m_seriesDescr = '';
    this.m_studyDescr = '';
    this.m_studyDate = '';
    this.m_seriesTime = '';
    this.m_bodyPartExamined = '';
    this.m_institutionName = '';
    this.m_operatorsName = '';
    this.m_physicansName = '';
  }
  createEmptyBytesVolume(xDim, yDim, zDim) {
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    const xyzDim = xDim * yDim * zDim;
    this.m_bytesPerVoxel = 1;
    this.m_dataArray = new Uint8Array(xyzDim);
    this.m_dataSize = xyzDim;
    this.m_boxSize = {
      x: xDim, y: yDim, z: zDim
    };
    for (let i = 0; i < xyzDim; i++) {
      this.m_dataArray[i] = 0;
    }
  }
  //
  // Make each volume texture size equal to 4 * N
  //
  makeDimensions4x() {
    if (this.m_zDim <= 1) {
      return;
    }
    const xDimNew = (this.m_xDim + 3) & (~3);
    const yDimNew = (this.m_yDim + 3) & (~3);
    const zDimNew = (this.m_zDim + 3) & (~3);
    if ((this.m_xDim === xDimNew) && (this.m_yDim === yDimNew) && (this.m_zDim === zDimNew)) {
      return; // do nothing
    } // if new size the same as current
    // perfom convert adding black pixels
    console.log(`Volume. makeDimensions4x. Convert into ${xDimNew}*${yDimNew}*${zDimNew}`);
    const xyzDimNew  = xDimNew * yDimNew * zDimNew;
    const bytesPerVoxel = this.m_bytesPerVoxel;
    const bufSizeBytes = xyzDimNew * bytesPerVoxel;
    const datArrayNew = new Uint8Array(xyzDimNew * bytesPerVoxel);
    let i;
    for (i = 0; i < bufSizeBytes; i++) {
      datArrayNew[i] = 0;
    }

    const ONE = 1;
    const FOUR = 4;
    const OFF_0 = 0; const OFF_1 = 1;
    const OFF_2 = 2; const OFF_3 = 3;

    console.log(`Volume info: xyzDim = ${this.m_xDim}*${this.m_yDim}*${this.m_zDim}`);
    console.log(`Volume info: bpp = ${this.m_bytesPerVoxel}`);
    console.log(`Volume info: dataSize = ${this.m_dataSize}`);

    const xyDim = this.m_xDim * this.m_yDim;
    if (this.m_bytesPerVoxel === ONE) {
      for (let z = 0; z < this.m_zDim; z++) {
        const zOff = z * xyDim;
        const zOffDst = z * xDimNew * yDimNew;
        for (let y = 0; y < this.m_yDim; y++) {
          const yOff = y * this.m_xDim;
          const yOffDst = y * xDimNew;
          for (let x = 0; x < this.m_xDim; x++) {
            const off = x + yOff + zOff;
            const val = this.m_dataArray[off];
            const offDst = x + yOffDst + zOffDst;
            datArrayNew[offDst] = val;
          } // for (x)
        } // for (y)
      } // for (z)
    } else if (this.m_bytesPerVoxel === FOUR) {
      for (let z = 0; z < this.m_zDim; z++) {
        const zOff = z * xyDim;
        const zOffDst = z * xDimNew * yDimNew;
        for (let y = 0; y < this.m_yDim; y++) {
          const yOff = y * this.m_xDim;
          const yOffDst = y * xDimNew;
          for (let x = 0; x < this.m_xDim; x++) {
            const off = (x + yOff + zOff) * FOUR;
            const val0 = this.m_dataArray[off + OFF_0];
            const val1 = this.m_dataArray[off + OFF_1];
            const val2 = this.m_dataArray[off + OFF_2];
            const val3 = this.m_dataArray[off + OFF_3];
            const offDst = (x + yOffDst + zOffDst) * FOUR;
            datArrayNew[offDst + OFF_0] = val0;
            datArrayNew[offDst + OFF_1] = val1;
            datArrayNew[offDst + OFF_2] = val2;
            datArrayNew[offDst + OFF_3] = val3;
          } // for (x)
        } // for (y)
      } // for (z)
    }

    this.m_xDim = xDimNew;
    this.m_yDim = yDimNew;
    this.m_zDim = zDimNew;
    this.m_dataArray = datArrayNew;
    this.m_dataSize = xyzDimNew;
  } // end
  //
  // Read from KTX format
  //
  readFromKtx(arrBuf, callbackProgress, callbackComplete) {
    const loader = new LoaderKtx();
    const ret = loader.readFromBuffer(this, arrBuf, callbackProgress, callbackComplete);
    return ret;
  } // end readFromKtx
  //
  // Read from KTX by URL
  //
  readFromKtxUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderKtx();
    loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
  }
  //
  // Read from NII by URL
  //
  readFromNiiUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderNifti();
    const ret = loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
  //
  // Read from Dicom by URL
  //
  readFromDicomUrl(strUrl, callbackProgress, callbackComplete) {
    const NUM_FILES = 0; // will be filled later
    const loader = new LoaderDicom(NUM_FILES);
    const ret = loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
  //
  // Read from Hdr by URL
  //
  readFromHdrUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderHdr();
    const ret = loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
  //
  // Read from local nifti
  //
  readFromNifti(arrBuf, callbackProgress, callbackComplete) {
    const loader = new LoaderNifti();
    const ret = loader.readFromBuffer(this, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  //
  // Read from local dicom
  //
  readFromDicom(loader, arrBuf, callbackProgress, callbackComplete) {
    /*
    // save dicomInfo to store
    const dcmInfo = loader.m_dicomInfo;
    const store = props;
    store.dispatch({ type: StoreActionType.SET_DICOM_INFO, dicomInfo: dcmInfo });
    */
    const indexFile = 0;
    const fileName = 'file???';
    const ratio = 0.0;

    const ret = loader.readFromBuffer(indexFile, fileName, ratio, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  readSingleSliceFromDicom(loader, indexFile, fileName, ratioLoaded, arrBuf, callbackProgress, callbackComplete) {
    const ret = loader.readFromBuffer(indexFile, fileName, ratioLoaded, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  // do nothing. But we need to implement render() to run Volume tests
  render() {
    return <p>></p>;
  }
} // end class Volume

export default Volume;