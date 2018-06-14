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
* MPR mode renderer (in 2d)
* @module app/scripts/graphics2d/mprrenderer
*/

// global imports
import * as THREE from 'three';

// local project imports
import MaterialTex2d from '../gfx/mattex2d';

// Consts
/** Project index X */
const PROJECTION_X = 0;
/** Project index Y */
const PROJECTION_Y = 1;
/** Project index Z */
const PROJECTION_Z = 2;


/** Class MprRenderer is used for 2d MRP mode visualization */
export default class MprRenderer {
  constructor(container, width, height, objGraphics2d) {
    this.m_container = container;
    this.m_width = width;
    this.m_height = height;
    this.m_objGraphics2d = objGraphics2d;
    this.m_renderer = null;
    this.m_camera = null;
    this.m_geo = null;
    // console.log(`MprRenderer create w*h = ${this.m_width} * ${this.m_height}`);
  }
  /**
  * Create WebGl renderer and connect to HTML container
  */
  create() {
    this.m_renderer = new THREE.WebGLRenderer({ antialias: true });
    const width = this.m_width;
    const height = this.m_height;
    const camAspect = width / height;
    // console.log(`MprRender.create. camAspect = ${camAspect}`);
    // eslint-disable-next-line
    this.m_camera = new THREE.PerspectiveCamera(90, camAspect, 0.01, 100);
    const CAMERA_POS_Z = 3.0;
    this.m_camera.position.x = 0.0;
    this.m_camera.position.y = 0.0;
    this.m_camera.position.z = CAMERA_POS_Z;
    // const SCENE_MPR_BACKGROUND_COLOR = 0x44aa44; // some green
    const SCENE_MPR_BACKGROUND_COLOR = 0xbbbbff; // some cyan-grey
    this.m_renderer.setClearColor(SCENE_MPR_BACKGROUND_COLOR);
    this.m_renderer.setSize(width, height);
    this.m_scene = new THREE.Scene();

    const NUM_PROJECTIONS = 3;
    this.m_geo = new Array(NUM_PROJECTIONS);
    this.m_geo[PROJECTION_X] = new THREE.Geometry();
    this.m_geo[PROJECTION_Y] = new THREE.Geometry();
    this.m_geo[PROJECTION_Z] = new THREE.Geometry();

    this.m_material = new Array(NUM_PROJECTIONS);
    this.m_material[PROJECTION_X] = null;
    this.m_material[PROJECTION_Y] = null;
    this.m_material[PROJECTION_Z] = null;

    /** Use m_sliceRatio for current projection level visualization. Should be in [0..1] */
    this.m_sliceRatio = new Array(NUM_PROJECTIONS);
    this.m_sliceRatio[PROJECTION_X] = 0.5;
    this.m_sliceRatio[PROJECTION_Y] = 0.5;
    this.m_sliceRatio[PROJECTION_Z] = 0.5;

    const volTexture = this.m_objGraphics2d.m_volTexture;

    const VPORT_SIZE = 1.0;
    const Z_COORD = 0.8;

    let i;
    const SIZE_SCREEN = 2.0;
    for (i = 0; i < NUM_PROJECTIONS; i++) {
      const XMin = -VPORT_SIZE + (i + 0) * SIZE_SCREEN / NUM_PROJECTIONS;
      const XMax = -VPORT_SIZE + (i + 1) * SIZE_SCREEN / NUM_PROJECTIONS;

      // define correct vertical rect dimension
      // to look slice proportional
      let wPhys = 0, hPhys = 0;
      if (i === PROJECTION_X) {
        wPhys = this.m_objGraphics2d.m_volumeBox.y;
        hPhys = this.m_objGraphics2d.m_volumeBox.z;
      } else if (i === PROJECTION_Y) {
        wPhys = this.m_objGraphics2d.m_volumeBox.x;
        hPhys = this.m_objGraphics2d.m_volumeBox.z;
      } else if (i === PROJECTION_Z) {
        wPhys = this.m_objGraphics2d.m_volumeBox.x;
        hPhys = this.m_objGraphics2d.m_volumeBox.y;
      }
      const wPart = this.m_width / NUM_PROJECTIONS;
      let wScreen = wPart;
      let hScreen = wScreen * hPhys / wPhys;
      if (hScreen > this.m_height) {
        hScreen = this.m_height;
        wScreen = hScreen * wPhys / hPhys;
      }
      console.log(`Proportion is: ${wScreen} * ${hScreen}`);
      // normalize to [0..1]
      hScreen /= this.m_height;
      // no need to normalize to [0..2]

      // proportions on height
      //
      // ^  +--------+
      // |  |        |
      // |  |  +--+  |   ^
      // 2  |  |  |  |   | hScreen
      // |  |  +--+  |   v
      // |  |        |
      // v  +--------+
      //
      const YMin = -hScreen;
      const YMax = +hScreen;

      // v2 ----- v3
      // |        |
      // |        |
      // v0 ----- v1
      const v0 = new THREE.Vector3(XMin, YMin, Z_COORD);
      const v1 = new THREE.Vector3(XMax, YMin, Z_COORD);
      const v2 = new THREE.Vector3(XMin, YMax, Z_COORD);
      const v3 = new THREE.Vector3(XMax, YMax, Z_COORD);
      const geo = this.m_geo[i];
      geo.vertices.push(v0);
      geo.vertices.push(v1);
      geo.vertices.push(v2);
      geo.vertices.push(v3);

      // add texture coordinates
      //
      //  (0,2) |        (1,0)
      //  (1,1) |
      //  ------+------> x
      //        |
      //        |
      //  (0,0) v  y     (0,1)
      //                 (1,2)
      geo.faceVertexUvs[0].push([
        new THREE.Vector2(0.0, 1.0),
        new THREE.Vector2(1.0, 1.0),
        new THREE.Vector2(0.0, 0.0),
      ]);
      geo.faceVertexUvs[0].push([
        new THREE.Vector2(1.0, 0.0),
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(1.0, 1.0),
      ]);
      let normal;
      THREE.Triangle.getNormal(v0, v1, v2, normal);


      // eslint-disable-next-line
      geo.faces.push(new THREE.Face3(0, 1, 2, normal));
      // eslint-disable-next-line
      geo.faces.push(new THREE.Face3(3, 2, 1, normal));

      const matTex2d = new MaterialTex2d();
      this.m_material[i] = matTex2d;
      const xDim = this.m_objGraphics2d.m_volumeHeader.m_pixelWidth;
      const yDim = this.m_objGraphics2d.m_volumeHeader.m_pixelHeight;
      const zDim = this.m_objGraphics2d.m_volumeHeader.m_pixelDepth;

      // get dim for current slice (one between X, Y or Z) and slice index, based on ratio
      let dim = xDim;
      dim = (i === PROJECTION_Y) ? yDim : dim;
      dim = (i === PROJECTION_Z) ? zDim : dim;
      const sliceIndex = Math.floor(this.m_sliceRatio[i] * dim);

      // console.log(`Create mat. vol ${xDim}*${yDim}*${zDim}. sliceIndex=${sliceIndex} `);
      const axisIndex = i; // X or Y or Z
      matTex2d.create(volTexture,
        xDim, yDim, zDim, axisIndex, sliceIndex, this.m_objGraphics2d.m_isRoiVolume);

      const mat = matTex2d.m_material;
      const mesh = new THREE.Mesh(geo, mat);
      this.m_scene.add(mesh);
    } // for (i)

    // add renderer to html container
    const container = this.m_container;
    container.append(this.m_renderer.domElement);

  } // create
  /**
  * Action when new file was completely loaded
  */
  onFileLoaded() {
    // TODO: init some UI for the new opened file
  }

