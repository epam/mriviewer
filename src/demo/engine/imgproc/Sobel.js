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
* Soble edge detector
* @module demo/engine/imgproc/Sobel
*/

//
// Sobel edge detectio
//

const MAX_SQRT = (5400 * 5400)

export default class SobelEdgeDetector {
  constructor() {
    this.m_vol = null;
    this.m_z = -1;
    this.m_iter = -1;
    this.m_pixelsDst = null;
    this.m_sqrtTable = null;
  }
  getPixelsDst() {
    return this.m_pixelsDst;
  }
  start(vol) {
    console.assert(vol != null);
    console.assert(vol.m_dataArray !== null);
    this.m_vol = vol;
    this.m_z = 0;
    this.m_iter = 0;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    this.m_pixelsDst = new Float32Array(xDim * yDim * zDim);
    // create sqrt table
    this.m_sqrtTable = new Float32Array(MAX_SQRT);
    for (let i = 0; i < MAX_SQRT; i++) {
      this.m_sqrtTable[i] = Math.sqrt(i);
    }
  }
  normalizeDstImage() {
    let valMax = 0.0;
    const xyzDim = this.m_vol.m_xDim * this.m_vol.m_yDim * this.m_vol.m_zDim;
    for (let i = 0; i < xyzDim; i++) {
      const val = this.m_pixelsDst[i];
      valMax = (val > valMax) ? val : valMax;
    } // for i
    valMax += 0.9;
    const scl = 255.0 / valMax;
    for (let i = 0; i < xyzDim; i++) {
      this.m_pixelsDst[i] = Math.floor(this.m_pixelsDst[i] * scl);
    } // for i
  }
  stop() {
    this.m_pixelsDst = null;
    this.m_sqrtTable = null;
  }
  // return ratio in [0..1]
  getRatio() {
    const zDim = this.m_vol.m_zDim;
    const ratio01 = this.m_z / zDim;
    return ratio01;
  }
  isFinished() {
    console.assert(this.m_z >= 0);
    const zDim = this.m_vol.m_zDim;
    if (this.m_z >= zDim) {
      return true;
    }
    return false;
  }
  // invoked several times externally, until entire image processed
  update() {
    console.assert(this.m_z >= 0);
    console.assert(this.m_pixelsDst !== null);
    const pixelsSrc = this.m_vol.m_dataArray;

    const xDim = this.m_vol.m_xDim;
    const yDim = this.m_vol.m_yDim;
    const zDim = this.m_vol.m_zDim;
    const xyDim = xDim * yDim;

    const STEP = 24;
    const zNext = Math.floor((this.m_iter + 1) * zDim / STEP);
    // console.log('Sobel update z from ' + this.m_z.toString() + ' until ' + zNext.toString());

    // let maxSqrt = 0;

    // update all z slices from this.m_z to zNext
    let off = this.m_z * xyDim;
    for (let z = this.m_z; z < zNext; z++) {
      for (let y = 0; y < yDim; y++) {
        for (let x = 0; x < xDim; x++) {
          let sumDx = 0.0, sumDy = 0.0, sumDz = 0.0;
          for (let dz = -1; dz <= +1; dz++) {
            let zz = z + dz;
            zz = (zz >= 0) ? zz : 0;
            zz = (zz < zDim) ? zz : (zDim - 1);
            const zzOff = zz * xyDim;
            for (let dy = -1; dy <= +1; dy++) {
              let yy = y + dy;
              yy = (yy >= 0) ? yy : 0;
              yy = (yy < yDim) ? yy : (yDim - 1);
              const yyOff = yy * xDim;
              for (let dx = -1; dx <= +1; dx++) {
                let xx = x + dx;
                xx = (xx >= 0) ? xx : 0;
                xx = (xx < xDim) ? xx : (xDim - 1);
  
                const val = pixelsSrc[xx + yyOff + zzOff];
  
                let kx = 1;
                if (dy === 0)
                  kx *= 2;
                if (dz === 0)
                  kx *= 2;
                sumDx += dx * val * kx;
  
                let ky = 1;
                if (dx === 0)
                  ky *= 2;
                if (dz === 0)
                  ky *= 2;
                sumDy += dy * val * ky;
  
                let kz = 1;
                if (dx === 0)
                  kz *= 2;
                if (dy === 0)
                  kz *= 2;
                sumDz += dz * val * kz;
  
              } // for dx
            } // for dy
          } // for dz

          // tricky fast convert float to int (for positive values only)
          const dotProd = (sumDx * sumDx + sumDy * sumDy + sumDz * sumDz) | 0;
          console.assert(dotProd < MAX_SQRT);

          this.m_pixelsDst[off] = this.m_sqrtTable[dotProd];
          off++;
  
        } // for x
      } // for y
    } // for z all slices

    // console.log('max sqrt = ' + maxSqrt.toString());

    // update iteration parameters
    this.m_iter += 1;
    this.m_z = zNext;
  }
}
