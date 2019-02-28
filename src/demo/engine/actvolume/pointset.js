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
* Simple point set with voxelization
* @module lib/scripts/actvolume/pointset
*/

// absolute imports
// import TetrahedronGenerator from 'tetra';

// relative imports
import PointLink from './pointlink';

const PSET_NUM_VOXELS = 16;
const PSET_NUM_LINKS = (PSET_NUM_VOXELS * PSET_NUM_VOXELS * PSET_NUM_VOXELS);

/**
* Class PointSet define set of 3d points
* @class PointSet
*/
export default class PointSet {
  /**
  * Init all internal data
  * @constructs PointSet
  */
  constructor(numPoints) {
    this.create(numPoints);
  }

  /**
  * create points set, not initialized
  * @param {number} numPoints Number of points in set estimated
  */
  create(numPoints) {
    this.m_numPoints = 0;
    this.m_numAllocatedPoints = numPoints;
    this.m_points = new Array(numPoints);
    this.m_voxels = new Array(PSET_NUM_LINKS);
    for (let i = 0; i < numPoints; i++) {
      this.m_points[i] = new PointLink();
      this.m_points[i].m_point.set(0.0, 0.0, 0.0);
      this.m_points[i].m_next = null;
    } // for (i) all points
  }
  getNumPoints() {
    return this.m_numPoints;
  }

  findPointSlow(x, y, z) {
    for (let i = 0; i < this.m_numPoints; i++) {
      const dx = x - this.m_points[i].m_point.x;
      const dy = y - this.m_points[i].m_point.y;
      const dz = z - this.m_points[i].m_point.z;
      const dist2 = dx * dx + dy * dy + dz * dz;
      const TOO_SMALL = 1.0e-8;
      if (dist2 < TOO_SMALL) {
        return i;
      }
    }
    return -1;
  }

  /**
  * Add point to set
  * @param {number} x coordinate x
  * @param {number} y coordinate y
  * @param {number} z coordinate z
  */
  addPoint(x, y, z) {
    const iSlow = this.findPointSlow(x, y, z);
    // check if exist
    if (iSlow >= 0) {
      return iSlow;
    }
    // check allocated space
    if (this.m_numPoints >= this.m_numAllocatedPoints) {
      return -1;
    }
    // add new point
    const index = this.m_numPoints;
    this.m_points[index] = new PointLink();
    this.m_points[index].m_point.set(x, y, z);
    this.m_points[index].m_next = null;
    this.m_numPoints++;
    return index;
  } // addPoint

}
