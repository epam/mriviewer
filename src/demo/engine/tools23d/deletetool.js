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
 * 2d delete tool
 * @module app/scripts/graphics2d/deletetool
 */

import MeshText2D from './meshtext2d';
import MaterialColor2d from '../gfx/matcolor2d';
import Line2D from './line2d';

export default class DeleteTool {

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
    this.m_checkedText = [];
    this.isPointsExist = false;
    this.isOut = false;
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
   * Delete checked line
   * @param (Array) distancesV - array of all distances
   * @param (Array) vertexesD - array of all vertexes in distances
   */
  deleteLine(distancesV, vertexesD) {
    const COUNT_OF_DISTANCES = 1;
    const COUNT_OF_VERTEXES = 2;
    if (this.m_checkedLines.length > 0) {
      console.log('DESTROY');
      //for(let i = 0; i < this.m_checkedLines.length; ++i) {
      const checkedLine = this.m_checkedLines.pop();
      console.log(`${checkedLine.count}`);
      const dist = distancesV[checkedLine.count];
      this.m_scene.remove(dist.line.getRenderObject());
      this.m_scene.remove(dist.text);
      distancesV.splice(checkedLine.count, COUNT_OF_DISTANCES);
      vertexesD.splice(COUNT_OF_VERTEXES * checkedLine.count, COUNT_OF_VERTEXES);
      this.deletePoints();
      console.log(`${this.m_point.length}`);
      //i--;
      //}
    }
  }

  /**
   * Delete checked angle
   * @param (Array) anglesA- array of all angles
   * @param (Array) vertexesA - array of all vertexes in angles
   */
  deleteAngle(anglesA, vertexesA) {
    const COUNT_OF_DISTANCES = 1;
    const COUNT_OF_VERTEXES = 3;
    if (this.m_checkedAngles.length > 0) {
      //console.log('DESTROY A');
      //for(let j = 0; j < this.m_checkedAngles.length; ++j) {
      const checkedAngle = this.m_checkedAngles.pop();
      console.log(`${checkedAngle.count}`);
      const angle = anglesA[checkedAngle.count];
      this.m_scene.remove(angle.line1.getRenderObject());
      this.m_scene.remove(angle.line2.getRenderObject());
      this.m_scene.remove(angle.text);
      anglesA.splice(checkedAngle.count, COUNT_OF_DISTANCES);
      vertexesA.splice(COUNT_OF_VERTEXES * checkedAngle.count, COUNT_OF_VERTEXES);
      this.deletePoints();
      console.log(`${this.m_point.length}`);
      //j--;
      //}
    }
  }


  /**
   * Delete checked rectangle
   * @param (Array) rectR- array of all rectangles
   * @param (Array) vertexesR - array of all vertexes in rectangles
   */
  deleteRect(rectR, vertexesR) {
    const COUNT_OF_DISTANCES = 1;
    const COUNT_OF_VERTEXES = 2;
    if (this.m_checkedRects.length > 0) {
      console.log('DESTROY R');
      //for(let j = 0; j < this.m_checkedAngles.length; ++j) {
      const checkedRect = this.m_checkedRects.pop();
      console.log(`${checkedRect.count}`);
      const rect = rectR[checkedRect.count];
      this.m_scene.remove(rect.linex1.getRenderObject());
      this.m_scene.remove(rect.liney1.getRenderObject());
      this.m_scene.remove(rect.linex2.getRenderObject());
      this.m_scene.remove(rect.liney2.getRenderObject());
      this.m_scene.remove(rect.text);
      rectR.splice(checkedRect.count, COUNT_OF_DISTANCES);
      vertexesR.splice(COUNT_OF_VERTEXES * checkedRect.count, COUNT_OF_VERTEXES);
      this.deletePoints();
      console.log(`${this.m_point.length}`);
    }
  }

