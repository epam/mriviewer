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
* Gauss filtering
* @module demo/engine/imgproc/Gauss
*/

import * as THREE from 'three';

import Volume from '../Volume';
import BilateralHW from './BilateralHW';

//
// Gauss edge detectio
//
class GaussSmoother {
  constructor(needHw = false) {
    this.m_needHw = needHw;
    this.m_vol = null;
    this.m_z = -1;
    this.m_iter = -1;
    this.m_pixelsDst = null;
    this.m_kernel = null;
    this.m_bilateralHw = null;
  }
  getPixelsDst() {
    if (this.m_needHw) {
      const arr = this.m_bilateralHw.getImageDst();
      return arr;
    }
    return this.m_pixelsDst;
  }
  createKernel(kernelSize, sigma) {
    const side      = kernelSize * 2 + 1;
    const xyzKernel = side * side * side;
    const arr = new Float32Array(xyzKernel);
  
    const mult = 1.0 / (2.0 * sigma * sigma);
  
    let off = 0;
    let sum = 0.0;
    for (let dz = -kernelSize; dz <= +kernelSize; dz++)
    {
      const tz = dz / kernelSize;
      for (let dy = -kernelSize; dy <= +kernelSize; dy++)
      {
        const ty = dy / kernelSize;
        for (let dx = -kernelSize; dx <= +kernelSize; dx++)
        {
          const tx = dx / kernelSize;
          const w = Math.exp(-(tx * tx + ty * ty + tz * tz) * mult);
          arr[off++] = w;
          sum += w;
        } // for dx
      } // for dy
    } // for dz
  
    // normalize arr
    const scl = 1.0 / sum;
    for (let i = 0; i < xyzKernel; i++)
      arr[i] *= scl;
    this.m_kernel = arr;
  }
  start(vol, kernelSize, koefDist, koefVal = 0.1) {
    const sigmaDist = (1.0 / kernelSize) * koefDist;
    this.createKernel(kernelSize, sigmaDist);
    this.m_kernelSize = kernelSize;
    console.assert(vol != null);
    console.assert(vol.m_dataArray !== null);
    this.m_vol = vol;
    this.m_z = 0;
    this.m_iter = 0;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    this.m_pixelsDst = new Float32Array(xDim * yDim * zDim);

    // start perform hardware gauss filtering
    if (this.m_needHw) {
      this.m_bilateralHw = new BilateralHW();
      const vTexelSize = new THREE.Vector3(1.0 / xDim, 1.0 / yDim, 1.0 / zDim);
      this.m_bilateralHw.create(vol, vTexelSize, kernelSize, koefDist, koefVal);
    } // if HW gauss

  }
  normalizeDstImage() {
    if (this.m_needHw) {
      return;
    }

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
    this.m_kernel = null;
  }
  // return ratio in [0..1]
  getRatio() {
    const zDim = this.m_vol.m_zDim;
    let ratio01 = 0.0; 
    if (this.m_needHw) {
      ratio01 = this.m_bilateralHw.m_z / zDim;
    } else {
      ratio01 = this.m_z / zDim;
    }
    return ratio01;
  }
  isFinished() {
    console.assert(this.m_z >= 0);
    const zDim = this.m_vol.m_zDim;
    if (this.m_needHw) {
      if (this.m_bilateralHw.m_z >= zDim) {
        return true;
      } 
    } else {
      if (this.m_z >= zDim) {
        return true;
      }
    }
    return false;
  }
  // invoked several times externally, until entire image processed
  update() {
    if (this.m_needHw) {
      this.m_bilateralHw.update();
      return;
    }
    // perform slow software gauss update with portion of slices
    console.assert(this.m_z >= 0);
    console.assert(this.m_pixelsDst !== null);
    const pixelsSrc = this.m_vol.m_dataArray;

    const xDim = this.m_vol.m_xDim;
    const yDim = this.m_vol.m_yDim;
    const zDim = this.m_vol.m_zDim;
    const xyDim = xDim * yDim;

    const STEP = (zDim > 16 ) ? 24 : 2;
    const zNext = Math.floor((this.m_iter + 1) * zDim / STEP);
    // console.log('Gauss update z from ' + this.m_z.toString() + ' until ' + zNext.toString());

    const arrKernel = this.m_kernel;
    const kernelSize = this.m_kernelSize;

    // update all z slices from this.m_z to zNext
    let off = this.m_z * xyDim;
    for (let z = this.m_z; z < zNext; z++) {
      for (let y = 0; y < yDim; y++) {
        for (let x = 0; x < xDim; x++) {
          // process pixel (x,y,z)
          let sum = 0.0;
          let offKer = 0;
          for (let dz = -kernelSize; dz <= +kernelSize; dz++) {
            let zz = z + dz;
            zz = (zz >= 0) ? zz : 0;
            zz = (zz < zDim) ? zz : (zDim - 1);
            const zzOff = zz * xyDim;
            for (let dy = -kernelSize; dy <= +kernelSize; dy++) {
              let yy = y + dy;
              yy = (yy >= 0) ? yy : 0;
              yy = (yy < yDim) ? yy : (yDim - 1);
              const yyOff = yy * xDim;
              for (let dx = -kernelSize; dx <= +kernelSize; dx++) {
                let xx = x + dx;
                xx = (xx >= 0) ? xx : 0;
                xx = (xx < xDim) ? xx : (xDim - 1);
  
                sum += arrKernel[offKer] * pixelsSrc[xx + yyOff + zzOff];
                offKer++;
  
              } // for dx
            } // for dy
          } // for dz
          this.m_pixelsDst[off] = sum;
          off++;
  
        } // for x
      } // for y
    } // for z all slices

    // console.log('max sqrt = ' + maxSqrt.toString());

    // update iteration parameters
    this.m_iter += 1;
    this.m_z = zNext;
  }
  testSimple() {
    // create simple small volume
    const SZ = 16;
    const HALF_SZ = SZ / 2;
    const volume = new Volume();
    volume.createEmptyBytesVolume(SZ, SZ, SZ);
    let offDst = 0;
    const pixelsSrc = volume.m_dataArray;
    for (let z = 0; z < SZ; z++) {
      for (let y = 0; y < SZ; y++) {
        for (let x = 0; x < SZ; x++) {
          pixelsSrc[offDst++] = (z < HALF_SZ) ? 0 : 255;
        }
      }
    }
    // apply gauss
    const kernelSize = 2;
    const sigma = kernelSize / 6.0;
    this.start(volume, kernelSize, sigma);
    while (!this.isFinished()) {
      this.update();
    }
    // gauss.normalizeDstImage();
    const pixelsDst = this.getPixelsDst();
    // check some pixels
    const xOff = HALF_SZ;
    const yOff = HALF_SZ * SZ;
    const xyDim = SZ * SZ;
    let valPrev = -1;
    for (let z = 0; z < SZ; z++) {
      const srcVal = pixelsSrc[xOff + yOff + z * xyDim];
      const val = pixelsDst[xOff + yOff + z * xyDim];
      console.log('src val / gauss val = ' + srcVal.toString() + ' / ' + val.toString());
      const isGood = (val >= valPrev) ? true : false;
      if (!isGood) {
        console.log('gauss test failed');
      }
      valPrev = val;
    } // for z
    this.stop();
    console.log('gauss test completed on a small volume');

  } // end test simple

} // end class

export default GaussSmoother;
