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
import GlSelector from '../graphics3d/glselector';
import MaterialTex2d from '../gfx/mattex2d';
import MaterialColor2d from '../gfx/matcolor2d';
import Line2D from './line2d';

// Consts
/** Project index X */
const PROJECTION_X = 2;
/** Project index Y */
const PROJECTION_Y = 1;
/** Project index Z */
const PROJECTION_Z = 0;
const NUM_PROJECTIONS = 3;


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
    const R_MATERIAL_GREEN = 0.0;
    const G_MATERIAL_GREEN = 0.8125;
    const B_MATERIAL_GREEN = 0.0;
    this.m_materialLineGreen = new MaterialColor2d(R_MATERIAL_GREEN, G_MATERIAL_GREEN, B_MATERIAL_GREEN);
    const R_MATERIAL_BLUE = 0.0;
    const G_MATERIAL_BLUE = 0.8125;
    const B_MATERIAL_BLUE = 0.8125;
    this.m_materialLineBlue = new MaterialColor2d(R_MATERIAL_BLUE, G_MATERIAL_BLUE, B_MATERIAL_BLUE);
    // console.log(`MprRenderer create w*h = ${this.m_width} * ${this.m_height}`);
    this.m_linesXOnZ = null;
    this.m_linesYOnZ = null;
    this.m_linesXOnY = null;
    this.m_controlLineXOnY = null;
    this.m_linesYOnX = null;
    this.m_controlLineYOnX = null;
    this.m_runningState = false;
    this.m_activePlane = -1;
  }
  /**
  * Create WebGl renderer and connect to HTML container
  */
  create() {
    // this.m_renderer = new THREE.WebGLRenderer({ antialias: true });
    //this.canvas2d = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    //this.context = this.canvas2d.getContext('webgl2');
    //this.m_renderer = new THREE.WebGLRenderer({
    //  antialias: true, canvas: this.canvas2d,
    //  context: this.context
    //});
    const glSelector = new GlSelector();
    this.context = glSelector.createWebGLContext();
    this.isWebGL2 = glSelector.useWebGL2();
    this.canvas2d = glSelector.getCanvas();
    this.m_renderer = new THREE.WebGLRenderer({
      antialias: false, canvas: this.canvas2d,
      preserveDrawingBuffer: true, context: this.context
    });
    const width = this.m_width;
    const height = this.m_height;
    const camAspect = width / height;
    // prepare for render 2d lines on screen
    const yw = 1.0 / height;
    const TWICE = 2.0;
    this.m_vertLineWidth = TWICE * yw;
    this.m_horLineWidth = this.m_vertLineWidth * camAspect;
    const COLNTROL_SHIFT_MUL = 3;
    this.m_yControlShift = COLNTROL_SHIFT_MUL * this.m_horLineWidth;
    this.m_xControlShift = COLNTROL_SHIFT_MUL * this.m_vertLineWidth;
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

    this.m_geo = new Array(NUM_PROJECTIONS);
    this.m_geo[PROJECTION_X] = new THREE.Geometry();
    this.m_geo[PROJECTION_Y] = new THREE.Geometry();
    this.m_geo[PROJECTION_Z] = new THREE.Geometry();

    this.m_material = new Array(NUM_PROJECTIONS);
    this.m_material[PROJECTION_X] = null;
    this.m_material[PROJECTION_Y] = null;
    this.m_material[PROJECTION_Z] = null;

    this.m_meshes = new Array(NUM_PROJECTIONS);
    this.m_meshes.fill(undefined);

    /** Use m_sliceRatio for current projection level visualization. Should be in [0..1] */
    this.m_sliceRatio = new Array(NUM_PROJECTIONS);
    this.m_sliceRatio[PROJECTION_X] = 0.5;
    this.m_sliceRatio[PROJECTION_Y] = 0.5;
    this.m_sliceRatio[PROJECTION_Z] = 0.5;
    this.m_controlPoint = new Array(NUM_PROJECTIONS);
    this.m_controlPoint[PROJECTION_X] = { 'x': -1.0, 'y': 0.0 };
    this.m_controlPoint[PROJECTION_Y] = { 'x': 0.0,  'y': 0.0 };
    this.m_controlPoint[PROJECTION_Z] = { 'x': 1.0,  'y': 0.0 };

    this.m_projectionRect = new Array(NUM_PROJECTIONS);
    const NUM_BOUND_LINES = 6;
    this.m_boundLines = new Array(NUM_BOUND_LINES);
    this.m_boundLines.fill(undefined);
    // add renderer to html container
    const container = this.m_container;
    container.append(this.m_renderer.domElement);
  } // create

  clearScene() {
    for (let i = 0; i < this.m_boundLines.length; ++i) {
      if (this.m_boundLines[i] !== undefined) {
        this.m_scene.remove(this.m_boundLines[i].getRenderObject());
      }
    }
    for (let i = 0; i < this.m_meshes.length; ++i) {
      if (this.m_meshes[i] !== undefined) {
        this.m_scene.remove(this.m_meshes[i]);
      }
    }
    this.clearControlLines();

    this.m_geo[PROJECTION_X].dispose();
    this.m_geo[PROJECTION_Y].dispose();
    this.m_geo[PROJECTION_Z].dispose();
    this.m_geo[PROJECTION_X] = new THREE.Geometry();
    this.m_geo[PROJECTION_Y] = new THREE.Geometry();
    this.m_geo[PROJECTION_Z] = new THREE.Geometry();

    this.m_material[PROJECTION_X] = null;
    this.m_material[PROJECTION_Y] = null;
    this.m_material[PROJECTION_Z] = null;

    this.m_meshes.fill(undefined);
  }
  /**
  * Action when new file was completely loaded
  */
  onFileLoaded() {
    this.clearScene();
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
      // console.log(`Proportion is: ${wScreen} * ${hScreen}`);
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

      this.m_projectionRect[i] = {
        'xMin': XMin,
        'yMin': YMin,
        'xMax': XMax,
        'yMax': YMax,
      };

      // v2 ----- v3
      // |        |
      // |        |
      // v0 ----- v1
      const v0 = new THREE.Vector3(XMin, YMin, Z_COORD);
      const v1 = new THREE.Vector3(XMax, YMin, Z_COORD);
      const v2 = new THREE.Vector3(XMin, YMax, Z_COORD);
      const v3 = new THREE.Vector3(XMax, YMax, Z_COORD);
      const geo = this.m_geo[i];
      geo.vertices[0] = v0;
      geo.vertices[1] = v1;
      geo.vertices[2] = v2;
      geo.vertices[3] = v3;

      // add texture coordinates
      //
      //  (0,2) |        (1,0)
      //  (1,1) |
      //  ------+------> x
      //        |
      //        |
      //  (0,0) v  y     (0,1)
      //                 (1,2)
      geo.faceVertexUvs[0][0] = [
        new THREE.Vector2(0.0, 1.0),
        new THREE.Vector2(1.0, 1.0),
        new THREE.Vector2(0.0, 0.0),
      ];
      geo.faceVertexUvs[0][1] = [
        new THREE.Vector2(1.0, 0.0),
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(1.0, 1.0),
      ];
      const normal = new THREE.Vector3();
      THREE.Triangle.getNormal(v0, v1, v2, normal);


      // eslint-disable-next-line
      geo.faces[0] = new THREE.Face3(0, 1, 2, normal);
      // eslint-disable-next-line
      geo.faces[1] = new THREE.Face3(3, 2, 1, normal);

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
      // eslint-disable-next-line
      const axisIndex = 2 - i; // inside matTex2d.create it should be X - 0 or Y - 1 or Z - 2
      matTex2d.create(volTexture,
        xDim, yDim, zDim, axisIndex, sliceIndex, this.m_objGraphics2d.m_isRoiVolume);

      const mat = matTex2d.m_material;
      this.m_meshes[i] = new THREE.Mesh(geo, mat);
      this.m_scene.add(this.m_meshes[i]);
    } // for (i)

    // draw bounding lines
    const R_MATERIAL = 0.86;
    const G_MATERIAL = 0.59;
    const B_MATERIAL = 0.17;
    const mat = new MaterialColor2d(R_MATERIAL, G_MATERIAL, B_MATERIAL);
    const minCoord = -1 + this.m_vertLineWidth;
    const maxCoord = 1 - this.m_vertLineWidth;
    const halfLineWidth = this.m_vertLineWidth * 0.5;
    this.m_boundLines[0] = new Line2D(this.m_scene, this.m_horLineWidth, minCoord, maxCoord, maxCoord, maxCoord, mat);
    this.m_boundLines[1] = new Line2D(this.m_scene, this.m_vertLineWidth, maxCoord, maxCoord, maxCoord, minCoord, mat);
    this.m_boundLines[2] = new Line2D(this.m_scene, this.m_horLineWidth, maxCoord, minCoord, minCoord, minCoord, mat);
    this.m_boundLines[3] = new Line2D(this.m_scene, this.m_vertLineWidth, minCoord, minCoord, minCoord, maxCoord, mat);
    this.m_boundLines[4] = new Line2D(this.m_scene, this.m_vertLineWidth, this.m_projectionRect[0].xMax - halfLineWidth,
      minCoord, this.m_projectionRect[0].xMax - halfLineWidth, maxCoord, mat);
    this.m_boundLines[5] = new Line2D(this.m_scene, this.m_vertLineWidth, this.m_projectionRect[1].xMax - halfLineWidth,
      minCoord, this.m_projectionRect[1].xMax - halfLineWidth, maxCoord, mat);

    this.m_sliceRatio[PROJECTION_X] = 0.5;
    this.m_sliceRatio[PROJECTION_Y] = 0.5;
    this.m_sliceRatio[PROJECTION_Z] = 0.5;

    this.updateControlLines();
  }

  clearControlLines() {
    if (this.m_linesXOnZ !== null) {
      this.m_scene.remove(this.m_linesXOnZ[0].getRenderObject());
      this.m_scene.remove(this.m_linesXOnZ[1].getRenderObject());
    }
    if (this.m_linesYOnZ !== null) {
      this.m_scene.remove(this.m_linesYOnZ[0].getRenderObject());
      this.m_scene.remove(this.m_linesYOnZ[1].getRenderObject());
    }
    if (this.m_linesXOnY !== null) {
      this.m_scene.remove(this.m_linesXOnY[0].getRenderObject());
      this.m_scene.remove(this.m_linesXOnY[1].getRenderObject());
    }
    if (this.m_linesYOnX !== null) {
      this.m_scene.remove(this.m_linesYOnX[0].getRenderObject());
      this.m_scene.remove(this.m_linesYOnX[1].getRenderObject());
    }
    if (this.m_controlLineXOnY !== null) {
      this.m_scene.remove(this.m_controlLineXOnY.getRenderObject());
    }
    if (this.m_controlLineYOnX !== null) {
      this.m_scene.remove(this.m_controlLineYOnX.getRenderObject());
    }
  }

  updateControlLines() {
    this.clearControlLines();
    const SHIFT_MUL = 7;
    const horShift = SHIFT_MUL * this.m_vertLineWidth; // this is correct, not a typo or mis-anything
    const vertShift = SHIFT_MUL * this.m_horLineWidth;

    // lines on Z
    const xCenterOnZ = this.m_projectionRect[PROJECTION_Z].xMin + this.m_sliceRatio[PROJECTION_X] *
      (this.m_projectionRect[PROJECTION_Z].xMax - this.m_projectionRect[PROJECTION_Z].xMin);
    const yCenterOnZ = this.m_projectionRect[PROJECTION_Z].yMin + this.m_sliceRatio[PROJECTION_Y] *
      (this.m_projectionRect[PROJECTION_Z].yMax - this.m_projectionRect[PROJECTION_Z].yMin);
    // blue X projection line on Z projection
    this.m_linesXOnZ = [new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnZ,
      this.m_projectionRect[PROJECTION_Z].yMax, xCenterOnZ, yCenterOnZ + vertShift, this.m_materialLineBlue),
    new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnZ, yCenterOnZ - vertShift, xCenterOnZ,
      this.m_projectionRect[PROJECTION_Z].yMin, this.m_materialLineBlue)];
    // green Y projection line on Z projection
    this.m_linesYOnZ = [new Line2D(this.m_scene, this.m_horLineWidth, this.m_projectionRect[PROJECTION_Z].xMin,
      yCenterOnZ, xCenterOnZ - horShift, yCenterOnZ, this.m_materialLineGreen),
    new Line2D(this.m_scene, this.m_horLineWidth, xCenterOnZ + horShift, yCenterOnZ,
      this.m_projectionRect[PROJECTION_Z].xMax, yCenterOnZ, this.m_materialLineGreen)];
    this.m_controlPoint[PROJECTION_Z].x = xCenterOnZ;
    this.m_controlPoint[PROJECTION_Z].y = yCenterOnZ;

    // lines on Y
    const xCenterOnY = this.m_projectionRect[PROJECTION_Y].xMin + this.m_sliceRatio[PROJECTION_X] *
      (this.m_projectionRect[PROJECTION_Y].xMax - this.m_projectionRect[PROJECTION_Y].xMin);
    const yCenterOnY = this.m_projectionRect[PROJECTION_Y].yMin + this.m_sliceRatio[PROJECTION_Z] *
      (this.m_projectionRect[PROJECTION_Y].yMax - this.m_projectionRect[PROJECTION_Y].yMin);
    // blue X projection line on Y projection
    this.m_linesXOnY = [new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnY,
      this.m_projectionRect[PROJECTION_Y].yMax, xCenterOnY, yCenterOnY + vertShift, this.m_materialLineBlue),
    new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnY, yCenterOnY - vertShift, xCenterOnY,
      this.m_projectionRect[PROJECTION_Y].yMin, this.m_materialLineBlue)];
    this.m_controlLineXOnY = new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnY,
      yCenterOnY + this.m_yControlShift, xCenterOnY, yCenterOnY - this.m_yControlShift, this.m_materialLineBlue);
    this.m_controlPoint[PROJECTION_Y].x = xCenterOnY;
    this.m_controlPoint[PROJECTION_Y].y = yCenterOnY;

    // lines on X
    const xCenterOnX = this.m_projectionRect[PROJECTION_X].xMin + this.m_sliceRatio[PROJECTION_Y] *
      (this.m_projectionRect[PROJECTION_X].xMax - this.m_projectionRect[PROJECTION_X].xMin);
    const yCenterOnX = this.m_projectionRect[PROJECTION_X].yMin + this.m_sliceRatio[PROJECTION_Z] *
      (this.m_projectionRect[PROJECTION_X].yMax - this.m_projectionRect[PROJECTION_X].yMin);
    // green Y projection line on X projection
    this.m_linesYOnX = [new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnX,
      this.m_projectionRect[PROJECTION_X].yMax, xCenterOnX, yCenterOnX + vertShift, this.m_materialLineGreen),
    new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnX, yCenterOnX - vertShift, xCenterOnX,
      this.m_projectionRect[PROJECTION_X].yMin, this.m_materialLineGreen)];
    this.m_controlLineYOnX = new Line2D(this.m_scene, this.m_vertLineWidth, xCenterOnX,
      yCenterOnX - this.m_yControlShift, xCenterOnX, yCenterOnX + this.m_yControlShift, this.m_materialLineGreen);
    this.m_controlPoint[PROJECTION_X].x = xCenterOnX;
    this.m_controlPoint[PROJECTION_X].y = yCenterOnX;
  }
  /**
  * Keyboard event handler
  */
  // eslint-disable-next-line
  onKeyDown() {
  }
  /**
   * Mouse events handler
   * xScr, yScr in [0..1] is normalized mouse coordinate in screen
   */
  onMouseDown(xScr, yScr) {
    if ((this.m_objGraphics2d.m_volumeData === null) || (this.m_objGraphics2d.m_volumeHeader === null)) {
      return;
    }
    const TWICE = 2.0;
    const xt = xScr * TWICE - 1.0;
    const yt = (1.0 - yScr) * TWICE - 1.0;

    for (let i = 0; i < NUM_PROJECTIONS; ++i) {
      if (this.m_projectionRect[i].xMin <= xt && xt <= this.m_projectionRect[i].xMax) { // is in i-th projection
        if (this.m_projectionRect[i].yMin <= yt && yt <= this.m_projectionRect[i].yMax) { // is in i-th projection rect
          if (this.m_controlPoint[i].y - this.m_yControlShift <= yt &&
            yt <= this.m_controlPoint[i].y + this.m_yControlShift) { // is near control point for vertical lines
            if (i === PROJECTION_Z) { // for z projection (has horizontal line)
              if (this.m_controlPoint[i].x - this.m_xControlShift <= xt &&
                xt <= this.m_controlPoint[i].x + this.m_xControlShift) { // is near control point for horizontal line
                this.m_runningState = true;
                this.m_activePlane = i;
              } else {
                return;
              }
            } else { // for x and y projections
              this.m_runningState = true;
              this.m_activePlane = i;
            }
          } else {
            return;
          }
        } else {
          return;
        }
      }
    }
  }


  /**
   * Mouse events handler
   */
  onMouseUp() {
    this.m_runningState = false;
    this.m_activePlane = -1;
  }


  /**
   * Mouse move event handler
   * @param (float) xScr - normalized mouse x coordinate in screen
   * @param (float) yScr - normalized mouse y coordinate in screen
   */
  onMouseMove(xScr, yScr) {
    if ((this.m_objGraphics2d.m_volumeData === null) || (this.m_objGraphics2d.m_volumeHeader === null)) {
      return;
    }
    if (this.m_runningState === false) {
      return;
    }
    const TWICE = 2.0;
    const xt = xScr * TWICE - 1.0;
    const yt = (1.0 - yScr) * TWICE - 1.0;

    const activeRect = this.m_projectionRect[this.m_activePlane];
    if (activeRect.xMin <= xt && xt <= activeRect.xMax && activeRect.yMin <= yt && yt <= activeRect.yMax) {
      const xRatio = (xt - activeRect.xMin) / (activeRect.xMax - activeRect.xMin);
      const yRatio = (yt - activeRect.yMin) / (activeRect.yMax - activeRect.yMin);
      switch (this.m_activePlane) {
        case PROJECTION_X:
          this.m_sliceRatio[PROJECTION_Y] = xRatio;
          this.m_sliceRatio[PROJECTION_Z] = yRatio;
          break;
        case PROJECTION_Y:
          this.m_sliceRatio[PROJECTION_X] = xRatio;
          this.m_sliceRatio[PROJECTION_Z] = yRatio;
          break;
        case PROJECTION_Z:
          this.m_sliceRatio[PROJECTION_X] = xRatio;
          this.m_sliceRatio[PROJECTION_Y] = yRatio;
          break;
        default:
          console.log('MPR: Unexpected active plane');
          break;
      }
      this.updateControlLines();
    }
  }

  /**
  * Action on each render
  */
  render() {
    // console.log('MprRender...');
    this.m_renderer.render(this.m_scene, this.m_camera);

    const xDim = this.m_objGraphics2d.m_volumeHeader.m_pixelWidth;
    const yDim = this.m_objGraphics2d.m_volumeHeader.m_pixelHeight;
    const zDim = this.m_objGraphics2d.m_volumeHeader.m_pixelDepth;

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
