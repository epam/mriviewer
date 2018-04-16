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
 * 2d area tool
 * @module app/scripts/graphics2d/areatool
 */

import MeshText2D from './meshtext2d';
import MaterialColor2d from '../gfx/matcolor2d';
import Line2D from './line2d';

export default class RectTool {

  /**
   * Initialize area tool
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
    /** @property {Array} m_areas - array of 4 lines and text, contains all visible measurements */
    this.m_areas = [];
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
  }
  /**
   * Remove all area lines from scene
   */
  clearLines() {
    const length = this.m_areas.length;
    for (let i = 0; i < length; ++i) {
      const area = this.m_areas.pop();
      this.m_scene.remove(area.linex1.getRenderObject());
      this.m_scene.remove(area.linex2.getRenderObject());
      this.m_scene.remove(area.liney1.getRenderObject());
      this.m_scene.remove(area.liney2.getRenderObject());
      this.m_scene.remove(area.text);
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
    const length = this.m_areas.length;
    for (let i = 0; i < length; ++i) {
      this.m_scene.remove(this.m_areas[i].linex1.getRenderObject());
      this.m_scene.remove(this.m_areas[i].linex2.getRenderObject());
      this.m_scene.remove(this.m_areas[i].liney1.getRenderObject());
      this.m_scene.remove(this.m_areas[i].liney2.getRenderObject());
      this.m_scene.remove(this.m_areas[i].text);
      if (this.m_vertexes[COUNT_POINTS * i + MODULO_1] == null) {
        break;
      }
      const xS = (this.m_vertexes[COUNT_POINTS * i].xZ - posX) / zoom - (1 - 1 / zoom);
      const yS = (this.m_vertexes[COUNT_POINTS * i].yZ - posY) / zoom + (1 - 1 / zoom);
      const xE = (this.m_vertexes[COUNT_POINTS * i + MODULO_1].xZ - posX) / zoom - (1 - 1 / zoom);
      const yE = (this.m_vertexes[COUNT_POINTS * i + MODULO_1].yZ - posY) / zoom + (1 - 1 / zoom);
      const linex1 = new Line2D(this.m_scene, this.m_lineWidth, xS, yS, xE, yS, this.m_linesMaterial);
      this.m_areas[i].linex1 = linex1;
      const liney1 = new Line2D(this.m_scene, this.m_lineWidth, xS, yS, xS, yE, this.m_linesMaterial);
      this.m_areas[i].liney1 = liney1;
      const linex2 = new Line2D(this.m_scene, this.m_lineWidth, xS, yE, xE, yE, this.m_linesMaterial);
      this.m_areas[i].linex2 = linex2;
      const liney2 = new Line2D(this.m_scene, this.m_lineWidth, xE, yS, xE, yE, this.m_linesMaterial);
      this.m_areas[i].liney2 = liney2;
      let xText = xE, yText = yE;
      const INDENTATION = 0.05;
      if (yS < yE) {
        yText = this.m_yStart;
      }
      if (xS > xE) {
        xText = this.m_xStart;
      }
      xText += INDENTATION;
      yText -= INDENTATION;
      this.m_areas[i].text.updateText(xText, yText, this.m_textWidthScr,
        MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(this.m_areas[i].text);
    }
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

      const linex1 = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart,
        this.m_yStart, x, this.m_yStart, this.m_linesMaterial);
      const liney1 = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart,
        this.m_yStart, this.m_xStart, y, this.m_linesMaterial);

      const linex2 = new Line2D(this.m_scene, this.m_lineWidth, x, y, this.m_xStart, y, this.m_linesMaterial);
      const liney2 = new Line2D(this.m_scene, this.m_lineWidth, x, y, x, this.m_yStart, this.m_linesMaterial);
      const strMsg = '0 mm^2';
      const text = new MeshText2D(strMsg);
      text.updateText(x, y, this.m_textWidthScr, MeshText2D.ALIGN_CENTER,
        MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(text);
      this.m_areas.push({
        linex1, liney1, linex2, liney2, text
      });
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
      const area = this.m_areas.pop();
      this.m_scene.remove(area.linex1.getRenderObject());
      this.m_scene.remove(area.linex2.getRenderObject());
      this.m_scene.remove(area.liney1.getRenderObject());
      this.m_scene.remove(area.liney2.getRenderObject());

      const linex1 = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart,
        this.m_yStart, x, this.m_yStart, this.m_linesMaterial);
      const liney1 = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart,
        this.m_yStart, this.m_xStart, y, this.m_linesMaterial);

      const linex2 = new Line2D(this.m_scene, this.m_lineWidth, x, y, this.m_xStart, y, this.m_linesMaterial);
      const liney2 = new Line2D(this.m_scene, this.m_lineWidth, x, y, x, this.m_yStart, this.m_linesMaterial);

      this.m_scene.remove(area.text);

      const strMsg = `${(Math.abs(x - this.m_xStart) * this.m_xPixelSize *
      // eslint-disable-next-line
      Math.abs(y - this.m_yStart) * this.m_yPixelSize * zoom * zoom).toFixed(2)} mm^2`;
      const text = new MeshText2D(strMsg);

      let xText = x, yText = y;
      const INDENTATION = 0.05;
      if (this.m_yStart < y) {
        yText = this.m_yStart;
      }
      if (this.m_xStart > x) {
        xText = this.m_xStart;
      }
      xText += INDENTATION;
      yText -= INDENTATION;
      text.updateText(xText, yText, this.m_textWidthScr,
        MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);

      this.m_scene.add(text);
      this.m_areas.push({
        linex1, liney1, linex2, liney2, text
      });
    }
  }
}
