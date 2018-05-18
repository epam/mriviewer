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
* Active volume algorithm implementation
* @module lib/scripts/actvolume/actvol
*/

// absolute imports
import * as THREE from 'three';

// relative imports
import TetrahedronGenerator from './tetra';

const AV_NUM_COLORS = 256;

const AV_STATE_NA = -1;
const AV_STATE_NOT_STARTED = 0;
// const AV_STATE_PREPARE_GAUSS = 1;
// const AV_STATE_PREPARE_UNIFORMITY = 2;
// const AV_STATE_UPDATE_GEO = 3;
// const AV_STATE_FINISHED = 4;

// const AV_METHOD_NORMALS = 1;
// const AV_METHOD_UNIFORMITY = 2;
// const AV_METHOD_COLOR_KOEFS = 4;
// const AV_METHOD_ALL = 0xffff;

/**
* Class ActiveVolume perform skull detection and removal
* @class ActiveVolume
*/
export default class ActiveVolume {
  /**
  * Init all internal data
  * @constructs ActiveVolume
  */
  constructor() {
    this.m_state = AV_STATE_NA;
    this.m_pixelsSrc = null;
    this.m_xDim = 0;
    this.m_yDim = 0;
    this.m_zDim = 0;
    this.m_imageGauss = null;
    this.m_imageUniformity = null;
    this.m_verticesNew = null;
    this.m_lapSmoother = null;
    this.m_imageSrc = null;
    this.m_imageGrad = null;
    this.m_gaussStage = -1;
    this.m_uniformityStage = -1;
    this.m_geoStage = -1;
    this.m_histogram = new Int32Array(AV_NUM_COLORS);
    this.m_colorProbability = new FloatArray(AV_NUM_COLORS);
    this.m_colorKoefs = new FloatArray(AV_NUM_COLORS);
    for (let i = 0; i < AV_NUM_COLORS; i++) {
      m_histogram[i] = 0;
      m_colorProbability[i] = 0.0;
      m_colorKoefs[i]       = 0.0;
    }
    this.m_indexMinColor = -1;
  }

  /**
  * Remove skull
  * @return {number} 1, if success. <0 if failed
  */
  skullRemove(xDim, yDim, zDim, volTexSrc, volTexDst, needCreateMask, needLog) {
    console.log(`skullRemove params. needCreateMask = ${needCreateMask}, needLog = ${needLog}`);
    const TOO_MUCH_SIZE = 8192;
    if ((xDim >= TOO_MUCH_SIZE) || (yDim >= TOO_MUCH_SIZE) || (zDim >= TOO_MUCH_SIZE)) {
      console.log(`Too bad volume dimension: ${xDim} * ${yDim} * ${zDim}`);
      return -1;
    }
    if ((xDim <= 1) || (yDim <= 1) || (zDim <= 1)) {
      console.log(`Too bad volume dimension: ${xDim} * ${yDim} * ${zDim}`);
      return -1;
    }
    const okCreate = create(xDim, yDim, zDim, volTexSrc);
    if (okCreate !== 1) {
      return okCreate;
    }
    return +1;
  } // skullRemove

  /**
  * Create tetrahedron geometry
  * @return {number} 1, if success. <0 if failed
  */
  create(xDim, yDim, zDim, volTexSrc) {
    this.m_state = AV_STATE_NOT_STARTED;
    this.m_pixelsSrc = volTexSrc;
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    const numPixels = xDim * yDim * zDim;
    this.m_imageGauss = new FloatArray(numPixels);
    this.m_imageUniformity = new FloatArray(numPixels);
    this.m_verticesNew = null;

    const genTetra = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 3;
    const okCreateTetra = genTetra.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return okCreateTetra;
    }

    // good result
    return 1;
  }

} // class ActiveVolume
