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
* Mesh with 2d text
* @module lib/scripts/graphics2d/meshtext2d
*/

import * as THREE from 'three';

import Text2D from './text2d';
import MaterialTexturePlain2d from '../gfx/mattplain';

export default class MeshText2D extends Text2D {
  constructor(strText) {
    super(strText);
    this.m_mesh = null;
    this.m_material = null;
    this.m_renderedTextHeight = 0.0;
    this.m_xMin = 3.0;
    this.m_xMax = -3.0;
    this.m_yMin = 3.0;
    this.m_yMax = -3.0;
  }

  static getXMin(xc, xAlign, psx) {
    if (xAlign === MeshText2D.ALIGN_LEFT) {
      return xc;
    } else if (xAlign === MeshText2D.ALIGN_RIGHT) {
      return xc - psx;
    } else if (xAlign === MeshText2D.ALIGN_CENTER) {
      return xc - psx * 0.5;
    }
    return 0.0;
  }

  static getXMax(xc, xAlign, psx) {
    if (xAlign === MeshText2D.ALIGN_LEFT) {
      return xc + psx;
    } else if (xAlign === MeshText2D.ALIGN_RIGHT) {
      return xc;
    } else if (xAlign === MeshText2D.ALIGN_CENTER) {
      return xc + psx * 0.5;
    }
    return 0.0;
  }

  static getYMin(yc, yAlign, psy) {
    if (yAlign === MeshText2D.ALIGN_TOP) {
      return yc - psy;
    } else if (yAlign === MeshText2D.ALIGN_BOTTOM) {
      return yc;
    } else if (yAlign === MeshText2D.ALIGN_CENTER) {
      return yc - psy * 0.5;
    }
    return 0.0;
  }

  static getYMax(yc, yAlign, psy) {
    if (yAlign === MeshText2D.ALIGN_TOP) {
      return yc;
    } else if (yAlign === MeshText2D.ALIGN_BOTTOM) {
      return yc + psy;
    } else if (yAlign === MeshText2D.ALIGN_CENTER) {
      return yc + psy * 0.5;
    }
    return 0.0;
  }
  getRenderedTextHeight() {
    return this.m_renderedTextHeight;
  }

