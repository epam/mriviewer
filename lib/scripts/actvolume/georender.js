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
* Geometry for render
* @module lib/scripts/actvolume/georender
*/

// absolute imports
import * as THREE from 'three';

// const

// const GEO_ERROR_NA = 0;
const GEO_ERROR_OK = 1;
// const GEO_ERROR_CANT_OPEN_FILE = -1;
// const GEO_ERROR_NO_MEMORY = -2;
// const GEO_ERROR_NOT_PLY_FILE = -3;
// const GEO_ERROR_NOT_ASCII = -4;
// const GEO_ERROR_BAD_FORMAT = -5;
// const GEO_ERROR_BAD_NUM_VERTICES = -6;
// const GEO_ERROR_BAD_FACE_START = -7;
// const GEO_ERROR_BAD_FACE_VERT_INDEX = -8;

/**
* Class GeoRender for render geometry
* @class GeoRender
*/
export default class GeoRender {
  constructor() {
    this.m_numVertices = 0;
    this.m_vertices = null;
    this.m_normals = null;
    this.m_numTriangles = 0;
    this.m_numTrianglesAllocated = 0;
    this.m_indices = null;
    this.m_matColor = null;
    this.m_isWireframe = 0;
    this.m_boxSize = null;
    this.m_boxCenter = null;
  }
  createFromTetrahedronGenerator(gen) {
    const numVertices = gen.getNumVertices();
    const numTriangles = gen.getNumTriangles();
    this.m_numVertices = numVertices;
    this.m_numTriangles = numTriangles;
    const INDICES_IN_TRI = 3;
    const COORDS_IN_VERTEX = 4;
    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;
    const NUM_3 = 3;
    this.m_vertices = new Float32Array(numVertices * COORDS_IN_VERTEX);
    this.m_indices = new Uint32Array(numTriangles * INDICES_IN_TRI);
    // copy vertices from generator
    for (let i = 0, j = 0; i < numVertices; i++, j += COORDS_IN_VERTEX) {
      const vert = gen.getVertex(i);
      this.m_vertices[j + NUM_0] = vert.x;
      this.m_vertices[j + NUM_1] = vert.y;
      this.m_vertices[j + NUM_2] = vert.z;
      this.m_vertices[j + NUM_3] = 1.0;
    } // for (i) all vertices
    // copy triangles from generator
    for (let i = 0, j = 0; i < numTriangles; i++, j += INDICES_IN_TRI) {
      const triIndices = gen.getTriangle(i);
      this.m_indices[j + NUM_0] = triIndices[NUM_0];
      this.m_indices[j + NUM_1] = triIndices[NUM_1];
      this.m_indices[j + NUM_2] = triIndices[NUM_2];
    } // for (i) all triangles
    return GEO_ERROR_OK;
  } // create tetra

  fromBufferGeometry(geoBuffered) {
    const geo = new THREE.Geometry();
    geo.fromBufferGeometry(geoBuffered);
    geo.mergeVertices();

    const numVertices = geo.vertices.length;
    const numTriangles = geo.faces.length;
    this.m_numVertices = numVertices;
    this.m_numTriangles = numTriangles;
    // console.log(`GeoRender. fromBufferGeometry. numVertices = ${numVertices}, numTriangles = ${numTriangles}`);
    const INDICES_IN_TRI = 3;
    const COORDS_IN_VERTEX = 4;
    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;
    const NUM_3 = 3;
    this.m_vertices = new Float32Array(numVertices * COORDS_IN_VERTEX);
    this.m_indices = new Uint32Array(numTriangles * INDICES_IN_TRI);
    // copy vertices from generator
    for (let i = 0, j = 0; i < numVertices; i++, j += COORDS_IN_VERTEX) {
      const vert = geo.vertices[i];
      this.m_vertices[j + NUM_0] = vert.x;
      this.m_vertices[j + NUM_1] = vert.y;
      this.m_vertices[j + NUM_2] = vert.z;
      this.m_vertices[j + NUM_3] = 1.0;
    } // for (i) all vertices
    // copy triangles from generator
    for (let i = 0, j = 0; i < numTriangles; i++, j += INDICES_IN_TRI) {
      const face = geo.faces[i];
      this.m_indices[j + NUM_0] = face.a;
      this.m_indices[j + NUM_1] = face.b;
      this.m_indices[j + NUM_2] = face.c;
    } // for (i) all triangles
    return GEO_ERROR_OK;
  }

