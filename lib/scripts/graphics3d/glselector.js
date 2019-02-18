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
   */
  createWebGLContext() {
    this.canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    let context = this.canvas.getContext('webgl2');
    this.m_useWebGL2 = 1;
    if (context == null) {
      console.log('WebGL 2 not supported, moving to webgl 1');
      context = this.canvas.getContext('webgl');
      this.m_useWebGL2 = 0;
    } else {
      console.log('WebGL 2 context created');
    }
    return context;
  }

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
