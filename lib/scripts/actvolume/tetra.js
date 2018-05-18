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
* Tetrahedron generator
* @module lib/scripts/actvolume/tetra
*/

// absolute imports
// import TetrahedronGenerator from 'tetra';

// relative imports
import PointSet from './pointset';
import TriangleSet from './triangleset';

const NUM_VERTICES_TETRA = 12;
const NUM_TRIANGLES_TETRA = 20;

/**
* Class TetrahedronGenerator builds good sphere-looked tri mesh
* @class TetrahedronGenerator
*/
export default class TetrahedronGenerator {
  /**
  * Init all internal data
  * @constructs TetrahedronGenerator
  */
  constructor() {
    this.m_pointSet = null;
    this.m_triangleSet = null;
  }

  /**
  * Create triangle mesh structure
  */
  create(vRadiusEllipse, numSubdividesOfOrigTetra) {
    console.log(`vRadiusEllipse = ${vRadiusEllipse}`);
    console.log(`numSubdividesOfOrigTetra = ${numSubdividesOfOrigTetra}`);
    const X = 0.5257311121;
    const Z = 0.8506508083;
    // { -X, 0.0f, Z },{ X, 0.0f, Z },{ -X, 0.0f, -Z },{ X, 0.0f, -Z },
    // { 0.0f, Z, X },{ 0.0f, Z, -X },{ 0.0f, -Z, X },{ 0.0f, -Z, -X },
    // { Z, X, 0.0f },{ -Z, X, 0.0f },{ Z, -X, 0.0f },{ -Z, -X, 0.0f }
    const vdata = [
      -X, 0.0, +Z,
      +X, 0.0, +Z,
      -X, 0.0, -Z,
      +X, 0.0, -Z,
      0.0, +Z, +X,
      0.0, +Z, -X,
      0.0, -Z, +X,
      0.0, -Z, -X,
      +Z, +X, 0.0,
      -Z, +X, 0.0,
      +Z, -X, 0.0,
      -Z, -X, 0.0,
    ];
    /*eslint-disable no-magic-numbers*/
    const tindices = [
      0, 4, 1, 0, 9, 4, 9, 5, 4, 4, 5, 8, 4, 8, 1,
      8, 10, 1, 8, 3, 10, 5, 3, 8, 5, 2, 3, 2, 7, 3,
      7, 10, 3, 7, 6, 10, 7, 11, 6, 11, 0, 6, 0, 1, 6,
      6, 1, 10, 9, 0, 11, 9, 11, 2, 9, 2, 5, 7, 2, 11
    ];
    // m_pointsSet.create(NUM_VERTICES_TETRA);
    this.m_pointsSet = new PointSet(NUM_VERTICES_TETRA);
    let i3 = 0;
    for (let i = 0; i < NUM_VERTICES_TETRA; i++, i3 += 3) {
      const x = vdata[i3 + 0];
      const y = vdata[i3 + 1];
      const z = vdata[i3 + 2];
      this.m_pointsSet.addPoint(x, y, z);
    } // for (i) all vertices in tetrahedron structure
    // m_triangleSet.create(NUM_TRIANGLES_TETRA);
    this.m_triangleSet = new TriangleSet(NUM_TRIANGLES_TETRA);
    i3 = 0;
    for (let i = 0; i < NUM_TRIANGLES_TETRA; i++, i3 += 3) {
      const ia = tindices[i3 + 0];
      const ib = tindices[i3 + 1];
      const ic = tindices[i3 + 2];
      // use inverse points order to reach correct plane visibility and correct normal directions
      this.m_triangleSet.addTriangle(ia, ic, ib);
    }
  } // create
}
