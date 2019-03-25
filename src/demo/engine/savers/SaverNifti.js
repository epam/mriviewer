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
    const res = (freq & 0x3) | 
      ((phase & 0x3) << 2) |
      ((slice & 0x3) << 4);
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
    const xDim = volumeSize.x;
    const yDim = volumeSize.y;
    const zDim = volumeSize.z;
    if ((xDim <= 0) || (yDim <= 0) || (zDim <= 0)) {
      console.log(`SaverNifti. volume pixels dim is bad: ${xDim} * ${yDim} * ${zDim} `);
    }
    const xGrid = volumeSize.pixdim1;
    const yGrid = volumeSize.pixdim2;
    const zGrid = volumeSize.pixdim3;
    const TOO_MUCH = 5.0;
    const TOO_MIN = 0.00001;
    if ((xGrid > TOO_MUCH) || (yGrid > TOO_MUCH) || (zGrid > TOO_MUCH)) {
      console.log(`SaverNifti. volume grid size is too much: ${xGrid} * ${yGrid} * ${zGrid} `);
    }
    if ((xGrid < TOO_MIN) || (yGrid < TOO_MIN) || (zGrid < TOO_MIN)) {
      console.log(`SaverNifti. volume grid size is too min: ${xGrid} * ${yGrid} * ${zGrid} `);
    }
    if (volumeData.length !== xDim * yDim * zDim) {
      console.log(`SaverNifti. bad input volume size = ${volumeData.length}, expected = ${xDim}*${yDim}*${zDim}`);
    }
    const TOO_BIG_VAL = 1000000;
    const TOO_SMALL_VAL = -1000000;
    let valMin = TOO_BIG_VAL;
    let valMax = TOO_SMALL_VAL;
    const numPixels = xDim * yDim * zDim;
    for (let i = 0; i < numPixels; i++) {
      valMin = (volumeData[i] < valMin) ? volumeData[i] : valMin;
      valMax = (volumeData[i] > valMax) ? volumeData[i] : valMax;
    }
    const TOO_MIN_RANGE = 60;
    if (valMax - valMin < TOO_MIN_RANGE) {
      console.log(`SaverNifti. bad input volume data range: [${valMin} .. ${valMax}]`);
    }

    const NIFTI_HEADER_SIZE = 348;
    const BYTES_PER_ELEMENT = 2;
    const arrBuf = new ArrayBuffer(NIFTI_HEADER_SIZE + volumeData.length * BYTES_PER_ELEMENT);
    const bufBytes = new Uint8Array(arrBuf);

    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;

    let bufOff = 0;
    SaverNifti.writeIntToBuffer(NIFTI_HEADER_SIZE, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // data type
    // eslint-disable-next-line
    bufOff += 10;
    // db name
    // eslint-disable-next-line
    bufOff += 18;
    // extents
    bufOff += SIZE_DWORD;
    // session error
    bufOff += SIZE_SHORT;
    // regular
    bufOff += 1;
    // dim info
    const D_FREQ = 1;
    const D_PHASE = 2;
    const D_SLICE = 3;
    const dimInfo = SaverNifti.fpsToDimInfo(D_FREQ, D_PHASE, D_SLICE);
    bufBytes[bufOff] = dimInfo;
    bufOff += 1;

    // write number of dimensions
    const NUM_DIMS = 3;
    SaverNifti.writeShortToBuffer(NUM_DIMS, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // dave dims
    SaverNifti.writeShortToBuffer(volumeSize.x, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    SaverNifti.writeShortToBuffer(volumeSize.y, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    SaverNifti.writeShortToBuffer(volumeSize.z, arrBuf, bufOff);
    bufOff += SIZE_SHORT;

    // eslint-disable-next-line
    bufOff += 8;

    // intent_p1
    bufOff += SIZE_DWORD;
    // intent_p2
    bufOff += SIZE_DWORD;
    // intent_p3
    bufOff += SIZE_DWORD;
    // intent_code
    bufOff += SIZE_SHORT;
    // datatype
    const DATA_TYPE_UINT16 = 512;
    SaverNifti.writeShortToBuffer(DATA_TYPE_UINT16, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // bitpix
    const BIT_PIXELS = 16;
    SaverNifti.writeShortToBuffer(BIT_PIXELS, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // slice start
    bufOff += SIZE_SHORT;

    // grid spacing (pixdim)
    bufOff += SIZE_DWORD;
    SaverNifti.writeFloatToBuffer(volumeSize.pixdim1, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    SaverNifti.writeFloatToBuffer(volumeSize.pixdim2, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    SaverNifti.writeFloatToBuffer(volumeSize.pixdim3, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // eslint-disable-next-line
    bufOff += SIZE_DWORD * 4;

    // voxoffset
    const VOX_OFFSET = 352.0;
    SaverNifti.writeFloatToBuffer(VOX_OFFSET, arrBuf, bufOff);
    bufOff += SIZE_DWORD;

    // sclSlope
    const SLOPE = 1.0;
    SaverNifti.writeFloatToBuffer(SLOPE, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // sclInter
    const INTER = 0.0;
    SaverNifti.writeFloatToBuffer(INTER, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    // sliceEnd
    bufOff += SIZE_SHORT;
    // sliceCode
    const SLICE_CODE = 1;
    bufBytes[bufOff] = SLICE_CODE;
    bufOff++;
    // m_xyztUnits
    const XYZ_UNITS = 10;
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
    const FORM_CODE = 1;
    SaverNifti.writeShortToBuffer(FORM_CODE, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // m_sformCode
    SaverNifti.writeShortToBuffer(FORM_CODE, arrBuf, bufOff);
    bufOff += SIZE_SHORT;

    // 4 last bytes are magic
    bufOff = NIFTI_HEADER_SIZE - SIZE_DWORD;
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

    const volDataUInt16 = new Uint16Array(volumeData);
    const bufBytes16 = new Uint16Array(arrBuf, bufOff);
    bufBytes16.set(volDataUInt16);

    return arrBuf;
  }
} // end of class

export default SaverNifti;
