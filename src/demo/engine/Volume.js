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

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class Volume  some text later...
 */
export default class Volume extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_bytesPerVoxel = 0;
    this.m_boxSize = {
      x: 0.0, y: 0.0, z: 0.0
    };
  }
  //
  // Read from KTX format
  readFromKtx(arrBuf, callbackProgress, callbackComplete) {
    const loader = new LoaderKtx();
    const ret = loader.readFromBuffer(this, arrBuf, callbackProgress, callbackComplete);
    return ret;
  } // end readFromKtx
  // Read from KTX by URL
  readFromKtxUrl(strUrl, callbackProgress, callbackComplete) {
    const loader = new LoaderKtx();
    const ret = loader.readFromUrl(this, strUrl, callbackProgress, callbackComplete);
    return ret;
  }
} // end class Volume

