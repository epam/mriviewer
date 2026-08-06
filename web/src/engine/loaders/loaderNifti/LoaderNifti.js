/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview LoaderNifti
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import LoadResult from '../../LoadResult';
import { BITS_IN_BYTE, KTX_GL_RED, KTX_UNSIGNED_BYTE, NIFTI_HEADER_SIZE } from './constants';
import { NiftiHeaderReader } from './NiftiHeaderReader';
import { NiftiValidator } from './NiftiValidator';
import { NiftiDataProcessor } from './NiftiDataProcessor';
import { NiftiVolumeManager } from './NiftiVolumeManager';

// ********************************************************
// Const
// ********************************************************

// const NEED_EVEN_TEXTURE_SIZE = false;

// ********************************************************
// Class
// ********************************************************

/**
 * Class LoaderNifti some text later...
 */
class LoaderNifti {
  constructor() {
    this.headerReader = new NiftiHeaderReader();
    this.validator = new NiftiValidator();
    this.dataProcessor = new NiftiDataProcessor(this.headerReader);
    this.volumeManager = new NiftiVolumeManager();
    this.m_header = {
      m_id: '',
      m_endianness: 0,
      m_glType: 0,
      m_glTypeSize: 0,
      m_glFormat: 0,
      m_glInternalFormat: 0,
      m_glBaseInternalFormat: 0,
      m_pixelWidth: 0,
      m_pixelHeight: 0,
      m_pixelDepth: 0,
      m_numberOfArrayElements: 0,
      m_numberOfFaces: 0,
      m_numberOfMipmapLevels: 0,
      m_bytesOfKeyValueData: 0,
    };
  }

  readFromBuffer(volDst, arrBuf, callbackProgress, callbackComplete) {
    const bufBytes = new Uint8Array(arrBuf);
    const bufLen = bufBytes.length;

    if (!this.validator.validateBufferSize(bufLen, callbackComplete)) return false;
    if (!this.validator.validateHeaderSize(bufLen, callbackComplete)) return false;

    console.log(`Nifti loader. Start parse ${bufLen} bytes...`);

    const headerInfo = this.headerReader.parseHeader(bufBytes);
    if (headerInfo.hasError) {
      return this.validator.reportError(headerInfo.errorCode, callbackComplete, headerInfo.errorMessage);
    }

    if (!this.validator.validateDataType(headerInfo.dataType, callbackComplete)) return false;
    if (!this.validator.validateBitPix(headerInfo.bitPix, callbackComplete)) return false;

    this.volumeManager.setVolumeDimensions(headerInfo);
    this.volumeManager.setVoxelSize(headerInfo);

    if (!this.validator.validateMagic(bufBytes, callbackComplete)) return false;

    this.headerReader.readDescription(bufBytes);

    const { xDim, yDim, zDim } = this.volumeManager.getVolumeDimensions();
    const numVoxels = xDim * yDim * zDim;

    let dataOff = headerInfo.voxOffset;
    if (!Number.isFinite(dataOff) || dataOff < NIFTI_HEADER_SIZE) {
      dataOff = NIFTI_HEADER_SIZE;
    }
    const bytesPerVoxel = headerInfo.bitPix / BITS_IN_BYTE;
    if (dataOff + numVoxels * bytesPerVoxel > bufLen) {
      if (callbackComplete) callbackComplete(LoadResult.BAD_HEADER, null, 0, null);
      return false;
    }

    const progressMask = this.dataProcessor.computeProgressMask(numVoxels);
    let valMax = this.dataProcessor.findMaxValue(bufBytes, headerInfo.dataType, dataOff, numVoxels, progressMask, callbackProgress);

    const histArray = this.dataProcessor.buildHistogram(bufBytes, headerInfo.dataType, dataOff, numVoxels, valMax);
    const histogram = this.dataProcessor.createAndProcessHistogram(histArray, valMax);

    const VAL_MIN = 4.0;
    let lastMaxIndex = histogram.getLastMaxIndex(VAL_MIN);
    valMax = lastMaxIndex < 4 ? valMax : lastMaxIndex;

    console.log(`LoaderNifti. get Last max peak: ${valMax} / ${histogram.m_numColors}`);
    console.log('DATA TYPE :', headerInfo.dataType);

    const MAX_BYTE = 255;
    const dataSize = numVoxels * (headerInfo.bitPix / BITS_IN_BYTE);
    let dataArray = new Uint8Array(numVoxels);
    const ACC_DEGREE = 9;
    const scale = (MAX_BYTE << ACC_DEGREE) / valMax;
    const TOO_MIN_SCALE = 4;
    if (scale <= TOO_MIN_SCALE) {
      console.log('Bad scaling: image will be 0');
      if (callbackComplete) {
        callbackComplete(LoadResult.ERROR_PROCESS_HISTOGRAM, null, 0, null);
      }
      return false;
    }

    this.dataProcessor.fillDataArray(
      dataArray,
      bufBytes,
      headerInfo.dataType,
      dataOff,
      numVoxels,
      scale,
      ACC_DEGREE,
      MAX_BYTE,
      progressMask,
      callbackProgress
    );
    this.dataProcessor.clearVolumeBorders(dataArray, xDim, yDim, zDim);

    Object.assign(volDst, {
      m_xDim: xDim,
      m_yDim: yDim,
      m_zDim: zDim,
      m_bytesPerVoxel: 1,
      m_dataArray: dataArray,
      m_dataSize: numVoxels,
      m_boxSize: this.volumeManager.getBoxSize(),
    });

    console.log('DATA');
    console.log(dataArray);
    console.log(dataArray.slice(0, 1000));
    console.log(`Nifti header read OK. Volume pixels = ${xDim} * ${yDim} * ${zDim}`);

    const header = {
      m_pixelWidth: xDim,
      m_pixelHeight: yDim,
      m_pixelDepth: zDim,
      m_glType: KTX_UNSIGNED_BYTE,
      m_glTypeSize: 1,
      m_glFormat: KTX_GL_RED,
      m_glInternalFormat: KTX_GL_RED,
      m_glBaseInternalFormat: KTX_GL_RED,
    };

    if (callbackProgress) callbackProgress(1.0);
    if (callbackComplete) callbackComplete(LoadResult.SUCCESS, header, dataSize, dataArray);

    return true;
  }
}

export default LoaderNifti;
