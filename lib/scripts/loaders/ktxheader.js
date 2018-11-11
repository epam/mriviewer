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
* KTX header structure descriptor
* @module lib/scripts/loaders/ktxheader
*/

/**
* Class KtxHeader represent header for KTX file
* @class KtxHeader
*/
export default class KtxHeader {
  /**
  * Create empty header for KTX file parsing
  * @constructs KtxHeader
  */
  constructor() {
    /** @property {string} m_id - magic string to identify data */
    this.m_id = '';
    /** @property {number} m_endianness - should be 0x04030201 */
    this.m_endianness = 0; // 4 bytes
    /** @property {number} m_glType - typically is KTX_GL_UNSIGNED_BYTE */
    this.m_glType = 0;  // 4 bytes
    /** @property {number} m_glTypeSize - set to 1 */
    this.m_glTypeSize = 0; // 4 bytes
    /** @property {number} m_glFormat - one between KTX_GL_RED, ... */
    this.m_glFormat = 0;
    /** @property {number} m_glInternalFormat - The same as format (previous field) */
    this.m_glInternalFormat = 0;
    this.m_glBaseInternalFormat = 0;
    /** @property {number} m_pixelWidth - X volume dimension */
    this.m_pixelWidth = 0;
    /** @property {number} m_pixelHeight - Y volume dimension */
    this.m_pixelHeight = 0;
    /** @property {number} m_pixelDepth - Z volume dimension */
    this.m_pixelDepth = 0;
    /** @property {number} m_numberOfArrayElements - Number of non texture arrays (usually is 0) */
    this.m_numberOfArrayElements = 0;
    /** @property {number} m_numberOfFaces - some magic. Equal to 1. */
    this.m_numberOfFaces = 0;
    /** @property {number} m_numberOfMipmapLevels - typcially 1. */
    this.m_numberOfMipmapLevels = 0;
    /** @property {number} m_bytesOfKeyValueData - extra key values, usually 0 */
    this.m_bytesOfKeyValueData = 0;
  }
  copyFrom(headerSrc) {
    this.m_id = headerSrc.m_id;
    this.m_endianness = headerSrc.m_endianness;
    this.m_glType = headerSrc.m_glType;
    this.m_glTypeSize = headerSrc.m_glTypeSize;
    this.m_glFormat = headerSrc.m_glFormat;
    this.m_glInternalFormat = headerSrc.m_glInternalFormat;
    this.m_glBaseInternalFormat = headerSrc.m_glBaseInternalFormat;
    this.m_pixelWidth = headerSrc.m_pixelWidth;
    this.m_pixelHeight = headerSrc.m_pixelHeight;
    this.m_pixelDepth = headerSrc.m_pixelDepth;
    this.m_numberOfArrayElements = headerSrc.m_numberOfArrayElements;
    this.m_numberOfFaces = headerSrc.m_numberOfFaces;
    this.m_numberOfMipmapLevels = headerSrc.m_numberOfMipmapLevels;
    this.m_bytesOfKeyValueData = headerSrc.m_bytesOfKeyValueData;
  }
}

/** @const {number} KTX_GL_RED - 1 byte per voxel */
KtxHeader.KTX_GL_RED = 0x1903;
/** @const {number} KTX_GL_RGB - 3 bytes per voxel */
KtxHeader.KTX_GL_RGB = 0x1907;
/** @const {number} KTX_GL_RGBA - 4 bytes per voxel */
KtxHeader.KTX_GL_RGBA = 0x1908;

/** @const {number} KTX_GL_R8_EXT - Extended value */
KtxHeader.KTX_GL_R8_EXT = 0x8229;
/** @const {number} KTX_GL_RGB8_OES - Extended value */
KtxHeader.KTX_GL_RGB8_OES = 0x8051;
/** @const {number} KTX_GL_RGBA8_OES - Extended value */
KtxHeader.KTX_GL_RGBA8_OES = 0x8058;

