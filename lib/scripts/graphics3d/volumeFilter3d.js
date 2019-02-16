/* eslint-disable no-magic-numbers */
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
 * 3D volume processing engine: blur, contrast filter
 * @module lib/scripts/graphics3d/volumeFilter3d
 */

import * as THREE from 'three';
import MaterialBlur from '../gfx/matblur';
import GlSelector from './glselector';
import MaterialAO from '../gfx/matAO';
import TetrahedronGenerator from '../actvolume/tetra';

const tools3dEraser = {
  TAN: 'tan',
  NORM: 'norm',
  FILL: 'fill'
};

/** Class Graphics3d is used for 3d render */
export default class VolumeFilter3d {
  constructor() {
    this.texVolumeAO = null;
    this.sceneBlur = null;
    this.material = null;
    this.cameraOrtho = null;
    this.rendererBlur = null;
    this.selectedROIs = null;
    this.numTfPixels = 0;
    this.transferFuncRgba = null;
    this.texRoiColor = null;
    this.texRoiId = null;
    this.lastSize = [];
    this.lastDepth = [];
    this.lastRotationVector = [];
    this.lastTarget = [];
    this.lastMode = [];
    this.lastBackDistance = [];
    this.resetflag = false;
    this.sceneAO = null;
    this.rendererAO = null;
    this.vectors = null;
    this.vectorsTex = null;
    this.texVolumeAO = null;
    this.xDim = 0;
    this.yDim = 0;
    this.zDim = 0;
    this.zDimSqrt = 0;
    this.initMatBlure = 0;

  }

  /**
   * Filtering the source data and building the normals on the GPU
   * @param isRoiVolume
   * @param roiColors Array of roi colors in RGBA format
   */
  initRenderer(isRoiVolume, roiColors) {
    const c4 = 4;
    this.sceneBlur = new THREE.Scene();
    const blurSigma = 0.8;
    this.numRois = 256;
    // eslint-disable-next-line
    this.cameraOrtho = new THREE.OrthographicCamera(this.xDim / -2, this.xDim / 2, this.yDim / 2, this.yDim / -2, 0.1, 100);
    const glSelector = new GlSelector();
    this.context = glSelector.createWebGLContext();
    this.canvas3d = glSelector.getCanvas();
    this.rendererBlur = new THREE.WebGLRenderer({
      canvas: this.canvas3d,
      context: this.context
    });

    console.log('rendererBlur done');
    const geometryBlur = new THREE.PlaneGeometry(1.0, 1.0);
    // eslint-disable-next-line
    this.selectedROIs = new Uint8Array(c4 * this.numRois);
    this.numTfPixels = 256;
    // eslint-disable-next-line
    this.transferFuncRgba = new Uint8Array(c4 * this.numTfPixels);
    this.rendererBlur.setSize(this.xDim, this.yDim);
    //
    //const gl = this.rendererBlur.getContext();
    //this.webglTextureRT = gl.createTexture();
    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    // remove old mesh
    const matBlur = new MaterialBlur();
    this.texRoiColor = null;
    // this.texRoiId = null;
    // this.RoiVolumeTex = null;
    if (isRoiVolume) {
      this.texRoiId = this.createSelectedRoiMap();
      this.texRoiColor = this.createRoiColorMap(roiColors);
      console.log('roi volume textures done');
    }
    matBlur.create(this.origVolumeTex, this.RoiVolumeTex, texelSize, this.texRoiColor, this.texRoiId, (mat) => {
      const mesh = new THREE.Mesh(geometryBlur, mat);
      mat.uniforms.tileCountX.value = this.zDimSqrt;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      mat.uniforms.xDim.value = this.xDim;
      mat.uniforms.yDim.value = this.yDim;
      mat.defines.useWebGL2 = this.isWebGL2;
      this.material = mat;
      this.sceneBlur.add(mesh);
      if (isRoiVolume === false) {
        this.switchToBlurRender();
      } else {
        this.switchToRoiMapRender();
        //this.setVolumeTexture(blurSigma);
      }
      // render with blur and copy pixels back to this.bufferRgba
      console.log(`isRoiVolume: ${isRoiVolume}`);
      this.setVolumeTexture(blurSigma);
    });
    this.vectorsTex = null;
    //this.setAmbientTexture();
  }

  gettexVolumeAO() {
    return this.texVolumeAO;
  }

