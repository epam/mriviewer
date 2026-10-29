/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview SaverNifti
 * @author Epam
 * @version 1.0.0
 */

/**
/**
* Nifti file saver
* @module src/demo/savers/SaverNifti
*/

const IS_LITTLE_ENDIAN = true;

const HEADER_SIZE = 348;
const BYTES_PER_ELEMENT = 2;
const SIZE_DWORD = 4;
const SIZE_SHORT = 2;

const BIT_PIXELS = 16;
const SLOPE = 1.0;
const INTER = 0.0;
const SLICE_CODE = 0;
const XYZ_UNITS = 10;
const FORM_CODE = 1;

// ******************************************************************
// Class
// ******************************************************************

class SaverNifti {
  static writeIntToBuffer(val, buf, off) {
    const dataArray = new DataView(buf, off);
    dataArray.setInt32(0, val, IS_LITTLE_ENDIAN);
  }

  static writeShortToBuffer(val, buf, off) {
    const dataArray = new DataView(buf, off);
    dataArray.setInt16(0, val, IS_LITTLE_ENDIAN);
  }

  static writeFloatToBuffer(val, buf, off) {
    const dataArray = new DataView(buf, off);
    dataArray.setFloat32(0, val, IS_LITTLE_ENDIAN);
  }

  static fpsToDimInfo(freq, phase, slice) {
    const res = (freq & 0x3) | ((phase & 0x3) << 2) | ((slice & 0x3) << 4);
    return res;
  }

  /**
   * Write nifti file data to buffer array
   * @param {object} volumeData - array of intensities (uint8)
   * @param {object} volumeSize - pixel and physical size
   * @return {Object} ArrayBuffer with file content
   */
  static writeBuffer(volumeData, volumeSize) {
    // check input data
    const { x, y, z, pixdim1, pixdim2, pixdim3 } = volumeSize;
    const numPixels = x * y * z;
    if (x <= 0 || y <= 0 || z <= 0) {
      console.warn(`Invalid volume dimensions: ${x} * ${y} * ${z}`);
    }

    const gridTooBig = [pixdim1, pixdim2, pixdim3].some((p) => p > 5.0);
    const gridTooSmall = [pixdim1, pixdim2, pixdim3].some((p) => p < 0.00001);

    if (gridTooBig) {
      console.warn(`Grid size too large: ${pixdim1} * ${pixdim2} * ${pixdim3}`);
    }
    if (gridTooSmall) {
      console.warn(`Grid size too small: ${pixdim1} * ${pixdim2} * ${pixdim3}`);
    }

    if (volumeData.length !== numPixels) {
      console.warn(`Volume size mismatch. Got ${volumeData.length}, expected ${numPixels}`);
    }

    const TOO_BIG_VAL = 1000000;
    const TOO_SMALL_VAL = -1000000;
    let valMin = TOO_BIG_VAL;
    let valMax = TOO_SMALL_VAL;

    for (let i = 0; i < numPixels; i++) {
      valMin = volumeData[i] < valMin ? volumeData[i] : valMin;
      valMax = volumeData[i] > valMax ? volumeData[i] : valMax;
    }
    const TOO_MIN_RANGE = 60;
    if (valMax - valMin < TOO_MIN_RANGE) {
      console.log(`SaverNifti. bad input volume data range: [${valMin} .. ${valMax}]`);
    }

    const arrBuf = new ArrayBuffer(HEADER_SIZE + volumeData.length * BYTES_PER_ELEMENT);
    const bufBytes = new Uint8Array(arrBuf);

    let bufOff = 0;
    SaverNifti.writeIntToBuffer(HEADER_SIZE, arrBuf, bufOff);

    // skip to dim info
    bufOff += 40;
    // dim info
    const D_FREQ = 1;
    const D_PHASE = 2;
    const D_SLICE = 3;
    const dimInfo = SaverNifti.fpsToDimInfo(D_FREQ, D_PHASE, D_SLICE);
    bufBytes[bufOff] = dimInfo;

    // write number of dimensions
    const NUM_DIMS = 3;
    SaverNifti.writeShortToBuffer(NUM_DIMS, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // dave dims
    SaverNifti.writeShortToBuffer(x, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    SaverNifti.writeShortToBuffer(y, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    SaverNifti.writeShortToBuffer(z, arrBuf, bufOff);
    bufOff += SIZE_SHORT;

    for (let i = 0; i < 4; i++) {
      SaverNifti.writeShortToBuffer(1, arrBuf, bufOff);
      bufOff += SIZE_SHORT;
    }

    // eslint-disable-next-line
    // bufOff += 8;

    // intent_p1
    bufOff += SIZE_DWORD;
    // intent_p2
    bufOff += SIZE_DWORD;
    // intent_p3
    bufOff += SIZE_DWORD;
    // intent_code
    bufOff += SIZE_SHORT;
    // datatype
    SaverNifti.writeShortToBuffer(4, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // bitpix
    SaverNifti.writeShortToBuffer(BIT_PIXELS, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // slice start
    bufOff += SIZE_SHORT;

    // grid spacing (pixdim)
    SaverNifti.writeFloatToBuffer(1, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    SaverNifti.writeFloatToBuffer(pixdim1, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    SaverNifti.writeFloatToBuffer(pixdim2, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    SaverNifti.writeFloatToBuffer(pixdim3, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // eslint-disable-next-line
    bufOff += SIZE_DWORD * 4;

    // voxoffset
    const VOX_OFFSET = 352;
    SaverNifti.writeFloatToBuffer(VOX_OFFSET, arrBuf, bufOff);
    bufOff += SIZE_DWORD;

    // sclSlope
    SaverNifti.writeFloatToBuffer(SLOPE, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // sclInter
    SaverNifti.writeFloatToBuffer(INTER, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // sliceEnd
    bufOff += SIZE_SHORT;
    // sliceCode
    bufBytes[bufOff] = SLICE_CODE;
    bufOff++;
    // m_xyztUnits
    bufBytes[bufOff] = XYZ_UNITS;
    bufOff++;
    // m_calMax, m_calMin, m_sliceDuration, m_toffset
    bufOff += SIZE_DWORD * 4;
    // m_glmax, m_glmin
    bufOff += SIZE_DWORD * 2;
    // m_descrip[80]
    bufOff += 80;
    // m_auxFile[24]
    bufOff += 24;

    // m_qformCode
    SaverNifti.writeShortToBuffer(FORM_CODE, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // m_sformCode
    SaverNifti.writeShortToBuffer(FORM_CODE, arrBuf, bufOff);
    bufOff += SIZE_SHORT;

    // 4 last bytes are magic
    bufOff = HEADER_SIZE - SIZE_DWORD;
    // 'n' == 110, '+' == 43, '1' == 49
    const MAG_0 = 110;
    const MAG_1 = 43;
    const MAG_2 = 49;
    bufBytes[bufOff + 0] = MAG_0;
    // eslint-disable-next-line
    bufBytes[bufOff + 1] = MAG_1;
    // eslint-disable-next-line
    bufBytes[bufOff + 2] = MAG_2;
    bufOff += SIZE_DWORD; // last magic bytes in header

    const volDataUInt16 = new Uint16Array(volumeData.length);
    const scaleTo16Bit = 4095 / 255; // Map 8-bit to 12-bit range (common in medical imaging)
    for (let i = 0; i < volumeData.length; i++) {
      volDataUInt16[i] = Math.round(volumeData[i] * scaleTo16Bit);
    }
    const bufBytes16 = new Uint16Array(arrBuf, bufOff);
    bufBytes16.set(volDataUInt16);

    return arrBuf;
  }
} // end of class

export default SaverNifti;