  /**
  * Update text 2d object: create mesh in desired position, content and width
  * @param (object) container - object container for 3d rendering
  * @param (int) xc - text anchor x coordinate
  * @param (int) yc - text anchor y coordinate
  * @param (float) letterHeight - single letter height in range [-1..+1]
  * @param (string ) strTextBackColor - Background color, like rgba(255, 0, 0, 255), i.e. red color
  */
  updateText(xc, yc, letterHeight, xAlign, yAlign, strTextBackColor, strTextColor) {
    // console.log('MeshText2D.updateText()...');
    this.cleanUp();

    if (this.m_mesh !== null) {
      this.remove(this.m_mesh);
      this.m_mesh = null;
      this.m_material = null;
    }

    this.m_canvas.drawText(this.m_text, strTextColor);

    this.m_renderedTextHeight = letterHeight;
    const wPerHRatio = this.m_canvas.m_textWidth / this.m_canvas.m_textHeight;
    const psy = letterHeight;
    const psx = psy * wPerHRatio;

    // console.log(`2dtext. text box = ${psx} * ${psy}, Ratio = ${wPerHRatio}`);

    this.m_texture = new THREE.Texture(this.m_canvas.m_canvas);
    this.m_texture.needsUpdate = true;
    if (this.m_material === null) {
      this.m_matTexturePlain = new MaterialTexturePlain2d();
      this.m_matTexturePlain.create(this.m_texture);

      this.m_material = this.m_matTexturePlain.m_material;

      this.m_material.blending = THREE.CustomBlending;
      this.m_material.blendEquation = THREE.AddEquation; // default
      this.m_material.blendSrc = THREE.SrcAlphaFactor; // default
      this.m_material.blendDst = THREE.OneMinusSrcAlphaFactor; // default

      // create quad geometry
      this.m_geometry = new THREE.Geometry();
      // v2 ----- v3
      // |        |
      // |        |
      // v0 ----- v1

      // tex coordinate max
      const X_TEXT_COORD_MAX = this.m_canvas.m_textWidth / this.m_canvas.m_canvas.width;
      const Y_TEXT_COORD_MAX = this.m_canvas.m_textHeight / this.m_canvas.m_canvas.height;

      // console.log(`2dtext. texture coord max = ${X_TEXT_COORD_MAX} * ${Y_TEXT_COORD_MAX}`);
      // console.log(`text canvas dim on screen = ${this.m_canvas.m_textWidth} * ${this.m_canvas.m_textHeight}`);
      // console.log(`psx = ${psx}, psy = ${psy}`);

      this.m_xMin = MeshText2D.getXMin(xc, xAlign, psx);
      this.m_xMax = MeshText2D.getXMax(xc, xAlign, psx);
      this.m_yMin = MeshText2D.getYMin(yc, yAlign, psy);
      this.m_yMax = MeshText2D.getYMax(yc, yAlign, psy);

      const Z_COORD_TEXT = 0.05;
      const v0 = new THREE.Vector3(this.m_xMin, this.m_yMin, Z_COORD_TEXT);
      const v1 = new THREE.Vector3(this.m_xMax, this.m_yMin, Z_COORD_TEXT);
      const v2 = new THREE.Vector3(this.m_xMin, this.m_yMax, Z_COORD_TEXT);
      const v3 = new THREE.Vector3(this.m_xMax, this.m_yMax, Z_COORD_TEXT);

      this.m_geometry.vertices.push(v0);
      this.m_geometry.vertices.push(v1);
      this.m_geometry.vertices.push(v2);
      this.m_geometry.vertices.push(v3);

      // console.log(`Texture text render max = ${X_TEXT_COORD_MAX} , ${Y_TEXT_COORD_MAX}`);

      // add texture coordinates
      this.m_geometry.faceVertexUvs[0].push([
        new THREE.Vector2(0.0, 1.0 - Y_TEXT_COORD_MAX),
        new THREE.Vector2(X_TEXT_COORD_MAX, 1.0 - Y_TEXT_COORD_MAX),
        new THREE.Vector2(0.0, 1.0),
      ]);
      this.m_geometry.faceVertexUvs[0].push([
        new THREE.Vector2(X_TEXT_COORD_MAX, 1.0),
        new THREE.Vector2(0.0, 1.0),
        new THREE.Vector2(X_TEXT_COORD_MAX, 1.0 - Y_TEXT_COORD_MAX),
      ]);
      const normal = new THREE.Vector3();
      THREE.Triangle.getNormal(v0, v1, v2, normal);

      // eslint-disable-next-line
      this.m_geometry.faces.push(new THREE.Face3(0, 1, 2, normal));
      // eslint-disable-next-line
      this.m_geometry.faces.push(new THREE.Face3(3, 2, 1, normal));

      this.m_mesh = new THREE.Mesh(this.m_geometry, this.m_material);
      this.add(this.m_mesh);

      // create text box with solid fill
      const boxCanvas = document.createElement('canvas');
      const context = boxCanvas.getContext('2d');
      boxCanvas.width = 32;
      boxCanvas.height = 32;
      // green color as box background
      context.fillStyle = strTextBackColor;
      context.fillRect(0, 0, boxCanvas.width, boxCanvas.height);
      const boxTexture = new THREE.Texture(boxCanvas);
      boxTexture.needsUpdate = true;
      this.m_matTextureBox = new MaterialTexturePlain2d();
      this.m_matTextureBox.create(boxTexture, (mat) => {
        this.m_boxMaterial = mat;

        // box geometry and mesh with this 2d simple texture material
        const Z_COORD_BOX = 0.06;
        this.m_boxGeometry = new THREE.Geometry();
        const vb0 = new THREE.Vector3(this.m_xMin, this.m_yMin, Z_COORD_BOX);
        const vb1 = new THREE.Vector3(this.m_xMax, this.m_yMin, Z_COORD_BOX);
        const vb2 = new THREE.Vector3(this.m_xMin, this.m_yMax, Z_COORD_BOX);
        const vb3 = new THREE.Vector3(this.m_xMax, this.m_yMax, Z_COORD_BOX);
        this.m_boxGeometry.vertices.push(vb0);
        this.m_boxGeometry.vertices.push(vb1);
        this.m_boxGeometry.vertices.push(vb2);
        this.m_boxGeometry.vertices.push(vb3);
        let boxNormal;
        THREE.Triangle.getNormal(vb0, vb1, vb2, boxNormal);

        // eslint-disable-next-line
        this.m_boxGeometry.faces.push(new THREE.Face3(0, 1, 2, boxNormal));
        // eslint-disable-next-line
        this.m_boxGeometry.faces.push(new THREE.Face3(3, 2, 1, boxNormal));
        this.m_boxMesh = new THREE.Mesh(this.m_boxGeometry, this.m_boxMaterial);
        this.add(this.m_boxMesh);
      });
    } else {
      this.m_material.map = this.m_texture;
    }
  } // updateText
}

MeshText2D.ALIGN_LEFT = 0;
MeshText2D.ALIGN_RIGHT = 1;
MeshText2D.ALIGN_TOP = 2;
MeshText2D.ALIGN_BOTTOM = 3;
MeshText2D.ALIGN_CENTER = 4;

