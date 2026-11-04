/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Blur material, used for rendering of blurred volume slices
 * @module lib/scripts/gfx/matblur
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

import BLUR_VERTEX_SHADER from '../shaders/blur.vert';
import BLUR_FRAGMENT_SHADER from '../shaders/blur.frag';

/** Class @class MaterialBlur for volume slice blurring */
export default class MaterialBlur {
  /** Backface material constructor
   * @constructor
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    const TILE_COUNT_X = 16.0;
    const VOL_SIZE_Z = 256.0;
    const BLUR_SIGMA = 0.8;
    const CONTRAST = 1.0;
    const BRIGHTNESS = 0.0;
    const SAVE_FLAG = true;
    this.m_uniforms = {
      texVolume: { type: 't', value: null },
      texVolumeRoi: { type: 't', value: null },
      texRoiColor: { type: 't', value: null },
      texSegInUse: { type: 't', value: null },
      texelSize: { type: 'v3', value: null },
      tileCountX: { type: 'f', value: TILE_COUNT_X },
      volumeSizeZ: { type: 'f', value: VOL_SIZE_Z },
      xDim: { type: 'f', value: VOL_SIZE_Z },
      yDim: { type: 'f', value: VOL_SIZE_Z },
      blurSigma: { type: 'f', value: BLUR_SIGMA },
      contrast: { type: 'f', value: CONTRAST },
      brightness: { type: 'f', value: BRIGHTNESS },
      curZ: { type: 'f', value: 0.0 },
      save_flag: { type: 'b', value: SAVE_FLAG },
    };
    this.m_defines = {
      renderRoiMap: 0,
      useWebGL2: 1,
    };
  }

  /** Backface material constructor
   * @return {object} Three.js material with this shader
   */
  create(texture, texRoi, texelSize, texRoiColor, texRoiId, callbackMat) {
    // Init uniforms
    this.m_uniforms.texVolume.value = texture;
    this.m_uniforms.texVolume.value = texture;
    this.m_uniforms.texVolumeRoi.value = texRoi;
    this.m_uniforms.texRoiColor.value = texRoiColor;
    this.m_uniforms.texSegInUse.value = texRoiId;
    this.m_uniforms.texelSize.value = texelSize;
    // create shader loaders
    const vertexLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertexLoader.setResponseType('text');
    const fragmentLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    fragmentLoader.setResponseType('text');

    vertexLoader.load(BLUR_VERTEX_SHADER, (strVertexSh) => {
      this.m_strShaderVertex = strVertexSh;
      // console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(BLUR_FRAGMENT_SHADER, (strFragmentSh) => {
        this.m_strShaderFragment = strFragmentSh;

        const material = new THREE.ShaderMaterial({
          uniforms: this.m_uniforms,
          defines: this.m_defines,
          vertexShader: this.m_strShaderVertex,
          fragmentShader: this.m_strShaderFragment,
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}
