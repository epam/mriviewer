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
//import MaterialAO from '../gfx/matAO';

/** Class Graphics3d is used for 3d render */
export default class VolumeFilter3d {
  constructor() {
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
    this.rendererBlur = new THREE.WebGLRenderer();
    console.log('rendererBlur');
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
      console.log(`material.uniforms.xDim.value1: ${this.material.uniforms.xDim.value}`);
      this.setVolumeTexture(blurSigma);
    });
    this.initMatBlure = 1;
    this.lastSize = [];
    this.lastDepth = [];
    this.lastRotationVector = [];
    this.lastTarget = [];
    this.lastBackDistance = [];
    this.resetflag = false;
    //console.log(`material.uniforms.xDim.value2: ${this.material.uniforms.xDim.value}`);
    console.log('material.uniforms.xDim.value2');

    /*
    this.sceneAO = new THREE.Scene();
    this.rendererAO = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    const geometryAO = new THREE.PlaneGeometry(1.0, 1.0);
    const matAO = new MaterialAO();
    const VAL_4 = 4;
    const VAL_255 = 255;
    this.vectors = new Uint8Array(VAL_4 * VAL_4 * VAL_4);
    for (let pix = 0; pix < VAL_4 * VAL_4; pix++) {
      this.vectors[pix * VAL_4 + 0] = VAL_255;
      this.vectors[pix * VAL_4 + 1] = VAL_255;
      this.vectors[pix * VAL_4 + 1 + 1] = VAL_255;
      this.vectors[pix * VAL_4 + 1 + 1 + 1] = 0;
    }
    this.vectorsTex = new THREE.DataTexture(this.vectors, VAL_4 * VAL_4, 1, THREE.RGBAFormat);
    this.vectorsTex.wrapS = THREE.ClampToEdgeWrapping;
    this.vectorsTex.wrapT = THREE.ClampToEdgeWrapping;
    this.vectorsTex.magFilter = THREE.NearestFilter;
    this.vectorsTex.minFilter = THREE.NearestFilter;
    this.vectorsTex.needsUpdate = true;
    if (!Number.isInteger(this.xTex)) {
      console.log(`!!! Non-integer array size = ${this.xTex}`);
    }
    if (!Number.isInteger(this.yTex)) {
      console.log(`!!! Non-integer array size = ${this.yTex}`);
    }

    this.bufferTextureAO = new Uint8Array(this.xTex * this.yTex);
    for (let y = 0; y < this.yTex; y++) {
      for (let x = 0; x < this.xTex; x++) {
        this.bufferTextureAO[x + y * this.yTex] = VAL_255;
      }
    }
    if (this.texVolumeAO) {
      this.texVolumeAO.dispose();
    }
    this.texVolumeAO = new THREE.DataTexture(this.bufferTextureAO, this.xTex, this.yTex, THREE.AlphaFormat);
    this.texVolumeAO.wrapS = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.wrapT = THREE.ClampToEdgeWrapping;
    this.texVolumeAO.magFilter = THREE.LinearFilter;
    this.texVolumeAO.minFilter = THREE.LinearFilter;
    this.texVolumeAO.needsUpdate = true;
    matAO.create(this.origVolumeTex, texelSize, this.vectorsTex, (mat) => {
      const mesh = new THREE.Mesh(geometryAO, mat);
      mat.uniforms.tileCountX.value = this.zDimSqrt;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      //this.material = mat;
      this.sceneAO.add(mesh);
      this.rendererAO.render(this.sceneAO, this.cameraOrtho, this.bufferTexture, true);
      const glAO = this.rendererAO.getContext();
      const tmpAO = new Uint8Array(VAL_4 * this.xTex * this.yTex);
      glAO.readPixels(0, 0, this.xTex, this.yTex, glAO.RGBA, glAO.UNSIGNED_BYTE, tmpAO);
      for (let y = 0; y < this.yTex; y++) {
        for (let x = 0; x < this.xTex; x++) {
          this.bufferTextureAO[x + y * this.yTex] = tmpAO[VAL_4 * (x + y * this.yTex)];
        }
      }
    });
    this.texVolumeAO.needsUpdate = true;
    */
  }
  /*
  gettexVolumeAO() {
    return this.texVolumeAO;
  }
  */
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
   * Copy texture data from GPU to local array
   */
  copyFrameToTexture() {
    // Reading result from video memory
    console.log('copyFrameToTexture');
    const VAL_4 = 4;
    const gl = this.rendererBlur.getContext();
    if (this.isRoiVolume) {
      gl.readPixels(0, 0, this.xTex, this.yTex, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferTextureCPU);
    } else {
      const tmpRgba = new Uint8Array(VAL_4 * this.xTex * this.yTex);
      gl.readPixels(0, 0, this.xTex, this.yTex, gl.RGBA, gl.UNSIGNED_BYTE, tmpRgba);
      for (let pix = 0; pix < this.xTex * this.yTex; pix++) {
        this.bufferTextureCPU[pix] = tmpRgba[VAL_4 * pix];
      }
    }
    this.updatableTexture.needsUpdate = true;

    //this.rendererBlur.copyFramebufferToTexture(new THREE.Vector2(0, 0), this.updatableTexture, 0);
    //this.updatableTexture.needsUpdate = true;
    //const props = this.rendererBlur.properties.get(this.updatableTexture);
    //var output = '';
    //for (var property in this.rendererBlur) {
    //    output += property + ': ' + this.rendererBlur[property]+'; ';
    //}
    //console.log(`output = ${output}`);
    //const glTexId = props.__webglTexture;
    //gl.bindTexture(gl.TEXTURE_2D, glTexId);
    //gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.xTex, this.yTex, 0);

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
    const VAL_1 = 1;
    const VAL_2 = 2;
    const VAL_3 = 3;
    const VAL_4 = 4;
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    const tmpRgba = new Uint8Array(VAL_4 * this.xDim * this.yDim);
    let k = 0;
    console.log(`isRoiVolume: ${this.isRoiVolume}`);
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
    this.updatableTexture.needsUpdate = true;
  }

  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  setBufferRgbaFrom1Byte() {
    const OFF0 = 0;
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
  setBufferRgbaFrom4Bytes() {
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const BID = 4;
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

  getOffDstValueByXYZ(mainX, mainY, mainZ) {
    const yTile = Math.floor(mainZ / this.zDimSqrt);
    const xTile = mainZ - this.zDimSqrt * yTile;
    const yTileOff = (yTile * this.yDim) * this.xTex;
    const xTileOff = xTile * this.xDim;

    return yTileOff + (mainY * this.xTex) + xTileOff + mainX;
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
    const VAL_2 = 2; // getting normal of surface
    for (let k = -Math.min(GAUSS_R, targetZ); k <= Math.min(GAUSS_R, this.zDim - 1 - targetZ); k++) {
      for (let j = -Math.min(GAUSS_R, targetY); j <= Math.min(GAUSS_R, this.yDim - 1 - targetY); j++) {
        for (let i = -Math.min(GAUSS_R, targetX); i <= Math.min(GAUSS_R, this.xDim - 1 - targetX); i++) {
          // handling voxel:
          // (targetX + i; ,targetY+ j; targetZ + k);
          const gX = targetX + i;
          const gY = targetY + j;
          const gZ = targetZ + k;

          const yTile = Math.floor(gZ / this.zDimSqrt);
          const xTile = gZ - this.zDimSqrt * yTile;
          const yTileOff = (yTile * this.yDim) * this.xTex;
          const xTileOff = xTile * this.xDim;

          const offDst = yTileOff + (gY * this.xTex) + xTileOff + gX;

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

                const yTile = Math.floor(mainZ / this.zDimSqrt);
                const xTile = mainZ - this.zDimSqrt * yTile;
                const yTileOff = (yTile * this.yDim) * this.xTex;
                const xTileOff = xTile * this.xDim;

                const offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
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

  undoLastErasing() {
    if (!this.lastSize) {
      return;
    }
    const undoiterations = 10;
    const radiusRatio = this.xDim / this.zDim;
    for (let a = 0; a < undoiterations; a++) {
      if (this.lastTarget.length === 0) {
        this.resetBufferTextureCPU();
        break;
      }
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
        RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), lastRotation.x);
        RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), lastRotation.y);
        RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), lastRotation.z);
        const two = 1;
        const four = 2;
        let coeff = rxy * two;
        if (this.lastTarget.length === 0) {
          coeff = rxy * four;
        }
        if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > coeff ||
          RotPoint.z > lastDepth || RotPoint.z < lastback) {
          continue;
        }
        for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
          for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
            for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
              const mainX = targetLast.x + Math.round(x);
              const mainY = targetLast.y + Math.round(y);
              const mainZ = targetLast.z + Math.round((z / radiusRatio));

              const yTile = Math.floor(mainZ / this.zDimSqrt);
              const xTile = mainZ - this.zDimSqrt * yTile;
              const yTileOff = (yTile * this.yDim) * this.xTex;
              const xTileOff = xTile * this.xDim;

              const offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
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
    for (let y = 0; y < this.yTex; y++) {
      for (let x = 0; x < this.xTex; x++) {
        this.bufferMask[x + y * this.xTex] = 255.0;
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
    this.bufferR = new Uint8Array(numPixelsBuffer);
    if (isRoiVolume) {
      const c4 = 4;
      this.bufferTextureCPU = new Uint8Array(c4 * numPixelsBuffer);
      console.log('ROI');
    } else {
      this.bufferTextureCPU = new Uint8Array(numPixelsBuffer);
    }
    const KTX_GL_RED = 0x1903;
    const KTX_GL_RGBA = 0x1908;
    this.RoiVolumeTex = null;
    if (this.glFormat === KTX_GL_RED) {
      this.setBufferRgbaFrom1Byte();
    } else if (this.glFormat === KTX_GL_RGBA) {
      this.bufferRoi = new Uint8Array(numPixelsBuffer);
      this.setBufferRgbaFrom4Bytes();
      this.RoiVolumeTex = new THREE.DataTexture(this.bufferRoi, this.xTex, this.yTex, THREE.AlphaFormat);
      this.RoiVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
      this.RoiVolumeTex.magFilter = THREE.NearestFilter;
      this.RoiVolumeTex.minFilter = THREE.NearestFilter;
      this.RoiVolumeTex.needsUpdate = true;
    }
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xDim,
      this.yDim, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });

    if (this.origVolumeTex) {
      this.origVolumeTex.dispose();
    }
    this.origVolumeTex = new THREE.DataTexture(this.bufferR, this.xTex, this.yTex, THREE.AlphaFormat);
    this.origVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.magFilter = THREE.LinearFilter;
    this.origVolumeTex.minFilter = THREE.LinearFilter;
    this.origVolumeTex.needsUpdate = true;
    if (this.updatableTexture) {
      this.updatableTexture.dispose();
    }
    if (isRoiVolume) {
      this.updatableTexture = new THREE.DataTexture(this.bufferTextureCPU, this.xTex, this.yTex, THREE.RGBAFormat);
    } else {
      this.updatableTexture = new THREE.DataTexture(this.bufferTextureCPU, this.xTex, this.yTex, THREE.AlphaFormat);
    }
    this.updatableTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.updatableTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.updatableTexture.magFilter = THREE.LinearFilter;
    this.updatableTexture.minFilter = THREE.LinearFilter;
    this.initRenderer(isRoiVolume, roiColors);
    this.updatableTexture.needsUpdate = true;
    return this.updatableTexture;
    //this.initRenderer(isRoiVolume, roiColors);
    //return this.bufferTexture.texture;
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
    if (this.updatableTextureMask) {
      this.updatableTextureMask.dispose();
    }
    this.updatableTextureMask = new THREE.DataTexture(this.bufferMask, this.xTex, this.yTex, THREE.AlphaFormat);
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
