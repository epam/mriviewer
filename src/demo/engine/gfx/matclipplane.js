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
* Clipping plane material, used for rendering of near camera plane as a part ray-casting pipeline
* @module lib/scripts/gfx/matcliplane
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

const CLIP_VERTEX_SHADER = './shaders/clipplane.vert';
const CLIP_FRAGMENT_SHADER = './shaders/clipplane.frag';

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
