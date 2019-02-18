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
 * 2d angle tool
 * @module app/scripts/graphics2d/angletool
 */

import MeshText2D from './meshtext2d';
import MaterialColor2d from '../gfx/matcolor2d';
import Line2D from './line2d';

/** Possible tool states */
const angleToolState = {
  WAITING: 'waiting',
  FIRST_LINE: 'first',
  SECOND_LINE: 'second',
};

export default class AngleTool {

  /**
   * Initialize angle tool
   * @param (object) scene - scene object
   * @param (object) lineWidth - width of all lines
   */
  constructor(scene, lineWidth) {
    /** @property {Object} m_scene - scene object */
    this.m_scene = scene;
    /** @property {float} m_lineWidth - width for all lines */
    this.m_lineWidth = lineWidth;
    /** @property {boolean} m_state - FIRST_LINE/SECOND_LINE if first/second line is still being drawn */
    this.m_state = angleToolState.WAITING;
    /** @property {Object} m_linesMaterial - line material object */
    const R_MATERIAL = 0.86;
    const G_MATERIAL = 0.59;
    const B_MATERIAL = 0.17;
    this.m_linesMaterial = new MaterialColor2d(R_MATERIAL, G_MATERIAL, B_MATERIAL);
    /** @property {Array} m_angles - array of triplets (line1, line2, text), contains all visible measurements */
    this.m_angles = [];
    /** @property {Array} m_vertexes - array of pairs (x, y) */
    this.m_vertexes = [];
    /** @property {float} m_xStart - start x coordinate for current not fixed line */
    this.m_xStart = -1;
    /** @property {float} m_yStart - start y coordinate for current not fixed line */
    this.m_yStart = -1;
    /** @property {Array} m_firstVector - coordinates of first vector */
    this.m_firstVector = { x: 0, y: 0 };
    /** @property {float} m_textWidthScr - text width in [0..2] */
    this.m_textWidthScr = 0.03;
    /** @property {Object} m_textColor - text color */
    this.m_textColor = 'rgba(255, 255, 255, 255)';
    /** @property {Object} m_textBgColor - text background color */
    this.m_textBgColor = 'rgb(65, 65, 65)';
  }

  /**
   * Remove all distance lines from scene
   */
  clearLines() {
    const length = this.m_angles.length;
    for (let i = 0; i < length; ++i) {
      const angle = this.m_angles.pop();
      this.m_scene.remove(angle.line1.getRenderObject());
      this.m_scene.remove(angle.line2.getRenderObject());
      this.m_scene.remove(angle.text);
    }
    this.m_state = angleToolState.WAITING;
    this.m_vertexes = [];
  }