  /**
   * Delete checked polygon
   * @param (Array) areaLL - array of last lengths
   * @param (Array) areaD - array of all distances in polygons
   * @param (Array) vertexesAr - array of all vertexes in polygons
   * @param (Array) vertexesArr - array of all vertexes of distances in polygons
   */
  deleteArea(areaLL, areaD, vertexesAr, vertexesArr, arr) {
    const COUNT_OF_DISTANCES = 1;
    const COUNT_OF_VERTEXES = 1;
    if (this.m_checkedAreasDistances.length > 0) {
      console.log('DESTROY A');
      //for(let j = 0; j < this.m_checkedAngles.length; ++j) {
      const checkedAreaDistance = this.m_checkedAreasDistances.pop();
      console.log(`${checkedAreaDistance.count}`);
      let c = 0;
      for (let j = 0; j < areaLL.length; ++j) {
        if ((areaLL[j].begin <= checkedAreaDistance.count) && (checkedAreaDistance.count <= areaLL[j].endl)) {
          c = j;
          break;
        }
      }
      let area;
      for (let k = areaLL[c].begin; k <= areaLL[c].endl; k++) {
        area = areaD[areaLL[c].begin];
        this.m_scene.remove(area.line.getRenderObject());
        this.m_scene.remove(area.text);
        areaD.splice(areaLL[c].begin, COUNT_OF_DISTANCES);
        vertexesAr.splice(areaLL[c].begin, COUNT_OF_VERTEXES);
        vertexesArr.splice(areaLL[c].begin, COUNT_OF_VERTEXES);
      }
      areaLL.splice(c, 1);
      let del;
      for (let i = c; i < areaLL.length; i++) {
        del = areaLL[i].endl - areaLL[i].begin;
        if (c !== 0) {
          areaLL[i].begin = areaLL[i - 1].endl + 1;
        } else {
          areaLL[i].begin = 0;
        }
        areaLL[i].endl = areaLL[i].begin + del;
      }
      if (areaLL.length > 0) {
        arr.last_length = areaLL[areaLL.length - 1].endl + 1;
      } else {
        arr.last_length = 0;
      }
      this.deletePoints();
      console.log(`${this.m_point.length}`);
    }
  }
  /**
   * Delete checked text
   * @param (Array) textT - array of all text elements
   * @param (Array) vertexesT - array of all vertexes in text elements
   */
  deleteText(textT, vertexesT) {
    const COUNT_OF_DISTANCES = 1;
    const COUNT_OF_VERTEXES = 1;
    if (this.m_checkedText.length > 0) {
      const checkedText = this.m_checkedText.pop();
      console.log(`${checkedText.count}`);
      const dist = textT[checkedText.count];
      this.m_scene.remove(dist);
      textT.splice(checkedText.count, COUNT_OF_DISTANCES);
      vertexesT.splice(COUNT_OF_VERTEXES * checkedText.count, COUNT_OF_VERTEXES);
      this.deletePoints();
      console.log(`${this.m_point.length}`);
    }
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseDown(x, y, distancesV, anglesA, rectR, areaD, textT, vertexesD, vertexesA, vertexesR, vertexesAr, areaLL,
    vertexesArr, arr, vertexesT) {
    this.deleteLine(distancesV, vertexesD);
    this.deleteAngle(anglesA, vertexesA);
    this.deleteRect(rectR, vertexesR);
    this.deleteArea(areaLL, areaD, vertexesAr, vertexesArr, arr);
    this.deleteText(textT, vertexesT);
    this.freeArrays();
  }

  /**
   * Mouse move events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseMove(x, y, zoom, distancesV, anglesA, rectsR, areaD, textT) {
    const TYPE_DISTANCE = 0;
    const TYPE_RECTANGLE = 1;
    const TYPE_ANGLE = 2;
    const TYPE_AREA = 3;
    this.isOut = false;
    for (let i = 0; i < distancesV.length; ++i) {
      /*console.log("kek");
      console.log(`${distancesV[i].line.getxS()}`);
      console.log(`${x}`);
      console.log(`${distancesV[i].line.getyS()}`);
      console.log(`${y}`);*/
      this.processingLine(distancesV[i].line, x, y, i, TYPE_DISTANCE);
    }

