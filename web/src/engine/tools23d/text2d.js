/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
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
