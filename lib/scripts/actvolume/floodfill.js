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
* Flood fill 3d volume
* @module lib/scripts/actvolume/floodfill
*/

// absolute imports
import * as THREE from 'three';

/**
* Class FloodFillTool used to fill areas in 3d
* @class FloodFillTool
*/
export default class FloodFillTool {
  constructoir() {
    this.m_stack3d = [];
    this.m_maxStack3d = 0;
    this.m_indexStack3d = 0;
    this.m_numFilled3d = 0;
  }
  createStack3d(numPixelsAll) {
    const MAGIC_STCAK_ESTIMATE = 0.3;
    this.m_maxStack3d = Math.floor(numPixelsAll * MAGIC_STCAK_ESTIMATE);
    this.m_stack3d = [];
    for (let i = 0; i < this.m_maxStack3d; i++) {
      this.m_stack3d.push(new THREE.Vector3());
    }
    this.m_indexStack3d = 0;
    this.m_numFilled3d = 0;
    return 1;
  }
  destroyStack3d() {
    this.m_stack3d = null;
  }
  stack3dPush(v) {
    if (this.m_indexStack3d >= this.m_maxStack3d) {
      return 0;
    }
    this.m_stack3d[this.m_indexStack3d].x = v.x;
    this.m_stack3d[this.m_indexStack3d].y = v.y;
    this.m_stack3d[this.m_indexStack3d].z = v.z;
    this.m_indexStack3d++;
    return 1;
  }
  stack3dPop() {
    if (this.m_indexStack3d <= 0) {
      return null;
    }
    this.m_indexStack3d--;
    const v = new THREE.Vector3();
    v.x = this.m_stack3d[this.m_indexStack3d].x;
    v.y = this.m_stack3d[this.m_indexStack3d].y;
    v.z = this.m_stack3d[this.m_indexStack3d].z;
    return v;
  }
  stack3dEIsEmpty() {
    return (this.m_indexStack3d <= 0);
  }

  detectSeedPoint3d(xDim, yDim, zDim, pixels, vaSeedPoints, maxSeedPoints) {
    const TWO = 2;
    const yDimHalf = Math.floor(yDim / TWO);
    const zDimHalf = Math.floor(zDim / TWO);
    const numItersY = (yDimHalf - 1) * TWO;
    const numItersZ = (zDimHalf - 1) * TWO;
    let numSeedPointsDetected = 0;
    for (let zIter = 0; zIter < numItersZ; zIter++) {
      let zStep = Math.floor(zIter / TWO);
      if ((zIter & 1) !== 0) {
        zStep = -zStep;
      }
      const z = zDimHalf + zStep;
      const zOff = z * xDim * yDim;

      for (let yIter = 0; yIter < numItersY; yIter++) {
        let yStep = Math.floor(yIter / TWO);
        if ((yIter & 1) !== 0) {
          yStep = -yStep;
        }
        const y = yDimHalf + yStep;
        const yOff = y * xDim;

        let xL = -1;
        let xR = -1;
        let x;
        for (x = 0; x < xDim - 1; x++) {
          const isStartInside = (pixels[x + yOff + zOff] > 0)  && (pixels[x + 1 + yOff + zOff] === 0);
          const isEndInside   = (pixels[x + yOff + zOff] === 0) && (pixels[x + 1 + yOff + zOff] > 0);
          if (isStartInside) {
            xL = x;
          }
          if (isEndInside && (xL >= 0)) {
            xR = x + 1;
            const xSegmentLen = xR - xL + 1;
            if (xSegmentLen > 1) {
              vaSeedPoints[numSeedPointsDetected].x = Math.floor((xL + xR) / TWO);
              vaSeedPoints[numSeedPointsDetected].y = y;
              vaSeedPoints[numSeedPointsDetected].z = z;
              numSeedPointsDetected++;
              if (numSeedPointsDetected >= maxSeedPoints) {
                return numSeedPointsDetected;
              }
            }
          }
        }
      } // for (yIter)
    } // for (zIter)
    return numSeedPointsDetected;
  }

  floodFill3d(xDim, yDim, zDim, pixels, vSeed) {
    const xyDim = xDim * yDim;
    const okCreate = this.createStack3d(xDim * yDim * zDim);
    if (okCreate !== 1) {
      return okCreate;
    }

    const VIS = 255;
    this.m_numFilled3d = 0;

    this.stack3dPush(vSeed);
    while (!this.stack3dEIsEmpty()) {
      let x;

      const vTaken = this.stack3dPop();
      const y = vTaken.y;
      const z = vTaken.z;

      const yOff = y * xDim;
      const zOff = z * xyDim;

      // get leftmost
      for (x = vTaken.x; (x >= 0) && (pixels[x + yOff + zOff] === 0);) {
        x--;
      }
      const xL = x + 1;
      // get rightmost
      for (x = vTaken.x; (x < xDim) && (pixels[x + yOff + zOff] === 0);) {
        x++;
      }
      const xR = x - 1;

      let setYLess = VIS;
      let setYMore = VIS;
      let setZLess = VIS;
      let setZMore = VIS;
      for (x = xL; x <= xR; x++) {
        // set point visible
        pixels[x + yOff + zOff] = VIS;
        this.m_numFilled3d++;

        // check line y less
        if ((y > 0) && (pixels[x + yOff - xDim + zOff] !== setYLess)) {
          setYLess = VIS - setYLess;
          if (setYLess === 0) {
            // V3d vPu(x, y - 1, z);
            const vPu = new THREE.Vector3(x, y - 1, z);
            const okPush = this.stack3dPush(vPu);
            if (okPush !== 1) {
              return okPush;
            }
          } // if need to push
        } // if (y less pint has another vis state

        // check line above
        if ((y < yDim - 1) && (pixels[x + yOff + xDim + zOff] !== setYMore)) {
          setYMore = VIS - setYMore;
          if (setYMore === 0) {
            // V3d vPu(x, y + 1, z);
            const vPu = new THREE.Vector3(x, y + 1, z);
            const okPush = this.stack3dPush(vPu);
            if (okPush !== 1) {
              return okPush;
            }
          } // if need to push
        } // if (y more point has another vis state

        // check line z less
        if ((z > 0) && (pixels[x + yOff + zOff - xyDim] !== setZLess)) {
          setZLess = VIS - setZLess;
          if (setZLess === 0) {
            // V3d vPu(x, y, z - 1);
            const vPu = new THREE.Vector3(x, y, z - 1);
            const okPush = this.stack3dPush(vPu);
            if (okPush !== 1) {
              return okPush;
            }
          } // if need to push
        } // if (z less pint has another vis state

        // check line z more
        if ((z < zDim - 1) && (pixels[x + yOff + zOff + xyDim] !== setZMore)) {
          setZMore = VIS - setZMore;
          if (setZMore === 0) {
            // V3d vPu(x, y, z + 1);
            const vPu = new THREE.Vector3(x, y, z + 1);
            const okPush = this.stack3dPush(vPu);
            if (okPush !== 1) {
              return okPush;
            }
          } // if need to push
        } // if (z more)
      } // for (x) scanned hor line
    } // while stack is not empty
    this.destroyStack3d();
    return 1;
  }

} // class
