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
* @module app/scripts/graphics3d/volumeFilter3d
*/

import THREE from 'n3d-threejs';
import MaterialBlur from '../gfx/matblur';

/** Class Graphics3d is used for 3d render */
export default class VolumeFilter3d {

  /**
  * Filtering the source data and building the normals on the GPU
  */
  initRenderer() {
    this.sceneBlur = new THREE.Scene();
    const blurSigma = 1.2;
    // eslint-disable-next-line
    this.cameraOrtho = new THREE.OrthographicCamera(this.xTex / -2, this.xTex / 2, this.yTex / 2, this.yTex / -2, 0.1, 100);
    this.rendererBlur = new THREE.WebGLRenderer();
    const geometryBlur = new THREE.PlaneGeometry(1.0, 1.0);
    // eslint-disable-next-line
    this.bufferFrame = new Uint8Array(4 * this.numPixelsBuffer);
    this.rendererBlur.setSize(this.xTex, this.yTex);
    this.bufferTexture = new THREE.WebGLRenderTarget(this.xTex, this.yTex);
    const texelSize = new THREE.Vector3(1.0 / this.xDim, 1.0 / this.yDim, 1.0 / this.zDim);
    const matBlur = new MaterialBlur();
    matBlur.create(this.updatableVolumeTex, texelSize, (mat) => {
      const mesh = new THREE.Mesh(geometryBlur, mat);
      mat.uniforms.tileCountX.value = this.zDimSqrt;
      mat.uniforms.volumeSizeZ.value = this.zDim;
      this.material = mat;
      this.sceneBlur.add(mesh);
      this.updateVolumeTexture(blurSigma);
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
  * Filtering the source data and building the normals on the GPU
  * @param blurSigma Gauss sigma parameter
  */
  updateVolumeTexture(blurSigma) {
    this.material.uniforms.blurSigma.value = blurSigma;
    this.material.uniforms.blurSigma.needsUpdate = true;
    this.restoreOrigVoxels();
    this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture, true);
    this.copyFrameToTexture();
    this.updatableVolumeTex.needsUpdate = true;
  }

  /**
   * Copy initial volume values
   */
  restoreOrigVoxels() {
    for (let id = 0; id < this.numPixelsBuffer; id++) {
      // eslint-disable-next-line
      this.bufferRgba[id] = this.bufferRgbaOrig[id];
    }
  }

  /**
  * Create 3D texture containing filtered source data and calculated normal values
  * @param engine2d An object that contains all volume-related info
  * @param isRoiVolume
  * @return (object) Created texture
  */
  createUpdatableVolumeTex(engine2d, isRoiVolume) {
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
    const header = engine2d.m_volumeHeader;
    const arrPixels = engine2d.m_volumeData;
    const xDim = header.m_pixelWidth;
    const yDim = header.m_pixelHeight;
    const zDim = header.m_pixelDepth;
    const zDimSqrt = Math.ceil(Math.sqrt(zDim));
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
    // Fill initial rgba array
    // eslint-disable-next-line
    this.bufferRgba = new Uint8Array(4 * numPixelsBuffer);
    // eslint-disable-next-line
    this.bufferRgbaOrig = new Uint8Array(4 * numPixelsBuffer);
    for (let yTile = 0; yTile < zDimSqrt; yTile++) {
      const yTileOff = (yTile * yDim) * xTex;
      for (let xTile = 0; xTile < zDimSqrt; xTile++) {
        const xTileOff = xTile * xDim;
        const zVol = xTile + (yTile * zDimSqrt);
        if (zVol >= zDim) {
          break;
        }
        const zVolOff = zVol * xDim * yDim;
        for (let y = 0; y < yDim; y++) {
          const yVol = y;
          const yVolOff = yVol * xDim;
          for (let x = 0; x < xDim; x++) {
            const xVol = x;
            const val = arrPixels[xVol + yVolOff + zVolOff];
            const offDst = yTileOff + xTileOff + (y * xTex) + x;
            const offDst3 = (offDst + offDst + offDst + offDst);
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 0] = val;
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 1] = val;
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 2] = val;
            // eslint-disable-next-line
            this.bufferRgba[offDst3 + 3] = val;
            // eslint-disable-next-line
            this.bufferRgbaOrig[offDst3 + 0] = val;
            // eslint-disable-next-line
            this.bufferRgbaOrig[offDst3 + 1] = val;
            // eslint-disable-next-line
            this.bufferRgbaOrig[offDst3 + 2] = val;
            // eslint-disable-next-line
            this.bufferRgbaOrig[offDst3 + 3] = val;
          }
        }
      }
    }
    const textureOut = new THREE.DataTexture(this.bufferRgba, this.xTex, this.yTex, THREE.RGBAFormat);
    this.updatableVolumeTex = textureOut;
    textureOut.needsUpdate = true;
    textureOut.wrapS = THREE.ClampToEdgeWrapping;
    textureOut.wrapT = THREE.ClampToEdgeWrapping;
    if (isRoiVolume === false) {
      textureOut.magFilter = THREE.LinearFilter;
      textureOut.minFilter = THREE.LinearFilter;
      // perform additional texture gauss smoothing
      this.initRenderer();
    } else {
      textureOut.magFilter = THREE.NearestFilter;
      textureOut.minFilter = THREE.NearestFilter;
    }
    textureOut.needsUpdate = true;
    return textureOut;
  }
} // class Graphics3d
