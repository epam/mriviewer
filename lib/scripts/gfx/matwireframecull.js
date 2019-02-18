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
    this.m_uniforms = {
      texBF: { type: 't', value: null },
      texFF: { type: 't', value: null },
    };
  }

  /** Wireframe material constructor
  * @return {object} Three.js material with this shader
  */
  create(textureBF, textureFF) {
    // Init uniforms
    this.m_uniforms.texBF.value = textureBF;
    this.m_uniforms.texFF.value = textureFF;

    this.m_strShaderVertex = `
      varying vec3 pos;
      attribute vec3 uvw;
      varying vec4 screenpos;
      void main() {
        pos = uvw;
        screenpos = (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
        gl_Position =  screenpos;
      }
    `;
    this.m_strShaderFragment = `
      precision highp float;
      precision highp int;
      uniform sampler2D texFF;
      uniform sampler2D texBF;

      varying vec3 pos;
      varying vec4 screenpos;
      void main() {
      vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
      vec3 back  = texture2D(texBF, tc, 0.0).xyz;
      vec3 front = texture2D(texFF, tc, 0.0).xyz;
      float cullvalue = length(pos - back) - length(front - back);


      #if backCullMode == 1
        if (cullvalue < -0.001)
          discard;
      #endif
      #if backCullMode == 0
        if (cullvalue > 0.0)
          discard;
      #endif

        gl_FragColor = vec4(0.5, 0.0, 1.0, 1.0);
        //gl_FragColor = vec4(cullvalue, cullvalue, cullvalue, 1.0);
        //gl_FragColor = vec4(front, 1.0);
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms: this.m_uniforms,
      defines: this.m_defines,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment,
      side: THREE.DoubleSide,
      wireframe: true,
      depthTest: false,
      polygonOffset: false,
      polygonOffsetFactor: -4.0,
      polygonOffsetUnits: -4.0,
    });
    return material;
  }
}
