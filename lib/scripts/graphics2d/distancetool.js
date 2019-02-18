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
 * 2d distance tool
 * @module app/scripts/graphics2d/distancetool
 */

import MeshText2D from './meshtext2d';
import MaterialColor2d from '../gfx/matcolor2d';
import Line2D from './line2d';

export default class DistanceTool {

  /**
   * Initialize distance tool
   * @param (object) scene - scene object
   * @param (object) lineWidth - width of all lines
   */
  constructor(scene, lineWidth) {
    /** @property {Object} m_scene - scene object */
    this.m_scene = scene;
    /** @property {float} m_lineWidth - width for all lines */
    this.m_lineWidth = lineWidth;
    /** @property {boolean} m_runningState - true if last line has not been fixed yet */
    this.m_runningState = false;
    /** @property {float} m_xPixelSize - canvas pixel size in mm for x axis */
    this.m_xPixelSize = -1; // in mm
    /** @property {float} yPixelSize - canvas pixel size in mm for y axis */
    this.m_yPixelSize = -1; // in mm
    /** @property {Object} m_linesMaterial - line material object */
    const R_MATERIAL = 0.86;
    const G_MATERIAL = 0.59;
    const B_MATERIAL = 0.17;
    this.m_linesMaterial = new MaterialColor2d(R_MATERIAL, G_MATERIAL, B_MATERIAL);
    /** @property {Array} m_distances - array of pairs (line, text), contains all visible measurements */
    this.m_distances = [];
    /** @property {Array} m_vertexes - array of pairs (x, y) */
    this.m_vertexes = [];
    /** @property {float} m_xStart - start x coordinate for current not fixed line */
    this.m_xStart = -1;
    /** @property {float} m_yStart - start y coordinate for current not fixed line */
    this.m_yStart = -1;
    /** @property {float} m_textWidthScr - text width in [0..2] */
    this.m_textWidthScr = 0.03;
    /** @property {Object} m_textColor - text color */
    this.m_textColor = 'rgba(255, 255, 255, 255)';
    /** @property {Object} m_textBgColor - text background color */
    this.m_textBgColor = 'rgb(65, 65, 65)';
    /** @property {float} m_zoom - size zoom */
    this.m_zoom = 1;
  }

  /**
   * Remove all distance lines from scene
   */
  clearLines() {
    const length = this.m_distances.length;
    for (let i = 0; i < length; ++i) {
      const dist = this.m_distances.pop();
      this.m_scene.remove(dist.line.getRenderObject());
      this.m_scene.remove(dist.text);
    }
    this.m_runningState = false;
    this.m_vertexes = [];
  }

  /**
   * Redraw all lines
   */
  updateLines(zoom, posX, posY) {
    const COUNT_POINTS = 2;
    const MODULO_1 = 1;
    const length = this.m_distances.length;
    for (let i = 0; i < length; ++i) {
      this.m_scene.remove(this.m_distances[i].line.getRenderObject());
      this.m_scene.remove(this.m_distances[i].text);
      const xS = (this.m_vertexes[COUNT_POINTS * i].xZ - posX) / zoom - (1 - 1 / zoom);
      const yS = (this.m_vertexes[COUNT_POINTS * i].yZ - posY) / zoom + (1 - 1 / zoom);
      if (this.m_vertexes[COUNT_POINTS * i + 1] == null) {
        break;
      }
      const xE = (this.m_vertexes[COUNT_POINTS * i + MODULO_1].xZ - posX) / zoom - (1 - 1 / zoom);
      const yE = (this.m_vertexes[COUNT_POINTS * i + MODULO_1].yZ - posY) / zoom + (1 - 1 / zoom);
      const line = new Line2D(this.m_scene, this.m_lineWidth, xS, yS, xE, yE, this.m_linesMaterial);
      this.m_distances[i].line = line;
      this.m_distances[i].text.updateText(0.5 * (xS + xE) - 0.00, 0.5 * (yS + yE) - 0.00, this.m_textWidthScr,
        MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(this.m_distances[i].text);
    }
  }

  /**
   * Update zoom
   */
  updateZoom(zoom) {
    this.m_zoom = zoom;
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
   * Return running state
   * @return {boolean} True if last line has not been fixed yet
   */
  isRunning() {
    return this.m_runningState;
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseDown(x, y, zoom, posX, posY) {
    this.m_runningState = !this.m_runningState;
    const xZ = (x + (1 - 1 / zoom)) * zoom + posX;
    const yZ = (y - (1 - 1 / zoom)) * zoom + posY;
    if (this.m_runningState) {
      this.m_xStart = x;
      this.m_yStart = y;

      const line = new Line2D(this.m_scene, this.m_lineWidth, x, y, x, y, this.m_linesMaterial);
      const strMsg = '0 mm';
      const text = new MeshText2D(strMsg);
      text.updateText(x, y, this.m_textWidthScr, MeshText2D.ALIGN_CENTER,
        MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(text);
      this.m_distances.push({ line, text });
      this.m_vertexes.push({ xZ, yZ });
    } else {
      this.m_vertexes.push({ xZ, yZ });
      this.m_xStart = -1;
      this.m_yStart = -1;
    }
  }

  /**
   * Mouse move events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseMove(x, y, zoom) {
    if (this.m_runningState) {
      const dist = this.m_distances.pop();
      this.m_scene.remove(dist.line.getRenderObject());
      const line = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart, this.m_yStart, x, y, this.m_linesMaterial);
      this.m_scene.remove(dist.text);
      const strMsg = `${(zoom * (Math.sqrt((x - this.m_xStart) * (x - this.m_xStart)
        * this.m_xPixelSize * this.m_xPixelSize +
        // eslint-disable-next-line
        (y - this.m_yStart) * (y - this.m_yStart) * this.m_yPixelSize * this.m_yPixelSize))).toFixed(2)} mm`;
      const text = new MeshText2D(strMsg);
      text.updateText(0.5 * (x + this.m_xStart) - 0.00, 0.5 * (y + this.m_yStart) - 0.00, this.m_textWidthScr,
        MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(text);
      this.m_distances.push({ line, text });
    }
  }

  updateVertexes(zoom, posX, posY) {
    this.m_vertexes = [];
    for (let i = 0; i < this.m_distances.length; ++i) {
      let xZ = (this.m_distances[i].line.getxS() + (1 - 1 / zoom)) * zoom + posX;
      let yZ = (this.m_distances[i].line.getyS() - (1 - 1 / zoom)) * zoom + posY;
      this.m_vertexes.push({ xZ, yZ });
      xZ = (this.m_distances[i].line.getxE() + (1 - 1 / zoom)) * zoom + posX;
      yZ = (this.m_distances[i].line.getyE() - (1 - 1 / zoom)) * zoom + posY;
      this.m_vertexes.push({ xZ, yZ });
    }
  }
}
