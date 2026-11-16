/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Simple 2d mode material wiithout texture and lighting, only ambient color used
 * @module lib/scripts/gfx/matcolor2d
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

/** Class @class MaterialColor2d for create 2d lines, etc */
export default class MaterialColor2d {
  /** Simple material constructor
   * @constructor
   * @param (float) r - color component(red) in [0..1]
   * @param (float) g - color component(green) in [0..1]
   * @param (float) b - color component(blue) in [0..1]
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
  }

  create() {
    this.m_strShaderVertex = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;
    this.m_strShaderFragment = `
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
      }
    `;
    const material = new THREE.ShaderMaterial({
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment,
      //side: THREE.FrontSide,
      wireframe: true,
      //depthTest: false
      //clipping: false,
    });
    return material;
  }
}
