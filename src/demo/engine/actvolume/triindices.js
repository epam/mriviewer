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
* Triangle indices
* @module lib/scripts/actvolume/triindices
*/

// absolute imports
// import TetrahedronGenerator from 'tetra';

// relative imports
// import TriangleIndices from './triindices';

/**
* Class TriangleIndices define 3 indices of triangle
* @class TriangleIndices
*/
export default class TriangleIndices {
  /**
  * Init all internal data
  * @constructs TriangleIndices
  */
  constructor(ia, ib, ic) {
    const NUM_VERTS_IN_TRIANGLE = 3;
    this.m_indices = new Int32Array(NUM_VERTS_IN_TRIANGLE);
    this.m_indices[0] = ia;
    this.m_indices[1] = ib;
    this.m_indices[2] = ic;
  }
}  // TriangleIndices
