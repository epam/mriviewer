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
    // subDivideMesh(numSubdividesOfOrigTetra);

    // scale to given input ellipse
    const numPoints = this.m_pointSet.m_numPoints;
    for (let i = 0; i < numPoints; i++) {
      this.m_pointSet.m_points[i].m_point.x *= vRadiusEllipse.x;
      this.m_pointSet.m_points[i].m_point.y *= vRadiusEllipse.y;
      this.m_pointSet.m_points[i].m_point.z *= vRadiusEllipse.z;
      // console.log(`DEEP DEB. x = ${this.m_pointSet.m_points[i].m_point.x}`);
    } // for (i) all points in set

    // test save geo into file
    // const TEST_FILE_NAME = 'tetra.ply';
    // this.saveGeoToPlyFile(TEST_FILE_NAME);
    const TEST_FILE_NAME = 'tetra.obj';
    this.saveGeoToObjFile(TEST_FILE_NAME);

    return 1;
  } // create

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
      console.log(`DEEP DEB. indices = ${triIndices[0]} ${triIndices[1]} ${triIndices[2]} `);
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
  } // saveGeoToPlyFile

}