  /**
   * Create 2D texture containing transfer func colors
  */
  createTransferFuncTexture() {
    let textureOut = null;
    let alpha = 0;
    const SCALE = 255;
    const SCALE1 = 12.0;
    const SCALE2 = 3.0;
    const A1 = 0.09;
    const A2 = 0.2;
    const A3 = 0.3;
    const A4 = 0.43;
    const A5 = 0.53;
    const a1 = A1 * SCALE;
    const a2 = A2 * SCALE;
    const a3 = A3 * SCALE;
    const a4 = A4 * SCALE;
    const a5 = A5 * SCALE;
    const COLOR_R = 255;
    const COLOR_G = 210;
    const COLOR_B = 180;
    const FOUR = 4;
    for (let pix = 0; pix < this.numTfPixels; pix++) {
      if (pix > a1 && pix < a2) {
        alpha = (pix - a1) / (a2 - a1);
      }
      if (pix > a2 && pix < a3) {
        alpha = (a3 - pix) / (a3 - a2);
      }
      if (pix > a4 && pix < a5) {
        alpha = (pix - a4) / (a5 - a4);
      }
      if (pix > a5) {
        alpha = 1;
      }
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 0] = SCALE;
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 1] = 0;
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 1 + 1] = 0;
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 1 + 1 + 1] = SCALE * alpha / SCALE1;
      if (pix > a4) {
        this.transferFuncRgba[pix * FOUR + 0] = COLOR_R;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * FOUR + 1] = COLOR_G;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * FOUR + 1 + 1] = COLOR_B;
        this.transferFuncRgba[pix * FOUR + 1 + 1 + 1] = SCALE * alpha / SCALE2;
      }
    }
    textureOut = new THREE.DataTexture(this.transferFuncRgba, this.numTfPixels, 1, THREE.RGBAFormat);

    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    textureOut.magFilter = THREE.NearestFilter;
    textureOut.minFilter = THREE.NearestFilter;
    textureOut.needsUpdate = true;
    this.transferFuncTexture = textureOut;
    return textureOut;
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of control points of type HEX  = color value
   */
  setTransferFuncColors(ctrlPtsColorsHex) {
    this.transferFuncCtrlPtsRgb = [];
    for (let i = 0; i < ctrlPtsColorsHex.length; i++) {
      const color = new THREE.Color(ctrlPtsColorsHex[i]);
      this.transferFuncCtrlPtsRgb.push(new THREE.Vector3(color.r, color.g, color.b));
    }
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of Vector2 where (x,y) = x coordinate in [0, 1], alpha value in [0, 1]
   * //intensity [0,255] opacity [0,1]
   */
  updateTransferFuncTexture(intensities, opacities) {
    if (this.transferFuncRgba === null) {
      return null;
    }
    for (let curPt = 0; curPt < intensities.length - 1; curPt++) {
      const pixStart = Math.floor(intensities[curPt]);
      const pixEnd = Math.floor(intensities[curPt + 1]);
      for (let pix = pixStart; pix < pixEnd; pix++) {
        const lerpVal = (pix - pixStart) / (pixEnd - pixStart);
        const color = new THREE.Vector3();
        color.lerpVectors(this.transferFuncCtrlPtsRgb[curPt],
          this.transferFuncCtrlPtsRgb[curPt + 1], lerpVal);
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 0] = color.x * 255;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 1] = color.y * 255;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 2] = color.z * 255;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 3] = (opacities[curPt + 1] * lerpVal + (1.0 - lerpVal) * opacities[curPt]) * 255;
      }
    }
    this.transferFuncTexture.needsUpdate = true;
    return this.transferFuncRgba;
  }

  /**
   * Setting a variable for conditional compilation (Roi Render)
   */
  switchToRoiMapRender() {
    this.material.defines.renderRoiMap = 1;
    this.material.needsUpdate = true;
  }

  /**
   * Setting a variable for conditional compilation (Blur)
   */
  switchToBlurRender() {
    this.material.defines.renderRoiMap = 0;
    this.material.needsUpdate = true;
  }
  /**
   * Filtering the source data and building the normals on the GPU
   * @param blurSigma Gauss sigma parameter
   */
  setVolumeTexture(blurSigma) {
    if ((!this.material) || (typeof this.material === 'undefined')) {
      console.log('blur material null');
      return;
    }
    console.log('blur material NOT null');
    if (this.isWebGL2 === 0) {
      this.setVolumeTextureWebGL1(blurSigma);
    } else {
      this.setVolumeTextureWebGL2(blurSigma);
    }
    this.updatableTexture.needsUpdate = true;
  }

  setVolumeTextureWebGL1(blurSigma) {
    const VAL_1 = 1;
    const VAL_2 = 2;
    const VAL_3 = 3;
    const VAL_4 = 4;
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    const tmpRgba = new Uint8Array(VAL_4 * this.xDim * this.yDim);
    let k = 0;
    console.log('Blur WebGL1');
    const w = this.xDim * this.zDimSqrt;
    for (let j = 0; j < this.zDimSqrt; j++) {
      for (let i = 0; i < this.zDimSqrt; i++) {
        this.material.uniforms.curZ.value = k / this.zDim;
        k++;
        if (k > this.zDim) {
          break;
        }
        this.material.uniforms.curZ.needsUpdate = true;
        //console.log(`curZ: ${k}, ${this.zDimSqrt}, ${this.material.uniforms.curZ.value}, ${this.zDim}`);
        this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
        const gl = this.rendererBlur.getContext();
        gl.readPixels(0, 0, this.xDim, this.yDim, gl.RGBA, gl.UNSIGNED_BYTE, tmpRgba);
        const start = i  * this.xDim + j * w * this.yDim;
        for (let y = 0; y < this.yDim; y++) {
          for (let x = 0; x < this.xDim; x++) {
            if (this.isRoiVolume) {
              const indxL = VAL_4 * (x + y * w  + start);
              const indxR = VAL_4 * (x + y * this.xDim);
              //const indxR = VAL_4 * (x + y * this.xDim);
              //const t = 255.0 * indxR / (VAL_4 * this.xDim * this.yDim);

              this.bufferTextureCPU[indxL] = tmpRgba[indxR];
              //255.0 * k / this.zDim;//this.bufferR[indxR];//tmpRgba[indxR];
              this.bufferTextureCPU[indxL + VAL_1] = tmpRgba[indxR + VAL_1];
              //0.0;//255.0 * k / this.zDim;//this.bufferR[indxR];//tmpRgba[indxR + VAL_1];
              this.bufferTextureCPU[indxL + VAL_2] = tmpRgba[indxR + VAL_2];
              //0.0;//255.0 * k / this.zDim;//this.bufferR[indxR];//tmpRgba[indxR + VAL_2];
              this.bufferTextureCPU[indxL + VAL_3] = tmpRgba[indxR + VAL_3];
              //255.0 * k / this.zDim;//this.bufferR[indxR];//tmpRgba[indxR + VAL_3];
            } else {
              this.bufferTextureCPU[x + y * w  + start] = tmpRgba[VAL_4 * (x + y * this.xDim)]; //256.0 * k / this.zDim;
            }
          }
        }
      }
    }
  }

  setVolumeTextureWebGL2(blurSigma) {
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    const VAL_1 = 1;
    const VAL_2 = 2;
    const VAL_3 = 3;
    const VAL_4 = 4;
    const frameBuf = new Uint8Array(VAL_4 * this.xDim * this.yDim);
    const gl = this.rendererBlur.getContext();
    console.log('Blur WebGL2');
    for (let z = 1; z < this.zDim - 1; ++z) {
      this.material.uniforms.curZ.value = z / this.zDim;
      this.material.uniforms.curZ.needsUpdate = true;

      this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
      gl.readPixels(0, 0, this.xDim, this.yDim, gl.RGBA, gl.UNSIGNED_BYTE, frameBuf);
      const zOffs = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        for (let x = 0; x < this.xDim; x++) {
          if (this.isRoiVolume) {
            const indxR = VAL_4 * (x + y * this.xDim);
            const indxL = indxR + zOffs * VAL_4;
            this.bufferTextureCPU[indxL] = frameBuf[indxR];
            this.bufferTextureCPU[indxL + VAL_1] = frameBuf[indxR + VAL_1];
            this.bufferTextureCPU[indxL + VAL_2] = frameBuf[indxR + VAL_2];
            this.bufferTextureCPU[indxL + VAL_3] = frameBuf[indxR + VAL_3];
          } else {
            this.bufferTextureCPU[x + y * this.xDim + zOffs] =
              frameBuf[VAL_4 * (x + y * this.xDim)]; //256.0 * k / this.zDim;
          }
        }
      }
    }
  }

  setAOVectorTex() {
    const VAL_4 = 4;
    const VAL_255 = 255;
    const gen = new TetrahedronGenerator();
    const vRadius = new THREE.Vector3(0.5, 0.5, 0.5);
    const NUM_SUBDIVIDES = 2;
    const okCreateTetra = gen.create(vRadius, NUM_SUBDIVIDES);
    if (okCreateTetra < 1) {
      return;
    }
    this.numAOVectors = gen.getNumVertices();

    this.vectors = new Uint8Array(VAL_4 * this.numAOVectors);

    for (let i = 0; i < this.numAOVectors; i++) {
      const vert = gen.getVertex(i);
      this.vectors[i * VAL_4 + 0] = (vert.x + 0.5) * VAL_255;
      this.vectors[i * VAL_4 + 1] = (vert.y + 0.5) * VAL_255;
      this.vectors[i * VAL_4 + 2] = (vert.z + 0.5) * VAL_255;
      this.vectors[i * VAL_4 + 3] = VAL_255;
    }

    this.vectorsTex = new THREE.DataTexture(this.vectors, this.numAOVectors, 1, THREE.RGBAFormat);
    this.vectorsTex.wrapS = THREE.ClampToEdgeWrapping;
    this.vectorsTex.wrapT = THREE.ClampToEdgeWrapping;
    this.vectorsTex.magFilter = THREE.NearestFilter;
    this.vectorsTex.minFilter = THREE.NearestFilter;
    this.vectorsTex.needsUpdate = true;
  }

  setAmbientTexture(isoThreshold) {
    if (this.vectorsTex === null) {
      this.setAOVectorTex();
    }
    this.xDimAO = this.xDim;
    this.yDimAO = this.yDim;
    this.zDimAO = this.zDim;
    this.bufferTextureAO = new THREE.WebGLRenderTarget(this.xDimAO,
      this.yDimAO, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });

    this.ambientVolumeTexCPU = new Uint8Array(this.xDimAO * this.yDimAO * this.zDimAO);
    if (this.isWebGL2 === 0) {
      this.texVolumeAO = new THREE.DataTexture(this.ambientVolumeTexCPU, this.xTex, this.yTex, THREE.AlphaFormat);
    } else {
      this.texVolumeAO = new THREE.DataTexture3D(this.ambientVolumeTexCPU, this.xDimAO, this.yDimAO, this.zDimAO);
      this.texVolumeAO.format = THREE.RedFormat;
      this.texVolumeAO.type = THREE.UnsignedByteType;
    }
    this.texVolumeAO.wrapS = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.wrapT = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.wrapR = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.magFilter = THREE.LinearFilter;
    this.texVolumeAO.minFilter = THREE.LinearFilter;
    this.texVolumeAO.needsUpdate = true;

    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    const matAO = new MaterialAO();
    matAO.create(this.updatableTexture, texelSize, this.vectorsTex, this.numAOVectors, isoThreshold, (mat) => {
      this.materialAO = mat;
      mat.uniforms.tileCountX.value = this.zTexDivSqrt;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      if (this.isWebGL2 === 0) {
        // this.setVolumeTextureWebGL1(blurSigma);
      } else {
        this.setAmbientTextureWebGL2();
      }
      this.texVolumeAO.needsUpdate = true;
    });
  }

  setAmbientTextureWebGL2() {
    const VAL_4 = 4;
    const frameBuf = new Uint8Array(VAL_4 * this.xDimAO * this.yDimAO);
    const gl = this.rendererBlur.getContext();
    console.log('AO WebGL2');
    for (let z = 0; z < this.zDimAO; ++z) {
      this.materialAO.uniforms.curZ.value = z / (this.zDimAO - 1);
      this.materialAO.uniforms.curZ.needsUpdate = true;
      this.sceneBlur.overrideMaterial = this.materialAO;
      this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTextureAO);
      this.sceneBlur.overrideMaterial = null;
      gl.readPixels(0, 0, this.xDimAO, this.yDimAO, gl.RGBA, gl.UNSIGNED_BYTE, frameBuf);
      const zOffs = z * this.xDimAO * this.yDimAO;
      for (let y = 0; y < this.yDimAO; y++) {
        for (let x = 0; x < this.xDimAO; x++) {
          this.ambientVolumeTexCPU[x + y * this.xDimAO + zOffs] =
            frameBuf[VAL_4 * (x + y * this.xDimAO)]; //256.0 * k / this.zDim;
        }
      }
    }
  }

  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  setBufferRgbaFrom1Byte() {
    const OFF0 = 0;
    this.bufferTextureCPU = new Uint8Array(this.numPixelsBuffer);
    this.bufferR = new Uint8Array(this.numPixelsBuffer);
    // Fill initial rgba array
    for (let yTile = 0; yTile < this.zDimSqrt; yTile++) {
      const yTileOff = (yTile * this.yDim) * this.xTex;
      for (let xTile = 0; xTile < this.zDimSqrt; xTile++) {
        const xTileOff = xTile * this.xDim;
        const zVol = xTile + (yTile * this.zDimSqrt);
        if (zVol >= this.zDim) {
          break;
        }
        const zVolOff = zVol * this.xDim * this.yDim;
        for (let y = 0; y < this.yDim; y++) {
          const yVol = y;
          const yVolOff = yVol * this.xDim;
          for (let x = 0; x < this.xDim; x++) {
            const xVol = x;

            const offSrc = (xVol + yVolOff + zVolOff);
            const valInt = this.arrPixels[offSrc + 0];
            const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
            this.bufferR[offDst + OFF0] = valInt;
            this.bufferTextureCPU[offDst + OFF0] = valInt;
          }
        }
      }
    }
    console.log('setBufferRgbaFrom1Bytes');

  }

  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  set3DTextureFrom1Byte() {
    const OFF0 = 0;
    this.bufferTextureCPU = new Uint8Array(this.xDim * this.yDim * this.zDim);
    this.bufferR = new Uint8Array(this.xDim * this.yDim * this.zDim);
    // Fill initial rgba array
    for (let z = 0; z < this.zDim; z++) {
      const zVolOff = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        const yVol = y;
        const yVolOff = yVol * this.xDim;
        for (let x = 0; x < this.xDim; x++) {
          const xVol = x;
          const offSrc = (xVol + yVolOff + zVolOff);
          let valInt = this.arrPixels[offSrc + 0];
          const offDst = offSrc;
          if (this.zDim > 5 && (z === 0 || z === this.zDim - 1)) {
            valInt = 0;
          }
          this.bufferR[offDst + OFF0] = valInt;
          this.bufferTextureCPU[offDst + OFF0] = valInt;
        }
      }
    }
    console.log('setBufferRgbaFrom1Bytes for 3d texture');
  }
  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  setBufferRgbaFrom4Bytes() {
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const BID = 4;
    if (this.isRoiVolume) {
      this.bufferRoi = new Uint8Array(this.numPixelsBuffer);
      const c4 = 4;
      this.bufferTextureCPU = new Uint8Array(c4 * this.numPixelsBuffer);
      console.log('ROI');
    }
    this.bufferR = new Uint8Array(this.numPixelsBuffer);

    // Fill initial rgba array
    for (let yTile = 0; yTile < this.zDimSqrt; yTile++) {
      const yTileOff = (yTile * this.yDim) * this.xTex;
      for (let xTile = 0; xTile < this.zDimSqrt; xTile++) {
        const xTileOff = xTile * this.xDim;
        const zVol = xTile + (yTile * this.zDimSqrt);
        if (zVol >= this.zDim) {
          break;
        }
        const zVolOff = zVol * this.xDim * this.yDim;
        for (let y = 0; y < this.yDim; y++) {
          const yVol = y;
          const yVolOff = yVol * this.xDim;
          for (let x = 0; x < this.xDim; x++) {
            const xVol = x;

            const offSrc = (xVol + yVolOff + zVolOff) * BID;
            const valInt = this.arrPixels[offSrc + 0];
            const valRoi = this.arrPixels[offSrc + OFF3];
            const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
            this.bufferR[offDst + OFF0] = valRoi;
            this.bufferTextureCPU[BID * offDst + OFF0] = valInt;
            this.bufferTextureCPU[BID * offDst + OFF1] = valInt;
            this.bufferTextureCPU[BID * offDst + OFF2] = valInt;
            // this.bufferTextureCPU[BID * offDst + OFF3] =
            // 255.0 * zVol * (x + y) / ( this.zDimSqrt * this.zDimSqrt * (this.xDim + this.yDim));
            this.bufferTextureCPU[BID * offDst + OFF3] = valInt;
            this.bufferRoi[offDst + OFF0] = valRoi;

          }
        }
      }
    }
    console.log('setBufferRgbaFrom4Bytes');
  }
  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  set3DTextureFrom4Bytes() {
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const BID = 4;
    if (this.isRoiVolume) {
      this.bufferRoi = new Uint8Array(this.xDim * this.yDim * this.zDim);
      this.bufferTextureCPU = new Uint8Array(BID * this.xDim * this.yDim * this.zDim);
      console.log('ROI');
    }
    this.bufferR = new Uint8Array(this.xDim * this.yDim * this.zDim);
    // Fill initial rgba array
    for (let z = 0; z < this.zDim; z++) {
      const zVolOff = z * this.xDim * this.yDim;
      for (let y = 0; y < this.yDim; y++) {
        const yVol = y;
        const yVolOff = yVol * this.xDim;
        for (let x = 0; x < this.xDim; x++) {
          const xVol = x;

          const offSrc = (xVol + yVolOff + zVolOff) * BID;
          const valInt = this.arrPixels[offSrc + 0];
          const valRoi = this.arrPixels[offSrc + OFF3];
          const offDst = xVol + yVolOff + zVolOff;
          this.bufferR[offDst + OFF0] = valRoi;
          this.bufferTextureCPU[BID * offDst + OFF0] = valInt;
          this.bufferTextureCPU[BID * offDst + OFF1] = valInt;
          this.bufferTextureCPU[BID * offDst + OFF2] = valInt;
          this.bufferTextureCPU[BID * offDst + OFF3] = valInt;
          this.bufferRoi[offDst + OFF0] = valRoi;
        }
      }
    }
    console.log('setBufferRgbaFrom4Bytes for 3D texture');
  }
  getOffDstValueByXYZ(mainX, mainY, mainZ) {
    if (this.isWebGL2 === 0) {
      const yTile = Math.floor(mainZ / this.zDimSqrt);
      const xTile = mainZ - this.zDimSqrt * yTile;
      const yTileOff = (yTile * this.yDim) * this.xTex;
      const xTileOff = xTile * this.xDim;
      return yTileOff + (mainY * this.xTex) + xTileOff + mainX;
    } else {
      return mainX + mainY * this.xTex + mainZ * this.xTex * this.yTex;
    }
  }

  erasePixels(x_, y_, z_, size, depth, vDir, isothreshold, startflag, mouseup, normalmode, length) {
    if (mouseup === true) {
      this.resetflag = false;
      this.prevDistance = null;
      return;
    }
    const targetX = Math.floor(x_ * this.xDim);
    const targetY = Math.floor(y_ * this.yDim);
    const targetZ = Math.floor(z_ * this.zDim);

    //console.log(`${Math.abs(this.prevPos - targetX - targetY - targetZ)}`);
    //if ( Math.abs(this.prevPos - (targetX + targetY + targetZ)) <= radius) {
    console.log(`Target erasePixels: ${targetX}, ${targetY}, ${targetZ}`);
    const normal = new THREE.Vector3();
    const normalGauss = new THREE.Vector3();
    const GAUSS_R = 2;
    const SIGMA = 1.4;
    const SIGMA2 = SIGMA * SIGMA;
    let nX = 0;
    let nY = 0;
    let nZ = 0;
    let normFactor = 0;
    let offDst = 0;
    const VAL_2 = 2; // getting normal of surface
    for (let k = -Math.min(GAUSS_R, targetZ); k <= Math.min(GAUSS_R, this.zDim - 1 - targetZ); k++) {
      for (let j = -Math.min(GAUSS_R, targetY); j <= Math.min(GAUSS_R, this.yDim - 1 - targetY); j++) {
        for (let i = -Math.min(GAUSS_R, targetX); i <= Math.min(GAUSS_R, this.xDim - 1 - targetX); i++) {
          // handling voxel:
          // (targetX + i; ,targetY+ j; targetZ + k);
          const gX = targetX + i;
          const gY = targetY + j;
          const gZ = targetZ + k;
          if (this.isWebGL2 === 0) {
            const yTile = Math.floor(gZ / this.zDimSqrt);
            const xTile = gZ - this.zDimSqrt * yTile;
            const yTileOff = (yTile * this.yDim) * this.xTex;
            const xTileOff = xTile * this.xDim;
            offDst = yTileOff + (gY * this.xTex) + xTileOff + gX;
          } else {
            offDst = gX + gY * this.xDim + gZ * this.xDim * this.yDim;
          }
          const gauss = 1 - Math.exp(-(i * i + j * j + k * k) / (VAL_2 * SIGMA2));
          normFactor += gauss;

          const curVal = this.bufferTextureCPU[offDst];
          nX += curVal * gauss * (-i / SIGMA2);
          nY += curVal * gauss * (-j / SIGMA2);
          nZ += curVal * gauss * (-k / SIGMA2);

        }
      }
    }// end gauss summation
    normalGauss.set(nX / normFactor, nY / normFactor, nZ / normFactor);
    normal.copy(normalGauss);
    if (normalmode === false) { //if tangetial mode - getting direction of view as normal of cylinder
      normal.copy(vDir);
      normal.multiplyScalar(-1.0);
      this.lastMode.push(tools3dEraser.TAN);
    } else {
      this.lastMode.push(tools3dEraser.NORM);
    }

    normal.normalize();
    console.log(`Normal: X: ${normal.x} Y: ${normal.y} Z: ${normal.z}`);

    //const pidivide2 = 90; //pi/2 (just for console output)
    const pi = 180;// pi (just for console output)
    //const radius = 20; //distance between current position and prevPos in which we are allowed to delete

    // Erase data in original texture

    /*console.log(`${Math.abs(new THREE.Vector3(targetX, targetY, targetZ).normalize().x)}
    ${Math.abs(new THREE.Vector3(targetX, targetY, targetZ).normalize().y)}
    ${Math.abs(new THREE.Vector3(targetX, targetY, targetZ).normalize().z)}
    ${Math.abs(pidivide2 - vDir.normalize().angleTo(normalGauss.normalize()) * pi / Math.PI)}`);*/
    const radiusRatio = this.xDim / this.zDim;
    const geometry = new THREE.CylinderGeometry(size, size, depth, pi, depth);
    const mesh = new THREE.Mesh(geometry, null);
    const axis = new THREE.Vector3(0, 0, 1);
    mesh.quaternion.setFromUnitVectors(axis, normal.clone().normalize().multiplyScalar(-1));
    mesh.position.copy(new THREE.Vector3(targetX, targetY, targetZ));

    if (startflag === true) {
      this.prevDistance = length;
      this.resetflag = false;
    }
    this.radius = 0.05;
    //console.log(`${Math.abs(this.prevDistance - length) * 1000}`);
    //console.log(`${this.radius * 1000}`);
    if (this.resetflag === false) {
      if (Math.abs(this.prevDistance - length) < this.radius) {
        this.prevDistance = length;
        this.point = new THREE.Vector3(0, 0, 0);
        this.queue = [];
        this.queue.push(this.point);
        const normalBack = -5;
        let backZ = 0;
        if (normalmode === false) { //some manipulatian with cylinder for tangential mode
          backZ = 0 - Math.round(Math.abs(Math.tan(vDir.normalize().angleTo(normalGauss.normalize()))) * (size));
        } else {
          backZ = normalBack;
        }
        let deleteflag = false;
        while (this.queue.length > 0) {
          this.point = this.queue.pop();
          const RotPoint = this.point.clone();
          RotPoint.z *= radiusRatio;
          RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), -mesh.rotation.x);
          RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), -mesh.rotation.y);
          RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), mesh.rotation.z);
          if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > size ||
            Math.abs(RotPoint.z) > depth || RotPoint.z < backZ) {
            continue;
          }
          for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
            for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
              for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
                const mainX = targetX + Math.round(x);
                const mainY = targetY + Math.round(y);
                const mainZ = targetZ + Math.round(z);
                if (this.isWebGL2 === 0) {
                  const yTile = Math.floor(mainZ / this.zDimSqrt);
                  const xTile = mainZ - this.zDimSqrt * yTile;
                  const yTileOff = (yTile * this.yDim) * this.xTex;
                  const xTileOff = xTile * this.xDim;
                  offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
                } else {
                  offDst = mainX + mainY * this.xDim + mainZ * this.xDim * this.yDim;
                }
                if (this.bufferMask[offDst] === 0) {
                  continue;
                }

                const bitconst = 255.0;
                const borderinclude = 0.01;
                const isoSurfaceBorder = isothreshold * bitconst - borderinclude * bitconst;

                if (this.bufferTextureCPU[offDst] >= isoSurfaceBorder) {
                  deleteflag = true;
                  this.bufferMask[offDst] = 0;
                  this.queue.push(new THREE.Vector3(x, y, z));
                }
              }
            }
          }
        }
        if (deleteflag === true) {
          this.lastSize.push(size);
          this.lastDepth.push(depth);
          this.lastRotationVector.push(new THREE.Vector3(-mesh.rotation.x, -mesh.rotation.y, mesh.rotation.z));
          this.lastTarget.push(new THREE.Vector3(targetX, targetY, targetZ));
          this.lastBackDistance.push(-Math.round(Math.abs(Math.tan(vDir.normalize().angleTo(normalGauss.normalize())))
            * (size)));
        }
        this.updatableTextureMask.needsUpdate = true;
      } else {
        this.resetflag = true;
      }
    }
  }

  getIntensity(pointX, pointY, pointZ, undoFlag) {
    const full = 255;
    let offDst = 0;
    if (this.isWebGL2 === 0) {
      const yTile = Math.floor(pointZ / this.zDimSqrt);
      const xTile = pointZ - this.zDimSqrt * yTile;
      const yTileOff = (yTile * this.yDim) * this.xTex;
      const xTileOff = xTile * this.xDim;
      offDst = yTileOff + (pointY * this.xTex) + xTileOff + pointX;
    } else {
      offDst = pointX + pointY * this.xDim + pointZ * this.xDim * this.yDim;
    }
    let intensityPoint = this.bufferTextureCPU[offDst];
    if ((this.bufferMask[offDst] === 0) && (!undoFlag)) {
      intensityPoint = 0;
    } else if ((this.bufferMask[offDst] === full) && (undoFlag)) {
      intensityPoint = 0;
    }
    return intensityPoint;
  }

  changeIntensity(targetX, targetY, targetZ, undoFlag) {
    const mainX = targetX;
    const mainY = targetY;
    const mainZ = targetZ;
    let offDst = 0;
    if (this.isWebGL2 === 0) {
      const yTile = Math.floor(mainZ / this.zDimSqrt);
      const xTile = mainZ - this.zDimSqrt * yTile;
      const yTileOff = (yTile * this.yDim) * this.xTex;
      const xTileOff = xTile * this.xDim;
      offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
    } else {
      offDst = mainX + mainY * this.xDim + mainZ * this.xDim * this.xDim;
    }
    if (undoFlag) {
      this.bufferMask[offDst] = 255;
    } else {
      this.bufferMask[offDst] = 0;
    }
  }
  erasePixelsFloodFill(x_, y_, z_, startflag, mouseup, undoFlag) {
    let targetX;
    let targetY;
    let targetZ;
    if (!undoFlag) {
      targetX = Math.floor(x_ * this.xDim);
      targetY = Math.floor(y_ * this.yDim);
      targetZ = Math.floor(z_ * this.zDim);
      if (startflag === true) { // if we started drawing there are no previous position
        this.prevPos = null;
      }
      if (mouseup === true) { //getting previous position as our mouse is not pressed
        this.prevPos = targetX + targetY + targetZ;
        return;
      }
      if (this.prevPos === null) {
        this.prevPos = targetX + targetY + targetZ;
      }
      console.log(`Target: ${targetX}, ${targetY}, ${targetZ}`);
      this.lastMode.push(tools3dEraser.FILL);
    } else {
      targetX = x_;
      targetY = y_;
      targetZ = z_;
    }
    const intensityTarget = this.getIntensity(targetX, targetY, targetZ, undoFlag);
    const stack = [];
    stack.push({ 'tX':targetX, 'tY':targetY, 'tZ':targetZ });

    if (!undoFlag) {
      this.lastTarget.push(new THREE.Vector3(targetX, targetY, targetZ));
    }

    while (stack.length !== 0) {
      const point = stack.pop();
      let openUp = false;
      let openDown = false;
      let openFar = false;
      let openClose = false;
      let xTmp = point.tX;
      while (this.getIntensity(xTmp, point.tY, point.tZ, undoFlag) >= intensityTarget) {
        xTmp--;
      }
      const leftBound = xTmp + 1;
      xTmp = point.tX;
      while (this.getIntensity(xTmp, point.tY, point.tZ, undoFlag) >= intensityTarget) {
        xTmp++;
      }
      const rightBound = xTmp - 1;
      for (xTmp = leftBound; xTmp <= rightBound; xTmp++) {
        this.changeIntensity(xTmp, point.tY, point.tZ, undoFlag);
        if (openUp === false) {
          if (this.getIntensity(xTmp, point.tY + 1, point.tZ, undoFlag) >= intensityTarget) {
            stack.push({ 'tX': xTmp, 'tY': (point.tY + 1), 'tZ': point.tZ });
            openUp = true;
          }
        } else if (this.getIntensity(xTmp, point.tY + 1, point.tZ, undoFlag) < intensityTarget) {
          openUp = false;
        }

        if (openDown === false) {
          if (this.getIntensity(xTmp, point.tY - 1, point.tZ, undoFlag) >= intensityTarget) {
            stack.push({ 'tX': xTmp, 'tY': (point.tY - 1), 'tZ': point.tZ });
            openDown = true;
          }
        } else if (this.getIntensity(xTmp, point.tY - 1, point.tZ, undoFlag) < intensityTarget) {
          openDown = false;
        }

        if (openFar === false) {
          if (this.getIntensity(xTmp, point.tY, point.tZ + 1, undoFlag) >= intensityTarget) {
            stack.push({ 'tX':xTmp, 'tY':point.tY, 'tZ':(point.tZ + 1) });
            openFar = true;
          }
        } else if (this.getIntensity(xTmp, point.tY, point.tZ + 1, undoFlag) < intensityTarget) {
          openFar = false;
        }

        if (openClose === false) {
          if (this.getIntensity(xTmp, point.tY, point.tZ - 1, undoFlag) >= intensityTarget) {
            stack.push({ 'tX':xTmp, 'tY':point.tY, 'tZ':(point.tZ - 1) });
            openClose = true;
          }
        } else if (this.getIntensity(xTmp, point.tY, point.tZ - 1, undoFlag) < intensityTarget) {
          openClose = false;
        }
      }
    }
    if (!undoFlag) {
      this.updatableTextureMask.needsUpdate = true;
    }
  }

  undoLastErasing() {
    if (this.lastMode.pop() === tools3dEraser.FILL) {
      const targetPoint = this.lastTarget.pop();
      const targetX = targetPoint.x;
      const targetY = targetPoint.y;
      const targetZ = targetPoint.z;
      this.erasePixelsFloodFill(targetX, targetY, targetZ, false, false, true);
    } else {
      if (this.lastSize.length === 0) {
        return;
      }
      const radiusRatio = this.xDim / this.zDim;
      const VAL_10 = 10;
      if (this.undocount === VAL_10) {
        this.lastSize = [];
        this.lastDepth = [];
        this.lastRotationVector = [];
        this.lastTarget = [];
        this.lastBackDistance = [];
        this.undocount = 0;
        //this.resetBufferTextureCPU();
        return;
      }
      this.undocount++;
      const targetLast = this.lastTarget.pop();
      const lastRotation = this.lastRotationVector.pop();
      const rxy = Math.round(this.lastSize.pop());
      const lastDepth = this.lastDepth.pop();
      const lastback = this.lastBackDistance.pop();
      this.point = new THREE.Vector3(0, 0, 0);
      this.queue = [];
      this.queue.push(this.point);
      while (this.queue.length > 0) {
        this.point = this.queue.pop();
        const RotPoint = this.point.clone();
        RotPoint.z *= radiusRatio;
        RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), lastRotation.x);
        RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), lastRotation.y);
        RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), lastRotation.z);
        if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > rxy ||
          RotPoint.z > lastDepth || RotPoint.z < lastback) {
          continue;
        }
        let offDst = 0;
        for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
          for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
            for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
              const mainX = targetLast.x + Math.round(x);
              const mainY = targetLast.y + Math.round(y);
              const mainZ = targetLast.z + Math.round(z);
              if (this.isWebGL2 === 0) {
                const yTile = Math.floor(mainZ / this.zDimSqrt);
                const xTile = mainZ - this.zDimSqrt * yTile;
                const yTileOff = (yTile * this.yDim) * this.xTex;
                const xTileOff = xTile * this.xDim;
                offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
              } else {
                offDst = mainX + mainY * this.xDim + mainZ * this.xDim * this.xDim;
              }
              if (this.bufferMask[offDst] === 0) {
                this.bufferMask[offDst] = 255.0;
                this.queue.push(new THREE.Vector3(x, y, z));
              }
            }
          }
        }
      }
    }
    this.updatableTextureMask.needsUpdate = true;
  }

  resetBufferTextureCPU() {
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //const gl = this.rendererBlur.getContext();
    //gl.readPixels(0, 0, this.xTex, this.yTex, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferTextureCPU);
    //this.updatableTexture.needsUpdate = true; this.lastSize.push(size);
    if (this.isWebGL2 === 0) {
      for (let y = 0; y < this.yTex; y++) {
        for (let x = 0; x < this.xTex; x++) {
          this.bufferMask[x + y * this.xTex] = 255.0;
        }
      }
    } else {
      for (let z = 0; z < this.zDim; z++) {
        for (let y = 0; y < this.yDim; y++) {
          for (let x = 0; x < this.xDim; x++) {
            this.bufferMask[x + y * this.xDim + z * this.xDim * this.yDim] = 255;
          }
        }
      }
    }
    this.updatableTextureMask.needsUpdate = true;
  }

  /**
   * Create 2D texture containing roi color map
   * @param colorArray 256 RGBA roi colors
   */
  createRoiColorMap(colorArray) {
    let textureOut = null;
    if (colorArray !== null) {
      textureOut = new THREE.DataTexture(colorArray, this.numRois, 1, THREE.RGBAFormat);
    } else {
      console.log('No colors found for ROI');
      // eslint-disable-next-line
      const colorROIs = new Uint8Array(4 * this.numRois);
      for (let pix = 0; pix < this.numRois; pix++) {
        // eslint-disable-next-line
        colorROIs[pix * 4 + 0] = 255;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 1] = 0;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 2] = 0;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 3] = 255;
      }
      textureOut = new THREE.DataTexture(colorROIs, this.numRois, 1, THREE.RGBAFormat);
    }
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    textureOut.magFilter = THREE.NearestFilter;
    textureOut.minFilter = THREE.NearestFilter;
    textureOut.needsUpdate = true;
    return textureOut;
  }

  /**
   * Create 2D texture containing selected ROIs
   * @param colorArray 256 RGBA roi colors
   */
  createSelectedRoiMap() {
    const a1 = 100;
    const a2 = 240;
    const c1 = 1;
    const c2 = 2;
    const c3 = 3;
    const BYTES_IN_COLOR = 4;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (pix < a1 || pix > a2) {
        // eslint-disable-next-line
        this.selectedROIs[pix * BYTES_IN_COLOR + 0] = 0;
      } else {
        // eslint-disable-next-line
        this.selectedROIs[pix * BYTES_IN_COLOR + 0] = 255;
      }
      this.selectedROIs[pix * BYTES_IN_COLOR + c1] = 0;
      this.selectedROIs[pix * BYTES_IN_COLOR + c2] = 0;
      this.selectedROIs[pix * BYTES_IN_COLOR + c3] = 0;
    }
    const textureOut = new THREE.DataTexture(this.selectedROIs, this.numRois, 1, THREE.RGBAFormat);
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    textureOut.magFilter = THREE.NearestFilter;
    textureOut.minFilter = THREE.NearestFilter;
    textureOut.needsUpdate = true;
    return textureOut;
  }

  /**
   * Create 2D texture containing selected ROIs
   * @param selectedROIs 256 byte roi values
   */
  updateSelectedRoiMap(selectedROIs) {
    const roiTexelBpp = 4;
    const roiSelectedTrue = 255;
    const roiSelectedFalse = 0;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (selectedROIs[pix]) {
        this.selectedROIs[pix * roiTexelBpp] = roiSelectedTrue;
      } else {
        this.selectedROIs[pix * roiTexelBpp] = roiSelectedFalse;
      }
    }
    // this.material.uniforms.texSegInUse.needsUpdate = true;
    this.texRoiId.needsUpdate = true;
    this.setVolumeTexture(1.0);

    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //this.copyFrameToTexture();
  }

  /**
   * Update roi selection map
   * @param roiId ROI id from 0..255
   * @param selectedState True if roi must be visible
   */
  // eslint-disable-next-line
  updateSelectedRoi(roiId, selectedState) {

    const roiTexelBpp = 4;
    const roiChecked = 255;
    const roiUnchecked = 0;
    if (selectedState) {
      this.selectedROIs[roiTexelBpp * roiId] = roiChecked;
    } else {
      this.selectedROIs[roiTexelBpp * roiId] = roiUnchecked;
    }
    //this.material.uniforms.texSegInUse.needsUpdate = true;
    console.log(`initMatBlure: ${this.initMatBlure}`);

    this.texRoiId.needsUpdate = true;
    this.setVolumeTexture(1.0);

    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //this.copyFrameToTexture();
  }

  /**
   * Create 3D texture containing filtered source data and calculated normal values
   * @param engine2d An object that contains all volume-related info
   * @param

   * @param roiColors Array of roi colors in RGBA format
   * @return (object) Created texture
   */
  createUpdatableVolumeTex(engine2d, isRoiVolume, roiColors) {
    //
    // Some notes about tetxure layout.
    // Actually we have replaces3d texture with 2d texture (large size).
    // Idea: pack 2d slices of original texture into single 2d texture, looking
    // like tile map
    //
    // Let we have 7 slices on z direction and want to create
    // 2d visualization in (x,y) plane.
    // We can arrange 7 slices in a following manner (ooo - means unused)
    //
    // +-----+-----+-----+
    // |     |     |     |
    // |  0  |  1  |  2  |
    // |     |     |     |
    // +-----+-----+-----+
    // |     |     |     |
    // |  3  |  4  |  5  |
    // |     |     |     |
    // +-----+-----+-----+
    // |     |00000|00000|
    // |  6  |00000|00000|
    // |     |00000|00000|
    // +-----+-----+-----+
    //
    // Numbers 0..6 inside tiles shows original tiles indices
    //
    // Shader parameter
    // tileCointX: number of tiles in hor direction
    // volumeSizeZ: number of slices in z directiion
    //
    // console.log(roiColors);
    this.isWebGL2 = engine2d.isWebGL2;
    const header = engine2d.m_volumeHeader;
    this.arrPixels = engine2d.m_volumeData;
    const xDim = header.m_pixelWidth;
    const yDim = header.m_pixelHeight;
    const zDim = header.m_pixelDepth;
    const TWO = 2;
    const ONE = 1;
    const zDimSqrt = TWO ** (ONE + Math.floor(Math.log(Math.sqrt(zDim)) / Math.log(TWO)));
    if (!Number.isInteger(zDimSqrt)) {
      console.log(`!!! zDimSqrt should be integer, but = ${zDimSqrt}`);
    }
    const xTex = xDim * zDimSqrt;
    const yTex = yDim * zDimSqrt;
    const numPixelsBuffer = xTex * yTex;
    this.numPixelsBuffer = numPixelsBuffer;
    this.xTex = xTex;
    this.yTex = yTex;
    this.xDim = xDim;
    this.yDim = yDim;
    this.zDim = zDim;
    this.zDimSqrt = zDimSqrt;
    this.glFormat = header.m_glFormat;
    this.isRoiVolume = isRoiVolume;
    //this.bufferR = new Uint8Array(numPixelsBuffer);
    //if (isRoiVolume) {
    //  const c4 = 4;
    //  this.bufferTextureCPU = new Uint8Array(c4 * numPixelsBuffer);
    //  console.log('ROI');
    //} else {
    //  this.bufferTextureCPU = new Uint8Array(numPixelsBuffer);
    //}
    const KTX_GL_RED = 0x1903;
    const KTX_GL_RGBA = 0x1908;
    this.RoiVolumeTex = null;
    if (this.glFormat === KTX_GL_RED) {
      if (this.isWebGL2 === 0) {
        this.setBufferRgbaFrom1Byte();
      } else {
        this.set3DTextureFrom1Byte();
      }
    } else if (this.glFormat === KTX_GL_RGBA) {
      if (this.isWebGL2 === 0) {
        this.setBufferRgbaFrom4Bytes();
        this.RoiVolumeTex = new THREE.DataTexture(this.bufferRoi, this.xTex, this.yTex, THREE.AlphaFormat);
      } else {
        this.set3DTextureFrom4Bytes();
        this.RoiVolumeTex = new THREE.DataTexture3D(this.bufferRoi, this.xDim, this.yDim, this.zDim);
        this.RoiVolumeTex.format = THREE.RedFormat; //RedFormat?
        this.RoiVolumeTex.type = THREE.UnsignedByteType;
      }
      this.RoiVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.magFilter = THREE.NearestFilter;
      this.RoiVolumeTex.minFilter = THREE.NearestFilter;
      this.RoiVolumeTex.needsUpdate = true;
    }
    let rtFormat = THREE.RGBAFormat;
    if (this.isWebGL2 === 1) {
      rtFormat = THREE.RGBAFormat;// can we use ALPHA?
    }
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xDim,
      this.yDim, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: rtFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });

    if (this.origVolumeTex) {
      this.origVolumeTex.dispose();
    }

    if (this.isWebGL2 === 0) {
      this.origVolumeTex = new THREE.DataTexture(this.bufferR, this.xTex, this.yTex, THREE.AlphaFormat);
    } else {
      this.origVolumeTex = new THREE.DataTexture3D(this.bufferR, this.xDim, this.yDim, this.zDim);
      this.origVolumeTex.format = THREE.RedFormat;
      this.origVolumeTex.type = THREE.UnsignedByteType;
      this.origVolumeTex.wrapR = THREE.ClampToEdgeWrapping;
    }
    this.origVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapT = THREE.ClampToEdgeWrapping;

    this.origVolumeTex.magFilter = THREE.NearestFilter;//THREE.LinearFilter;
    this.origVolumeTex.minFilter = THREE.NearestFilter;//THREE.LinearFilter;

    this.origVolumeTex.needsUpdate = true;
    if (this.origVolumeTex) {
      this.origVolumeTex.dispose();
    }

    if (this.isWebGL2 === 0) {
      this.updatableTexture = new THREE.DataTexture(this.bufferTextureCPU, this.xTex, this.yTex, THREE.AlphaFormat);
    } else {
      let volTexFormat = THREE.RedFormat;
      if (isRoiVolume) {
        volTexFormat = THREE.RGBAFormat;
      }
      this.updatableTexture = new THREE.DataTexture3D(this.bufferTextureCPU, this.xDim, this.yDim, this.zDim);
      this.updatableTexture.format = volTexFormat;
      this.updatableTexture.type = THREE.UnsignedByteType;
      this.updatableTexture.wrapR = THREE.ClampToEdgeWrapping;
    }
    this.updatableTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.updatableTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.updatableTexture.magFilter = THREE.LinearFilter;
    this.updatableTexture.minFilter = THREE.LinearFilter;
    if (this.zDim > 1) {
      this.initRenderer(isRoiVolume, roiColors);
    }
    this.updatableTexture.needsUpdate = true;
    return this.updatableTexture;
  }

  /**
   * Create 3D texture containing mask of data which were erase
   * @param engine2d An object that contains all volume-related info
   * @return (object) Created texture
   */
  createUpdatableVolumeMask(engine2d) {
    const header = engine2d.m_volumeHeader;
    const xDim = header.m_pixelWidth;
    const yDim = header.m_pixelHeight;
    if (this.isWebGL2 === 0) {
      const xTex = xDim * this.zDimSqrt;
      const yTex = yDim * this.zDimSqrt;
      const numPixelsBuffer = xTex * yTex;
      this.bufferMask = new Uint8Array(numPixelsBuffer);
      for (let y = 0; y < yTex; y++) {
        const yOff = y * xTex;
        for (let x = 0; x < xTex; x++) {
          this.bufferMask[x + yOff] = 255;
        }
      }
    } else {
      this.bufferMask = new Uint8Array(this.xDim * this.yDim * this.zDim);
      for (let z = 0; z < this.zDim; z++) {
        for (let y = 0; y < this.yDim; y++) {
          for (let x = 0; x < this.xDim; x++) {
            this.bufferMask[x + y * this.xDim + z * this.xDim * this.yDim] = 255;
          }
        }
      }
    }

    if (this.updatableTextureMask) {
      this.updatableTextureMask.dispose();
    }
    //this.updatableTextureMask = new THREE.DataTexture(this.bufferMask, this.xTex, this.yTex, THREE.AlphaFormat);
    this.updatableTextureMask = new THREE.DataTexture3D(this.bufferMask, this.xDim, this.yDim, this.zDim);
    this.updatableTextureMask.format = THREE.RedFormat;
    this.updatableTextureMask.type = THREE.UnsignedByteType;
    this.updatableTextureMask.wrapS = THREE.ClampToEdgeWrapping;
    this.updatableTextureMask.wrapT = THREE.ClampToEdgeWrapping;
    this.updatableTextureMask.magFilter = THREE.LinearFilter;
    this.updatableTextureMask.minFilter = THREE.LinearFilter;
    this.updatableTextureMask.needsUpdate = true;

    const maskGaussingBufferSize = 131072;
    this.maskGaussingBufferSize = maskGaussingBufferSize;
    this.maskGaussingTempBuf = new Uint8Array(maskGaussingBufferSize);
    return this.updatableTextureMask;
    //this.initRenderer(isRoiVolume, roiColors);
    //return this.bufferTexture.texture;
  }
} // class Graphics3d
