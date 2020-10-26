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
* 2d text render
* @module lib/scripts/graphics2d/text2d
*/

import * as THREE from 'three';

import CanvasText from './canvastext';

/** Class Text2D is used for render text to canvas via HTML5 interface */
export default class Text2D extends THREE.Object3D {
  constructor(strText) {
    super();
    this.m_canvas = new CanvasText();
    this.m_align = new THREE.Vector2(0, 0);
    this.m_side = THREE.DoubleSide;
    this.m_antialias = true;
    this.m_text = strText;
  }
  getText() {
    return this.m_text;
  }
  setText(val) {
    if (this.m_text !== val) {
      this.m_text = val;
      this.updateText();
    }
  }
  getFont() {
    return this.m_font;
  }
  updateText() {
    console.log(`Use virtual method for ${this.m_text}`);
  }
  cleanUp() {
    if (this.texture) {
      this.texture.dispose();
    }
  }
  applyAntiAlias() {
    if (this.antialias === false) {
      this.texture.magFilter = THREE.NearestFilter;
      this.texture.minFilter = THREE.LinearMipMapLinearFilter;
    }
  }
}
