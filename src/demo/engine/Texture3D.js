/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';

export default class Texture3D {
  constructor() {
    this.m_texture = -1;
  }

  createFromRawVolume(vol) {
    this.m_texture = new THREE.DataTexture3D(vol.m_dataArray, vol.m_xDim, vol.m_yDim, vol.m_zDim);
  }
}
