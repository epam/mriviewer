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
* Material to enable back/front face culling with wireframe geom
* @module lib/scripts/gfx/matwireframecull
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

/** Class @class MaterialWC back/front face culling with wireframe rendering */
export default class MaterialWC {

  /** Wireframe material constructor
  * @constructor
  */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    this.m_defines = {
      backCullMode: 1,
    };
  }

  /** Wireframe material constructor
  * @return {object} Three.js material with this shader
  */
  create() {
    // Init uniforms

    this.m_strShaderVertex = `
      varying float cullvalue;
      void main() {
        cullvalue = (modelViewMatrix * vec4(normalize(position), 0.0)).z;
        gl_Position =  (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
      }
    `;
    this.m_strShaderFragment = `
      precision highp float;
      precision highp int;

      varying float cullvalue;
      void main() {
      #if backCullMode == 1
        if (cullvalue < 0.0)
          discard;
      #endif
      #if backCullMode == 0
        if (cullvalue > 0.0)
          discard;
      #endif

        gl_FragColor = vec4(0.5, 0.0, 1.0, 1.0);
      }
    `;
    const material = new THREE.ShaderMaterial({
      // uniforms: this.m_uniforms,
      defines: this.m_defines,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment,
      side: THREE.DoubleSide,
      wireframe: true,
      depthTest: false,
    });
    return material;
  }
}
