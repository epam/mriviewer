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
import GeoRender from './georender';
import LaplasianSmoother from './lapsmooth';
import VolumeClipper from './volclip';
import KtxLoader from '../loaders/ktxloader';

const ACT_VOL_NUM_SMOOTH_STAGES = 10;

const AV_NUM_COLORS = 256;

const AV_STATE_NA = -1;
const AV_STATE_NOT_STARTED = 0;
const AV_STATE_PREPARE_GAUSS = 1;
const AV_STATE_PREPARE_UNIFORMITY = 2;
const AV_STATE_UPDATE_GEO = 3;
const AV_STATE_FINISHED = 4;

const AV_METHOD_NORMALS = 1;
const AV_METHOD_UNIFORMITY = 2;
const AV_METHOD_COLOR_KOEFS = 4;
const AV_METHOD_ALL = 0xffff;

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
    this.m_colorProbability = new Float32Array(AV_NUM_COLORS);
    this.m_colorKoefs = new Float32Array(AV_NUM_COLORS);
    for (let i = 0; i < AV_NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
      this.m_colorProbability[i] = 0.0;
      this.m_colorKoefs[i] = 0.0;
    }
    this.m_sphereCenter = null;
    this.m_sphereRadius = null;
    this.m_indexMinColor = -1;
    // debug counter to save geo
    this.m_updateCounter = 0;
    // for display 3d geo
    this.m_geoRender = null;
  }

  /**
  *
  * Set initial sphere center
  */
  setSphereCenter(xCenter, yCenter, zCenter) {
    this.m_sphereCenter = new THREE.Vector3();
    this.m_sphereCenter.set(xCenter, yCenter, zCenter);
  }

  /**
  *
  * Set initial sphere radius
  */
  setSphereRadius(xRadius, yRadius, zRadius) {
    this.m_sphereRadius = new THREE.Vector3();
    this.m_sphereRadius.set(xRadius, yRadius, zRadius);
  }

  /**
  *
  * Get sphere center
  */
  getSphereCenter() {
    return this.m_sphereCenter;
  }

  /**
  *
  * Get sphere radius
  */
  getSphereRadius() {
    return this.m_sphereRadius;
  }

  /**
  *
  * Create internal structures: render sphere
  */
  createGeoSphere() {
    if (this.m_xDim === 0) {
      const ERR_NO_VOLUME = -1;
      return ERR_NO_VOLUME;
    }
    if (this.m_sphereRadius === null) {
      const ERR_NO_SPHERE = -2;
      return ERR_NO_SPHERE;
    }

    const genTetra = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 3;
    const okCreateTetra = genTetra.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return okCreateTetra;
    }
    const geoRender = new GeoRender();
    const errGeo = geoRender.createFromTetrahedronGenerator(genTetra);
    const GEO_OK = 1;
    if (errGeo !== GEO_OK) {
      const ERR_CREATE_GEO = -3;
      return ERR_CREATE_GEO;
    }

    // scale geo render vertices to fit initial sphere
    const numVertices = geoRender.getNumVertices();
    const vertices = geoRender.getVertices();
    const COORDS_IN_VERTEX = 4;
    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;
    for (let i = 0, i4 = 0; i < numVertices; i++, i4 += COORDS_IN_VERTEX) {
      vertices[i4 + NUM_0] = this.m_sphereCenter.x + vertices[i4 + NUM_0] * this.m_sphereRadius.x;
      vertices[i4 + NUM_1] = this.m_sphereCenter.y + vertices[i4 + NUM_1] * this.m_sphereRadius.y;
      vertices[i4 + NUM_2] = this.m_sphereCenter.z + vertices[i4 + NUM_2] * this.m_sphereRadius.z;
    } // for (i) all vertices

    // save render geo to obj file
    const NEED_SAVE_INITIAL_GEO = false;
    if (NEED_SAVE_INITIAL_GEO) {
      const TEST_SAVE_INIT_GEO_FILE_NAME = 'geo_init.obj';
      geoRender.saveGeoToObjFile(TEST_SAVE_INIT_GEO_FILE_NAME);
    }

    // Test save bounding sphere
    const NEED_SAVE_BOUND_SPHERE = false;
    if (NEED_SAVE_BOUND_SPHERE) {
      const vMin = new THREE.Vector3();
      const vMax = new THREE.Vector3();
      ActiveVolume.getBoundingBox(this.m_xDim, this.m_yDim, this.m_zDim, this.m_pixelsSrc, vMin, vMax);
      const geoSphere = new GeoRender();
      const vCenter = new THREE.Vector3();
      const vRad = new THREE.Vector3();
      vCenter.x = (vMin.x + vMax.x) * 0.5;
      vCenter.y = (vMin.y + vMax.y) * 0.5;
      vCenter.z = (vMin.z + vMax.z) * 0.5;
      vRad.x = (vMax.x - vMin.x) * 0.5;
      vRad.y = (vMax.y - vMin.y) * 0.5;
      vRad.z = (vMax.z - vMin.z) * 0.5;

      const NUM_SEGM_HOR = 16;
      const NUM_SEGM_VER = 8;
      geoSphere.createFromEllipse(vCenter, vRad, NUM_SEGM_HOR, NUM_SEGM_VER);
      const TEST_SAVE_BSPHERE_GEO_FILE_NAME = 'geo_bsph.obj';
      geoSphere.saveGeoToObjFile(TEST_SAVE_BSPHERE_GEO_FILE_NAME);
    }
    this.m_geoRender = geoRender;
    return 1;
  }

  /**
  *
  * Create THREE js geometry (can be rendered in 3d scene)
  * from current sphere
  */
  createThreeJsGeoFromSphere() {
    const geoSrc = this.m_geoRender;
    if (geoSrc === null) {
      console.log('createThreeJsGeoFromSphere. logic error: call createGeoSphere() first');
      return null;
    }
    const xScale = 1.0 / this.m_xDim;
    const yScale = 1.0 / this.m_yDim;
    const zScale = 1.0 / this.m_zDim;
    const verticesSrc = geoSrc.getVertices();
    const geoDst = new THREE.Geometry();
    const COORDS_IN_VERTEX = 4;
    const OFF_X = 0;
    const OFF_Y = 1;
    const OFF_Z = 2;
    const HALF = 0.5;
    // push vertices
    for (let i = 0, i4 = 0; i < geoSrc.m_numVertices; i++, i4 += COORDS_IN_VERTEX) {
      const x = verticesSrc[i4 + OFF_X] * xScale - HALF;
      const y = verticesSrc[i4 + OFF_Y] * yScale - HALF;
      const z = verticesSrc[i4 + OFF_Z] * zScale - HALF;
      const vNew = new THREE.Vector3(x, y, z);
      geoDst.vertices.push(vNew);
    }
    // push faces
    const INDICES_IN_TRI = 3;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    for (let i = 0, i3 = 0; i < geoSrc.m_numTriangles; i++, i3 += INDICES_IN_TRI) {
      const i0 = geoSrc.m_indices[i3 + OFF_0];
      const i1 = geoSrc.m_indices[i3 + OFF_1];
      const i2 = geoSrc.m_indices[i3 + OFF_2];
      const faceNew = new THREE.Face3(i0, i1, i2);
      geoDst.faces.push(faceNew);
    }
    // calc bound box
    geoDst.computeBoundingSphere();
    return geoDst;
  }

  /**
  * Remove skull
  * @param {number} xDim volume dimension on x
  * @param {number} yDim volume dimension on y
  * @param {number} zDim volume dimension on z
  * @param {array}  volTexSrc source volume
  * @param {array}  volTexDst destination volume
  * @param {number} createType Kind of
  * @param {boolean} needLog Need intensive log
  * @param {object} progressCallback callback function for progress
  * @return {number} 1, if success. <0 if failed
  */
  skullRemove(xDim, yDim, zDim, volTexSrc, volTexDst, createType, needLog) {
    const TOO_MUCH_SIZE = 8192;
    if ((createType !== ActiveVolume.REMOVE_SKULL) && (createType !== ActiveVolume.CREATE_MASK)) {
      console.log('skullRemove: wrong argument createType');
    }
    if ((xDim >= TOO_MUCH_SIZE) || (yDim >= TOO_MUCH_SIZE) || (zDim >= TOO_MUCH_SIZE)) {
      console.log(`Too bad volume dimension: ${xDim} * ${yDim} * ${zDim}`);
      return -1;
    }
    if ((xDim <= 1) || (yDim <= 1) || (zDim <= 1)) {
      console.log(`Too bad volume dimension: ${xDim} * ${yDim} * ${zDim}`);
      return -1;
    }
    const volSizeSrc = volTexSrc.length;
    const numPixSrc = xDim * yDim * zDim;
    if (volSizeSrc !== numPixSrc) {
      console.log(`skullRemove: bad vol size = ${volSizeSrc}, expected ${numPixSrc}`);
      return -1;
    }
    const okCreate = this.create(xDim, yDim, zDim, volTexSrc);
    if (okCreate !== 1) {
      return okCreate;
    }
    const genTetra = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 3;
    const okCreateTetra = genTetra.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return okCreateTetra;
    }
    const geoRender = new GeoRender();
    const errGeo = geoRender.createFromTetrahedronGenerator(genTetra);
    const GEO_OK = 1;
    if (errGeo !== GEO_OK) {
      const ERR_CREATE_GEO = -3;
      return ERR_CREATE_GEO;
    }

    // get half from volume dimension
    const xDim2 = Math.floor((this.m_xDim - 1) * 0.5);
    const yDim2 = Math.floor((this.m_yDim - 1) * 0.5);
    const zDim2 = Math.floor((this.m_zDim - 1) * 0.5);

    // scale geo render vertices
    const numVertices = geoRender.getNumVertices();
    const vertices = geoRender.getVertices();
    const COORDS_IN_VERTEX = 4;
    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;
    for (let i = 0, i4 = 0; i < numVertices; i++, i4 += COORDS_IN_VERTEX) {
      vertices[i4 + NUM_0] = xDim2 + xDim2 * vertices[i4 + NUM_0];
      vertices[i4 + NUM_1] = yDim2 + yDim2 * vertices[i4 + NUM_1];
      vertices[i4 + NUM_2] = zDim2 + zDim2 * vertices[i4 + NUM_2];
    } // for (i) all vertices

    // save render geo to obj file
    const NEED_SAVE_INITIAL_GEO = false;
    if (NEED_SAVE_INITIAL_GEO) {
      const TEST_SAVE_INIT_GEO_FILE_NAME = 'geo_init.obj';
      geoRender.saveGeoToObjFile(TEST_SAVE_INIT_GEO_FILE_NAME);
    }

    // Test save bounding sphere
    const NEED_SAVE_BOUND_SPHERE = false;
    if (NEED_SAVE_BOUND_SPHERE) {
      const vMin = new THREE.Vector3();
      const vMax = new THREE.Vector3();
      ActiveVolume.getBoundingBox(this.m_xDim, this.m_yDim, this.m_zDim, this.m_pixelsSrc, vMin, vMax);
      const geoSphere = new GeoRender();
      const vCenter = new THREE.Vector3();
      const vRad = new THREE.Vector3();
      vCenter.x = (vMin.x + vMax.x) * 0.5;
      vCenter.y = (vMin.y + vMax.y) * 0.5;
      vCenter.z = (vMin.z + vMax.z) * 0.5;
      vRad.x = (vMax.x - vMin.x) * 0.5;
      vRad.y = (vMax.y - vMin.y) * 0.5;
      vRad.z = (vMax.z - vMin.z) * 0.5;

      const NUM_SEGM_HOR = 16;
      const NUM_SEGM_VER = 8;
      geoSphere.createFromEllipse(vCenter, vRad, NUM_SEGM_HOR, NUM_SEGM_VER);
      const TEST_SAVE_BSPHERE_GEO_FILE_NAME = 'geo_bsph.obj';
      geoSphere.saveGeoToObjFile(TEST_SAVE_BSPHERE_GEO_FILE_NAME);
    }

    // perform itertaions: update geo
    let isFinished = false;
    let numPredSteps = this.getPredictedStepsForActiveVolumeUpdate();
    const SOME_ADD_STEPS = 12;
    numPredSteps += SOME_ADD_STEPS;

    const strTypeArr = ['REMOVE_SKULL', 'CREATE_MASK'];
    const strType = strTypeArr[createType];
    console.log(`skullRemove. Will be ${numPredSteps} updates approximately. In ${strType} mode `);

    if (numPredSteps > 0) {
      for (this.m_updateCounter = 0; (this.m_updateCounter < numPredSteps) && !isFinished; this.m_updateCounter++) {
        //if (needLogPrintf) {
        //  printf(".");
        // }
        console.log(`skullRemove(${this.m_updateCounter})`);
        this.updateGeo(geoRender, AV_METHOD_ALL);
        isFinished = (this.m_state === AV_STATE_FINISHED);
      }
    }

    // save geo render after all modification iterations
    const NEED_SAVE_FINAL_GEO_RENDER = false;
    if (NEED_SAVE_FINAL_GEO_RENDER) {
      this.finalizeUpdatesGeo(geoRender, NEED_SAVE_FINAL_GEO_RENDER);
    }

    // Save smoothed image into file
    const NEED_SAVE_NONCLIPPED_SLICE_BMP = false;
    if (NEED_SAVE_NONCLIPPED_SLICE_BMP) {
      const TEST_SAVE_VOL_FILE_NAME = 'test_nonclipped_slice.bmp';
      const zSlice = Math.floor(this.m_zDim / NUM_2);
      ActiveVolume.saveVolumeSliceToFile(this.m_pixelsSrc,
        this.m_xDim, this.m_yDim, this.m_zDim, zSlice, TEST_SAVE_VOL_FILE_NAME);
    }

    // create clipped volume
    const resClip = VolumeClipper.clipVolumeByNonConvexGeo(this.m_pixelsSrc, this.m_xDim, this.m_yDim, this.m_zDim,
      volTexDst, geoRender, createType);
    if (resClip < 0) {
      console.log(`clipVolumeByNonConvexGeo returned ${resClip} !`);
    }

    // save result for deep debug
    const NEED_SAVE_CLIPPED_SLICE_BMP = false;
    if (needLog && NEED_SAVE_CLIPPED_SLICE_BMP) {
      const TEST_SLICE_SAVE_FILE_NAME = 'test_clipped_slice.bmp';
      const zSlice = Math.floor(this.m_zDim / NUM_2);
      ActiveVolume.saveVolumeSliceToFile(volTexDst,
        this.m_xDim, this.m_yDim, this.m_zDim, zSlice, TEST_SLICE_SAVE_FILE_NAME);
    }

    // Save clipped volume into KTX file
    const NEED_SAVE_CLIPPED_VOLUME_KTX = false;
    if (NEED_SAVE_CLIPPED_VOLUME_KTX) {
      const ktxVol = new KtxLoader();
      const xSize = this.m_xDim;
      const ySize = this.m_yDim;
      const zSize = this.m_zDim;
      ktxVol.createFromMemory(this.m_xDim, this.m_yDim, this.m_zDim, volTexDst, xSize, ySize, zSize);
      const TEST_CLIPPED_VOL_KTX_NAME = 'test_clipped.ktx';
      ktxVol.writeFile(TEST_CLIPPED_VOL_KTX_NAME);
    }
    return +1;
  } // skullRemove

  static getBoundingBox(xDim, yDim, zDim, volTexSrc, vMin, vMax) {
    const MIN_VIS_COLOR = 50;
    let x, y, z;
    vMax.set(0.0, 0.0, 0.0);
    vMin.set(xDim, yDim, zDim);
    let ind = 0;
    for (z = 0; z < zDim; z++) {
      for (y = 0; y < yDim; y++) {
        for (x = 0; x < xDim; x++) {
          const val = volTexSrc[ind];
          ind++;
          if (val < MIN_VIS_COLOR) {
            continue;
          }
          // update bbox
          vMin.x = (x < vMin.x) ? x : vMin.x;
          vMin.y = (y < vMin.y) ? y : vMin.y;
          vMin.z = (z < vMin.z) ? z : vMin.z;
          vMax.x = (x > vMax.x) ? x : vMax.x;
          vMax.y = (y > vMax.y) ? y : vMax.y;
          vMax.z = (z > vMax.z) ? z : vMax.z;
        } // for (x)
      } // for (y)
    } // for (z)
  }

  /**
  * Save volume slice to BMP file. Only for deep debug
  * @param {array} pixelsSrc array of source voxels in volume
  * @param {number} xDim Volume dimension on x
  * @param {number} yDim Volume dimension on y
  * @param {number} zDim Volume dimension on z
  * @param {number} zSlice index of slice in volume
  * @param {string } fileName save file name
  */
  static saveVolumeSliceToFile(pixelsSrc, xDim, yDim, zDim, zSlice, fileName) {
    const SIZE_HEADER = 14;
    const SIZE_INFO = 40;
    const COMPS_IN_COLOR = 3;
    const numPixels = xDim * yDim;
    let pixStride = COMPS_IN_COLOR  * xDim;
    pixStride = (pixStride + COMPS_IN_COLOR) & (~COMPS_IN_COLOR);
    const totalBufSize = SIZE_HEADER + SIZE_INFO + (numPixels * COMPS_IN_COLOR);
    const buf = new Uint8Array(totalBufSize);
    for (let j = 0; j < totalBufSize; j++) {
      buf[j] = 0;
    }
    const BYTE_MASK = 255;
    const BITS_IN_BYTE = 8;
    // write header
    const BYTES_IN_DWORD = 4;

    let i = 0;
    // bfType[16]
    buf[i++] = 0x42;
    buf[i++] = 0x4D;
    // bfSize[32]
    let bfSize = SIZE_HEADER + SIZE_INFO + pixStride * yDim;
    buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK; bfSize >>= BITS_IN_BYTE;
    buf[i++] = bfSize & BYTE_MASK;
    // bfReserved1 + bfReserved2
    i += BYTES_IN_DWORD;
    // bfOffBits[32]
    let bfOffBits = SIZE_HEADER + SIZE_INFO;
    buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK; bfOffBits >>= BITS_IN_BYTE;
    buf[i++] = bfOffBits & BYTE_MASK;

    // write info

    // biSize[32]
    let biSize = SIZE_INFO;
    buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK; biSize >>= BITS_IN_BYTE;
    buf[i++] = biSize & BYTE_MASK;
    // biWidth[32]
    let biWidth = xDim;
    buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK; biWidth >>= BITS_IN_BYTE;
    buf[i++] = biWidth & BYTE_MASK;
    // biHeight[32]
    let biHeight = yDim;
    buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK; biHeight >>= BITS_IN_BYTE;
    buf[i++] = biHeight & BYTE_MASK;
    // biPlanes[16]
    buf[i++] = 1;
    buf[i++] = 0;
    // biBitCount[16]
    buf[i++] = 24;
    buf[i++] = 0;
    // biCompression[32]
    i += BYTES_IN_DWORD;
    // biSizeImage[32]
    let biSizeImage = pixStride * yDim;
    buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK; biSizeImage >>= BITS_IN_BYTE;
    buf[i++] = biSizeImage & BYTE_MASK;
    // biXPelsPerMeter[32]
    i += BYTES_IN_DWORD;
    // biYPelsPerMeter[32]
    i += BYTES_IN_DWORD;
    // biClrUsed[32]
    i += BYTES_IN_DWORD;
    // biClrImportant[32]
    i += BYTES_IN_DWORD;

    let j;
    // get max volume
    const offSlice = zSlice * xDim * yDim;
    let valMax = 0;
    for (j = 0; j < numPixels; j++) {
      const valGrey = pixelsSrc[offSlice + j];
      valMax = (valGrey > valMax) ? valGrey : valMax;
    } // for (j)
    console.log(`saveVolumeSlice. valMax = ${valMax}`);

    // write pixels
    const MAX_COLOR = 255;
    for (j = 0; j < numPixels; j++) {
      const valGrey = Math.floor(pixelsSrc[offSlice + j] * MAX_COLOR / valMax);
      // write rgb components
      buf[i++] = valGrey;
      buf[i++] = valGrey;
      buf[i++] = valGrey;
    } // for (j)

    // write buffer to file
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const linkGen = document.createElement('a');
    linkGen.setAttribute('href', url);
    linkGen.setAttribute('download', fileName);
    const eventGen = document.createEvent('MouseEvents');
    eventGen.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    linkGen.dispatchEvent(eventGen);
  }

  getPredictedStepsForActiveVolumeUpdate() {
    const TWO = 2;
    const hx = this.m_xDim / TWO;
    const hy = this.m_yDim / TWO;
    const hz = this.m_zDim / TWO;
    const xyMax = (hx > hy) ? hx : hy;
    const xyzMax = (xyMax > hz) ? xyMax : hz;
    const stepsAll = xyzMax + ACT_VOL_NUM_SMOOTH_STAGES;
    return stepsAll;
  }
  /**
  * Create members for iterations later
  * @return {number} 1, if success. <0 if failed
  */
  create(xDim, yDim, zDim, volTexSrc) {
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    this.m_pixelsSrc = volTexSrc;
    this.m_state = AV_STATE_NOT_STARTED;
    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    this.m_imageGauss = new Float32Array(numPixels);
    this.m_imageUniformity = new Float32Array(numPixels);
    this.m_verticesNew = null;
    // add checks
    if (volTexSrc.length !== numPixels) {
      // console.log(`ActiveVolume.create: Bad vol.expect data len=${numPixels},actual len=${volTexSrc.length}`);
      return 0;
    }
    return 1;
  }

  /**
  * Make special unifoirmity image for whole volume
  */
  makeUniformityImage(pixelsSrc, xDim, yDim, zDim,
    zStart, zEnd,
    pixelsGrad,
    pixelsDst,
    koefAlpha) {
    // radius neighbours
    const TWICE = 2;
    const RAD_UNI = 1;
    const DIA_UNI = (1 + TWICE * RAD_UNI);

    const SCALE_ALL_ELEMS = 1.0 / (DIA_UNI * DIA_UNI * DIA_UNI);
    let maxLen = 0.0;
    let cx, cy, cz;

    const zs = (zStart > RAD_UNI) ? zStart : RAD_UNI;
    const ze = (zEnd < zDim - RAD_UNI) ? zEnd : (zDim - RAD_UNI);

    for (cz = zs; cz < ze; cz++) {
      const czOff = cz * xDim * yDim;
      for (cy = RAD_UNI; cy < yDim - RAD_UNI; cy++) {
        const cyOff = cy * xDim;
        for (cx = RAD_UNI; cx < xDim - RAD_UNI; cx++) {
          let sumDx = 0.0;
          let sumDy = 0.0;
          let sumDz = 0.0;
          let dx, dy, dz;

          for (dz = -RAD_UNI; dz <= +RAD_UNI; dz++) {
            const z = cz + dz;
            const zOff = z * xDim * yDim;
            for (dy = -RAD_UNI; dy <= +RAD_UNI; dy++) {
              const y = cy + dy;
              const yOff = y * xDim;
              for (dx = -RAD_UNI; dx <= +RAD_UNI; dx++) {
                const x = cx + dx;
                const val = pixelsSrc[x + yOff + zOff];
                sumDx += val * dx;
                sumDy += val * dy;
                sumDz += val * dz;
              }     // for (dx)
            }       // for (dy)
          }         // for (dz)

          sumDx *= SCALE_ALL_ELEMS;
          sumDy *= SCALE_ALL_ELEMS;
          sumDz *= SCALE_ALL_ELEMS;

          const gradLen = Math.sqrt(sumDx * sumDx + sumDy * sumDy + sumDz * sumDz);
          maxLen = (gradLen > maxLen) ? gradLen : maxLen;

          pixelsGrad[cx + cyOff + czOff] = gradLen;
          pixelsDst[cx + cyOff + czOff] = Math.exp(-koefAlpha * gradLen);
        }         // for (cx)
      }           // for (cy)
    }             // for (cz)
  }

  /**
  * Start image smoothimg by Gauss convolution
  */
  startImageSmooth() {
    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    let i;
    for (i = 0; i < numPixels; i++) {
      this.m_imageGauss[i] = 0.0;
      this.m_imageUniformity[i] = 0.0;
    }
    this.m_imageSrc = new Float32Array(numPixels);
    this.m_imageGrad = new Float32Array(numPixels);
    for (i = 0; i < numPixels; i++) {
      this.m_imageGrad[i] = 0.0;
      const val = this.m_pixelsSrc[i];
      this.m_imageSrc[i] = val;
    }
    return 1;
  }
  /**
  * Stop volume smothing by Gauss
  */
  stopImageSmooth() {
    this.m_imageGrad = null;
    this.m_imageSrc = null;
  }
  applyPartGaussSmooth(zStart, zEnd, rad, sigma) {
    const TWICE = 2;
    const dia = 1 + TWICE * rad;
    // fill gauss matrix
    const THREE_DIMS = 3.0;
    const koef = 1.0 / (THREE_DIMS * sigma * sigma);
    let dx, dy, dz;
    let j = 0;
    if (zStart === 0) {
      const GAUSS_MAX_RAD = 9;
      const GAUSS_MAX_DIA = (1 + TWICE * GAUSS_MAX_RAD);
      this.m_gaussMatrix = new Float32Array(GAUSS_MAX_DIA * GAUSS_MAX_DIA * GAUSS_MAX_DIA);
      let wSum = 0.0;
      for (dz = -rad; dz <= +rad; dz++) {
        const fz = dz / rad;
        for (dy = -rad; dy <= +rad; dy++) {
          const fy = dy / rad;
          for (dx = -rad; dx <= +rad; dx++) {
            const fx = dx / rad;
            const dist2 = fx * fx + fy * fy + fz * fz;
            const weight = Math.exp(-1.0 * dist2 * koef);
            this.m_gaussMatrix[j++] = weight;
            wSum += weight;
          }
        }
      }     // for (dz)
      // normalize weights
      const numGaussElems = dia * dia * dia;
      const gScale = 1.0 / wSum;
      for (j = 0; j < numGaussElems; j++) {
        this.m_gaussMatrix[j] *= gScale;
      }
      const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
      for (j = 0; j < numPixels; j++) {
        this.m_imageGauss[j] = this.m_imageSrc[j];
      }
    }
    // apply gauss matrix to source image
    const zs = (zStart > rad) ? zStart : rad;
    const ze = (zEnd < this.m_zDim - rad) ? zEnd : (this.m_zDim - rad);
    let cx, cy, cz;
    for (cz = zs; cz < ze; cz++) {
      const czOff = cz * this.m_xDim * this.m_yDim;
      for (cy = rad; cy < this.m_yDim - rad; cy++) {
        const cyOff = cy * this.m_xDim;
        for (cx = rad; cx < this.m_xDim - rad; cx++) {
          let sum = 0.0;
          j = 0;
          for (dz = -rad; dz <= +rad; dz++) {
            const z = cz + dz;
            const zOff = z * this.m_xDim * this.m_yDim;
            for (dy = -rad; dy <= +rad; dy++) {
              const y = cy + dy;
              const yOff = y * this.m_xDim;
              for (dx = -rad; dx <= +rad; dx++) {
                const x = cx + dx;
                const weight = this.m_gaussMatrix[j++];
                const val = this.m_imageSrc[x + yOff + zOff];
                sum += val * weight;
              }   // for (dx)
            }     // for (dy)
          }       // for (dz)
          this.m_imageGauss[cx + cyOff + czOff] = sum;
        }     // for (cx)
      }       // for (cy)
    }         // for (cz)
  }
  /**
  * Smooth step
  */
  static smoothStep(minRange, maxRange, arg) {
    let t = (arg - minRange) / (maxRange - minRange);
    t = (t > 0.0) ? t : 0.0;
    t = (t < 1.0) ? t : 1.0;
    const NUM_2 = 2.0;
    const NUM_3 = 3.0;
    const res = t * t * (NUM_3 - NUM_2 * t);
    return res;
  }
  /**
  * Smooth 1d float array
  */
  static smoothArray(values, numValues, gaussRad, gaussSigma) {
    const dst = new Float32Array(AV_NUM_COLORS);
    const mult = 1.0 / (gaussSigma * gaussSigma);
    for (let ci = 0; ci < numValues; ci++) {
      let sum = 0.0;
      let sumWeight = 0.0;
      for (let di = -gaussRad; di <= +gaussRad; di++) {
        let i = ci + di;
        i = (i >= 0) ? i : 0;
        i = (i < numValues) ? i : (numValues - 1);
        const t = di / gaussRad;
        const weight = 1.0 / Math.exp(t * t * mult);
        sumWeight += weight;
        sum += values[i] * weight;
      }
      const valSmoothed = sum / sumWeight;
      dst[ci] = valSmoothed;
    }
    // copy back
    for (let i = 0; i < numValues; i++) {
      values[i] = dst[i];
    }
  }
  /**
  * Get histogram from gaussian smoothed image
  */
  getHistogram() {
    let i;
    for (i = 0; i < AV_NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
    }
    const numPixels = this.m_xDim * this.m_yDim * this.m_zDim;
    const MAX_COLOR = AV_NUM_COLORS - 1;
    for (i = 0; i < numPixels; i++) {
      let val = Math.floor(this.m_imageGauss[i]);
      val = (val < MAX_COLOR) ? val : MAX_COLOR;
      this.m_histogram[val]++;
    }
    // get probabilities of each color in histogram
    for (i = 0; i < AV_NUM_COLORS; i++) {
      const h = this.m_histogram[i];
      this.m_colorProbability[i] = h / numPixels;
    }
    // find min probability
    this.m_indexMinColor = 0;
    const MAGIC_PART_HIST = 64;
    for (i = 1; i < MAGIC_PART_HIST; i++) {
      const isCurMin = (this.m_colorProbability[i] < this.m_colorProbability[i + 1]) &&
        (this.m_colorProbability[i] < this.m_colorProbability[i - 1]);
      if (isCurMin) {
        this.m_indexMinColor = i;
        break;
      }
    }     // for (i) all first 64 colors in palette

    // build color koefs
    // const float POW_KOEF = 2.0;
    const POW_KOEF = 0.3;
    for (i = 0; i < AV_NUM_COLORS; i++) {
      const delta = Math.abs(i - this.m_indexMinColor);
      this.m_colorKoefs[i] = 1.0 - 1.0 / (1.0 + delta ** POW_KOEF);
    }

    // scan image near central line
    const SCAN_RANGE  = 4;
    const TWO = 2;
    const zMin = Math.floor(this.m_zDim / TWO - SCAN_RANGE);
    const zMax = Math.floor(this.m_zDim / TWO + SCAN_RANGE);
    const yMin = Math.floor(this.m_yDim / TWO - SCAN_RANGE);
    const yMax = Math.floor(this.m_yDim / TWO + SCAN_RANGE);
    const NUM_20 = 20.0;
    const NUM_526 = 526.0;
    const RATIO_BORDER = NUM_20 / NUM_526;
    const xMin = Math.floor(this.m_xDim * RATIO_BORDER);
    const xMax = Math.floor(this.m_xDim - xMin);

    // get black color on image border
    let colBlack = 0.0;
    let numPixelsBorder = 0;
    let x, y, z;

    for (z = zMin; z < zMax; z++) {
      const zOff = z * this.m_xDim * this.m_yDim;
      for (y = yMin; y < yMax; y++) {
        const yOff = y * this.m_xDim;
        for (x = 0; x < xMin; x++) {
          const off = x + yOff + zOff;
          colBlack += this.m_imageGauss[off];
          numPixelsBorder++;
        }
        for (x = xMax; x < this.m_xDim; x++) {
          const off = x + yOff + zOff;
          colBlack += this.m_imageGauss[off];
          numPixelsBorder++;
        }
      }
    }
    colBlack /= numPixelsBorder;

    // Find where border is started (Left and Right)

    const w2 = Math.floor(this.m_xDim / TWO);
    let xLeftMin = this.m_xDim;
    let xRightMax = 0;
    const VAL_BORDER_ADD  = 40.0;

    for (z = zMin; z < zMax; z++) {
      const zOff = z * this.m_xDim * this.m_yDim;
      for (y = yMin; y < yMax; y++) {
        const yOff = y * this.m_xDim;
        for (x = xMin; x < w2; x++) {
          const off = x + yOff + zOff;
          if (this.m_imageGauss[off] > colBlack + VAL_BORDER_ADD) {
            break;
          }
        }
        let xBorder = x;
        xLeftMin = (xBorder < xLeftMin) ? xBorder : xLeftMin;
        for (x = xMax; x > w2; x--) {
          const off = x + yOff + zOff;
          if (this.m_imageGauss[off] > colBlack + VAL_BORDER_ADD) {
            break;
          }
        }
        xBorder = x;
        xRightMax = (xBorder > xRightMax) ? xBorder : xRightMax;
      }   // for (y)
    }     // for (z)

    const NUM_512 = 512.0;
    const RANGE_SCAN = Math.floor(this.m_xDim * VAL_BORDER_ADD / NUM_512);

    const xLeftMax  = Math.floor(xLeftMin  + RANGE_SCAN);
    const xRightMin = Math.floor(xRightMax - RANGE_SCAN);

    // get hist
    for (i = 0; i < AV_NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
    }
    let numPixHist = 0;
    for (z = zMin; z < zMax; z++) {
      const zOff = z * this.m_xDim * this.m_yDim;
      for (y = yMin; y < yMax; y++) {
        const yOff = y * this.m_xDim;
        for (x = xLeftMin; x < xLeftMax; x++) {
          const off = x + yOff + zOff;
          const val = this.m_imageGauss[off];
          this.m_histogram[val]++;
          numPixHist++;
        }
        for (x = xRightMin; x < xRightMax; x++) {
          const off = x + yOff + zOff;
          const val = Math.floor(this.m_imageGauss[off]);
          this.m_histogram[val]++;
          numPixHist++;
        }
      }   // for (y)
    }     // for (z)
    // get probabilities of each color in histogram
    for (i = 0; i < AV_NUM_COLORS; i++) {
      const h = this.m_histogram[i];
      this.m_colorProbability[i] = h / numPixHist;
    }

    // smooth prob
    const GAUSS_RAD = 12;
    const GAUSS_SIGMA = 2.6;
    ActiveVolume.smoothArray(this.m_colorProbability, AV_NUM_COLORS, GAUSS_RAD, GAUSS_SIGMA);

    let maxProb = 0.0;
    for (i = 0; i < AV_NUM_COLORS; i++) {
      maxProb = (this.m_colorProbability[i] > maxProb) ? this.m_colorProbability[i] : maxProb;
    }

    const NUM_3 = 3.0;
    const probBarrier = maxProb * 1.0 / NUM_3;
    const NUM_COLS_HALF = 128;
    for (i = 0; i < NUM_COLS_HALF; i++) {
      if (this.m_colorProbability[i] >= probBarrier) {
        break;
      }
    }
    let indBlackL = i;
    for (i += 1; i < NUM_COLS_HALF; i++) {
      // if local min
      const isLocMin = (this.m_colorProbability[i] <= this.m_colorProbability[i - 1]) &&
        (this.m_colorProbability[i] <= this.m_colorProbability[i + 1]);
      if (isLocMin) {
        break;
      }
    }
    let indBlackR = i;

    // console.log(`getHistogram(). indBlackL = ${indBlackL}`);

    indBlackL -= TWO;
    indBlackR += TWO;

    for (i = 0; i < AV_NUM_COLORS; i++) {
      this.m_colorProbability[i] = ActiveVolume.smoothStep(indBlackL, indBlackR, i);
    }
    return 1;
  }

  resetStateForGeoUpdates() {
    this.m_geoStage = 0;
    this.m_state = AV_STATE_UPDATE_GEO;
    this.m_geoRender.createNormalsForGeometry();
  }

  resetStateToStartUpdates() {
    this.m_geoStage = 0;
    this.m_gaussStage = 0;
    this.m_state = AV_STATE_NOT_STARTED;
  }

  /**
  * Update render geo
  * @param {object} geo RederGeo to modify
  * @param {number} method Method
  * @return {number} 1, if success. < 0, if failed
  */
  updateGeo(geo, method) {
    if (geo === 'undefined') {
      console.log('ActiveVolume. updateGeo: geo undefined');
      const FAIL_UNDEF = -1;
      return FAIL_UNDEF;
    }
    if (geo === null) {
      console.log('ActiveVolume. updateGeo: geo null');
      const FAIL_NULL = -2;
      return FAIL_NULL;
    }

    if (this.m_state === AV_STATE_FINISHED) {
      return 1;
    }
    if (this.m_state === AV_STATE_NOT_STARTED) {
      // first update
      const okCreateNormals = geo.createNormalsForGeometry();
      if (okCreateNormals !== 1) {
        console.log('geo.createNormalsForGeometry returned fail');
        return okCreateNormals;
      }

      this.startImageSmooth();
      this.m_gaussStage = 0;
      this.m_state = AV_STATE_PREPARE_GAUSS;
    }
    if (this.m_state === AV_STATE_PREPARE_GAUSS) {
      const GAUSS_RAD = 2;
      const GAUSS_SIGMA = 1.8;
      const zStart  = Math.floor(this.m_zDim * (this.m_gaussStage + 0) / ACT_VOL_NUM_SMOOTH_STAGES);
      const zEnd    = Math.floor(this.m_zDim * (this.m_gaussStage + 1) / ACT_VOL_NUM_SMOOTH_STAGES);
      this.applyPartGaussSmooth(zStart, zEnd, GAUSS_RAD, GAUSS_SIGMA);

      this.m_gaussStage++;
      if (this.m_gaussStage >= ACT_VOL_NUM_SMOOTH_STAGES) {
        this.m_state = AV_STATE_PREPARE_UNIFORMITY;
        this.m_uniformityStage = 0;
        return 1;
      }
    }
    if (this.m_state === AV_STATE_PREPARE_UNIFORMITY) {
      const zStart = Math.floor(this.m_zDim * (this.m_uniformityStage + 0) / ACT_VOL_NUM_SMOOTH_STAGES);
      const zEnd = Math.floor(this.m_zDim * (this.m_uniformityStage + 1) / ACT_VOL_NUM_SMOOTH_STAGES);
      const KOEF_UNIFORMITY = 0.07;
      this.makeUniformityImage(this.m_imageGauss, this.m_xDim, this.m_yDim, this.m_zDim,
        zStart, zEnd, this.m_imageGrad, this.m_imageUniformity, KOEF_UNIFORMITY);
      this.m_uniformityStage++;
      if (this.m_uniformityStage >= ACT_VOL_NUM_SMOOTH_STAGES) {
        // DEBUG save
        const DEBUG_SAVE_UNI = false;
        if (DEBUG_SAVE_UNI) {
          const TEST_SAVE_UNI_FILE_NAME = 'uni.bmp';
          const TWO = 2;
          const zSlice = this.m_zDim / TWO;
          ActiveVolume.saveVolumeSliceToFile(this.m_imageUniformity,
            this.m_xDim, this.m_yDim, this.m_zDim, zSlice, TEST_SAVE_UNI_FILE_NAME);
        }

        // finally get image histogram
        this.getHistogram();
        this.stopImageSmooth();
        this.m_geoStage = 0;
        this.m_state = AV_STATE_UPDATE_GEO;
        return 1;
      }
    }

    if (this.m_state === AV_STATE_UPDATE_GEO) {
      if (this.m_verticesNew === null) {
        const numVertices = geo.getNumVertices();
        const COORDS_IN_VERTREX = 4;
        this.m_verticesNew = new Float32Array(numVertices * COORDS_IN_VERTREX);
      }

      const updateNormals       = (method & AV_METHOD_NORMALS) !== 0;
      const updateUniformity    = (method & AV_METHOD_UNIFORMITY) !== 0;
      const updateColorKoefs    = (method & AV_METHOD_COLOR_KOEFS) !== 0;

      const  SPEED_NORMALS     = 1.1;
      if (updateNormals && !updateUniformity) {
        this.updateGeoByVertexNormals(geo, SPEED_NORMALS);
      }
      if (updateNormals && updateUniformity && !updateColorKoefs) {
        this.updateGeoByVertexNormalsAndUniformity(geo, SPEED_NORMALS);
      }
      if (updateNormals && updateUniformity && updateColorKoefs) {
        const isFinished = this.updateGeoNormalsUniformityColors(geo, SPEED_NORMALS);
        if (isFinished) {
          console.log(`updateGeoNormalsUniformityColors is FINISHED. m_geoStage = ${this.m_geoStage}`);
          this.m_state = AV_STATE_FINISHED;
        }
      }
      this.m_geoStage++;
    } // if state is update geo
    return 1;
  }

  getAveUniformityForGeoVertices(geo) {
    let i, i4;
    const numVertices = geo.getNumVertices();
    const vertices = geo.getVertices();
    const xyDim = this.m_xDim * this.m_yDim;
    let uniAve = 0.0;
    const NUM_COMPS_VERTEX = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERTEX) {
      const v = new THREE.Vector3(vertices[i4 + OFF_0], vertices[i4 + OFF_1], vertices[i4 + OFF_2]);
      // pixel coordinate in the volume
      const x = Math.floor(v.x);
      const y = Math.floor(v.y);
      const z = Math.floor(v.z);

      const off = x + (y * this.m_xDim) + (z * xyDim);
      const uni = this.m_imageUniformity[off];
      uniAve += uni;
    }
    uniAve /= numVertices;
    return uniAve;
  }

  finalizeUpdatesGeo(geo, inDebugMode) {
    if (inDebugMode) {
      console.log(`geoUpdates are finished in ${this.m_updateCounter} steps`);
      const FILE_NAME_GEO = 'geo_final.obj';
      geo.saveGeoToObjFile(FILE_NAME_GEO);
    }
  }

  /**
  * Update geometry with normals, uniformity map and colors distribution
  * @param {object} geo RederGeo to modify
  * @param {number} normalSpeed speed for increase geo size
  */
  updateGeoNormalsUniformityColors(geo, normalSpeed) {
    const numVertices = geo.getNumVertices();
    // float array
    const vertices = geo.getVertices();
    // THREE.Vector3 array
    const normals = geo.getNormals();
    const numTriangles = geo.getNumTriangles();
    const indices = geo.getIndices();

    // perform laplasian smoother
    // ...
    if (this.m_lapSmoother === null) {
      this.m_lapSmoother = new LaplasianSmoother();
    }

    this.m_lapSmoother.performSmoothStep(numVertices, vertices, numTriangles, indices, this.m_verticesNew);

    const DEEP_DEBUG = false;

    // use smoothed vertices to update geo
    const NUM_COMPS_NORMAL = 3;
    const NUM_COMPS_VERTEX = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    let i, i3, i4;
    for (i = 0, i3 = 0, i4 = 0; i < numVertices; i++, i3 += NUM_COMPS_NORMAL, i4 += NUM_COMPS_VERTEX) {
      const v = new THREE.Vector3(vertices[i4 + OFF_0], vertices[i4 + OFF_1], vertices[i4 + OFF_2]);
      const vn = normals[i];

      // pixel coordinate in the volume
      let x = Math.floor(v.x);
      let y = Math.floor(v.y);
      let z = Math.floor(v.z);

      if (DEEP_DEBUG && (i === 0)) {
        console.log(`v = ${v.x}, ${v.y}, ${v.z}. int xyz = ${x},${y},${z}`);
        console.log(`vn = ${vn.x}, ${vn.y}, ${vn.z}`);
      }

      if (x >= this.m_xDim) {
        // console.log('assert x >= this.m_xDim');
        // return true;
        x = this.m_xDim - 1;
      }
      if (y >= this.m_yDim) {
        // console.log('assert y >= this.m_yDim');
        // return true;
        y = this.m_yDim - 1;
      }
      if (z >= this.m_zDim) {
        // console.log('assert z >= this.m_zDim');
        // return true;
        z = this.m_zDim - 1;
      }

      const xyDim = this.m_xDim * this.m_yDim;
      const off = x + (y * this.m_xDim) + (z * xyDim);
      const uni = this.m_imageUniformity[off];
      const valGaussCur = this.m_imageGauss[off];

      if (DEEP_DEBUG && (i === 0)) {
        console.log(`uni = ${uni}, valGaussCur = ${valGaussCur}`);
      }

      let compSum = uni;
      // predict next position
      const NEXT_STEP = 2.5;
      let nx = Math.floor(v.x + vn.x * NEXT_STEP);
      let ny = Math.floor(v.y + vn.y * NEXT_STEP);
      let nz = Math.floor(v.z + vn.z * NEXT_STEP);

      if (DEEP_DEBUG && (i === 0)) {
        console.log(`nx = ${nx}, ny = ${ny}, nz = ${nz}`);
      }

      if (nx >= this.m_xDim) {
        // console.log('assert nx >= this.m_xDim');
        // return true;
        nx = this.m_xDim - 1;
      }
      if (ny >= this.m_yDim) {
        // console.log('assert ny >= this.m_yDim');
        // return true;
        ny = this.m_yDim - 1;
      }
      if (nz >= this.m_zDim) {
        // console.log('assert nz >= this.m_zDim');
        // return true;
        nz = this.m_zDim - 1;
      }

      const nextOff = nx + (ny * this.m_xDim) + (nz * xyDim);
      const valGaussNext = this.m_imageGauss[nextOff];
      const KOEF_GAUSS_DEC_MULT = 0.3;
      if (valGaussNext > valGaussCur) {
        compSum *= KOEF_GAUSS_DEC_MULT;
      }

      if (DEEP_DEBUG && (i === 0)) {
        console.log(`valGaussNext = ${valGaussNext}`);
      }

      // use colors
      const koef = this.m_colorProbability[Math.floor(valGaussCur)];
      compSum *= koef;
      const COLOR_MATCH = 0.9;
      const isColorMatch = (koef <= COLOR_MATCH);

      if (DEEP_DEBUG && (i === 0)) {
        console.log(`koef = ${koef}, isColorMatch = ${isColorMatch}`);
      }

      const vAddSmooth = new THREE.Vector3();
      vAddSmooth.x = this.m_verticesNew[i4 + OFF_0] - v.x;
      vAddSmooth.y = this.m_verticesNew[i4 + OFF_1] - v.y;
      vAddSmooth.z = this.m_verticesNew[i4 + OFF_2] - v.z;
      vAddSmooth.normalize();
      vAddSmooth.multiplyScalar(normalSpeed);

      const vAddGeo = new THREE.Vector3();
      vAddGeo.x = vn.x * compSum * normalSpeed;
      vAddGeo.y = vn.y * compSum * normalSpeed;
      vAddGeo.z = vn.z * compSum * normalSpeed;

      if (DEEP_DEBUG && (i === 0)) {
        console.log(`vAddSmooth = ${vAddSmooth.x}, ${vAddSmooth.y}, ${vAddSmooth.z}`);
        console.log(`vAddGeo = ${vAddGeo.x}, ${vAddGeo.y}, ${vAddGeo.z}`);
      }

      const KOEF_ADD_SMOOTH = 0.3;
      const KOEF_ADD_GEO = (1.0 - KOEF_ADD_SMOOTH);

      if (isColorMatch) {
        // do nothing
      } else {
        const vNew = new THREE.Vector3();
        vNew.x = v.x + vAddGeo.x * KOEF_ADD_GEO + vAddSmooth.x * KOEF_ADD_SMOOTH;
        vNew.y = v.y + vAddGeo.y * KOEF_ADD_GEO + vAddSmooth.y * KOEF_ADD_SMOOTH;
        vNew.z = v.z + vAddGeo.z * KOEF_ADD_GEO + vAddSmooth.z * KOEF_ADD_SMOOTH;

        v.set(vNew.x, vNew.y, vNew.z);
      }

      this.m_verticesNew[i4 + OFF_0] = v.x;
      this.m_verticesNew[i4 + OFF_1] = v.y;
      this.m_verticesNew[i4 + OFF_2] = v.z;
    } // for i

    // copy back
    let errAve = 0.0;
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERTEX) {
      // estimate error of modification
      const dx = this.m_verticesNew[i4 + OFF_0] - vertices[i4 + OFF_0];
      const dy = this.m_verticesNew[i4 + OFF_1] - vertices[i4 + OFF_1];
      const dz = this.m_verticesNew[i4 + OFF_2] - vertices[i4 + OFF_2];
      const err = dx * dx + dy * dy + dz * dz;
      errAve += err;

      vertices[i4 + OFF_0] = this.m_verticesNew[i4 + OFF_0];
      vertices[i4 + OFF_1] = this.m_verticesNew[i4 + OFF_1];
      vertices[i4 + OFF_2] = this.m_verticesNew[i4 + OFF_2];
    }
    errAve /= numVertices;
    errAve = Math.sqrt(errAve);
    const DIF_VERTICES_LIMIT = 0.12;
    if (errAve < DIF_VERTICES_LIMIT) {
      this.finalizeUpdatesGeo(geo, DEEP_DEBUG);
      return true;
    }
    const aveUni = this.getAveUniformityForGeoVertices(geo);
    const VERTICES_UNIFORMITY = 0.46;
    if (aveUni < VERTICES_UNIFORMITY) {
      this.finalizeUpdatesGeo(geo, DEEP_DEBUG);
      return true;
    }

    const DEEP_ERR_DEBUG = false;
    if (DEEP_ERR_DEBUG) {
      console.log(`Iters errAve = ${errAve} < ${DIF_VERTICES_LIMIT}. aveUni = ${aveUni} < ${VERTICES_UNIFORMITY}`);
    }

    return false;
  } // updateGeoNormalsUniformityColors

} // class ActiveVolume

/** Output flags */
ActiveVolume.REMOVE_SKULL = 0;
ActiveVolume.CREATE_MASK = 1;
