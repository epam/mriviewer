/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Clipping plane material, used for rendering of near camera plane as a part ray-casting pipeline
 * @module lib/scripts/gfx/matcliplane
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

import CLIP_VERTEX_SHADER from '../shaders/clipplane.vert';
import CLIP_FRAGMENT_SHADER from '../shaders/clipplane.frag';

/** Class @class MaterialClipPlane for volume clip plane rendering */
export default class MaterialClipPlane {
  /** ClipPlane material constructor
   * @constructor
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    this.m_uniforms = {
      MVP: { type: 'm4' },
      texBF: { type: 't' },
    };
  }

  /** Frontface material constructor
   * @return {object} Three.js material with this shader
   */
  create(textureBF, callbackMat) {
    // Init uniforms
    this.m_uniforms.texBF.value = textureBF;
    // create shader loaders
    const vertexLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertexLoader.setResponseType('text');
    const fragmentLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    fragmentLoader.setResponseType('text');

    vertexLoader.load(CLIP_VERTEX_SHADER, (strVertexSh) => {
      this.m_strShaderVertex = strVertexSh;
      // console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(CLIP_FRAGMENT_SHADER, (strFragmentSh) => {
        this.m_strShaderFragment = strFragmentSh;

        // log
        // {
        //   const strLoaded = JSON.stringify(this.m_strShaderVertex);
        //   console.log(`Readed vertex shader is: ${strLoaded} ...`);
        // }

        const material = new THREE.ShaderMaterial({
          uniforms: this.m_uniforms,
          vertexShader: this.m_strShaderVertex,
          fragmentShader: this.m_strShaderFragment,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}
