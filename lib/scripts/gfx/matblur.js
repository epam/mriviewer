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
* Blur material, used for rendering of blurred volume slices
* @module lib/scripts/gfx/matblur
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import THREE from 'n3d-threejs';

const BLUR_VERTEX_SHADER = './shaders/blur.vert';
const BLUR_FRAGMENT_SHADER = './shaders/blur.frag';

/** Class @class MaterialBlur for volume slice blurring */
export default class MaterialBlur {

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
    const BLUR_SIGMA = 1.2;
    this.m_uniforms = {
      texVolume: { type: 't', value: null },
      texelSize: { type: 'v3', value: THREE.Vector3(TEXEL_SIZE_1_256, TEXEL_SIZE_1_256, TEXEL_SIZE_1_256) },
      tileCountX: { type: 'f', value: TILE_COUNT_X },
      volumeSizeZ: { type: 'f', value: VOL_SIZE_Z },
      blurSigma:   { type: 'f', value: BLUR_SIGMA },
    };
    this.m_defines = {
      renderRoiMap: 0,
    };
  }

  /** Backface material constructor
  * @return {object} Three.js material with this shader
  */
  create(texture, texelSize, callbackMat) {
    // Init uniforms
    this.m_uniforms.texVolume.value = texture;
    this.m_uniforms.texelSize.value = texelSize;
    // create shader loaders
    const vertexLoader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
    vertexLoader.setResponseType('text');
    const fragmentLoader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
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
          fragmentShader: this.m_strShaderFragment
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}
