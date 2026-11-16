/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Low resolution isosurface rendering material for CT dataset
 * @module lib/scripts/gfx/matrendertotexture
 */

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as THREE from 'three';

import RENDER_TEXTURE_VERTEX_SHADER from '../shaders/rendertotexture.vert';
import RENDER_TEXTURE_FRAGMENT_SHADER from '../shaders/rendertotexture.frag';

/** Class @class MaterialRenderToTexture for
 * rough isosurface computation: a ray-casting optimization
 */
export default class MaterialRenderToTexture {
  /** Simple material constructor
   * @constructor
   */
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    this.m_uniforms = {
      texTF: { type: 't', value: null },
      texVolume: { type: 't', value: null },
      texRoiId: { type: 't', value: null },
      texRoiColor: { type: 't', value: null },
      RoiVolumeTex: { type: 't', value: null },
      texVolumeMask: { type: 't', value: null },
      texVolumeAO: { type: 't', value: null },
      lightDir: { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
      texBF: { type: 't', value: null },
      texFF: { type: 't', value: null },
      t_function1min: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      t_function1max: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      t_function2min: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      t_function2max: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      stepSize: { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      texSize: { type: 'f', value: 0.0 },
      isoThreshold: { type: 'f', value: 0.0 },
      brightness3D: { type: 'f', value: 0.0 },
      contrast3D: { type: 'f', value: 0.0 },
      colorMap1D: { type: 't', value: null },
      heatMap1D: { type: 't', value: null },
      opacityBarrier: { type: 'f', value: 0.0 },
      tileCountX: { type: 'f', value: 0.0 },
      volumeSizeZ: { type: 'f', value: 0.0 },
      xDim: { type: 'f', value: 0.0 },
      yDim: { type: 'f', value: 0.0 },
      zDim: { type: 'f', value: 0.0 },
      ssaoOffsets: { type: 'v3v' },
    };
    this.m_defines = {
      isoRenderFlag: 0,
      MaskFlag: 0,
      useAmbientTex: 0,
      useWebGL2: 1,
    };
  }

  /** Simple material constructor
   * @return {object} Three.js material with this shader
   */
  create(texTF, texVol2d, texVolMask, texVolAO, texBackface, texFrontface, offsets, callbackMat) {
    // Init uniforms
    this.m_uniforms.texTF.value = texTF;
    this.m_uniforms.texVolume.value = texVol2d;
    this.m_uniforms.texVolumeMask.value = texVolMask;
    this.m_uniforms.texVolumeAO.value = texVolAO;
    this.m_uniforms.texBF.value = texBackface;
    this.m_uniforms.texFF.value = texFrontface;
    this.m_uniforms.ssaoOffsets.value = offsets;
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

        const material = new THREE.ShaderMaterial({
          uniforms: this.m_uniforms,
          defines: this.m_defines,
          vertexShader: this.m_strShaderVertex,
          fragmentShader: this.m_strShaderFragment,
          side: THREE.BackSide,
          depthTest: true,
          depthFunc: THREE.GreaterEqualDepth,
          blending: THREE.NoBlending,
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}
