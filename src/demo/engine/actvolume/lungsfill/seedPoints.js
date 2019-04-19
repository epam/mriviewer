/**
* Lungs fill tool
* @module lib/scripts/actvolume/lungsfill/seedPoints
*/
const TOO_MIN_VAL = 40;
/**
* Class seedPoints perform find seed points for lungs selection (segmentation)
* @class seedPoints
*/
export default class SeedPoints {
  /**
  * Init all internal data
  * @constructs SeedPoints
  */
  constructor(volume, xDim, yDim, zDim) {
    this.m_xDim = xDim;
    this.m_yDim = yDim;
    this.m_zDim = zDim;
    this.m_volTexSrc = volume;
  }
  findSeedPointOnCentralSlice(vSeed) {
    const TWO = 2;
    const zCenter = Math.floor(this.m_zDim / TWO);
    const yCenter = Math.floor(this.m_yDim / TWO);
    let yMin = -1, yMax = -1;
    const zOff = zCenter * this.m_xDim * this.m_yDim;
    let yOff = -1;

    // detect min, max y
    let x, y;
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
      return 1;
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
      return 1;
    }
    vSeed.x = x;
    vSeed.y = y;
    vSeed.z = zCenter;
    return 0;
  } //findSeedPointOnCentralSlice
  findSeedPointOnFirstSlice(vSeed) {
    const pixelsSrc = this.m_volTexSrc;
    const VAL_BLACK_BARRIER = 50;
    let holeFound = false;

    const NUM_7 = 7;
    const NUM_512 = 512;
    const sizeBlackAreaMin = Math.floor(this.m_xDim * NUM_7 / NUM_512);

    // for each point scan in 4 directions to find white barrier

    const MIN_RAT = 0.2;
    const MAX_RAT = 0.8;
    const yMin = Math.floor(this.m_yDim * MIN_RAT);
    const yMax = Math.floor(this.m_yDim * MAX_RAT);
    const xMin = Math.floor(this.m_xDim * MIN_RAT);
    const xMax = Math.floor(this.m_xDim * MAX_RAT);

    let cx, cy;
    const offZ = 2 * this.m_xDim * this.m_yDim;
    for (cy = yMin; (cy < yMax) && !holeFound; cy++) {
      const cyOff = cy * this.m_xDim;
      for (cx = xMin; (cx < xMax) && !holeFound; cx++) {
        const val = pixelsSrc[cx + cyOff + offZ];
        if (val >= VAL_BLACK_BARRIER) {
          continue;
        }
        // we have black current pixel
        let numWhiteBarriers = 0;

        let x, y, len;
        for (len = 0, y = cy - 1; y >= 0; y--, len++) {
          const off = cx + y * this.m_xDim + offZ;
          if (pixelsSrc[off] > VAL_BLACK_BARRIER) {
            if (len > sizeBlackAreaMin) {
              numWhiteBarriers++;
              break;
            }
          }
        } // for (y)
        for (len = 0, y = cy + 1; y < this.m_yDim; y++, len++) {
          const off = cx + y * this.m_xDim + offZ;
          if (pixelsSrc[off] > VAL_BLACK_BARRIER) {
            if (len > sizeBlackAreaMin) {
              numWhiteBarriers++;
            }
            break;
          }
        } // for (y)
        for (len = 0, x = cx - 1; x >= 0; x--, len++) {
          const off = x + cy * this.m_xDim + offZ;
          if (pixelsSrc[off] > VAL_BLACK_BARRIER) {
            if (len > sizeBlackAreaMin) {
              numWhiteBarriers++;
            }
            break;
          }
        } // for (x)
        for (len = 0, x = cx + 1; x < this.m_xDim; x++, len++) {
          const off = x + cy * this.m_xDim + offZ;
          if (pixelsSrc[off] > VAL_BLACK_BARRIER) {
            if (len > sizeBlackAreaMin) {
              numWhiteBarriers++;
            }
            break;
          }
        } // for (x)
        const MIN_BLACK_BARRIER = 17;
        const FOUR = 4;
        const TWO = 2;
        if (numWhiteBarriers === FOUR) {
          holeFound = true;
          vSeed.x = cx;
          vSeed.y = cy;
          let sum = 0;
          let minv = 255;
          let col = 0;
          for (let zz = 0; zz < TWO; zz++) {
            const zzOff = (zz + TWO) * this.m_xDim * this.m_yDim;
            for (let yy = -TWO; yy <= TWO; yy++) {
              const yyOff = (yy + cy) * this.m_xDim;
              for (let xx = -2; xx <= TWO; xx++) {
                let val = pixelsSrc[xx + cx + yyOff + zzOff];
                if (val < MIN_BLACK_BARRIER) {
                  sum = sum + val;
                  col++;
                  if (val < minv) {
                    minv = val;
                    vSeed.x = xx + cx;
                    vSeed.y = yy + cy;
                  }
                }
              } //for xx
            } //for yy
          } //for zz
          vSeed.z = Math.floor(sum / col);
          break;
        } // if 4 barriers
      } // for (cx)
    }  // for (cy)
    if (!holeFound) {
      return 1;
    } else {
      return 0;
    }
  } //findSeedPointOnFirstSlice
}