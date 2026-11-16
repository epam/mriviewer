/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
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
import FRONT_FACE_VERTEX_SHADER from '../shaders/frontface.vert';
import FRONT_FACE_FRAGMENT_SHADER from '../shaders/frontface.frag';

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
      PlaneX: { type: 'v4', value: new THREE.Vector4(-1.0, 0.0, 0.0, 0.5) },
      PlaneY: { type: 'v4', value: new THREE.Vector4(0.0, -1.0, 0.0, 0.5) },
      PlaneZ: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, -1.0, 0.5) },
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
      //console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(
        FRONT_FACE_FRAGMENT_SHADER,
        (strFragmentSh) => {
          this.m_strShaderFragment = strFragmentSh;

          const NEED_LOG = false;
          if (NEED_LOG) {
            const strLoadedVert = JSON.stringify(this.m_strShaderVertex);
            console.log(`Readed vertex shader is: ${strLoadedVert} ...`);
            const strLoadedFrag = JSON.stringify(this.m_strShaderFragment);
            console.log(`Readed fragment shader is: ${strLoadedFrag} ...`);
          }
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
        },
        /*(strFragmentSh) => {},*/
        (e) => {
          console.log('Shader load failed! because of error ' + e.target.status + ', ' + e.target.statusText);
        }
      );
    });
  }
}
