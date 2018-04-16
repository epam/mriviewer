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
  constructor(r, g, b) {
    this.m_uniforms = {
      colAmb: { type: 'v3', value: null },
    };
    this.m_strShaderFragment = `
      uniform vec3 colAmb;
      void main() {
      gl_FragColor = vec4(colAmb.xyz, 1.0);
      }`;
    this.m_strShaderVertex = `
      void main() {
      gl_Position = vec4(position, 1.0);
      }`;
    // Init uniforms
    this.m_uniforms.colAmb.value = new THREE.Vector3(r, g, b);
    // Create material
    this.m_material = new THREE.ShaderMaterial({
      uniforms: this.m_uniforms,
      wireframe: false,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment
    });
  } // constructor
}
