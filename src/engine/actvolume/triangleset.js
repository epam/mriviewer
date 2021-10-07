/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Triangle set
 * @module lib/scripts/actvolume/triangleset
 */

// absolute imports
// import TetrahedronGenerator from 'tetra';

// relative imports
import TriangleIndices from './triindices';

/**
 * Class TriangleSet define set of trinagles
 * @class TriangleSet
 */
export default class TriangleSet {
  /**
   * Init all internal data
   * @constructs TriangleSet
   */
  constructor(numTriangles) {
    this.create(numTriangles);
  } // constructor

  create(numTriangles) {
    this.m_numTriangles = 0;
    this.m_numAllocatedTriangles = numTriangles;
    this.m_triangles = new Array(numTriangles);
    const STRANGE_VALUE = -1;
    for (let i = 0; i < numTriangles; i++) {
      this.m_triangles[i] = new TriangleIndices(STRANGE_VALUE, STRANGE_VALUE, STRANGE_VALUE);
    }
  } // create

  /**
   * Get number of triangles
   * @return {number}
   */
  getNumTriangles() {
    return this.m_numTriangles;
  }

  /**
   * Add triangle to set
   * @return 1, if success
   */
  addTriangle(ia, ib, ic) {
    if (this.m_numTriangles >= this.m_numAllocatedTriangles) {
      return -1;
    }
    this.m_triangles[this.m_numTriangles].m_indices[0] = ia;
    this.m_triangles[this.m_numTriangles].m_indices[1] = ib;
    this.m_triangles[this.m_numTriangles].m_indices[2] = ic;
    this.m_numTriangles++;
    return 1;
  }
}
