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
 * 2d edit tool
 * @module app/scripts/graphics2d/deletetool
 */

import MeshText2D from './meshtext2d';
import MaterialColor2d from '../gfx/matcolor2d';
import Line2D from './line2d';

export default class EditTool {

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
    /** @property {Object} m_pointMaterial - line material object */
    const R_MATERIALP = 0.01;
    const G_MATERIALP = 0.59;
    const B_MATERIALP = 0.01;
    this.m_pointMaterial = new MaterialColor2d(R_MATERIALP, G_MATERIALP, B_MATERIALP);
    /** @property {Array} m_distances - array of pairs (line, text), contains all visible measurements */
    this.m_distances = [];
    /** @property {Array} m_distances - array of pairs (line, text), contains all visible measurements */
    this.m_point = [];
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
    /** @property {float} epsilon - distance between first vertex and current position
     * to trigger connection to the first vertex*/
    this.epsilon = 0.02;
    this.m_checkedLines = [];
    this.m_checkedAngles = [];
    this.m_checkedRects = [];
    this.m_checkedAreasDistances = [];
    this.isPointsExist = false;
    this.isOut = false;
    this.m_xInnerShift = 0.0;
    this.m_yInnerShift = 0.0;
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
    this.deletePoints();
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
      if (this.m_vertexes[COUNT_POINTS2 * i + 1] == null) {
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
  onMouseDown() {
    this.m_runningState = true;
    //console.log(`${this.m_runningState}`);
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseUp() {
    this.m_runningState = false;
    //console.log(`${this.m_runningState}`);
  }

  /**
   * Mouse move events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseMove(x, y, zoom, distancesV, anglesA, rectsR, areaD, areaTool, textTool, posX, posY) {
    this.isOut = false;
    const ACCURACY = 2;
    let newLine = null;
    let newLine2 = null;
    let countLine = -1;
    let countLine2 = -1;
    for (let i = 0; i < distancesV.length; ++i) {
      /*console.log("kek");
      console.log(`${distancesV[i].line.getxS()}`);
      console.log(`${x}`);
      console.log(`${distancesV[i].line.getyS()}`);
      console.log(`${y}`);*/
      if (this.m_runningState) {
        if (newLine == null) {
          newLine = this.processingLine(distancesV[i].line, x, y);
        }
        if (newLine != null) {
          this.m_scene.remove(distancesV[i].line.getRenderObject());
          this.m_scene.remove(distancesV[i].text);
          distancesV[i].line = newLine;
          const strMsg = `${(zoom * (Math.sqrt((newLine.getxS() - newLine.getxE()) * (newLine.getxS() - newLine.getxE())
            * this.m_xPixelSize * this.m_xPixelSize +
            // eslint-disable-next-line
            (newLine.getyS() - newLine.getyE()) * (newLine.getyS() - newLine.getyE()) * this.m_yPixelSize * this.m_yPixelSize))).toFixed(2)} mm`;
          const text = new MeshText2D(strMsg);
          text.updateText(0.5 * (newLine.getxS() + newLine.getxE()) - 0.00,
            0.5 * (newLine.getyS() + newLine.getyE()) - 0.00, this.m_textWidthScr,
            MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
          distancesV[i].text = text;
          this.m_scene.add(distancesV[i].text);
          newLine = null;
          break;
        }
      } else {
        this.processingLine2(distancesV[i].line, x, y);
      }
    }
    if (this.m_runningState) { // text: recalculate distance
      if (newLine != null && distancesV.length !== 0 && countLine !== -1) {
        this.m_scene.remove(distancesV[distancesV.length - 1].line.getRenderObject());
        this.m_scene.remove(distancesV[distancesV.length - 1].text);
        distancesV[distancesV.length - 1].line = newLine;
        const strMsg = `${(zoom * (Math.sqrt((newLine.getxS() - newLine.getxE())
          * (newLine.getxS() - newLine.getxE()) * this.m_xPixelSize * this.m_xPixelSize +
          // eslint-disable-next-line
          (newLine.getyS() - newLine.getyE()) * (newLine.getyS() - newLine.getyE())
          * this.m_yPixelSize * this.m_yPixelSize))).toFixed(ACCURACY)} mm`;
        const text = new MeshText2D(strMsg);
        text.updateText(0.5 * (newLine.getxS() + newLine.getxE()) - 0.00,
          0.5 * (newLine.getyS() + newLine.getyE()) - 0.00, this.m_textWidthScr,
          MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
        distancesV[distancesV.length - 1].text = text;
        this.m_scene.add(distancesV[distancesV.length - 1].text);
        newLine = null;
      }
    }

    countLine = -1;
    countLine2 = -1;
    //console.log('length area');
    //console.log(`${areaD.length}`);
    for (let a = 0; a < areaD.length; ++a) {
      if (this.m_runningState) {
        if (newLine === null && countLine === -1) {
          newLine = this.processingLine(areaD[a].line, x, y);
        }
        if (newLine != null) {
          countLine = a;
          break;
        }
      } else {
        this.processingLine2(areaD[a].line, x, y);
      }
    }
    for (let a = 0; a < areaD.length; ++a) {
      if (this.m_runningState) {
        if (newLine2 === null && a !== countLine) {
          newLine2 = this.processingLine(areaD[a].line, x, y);
        }
        if (newLine2 !== null) {
          countLine2 = a;
          break;
        }
      }
    }
    if (this.m_runningState && areaD.length !== 0 && countLine !== -1) {
      if (newLine !== null) {
        this.m_scene.remove(areaD[countLine].line.getRenderObject());
        areaD[countLine].line = newLine;
        newLine = null;
      }
      if (newLine2 !== null) {
        this.m_scene.remove(areaD[countLine2].line.getRenderObject());
        areaD[countLine2].line = newLine2;
        newLine2 = null;
      }
      console.log('AREA');
      //console.log(`${countLine}`);
      //console.log(`${countLine2}`);
      const pos = this.num(areaTool.m_last_lengths, countLine);
      //console.log(`${pos.begin}`);
      //console.log(`${pos.endl}`);
      this.m_scene.remove(areaD[pos.endl].text);
      /*need for 0 point*/
      areaTool.updateVertexes(zoom, posX, posY);

      console.log(`${areaTool.m_vertexes2[pos.endl].xS}`);
      const area = this.updateArea(areaTool.m_last_lengths, countLine, areaTool.m_vertexes2);
      const strMsgAr = `${(area).toFixed(ACCURACY)} mm^2`;
      const textAr = new MeshText2D(strMsgAr);
      textAr.updateText(0.5 * (areaD[pos.endl].line.getxS() + areaD[pos.endl].line.getxE()) - 0.00,
        0.5 * (areaD[pos.endl].line.getyS() + areaD[pos.endl].line.getyE()) - 0.00, this.m_textWidthScr,
        MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_CENTER, this.m_textBgColor, this.m_textColor);
      areaD[pos.endl].text = textAr;
      this.m_scene.add(areaD[pos.endl].text);
      newLine = null;
    }

    countLine = -1;
    countLine2 = -1;
    for (let n = 0; n < anglesA.length; ++n) {
      if (this.m_runningState) {
        //console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        if (newLine === null) {
          newLine = this.processingLine(anglesA[n].line1, x, y);
        }
        if (newLine2 === null) {
          newLine2 = this.processingLine(anglesA[n].line2, x, y);
        }
        if (newLine !== null || newLine2 !== null) {
          countLine = n;
          break;
        }
      } else {
        this.processingLine2(anglesA[n].line1, x, y);
        this.processingLine2(anglesA[n].line2, x, y);
      }
    }
    if (this.m_runningState && anglesA.length !== 0 && countLine !== -1) {
      if (newLine != null) {
        this.m_scene.remove(anglesA[countLine].line1.getRenderObject());
        anglesA[countLine].line1 = newLine;
        newLine = null;
      }
      if (newLine2 != null) {
        this.m_scene.remove(anglesA[countLine].line2.getRenderObject());
        anglesA[countLine].line2 = newLine2;
        newLine2 = null;
      }
      this.m_scene.remove(anglesA[countLine].text);
      const len1 = Math.sqrt((anglesA[countLine].line1.getxS() - anglesA[countLine].line1.getxE()) *
        (anglesA[countLine].line1.getxS() - anglesA[countLine].line1.getxE()) +
        (anglesA[countLine].line1.getyS() - anglesA[countLine].line1.getyE()) *
        (anglesA[countLine].line1.getyS() - anglesA[countLine].line1.getyE()));
      const len2 = Math.sqrt((anglesA[countLine].line2.getxS() - anglesA[countLine].line2.getxE()) *
        (anglesA[countLine].line2.getxS() - anglesA[countLine].line2.getxE()) +
        (anglesA[countLine].line2.getyS() - anglesA[countLine].line2.getyE()) *
        (anglesA[countLine].line2.getyS() - anglesA[countLine].line2.getyE()));
      const strMsg = `${(Math.acos(((anglesA[countLine].line1.getxS() - anglesA[countLine].line1.getxE()) *
        (anglesA[countLine].line2.getxS() - anglesA[countLine].line2.getxE()) +
        (anglesA[countLine].line1.getyS() - anglesA[countLine].line1.getyE()) *
        (anglesA[countLine].line2.getyS() - anglesA[countLine].line2.getyE())) /
        // eslint-disable-next-line
        (len1 * len2)) / Math.PI * 180).toFixed(2)}°`;
      const textA = new MeshText2D(strMsg);
      const Y_SHIFT_UP = 0.02;
      textA.updateText(anglesA[countLine].line1.getxS(), anglesA[countLine].line1.getyS() - Y_SHIFT_UP,
        this.m_textWidthScr, MeshText2D.ALIGN_CENTER,
        MeshText2D.ALIGN_TOP, this.m_textBgColor, this.m_textColor);
      anglesA[countLine].text = textA;
      this.m_scene.add(anglesA[countLine].text);
    }

    countLine = -1;
    for (let i = 0; i < textTool.m_textArr.length; ++i) {
      if (textTool.m_textArr[i].m_xMin <= x && x <= textTool.m_textArr[i].m_xMax
        && textTool.m_textArr[i].m_yMin <= y && y <= textTool.m_textArr[i].m_yMax) {
        if (this.m_runningState) {
          textTool.move(i, x - this.m_xInnerShift, y + this.m_yInnerShift, zoom, posX, posY);
        } else {
          this.processingText(textTool.m_textArr[i]);
          this.m_xInnerShift = x - textTool.m_textArr[i].m_xMin;
          this.m_yInnerShift = y - textTool.m_textArr[i].m_yMin;
        }
      }
    }
    this.isPointsExist = true;
    if (!this.isOut) {
      this.deletePoints();
      this.isPointsExist = false;
      this.freeArrays();
      this.isOut = true;
    }
  }

  processingLine(l, x, y) {
    const CONSTRAINTS = 0.02;
    let newLine = null;
    if (this.m_runningState) {
      if (((Math.abs(l.getxS() - x) < CONSTRAINTS) && (Math.abs(l.getyS() - y) < CONSTRAINTS))) {
        console.log('AREA OF EDITING 1');
        newLine = new Line2D(this.m_scene, this.m_lineWidth, x, y, l.getxE(), l.getyE(), this.m_linesMaterial);
      } else if (((Math.abs(l.getxE() - x) < CONSTRAINTS) && (Math.abs(l.getyE() - y) < CONSTRAINTS))) {
        console.log('AREA OF EDITING 2');
        newLine = new Line2D(this.m_scene, this.m_lineWidth, l.getxS(), l.getyS(), x, y, this.m_linesMaterial);
      }
    }
    return newLine;
  }

  processingLine2(l, x, y) {
    let point;
    const CONSTRAINTS = 0.01;
    const INSTANSITY = 0.005;
    if (((Math.abs(l.getxS() - x) < CONSTRAINTS) && (Math.abs(l.getyS() - y) < CONSTRAINTS))) {
      point = new Line2D(this.m_scene, this.m_lineWidth, l.getxS(), l.getyS(), l.getxS() + INSTANSITY,
        l.getyS() + INSTANSITY, this.m_pointMaterial);
      this.m_point.push({ point });
      this.isOut = true;
    }
    if ((((Math.abs(l.getxE() - x) < CONSTRAINTS) && (Math.abs(l.getyE() - y) < CONSTRAINTS)))) {
      point = new Line2D(this.m_scene, this.m_lineWidth, l.getxE(), l.getyE(), l.getxE() + INSTANSITY,
        l.getyE() + INSTANSITY, this.m_pointMaterial);
      this.m_point.push({ point });
      this.isOut = true;
    }
  }
  processingText(mesh) {
    if (!this.isPointsExist) {
      let point = new Line2D(this.m_scene, this.m_lineWidth, mesh.m_xMin, mesh.m_yMin,
        mesh.m_xMin, mesh.m_yMax, this.m_pointMaterial);
      this.m_point.push({ point });
      point = new Line2D(this.m_scene, this.m_lineWidth, mesh.m_xMin, mesh.m_yMax,
        mesh.m_xMax, mesh.m_yMax, this.m_pointMaterial);
      this.m_point.push({ point });
      point = new Line2D(this.m_scene, this.m_lineWidth, mesh.m_xMax, mesh.m_yMax,
        mesh.m_xMax, mesh.m_yMin, this.m_pointMaterial);
      this.m_point.push({ point });
      point = new Line2D(this.m_scene, this.m_lineWidth, mesh.m_xMax, mesh.m_yMin,
        mesh.m_xMin, mesh.m_yMin, this.m_pointMaterial);
      this.m_point.push({ point });
    }
    this.isOut = true;
  }

  deletePoints() {
    for (let j = 0; j < this.m_point.length; ++j) {
      const pointe = this.m_point.pop();
      this.m_scene.remove(pointe.point.getRenderObject());
      j--;
      //console.log(`${this.m_point.length}`);
    }
  }

  freeArrays() {
    this.m_checkedRects = [];
    this.m_checkedLines = [];
    this.m_checkedAngles = [];
    this.m_checkedAreasDistances = [];
  }

  updateArea(array, numLine, vertexes) {
    let sum1 = 0;
    let sum2 = 0;
    for (let j = 0; j < array.length; ++j) {
      if ((array[j].begin <= numLine) && (numLine <= array[j].endl)) {
        for (let i = array[j].begin; i < array[j].endl; ++i) {
          sum1 += vertexes[i].xS * vertexes[i + 1].yS * this.m_xPixelSize * this.m_yPixelSize;
          sum2 += vertexes[i + 1].xS * vertexes[i].yS * this.m_xPixelSize * this.m_yPixelSize;
        }
        const result = (0.5 * Math.abs(sum1
          + vertexes[array[j].endl].xS * vertexes[array[j].begin].yS * this.m_xPixelSize * this.m_yPixelSize
          - sum2 - vertexes[array[j].begin].xS * vertexes[array[j].endl].yS
          * this.m_xPixelSize * this.m_yPixelSize));
        return result;
      }
    }
    return 0;
  }

  num(array, numLine) {
    for (let j = 0; j < array.length; ++j) {
      if ((array[j].begin <= numLine) && (numLine <= array[j].endl)) {
        return array[j];
      }
    }
    return null;
  }
}
