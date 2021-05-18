/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

// import * as THREE from 'three';

/**
* OpenGL, WebGL renderer selector
* @module lib/scripts/graphics3d/glselector
*/

export default class GlSelector {
  /** constructor: defines fields
  * @constructor
  */
  constructor() {
    this.m_useWebGL2 = undefined;
  }

  /** Create compatible canvas
   *
   *

  /** return canvas */
  getCanvas() {
    return this.canvas;
  }

  /** Create compatible canvas
   *
   */
  useWebGL2() {
    return this.m_useWebGL2;
  }
}