  createFromEllipse(vCenter, vRadius, numSegmentsHor, numSegmentsVert) {
    const INDICES_IN_TRI = 3;
    const COORDS_IN_VERTEX = 4;
    const OFF_0 = 0;
    const OFF_1 = 1;
    const OFF_2 = 2;
    const OFF_3 = 3;
    const M_PI = 3.1415926535;
    const numQuads = numSegmentsHor * numSegmentsVert;
    const TRIS_IN_QUAD = 2;
    this.m_numTriangles = numQuads * TRIS_IN_QUAD;
    this.m_numVertices = numSegmentsHor * (numSegmentsVert + 1);
    this.m_vertices = new Float32Array(this.m_numVertices * COORDS_IN_VERTEX);
    this.m_indices = new Uint32Array(this.m_numTriangles * INDICES_IN_TRI);
    // Fill vertices
    let i, j;
    let ind = 0;
    const LIT_BIT_LESS_ONE = 0.97;
    const ANGLE_QUATER = M_PI * 0.5 * LIT_BIT_LESS_ONE;
    for (j = 0; j <= numSegmentsVert; j++) {
      const tv = j / numSegmentsVert;
      const angleVert = -(ANGLE_QUATER) + tv * (ANGLE_QUATER * OFF_2);
      for (i = 0; i < numSegmentsHor; i++) {
        const th = i / numSegmentsHor;
        const angleHor = th * M_PI * OFF_2;

        const vy = vRadius.y * Math.sin(angleVert);
        const horProj = Math.cos(angleVert);
        const vx = vRadius.x * horProj * Math.cos(angleHor);
        const vz = vRadius.z * horProj * Math.sin(angleHor);
        this.m_vertices[ind + OFF_0] = vCenter.x + vx;
        this.m_vertices[ind + OFF_1] = vCenter.y + vy;
        this.m_vertices[ind + OFF_2] = vCenter.z + vz;
        this.m_vertices[ind + OFF_3] = 0.0;
        ind += COORDS_IN_VERTEX;
      }
    }
    // Fill indices
    ind = 0;
    for (j = 0; j < numSegmentsVert; j++) {
      const indRowStart = j * numSegmentsHor;
      for (i = 0; i < numSegmentsHor; i++) {
        let iNext = i + 1;
        if (iNext >= numSegmentsHor) {
          iNext = 0;
        }
        this.m_indices[ind + OFF_0] = indRowStart + iNext + numSegmentsHor;
        this.m_indices[ind + OFF_1] = indRowStart + iNext;
        this.m_indices[ind + OFF_2] = indRowStart + i;
        ind += INDICES_IN_TRI;

        this.m_indices[ind + OFF_0] = indRowStart + i;
        this.m_indices[ind + OFF_1] = indRowStart + i + numSegmentsHor;
        this.m_indices[ind + OFF_2] = indRowStart + iNext + numSegmentsHor;
        ind += INDICES_IN_TRI;
      } // for (i)
    } // for (i)
  } // createFromEllipse