    for (let j = 0; j < anglesA.length; ++j) {
      /*console.log("kek");
      console.log(`${distancesV[i].line.getxS()}`);
      console.log(`${x}`);
      console.log(`${distancesV[i].line.getyS()}`);
      console.log(`${y}`);*/
      const aLine1 = anglesA[j].line1;
      const aLine2 = anglesA[j].line2;
      this.processingLine(aLine1, x, y, j, TYPE_RECTANGLE);
      this.processingLine(aLine2, x, y, j, TYPE_RECTANGLE);
    }
    for (let r = 0; r < rectsR.length; ++r) {
      /*console.log("kek");
      console.log(`${distancesV[i].line.getxS()}`);
      console.log(`${x}`);
      console.log(`${distancesV[i].line.getyS()}`);
      console.log(`${y}`);*/
      const rLine1 = rectsR[r].linex1;
      const rLine2 = rectsR[r].liney1;
      const rLine3 = rectsR[r].linex2;
      const rLine4 = rectsR[r].liney2;
      this.processingLine(rLine1, x, y, r, TYPE_ANGLE);
      this.processingLine(rLine2, x, y, r, TYPE_ANGLE);
      this.processingLine(rLine3, x, y, r, TYPE_ANGLE);
      this.processingLine(rLine4, x, y, r, TYPE_ANGLE);
    }
    for (let a = 0; a < areaD.length; ++a) {
      /*console.log("kek");
      console.log(`${distancesV[i].line.getxS()}`);
      console.log(`${x}`);
      console.log(`${distancesV[i].line.getyS()}`);
      console.log(`${y}`);*/
      this.processingLine(areaD[a].line, x, y, a, TYPE_AREA);
    }
    for (let t = 0; t < textT.length; ++t) {
      this.processingText(textT[t], x, y, t);
    }
    this.isPointsExist = true;
    if (!this.isOut) {
      this.deletePoints();
      this.isPointsExist = false;
      this.freeArrays();
      this.isOut = true;
    }
  }

  processingLine(l, x, y, i, type) {
    /*console.log('PREPARE TO DESTRUCTION');
    console.log("kek");
      console.log(`${l.getxS()}`);
      console.log(`${x}`);
      console.log(`${l.getyS()}`);
      console.log(`${y}`);*/
    const SPACE = 0.05;
    const TYPE_DISTANCE = 0;
    const TYPE_RECTANGLE = 1;
    const TYPE_ANGLE = 2;
    const TYPE_AREA = 3;
    if (((Math.abs(l.getxS() - x) < SPACE) && (Math.abs(l.getyS() - y) < SPACE))
      || (((Math.abs(l.getxE() - x) < SPACE) && (Math.abs(l.getyE() - y) < SPACE)))) {
      console.log('AREA OF DESTRUCTION');
      if (!this.isPointsExist) {
        const count = i;
        switch (type) {
          case TYPE_DISTANCE:
            this.m_checkedLines.push({ count });
            break;
          case TYPE_RECTANGLE:
            this.m_checkedAngles.push({ count });
            break;
          case TYPE_ANGLE:
            this.m_checkedRects.push({ count });
            break;
          case TYPE_AREA:
            this.m_checkedAreasDistances.push({ count });
            break;
          default:
            break;
        }

        const INDENTANTION = 0.005;
        let point = new Line2D(this.m_scene, this.m_lineWidth, l.getxS(), l.getyS(),
          l.getxS() + INDENTANTION, l.getyS() + INDENTANTION, this.m_pointMaterial);
        this.m_point.push({ point });
        point = new Line2D(this.m_scene, this.m_lineWidth, l.getxE(), l.getyE(),
          l.getxE() + INDENTANTION, l.getyE() + INDENTANTION, this.m_pointMaterial);
        this.m_point.push({ point });
      }
      this.isOut = true;
    }
  }

  processingText(mesh, x, y, i) {
    if (mesh.m_xMin <= x && x <= mesh.m_xMax && mesh.m_yMin <= y && y <= mesh.m_yMax) {
      if (!this.isPointsExist) {
        const count = i;
        this.m_checkedText.push({ count });
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
  }

  deletePoints() {
    console.log('delete');
    for (let j = 0; j < this.m_point.length; ++j) {
      const pointe = this.m_point.pop();
      this.m_scene.remove(pointe.point.getRenderObject());
      j--;
      console.log(`${this.m_point.length}`);
    }
  }

  freeArrays() {
    this.m_checkedRects = [];
    this.m_checkedLines = [];
    this.m_checkedAngles = [];
    this.m_checkedAreasDistances = [];
    this.m_checkedText = [];
  }
}
