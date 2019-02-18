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
 * 2d text tool
 * @module app/scripts/graphics2d/areatool
 */

import MeshText2D from './meshtext2d';

export default class TextTool {

  /**
   * Initialize area tool
   * @param (object) scene - scene object
   */
  constructor(scene) {
    /** @property {Object} m_scene - scene object */
    this.m_scene = scene;
    /** @property {float} m_xPixelSize - canvas pixel size in mm for x axis */
    this.m_xPixelSize = -1; // in mm
    /** @property {float} yPixelSize - canvas pixel size in mm for y axis */
    this.m_yPixelSize = -1; // in mm
    /** @property {Array} m_textArr - array of text elements */
    this.m_textArr = [];
    /** @property {Array} m_vertexes - array of pairs (x, y) */
    this.m_vertexes = [];
    /** @property {float} m_textWidthScr - text width in [0..2] */
    this.m_textWidthScr = 0.03;
    /** @property {Object} m_textColor - text color */
    this.m_textColor = 'rgba(255, 255, 255, 255)';
    /** @property {Object} m_textBgColor - text background color */
    this.m_textBgColor = 'rgb(65, 65, 65)';
    /** @property {float} m_curX - x coordinate of current mouse down */
    this.m_curX = -1;
    /** @property {float} m_curY - y coordinate of current mouse down */
    this.m_curY = -1;
  }
  /**
   * Remove all area lines from scene
   */
  clear() {
    const length = this.m_textArr.length;
    for (let i = 0; i < length; ++i) {
      this.m_scene.remove(this.m_textArr.pop());
    }
    // this.m_runningState = false;
    this.m_vertexes = [];
  }
  /**
   * Redraw all lines
   */
  updateAll(zoom, posX, posY) {
    const length = this.m_textArr.length;
    for (let i = 0; i < length; ++i) {
      this.m_scene.remove(this.m_textArr[i]);
      if (this.m_vertexes[i] == null) {
        break;
      }
      const xText = (this.m_vertexes[i].xZ - posX) / zoom - (1 - 1 / zoom);
      const yText = (this.m_vertexes[i].yZ - posY) / zoom + (1 - 1 / zoom);
      this.m_textArr[i].updateText(xText, yText, this.m_textWidthScr,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(this.m_textArr[i]);
    }
  }

  move(i, newX, newY, zoom, posX, posY) {
    this.m_vertexes[i].xZ = (newX + (1 - 1 / zoom)) * zoom + posX;
    this.m_vertexes[i].yZ = (newY - (1 - 1 / zoom)) * zoom + posY;
    const xText = (this.m_vertexes[i].xZ - posX) / zoom - (1 - 1 / zoom);
    const yText = (this.m_vertexes[i].yZ - posY) / zoom + (1 - 1 / zoom);
    this.m_textArr[i].updateText(xText, yText, this.m_textWidthScr,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP, this.m_textBgColor, this.m_textColor);
  }

  /**
   * Set pixel size in mm
   * @param (float) xPixelSize - canvas pixel size in mm for x axis
   * @param (float) yPixelSize - canvas pixel size in mm for y axis
   */
  setPixelSize(xPixelSize, yPixelSize) { // in mm
    this.m_xPixelSize = xPixelSize;
    this.m_yPixelSize = yPixelSize;
  }
  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseDown(x, y, zoom, posX, posY) {
    this.m_curX = (x + (1 - 1 / zoom)) * zoom + posX;
    this.m_curY = (y - (1 - 1 / zoom)) * zoom + posY;
  }
  /**
   * Set text on screen
   * @param (String) text - text input by user
   */
  setText(text) {
    if (this.m_curX !== -1 && this.m_curY !== -1) {
      if (text !== '') {
        const textMesh = new MeshText2D(text);
        textMesh.updateText(this.m_curX, this.m_curY, this.m_textWidthScr, MeshText2D.ALIGN_LEFT,
          MeshText2D.ALIGN_TOP, this.m_textBgColor, this.m_textColor);
        this.m_scene.add(textMesh);
        this.m_textArr.push(textMesh);
        const xZ = this.m_curX;
        const yZ = this.m_curY;
        this.m_vertexes.push({ xZ, yZ });
      }
      this.m_curX = -1;
      this.m_curY = -1;
    }
  }
  /**
   * Cancel text input
   */
  cancelInput() {
    this.m_curX = -1;
    this.m_curY = -1;
  }
  /**
   * Remove text element by curX and curY coordinates
   * @return removed element text
   */
  removeCurTextByCoords() {
    for (let i = 0; i < this.m_textArr.length; ++i) {
      const mesh = this.m_textArr[i];
      if (mesh.m_xMin <= this.m_curX && this.m_curX <= mesh.m_xMax
        && mesh.m_yMin <= this.m_curY && this.m_curY <= mesh.m_yMax) {
        const text = mesh.getText();
        this.m_curX = mesh.m_xMin;
        this.m_curY = mesh.m_yMax;
        this.m_vertexes.splice(i, 1);
        this.m_scene.remove(mesh);
        this.m_textArr.splice(i, 1);
        return text;
      }
    }
    return null;
  }
}