  getNumVertices() {
    return this.m_numVertices;
  }
  getVertices() {
    return this.m_vertices;
  }
  getNormals() {
    return this.m_normals;
  }
  getNumTriangles() {
    return this.m_numTriangles;
  }
  getIndices() {
    return this.m_indices;
  }
  /**
  * Save render geometry into given file (OBJ type)
  */
  saveGeoToObjFile(fileName) {
    let strOut = '# Render geometry save\n';
    const numVertices = this.m_numVertices;
    const strNumVertices = numVertices.toString();
    const numTriangles = this.m_numTriangles;
    const strNumTriangles = numTriangles.toString();

    const INDICES_IN_TRI = 3;
    const COORDS_IN_VERTEX = 4;
    const NUM_0 = 0;
    const NUM_1 = 1;
    const NUM_2 = 2;

    // Write vertices
    for (let i = 0, i4 = 0; i < numVertices; i++, i4 += COORDS_IN_VERTEX) {
      const x = this.m_vertices[i4 + NUM_0];
      const y = this.m_vertices[i4 + NUM_1];
      const z = this.m_vertices[i4 + NUM_2];
      const strX = x.toString();
      const strY = y.toString();
      const strZ = z.toString();
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
    for (let i = 0, i3 = 0; i < numTriangles; i++, i3 += INDICES_IN_TRI) {
      const i0 = 1 + this.m_indices[i3 + NUM_0];
      const i1 = 1 + this.m_indices[i3 + NUM_1];
      const i2 = 1 + this.m_indices[i3 + NUM_2];
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

  /**
  * Calculate vertices normals, based on triangle normals
  */
  createNormalsForGeometry() {
    this.m_normals = new Array(this.m_numVertices);
    for (let i = 0; i < this.m_numVertices; i++) {
      this.m_normals[i] = new THREE.Vector3();
    }
    const triNormals = new Array(this.m_numTriangles);
    for (let i = 0; i < this.m_numTriangles; i++) {
      triNormals[i] = new THREE.Vector3();
    }

    const IND_A = 0;
    const IND_B = 1;
    const IND_C = 2;

    const OFF_X = 0;
    const OFF_Y = 1;
    const OFF_Z = 2;

    const VERTICES_IN_TRIANGLE = 3;
    const COORDS_IN_VERTEX = 4;

    let t, i3;
    for (t = 0, i3 = 0; t < this.m_numTriangles; t++, i3 += VERTICES_IN_TRIANGLE) {
      const ia = this.m_indices[i3 + IND_A] * COORDS_IN_VERTEX;
      const ib = this.m_indices[i3 + IND_B] * COORDS_IN_VERTEX;
      const ic = this.m_indices[i3 + IND_C] * COORDS_IN_VERTEX;
      const va = new THREE.Vector3();
      const vb = new THREE.Vector3();
      const vc = new THREE.Vector3();
      va.x = this.m_vertices[ia + OFF_X];
      va.y = this.m_vertices[ia + OFF_Y];
      va.z = this.m_vertices[ia + OFF_Z];
      vb.x = this.m_vertices[ib + OFF_X];
      vb.y = this.m_vertices[ib + OFF_Y];
      vb.z = this.m_vertices[ib + OFF_Z];
      vc.x = this.m_vertices[ic + OFF_X];
      vc.y = this.m_vertices[ic + OFF_Y];
      vc.z = this.m_vertices[ic + OFF_Z];
      const vab = new THREE.Vector3();
      const vbc = new THREE.Vector3();
      vab.subVectors(vb, va);
      vbc.subVectors(vc, vb);
      const vTriNormal = new THREE.Vector3();
      vTriNormal.crossVectors(vab, vbc);
      const TOO_SMALL = 1.0e-8;
      if (vTriNormal.lengthSq() < TOO_SMALL) {
        const ERR_BAD_NORMAL = -10;
        return ERR_BAD_NORMAL;
      }
      triNormals[t].set(vTriNormal.x, vTriNormal.y, vTriNormal.z);
    } // for (t) all triangles
    // init vert normals with 0 vector
    for (let i = 0; i < this.m_numVertices; i++) {
      this.m_normals[i].set(0.0, 0.0, 0.0);
    }
    // get additions
    for (t = 0, i3 = 0; t < this.m_numTriangles; t++, i3 += VERTICES_IN_TRIANGLE) {
      const ia = this.m_indices[i3 + IND_A];
      const ib = this.m_indices[i3 + IND_B];
      const ic = this.m_indices[i3 + IND_C];
      const vTriNormal = triNormals[t];
      this.m_normals[ia].add(vTriNormal);
      this.m_normals[ib].add(vTriNormal);
      this.m_normals[ic].add(vTriNormal);
    } // for (t) all triangles
    // normalize vertices normals
    for (let i = 0; i < this.m_numVertices; i++) {
      const len2 = this.m_normals[i].lengthSq();
      const TOO_SMALL = 1.0e-8;
      if (len2 < TOO_SMALL) {
        const ERR_BAD_VERT_NORMAL = -20;
        return ERR_BAD_VERT_NORMAL;
      }
      this.m_normals[i].normalize();
    } // for (i) all vertices

    return 1;
  } // createNormalsFormGeometry
}
