/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Render 2d lines in scene
 * @module app/scripts/graphics2d/line2d
 */

import * as THREE from 'three';

// image z coord == 0.8
const LINE_2D_Z_COORDINATE = 0.11;

/** Class LineD is used for render lines in 2d mode */
export default class Line2D {
  /**
   * Constructor. Create line 2d mode and add to scene on render
   * @param (object) scene - Scene where object will be rendered
   * @param (float) lineWidth - Line width in scale [-1..+1]
   * @param (float) xs - Line start, x coordinate
   * @param (float) ys - Line start, y coordinate
   * @param (float) xe - Line end, x coordinate
   * @param (float) ye - Line end, y coordinate
   * @param (object) matColor2d - MaterialColor2d
   */
  constructor(scene, lineWidth, xs, ys, xe, ye, matColor2d) {
    this.createWithMaterial(scene, lineWidth, xs, ys, xe, ye, matColor2d);
    this.m_xS = xs;
    this.m_yS = ys;
    this.m_xE = xe;
    this.m_yE = ye;
  }

  createWithMaterial(scene, lineWidth, xs, ys, xe, ye, matColor2d) {
    this.m_scene = scene;
    this.m_lineWidth = lineWidth;

    const vLine = new THREE.Vector2(xe - xs, ye - ys);
    const vNorm = new THREE.Vector2(+vLine.y, -vLine.x);
    vNorm.normalize();
    vNorm.multiplyScalar(lineWidth);

    //      0   start    1
    //      +-----+------+    ----> vNorm
    //      |\           |
    //      | \          |
    //      |  \         |
    //      |   \        |
    //      |    \       |
    //      |     \      |
    //      |      \     |
    //      |       \    |
    //      |        \   |
    //      |         \  |
    //      |          \ |
    //      |           \|
    //      +-----+------+
    //      2    end     3
    //
    const v0 = new THREE.Vector3(xs - vNorm.x, ys - vNorm.y, LINE_2D_Z_COORDINATE);
    const v1 = new THREE.Vector3(xs + vNorm.x, ys + vNorm.y, LINE_2D_Z_COORDINATE);
    const v2 = new THREE.Vector3(xe - vNorm.x, ye - vNorm.y, LINE_2D_Z_COORDINATE);
    const v3 = new THREE.Vector3(xe + vNorm.x, ye + vNorm.y, LINE_2D_Z_COORDINATE);

    this.m_geo = new THREE.Geometry();
    this.m_geo.vertices.push(v0);
    this.m_geo.vertices.push(v1);
    this.m_geo.vertices.push(v2);
    this.m_geo.vertices.push(v3);

    const normal = new THREE.Vector3(0.0, 0.0, 1.0);
    // eslint-disable-next-line
    this.m_geo.faces.push(new THREE.Face3(0, 1, 3, normal));
    // eslint-disable-next-line
    this.m_geo.faces.push(new THREE.Face3(3, 2, 0, normal));

    //this.planeGeometry = new THREE.PlaneBufferGeometry(0.5, 0.5);
    //const plane = new THREE.Mesh(this.planeGeometry, matColor2d.m_material);
    //this.m_scene.add(plane);

    //this.m_mesh = new THREE.Mesh(this.m_geo, matColor2d.m_material);
    this.m_mesh = new THREE.Mesh(this.m_geo, matColor2d);
    this.m_scene.add(this.m_mesh);
    console.log(`Line added to scene: ${xs},${ys} -> ${xe},${ye} `);
  }

  /**
   * Get object for further scene addition. Need to remove old line from scene
   * @return (object) line object
   */
  getRenderObject() {
    return this.m_mesh;
  }

  /**
   * Return coordinate x of start point
   * @return (float) x
   */
  getxS() {
    return this.m_xS;
  }

  /**
   * Return coordinate y of start point
   * @return (float) y
   */
  getyS() {
    return this.m_yS;
  }

  /**
   * Return coordinate x of end point
   * @return (float) x
   */
  getxE() {
    return this.m_xE;
  }

  /**
   * Return coordinate y of end point
   * @return (float) y
   */
  getyE() {
    return this.m_yE;
  }
}
