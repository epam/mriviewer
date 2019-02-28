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
* 3d volume clipping
* @module lib/scripts/actvolume/volclip
*/

// absolute imports
import * as THREE from 'three';

// relative imports
import ActiveVolume from './actvol';

// const
const NUM_VOXELS_DEG = 5;
const NUM_VOXELS_SIDE = (1 << NUM_VOXELS_DEG);
const NUM_VOXELS_MASK = (NUM_VOXELS_SIDE - 1);
const NUM_VOXELS_ALL = (NUM_VOXELS_SIDE * NUM_VOXELS_SIDE * NUM_VOXELS_SIDE);

const MAX_INTERSECTIONS_PER_LINE = 16;

function compareV3fOnX(va, vb) {
  if (va.x < vb.x) {
    return -1;
  }
  if (va.x > vb.x) {
    return +1;
  }
  return 0;
}

/**
* Class VolumeClipper perform volume clip by non convex geo
* @class VolumeClipper
*/
export default class VolumeClipper {

  static addIntersectionToArray(vaIntersections, numIntersections, maxIntersections, vIntPoint) {
    let found = false;
    for (let i = 0; (i < numIntersections) && !found; i++) {
      const dist = vIntPoint.distanceToSquared(vaIntersections[i]);
      const MIN_VAL = 1.0e-12;
      if (dist * dist < MIN_VAL) {
        found = true;
      }
    }
    if (found) {
      return numIntersections;
    }
    if (numIntersections >= maxIntersections) {
      console.log(`!!! Dump intersection array: maxInts = ${maxIntersections}`);
      for (let j = 0; j < numIntersections; j++) {
        console.log(`!!!Dump ints: ${vaIntersections[j].x}, ${vaIntersections[j].y}, ${vaIntersections[j].z}`);
      }
      return 0;
    }
    vaIntersections[numIntersections].set(vIntPoint.x, vIntPoint.y, vIntPoint.z);
    numIntersections++;
    return numIntersections;
  }
  static addTriangleToVoxel(triVoxelList, numTrianglesInVoxelApprox, numVoxelSize, vx, vy, vz, indTri) {
    // use param
    // numVoxelSize = numVoxelSize;
    const voxInd = vx + (vy << NUM_VOXELS_DEG) + (vz << (NUM_VOXELS_DEG + NUM_VOXELS_DEG));
    const offList = numTrianglesInVoxelApprox * voxInd;
    // int *voxList = triVoxelList + numTrianglesInVoxelApprox * voxInd;
    let i;
    let isFound = false;
    for (i = 0; (i < numTrianglesInVoxelApprox) && !isFound; i++) {
      if (triVoxelList[i + offList] === -1) {
        break;
      }
      if (triVoxelList[i + offList] === indTri) {
        isFound = true;
      }
    }
    // assert(i < numTrianglesInVoxelApprox);
    if (i >= numTrianglesInVoxelApprox) {
      console.log(`addTriangleToVoxel.i=${i} expected < numTrianglesInVoxelApprox = ${numTrianglesInVoxelApprox}`);
    }
    if (isFound) {
      return 1;
    }
    triVoxelList[i + offList] = indTri;
    return 1;
  }

