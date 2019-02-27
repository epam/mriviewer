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
* 3d volume generate from 3d polygon mesh
* @module lib/scripts/actvolume/volgen
*/

// absolute imports
import * as THREE from 'three';

// relative imports
import FloodFillTool from './floodfill';

/**
* Class VolumeGenerator create 3d volumes from polygonal triangle mesh
* @class VolumeGenerator
*/
export default class VolumeGenerator {

  /**
  * verts - array of THREE.Vector3
  */
  static renderTriangle(xDim, yDim, zDim, pixels, verts) {
    const xyDim = xDim * yDim;

    // outer loop:
    // [0] -> [1]
    // [0] -> [2]
    const v01 = new THREE.Vector3();
    const v02 = new THREE.Vector3();
    const v12 = new THREE.Vector3();
    v01.x = verts[1].x - verts[0].x;
    v01.y = verts[1].y - verts[0].y;
    v01.z = verts[1].z - verts[0].z;
    v02.x = verts[2].x - verts[0].x;
    v02.y = verts[2].y - verts[0].y;
    v02.z = verts[2].z - verts[0].z;

    v12.x = verts[2].x - verts[1].x;
    v12.y = verts[2].y - verts[1].y;
    v12.z = verts[2].z - verts[1].z;

    const dist01 = Math.sqrt(v01.x * v01.x + v01.y * v01.y + v01.z * v01.z);
    const dist02 = Math.sqrt(v02.x * v02.x + v02.y * v02.y + v02.z * v02.z);
    const dist12 = Math.sqrt(v12.x * v12.x + v12.y * v12.y + v12.z * v12.z);

    let distMax = (dist01 > dist02) ? dist01 : dist02;
    distMax = (dist12 > distMax) ? dist12 : distMax;
    const ITERS_ESTIMATE = 1.2;
    const numIters = Math.floor(distMax * ITERS_ESTIMATE);

    const vLScale = new THREE.Vector3();
    const vRScale = new THREE.Vector3();

    vLScale.x = v01.x / numIters;
    vLScale.y = v01.y / numIters;
    vLScale.z = v01.z / numIters;

    vRScale.x = v02.x / numIters;
    vRScale.y = v02.y / numIters;
    vRScale.z = v02.z / numIters;

    const vL = new THREE.Vector3(verts[0].x, verts[0].y, verts[0].z);
    const vR = new THREE.Vector3(verts[0].x, verts[0].y, verts[0].z);
    const vLR = new THREE.Vector3();
    const vScale = new THREE.Vector3();
    const v = new THREE.Vector3();

    for (let iterSide = 0; iterSide <= numIters; iterSide++) {
      vLR.x = vR.x - vL.x;
      vLR.y = vR.y - vL.y;
      vLR.z = vR.z - vL.z;

      vScale.x = vLR.x / numIters;
      vScale.y = vLR.y / numIters;
      vScale.z = vLR.z / numIters;

      v.x = vL.x;
      v.y = vL.y;
      v.z = vL.z;

      const VIS = 255;
      // interpolate between vL <-> vR
      for (let i = 0; i <= numIters; i++) {
        let x = Math.floor(v.x);
        let y = Math.floor(v.y);
        let z = Math.floor(v.z);

        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }

        // try to fill neighb
        x = Math.floor(v.x) + 1;
        y = Math.floor(v.y) + 0;
        z = Math.floor(v.z) + 0;
        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }

        x = Math.floor(v.x) + 0;
        y = Math.floor(v.y) + 1;
        z = Math.floor(v.z) + 0;
        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }

