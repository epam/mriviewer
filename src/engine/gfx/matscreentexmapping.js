/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Material to map texture using screen positions of the fragments
 * @module lib/scripts/gfx/matscreentexmapping
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

/** Class @class MaterialScreenTexMap to aux backface texture rendering for the
 *  frontface geometry to avoid z-fighting
 */
export default class MaterialScreenTexMap {
  /** Wireframe material constructor
   * @constructor
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';

    this.m_uniforms = {
      texBuffer: { type: 't', value: null },
    };
  }

  /** material constructor
   * @return {object} Three.js material with this shader
   */
  create(texBuffer) {
    // Init uniforms
    this.m_uniforms.texBuffer.value = texBuffer;
    this.m_strShaderVertex = `
      varying vec4 screenpos;
      void main() {
        screenpos = (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
        gl_Position =  screenpos;
      }
    `;
    this.m_strShaderFragment = `
      precision highp float;
      precision highp int;
      uniform sampler2D texBuffer;

      varying vec4 screenpos;
      void main() {
        vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
        gl_FragColor = texture2D(texBuffer, tc, 0.0);
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms: this.m_uniforms,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment,
      side: THREE.FrontSide,
      depthTest: true,
      depthFunc: THREE.LessEqualDepth,
      blending: THREE.NoBlending,
    });
    return material;
  }
}
