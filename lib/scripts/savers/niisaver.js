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
/**
* Nifti file saver
* @module lib/scripts/savers/niisaver
*/

const IS_LITTLE_ENDIAN = true;

// ******************************************************************
// Class
// ******************************************************************

export default class NiftiSaver {
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
      console.log(`NiftiSaver. volume pixels dim is bad: ${xDim} * ${yDim} * ${zDim} `);
    }
    const xGrid = volumeSize.pixdim1;
    const yGrid = volumeSize.pixdim2;
    const zGrid = volumeSize.pixdim3;
    const TOO_MUCH = 5.0;
    const TOO_MIN = 0.00001;
    if ((xGrid > TOO_MUCH) || (yGrid > TOO_MUCH) || (zGrid > TOO_MUCH)) {
      console.log(`NiftiSaver. volume grid size is too much: ${xGrid} * ${yGrid} * ${zGrid} `);
    }
    if ((xGrid < TOO_MIN) || (yGrid < TOO_MIN) || (zGrid < TOO_MIN)) {
      console.log(`NiftiSaver. volume grid size is too min: ${xGrid} * ${yGrid} * ${zGrid} `);
    }
    if (volumeData.length !== xDim * yDim * zDim) {
      console.log(`NiftiSaver. bad input volume size = ${volumeData.length}, expected = ${xDim}*${yDim}*${zDim}`);
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
      console.log(`NiftiSaver. bad input volume data range: [${valMin} .. ${valMax}]`);
    }

    const NIFTI_HEADER_SIZE = 348;
    const BYTES_PER_ELEMENT = 2;
    const arrBuf = new ArrayBuffer(NIFTI_HEADER_SIZE + volumeData.length * BYTES_PER_ELEMENT);
    const bufBytes = new Uint8Array(arrBuf);

    const SIZE_DWORD = 4;
    const SIZE_SHORT = 2;

    let bufOff = 0;
    NiftiSaver.writeIntToBuffer(NIFTI_HEADER_SIZE, arrBuf, bufOff);
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
    bufOff += 1;

    // read number of dimensions
    const NUM_DIMS = 3;
    NiftiSaver.writeShortToBuffer(NUM_DIMS, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // dave dims
    NiftiSaver.writeShortToBuffer(volumeSize.x, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    NiftiSaver.writeShortToBuffer(volumeSize.y, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    NiftiSaver.writeShortToBuffer(volumeSize.z, arrBuf, bufOff);
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
    const DATA_TYPE_SHORT = 4;
    NiftiSaver.writeShortToBuffer(DATA_TYPE_SHORT, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    const BIT_PIXELS = 16;
    NiftiSaver.writeShortToBuffer(BIT_PIXELS, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    // slice start
    bufOff += SIZE_SHORT;

    // grid spacing
    bufOff += SIZE_DWORD;
    NiftiSaver.writeFloatToBuffer(volumeSize.pixdim1, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    NiftiSaver.writeFloatToBuffer(volumeSize.pixdim2, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    NiftiSaver.writeFloatToBuffer(volumeSize.pixdim3, arrBuf, bufOff);
    bufOff += SIZE_DWORD;

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