        x = Math.floor(v.x) + 0;
        y = Math.floor(v.y) + 0;
        z = Math.floor(v.z) + 1;
        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }

        x = Math.floor(v.x) - 1;
        y = Math.floor(v.y) + 0;
        z = Math.floor(v.z) + 0;
        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }

        x = Math.floor(v.x) + 0;
        y = Math.floor(v.y) - 1;
        z = Math.floor(v.z) + 0;
        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }
        x = Math.floor(v.x) + 0;
        y = Math.floor(v.y) + 0;
        z = Math.floor(v.z) - 1;
        if ((x >= 0) && (y >= 0) && (z >= 0) && (x < xDim) && (y < yDim) && (z < zDim)) {
          const off = x + (y * xDim) + (z * xyDim);
          pixels[off] = VIS;
        }
        // next v
        v.x += vScale.x;
        v.y += vScale.y;
        v.z += vScale.z;
      }
      // next L, R
      vL.x += vLScale.x;
      vL.y += vLScale.y;
      vL.z += vLScale.z;

      vR.x += vRScale.x;
      vR.y += vRScale.y;
      vR.z += vRScale.z;
    }
  }

  /**
  *
  * return true, if success
  */
  static generateFromFaces(xDim, yDim, zDim, pixelsDst, geo, withFillInside) {
    const numTriangles = geo.getNumTriangles();
    const indices = geo.getIndices(); // Uint32 array
    const vertices = geo.getVertices(); // floar array
    let i, i3;
    const NUM_VERT_TRI = 3;
    const NUM_COMP_VERTEX = 4;

    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;

    console.log('VolumeGeberator. render triangles');

    // clear dst buffer
    const numPixels = xDim * yDim * zDim;
    for (i = 0; i < numPixels; i++) {
      pixelsDst[i] = 0;
    }

    const vs = [];
    vs.push(new THREE.Vector3());
    vs.push(new THREE.Vector3());
    vs.push(new THREE.Vector3());
    for (i = 0, i3 = 0; i < numTriangles; i++, i3 += NUM_VERT_TRI) {
      const ia = indices[i3 + OFF_0];
      const ib = indices[i3 + OFF_1];
      const ic = indices[i3 + OFF_2];
      vs[OFF_0].x = vertices[(ia * NUM_COMP_VERTEX) + OFF_0];
      vs[OFF_0].y = vertices[(ia * NUM_COMP_VERTEX) + OFF_1];
      vs[OFF_0].z = vertices[(ia * NUM_COMP_VERTEX) + OFF_2];

      vs[OFF_1].x = vertices[(ib * NUM_COMP_VERTEX) + OFF_0];
      vs[OFF_1].y = vertices[(ib * NUM_COMP_VERTEX) + OFF_1];
      vs[OFF_1].z = vertices[(ib * NUM_COMP_VERTEX) + OFF_2];

      vs[OFF_2].x = vertices[(ic * NUM_COMP_VERTEX) + OFF_0];
      vs[OFF_2].y = vertices[(ic * NUM_COMP_VERTEX) + OFF_1];
      vs[OFF_2].z = vertices[(ic * NUM_COMP_VERTEX) + OFF_2];

      VolumeGenerator.renderTriangle(xDim, yDim, zDim, pixelsDst, vs);
    } // for (i) all triangles
    console.log('VolumeGeberator. fill internal');
    if (withFillInside) {
      const fillTool = new FloodFillTool();
      const xyzDim = xDim * yDim * zDim;
      const pixelsFill = new Uint8Array(xyzDim);

      const MAX_SEED_POINTS = 16;
      const vaSeeds = [];
      for (i = 0; i < MAX_SEED_POINTS; i++) {
        vaSeeds.push(new THREE.Vector3());
      }
      const numSeedPoints = fillTool.detectSeedPoint3d(xDim, yDim, zDim, pixelsDst, vaSeeds, MAX_SEED_POINTS);
      console.log(`VolGen. Detected ${numSeedPoints} seed points`);
      let foundGoodFill = false;
      for (let s = 0; s < numSeedPoints; s++) {
        // fill using seed point
        const vSeed = vaSeeds[s];
        // memcpy(pixelsFill, pixels, xyzDim);
        for (i = 0; i < xyzDim; i++) {
          pixelsFill[i] = pixelsDst[i];
        }

        console.log(`VolGen. Try to flood fill from ${vSeed.x}, ${vSeed.y}, ${vSeed.z} `);
        console.log(`VolGen. inside volume ${xDim}, ${yDim}, ${zDim} `);

        const okFill = fillTool.floodFill3d(xDim, yDim, zDim, pixelsFill, vSeed);
        console.log(`VolGen. Result fill = ${okFill}. numDraws = ${fillTool.m_numFilled3d}`);
        const VIS = 255;
        const OFF_CORNER = 1 + (1 * xDim) + (1 * xDim * yDim);
        if ((okFill === 1) && (pixelsFill[OFF_CORNER] !== VIS)) {
          foundGoodFill = true;
          break;
        }
      } // for (s) all seed points
      // copy back
      if (foundGoodFill) {
        // memcpy(pixels, pixelsFill, xyzDim);
        for (i = 0; i < xyzDim; i++) {
          pixelsDst[i] = pixelsFill[i];
        }
      }
      if (!foundGoodFill) {
        return false;
      }
    } // if need fill
    return true;
  }
}