  /**
  * Keyboard event handler
  * @param (number) keyCode - keyboard code
  */
  // eslint-disable-next-line
  onKeyDown(keyCode, isDebugMode) {
    // console.log(`keyCode = ${keyCode}`);
    // const KEY_CODE_UP = 38;
    // const KEY_CODE_DN = 40;
    // const KEY_CODE_MINUS = 109;
    if (isDebugMode) {
      const KEY_CODE_PLUS = 107;
      if (keyCode === KEY_CODE_PLUS) {
        const Z_DIM_APPROX = 100.0;
        const Z_SPEED = 1.0 / Z_DIM_APPROX;
        const TEX_COORD_MAX = 0.999;
        this.m_sliceRatio[PROJECTION_Z] += Z_SPEED;
        if (this.m_sliceRatio[PROJECTION_Z] >= TEX_COORD_MAX) {
          this.m_sliceRatio[PROJECTION_Z] = 0.0;
        }
      }
    }
  }

  /**
  * Action on each render
  */
  render() {
    // console.log('MprRender...');
    this.m_renderer.render(this.m_scene, this.m_camera);

    // TODO:
    // This is very stupid slices animation. Just to illustrate possibility
    // to control slice position in each projection separately
    //
    const xDim = this.m_objGraphics2d.m_volumeHeader.m_pixelWidth;
    const yDim = this.m_objGraphics2d.m_volumeHeader.m_pixelHeight;
    const zDim = this.m_objGraphics2d.m_volumeHeader.m_pixelDepth;

    // Next code is very test code. Should be replaced to slices ratio control
    // by external user interface

    // some artificial speed
    const X_SPEED = 0.0023;
    const Y_SPEED = 0.0016;
    const Z_SPEED = 0.001;
    // update slices positions. Slices ratio is inside [0..1]
    this.m_sliceRatio[PROJECTION_X] += X_SPEED;
    this.m_sliceRatio[PROJECTION_Y] += Y_SPEED;
    this.m_sliceRatio[PROJECTION_Z] += Z_SPEED;

    // const SOME_MAGIC_VAL = 0.97;
    // this.m_sliceRatio[PROJECTION_Z] = SOME_MAGIC_VAL;

    const TEX_COORD_MAX = 0.999;
    if (this.m_sliceRatio[PROJECTION_X] >= TEX_COORD_MAX) {
      this.m_sliceRatio[PROJECTION_X] = 0.0;
    }
    if (this.m_sliceRatio[PROJECTION_Y] >= TEX_COORD_MAX) {
      this.m_sliceRatio[PROJECTION_Y] = 0.0;
    }
    if (this.m_sliceRatio[PROJECTION_Z] >= TEX_COORD_MAX) {
      this.m_sliceRatio[PROJECTION_Z] = 0.0;
    }

    // get slice value in texture coordinates
    let x = Math.floor(this.m_sliceRatio[PROJECTION_X] * xDim);
    let y = Math.floor(this.m_sliceRatio[PROJECTION_Y] * yDim);
    let z = Math.floor(this.m_sliceRatio[PROJECTION_Z] * zDim);
    x = (x < xDim) ? x : (xDim - 1);
    y = (y < yDim) ? y : (yDim - 1);
    z = (z < zDim) ? z : (zDim - 1);

    this.m_material[PROJECTION_X].m_uniforms.sliceIndex.value = x;
    this.m_material[PROJECTION_Y].m_uniforms.sliceIndex.value = y;
    this.m_material[PROJECTION_Z].m_uniforms.sliceIndex.value = z;
  }
} // end of class MprRenderer
