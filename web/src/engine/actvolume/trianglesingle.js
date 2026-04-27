/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Single triagle
 * @module lib/scripts/actvolume/trianglesingle
 */

// absolute imports
import * as THREE from 'three';

// relative imports

/**
 * Class TriangleSingle is one triangle
 * @class TriangleSingle
 */
export default class TriangleSingle {
  constructor() {
    this.va = new THREE.Vector3();
    this.vb = new THREE.Vector3();
    this.vc = new THREE.Vector3();
  }
}
