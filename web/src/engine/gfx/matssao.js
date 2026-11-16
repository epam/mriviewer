/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Screen space ambient occlusion posteffect for the isosurface vr
 * @module lib/scripts/gfx/matssao
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

import RENDER_TEXTURE_VERTEX_SHADER from '../shaders/ssao.vert';
import RENDER_TEXTURE_FRAGMENT_SHADER from '../shaders/ssao.frag';

/** Class @class MaterialRenderSSAO for
 * ambient occlusion computation
 */
export default class MaterialRenderSSAO {
  /** Simple material constructor
   * @constructor
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    this.m_uniforms = {
      texColorFrame: { type: 't', value: null },
      texIsosurfFrame: { type: 't', value: null },
      texVolume: { type: 't', value: null },
      texBF: { type: 't', value: null },
      texFF: { type: 't', value: null },
      stepSize: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      texSize: { type: 'f', value: 0.0 },
      tileCountX: { type: 'f', value: 0.0 },
      volumeSizeZ: { type: 'f', value: 0.0 },
      xDim: { type: 'f', value: 0.0 },
      yDim: { type: 'f', value: 0.0 },
      zDim: { type: 'f', value: 0.0 },
      offsets: { type: 'v3v' },
    };
  }

  /** Simple material constructor
   * @return {object} Three.js material with this shader
   */
  create(texVol2d, texBackface, texFrontface, texIsosurfFrame, texColorFrame, callbackMat) {
    // Init uniforms
    this.m_uniforms.texVolume.value = texVol2d;
    this.m_uniforms.texBF.value = texBackface;
    this.m_uniforms.texFF.value = texFrontface;
    this.m_uniforms.texIsosurfFrame.value = texIsosurfFrame;
    this.m_uniforms.texColorFrame.value = texColorFrame;
    const offsets = [];
    // create offsets for ssao
    const nOffs = 16;
    const randScale = 2;
    const randShift = -1;
    for (let i = 0; i < nOffs; ++i) {
      const x = Math.random() * randScale + randShift;
      const y = Math.random() * randScale + randShift;
      const z = Math.random() * randScale + randShift;
      offsets.push(new THREE.Vector3(x, y, z));
    }
    this.m_uniforms.offsets.value = offsets;
    // create shader loaders
    const vertexLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertexLoader.setResponseType('text');
    const fragmentLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    fragmentLoader.setResponseType('text');

    vertexLoader.load(RENDER_TEXTURE_VERTEX_SHADER, (strVertexSh) => {
      this.m_strShaderVertex = strVertexSh;
      // console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(RENDER_TEXTURE_FRAGMENT_SHADER, (strFragmentSh) => {
        this.m_strShaderFragment = strFragmentSh;

        // log
        // {
        //   const strLoaded = JSON.stringify(this.m_strShaderVertex);
        //   console.log(`Readed vertex shader is: ${strLoaded} ...`);
        // }

        const material = new THREE.ShaderMaterial({
          uniforms: this.m_uniforms,
          // defines: this.m_defines,
          vertexShader: this.m_strShaderVertex,
          fragmentShader: this.m_strShaderFragment,
          side: THREE.BackSide,
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}
