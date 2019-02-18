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
* Text rendering to canvas
* @module lib/scripts/graphics2d/canvastext
*/

// import * as THREE from 'three';

const FONT_FOR_TEXT_RENDER = '72px Arial';

/** Class CanvasText is used for render text to canvas via HTML5 interface */
export default class CanvasText {
  /**
  * Initialize Canvas text renderer
  */
  constructor() {
    this.m_textWidth = 0;
    this.m_textHeight = 0;
    this.m_canvas = document.createElement('canvas');
    this.m_ctx = this.m_canvas.getContext('2d');
  }
  get width() {
    return this.m_canvas.width;
  }
  get height() {
    return this.m_canvas.height;
  }
  get textWidth() {
    return this.m_textWidth;
  }
  get textHeight() {
    return this.m_textHeight;
  }

  static getFontHeight(strFont) {
    const body = document.getElementsByTagName('body')[0];
    const dummy = document.createElement('div');
    const dummyText = document.createTextNode('GyW~ig^');
    dummy.appendChild(dummyText);
    dummy.setAttribute('style', `font:${strFont};position:absolute;top:0;left:0`);
    body.appendChild(dummy);
    const result = dummy.offsetHeight;
    // fontHeightCache[fontStyle] = result;
    body.removeChild(dummy);
    return result;
  }

  /**
  * Returns the smallest power of 2 that is greater than or equal to val.
  * @param (number) val - value to search closest power of 2.
  * @return {number} the smallest power of 2 that is greater than or equal to val
  */
  static ceilPowerOfTwo(val) {
    const FAIL = -1;
    const MAX_PWR = 30;
    for (let i = 1; i < MAX_PWR; i++) {
      const valPwr = 1 << i;
      if (valPwr >= val) {
        return valPwr;
      }
    }
    return FAIL;
  }

  /**
  * Initialize Canvas text renderer
  * @param (strint) strTextToRender - text to render
  * @return {Object} Canvas with rendered text
  */
  drawText(strTextToRender, strTextColor) {
    // clear screen
    this.m_canvas.width = 1024;
    this.m_canvas.height = 512;
    this.m_ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    const MAX_EXTENT_X = 512;
    const MAX_EXTENT_Y = 128;
    this.m_ctx.fillRect(0, 0, MAX_EXTENT_X, MAX_EXTENT_Y);

    this.m_ctx.font = FONT_FOR_TEXT_RENDER;
    this.m_ctx.fillStyle = strTextColor;
    this.m_ctx.strokeStyle = strTextColor;
    this.m_ctx.textAlign = 'left';
    this.m_ctx.textBaseline = 'top';
    this.m_ctx.lineWidth = 2;

    const strText = (strTextToRender.length === 0) ? '?' : strTextToRender;

    this.m_textWidth = Math.floor(this.m_ctx.measureText(strText).width);
    this.m_textHeight = CanvasText.getFontHeight(FONT_FOR_TEXT_RENDER);


    // set canvas size to desired dimension
    // this.m_canvas.width = THREE.Math.ceilPowerOfTwo(this.m_textWidth);
    // this.m_canvas.height = THREE.Math.ceilPowerOfTwo(this.m_textHeight);
    this.m_canvas.width = CanvasText.ceilPowerOfTwo(this.m_textWidth);
    this.m_canvas.height = CanvasText.ceilPowerOfTwo(this.m_textHeight);

    // console.log(`CanvasText canvas size = ${this.m_canvas.width} * ${this.m_canvas.height}`);
    // console.log(`CanvasText  text size = ${this.m_textWidth} * ${this.m_textHeight}`);

    // clear screen
    this.m_ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    this.m_ctx.fillRect(0, 0, this.m_canvas.width, this.m_canvas.height);

    // render text string
    this.m_ctx.font = FONT_FOR_TEXT_RENDER;
    this.m_ctx.fillStyle = strTextColor;
    this.m_ctx.strokeStyle = strTextColor;
    this.m_ctx.textAlign = 'left';
    this.m_ctx.textBaseline = 'top';
    this.m_ctx.fillText(strText, 0, 0);
  }
}
