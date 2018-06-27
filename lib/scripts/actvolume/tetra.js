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
import * as THREE from 'three';

// relative imports
import PointSet from './pointset';
import TriangleSet from './triangleset';
import TriangleStack from './trianglestack';

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
  * @param {number} vRadiusEllipse Ellipse radius
  * @param {number} numSubdividesOfOrigTetra number of sub divides
  */
  create(vRadiusEllipse, numSubdividesOfOrigTetra) {
    // console.log(`vRadiusEllipse = ${vRadiusEllipse}`);
    // console.log(`numSubdividesOfOrigTetra = ${numSubdividesOfOrigTetra}`);
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
    this.m_pointSet = new PointSet(NUM_VERTICES_TETRA);
    let i3 = 0;
    for (let i = 0; i < NUM_VERTICES_TETRA; i++, i3 += 3) {
      const x = vdata[i3 + 0];
      const y = vdata[i3 + 1];
      const z = vdata[i3 + 2];
      this.m_pointSet.addPoint(x, y, z);
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
    this.subDivideMesh(numSubdividesOfOrigTetra);

    // scale to given input ellipse
    const numPoints = this.m_pointSet.getNumPoints();
    for (let i = 0; i < numPoints; i++) {
      this.m_pointSet.m_points[i].m_point.x *= vRadiusEllipse.x;
      this.m_pointSet.m_points[i].m_point.y *= vRadiusEllipse.y;
      this.m_pointSet.m_points[i].m_point.z *= vRadiusEllipse.z;
      // console.log(`DEEP DEB. x = ${this.m_pointSet.m_points[i].m_point.x}`);
    } // for (i) all points in set

    // test save geo into file
    // const TEST_FILE_NAME = 'tetra.obj';
    // this.saveGeoToObjFile(TEST_FILE_NAME);

    return 1;
  } // create

  getNumTriangles() {
    return this.m_triangleSet.m_numTriangles;
  }
  getNumVertices() {
    return this.m_pointSet.m_numPoints;
  }
  getVertex(i) {
    return this.m_pointSet.m_points[i].m_point;
  }
  getTriangle(i) {
    return this.m_triangleSet.m_triangles[i].m_indices;
  }

  /**
  * Save tetrahedron geometry into given file (PLY type)
  * see PLY format description here:
  * https://en.wikipedia.org/wiki/PLY_(file_format)
  */
  saveGeoToPlyFile(fileName) {
    let strOut = 'ply\nformat ascii 1.0\ncomment tetrahedron mesh\n';
    const numVertices = this.m_pointSet.m_numPoints;
    const strNumVertices = numVertices.toString();
    strOut = strOut.concat('element vertex ');
    strOut = strOut.concat(strNumVertices);
    strOut = strOut.concat('\n');
    strOut = strOut.concat('property float x\nproperty float y\nproperty float z\n');
    strOut = strOut.concat('element face ');
    const numTriangles = this.m_triangleSet.m_numTriangles;
    const strNumTriangles = numTriangles.toString();
    strOut = strOut.concat(strNumTriangles);
    strOut = strOut.concat('\n');
    strOut = strOut.concat('property list uchar int vertex_indices\n');
    strOut = strOut.concat('end_header\n');

    // Write vertices
    for (let i = 0; i < numVertices; i++) {
      const vert = this.m_pointSet.m_points[i].m_point;
      const strX = vert.x.toString();
      const strY = vert.y.toString();
      const strZ = vert.z.toString();
      // console.log(`DEEP DEB. xyz = ${strX} ${strY} ${strZ} `);
      strOut = strOut.concat(strX);
      strOut = strOut.concat(' ');
      strOut = strOut.concat(strY);
      strOut = strOut.concat(' ');
      strOut = strOut.concat(strZ);
      strOut = strOut.concat(' 1.0\n');
    }
    // Write triangles
    for (let i = 0; i < numTriangles; i++) {
      const triIndices = this.m_triangleSet.m_triangles[i].m_indices;
      // console.log(`DEEP DEB. indices = ${triIndices[0]} ${triIndices[1]} ${triIndices[2]} `);
      const strIndices = `3 ${triIndices[0]} ${triIndices[1]} ${triIndices[2]}\n`;
      strOut = strOut.concat(strIndices);
    }

    const encoder = new TextEncoder();
    const arr = encoder.encode(strOut);

    const blob = new Blob([arr], { type: 'application/octet-stream' });
    // saveAs(blob, TEST_FILE_NAME);
    const url = URL.createObjectURL(blob);
    const linkGen = document.createElement('a');
    linkGen.setAttribute('href', url);
    linkGen.setAttribute('download', fileName);
    const eventGen = document.createEvent('MouseEvents');
    eventGen.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    linkGen.dispatchEvent(eventGen);
  } // saveGeoToPlyFile

  /**
  * Save tetrahedron geometry into given file (OBJ type)
  */
  saveGeoToObjFile(fileName) {
    let strOut = '# Tetrahedron test geo\n';
    const numVertices = this.m_pointSet.m_numPoints;
    const strNumVertices = numVertices.toString();
    const numTriangles = this.m_triangleSet.m_numTriangles;
    const strNumTriangles = numTriangles.toString();

    // Write vertices
    for (let i = 0; i < numVertices; i++) {
      const vert = this.m_pointSet.m_points[i].m_point;
      const strX = vert.x.toString();
      const strY = vert.y.toString();
      const strZ = vert.z.toString();
      strOut = strOut.concat('v  ');
      strOut = strOut.concat(strX);
      strOut = strOut.concat(' ');
      strOut = strOut.concat(strY);
      strOut = strOut.concat(' ');
      strOut = strOut.concat(strZ);
      strOut = strOut.concat('\n');
    }
    // write num verts
    const strNumVerts = `# ${strNumVertices} vertices\n`;
    strOut = strOut.concat(strNumVerts);
    strOut = strOut.concat('g TetraObj\n');

    // Write triangles
    for (let i = 0; i < numTriangles; i++) {
      const triIndices = this.m_triangleSet.m_triangles[i].m_indices;
      // console.log(`DEEP DEB. indices = ${triIndices[0]} ${triIndices[1]} ${triIndices[2]} `);
      const i0 = 1 + triIndices[0];
      const i1 = 1 + triIndices[1];
      const i2 = 1 + triIndices[2];
      const strIndices = `f ${i0} ${i1} ${i2}\n`;
      strOut = strOut.concat(strIndices);
    }
    // write num tri
    const strNumTri = `# ${strNumTriangles} triangles\n`;
    strOut = strOut.concat(strNumTri);

    const encoder = new TextEncoder();
    const arr = encoder.encode(strOut);

    const blob = new Blob([arr], { type: 'application/octet-stream' });
    // saveAs(blob, TEST_FILE_NAME);
    const url = URL.createObjectURL(blob);
    const linkGen = document.createElement('a');
    linkGen.setAttribute('href', url);
    linkGen.setAttribute('download', fileName);
    const eventGen = document.createEvent('MouseEvents');
    eventGen.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    linkGen.dispatchEvent(eventGen);
  } // saveGeoToObjFile

  /*
  * Sub divide source mesh
  * @param {number} numSubdividesOfOrigTetra number of sub divides
  */
  subDivideMesh(numSubdividesOfOrigTetra) {
    if (numSubdividesOfOrigTetra === 0) {
      return 1;
    }
    const triStackSrc = new TriangleStack();
    triStackSrc.create(numSubdividesOfOrigTetra);
    const triStackDst = new TriangleStack();
    triStackDst.create(numSubdividesOfOrigTetra);

    const numTriangles = this.m_triangleSet.getNumTriangles();
    for (let t = 0; t < numTriangles; t++) {
      const triIndices = this.m_triangleSet.m_triangles[t].m_indices;
      const ia = triIndices[0];
      const ib = triIndices[1];
      const ic = triIndices[2];
      const va = this.m_pointSet.m_points[ia].m_point;
      const vb = this.m_pointSet.m_points[ib].m_point;
      const vc = this.m_pointSet.m_points[ic].m_point;
      const okPush = triStackSrc.push(va, vb, vc);
      if (okPush < 1) {
        return okPush;
      }
    } // for (t) all triangles, push em all
    let stackSrc = triStackSrc;
    let stackDst = triStackDst;
    for (let iter = 0; iter < numSubdividesOfOrigTetra; iter++) {
      const numStacked = stackSrc.getStackDepth();
      for (let s = 0; s < numStacked; s++) {
        // pop tri from stack
        const triSingle = stackSrc.pop();
        if (triSingle === null) {
          return -1;
        }
        const v1 = triSingle.va;
        const v2 = triSingle.vb;
        const v3 = triSingle.vc;

        // create additional vertices
        const v12 = new THREE.Vector3();
        const v23 = new THREE.Vector3();
        const v31 = new THREE.Vector3();
        v12.addVectors(v1, v2);
        v12.normalize();
        v23.addVectors(v2, v3);
        v23.normalize();
        v31.addVectors(v3, v1);
        v31.normalize();

        stackDst.push(v1, v12, v31);
        stackDst.push(v2, v23, v12);
        stackDst.push(v3, v31, v23);
        stackDst.push(v12, v23, v31);
      } // for (s) stacked triangles
      // exchange stack
      const stackTmp = stackSrc;
      stackSrc = stackDst;
      stackDst = stackTmp;
    } // for (iter) all stack depth, subdivide iterations
    // now we have stack src
    const numTrisInStack = stackSrc.getStackDepth();
    // vertices should not be more than 12/20 == 0.6
    const estimateNumVertices = Math.floor(numTrisInStack * 3 * 0.6);
    this.m_triangleSet.create(numTrisInStack);
    this.m_pointSet.create(estimateNumVertices);
    // let numTrisFromStack = 0;
    while (!stackSrc.isEmpty()) {
      // V3f va, vb, vc;
      // stackSrc->pop(va, vb, vc);
      const triSingle = stackSrc.pop();
      const va = triSingle.va;
      const vb = triSingle.vb;
      const vc = triSingle.vc;
      const indA = this.m_pointSet.addPoint(va.x, va.y, va.z);
      const indB = this.m_pointSet.addPoint(vb.x, vb.y, vb.z);
      const indC = this.m_pointSet.addPoint(vc.x, vc.y, vc.z);

      const okAddTri = this.m_triangleSet.addTriangle(indA, indB, indC);
      if (okAddTri !== 1) {
        return okAddTri;
      }
      // numTrisFromStack++;
    } // while
    // assert(m_pointsSet.getNumPoints() <= estimateNumVertices);
    // assert(m_triangleSet.getNumTriangles() <= numTrisInStack);
    const numPts = this.m_pointSet.getNumPoints();
    const numTris = this.m_triangleSet.getNumTriangles();
    const ERR_ESTIMATE = -10;
    if (numPts > estimateNumVertices) {
      return ERR_ESTIMATE;
    }
    if (numTris > numTrisInStack) {
      return ERR_ESTIMATE;
    }
    return 1;
  }

}
