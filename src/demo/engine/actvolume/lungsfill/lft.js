/**
* Lungs fill tool
* @module lib/scripts/lungsfill/lft
*/
// relative imports
import FloodFillTool from './floodfill';
import SeedPoints from './seedPoints';

const TOO_MIN_VAL = 40;

/**
* Class LungsFillTool perform lungs selection (segmentation)
* @class LungsFillTool
*/
export default class LungsFillTool {
  /**
  * Init all internal data
  * @constructs LungsFillTool
  */
  //constructor(xDim, yDim, zDim, volTexSrc, volTexMask, srcData) {
  constructor(volume) {
    this.VESSEL = true;
    this.m_xDim = volume.m_xDim;
    this.m_yDim = volume.m_yDim;
    this.m_zDim = volume.m_zDim;
    this.xBorderMin = 0;
    this.yBorderMin = 0;
    this.xBorderMax = 0;
    this.yBorderMax = 0;
    this.m_volTexSrc = volume.m_dataArray;
    this.m_volTexMask = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
    this.m_volTexMask1 = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
    this.m_volTexMask2 = new Uint8Array(this.m_xDim * this.m_yDim * this.m_zDim);
    this.m_ratioUpdate = 0;
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
    const xyzDim = this.m_xDim * this.m_yDim * this.m_zDim;
    const VIS = 255;
    if (this.m_ratioUpdate === 0) {
      this.vSeed = { x: 0, y: 0, z: 0 };
      let resFind = 0;
      this.seedPoints = new SeedPoints(this.m_volTexSrc, this.m_xDim, this.m_yDim, this.m_zDim);
      resFind = this.seedPoints.findSeedPointOnCentralSlice(this.vSeed);
      if (resFind) {
        console.log('Lungs Central fill run: seed point not found');
        return resFind;
      }
      // copy dst volume before fill
      for (let i = 0; i < xyzDim; i++) {
        this.m_volTexMask[i] = this.m_volTexSrc[i];
      }
      this.m_ratioUpdate = 20;
      return false;
    }
    if (this.m_ratioUpdate === 20) {
      const valThreshold = TOO_MIN_VAL;
      this.fillTool = new FloodFillTool();
      this.fillTool.floodFill3dThreshold(this.m_xDim, this.m_yDim, this.m_zDim, this.m_volTexMask, this.vSeed, valThreshold);
      this.m_ratioUpdate = 50;
      return false;
    }
    //now this.m_volTexMask = 255, if lung, else = this.m_volTexSrc[i];  
    // copy only filled with 255 pixels back and scale them to [0.255]
    if (this.m_ratioUpdate === 50) {
      let x;
      const VIS = 255;
      const SCALE = VIS / TOO_MIN_VAL;
      if (!this.VESSEL) {
        // not detect blood vessels
        for (x = 0; x < xyzDim; x++) {
          let val = 0;
          if (this.m_volTexMask[x] === VIS) {
            val = Math.floor(this.m_volTexSrc[x] * SCALE);
          }
          this.m_volTexSrc[x] = val;
        }
      } else {
        // additional detect blood vessels
        for (x = 0; x < xyzDim; x++) {
          let val = 0;
          if (this.m_volTexMask[x] === VIS) {
            val = VIS;
          }
          this.m_volTexMask[x] = val;
        }
      }
      this.m_ratioUpdate = 80;
      return false;
    }
    if (this.m_ratioUpdate === 80) {
      let x;
      // additional detect blood vessels
      for (x = 0; x < xyzDim; x++) {
        let val = 0;
        if (this.m_volTexMask[x] === VIS) {
          val = VIS;
        }
        this.m_volTexMask[x] = val;
      }
      //now this.m_volTexMask = 255, if lung, else = 0;  
      this.detectNonEmptyBox(this.m_volTexMask, this.m_xDim, this.m_yDim, this.m_zDim);
      // extend this.m_volTexMask to this.m_volTexMask1
      this.delatation();
      // erosion this.m_volTexMask1 to this.m_volTexMask2
      this.erosion();
      // save this.m_volTexSrc[i] in this.m_volTexMask1[i]
      for (let i = 0; i < xyzDim; i++) {
        this.m_volTexMask1[i] = this.m_volTexSrc[i];
      }
      // airway to this.m_volTexMask1  
      const resFind = this.seedPoints.findSeedPointOnFirstSlice(this.vSeed);
      if (resFind) {
        console.log('Airway fill run: seed point not found');
        return resFind;
      }
      this.minv = this.vSeed.z;
      this.vSeed.z = 2;
      console.log(`Airway fill run: seed point: ${this.vSeed.x} ${this.vSeed.y} ${this.minv}`);
      this.m_ratioUpdate = 90;
      return false;
    }
    if (this.m_ratioUpdate === 90) {
      this.fillTool.floodFill3dThreshold(this.m_xDim, this.m_yDim, this.m_zDim, this.m_volTexMask1, this.vSeed, this.minv);
      const HALF = 128.0;
      for (let x = 0; x < xyzDim; x++) {
        let val = 0.5 * this.m_volTexMask[x];//0;
        if (this.m_volTexMask2[x] - this.m_volTexMask[x] === VIS) {
          val = HALF + this.m_volTexSrc[x];//0.5 + this.m_srcData;VIS; this.m_volTexSrc[x];this.m_srcData
        }
        if (this.m_volTexMask1[x] === VIS) {
          val = VIS;
        }
        this.m_volTexSrc[x] = val;
      }
    }
    return true;
  }
}
// errors
LungsFillTool.RESULT_NA = 0;
LungsFillTool.RESULT_COMPLETED = 1;
LungsFillTool.RESULT_BAD_HIST = 2;
LungsFillTool.RESULT_SEED_X_NOT_FOUND = 3;
