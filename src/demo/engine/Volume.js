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
  readFromDicom(arrBuf, callbackProgress, callbackComplete) {
    const loader = new LoaderDicom();
    const ret = loader.readFromBuffer(this, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  readSingleSliceFromDicom(arrBuf, callbackProgress, callbackComplete) {
    const loader = new LoaderDicom();
    const ret = loader.readFromBuffer(this, arrBuf, callbackProgress, callbackComplete);
    return ret;
  }
  // do nothing. But we need to implement render() to run Volume tests
  render() {
    return <p>></p>;
  }
} // end class Volume

export default Volume;