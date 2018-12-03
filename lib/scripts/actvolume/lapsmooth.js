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
* Laplasian smoother
* @module lib/scripts/actvolume/alpsmooth
* @note refernces to articles:
* G.Taubin, "A Signal Processing Approach To Fair Surface Design"
* Y.Ohtake, A.Belyaev, I.Bogaevski, "Polyhedral Surface Smoothing with Simultaneous Mesh Regularization"
* A.Belyaev, Y.Ohtake, "A Comparison of Mesh Smoothing Methods"
*
* Future enchancement
* Advanced mesh smoothing, better then Laplasian smoothing
* H.Yagou, Y.Ohtake, A.Belyaev, "Mesh Smoothing via Mean and Median Filtering Applied to Face Normals"
*
*/

// absolute imports
import * as THREE from 'three';

// relative imports

// consts
const LAPSMOOTH_NUM_NEIBS = 16;
const INVALID_INDEX = -1;


/**
* Class LaplasianSmoother perform simple laplasian smoothing
* @class LaplasianSmoother
*/
export default class LaplasianSmoother {
  /**
  * Init all internal data
  * @constructs ActiveVolume
  */
  constructor() {
    this.m_vertNeib = null;
  }
  performSmoothStep(numVertices, vertSrc4, numTriangles, triIndices, vertDst) {
    // allocate memory for each vertex neighbours
    if (this.m_vertNeib === null) {
      this.m_vertNeib = new Int32Array(numVertices * LAPSMOOTH_NUM_NEIBS);
      this.getVerticesNeighbours(numVertices, vertSrc4, numTriangles, triIndices);
    }
    let i, i4, iNeib;

    const NUM_COMPS_VERT = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    // find vertices center
    const vCenter = new THREE.Vector3(0.0, 0.0, 0.0);
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERT) {
      const v = new THREE.Vector3(vertSrc4[i4 + OFF_0], vertSrc4[i4 + OFF_1], vertSrc4[i4 + OFF_2]);
      vCenter.add(v);
    }
    const scaleCenter = 1.0 / numVertices;
    vCenter.multiplyScalar(scaleCenter);

    let distAve = 0.0;
    // update vertices in triangle mesh
    for (i = 0, i4 = 0, iNeib = 0; i < numVertices; i++, i4 += NUM_COMPS_VERT, iNeib += LAPSMOOTH_NUM_NEIBS) {
      // get ave pos from neibs
      const vAve = new THREE.Vector3(0.0, 0.0, 0.0);
      let numNeibs = 0;
      for (let k = 0; k < LAPSMOOTH_NUM_NEIBS; k++) {
        const indNeib = this.m_vertNeib[iNeib + k];
        if (indNeib === INVALID_INDEX) {
          break;
        }
        const vertOffset = indNeib * NUM_COMPS_VERT;
        vAve.x += vertSrc4[vertOffset + OFF_0];
        vAve.y += vertSrc4[vertOffset + OFF_1];
        vAve.z += vertSrc4[vertOffset + OFF_2];
        numNeibs++;
      }   // for (k) all possible neighbours

      // check is this isolated vertex: no one triangle share thios vertex
      if (numNeibs === 0) {
        continue;
      }

      const scl = 1.0 / numNeibs;
      vAve.multiplyScalar(scl);
      const vCur = new THREE.Vector3(vertSrc4[i4 + OFF_0], vertSrc4[i4 + OFF_1], vertSrc4[i4 + OFF_2]);

      const vNew = new THREE.Vector3();
      const  RATIO_CUR = 0.3;

      vNew.x = vCur.x * (1.0 - RATIO_CUR) + vAve.x * (RATIO_CUR);
      vNew.y = vCur.y * (1.0 - RATIO_CUR) + vAve.y * (RATIO_CUR);
      vNew.z = vCur.z * (1.0 - RATIO_CUR) + vAve.z * (RATIO_CUR);

      const dist = vNew.distanceTo(vCur);
      distAve += dist;

      vertDst[i4 + OFF_0] = vNew.x;
      vertDst[i4 + OFF_1] = vNew.y;
      vertDst[i4 + OFF_2] = vNew.z;

    }     // for (i)
    distAve /= numVertices;

    // enlarge model
    for (i = 0, i4 = 0; i < numVertices; i++, i4 += NUM_COMPS_VERT) {
      const v = new THREE.Vector3(vertDst[i4 + OFF_0], vertDst[i4 + OFF_1], vertDst[i4 + OFF_2]);
      const vDir = new THREE.Vector3();
      vDir.subVectors(v, vCenter);
      vDir.normalize();
      vDir.multiplyScalar(distAve);
      v.add(vDir);

      vertDst[i4 + OFF_0] = v.x;
      vertDst[i4 + OFF_1] = v.y;
      vertDst[i4 + OFF_2] = v.z;
    }
    return 1;
  }

  getVerticesNeighbours(numVertices, vertSrc4, numTriangles, triIndices) {
    const NUM_ELLEMS = LAPSMOOTH_NUM_NEIBS * numVertices;
    let i, j;
    for (i = 0; i < NUM_ELLEMS; i++) {
      this.m_vertNeib[i] = INVALID_INDEX;
    }
    const NUM_INDICES_TRI = 3;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    for (i = 0, j = 0; i < numTriangles; i++, j += NUM_INDICES_TRI) {
      const indA = triIndices[j + OFF_0];
      const indB = triIndices[j + OFF_1];
      const indC = triIndices[j + OFF_2];
      this.addNeib(indA, indB);
      this.addNeib(indA, indC);
      this.addNeib(indB, indA);
      this.addNeib(indB, indC);
      this.addNeib(indC, indA);
      this.addNeib(indC, indB);
    }
  } // of getVerticesNeighbours
  addNeib(indFrom, indTo) {
    const idx = indFrom * LAPSMOOTH_NUM_NEIBS;
    let i;
    let found = false;
    for (i = 0; (i < LAPSMOOTH_NUM_NEIBS) && !found; i++) {
      if (this.m_vertNeib[idx + i] === INVALID_INDEX) {
        break;
      }
      if (this.m_vertNeib[idx + i] === indTo) {
        found = true;
      }
    }
    if (found) {
      return;
    }

    // add new link
    for (i = 0; (i < LAPSMOOTH_NUM_NEIBS); i++) {
      if (this.m_vertNeib[idx + i] === INVALID_INDEX) {
        break;
      }
    }
    if (i >= LAPSMOOTH_NUM_NEIBS) {
      console.log('asserion failed for i < LAPSMOOTH_NUM_NEIBS');
    }
    this.m_vertNeib[idx + i] = indTo;
  } // addNeib
}
