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

import AO_VERTEX_SHADER from '../shaders/createAO.vert';
import AO_FRAGMENT_SHADER from '../shaders/createAO.frag';

/** Class @class MaterialBlur for volume slice blurring */
export default class MaterialAO {
  /** Backface material constructor
   * @constructor
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    const TEX_SIZE = 256.0;
    const TEXEL_SIZE_1_256 = 1.0 / TEX_SIZE;
    const TILE_COUNT_X = 16.0;
    const VOL_SIZE_Z = 256.0;
    this.m_uniforms = {
      texVolume: { type: 't', value: null },
      vectorsTex: { type: 't', value: null },
      texelSize: { type: 'v3', value: new THREE.Vector3(TEXEL_SIZE_1_256, TEXEL_SIZE_1_256, TEXEL_SIZE_1_256) },
      tileCountX: { type: 'f', value: TILE_COUNT_X },
      volumeSizeZ: { type: 'f', value: VOL_SIZE_Z },
      xDim: { type: 'f', value: VOL_SIZE_Z },
      yDim: { type: 'f', value: VOL_SIZE_Z },
      curZ: { type: 'f', value: VOL_SIZE_Z },
      isoThreshold: { type: 'f', value: VOL_SIZE_Z },
      vectorsSize: { type: 'i', value: null },
    };
    this.m_defines = {
      useWebGL2: 1,
    };
  }

  /** Backface material constructor
   * @return {object} Three.js material with this shader
   */
  create(texture, texelSize, vectorsTex, vectorsSize, isoThreshold, callbackMat) {
    // Init uniforms
    this.m_uniforms.texVolume.value = texture;
    this.m_uniforms.vectorsTex.value = vectorsTex;
    this.m_uniforms.texelSize.value = texelSize;
    this.m_uniforms.vectorsSize.value = vectorsSize;
    this.m_uniforms.isoThreshold.value = isoThreshold;
    // create shader loaders
    const vertexLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertexLoader.setResponseType('text');
    const fragmentLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    fragmentLoader.setResponseType('text');

    vertexLoader.load(AO_VERTEX_SHADER, (strVertexSh) => {
      this.m_strShaderVertex = strVertexSh;
      // console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(AO_FRAGMENT_SHADER, (strFragmentSh) => {
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
