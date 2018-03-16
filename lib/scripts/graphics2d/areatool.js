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

export default class AreaTool {

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
    /** @property {Array} m_vertexes - array of pairs (x, y) */
    this.m_vertexes2 = [];
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
    /** @property {float} m_area - shows the area */
    this.m_area = 0; //in mm^2
    /** @property {float} last_length - sequence number of the closing vertex */
    this.last_length = 0;
    /** @property {Array} last_lengths - sequence number of the closing vertex */
    this.m_last_lengths = [];
    /** @property {float} epsilon - distance between first vertex and current position
     * to trigger connection to the first vertex*/
    this.epsilon = 0.02;
    /** @property {boolean} connect_line - flag for drawing line between
     * cursor and first vertex*/
    this.connect_line = false;
  }

  /**
   * Remove all distance lines from scene
   */
  clearLines() {
    const length = this.m_distances.length;
    for (let i = 0; i < length; i++) {
      const dist = this.m_distances.pop();
      this.m_scene.remove(dist.line.getRenderObject());
      this.m_scene.remove(dist.text);
    }
    this.m_vertexes = [];
    this.m_last_lengths = [];
    this.m_area = 0;
    this.m_runningState = false;
    this.m_xStart = -1;
    this.m_yStart = -1;
    this.last_length = 0;
  }

  /**
   * Redraw all lines
   */
  updateLines(zoom, posX, posY) {
    const length = this.m_distances.length;
    for (let i = 0; i < length; ++i) {
      this.m_scene.remove(this.m_distances[i].line.getRenderObject());
      this.m_scene.remove(this.m_distances[i].text);
      if (this.m_vertexes2[i] == null) {
        break;
      }
      const xS = (this.m_vertexes2[i].xS - posX) / zoom - (1 - 1 / zoom);
      const yS = (this.m_vertexes2[i].yS - posY) / zoom + (1 - 1 / zoom);
      const xE = (this.m_vertexes2[i].xE - posX) / zoom - (1 - 1 / zoom);
      const yE = (this.m_vertexes2[i].yE - posY) / zoom + (1 - 1 / zoom);
      const line = new Line2D(this.m_scene, this.m_lineWidth, xS, yS, xE, yE, this.m_linesMaterial);
      this.m_distances[i].line = line;
      if (this.m_distances[i].text != null) {
        this.m_distances[i].text.updateText(0.5 * (xS + xE) - 0.00, 0.5 * (yS + yE) - 0.00, this.m_textWidthScr,
          MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
        this.m_scene.add(this.m_distances[i].text);
      }
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
   * Return point of intersection
   * @param (Object) point1 - first point of first segment
   * @param (Object) point2 - second point of first segment
   * @param (Object) point3 - first point of second segment
   * @param (Object) point4 - second point of second segment
   * @return {Array} coordinate point of intersection and information about the belonging point of a straight line
   */
  lineIntersect(point1, point2, point3, point4) {
    const x1 = point1.x, y1 = point1.y;
    const x2 = point2.x, y2 = point2.y;
    const x3 = point3.x, y3 = point3.y;
    const x4 = point4.x, y4 = point4.y;
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0 || (x2 === x3 && y2 === y3)) {
      return null;
    }
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);
    const seg1 = ua >= 0 && ua <= 1;
    const seg2 = ub >= 0 && ub <= 1;
    return {
      x,
      y,
      seg1,
      seg2
    };
  }

  /**
   * Calculate area of polygon
   * @param (float) length - number of points in the polygon
   * @return {float} area of polygon
   */
  calculateArea(length) {
    let sum1 = 0;
    let sum2 = 0;
    let result = 0;
    const MINIMUM_COUNT_OF_VERTEX = 2;
    if (length > MINIMUM_COUNT_OF_VERTEX) {
      for (let i = this.last_length; i < length - 1; ++i) {
        sum1 += this.m_vertexes[i].x * this.m_vertexes[i + 1].y * this.m_xPixelSize * this.m_yPixelSize;
        sum2 += this.m_vertexes[i + 1].x * this.m_vertexes[i].y * this.m_xPixelSize * this.m_yPixelSize;
      }
      result = (0.5 * Math.abs(sum1
        + this.m_vertexes[length - 1].x * this.m_vertexes[this.last_length].y * this.m_xPixelSize * this.m_yPixelSize
        - sum2 - this.m_vertexes[this.last_length].x * this.m_vertexes[length - 1].y
        * this.m_xPixelSize * this.m_yPixelSize));

      const endl = length - 1;
      const begin = this.last_length;
      this.m_last_lengths.push({ begin, endl });

      return result;
    }
    return -1;
  }

  /**
   * Draw lines
   * @param (Array) vertex1 - first point of line
   * @param (Array) vertex2 - second point of line
   * @param (String) str - text on line
   * @param (float) xText - x coordinate of text
   * @param (float) yText - y coordinate of text
   */
  drawLine(vertex1, vertex2, str, xText, yText) {
    const line = new Line2D(this.m_scene, this.m_lineWidth,
      vertex1.x, vertex1.y, vertex2.x, vertex2.y, this.m_linesMaterial);
    const strMsg = str;
    const text = new MeshText2D(strMsg);
    text.updateText(xText, yText, this.m_textWidthScr,
      MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
    this.m_scene.add(text);
    this.m_distances.push({ line, text });
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseDown(x, y, zoom, posX, posY) {
    const MINIMUM_COUNT_OF_VERTEX = 3;
    const MINIMUM_LENGTH_OF_VERTEX = 2;
    const ACCURACY = 2;
    const INDENTATION = 0.05;
    this.m_runningState = true;
    this.m_vertexes.push({ x, y });
    if (this.m_runningState) {
      let i;
      let length;
      length = this.m_vertexes.length;
      if (length > this.last_length + MINIMUM_COUNT_OF_VERTEX) {
        if (this.connect_line === true) {
          x = this.m_vertexes[this.last_length].x;
          y = this.m_vertexes[this.last_length].y;
          let xText = x, yText = y;
          if (x >= this.m_vertexes[this.last_length].x) {
            xText += INDENTATION;
          } else {
            xText -= INDENTATION;
          }
          if (y >= this.m_vertexes[this.last_length].y) {
            yText += INDENTATION;
          } else {
            yText -= INDENTATION;
          }
          this.m_runningState = false;
          for (let l = 0; l < MINIMUM_LENGTH_OF_VERTEX; l++) {
            const dist = this.m_distances.pop();
            this.m_scene.remove(dist.line.getRenderObject());
            this.m_scene.remove(dist.text);
          }
          this.m_vertexes.pop();
          length = this.m_vertexes.length;
          this.m_area = this.calculateArea(length) * zoom * zoom;
          this.drawLine(this.m_vertexes[length - 1], this.m_vertexes[this.last_length],
            `${this.m_area.toFixed(ACCURACY)} mm^2`, xText, yText);
          this.m_runningState = false;
          this.connect_line = false;
          this.last_length = length;
          this.m_vertexes2 = [];
          for (i = 0; i < this.m_distances.length; ++i) {
            const xS = (this.m_distances[i].line.getxS() + (1 - 1 / zoom)) * zoom + posX;
            const yS = (this.m_distances[i].line.getyS() - (1 - 1 / zoom)) * zoom + posY;
            const xE = (this.m_distances[i].line.getxE() + (1 - 1 / zoom)) * zoom + posX;
            const yE = (this.m_distances[i].line.getyE() - (1 - 1 / zoom)) * zoom + posY;
            this.m_vertexes2.push({
              xS, yS, xE, yE
            });
          }
        } else {
          /**checking for point of intersection between new line and every line in array*/
          for (i = this.last_length;
            i < (length - this.last_length - MINIMUM_LENGTH_OF_VERTEX) + this.last_length; i++) {
            /** getting result of intersection*/
            const result = this.lineIntersect(this.m_vertexes[i],
              this.m_vertexes[i + 1], this.m_vertexes[length - MINIMUM_LENGTH_OF_VERTEX], this.m_vertexes[length - 1]);
            if (result !== null) {
              if (result.seg1 === true && result.seg2 === true) {
                x = result.x;
                y = result.y;
                /**clearing graphics*/
                for (let j = this.last_length; j < length - 1; j++) {
                  const dist = this.m_distances.pop();
                  this.m_scene.remove(dist.line.getRenderObject());
                  this.m_scene.remove(dist.text);
                }
                /**if intersection detected on line 'i' - removing all points before i*/
                for (let k = this.last_length; k <= i; k++) {
                  this.m_vertexes.shift();
                }
                /**removing last point*/
                this.m_vertexes.pop();
                /**adding point of intersection in the beggining of array*/
                this.m_vertexes.splice(this.last_length, 0, { x, y });
                length = this.m_vertexes.length;
                /**calculating area*/
                this.m_area = this.calculateArea(length) * zoom * zoom;
                /**redraw lines with new coordinates and print area*/
                for (i = this.last_length; i < length - 1; i++) {
                  this.drawLine(this.m_vertexes[i], this.m_vertexes[i + 1], ' ',
                    0.5 * (this.m_vertexes[i + 1].x + this.m_vertexes[i].x)
                    - 0.00, 0.5 * (this.m_vertexes[i + 1].y + this.m_vertexes[i].y) - 0.00);
                }
                /** connect first and last point*/
                this.drawLine(this.m_vertexes[length - 1], this.m_vertexes[this.last_length], ' ',
                  0.5 * (this.m_vertexes[length - 1].x + this.m_vertexes[this.last_length].x)
                  - 0.00, 0.5 * (this.m_vertexes[length - 1].y + this.m_vertexes[this.last_length].y) - 0.00);
                /** drawing size of area on screen*/
                this.drawLine(this.m_vertexes[length - 1], this.m_vertexes[this.last_length],
                  `${this.m_area.toFixed(ACCURACY)} mm^2`, x, y);
                /**ending of intersection*/
                this.m_runningState = false;
                this.last_length = length;
                this.m_vertexes2 = [];
                for (i = 0; i < this.m_distances.length; ++i) {
                  const xS = (this.m_distances[i].line.getxS() + (1 - 1 / zoom)) * zoom + posX;
                  const yS = (this.m_distances[i].line.getyS() - (1 - 1 / zoom)) * zoom + posY;
                  const xE = (this.m_distances[i].line.getxE() + (1 - 1 / zoom)) * zoom + posX;
                  const yE = (this.m_distances[i].line.getyE() - (1 - 1 / zoom)) * zoom + posY;
                  this.m_vertexes2.push({
                    xS, yS, xE, yE
                  });
                }
                /** delete dublicated last line*/
                const PENULTIMATE = 2;
                const dist = this.m_distances[this.m_distances.length - PENULTIMATE];
                this.m_scene.remove(dist.line.getRenderObject());
                this.m_scene.remove(dist.text);
                this.m_distances.splice(this.m_distances.length - PENULTIMATE, 1);
                break;
              }
            }
          }
        }
      }
      /** set point for the next line */
      this.m_xStart = x;
      this.m_yStart = y;
      if (this.m_runningState === true) {
        const line = new Line2D(this.m_scene, this.m_lineWidth, x, y, x, y, this.m_linesMaterial);
        this.m_distances.push({ line });
      }
    }
  }

  /**
   * Mouse move events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseMove(x, y) {
    const MINIMUM_LENGTH_OF_VERTEX = 2;
    if (this.m_runningState) {
      const dist = this.m_distances.pop();
      this.m_scene.remove(dist.line.getRenderObject());
      if (this.connect_line === true) {
        const dist2 = this.m_distances.pop();
        this.m_scene.remove(dist2.line.getRenderObject());
        this.connect_line = false;
      }
      let line = new Line2D(this.m_scene, this.m_lineWidth, this.m_xStart, this.m_yStart, x, y, this.m_linesMaterial);
      this.m_distances.push({ line });
      if ((Math.abs(this.m_vertexes[this.last_length].x - x) < this.epsilon) &&
        (Math.abs(this.m_vertexes[this.last_length].y - y) < this.epsilon) &&
        this.m_vertexes.length > MINIMUM_LENGTH_OF_VERTEX) {
        line = new Line2D(this.m_scene, this.m_lineWidth, this.m_vertexes[this.last_length].x
          , this.m_vertexes[this.last_length].y, x, y, this.m_linesMaterial);
        this.m_distances.push({ line });
        this.connect_line = true;
      }
    }
  }

  updateVertexes(zoom, posX, posY) {
    this.m_vertexes2 = [];
    //this.m_vertexes = [];
    for (let i = 0; i < this.m_distances.length; ++i) {
      const xS = (this.m_distances[i].line.getxS() + (1 - 1 / zoom)) * zoom + posX;
      const yS = (this.m_distances[i].line.getyS() - (1 - 1 / zoom)) * zoom + posY;
      const xE = (this.m_distances[i].line.getxE() + (1 - 1 / zoom)) * zoom + posX;
      const yE = (this.m_distances[i].line.getyE() - (1 - 1 / zoom)) * zoom + posY;
      //const x = xS;
      //const y = yS;
      //this.m_vertexes.push({ x, y });
      this.m_vertexes2.push({
        xS, yS, xE, yE
      });
    }
  }
}
