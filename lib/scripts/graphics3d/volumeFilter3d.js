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

/** Class Graphics3d is used for 3d render */
export default class VolumeFilter3d {

  /**
  * Filtering the source data and building the normals on the GPU
   * @param isRoiVolume
   * @param roiColors Array of roi colors in RGBA format
  */
  initRenderer(isRoiVolume, roiColors) {
    this.sceneBlur = new THREE.Scene();
    const blurSigma = 0.8;
    this.numRois = 256;
    // eslint-disable-next-line
    this.cameraOrtho = new THREE.OrthographicCamera(this.xTex / -2, this.xTex / 2, this.yTex / 2, this.yTex / -2, 0.1, 100);
    this.rendererBlur = new THREE.WebGLRenderer();
    const geometryBlur = new THREE.PlaneGeometry(1.0, 1.0);
    // eslint-disable-next-line
    this.selectedROIs = new Uint8Array(4 * this.numRois);
    this.numTfPixels = 256;
    // eslint-disable-next-line
    this.transferFuncRgba = new Uint8Array(4 * this.numTfPixels);
    this.rendererBlur.setSize(this.xTex, this.yTex);
    //
    //const gl = this.rendererBlur.getContext();
    //this.webglTextureRT = gl.createTexture();
    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    const matBlur = new MaterialBlur();
    this.texRoiColor = null;
    this.texRoiId = null;
    if (isRoiVolume) {
      this.texRoiId = this.createSelectedRoiMap();
      this.texRoiColor = this.createRoiColorMap(roiColors);
      // console.log('roi volume textures done');
    }
    matBlur.create(this.origVolumeTex, texelSize, this.texRoiColor, this.texRoiId, (mat) => {
      const mesh = new THREE.Mesh(geometryBlur, mat);
      mat.uniforms.tileCountX.value = this.volTexTileFactor;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      this.material = mat;
      this.sceneBlur.add(mesh);
      if (isRoiVolume === false) {
        this.switchToBlurRender();
      } else {
        this.switchToRoiMapRender();
      }
      // render with blur and copy pixels back to this.bufferRgba
      this.setVolumeTexture(blurSigma);
    });
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
    const gl = this.rendererBlur.getContext();
    gl.readPixels(0, 0, this.xTex, this.yTex, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferTextureCPU);
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
  updateVolumeTexture(blurSigma, contrast, brightness, saveFlag) {
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.contrast.value = contrast;
    this.material.uniforms.brightness.value = brightness;
    //this.material.uniforms.blurSigma.needsUpdate = true;
    this.material.uniforms.save_flag.value = saveFlag;
    this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    this.copyFrameToTexture();
  }
  /**
  * Filtering the source data and building the normals on the GPU
  * @param blurSigma Gauss sigma parameter
  */
  setVolumeTexture(blurSigma) {
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    //this.bufferTexture.texture = this.updatableTexture;
    this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    this.copyFrameToTexture();
  }
  /**
  * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
  */
  setBufferRgbaFrom1Byte() {
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const FOUR = 4;
    // Fill initial rgba array
    for (let yTile = 0; yTile < this.volTexTileFactor; yTile++) {
      const yTileOff = (yTile * this.yDim) * this.xTex;
      for (let xTile = 0; xTile < this.volTexTileFactor; xTile++) {
        const xTileOff = xTile * this.xDim;
        const zVol = xTile + (yTile * this.volTexTileFactor);
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
            const offDst4 = offDst * FOUR;
            this.bufferRgba[offDst4 + OFF0] = valInt;
            this.bufferRgba[offDst4 + OFF1] = valInt;
            this.bufferRgba[offDst4 + OFF2] = valInt;
            this.bufferRgba[offDst4 + OFF3] = valInt;
            this.bufferTextureCPU[offDst4 + OFF0] = valInt;
            this.bufferTextureCPU[offDst4 + OFF1] = valInt;
            this.bufferTextureCPU[offDst4 + OFF2] = valInt;
            this.bufferTextureCPU[offDst4 + OFF3] = valInt;
          }
        }
      }
    }
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
    for (let yTile = 0; yTile < this.volTexTileFactor; yTile++) {
      const yTileOff = (yTile * this.yDim) * this.xTex;
      for (let xTile = 0; xTile < this.volTexTileFactor; xTile++) {
        const xTileOff = xTile * this.xDim;
        const zVol = xTile + (yTile * this.volTexTileFactor);
        if (zVol >= this.zDim) {
          break;
        }
        const zVolOff = zVol * this.xDim * this.yDim;
        for (let y = 0; y < this.yDim; y++) {
          const yVol = y;
          const yVolOff = yVol * this.xDim;
          for (let x = 0; x < this.xDim; x++) {
            const xVol = x;

            const offSrc = (xVol + yVolOff + zVolOff) *  BID;
            const valInt = this.arrPixels[offSrc + 0];
            const valRoi = this.arrPixels[offSrc + OFF3];
            const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
            const offDst3 = (offDst + offDst + offDst + offDst);
            this.bufferRgba[offDst3 + OFF0] = valInt;
            this.bufferRgba[offDst3 + OFF1] = 0;
            this.bufferRgba[offDst3 + OFF2] = 0;
            this.bufferRgba[offDst3 + OFF3] = valRoi;
            this.bufferTextureCPU[offDst3 + OFF0] = valInt;
            this.bufferTextureCPU[offDst3 + OFF1] = 0;
            this.bufferTextureCPU[offDst3 + OFF2] = 0;
            this.bufferTextureCPU[offDst3 + OFF3] = valRoi;
          }
        }
      }
    }
  }


  erasePixels(x_, y_, z_, size) {
    const targetX = Math.floor(x_ * this.xDim);
    const targetY = Math.floor(y_ * this.yDim);
    const targetZ = Math.floor(z_ * this.zDim);
    //console.log ("eras: " + targetX + " " + targetY + " " + targetZ);

    const C2 = 2;
    const C3 = 3;
    const OFF0 = 0;
    const OFF1 = 1;
    const OFF2 = 2;
    const OFF3 = 3;
    const FOUR = 4;
    const radiusRatio = this.xDim / this.zDim;
    const SIGMA = 1.5;
    ////////////////////////////////////
    for (let z = Math.max(0, targetZ - size); z < Math.min(this.zDim, targetZ + size + 1); z++) {
      const zR = targetZ - z;
      // sqrt(2 * size - 1) / 2 equals to half of the second layer radius
      const rxy = Math.round(Math.sqrt(size * size - zR * zR)  * radiusRatio);
      for (let y = Math.max(0, targetY - rxy); y < Math.min(this.yDim, targetY + rxy + 1); y++) {
        const yR = targetY - y;
        const rx = Math.round(Math.sqrt(rxy * rxy - yR * yR));
        for (let x = Math.max(0, targetX - rx); x < Math.min(this.xDim, targetX + rx + 1); x++) {
          for (let k = -Math.min(C2, z); k <= Math.min(C2, this.zDim - 1 - z); k++) {
            for (let j = -Math.min(C2, y); j <= Math.min(C2, this.yDim - 1 - y); j++) {
              for (let i = -Math.min(C2, x); i <= Math.min(C2, this.xDim - 1 -  x); i++) {
                // handling voxel:
                // (z + k; y + j; x + i);
                const curX = x + i;
                const curY = y + j;
                const curZ = z + k;
                const yTile = Math.floor(curZ / this.volTexTileFactor);
                const xTile = curZ - this.volTexTileFactor * yTile;
                const yTileOff = (yTile * this.yDim) * this.xTex;
                const xTileOff = xTile * this.xDim;
                const offDst = yTileOff + (curY * this.xTex) + xTileOff + curX;
                const offDst4 = offDst * FOUR;
                const gauss = 1 - Math.exp(-(i * i + j * j + k * k) / (C2 * SIGMA * SIGMA)) /
                (Math.sqrt(C2 * Math.PI * SIGMA * SIGMA) ** C3);
                //val += this.bufferTextureCPU[offDst4 + OFF3] * gauss
                this.bufferTextureCPU[offDst4 + OFF0] *= gauss;
                this.bufferTextureCPU[offDst4 + OFF1] *= gauss;
                this.bufferTextureCPU[offDst4 + OFF2] *= gauss;
                this.bufferTextureCPU[offDst4 + OFF3] *= gauss;
              }
            }
          }
          // gauss erasing end
        }//x-coord end
      }//y-coord end
    }// z-coord end
    this.updatableTexture.needsUpdate = true;
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
   * Returns tile factor: the closest to zDimSqrt power of two
   */
  getTextureTileFactor() {
    return this.volTexTileFactor;
  }

  /**
   * Returns tile factor: the closest to zDimSqrt power of two
   */
  getTextureTileY() {
    return this.volTileCountY;
  }
  /**
   * Create 2D texture containing selected ROIs
   * @param colorArray 256 RGBA roi colors
   */
  createSelectedRoiMap() {
    const a1 = 100;
    const a2 = 240;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (pix < a1 || pix > a2) {
        // eslint-disable-next-line
        this.selectedROIs[pix * 4 + 0] = 0;
      } else {
        // eslint-disable-next-line
        this.selectedROIs[pix * 4 + 0] = 255;
      }
      // eslint-disable-next-line
      this.selectedROIs[pix * 4 + 1] = 0;
      // eslint-disable-next-line
      this.selectedROIs[pix * 4 + 2] = 0;
      // eslint-disable-next-line
      this.selectedROIs[pix * 4 + 3] = 0;
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
    this.material.texSegInUse.needsUpdate = true;
    return textureOut;
  }

  /**
   * Update roi selection map
   * @param roiId ROI id from 0..255
   * @param selectedState True if roi must be visible
   */
  updateSelectedRoi(roiId, selectedState) {
    const roiTexelBpp = 4;
    this.selectedROIs[roiId * roiTexelBpp] = selectedState;
    this.material.texSegInUse.needsUpdate = true;
  }

  /**
  * Create 3D texture containing filtered source data and calculated normal values
  * @param engine2d An object that contains all volume-related info
  * @param isRoiVolume
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
    const zDimSqrt = 16;//Math.ceil(Math.sqrt(zDim));
    this.volTexTileFactor = zDimSqrt;
    this.volTileCountY = 1;
    while (zDim < this.volTexTileFactor * this.volTileCountY) {
      // eslint-disable-next-line
      this.volTileCountY = this.volTileCountY * 2;
    }
    const xTex = xDim * this.volTexTileFactor;
    const yTex = yDim * this.volTexTileFactor;//this.volTileCountY;
    const numPixelsBuffer = xTex * yTex;
    const VAL_4 = 4;
    this.numPixelsBuffer = numPixelsBuffer;
    this.xTex = xTex;
    this.yTex = yTex;
    this.xDim = xDim;
    this.yDim = yDim;
    this.zDim = zDim;
    this.glFormat = header.m_glFormat;
    this.bufferRgba = new Uint8Array(VAL_4 * numPixelsBuffer);
    this.bufferTextureCPU = new Uint8Array(VAL_4 * numPixelsBuffer);
    const KTX_GL_RED = 0x1903;
    const KTX_GL_RGBA = 0x1908;
    if (this.glFormat === KTX_GL_RED) {
      this.setBufferRgbaFrom1Byte();
    } else if (this.glFormat === KTX_GL_RGBA) {
      this.setBufferRgbaFrom4Bytes();
    }
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xTex,
      this.yTex, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      });
    this.origVolumeTex = new THREE.DataTexture(this.bufferRgba, this.xTex, this.yTex, THREE.RGBAFormat);
    this.origVolumeTex.wrapS = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.wrapT = THREE.ClampToEdgeWrapping;
    this.origVolumeTex.magFilter = THREE.LinearFilter;
    this.origVolumeTex.minFilter = THREE.LinearFilter;
    this.origVolumeTex.needsUpdate = true;
    this.updatableTexture = new THREE.DataTexture(this.bufferTextureCPU, this.xTex, this.yTex, THREE.RGBAFormat);
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
} // class Graphics3d
