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
* Lungs fill tool
* @module lib/scripts/lungsfill/lft
*/

// absolute imports
// import * as THREE from 'three';

// relative imports
import FloodFillTool from './floodfill';

// ****************************************************************************
// Const
// ****************************************************************************

// ****************************************************************************
// Class
// ****************************************************************************

/**
* Class LungsFillTool perform lungs selection (segmentation)
* @class LungsFillTool
*/
export default class LungsFillTool {
  /**
  * Init all internal data
  * @constructs LungsFillTool
  */
  constructor(xDim, yDim, zDim, volTexSrc, volTexMask) {
    //this.VESSEL = false;
    this.VESSEL = true;
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    this.xBorderMin = 0;
    this.yBorderMin = 0;
    this.xBorderMax = 0;
    this.yBorderMax = 0;
    this.m_volTexSrc = volTexSrc;
    this.m_volTexMask = volTexMask;
    this.m_volTexMask1 = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
    this.m_volTexMask2 = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
  }

  detectNonEmptyBox(pixelsSrc, xDim, yDim, zDim) {
    const MIN_VAL_BARRIER = 8;
    const TWICE = 2;
    const xyDim = xDim * yDim;
    const xDimHalf = Math.floor(xDim / TWICE);
    const yDimHalf = Math.floor(yDim / TWICE);
    let x, y, z;
    let isEmpty;

    const numBytesPerPixel = 1;
    if (numBytesPerPixel === 1) {
      isEmpty = true;
      for (x = 0; (x < xDimHalf) && isEmpty; x++) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      this.xBorderMin = x - 1;

      isEmpty = true;
      for (x = xDim - 1; (x > xDimHalf) && (isEmpty); x--) {
        // check is empty plane
        for (y = 0; (y < yDim) && (isEmpty); y++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      this.xBorderMax = x + 1;

      isEmpty = true;
      for (y = 0; (y < yDimHalf) && (isEmpty); y++) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      this.yBorderMin = y - 1;

      isEmpty = true;
      for (y = yDim - 1; (y > yDimHalf) && (isEmpty); y--) {
        // check is empty plane
        for (x = 0; (x < xDim) && (isEmpty); x++) {
          for (z = 0; (z < zDim) && (isEmpty); z++) {
            const off = (z * xyDim) + (y * xDim) + x;
            if (pixelsSrc[off] > MIN_VAL_BARRIER) {
              isEmpty = false;
            }
          } // for (z)
        } // for (y()
      } // for (x)
      this.yBorderMax = y + 1;
    }
  }

  delatation() {
    let x, y, z;
    let x1, y1, z1;
    let zOff = 0;
    let yOff = 0;
    let count = 0;
    let val = 0;
    const VIS = 255;
    const TWO = 2;

    for (z = 0; z < this.m_zDim; z++) {
      for (y = this.yBorderMin; y < this.yBorderMax; y++) {
        for (x = this.xBorderMin; x < this.xBorderMax; x++) {
          count = 0;
          for (z1 = -1; z1 < TWO; z1++) {
            zOff = (z + z1) * this.m_xDim * this.m_yDim;
            for (y1 = -1; y1 < TWO; y1++) {
              yOff = (y + y1) * this.m_xDim;
              for (x1 = -1; x1 < TWO; x1++) {
                if (this.m_volTexMask[x + x1 + yOff + zOff] === VIS) {
                  count++;
                }
              }
            }
          }
          val = 0;
          if (count > 0) {
            val = VIS;
          }
          this.m_volTexMask1[x + y * this.m_xDim + z * this.m_xDim * this.m_yDim] = val;
        }
      }
    }
  }

  erosion() {
    let x, y, z;
    let x1, y1, z1;
    let zOff = 0;
    let yOff = 0;
    let off = 0;
    let count = 0;
    const TWO = 2;
    for (z = 0; z < this.m_zDim; z++) {
      for (y = this.yBorderMin; y < this.yBorderMax; y++) {
        for (x = this.xBorderMin; x < this.xBorderMax; x++) {
          off = x + y * this.m_xDim + z * this.m_xDim * this.m_yDim;
          this.m_volTexMask2[off] = this.m_volTexMask1[off];
          if (this.m_volTexMask1[off] !== this.m_volTexMask[off]) {
            count = 0;
            for (z1 = -1; z1 < TWO; z1++) {
              zOff = (z + z1) * this.m_xDim * this.m_yDim;
              for (y1 = -1; y1 < TWO; y1++) {
                yOff = (y + y1) * this.m_xDim;
                for (x1 = -1; x1 < TWO; x1++) {
                  if (this.m_volTexMask1[x + x1 + yOff + zOff] === 0) {
                    count++;
                  }
                }
              }
            }
            if (count > 0) {
              this.m_volTexMask2[off] = 0;
            }
          }
        }
      }
    }
  }

  run() {
    const TWO = 2;
    const zCenter = Math.floor(this.m_zDim / TWO);
    const yCenter = Math.floor(this.m_yDim / TWO);
    let yMin = -1, yMax = -1;
    const zOff = zCenter * this.m_xDim * this.m_yDim;
    let yOff = -1;

    // detect min, max y
    let x, y;
    const TOO_MIN_VAL = 40;
    const NUM_170 = 170.0;
    const NUM_512 = 512.0;
    const MIN_LINE_RATIO = NUM_170 / NUM_512;

    for (y = 0; y < yCenter; y++) {
      yOff = y * this.m_xDim;
      let numWhitePixels = 0;
      for (x = 0; x < this.m_xDim; x++) {
        numWhitePixels += (this.m_volTexSrc[x + yOff + zOff] > TOO_MIN_VAL) ? 1 : 0;
      }
      // how much percents of non-black pixels can be in line
      const isBlackLine = (numWhitePixels / this.m_xDim < MIN_LINE_RATIO) ? 1 : 0;
      if (!isBlackLine) {
        break;
      }
      yMin = y;
    }

    for (y = this.m_yDim - 1; y > yCenter; y--) {
      yOff = y * this.m_xDim;
      let numWhitePixels = 0;
      for (x = 0; x < this.m_xDim; x++) {
        numWhitePixels += (this.m_volTexSrc[x + yOff + zOff] > TOO_MIN_VAL) ? 1 : 0;
      }
      // how much percetns non-black pixels can be in line
      const isBlackLine = (numWhitePixels / this.m_xDim < MIN_LINE_RATIO) ? 1 : 0;
      if (!isBlackLine) {
        break;
      }
      yMax = y;
    }
    // console.log(`yMin = ${yMin}, yMax = ${yMax}`);

    // shift range [yMin .. yMax] to mire narrow search area
    const NUM_45 = 45.0;
    const NUM_60 = 60.0;
    const NUM_339 = 339.0;
    const ADD_RATIO_MIN = NUM_45 / NUM_339;
    const ADD_RATIO_MAX = NUM_60 / NUM_339;

    const yMinNew = Math.floor(yMin + (yMax - yMin) * ADD_RATIO_MIN);
    const yMaxNew = Math.floor(yMax - (yMax - yMin) * ADD_RATIO_MAX);
    yMin = yMinNew;
    yMax = yMaxNew;

    const NUM_COLORS = 8;
    const histogram = new Float32Array(NUM_COLORS);
    let goodHistogramDetected = false;
    for (y = yMin; (y <= yMax) && !goodHistogramDetected; y++) {
      // clear histogram
      for (x = 0; x < NUM_COLORS; x++) {
        histogram[x] = 0;
      }
      // collect histogram
      yOff = y * this.m_xDim;

      const SHIFT_5 = 5;
      for (x = 0; x < this.m_xDim; x++) {
        // get value in [0..7]
        const val = this.m_volTexSrc[x + yOff + zOff] >> SHIFT_5;
        histogram[val] += 1.0;
      }
      // get color probability
      for (x = 0; x < NUM_COLORS; x++) {
        histogram[x] /= this.m_xDim;
      }
      // black color should be largely presented
      // but we should have enough whites
      const BARRIER = 0.7;
      if (histogram[0] < BARRIER) {
        goodHistogramDetected = true;
        break;
      }
    } // for (y) all possible hor lines
    if (!goodHistogramDetected) {
      return LungsFillTool.RESULT_BAD_HIST;
    }
    // console.log(`found y = ${y}`);

    // search seed point in line: zCenter, y
    let valThreshold = 0;
    // search first white point on line
    const xCenter = Math.floor(this.m_xDim / TWO);
    for (x = 0; x < xCenter; x++) {
      valThreshold = this.m_volTexSrc[x + yOff + zOff];
      if (valThreshold > TOO_MIN_VAL) {
        break;
      }
    }
    // search first black point
    const ADD_RANGE = 8;
    x += ADD_RANGE;
    for (; x < xCenter; x++) {
      valThreshold = this.m_volTexSrc[x + yOff + zOff];
      if (valThreshold < TOO_MIN_VAL) {
        break;
      }
    }
    if (x === xCenter) {
      return LungsFillTool.RESULT_SEED_X_NOT_FOUND;
    }

    // check that next 8 pixels are black
    for (let dx = 0; dx < ADD_RANGE; dx++) {
      valThreshold = this.m_volTexSrc[x + yOff + zOff];
      if (valThreshold > TOO_MIN_VAL) {
        break;
      }
      x++;
    }
    if (valThreshold > TOO_MIN_VAL) {
      return LungsFillTool.RESULT_SEED_X_NOT_FOUND;
    }

    const xyzDim = this.m_xDim * this.m_yDim * this.m_zDim;
    // copy dst volume before fill
    for (let i = 0; i < xyzDim; i++) {
      this.m_volTexMask[i] = this.m_volTexSrc[i];
    }
    valThreshold = TOO_MIN_VAL;
    const fillTool = new FloodFillTool();
    const vSeed = { x: 0, y: 0, z: 0 };
    vSeed.x = x; vSeed.y = y;
    vSeed.z = zCenter;
    // console.log(`seed point = ${vSeed.x}, ${vSeed.y}, ${vSeed.z}`);
    fillTool.floodFill3dThreshold(this.m_xDim, this.m_yDim, this.m_zDim, this.m_volTexMask, vSeed, valThreshold);

    // copy only filled with 255 pixels back and scale them to [0.255]
    const VIS = 255;
    const SCALE = VIS / TOO_MIN_VAL;
    if (!this.VESSEL) {
      for (x = 0; x < xyzDim; x++) {
        let val = 0;
        if (this.m_volTexMask[x] === VIS) {
          val = Math.floor(this.m_volTexSrc[x] * SCALE);
        }
        this.m_volTexSrc[x] = val;
      }
    }
    if (this.VESSEL) {
      for (x = 0; x < xyzDim; x++) {
        let val = 0;
        if (this.m_volTexMask[x] === VIS) {
          val = VIS;
        }
        this.m_volTexMask[x] = val;
      }
      this.detectNonEmptyBox(this.m_volTexMask, this.m_xDim, this.m_yDim, this.m_zDim);
      this.delatation();
      this.erosion();
      for (x = 0; x < xyzDim; x++) {
        let val = 0.5 * this.m_volTexMask[x];//0;
        if (this.m_volTexMask2[x] - this.m_volTexMask[x] === VIS) {
          val = VIS;//this.m_volTexSrc[x];
        }
        this.m_volTexSrc[x] = val;
      }
    }
    return LungsFillTool.RESULT_COMPLETED;
  }
}

// errors
LungsFillTool.RESULT_NA = 0;
LungsFillTool.RESULT_COMPLETED = 1;
LungsFillTool.RESULT_BAD_HIST = 2;
LungsFillTool.RESULT_SEED_X_NOT_FOUND = 3;
