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

import THREE from 'n3d-threejs';
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
    this.bufferFrame = new Uint8Array(4 * this.numPixelsBuffer);
    // eslint-disable-next-line
    this.selectedROIs = new Uint8Array(4 * this.numRois);
    this.rendererBlur.setSize(this.xTex, this.yTex);
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xTex, this.yTex);
    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    const matBlur = new MaterialBlur();
    this.texRoiColor = null;
    this.texRoiId = null;
    if (isRoiVolume) {
      this.texRoiId = this.createSelectedRoiMap();
      this.texRoiColor = this.createRoiColorMap(roiColors);
      console.log('roi volume textures done');
    }
    matBlur.create(this.updatableVolumeTex, texelSize, this.texRoiColor, this.texRoiId, (mat) => {
      const mesh = new THREE.Mesh(geometryBlur, mat);
      mat.uniforms.tileCountX.value = this.zDimSqrt;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      this.material = mat;
      this.sceneBlur.add(mesh);
      // this.setVolumeTexture(blurSigma);
      if (isRoiVolume === false) {
        this.switchToBlurRender();
      } else {
        this.switchToRoiMapRender();
      }
      this.setVolumeTexture(blurSigma);
    });
  }

  /**
  * Copy texture data from GPU to local array
  */
  copyFrameToTexture() {
    // Reading result from video memory
    const gl = this.rendererBlur.getContext();
    gl.readPixels(0, 0, this.xTex, this.yTex, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferFrame);
    for (let pix = 0; pix < this.numPixelsBuffer; pix++) {
      // eslint-disable-next-line
      this.bufferRgba[pix * 4 + 0] = this.bufferFrame[pix * 4 + 0];
      // eslint-disable-next-line
      this.bufferRgba[pix * 4 + 1] = this.bufferFrame[pix * 4 + 1];
      // eslint-disable-next-line
      this.bufferRgba[pix * 4 + 2] = this.bufferFrame[pix * 4 + 2];
      // eslint-disable-next-line
      this.bufferRgba[pix * 4 + 3] = this.bufferFrame[pix * 4 + 3];
    }
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
  updateVolumeTexture(blurSigma, contrast, brightness) {
    this.setBufferRGBA();
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.contrast.value = contrast;
    this.material.uniforms.brightness.value = brightness;
    this.material.uniforms.blurSigma.needsUpdate = true;
    this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture, true);
    this.copyFrameToTexture();
    this.updatableVolumeTex.needsUpdate = true;
  }

  /**
  * Filtering the source data and building the normals on the GPU
  * @param blurSigma Gauss sigma parameter
  */
  setVolumeTexture(blurSigma) {
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture, true);
    this.copyFrameToTexture();
    this.updatableVolumeTex.needsUpdate = true;
  }
  /**
  * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
  */
  setBufferRGBA() {
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
            const val = this.arrPixels[xVol + yVolOff + zVolOff];
            const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
            const offDst3 = (offDst + offDst + offDst + offDst);
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 0] = val;
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 1] = val;
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 2] = val;
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 3] = val;
          }
        }
      }
    }
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
    for (let pix = 0; pix < this.numRois; pix++) {
      // eslint-disable-next-line
      this.selectedROIs[pix * 4 + 0] = 255;
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
      return textureOut;
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
    console.log(roiColors);
    const header = engine2d.m_volumeHeader;
    this.arrPixels = engine2d.m_volumeData;
    const xDim = header.m_pixelWidth;
    const yDim = header.m_pixelHeight;
    const zDim = header.m_pixelDepth;
    const zDimSqrt = Math.ceil(Math.sqrt(zDim));
    const xTex = xDim * zDimSqrt;
    const yTex = yDim * zDimSqrt;
    const numPixelsBuffer = xTex * yTex;
    const VAL_4 = 4;
    this.numPixelsBuffer = numPixelsBuffer;
    this.xTex = xTex;
    this.yTex = yTex;
    this.xDim = xDim;
    this.yDim = yDim;
    this.zDim = zDim;
    this.zDimSqrt = zDimSqrt;
    this.bufferRgba = new Uint8Array(VAL_4 * numPixelsBuffer);
    this.setBufferRGBA();
    const textureOut = new THREE.DataTexture(this.bufferRgba, this.xTex, this.yTex, THREE.RGBAFormat);
    this.updatableVolumeTex = textureOut;
    textureOut.needsUpdate = true;
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    if (isRoiVolume === false) {
      textureOut.magFilter = THREE.LinearFilter;
      textureOut.minFilter = THREE.LinearFilter;
      // perform additional texture gauss smoothing
      this.initRenderer(isRoiVolume, roiColors);
    } else {
      textureOut.magFilter = THREE.NearestFilter;
      textureOut.minFilter = THREE.NearestFilter;
      this.initRenderer(isRoiVolume, roiColors);
    }
    textureOut.needsUpdate = true;
    return textureOut;
  }
} // class Graphics3d
