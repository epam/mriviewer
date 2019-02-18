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
* Frontface material, used for cube frontface rendering
* @module lib/scripts/gfx/matfrontface
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

const FRONT_FACE_VERTEX_SHADER = './shaders/frontface.vert';
const FRONT_FACE_FRAGMENT_SHADER = './shaders/frontface.frag';

/** Class @class MaterialFF for volume frontface rendering */
export default class MaterialFF {

  /** Frontface material constructor
  * @constructor
  */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    this.m_uniforms = {
      texBF: { type: 't', value: null },
      PlaneX: { type: 'v4', value: THREE.Vector4(-1.0, 0.0, 0.0, 0.5) },
      PlaneY: { type: 'v4', value: THREE.Vector4(0.0, -1.0, 0.0, 0.5) },
      PlaneZ: { type: 'v4', value: THREE.Vector4(0.0, 0.0, -1.0, 0.5) },
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

    vertexLoader.load(FRONT_FACE_VERTEX_SHADER, (strVertexSh) => {
      this.m_strShaderVertex = strVertexSh;
      // console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(FRONT_FACE_FRAGMENT_SHADER, (strFragmentSh) => {
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
          side: THREE.FrontSide,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth,
          blending: THREE.NoBlending,
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}
