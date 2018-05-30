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
  * @param {object} volumeHeader - header for volume
  * @param {object} volumeData - array of intensities (uint8)
  * @param {object} volumeBox - physical size
  * @return {Object} ArrayBuffer with file content
  */
  static writeBuffer(volumeHeader, volumeData, volumeBox) {
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
    NiftiSaver.writeShortToBuffer(volumeHeader.m_pixelWidth, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    NiftiSaver.writeShortToBuffer(volumeHeader.m_pixelHeight, arrBuf, bufOff);
    bufOff += SIZE_SHORT;
    NiftiSaver.writeShortToBuffer(volumeHeader.m_pixelDepth, arrBuf, bufOff);
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
    const pixdim1 = volumeBox.x / volumeHeader.m_pixelWidth;
    const pixdim2 = volumeBox.y / volumeHeader.m_pixelHeight;
    const pixdim3 = volumeBox.z / volumeHeader.m_pixelDepth;
    bufOff += SIZE_DWORD;
    NiftiSaver.writeFloatToBuffer(pixdim1, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    NiftiSaver.writeFloatToBuffer(pixdim2, arrBuf, bufOff);
    bufOff += SIZE_DWORD;
    NiftiSaver.writeFloatToBuffer(pixdim3, arrBuf, bufOff);
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
