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
* Render 2d circle in scene
* @module app/scripts/graphics2d/circle2d
*/

import * as THREE from 'three';

// image z coord == 0.8
const CIRCLE_2D_Z_COORDINATE = 0.2;

/** Class Circle2D is used for render circle in 2d mode */
export default class Circle2D {
  /**
  * Constructor. Create a single circle 2d mode and add to scene on render
  * @param (object) scene - Scene where object will be rendered
  * @param (float) lineWidth - Line width in scale [-1..+1]
  * @param (float) xCenter - Circle center, x coordinate
  * @param (float) yCenter - Circle center, y coordinate
  * @param (float) xRadius - Circle (ellipse) radius, x coordinate
  * @param (float) yRadius - Circle (ellipse) radius, y coordinate
  * @param (object) matColor2d - MaterialColor2d
  */
  constructor(scene, lineWidth, xCenter, yCenter, xRadius, yRadius, matColor2d) {
    this.createWithMaterial(scene, lineWidth,
      xCenter, yCenter, xRadius, yRadius, matColor2d);
    this.m_xCenter = xCenter;
    this.m_yCenter = yCenter;
    this.m_xRadius = xRadius;
    this.m_yRadius = yRadius;
  }

  createWithMaterial(scene, lineWidth,
    xCenter, yCenter, xRadius, yRadius,
    matColor2d) {
    this.m_scene = scene;
    this.m_lineWidth = lineWidth;

    // calc ellipse perimeter length
    //
    // use
    // https://www.mathsisfun.com/geometry/ellipse-perimeter.html
    // for perimieter length approximation
    //
    const MAG_SCALE = 800.0;
    const XRAD = xRadius * MAG_SCALE;
    const YRAD = yRadius * MAG_SCALE;
    const hP = ((XRAD - YRAD) * (XRAD - YRAD)) / ((XRAD + YRAD) * (XRAD + YRAD));
    const MPI = 3.1415926535;
    const TWICE = 2;
    const M2PI = MPI * TWICE;
    // eslint-disable-next-line
    const perimeterApprox = MPI * (XRAD + YRAD) * (1.0 + 3.0 * hP / (10 + Math.sqrt(4.0 - 3.0 * hP)));
    let numAngles = Math.floor(perimeterApprox) + 1;
    const MIN_NUMBER_PIXELS_IN_CIRCLE = 4;
    numAngles = (numAngles > MIN_NUMBER_PIXELS_IN_CIRCLE) ?
      numAngles : MIN_NUMBER_PIXELS_IN_CIRCLE;
    // console.log(`numAngles = ${numAngles}`);

    // create geometry holder
    this.m_geo = new THREE.Geometry();

    // generate vertex pairs on each angle
    //
    //                        (x0,y0)    (x1,y1)
    //                           /         /
    //                          /         /
    //                      (x0,y0)    (x1,y1)
    //                       /          /
    //                    /         /
    //             (x0,y0)   (x1,y1)
    //

    for (let a = 0; a < numAngles; a++) {
      const angle = M2PI * a / numAngles;
      const x0 = xCenter + xRadius * Math.cos(angle);
      const y0 = yCenter + yRadius * Math.sin(angle);
      const x1 = xCenter + (xRadius + lineWidth) * Math.cos(angle);
      const y1 = yCenter + (yRadius + lineWidth) * Math.sin(angle);
      const v0 = new THREE.Vector3(x0, y0, CIRCLE_2D_Z_COORDINATE);
      const v1 = new THREE.Vector3(x1, y1, CIRCLE_2D_Z_COORDINATE);
      this.m_geo.vertices.push(v0);
      this.m_geo.vertices.push(v1);
    } // for (a) all angles

    // generate faces, based on vertices pairs, just added to geometry
    const normal = new THREE.Vector3(0.0, 0.0, 1.0);
    for (let a = 0; a < numAngles; a++) {
      const is = a * TWICE;
      const anext = (a + 1 < numAngles) ? (a + 1) : (0);
      const ie = anext * TWICE;
      // const faceA = new THREE.Face3(is, ie, ie + 1, normal);
      // const faceB = new THREE.Face3(ie + 1, is + 1, is, normal);
      const faceA = new THREE.Face3(is, is + 1, ie + 1, normal);
      const faceB = new THREE.Face3(ie + 1, ie, is, normal);
      this.m_geo.faces.push(faceA);
      this.m_geo.faces.push(faceB);
    } // for (a)
    this.m_mesh = new THREE.Mesh(this.m_geo, matColor2d.m_material);
    this.m_scene.add(this.m_mesh);
    // console.log(`Line added to scene: ${xs},${ys} -> ${xe},${ye} `);
  }

  /**
  * Get object for further scene addition. Need to remove old circle from scene
  * @return (object) geometry mesh object (circle)
  */
  getRenderObject() {
    return this.m_mesh;
  }

  /**
  * Return coordinate x of circle center
  * @return (float) x
  */
  getxCenter() {
    return this.m_xCenter;
  }

  /**
  * Return coordinate y of circle center
  * @return (float) y
  */
  getyCenter() {
    return this.m_yCenter;
  }

  /**
  * Return x radius of circle
  * @return (float) x
  */
  getxRadius() {
    return this.m_xRadius;
  }
  /**
  * Return y radius of circle
  * @return (float) y
  */
  getyRadius() {
    return this.m_yRadius;
  }
}
