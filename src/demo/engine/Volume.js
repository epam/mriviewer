/**
 * @fileOverview Volume
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

//import LoaderKtx from './loaders/LoaderKtx';
//import LoaderNifti from './loaders/LoaderNifti';
//import LoaderDicom from './loaders/LoaderDicom';
//import LoaderHdr from './loaders/LoaderHdr';

// ********************************************************
// Const
// ********************************************************

export const VOLUME_ICON_SIDE = 64;

// ********************************************************
// Class
// ********************************************************

/**
 * Class Volume  
 * 
 * Result volume, loaded from Dicom, Ktx, Nifti, ... files
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
    // icon to show
    this.m_xIcon = 0;
    this.m_yIcon = 0;
    this.m_dataIcon = null;
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
  // Create icon for volume
  createIcon() {
    console.assert(this.m_xDim > 0);
    console.assert(this.m_yDim > 0);
    console.assert(this.m_zDim > 0);
    console.assert(this.m_dataArray !== null);
    const sizeSrcMax = (this.m_xDim > this.m_yDim) ? this.m_xDim : this.m_yDim;
    const scale = sizeSrcMax / VOLUME_ICON_SIDE;

    // central slice
    const zCenter = Math.floor(this.m_zDim / 2);
    const zOff = zCenter * this.m_xDim * this.m_yDim;

    this.m_xIcon = VOLUME_ICON_SIDE;
    this.m_yIcon = this.m_xIcon;
    const numPixelsIcon = this.m_xIcon * this.m_yIcon;
    this.m_dataIcon = new Uint8Array(numPixelsIcon);
    for (let i = 0; i < numPixelsIcon; i++){
      this.m_dataIcon[i] = 0;
    }
    // actual size in icon (dest image)
    const wDst = Math.floor(VOLUME_ICON_SIDE * this.m_xDim / sizeSrcMax);
    const hDst = Math.floor(VOLUME_ICON_SIDE * this.m_yDim / sizeSrcMax);
    // top left corner in dst image
    const xDstL = Math.floor(this.m_xIcon / 2 - wDst / 2);
    const yDstT = Math.floor(this.m_yIcon / 2 - hDst / 2);
    for (let yDst = 0; yDst < hDst; yDst++) {
      const ySrc = Math.floor(yDst * scale);
      for (let xDst = 0; xDst < wDst; xDst++) {
        const xSrc = Math.floor(xDst * scale);
        const val = this.m_dataArray[xSrc + ySrc * this.m_xDim + zOff];
        // write result
        const xWrite = xDst + xDstL;
        const yWrite = yDst + yDstT;
        this.m_dataIcon[xWrite + yWrite * this.m_xIcon] = val;
      } // for xDst
    } // for yDst
  } // end createIcon
  //
  // Make each volume texture size equal to 4 * N
  //
  makeDimensions4x() {
    // do nothing if z slices less then 4 (was less 1)
    if (this.m_zDim < 4) {
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
  // do nothing. But we need to implement render() to run Volume tests
  render() {
    return <p>></p>;
  }

} // end class Volume

export default Volume;