  /**
  *
  * Find intersection of ray (looking in x direction) and triangle
  * return null, if no intersection. or Vector3 object
  */
  static getIntersectXRayTri(vRayStart, va, vb, vc) {

    // get triangle normal
    const vAB = new THREE.Vector3();
    const vBC = new THREE.Vector3();
    vAB.subVectors(vb, va);
    vBC.subVectors(vc, vb);

    const vTriNormal = new THREE.Vector3();
    vTriNormal.crossVectors(vAB, vBC);
    const SOME_SMALL_VALUE = 1.0e-7;
    if (vTriNormal.dot(vTriNormal) < SOME_SMALL_VALUE) {
      return null;
    }
    if (Math.abs(vTriNormal.x) < SOME_SMALL_VALUE) {
      return null; // ray parallel to triangle
    }
    vTriNormal.normalize();
    const vs = new THREE.Vector3();
    vs.subVectors(va, vRayStart);
    const dot = vs.dot(vTriNormal);
    const t = dot / vTriNormal.x;
    const vInter = new THREE.Vector3(vRayStart.x, vRayStart.y, vRayStart.z);
    vInter.x += t;

    // project all points onto plane
    const xAxis = new THREE.Vector3();
    const yAxis = new THREE.Vector3();
    xAxis.subVectors(vb, va);
    xAxis.normalize();
    yAxis.crossVectors(xAxis, vTriNormal);

    // projection onto plane
    const p0 = new THREE.Vector3(0.0, 0.0, 0.0);
    const p1 = new THREE.Vector3(0.0, 0.0, 0.0);
    const p2 = new THREE.Vector3(0.0, 0.0, 0.0);
    const p = new THREE.Vector3(0.0, 0.0, 0.0);

    p1.set((vb.x - va.x) * xAxis.x + (vb.y - va.y) * xAxis.y + (vb.z - va.z) * xAxis.z,
      (vb.x - va.x) * yAxis.x + (vb.y - va.y) * yAxis.y + (vb.z - va.z) * yAxis.z,
      0.0);
    p2.set((vc.x - va.x) * xAxis.x + (vc.y - va.y) * xAxis.y + (vc.z - va.z) * xAxis.z,
      (vc.x - va.x) * yAxis.x + (vc.y - va.y) * yAxis.y + (vc.z - va.z) * yAxis.z,
      0.0);

    p.set((vInter.x - va.x) * xAxis.x + (vInter.y - va.y) * xAxis.y + (vInter.z - va.z) * xAxis.z,
      (vInter.x - va.x) * yAxis.x + (vInter.y - va.y) * yAxis.y + (vInter.z - va.z) * yAxis.z,
      0.0);

    // check point s in inside triangle a, b, c
    //
    // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
    //
    const TWO = 2.0;
    const areaTri = 0.5 * (-p0.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    const koefArea = 1.0 / (TWO * areaTri);
    const alfa = koefArea * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y);
    const beta = koefArea * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y);
    const gama = 1.0 - alfa - beta;
    const TOO_SMALL = 1.0e-7;
    if ((alfa > -TOO_SMALL) && (beta > -TOO_SMALL) && (gama > -TOO_SMALL)) {
      return vInter;
    }
    return null;
  }

  /**
  * Clip volumetric texture with given non-convex geometry (triangle mesh)
  * @param {array} volTexSrc source volume texture
  * @param {number} xDim Dimension on x
  * @param {number} yDim Dimension on y
  * @param {number} zDim Dimension on z
  * @param {array} volTexDst destination volumetric texture (output)
  * @param {object} geo geometry, used for clipping
  * @param {number} CreateType How to clip: remove skull or create brain mask
  */
  static clipVolumeByNonConvexGeo(volTexSrc, xDim, yDim, zDim, volTexDst, geo, createType) {
    let i, i4;

    const numTriangles = geo.getNumTriangles();
    const indices = geo.getIndices();
    const numVertices = geo.getNumVertices();
    const vertices = geo.getVertices();

    const NUM_COMPS_IN_VERTEX = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;

    // Find geometry centroid
    const vCentroid = new THREE.Vector3(0.0, 0.0, 0.0);
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_IN_VERTEX) {
      const v = new THREE.Vector3(vertices[i4 + OFF_0], vertices[i4 + OFF_1], vertices[i4 + OFF_2]);
      vCentroid.add(v);
    }
    vCentroid.multiplyScalar(1.0 / numVertices);

    // ************************************************

    // Find min. max radius of bounding spheres
    const TOO_MAX_VAL = 1.0e12;
    let radiusMin = TOO_MAX_VAL;
    let radiusMax = 0.0;
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_IN_VERTEX) {
      const v = new THREE.Vector3(vertices[i4 + OFF_0], vertices[i4 + OFF_1], vertices[i4 + OFF_2]);
      const dist = v.distanceTo(vCentroid);
      radiusMin = (dist < radiusMin) ? dist : radiusMin;
      radiusMax = (dist > radiusMax) ? dist : radiusMax;
    }
    // console.log(`clipVolumeByNonConvexGeo. rad min, max = ${radiusMin}, ${radiusMax}`);
    const verts = new Array(numVertices);
    const vertVoxels = new Int32Array(numVertices);
    for (i = 0; i < numVertices; i++) {
      verts[i] = new THREE.Vector3();
    }

    // get vertices
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_IN_VERTEX) {
      verts[i].set(vertices[i4 + OFF_0], vertices[i4 + OFF_1], vertices[i4 + OFF_2]);
    }

    const vMin = new THREE.Vector3(0.0, 0.0, 0.0);
    const TOO_SMALL_ADD = 0.0001;
    const vMax = new THREE.Vector3(xDim + TOO_SMALL_ADD, yDim + TOO_SMALL_ADD, zDim + TOO_SMALL_ADD);

    const vVoxScale = new THREE.Vector3();
    vVoxScale.x = NUM_VOXELS_SIDE / (vMax.x - vMin.x);
    vVoxScale.y = NUM_VOXELS_SIDE / (vMax.y - vMin.y);
    vVoxScale.z = NUM_VOXELS_SIDE / (vMax.z - vMin.z);

    // get voxel numbers for vertices
    for (i = 0; i < numVertices; i++) {
      const ix = Math.floor((verts[i].x - vMin.x) * vVoxScale.x);
      const iy = Math.floor((verts[i].y - vMin.y) * vVoxScale.y);
      const iz = Math.floor((verts[i].z - vMin.z) * vVoxScale.z);
      // assert(ix < NUM_VOXELS_SIDE);
      // assert(iy < NUM_VOXELS_SIDE);
      // assert(iz < NUM_VOXELS_SIDE);
      vertVoxels[i] = ix + (iy * NUM_VOXELS_SIDE) + (iz * NUM_VOXELS_SIDE * NUM_VOXELS_SIDE);
    }

    let i3;

    // get ave dist
    let distAve = 0.0;
    const IND_IN_TRI = 3;
    const NUM_TRIS_FOR_APPROX_LEN = 32;
    for (i = 0, i3 = 0; i < NUM_TRIS_FOR_APPROX_LEN; i++, i3 += IND_IN_TRI) {
      const indTri = new Int32Array(IND_IN_TRI);
      indTri[OFF_0] = indices[i3 + OFF_0];
      indTri[OFF_1] = indices[i3 + OFF_1];
      indTri[OFF_2] = indices[i3 + OFF_2];
      const va = new THREE.Vector3(); va.set(verts[indTri[OFF_0]].x, verts[indTri[OFF_0]].y, verts[indTri[OFF_0]].z);
      const vb = new THREE.Vector3(); vb.set(verts[indTri[OFF_1]].x, verts[indTri[OFF_1]].y, verts[indTri[OFF_1]].z);
      const vc = new THREE.Vector3(); vc.set(verts[indTri[OFF_2]].x, verts[indTri[OFF_2]].y, verts[indTri[OFF_2]].z);
      let dist;
      dist = va.distanceTo(vb);
      distAve += dist;
      dist = va.distanceTo(vc);
      distAve += dist;
    }
    const TWO = 2.0;
    distAve /= (TWO * NUM_TRIS_FOR_APPROX_LEN);
    const xVoxLen = Math.floor(0 + xDim / NUM_VOXELS_SIDE);
    const yVoxLen = Math.floor(0 + yDim / NUM_VOXELS_SIDE);
    const zVoxLen = Math.floor(0 + zDim / NUM_VOXELS_SIDE);

    // get tri voxels
    let numVertsInVoxelApprox = (xVoxLen * yVoxLen * zVoxLen) / (distAve * distAve * distAve);
    if (numVertsInVoxelApprox < 1.0) {
      numVertsInVoxelApprox = 1.0 / numVertsInVoxelApprox;
    }
    const NUM_8 = 8;
    const numTrianglesInVoxelApprox = Math.floor(NUM_8 * numVertsInVoxelApprox);
    const numAllTriVoxelIndices = numTrianglesInVoxelApprox * NUM_VOXELS_ALL;

    // console.log(`clipVolumeByNonConvexGeo. numViNvox = ${numVertsInVoxelApprox}`);
    // console.log(`clipVolumeByNonConvexGeo. distAve = ${distAve}`);

    const triVoxelList = new Int32Array(numAllTriVoxelIndices);
    // init with fail
    for (i = 0; i < numAllTriVoxelIndices; i++) {
      triVoxelList[i] = -1;
    }

    const indTri = new Int32Array(IND_IN_TRI);
    const voxTriInd = new Int32Array(IND_IN_TRI);
    for (i = 0, i3 = 0; i < numTriangles; i++, i3 += IND_IN_TRI) {
      indTri[OFF_0] = indices[i3 + OFF_0];
      indTri[OFF_1] = indices[i3 + OFF_1];
      indTri[OFF_2] = indices[i3 + OFF_2];

      voxTriInd[OFF_0] = vertVoxels[indTri[OFF_0]];
      voxTriInd[OFF_1] = vertVoxels[indTri[OFF_1]];
      voxTriInd[OFF_2] = vertVoxels[indTri[OFF_2]];

      // remember that we use Vector3, but need v3d
      const voxTri = new Array(IND_IN_TRI);
      voxTri[OFF_0] = new THREE.Vector3();
      voxTri[OFF_1] = new THREE.Vector3();
      voxTri[OFF_2] = new THREE.Vector3();
      voxTri[0].x = voxTriInd[0] & NUM_VOXELS_MASK; voxTriInd[0] >>= NUM_VOXELS_DEG;
      voxTri[0].y = voxTriInd[0] & NUM_VOXELS_MASK; voxTriInd[0] >>= NUM_VOXELS_DEG;
      voxTri[0].z = voxTriInd[0] & NUM_VOXELS_MASK;

      voxTri[1].x = voxTriInd[1] & NUM_VOXELS_MASK; voxTriInd[1] >>= NUM_VOXELS_DEG;
      voxTri[1].y = voxTriInd[1] & NUM_VOXELS_MASK; voxTriInd[1] >>= NUM_VOXELS_DEG;
      voxTri[1].z = voxTriInd[1] & NUM_VOXELS_MASK;

      voxTri[2].x = voxTriInd[2] & NUM_VOXELS_MASK; voxTriInd[2] >>= NUM_VOXELS_DEG;
      voxTri[2].y = voxTriInd[2] & NUM_VOXELS_MASK; voxTriInd[2] >>= NUM_VOXELS_DEG;
      voxTri[2].z = voxTriInd[2] & NUM_VOXELS_MASK;

      const voxMin = new THREE.Vector3();
      const voxMax = new THREE.Vector3();
      voxMin.set(voxTri[0].x, voxTri[0].y, voxTri[0].z);
      voxMax.set(voxTri[0].x, voxTri[0].y, voxTri[0].z);

      voxMin.x = (voxTri[1].x < voxMin.x) ? voxTri[1].x : voxMin.x;
      voxMin.x = (voxTri[2].x < voxMin.x) ? voxTri[2].x : voxMin.x;

      voxMin.y = (voxTri[1].y < voxMin.y) ? voxTri[1].y : voxMin.y;
      voxMin.y = (voxTri[2].y < voxMin.y) ? voxTri[2].y : voxMin.y;

      voxMin.z = (voxTri[1].z < voxMin.z) ? voxTri[1].z : voxMin.z;
      voxMin.z = (voxTri[2].z < voxMin.z) ? voxTri[2].z : voxMin.z;

      voxMax.x = (voxTri[1].x > voxMax.x) ? voxTri[1].x : voxMax.x;
      voxMax.x = (voxTri[2].x > voxMax.x) ? voxTri[2].x : voxMax.x;

      voxMax.y = (voxTri[1].y > voxMax.y) ? voxTri[1].y : voxMax.y;
      voxMax.y = (voxTri[2].y > voxMax.y) ? voxTri[2].y : voxMax.y;

      voxMax.z = (voxTri[1].z > voxMax.z) ? voxTri[1].z : voxMax.z;
      voxMax.z = (voxTri[2].z > voxMax.z) ? voxTri[2].z : voxMax.z;

      // convert voxMin (Vector3) into v3d (int components)
      const vMinX = Math.floor(voxMin.x);
      const vMaxX = Math.floor(voxMax.x);
      const vMinY = Math.floor(voxMin.y);
      const vMaxY = Math.floor(voxMax.y);
      const vMinZ = Math.floor(voxMin.z);
      const vMaxZ = Math.floor(voxMax.z);

      let ix, iy, iz;
      for (iz = vMinZ; iz <= vMaxZ; iz++) {
        for (iy = vMinY; iy <= vMaxY; iy++) {
          for (ix = vMinX; ix <= vMaxX; ix++) {
            VolumeClipper.addTriangleToVoxel(triVoxelList, numTrianglesInVoxelApprox, NUM_VOXELS_SIDE, ix, iy, iz, i);
          }   // for (ix)
        }     // for (iy)
      }       // for (iz)
    }         // for (i) all triangles

    const vaIntersections = new Array(MAX_INTERSECTIONS_PER_LINE);
    for (i = 0; i < MAX_INTERSECTIONS_PER_LINE; i++) {
      vaIntersections[i] = new THREE.Vector3(0.0, 0.0, 0.0);
    }
    let numIntersections = 0;

    const pixelsSrc = volTexSrc;
    const pixelsDst = volTexDst;
    if (pixelsSrc === null) {
      const WRONG_SRC = -10;
      return WRONG_SRC;
    }
    if (pixelsDst === null) {
      const WRONG_DST = -20;
      return WRONG_DST;
    }

    let y, z;
    for (z = 0; z < zDim; z++) {
      const zInd = Math.floor((z - vMin.z) * vVoxScale.z);
      // debug console print
      // const MASK_PRINT = 31;
      // if ((z & MASK_PRINT) === 0) {
      //   console.log(`Clip z = ${z}`);
      // }

      for (y = 0; y < yDim; y++) {
        const yInd = Math.floor((y - vMin.y) * vVoxScale.y);
        //
        // circle formula:
        //
        // (x - Cx)^2 + (y - Cy)^2 + (z - Cz)^2 = R^2
        //
        // x = Cx+- sqrt( R^2 - (y - Cy)^2 - (z - Cz)^2 )
        //
        const dy = y - vCentroid.y;
        const dz = z - vCentroid.z;
        const det = radiusMin * radiusMin - dy * dy - dz * dz;

        let ixMin = -1, ixMax = -1;

        if (det < 0.0) {
          // completely out of small circle
        } else {
          // inside small circle
          const sdet = Math.sqrt(det);
          const xl = Math.floor(vCentroid.x - sdet);
          const xr = Math.floor(vCentroid.x + sdet);

          ixMin = Math.floor((xl - vMin.x) * vVoxScale.x);
          ixMax = Math.floor((xr - vMin.x) * vVoxScale.x);
          ixMin++;
          ixMax--;
          if (ixMin > ixMax) {
            ixMin--;
            ixMax = ixMin;
          }
        }

        // scan all voxels
        numIntersections = 0;

        const USE_VOXELS_FOR_TRIANGLE_INTERSECTION_SEARCH = true;

        if (USE_VOXELS_FOR_TRIANGLE_INTERSECTION_SEARCH) {
          for (let xInd = 0; xInd < NUM_VOXELS_SIDE; xInd++) {
            if ((xInd >= ixMin) && (xInd <= ixMax)) {
              continue;
            }

            // scan all triangles
            const ind3d = xInd + (yInd << NUM_VOXELS_DEG) + (zInd << (NUM_VOXELS_DEG + NUM_VOXELS_DEG));
            // assert(ind3d <= NUM_VOXELS_ALL);

            for (let j = 0; j < numTrianglesInVoxelApprox; j++) {
              const indexTri = triVoxelList[numTrianglesInVoxelApprox * ind3d + j] * IND_IN_TRI;
              if (indexTri < 0) {
                break;
              }
              const ia = indices[indexTri + OFF_0];
              const ib = indices[indexTri + OFF_1];
              const ic = indices[indexTri + OFF_2];

              const va = new THREE.Vector3();
              const vb = new THREE.Vector3();
              const vc = new THREE.Vector3();
              va.set(verts[ia].x, verts[ia].y, verts[ia].z);
              vb.set(verts[ib].x, verts[ib].y, verts[ib].z);
              vc.set(verts[ic].x, verts[ic].y, verts[ic].z);

              const vRayStart = new THREE.Vector3(0.0, y, z);
              const vIntersection = VolumeClipper.getIntersectXRayTri(vRayStart, va, vb, vc);
              if (vIntersection !== null) {
                const numIntersectsBefore = numIntersections;
                numIntersections = VolumeClipper.addIntersectionToArray(vaIntersections, numIntersectsBefore,
                  MAX_INTERSECTIONS_PER_LINE, vIntersection);
                if (numIntersections <= 0) {
                  console.log('addIntersectionToArray: array overflow !');
                  console.log(`!!!! cur line is y = ${y}, z = ${z}`);
                }

              }
            } // for (j) all triangles

          } // for (xInd) all voxels on x
          // if (USE_VOXELS_FOR_TRIANGLE_INTERSECTION_SEARCH)
        } else {
          // slow scan all triangles
          for (let j = 0, j3 = 0; j < numTriangles; j++, j3 += IND_IN_TRI) {
            const ia = indices[j3 + OFF_0];
            const ib = indices[j3 + OFF_1];
            const ic = indices[j3 + OFF_2];
            const va = new THREE.Vector3();
            const vb = new THREE.Vector3();
            const vc = new THREE.Vector3();
            va.set(verts[ia].x, verts[ia].y, verts[ia].z);
            vb.set(verts[ib].x, verts[ib].y, verts[ib].z);
            vc.set(verts[ic].x, verts[ic].y, verts[ic].z);
            const vRayStart = new THREE.Vector3(0.0, y, z);
            const vIntersection = VolumeClipper.getIntersectXRayTri(vRayStart, va, vb, vc);
            if (vIntersection !== null) {
              const numIntersectsBefore = numIntersections;
              numIntersections = VolumeClipper.addIntersectionToArray(vaIntersections, numIntersectsBefore,
                MAX_INTERSECTIONS_PER_LINE, vIntersection);
            }
          }
        }

        const yzOff = y * xDim + z * xDim * yDim;
        let x;
        if (numIntersections < TWO) {
          // all invisible
          for (x = 0; x < xDim; x++) {
            pixelsDst[x + yzOff] = 0;
          }
        } else {
          // test num intersection is even number
          if ((numIntersections & 1) !== 0) {
            console.log(`!!! Bad num intersections = ${numIntersections}`);
            console.log(`!!! Bad. z = ${z}, y = ${y}`);
            const BAD_NUM_INTERSECTIONS = -50;
            return BAD_NUM_INTERSECTIONS;
          }
          // extract first numIntersections elements from more large array to correct sort later
          const vaIntsSlice = vaIntersections.slice(0, numIntersections);
          // sort intersection array in x increase order
          vaIntsSlice.sort(compareV3fOnX);

          // need to take sorted vaIntersections
          const VAL_255 = 255;
          let indInter = 0;
          let isVis = 0;
          for (x = 0; (x < xDim) && (indInter < numIntersections); x++) {
            // change visibility of hor line on the intersection points
            while (x === Math.floor(vaIntsSlice[indInter].x)) {
              isVis = VAL_255 - isVis;
              indInter++;
              if (indInter >= numIntersections) {
                break;
              }
            } // while has intersection point here
            if (createType === ActiveVolume.CREATE_MASK) {
              pixelsDst[x + yzOff] = isVis;
            } else if (createType === ActiveVolume.REMOVE_SKULL) {
              pixelsDst[x + yzOff] = pixelsSrc[x + yzOff] & isVis;
            }
          } // for (x)

          // fill last pixels in hor line, based on last visibility flag
          if (createType === ActiveVolume.CREATE_MASK) {
            for (; x < xDim; x++) {
              pixelsDst[x + yzOff] = isVis;
            }  // for (x)
          } else if (createType === ActiveVolume.REMOVE_SKULL) {
            for (; x < xDim; x++) {
              pixelsDst[x + yzOff] = pixelsSrc[x + yzOff] & isVis;
            }  // for (x)
          } // if build mask

        }       // if (have sorted array of intersections

      }     // for (y)
    }       // for (z)
    return 1;
  } // clipVolumeByNonConvexGeo
}