  /**
   * Redraw all lines
   */
  updateLines(zoom, posX, posY) {
    const COUNT_POINTS = 3;
    const MODULO_1 = 1;
    const MODULO_2 = 2;
    const length = this.m_angles.length;
    for (let i = 0; i < length; ++i) {
      this.m_scene.remove(this.m_angles[i].line1.getRenderObject());
      this.m_scene.remove(this.m_angles[i].line2.getRenderObject());
      this.m_scene.remove(this.m_angles[i].text);
      const x1 = (this.m_vertexes[COUNT_POINTS * i].xZ - posX) / zoom - (1 - 1 / zoom);
      const y1 = (this.m_vertexes[COUNT_POINTS * i].yZ - posY) / zoom + (1 - 1 / zoom);
      if (this.m_vertexes[COUNT_POINTS * i + MODULO_1] == null) {
        break;
      }
      const x2 = (this.m_vertexes[COUNT_POINTS * i + MODULO_1].xZ - posX) / zoom - (1 - 1 / zoom);
      const y2 = (this.m_vertexes[COUNT_POINTS * i + MODULO_1].yZ - posY) / zoom + (1 - 1 / zoom);
      if (this.m_vertexes[COUNT_POINTS * i + MODULO_2] == null) {
        break;
      }
      const x3 = (this.m_vertexes[COUNT_POINTS * i + MODULO_2].xZ - posX) / zoom - (1 - 1 / zoom);
      const y3 = (this.m_vertexes[COUNT_POINTS * i + MODULO_2].yZ - posY) / zoom + (1 - 1 / zoom);
      const line1 = new Line2D(this.m_scene, this.m_lineWidth, x1, y1, x2, y2, this.m_linesMaterial);
      const line2 = new Line2D(this.m_scene, this.m_lineWidth, x1, y1, x3, y3, this.m_linesMaterial);
      this.m_angles[i].line1 = line1;
      this.m_angles[i].line2 = line2;
      this.m_angles[i].text.updateText(x1, y1, this.m_textWidthScr,
        MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      this.m_scene.add(this.m_angles[i].text);
    }
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseDown(x, y, zoom, posX, posY) {
    const xZ = (x + (1 - 1 / zoom)) * zoom + posX;
    const yZ = (y - (1 - 1 / zoom)) * zoom + posY;
    switch (this.m_state) {
      case angleToolState.WAITING: {
        this.m_xStart = x;
        this.m_yStart = y;

        const line1 = new Line2D(this.m_scene, this.m_lineWidth, x, y, x, y, this.m_linesMaterial);
        const line2 = new Line2D(this.m_scene, this.m_lineWidth, x, y, x, y, this.m_linesMaterial);
        const strMsg = '0°';
        const text = new MeshText2D(strMsg);
        text.updateText(x, y, this.m_textWidthScr, MeshText2D.ALIGN_CENTER,
          MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
        this.m_scene.add(text);
        this.m_angles.push({ line1, line2, text });
        this.m_vertexes.push({ xZ, yZ });
        this.m_state = angleToolState.FIRST_LINE;
        break;
      }
      case angleToolState.FIRST_LINE: {
        // check pushed line has non-zero length
        const dx = x - this.m_xStart;
        const dy = y - this.m_yStart;
        const ESTIMATED_MIN_SCREEN_SIZE = 400.0;
        const MIN_PIXELS_DIST = 1.0 / ESTIMATED_MIN_SCREEN_SIZE;
        if (dx * dx + dy * dy > MIN_PIXELS_DIST * MIN_PIXELS_DIST) {
          this.m_state = angleToolState.SECOND_LINE;
        }
        this.m_vertexes.push({ xZ, yZ });
        break;
      }
      case angleToolState.SECOND_LINE: {
        this.m_xStart = -1;
        this.m_yStart = -1;
        this.m_firstVector.x = 0;
        this.m_firstVector.y = 0;
        this.m_state = angleToolState.WAITING;
        this.m_vertexes.push({ xZ, yZ });
        break;
      }
      default:
        console.log('Unexpected angle tool state');
        break;
    }
  }

  /**
   * Mouse move events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseMove(x, y) {
    let angle = null;
    switch (this.m_state) {
      case angleToolState.WAITING:
        break;
      case angleToolState.FIRST_LINE: {
        angle = this.m_angles.pop();
        this.m_scene.remove(angle.line1.getRenderObject());
        const line1 = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart, this.m_yStart, x, y,
          this.m_linesMaterial);
        this.m_firstVector.x = x - this.m_xStart;
        this.m_firstVector.y = y - this.m_yStart;
        angle.line1 = line1;
        this.m_angles.push(angle);
        break;
      }
      case angleToolState.SECOND_LINE: {
        const len1 = Math.sqrt(this.m_firstVector.x * this.m_firstVector.x +
          this.m_firstVector.y * this.m_firstVector.y);
        const len2 = Math.sqrt((x - this.m_xStart) * (x - this.m_xStart) + (y - this.m_yStart) * (y - this.m_yStart));
        // check both lines are too small
        const TOO_SMALL_VEC_LEN_MULT = 1.0e-5;
        if (len1 * len2 < TOO_SMALL_VEC_LEN_MULT) {
          break;
        }
        angle = this.m_angles.pop();
        this.m_scene.remove(angle.line2.getRenderObject());
        const line2 = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart, this.m_yStart, x, y,
          this.m_linesMaterial);
        this.m_scene.remove(angle.text);
        const strMsg = `${(Math.acos((this.m_firstVector.x * (x - this.m_xStart) +
          // eslint-disable-next-line
          this.m_firstVector.y * (y - this.m_yStart)) / (len1 * len2)) / Math.PI * 180).toFixed(2)}°`;
        const text = new MeshText2D(strMsg);
        const Y_SHIFT_UP = 0.02;
        text.updateText(this.m_xStart, this.m_yStart - Y_SHIFT_UP, this.m_textWidthScr, MeshText2D.ALIGN_CENTER,
          MeshText2D.ALIGN_TOP, this.m_textBgColor, this.m_textColor);
        this.m_scene.add(text);
        angle.line2 = line2;
        angle.text = text;
        this.m_angles.push(angle);
        break;
      }
      default:
        console.log('Unexpected angle tool state');
        break;
    }
  }

  updateVertexes(zoom, posX, posY) {
    this.m_vertexes = [];
    for (let i = 0; i < this.m_angles.length; ++i) {
      let xZ = (this.m_angles[i].line1.getxS() + (1 - 1 / zoom)) * zoom + posX;
      let yZ = (this.m_angles[i].line1.getyS() - (1 - 1 / zoom)) * zoom + posY;
      this.m_vertexes.push({ xZ, yZ });
      xZ = (this.m_angles[i].line1.getxE() + (1 - 1 / zoom)) * zoom + posX;
      yZ = (this.m_angles[i].line1.getyE() - (1 - 1 / zoom)) * zoom + posY;
      this.m_vertexes.push({ xZ, yZ });
      xZ = (this.m_angles[i].line2.getxE() + (1 - 1 / zoom)) * zoom + posX;
      yZ = (this.m_angles[i].line2.getyE() - (1 - 1 / zoom)) * zoom + posY;
      this.m_vertexes.push({ xZ, yZ });
    }
  }
}
