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
* 2d simplest graphics engine
* @module app/scripts/graphics2d/graphics2d
*/

import THREE from 'n3d-threejs';
import MaterialTex2d from '../gfx/mattex2d';
import MaterialColor2d from '../gfx/matcolor2d';
import MeshText2D from './meshtext2d';
import Line2D from './line2d';
import DistanceTool from './distancetool';
import AngleTool from './angletool';
import AreaTool from './areatool';
import RectTool from './recttool';
import PickTool from './picktool';
import ContrastBrightnessTool from './contrastbrightnesstool';
import FilterTool from './filtertool';

/**  @constant {number} SCENE_3D_BACKGROUND_COLOR - backgroudn color for 3d window */
const SCENE_2D_BACKGROUND_COLOR = 0xbbbbff; // 0x00

/** Possible 2d tools */
const tools2d = {
  INTENSITY: 'intensity',
  DISTANCE: 'distance',
  ANGLE: 'angle',
  AREA: 'area',
  RECT: 'rect',
  GRAD: 'grad',
  COBR: 'cobr',
  BIFI: 'bifi',
  SAVE: 'save'
};

/** Class Graphics2d is used for simple debug style 2d render */
export default class Graphics2d {

  /**
  * Initialize render
  * @param (object) container - object container for 3d rendering
  * @param (int) width - 2d canvas width
  * @param (int) height - 2d canvas height
  * @return {Object} Intsance of this class (singleton)
  */
  constructor(container, width, height) {
    this.m_width = width;
    this.m_height = height;
    this.m_material = null;
    console.log(`Graphics2d create size = ${width} * ${height}`);

    //! Volume data
    this.m_volumeHeader = null;
    this.m_volumeData = null;
    this.m_volumeBox = null;
    this.m_volumeInfo = null;
    //! slice level
    this.m_sliderPosition = 0.5;
    //! Slice axis
    this.m_sliceAxis = Graphics2d.SLICE_AXIS_Z;

    this.m_renderer = new THREE.WebGLRenderer({ antialias: true });
    // this.m_renderer.pixelStorei(this.m_renderer.UPACK_ALIGNMENT, 1);

    const camAspect = width / height;
    // eslint-disable-next-line
    this.m_camera = new THREE.PerspectiveCamera(90, camAspect, 0.01, 100);
    // use "high enough" camera position to prevent clipping during 2d rendering
    this.m_camera.position.z = 3.0;
    this.m_renderer.setClearColor(SCENE_2D_BACKGROUND_COLOR);
    this.m_renderer.setSize(width, height);

    this.m_scene = new THREE.Scene();

    // create quad geometry
    this.m_geometry = new THREE.Geometry();
    // v2 ----- v3
    // |        |
    // |        |
    // v0 ----- v1
    const VPORT_SIZE = 1.0;
    const Z_COORD = 0.8;
    const v0 = new THREE.Vector3(-VPORT_SIZE, -VPORT_SIZE, Z_COORD);
    const v1 = new THREE.Vector3(+VPORT_SIZE, -VPORT_SIZE, Z_COORD);
    const v2 = new THREE.Vector3(-VPORT_SIZE, +VPORT_SIZE, Z_COORD);
    const v3 = new THREE.Vector3(+VPORT_SIZE, +VPORT_SIZE, Z_COORD);

    this.m_geometry.vertices.push(v0);
    this.m_geometry.vertices.push(v1);
    this.m_geometry.vertices.push(v2);
    this.m_geometry.vertices.push(v3);

    // add texture coordinates
    //
    //  (0,2) |        (1,0)
    //  (1,1) |
    //  ------+------> x
    //        |
    //        |
    //  (0,0) v  y     (0,1)
    //                 (1,2)
    this.m_geometry.faceVertexUvs[0].push([
      new THREE.Vector2(0.0, 1.0),
      new THREE.Vector2(1.0, 1.0),
      new THREE.Vector2(0.0, 0.0),
    ]);
    this.m_geometry.faceVertexUvs[0].push([
      new THREE.Vector2(1.0, 0.0),
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(1.0, 1.0),
    ]);

    const triangle = new THREE.Triangle(v0, v1, v2);
    const normal = triangle.normal();

    // eslint-disable-next-line
    this.m_geometry.faces.push(new THREE.Face3(0, 1, 2, normal));
    // eslint-disable-next-line
    this.m_geometry.faces.push(new THREE.Face3(3, 2, 1, normal));

    if (this.m_volumeData !== null) {
      this.createTileMaps();
    } // create tex map

    this.m_matIndex = -1;
    this.m_tileIndex = -1;
    this.m_yTileIndex = -1;
    this.m_xTileIndex = -1;

    this.m_dataTextures = [];
    this.m_materialsTex2d = null;
    this.m_material = null;
    // this.m_materials = [];
    // this.m_pixBuffers = [];

    this.m_volTexture = null;
    this.m_isRoiVolume = false;

    this.m_showTileTexture = false;

    // render text
    // console.log('Graphics2D: before create text');
    // this.m_text = new MeshText2D('Hello, triangle');
    // this.m_text.updateText(-0.99, +0.99, 0.5, 'rgba(0, 150, 0, 255)', 'rgba(255, 0, 0, 255)');
    // this.m_scene.add(this.m_text);

    // prepare for render 2d lines on screen
    const xw = 1.0 / width;
    const yw = 1.0 / height;
    const TWICE = 2.0;
    this.m_lineWidth = TWICE * ((xw > yw) ? xw : yw);

    // 2d lines set
    this.m_linesHor = [];
    this.m_linesVer = [];

    this.m_textTime = -1000;
    this.m_text = null;

    this.m_toolType = tools2d.INTENSITY;
    this.m_distanceTool = new DistanceTool(this.m_scene, this.m_lineWidth);
    this.m_angleTool = new AngleTool(this.m_scene, this.m_lineWidth);
    this.m_areaTool = new AreaTool(this.m_scene, this.m_lineWidth);
    this.m_rectTool = new RectTool(this.m_scene, this.m_lineWidth);
    this.m_pickTool = new PickTool(this.m_scene);
    //this.m_gradTool = new GradTool();
    this.m_contrastBrightTool = new ContrastBrightnessTool();
    this.m_filterTool = new FilterTool();

    if (container.length === 1) {
      // console.log(`container size = ${root3dContainer.offsetWidth} * ${root3dContainer.offsetHeight}`);
      container.append(this.m_renderer.domElement);
    } else {
      console.log('containter with id=med3web-container-2d not found in scene');
    }
    /** Ready counter */
    this.m_readyCounter = 0;
    this.volumeUpdater = null;
  } // end of constructor

  /** Is scene loaded */
  isLoaded() {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return false;
    }
    const NUM_READY_COUNTERS = 1;
    const isLoaded = (this.m_readyCounter >= NUM_READY_COUNTERS);
    return isLoaded;
  }

  set2dToolType(toolType) {
    this.m_toolType = toolType;
    if (toolType === tools2d.SAVE) {
      const SCALE_CONSTANT = 2;
      const sigmaValue = this.m_materialsTex2d.m_uniforms.sigma.value;
      const contrastValue = this.m_materialsTex2d.m_uniforms.contrast.value;
      const brightnessValue = this.m_materialsTex2d.m_uniforms.brightness.value;
      this.volumeUpdater.updateVolumeTexture(sigmaValue * SCALE_CONSTANT, contrastValue, brightnessValue);
      /*this.m_contrastBrightTool.clear();
      this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
      this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
      this.m_materialsTex2d.m_uniforms.flag.value = false;
      this.m_filterTool.clear();
      this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;*/
      //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
    }
  }

  /**
   * Callback on file loaded
   */
  onFileLoaded() {
    this.m_distanceTool.clearLines();
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_pickTool.clear();
    //this.m_gradTool.clear();
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    this.m_contrastBrightTool.clear();
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_filterTool.clear();
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
  }

  clear2DTools() {
    this.m_distanceTool.clearLines();
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_pickTool.clear();
    //this.m_gradTool.clear();
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    this.m_contrastBrightTool.clear();
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_filterTool.clear();
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
  }

  /**
  * Keyboard event handler
  * @param (number) keyCode - keyboard code
  */
  onKeyDown(keyCode) {
    const KEY_CODE_F = 70;
    if (keyCode === KEY_CODE_F) {
      // show 3d texture full
      // console.log(`Show flat texture in 2d ${keyCode}`);
      this.m_showTileTexture = !this.m_showTileTexture;
      const maxTex2d = this.m_materialsTex2d;
      if (maxTex2d !== null) {
        maxTex2d.m_uniforms.showAll.value = this.m_showTileTexture;
      } // if have material/shader
    } // if pressed 'F' key
  }

  /**
  * Mouse events handler
  * xScr, yScr in [0..1] is normalized mouse coordinate in screen
  */
  onMouseDown(xScr, yScr) {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return;
    }
    if ((xScr > this.m_wProjScreen) || (yScr > this.m_hProjScreen)) {
      // out of image
      return;
    }
    const TWICE = 2.0;
    const xt = xScr * TWICE - 1.0;
    const yt = (1.0 - yScr) * TWICE - 1.0;

    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        this.m_pickTool.onMouseDown(xScr, yScr, this.m_sliceAxis, this.m_sliderPosition);
        break;
      case tools2d.DISTANCE:
        this.m_distanceTool.onMouseDown(xt, yt);
        break;
      case tools2d.ANGLE:
        this.m_angleTool.onMouseDown(xt, yt);
        break;
      case tools2d.AREA:
        this.m_areaTool.onMouseDown(xt, yt);
        break;
      case tools2d.RECT:
        this.m_rectTool.onMouseDown(xt, yt);
        break;
      case tools2d.GRAD:
        break;
      case tools2d.COBR:
        /*this.m_contrastBrightTool.onMouseDown(xt, yt);
        this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
        this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
        this.m_materialsTex2d.m_uniforms.COBRflag.value = this.m_contrastBrightTool.m_COBRflag;*/
        break;
      case tools2d.BIFI:
        /*this.m_filterTool.onMouseDown(xt, yt);
        this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
        this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
        this.m_materialsTex2d.m_uniforms.BIFIflag.value = this.m_filterTool.m_BIFIflag;*/
        break;
      case tools2d.SAVE:
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }

  /**
   * Mouse move event handler
   * @param (float) xScr - normalized mouse x coordinate in screen
   * @param (float) yScr - normalized mouse y coordinate in screen
   */
  onMouseMove(xScr, yScr) {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return;
    }
    if ((xScr > this.m_wProjScreen) || (yScr > this.m_hProjScreen)) {
      // out of image
      return;
    }
    const TWICE = 2.0;
    const xt = xScr * TWICE - 1.0;
    const yt = (1.0 - yScr) * TWICE - 1.0;

    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        break;
      case tools2d.DISTANCE:
        this.m_distanceTool.onMouseMove(xt, yt);
        break;
      case tools2d.ANGLE:
        this.m_angleTool.onMouseMove(xt, yt);
        break;
      case tools2d.AREA:
        this.m_areaTool.onMouseMove(xt, yt);
        break;
      case tools2d.RECT:
        this.m_rectTool.onMouseMove(xt, yt);
        break;
      case tools2d.GRAD:
        break;
      case tools2d.COBR:
        /*this.m_contrastBrightTool.onMouseMove(xt, yt);
        this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
        this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
        this.m_materialsTex2d.m_uniforms.COBRflag.value = this.m_contrastBrightTool.m_COBRflag;*/
        break;
      case tools2d.BIFI:
        /*this.m_filterTool.onMouseMove(xt, yt);
        this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
        this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
        this.m_materialsTex2d.m_uniforms.BIFIflag.value = this.m_filterTool.m_BIFIflag;*/
        break;
      case tools2d.SAVE:
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }
  updateContrastFromSliders(value) {
    this.m_materialsTex2d.m_uniforms.contrast.value = parseFloat(value[0]);
    this.m_materialsTex2d.m_uniforms.flag.value = true;
  }
  updateBrightnessFromSliders(value) {
    this.m_materialsTex2d.m_uniforms.brightness.value = parseFloat(value[0]);
    this.m_materialsTex2d.m_uniforms.flag.value = true;
  }
  updateFilterFromSliders(value) {
    const SCALE_VALUE = 2;
    const NON_ZERO_FILTER = 0.01;
    this.m_materialsTex2d.m_uniforms.sigma.value = (parseFloat(value[0]) / SCALE_VALUE) + NON_ZERO_FILTER;
    this.m_materialsTex2d.m_uniforms.flag.value = true;
  }
  /**
   * Mouse move event handler
   * @param (float) xScr - normalized mouse x coordinate in screen
   * @param (float) yScr - normalized mouse y coordinate in screen
   */
  /*onMouseWheel(wheelDeltaX, wheelDeltaY) {
    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        break;
      case tools2d.DISTANCE:
        break;
      case tools2d.ANGLE:
        break;
      case tools2d.AREA:
        break;
      case tools2d.RECT:
        break;
      case tools2d.GRAD:
        //this.m_gradTool.onMouseWheel(wheelDeltaX, wheelDeltaY);
        //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
        break;
      case tools2d.COBR:
        break;
      case tools2d.BIFI:
        this.m_filterTool.onMouseWheel(wheelDeltaX, wheelDeltaY);
        this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
        this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
        this.m_materialsTex2d.m_uniforms.BIFIflag.value = this.m_filterTool.m_BIFIflag;
        break;
      case tools2d.SAVE:
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }*/

  updateText() {
    this.m_pickTool.update();
  }
  static shortenString(str) {
    const MAX_ITEM_LEN = 20;
    const SHORT_ITEM_PART = 5;
    let strRet = str;
    const pnl = str.length;
    if (pnl > MAX_ITEM_LEN) {
      const strBegin = str.substring(0, SHORT_ITEM_PART + 1);
      const strEnd = str.substring(pnl - SHORT_ITEM_PART, pnl);
      strRet = `${strBegin}...${strEnd}`;
    }
    return strRet;
  }

  /**
  * Create specual lines and text about volume features, like:
  * orientation, 10 cm scale, patient name, patient gender, etc
  */
  createMarkLinesAndText() {
    let xPixPerMeter;
    let yPixPerMeter;
    let strMarkTextXMin = '';
    let strMarkTextXMax = '';
    let strMarkTextYMin = '';
    let strMarkTextYMax = '';

    const HALF = 0.5;
    const TWICE = 2.0;

    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      xPixPerMeter = TWICE * this.m_wProjScreen / this.m_volumeBox.x;
      yPixPerMeter = TWICE * this.m_hProjScreen / this.m_volumeBox.y;
      // console.log(`2d lines. Volume box = ${this.m_volumeBox.x} * ${this.m_volumeBox.y} * ${this.m_volumeBox.z}`);
      // console.log(`2d lines. Proj screen = ${this.m_wProjScreen} * ${this.m_hProjScreen}`);
      strMarkTextXMin = 'R';
      strMarkTextXMax = 'L';
      strMarkTextYMin = 'A';
      strMarkTextYMax = 'P';
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      xPixPerMeter = TWICE * this.m_wProjScreen / this.m_volumeBox.x;
      yPixPerMeter = TWICE * this.m_hProjScreen / this.m_volumeBox.z;
      strMarkTextXMin = 'R';
      strMarkTextXMax = 'L';
      strMarkTextYMin = 'H';
      strMarkTextYMax = 'F';
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      xPixPerMeter = TWICE * this.m_wProjScreen / this.m_volumeBox.y;
      yPixPerMeter = TWICE * this.m_hProjScreen / this.m_volumeBox.z;
      strMarkTextXMin = 'A';
      strMarkTextXMax = 'P';
      strMarkTextYMin = 'H';
      strMarkTextYMax = 'F';
    }
    const LINE_LEN = 100.0;
    const wLineLen = LINE_LEN * xPixPerMeter;
    const hLineLen = LINE_LEN * yPixPerMeter;
    // console.log(`Marks 2d size. wLineLen = ${wLineLen}, hLineLen = ${hLineLen}`);

    const GAP_SCREEN_BORDER = 0.04;
    const R_MARK = 0.9;
    const G_MARK = 0.4;
    const B_MARK = 0.4;
    const MARK_SHORT = 0.02;
    const MARK_LONG = 0.03;

    // Remove old lines from scene (if present)
    const numHLines = this.m_linesHor.length;
    // console.log(`Remove ${numHLines} 2d lines`);
    for (let i = 0; i < numHLines; i++) {
      this.m_scene.remove(this.m_linesHor[i].getRenderObject());
    }
    const numVLines = this.m_linesVer.length;
    for (let i = 0; i < numVLines; i++) {
      this.m_scene.remove(this.m_linesVer[i].getRenderObject());
    }

    // Create lines material (shared between all 2d lines)
    if (this.m_linesMaterial === undefined) {
      this.m_linesMaterial = new MaterialColor2d(R_MARK, G_MARK, B_MARK);
    }
    // console.log(`ProjScreen = ${this.m_wProjScreen} * ${this.m_hProjScreen}`);
    const xPrjCenter = -1.0 + (this.m_wProjScreen * HALF) * TWICE;
    const yPrjCenter = +1.0 - (this.m_hProjScreen * HALF) * TWICE;
    const xPrjRight = -1.0 + this.m_wProjScreen * TWICE;

    const yLineLow = (+1.0 - this.m_hProjScreen * TWICE) + GAP_SCREEN_BORDER;
    const xs = xPrjCenter - wLineLen * HALF;
    const xe = xPrjCenter + wLineLen * HALF;
    const wLine = new Line2D(this.m_scene,
      this.m_lineWidth,
      xs, yLineLow, xe, yLineLow,
      this.m_linesMaterial);
    this.m_linesHor.push(wLine);
    const MARK_LEN = 10;
    for (let i = 0; i <= MARK_LEN; i++) {
      const xMark = xs + (xe - xs) * i / MARK_LEN;
      // eslint-disable-next-line
      const yAdd = ((i === 0) || (i === 5) || (i === 10)) ? MARK_LONG : MARK_SHORT;
      const horMarkLine = new Line2D(this.m_scene,
        this.m_lineWidth,
        xMark, yLineLow + yAdd, xMark, yLineLow,
        this.m_linesMaterial);
      this.m_linesHor.push(horMarkLine);
    }

    const xLineLeft = -1.0 + GAP_SCREEN_BORDER;
    const ys = yPrjCenter - hLineLen * HALF;
    const ye = yPrjCenter + hLineLen * HALF;
    const hLine = new Line2D(this.m_scene,
      this.m_lineWidth,
      xLineLeft, ys, xLineLeft, ye,
      this.m_linesMaterial);
    this.m_linesVer.push(hLine);

    for (let i = 0; i <= MARK_LEN; i++) {
      const yMark = ys + (ye - ys) * i / MARK_LEN;
      // eslint-disable-next-line
      const xAdd = ((i === 0) || (i === 5) || (i === 10)) ? MARK_LONG : MARK_SHORT;
      const verMarkLine = new Line2D(this.m_scene,
        this.m_lineWidth,
        xLineLeft, yMark, xLineLeft + xAdd, yMark,
        this.m_linesMaterial);
      this.m_linesVer.push(verMarkLine);
    }

    // Remove mark text
    if (this.m_markTextXMin !== undefined) {
      this.m_scene.remove(this.m_markTextXMin);
      this.m_scene.remove(this.m_markTextXMax);
      this.m_scene.remove(this.m_markTextYMin);
      this.m_scene.remove(this.m_markTextYMax);
    }

    this.m_markTextXMin = new MeshText2D(strMarkTextXMin);
    this.m_markTextXMax = new MeshText2D(strMarkTextXMax);
    this.m_markTextYMin = new MeshText2D(strMarkTextYMin);
    this.m_markTextYMax = new MeshText2D(strMarkTextYMax);

    const TEXT_MARK_HEIGHT = 0.04;
    const TEXT_MARK_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0)';
    const TEXT_MARK_COLOR = 'rgba(240, 20, 20, 255)';
    this.m_markTextXMin.updateText(xLineLeft + MARK_LONG, yPrjCenter, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_CENTER,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR);
    this.m_markTextXMax.updateText(xPrjRight - MARK_LONG, yPrjCenter, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_CENTER,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR);
    this.m_markTextYMin.updateText(xPrjCenter, 1.0 - MARK_LONG, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_TOP,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR);
    this.m_markTextYMax.updateText(xPrjCenter, yLineLow + MARK_LONG, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_BOTTOM,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR);

    this.m_scene.add(this.m_markTextXMin);
    this.m_scene.add(this.m_markTextXMax);
    this.m_scene.add(this.m_markTextYMin);
    this.m_scene.add(this.m_markTextYMax);

    // Remove centimeters text
    if (this.m_cmTextHor !== undefined) {
      this.m_scene.remove(this.m_cmTextHor);
      this.m_scene.remove(this.m_cmTextVer);
    }
    this.m_cmTextHor = new MeshText2D('10 cm');
    this.m_cmTextVer = new MeshText2D('10 cm');
    const MARK_CM_TEXT_HEIGHT = 0.03;
    this.m_cmTextHor.updateText(xe + MARK_LONG, yLineLow, MARK_CM_TEXT_HEIGHT,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_BOTTOM,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR);
    this.m_cmTextVer.updateText(xLineLeft, ys - MARK_LONG, MARK_CM_TEXT_HEIGHT,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR);
    this.m_scene.add(this.m_cmTextHor);
    this.m_scene.add(this.m_cmTextVer);

    // remove old info
    if (this.m_infoText11 !== undefined) {
      this.m_scene.remove(this.m_infoText11);
      this.m_scene.remove(this.m_infoText12);
      this.m_scene.remove(this.m_infoText13);
      this.m_scene.remove(this.m_infoText21);
      this.m_scene.remove(this.m_infoText22);
      this.m_scene.remove(this.m_infoText23);
    }
    // add volume info
    if (this.m_volumeInfo !== null) {
      const INFO_TEXT_HEIGHT = 0.04;
      // completely transparent background for text
      const INFO_TEXT_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0)';
      const INFO_TEXT_COLOR = 'rgba(255, 255, 64, 255)';

      let pn = this.m_volumeInfo.m_patientName;
      const pg = this.m_volumeInfo.m_patientGender;
      const pdb = this.m_volumeInfo.m_patientDateOfBirth;
      const sd = this.m_volumeInfo.m_studyDate;
      const at = this.m_volumeInfo.m_acquisionTime;

      // shorten pn (patient name)
      pn = Graphics2d.shortenString(pn);

      // 1st row info text
      let strNameGenderDatebirth = pn;
      if (pg.length > 1) {
        if (strNameGenderDatebirth.length > 1) {
          strNameGenderDatebirth = `${strNameGenderDatebirth}, ${pg}`;
        } else {
          strNameGenderDatebirth = pg;
        }
      }
      if (pdb.length > 1) {
        if (strNameGenderDatebirth.length > 1) {
          strNameGenderDatebirth = `${strNameGenderDatebirth}, ${pdb}`;
        } else {
          strNameGenderDatebirth = pdb;
        }
      }
      strNameGenderDatebirth = (strNameGenderDatebirth.length < 1) ? ' ' : strNameGenderDatebirth;
      // 2nd row info text
      let strDateTimeAcq = sd;
      if (at.length > 1) {
        if (strDateTimeAcq.length > 1) {
          strDateTimeAcq = `${strDateTimeAcq}, ${at}`;
        } else {
          strDateTimeAcq = at;
        }
      }
      strDateTimeAcq = (strDateTimeAcq.length < 1) ? ' ' : strDateTimeAcq;
      // 3rd row info text
      let strPid = this.m_volumeInfo.m_patientId;
      strPid = (strPid.length < 1) ? ' ' : strPid;

      // shorten pid if too large
      strPid = Graphics2d.shortenString(strPid);

      let yLine = 1.0 - MARK_LONG;
      this.m_infoText11 = new MeshText2D(strNameGenderDatebirth);
      this.m_infoText11.updateText(xLineLeft, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR);
      this.m_scene.add(this.m_infoText11);

      const yTextHeight = this.m_infoText11.getRenderedTextHeight();
      yLine -= yTextHeight;

      this.m_infoText12 = new MeshText2D(strDateTimeAcq);
      this.m_infoText12.updateText(xLineLeft, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR);
      this.m_scene.add(this.m_infoText12);
      yLine -= yTextHeight;

      this.m_infoText13 = new MeshText2D(strPid);
      this.m_infoText13.updateText(xLineLeft, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR);
      this.m_scene.add(this.m_infoText13);
      yLine -= yTextHeight;

      let pin = this.m_volumeInfo.m_institutionName;
      let phn = this.m_volumeInfo.m_physicansName;
      let pmn = this.m_volumeInfo.m_manufacturerName;
      pin = (pin.length < 1) ? ' ' : pin;
      phn = (phn.length < 1) ? ' ' : phn;
      pmn = (pmn.length < 1) ? ' ' : pmn;

      yLine = 1.0 - MARK_LONG;
      this.m_infoText21 = new MeshText2D(pin);
      this.m_infoText21.updateText(xPrjRight - MARK_LONG, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR);
      this.m_scene.add(this.m_infoText21);
      yLine -= yTextHeight;

      this.m_infoText22 = new MeshText2D(phn);
      this.m_infoText22.updateText(xPrjRight - MARK_LONG, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR);
      this.m_scene.add(this.m_infoText22);
      yLine -= yTextHeight;

      this.m_infoText23 = new MeshText2D(pmn);
      this.m_infoText23.updateText(xPrjRight - MARK_LONG, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR);
      this.m_scene.add(this.m_infoText23);
      yLine -= yTextHeight;
    } // if volume info found
  } // createMarkLines

  createTileMapsDummy() {
    this.m_matIndex = -1;
  }
  /**
  * Create 2d tile map from source 3d volume texture
  */
  createTileMapsWithTexture(volTexture, isRoiVolume = false) {
    this.m_readyCounter = 0;
    this.m_volTexture = volTexture;
    this.m_isRoiVolume = isRoiVolume;
    this.createTileMaps();
  }

  /**
  * Create internal geo structures for 2d slices visualization
  */
  createTileMaps() {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return;
    }
    const volTexture = this.m_volTexture;
    const xDim = this.m_volumeHeader.m_pixelWidth;
    const yDim = this.m_volumeHeader.m_pixelHeight;
    const zDim = this.m_volumeHeader.m_pixelDepth;

    // remove old rendered mesh
    if (this.m_mesh !== null) {
      this.m_scene.remove(this.m_mesh);
      this.m_mesh = null;
      this.m_material = null;
    }

    this.m_matIndex = -1;
    // let numMaterials = 0;
    // let w = 0;
    // let h = 0;
    let wPhys = 0.0;
    let hPhys = 0.0;

    //
    //  2  3
    //
    //  0  1
    //
    this.m_geometry.faceVertexUvs[0][0][0].y = 1.0;
    this.m_geometry.faceVertexUvs[0][0][1].y = 1.0;
    this.m_geometry.faceVertexUvs[0][0][2].y = 0.0;
    this.m_geometry.faceVertexUvs[0][1][0].y = 0.0;
    this.m_geometry.faceVertexUvs[0][1][1].y = 0.0;
    this.m_geometry.faceVertexUvs[0][1][2].y = 1.0;

    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      // Transverse (Z)
      // w = xDim;
      // h = yDim;
      // const xyDim = xDim * yDim;
      wPhys = this.m_volumeBox.x;
      hPhys = this.m_volumeBox.y;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      // Coronal (Y)
      // w = xDim;
      // h = zDim;
      // const xyDim = xDim * yDim;
      wPhys = this.m_volumeBox.x;
      hPhys = this.m_volumeBox.z;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      // Sagital (X)
      // w = yDim;
      // h = zDim;
      // const xyDim = xDim * yDim;
      wPhys = this.m_volumeBox.y;
      hPhys = this.m_volumeBox.z;
    }

    //
    // fix screen coordinates
    //
    // v2 ----- v3
    // |        |
    // |        |
    // v0 ----- v1
    const wScreen = this.m_width;
    const hScreen = this.m_height;

    this.m_wProjScreen = wScreen;
    this.m_hProjScreen = this.m_wProjScreen * hPhys / wPhys;
    if (this.m_hProjScreen > hScreen) {
      this.m_hProjScreen = hScreen;
      this.m_wProjScreen = this.m_hProjScreen * wPhys / hPhys;
      if (this.m_wProjScreen > wScreen) {
        console.log('Too bad logic');
      }
    }
    // normalize to [0..1]
    this.m_wProjScreen /= wScreen;
    this.m_hProjScreen /= hScreen;

    // console.log(`wProjScreen = ${this.m_wProjScreen} hProjScreen = ${this.m_hProjScreen}`);

    // scale to 2: screen size in [0..2]
    const MULT_TWICE = 2;
    const wProjScreen = this.m_wProjScreen * MULT_TWICE;
    const hProjScreen = this.m_hProjScreen * MULT_TWICE;

    this.m_geometry.vertices[2].x = -1.0;
    this.m_geometry.vertices[2].y = +1.0;
    this.m_geometry.vertices[0].x = -1.0;
    this.m_geometry.vertices[3].y = +1.0;

    // assign screen rect to render , in [-1..+1]
    this.m_geometry.vertices[1].x = wProjScreen - 1.0;
    this.m_geometry.vertices[3].x = wProjScreen - 1.0;
    this.m_geometry.vertices[0].y = 1.0 - hProjScreen;
    this.m_geometry.vertices[1].y = 1.0 - hProjScreen;

    this.m_geometry.verticesNeedUpdate = true;
    this.m_geometry.uvsNeedUpdate = true;

    const matTex2d = new MaterialTex2d();
    this.m_materialsTex2d = matTex2d;
    // this.m_materialsTex2d.push(matTex2d);

    const sliceIndex = Math.floor(this.m_sliderPosition * zDim);
    matTex2d.create(volTexture, xDim, yDim, zDim, this.m_sliceAxis, sliceIndex, this.m_isRoiVolume);
    const mat = matTex2d.m_material;
    if (this.m_material === null) {
      this.m_material = mat;
      this.m_mesh = new THREE.Mesh(this.m_geometry, this.m_material);
      this.m_scene.add(this.m_mesh);
    }
    this.updateTexMapWithNewSliderPos();

    this.createMarkLinesAndText();
    const SCREEN_MULT = 2.0;
    // update 2d tools with new volume data
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_areaTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_rectTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_contrastBrightTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_areaTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_rectTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_contrastBrightTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_areaTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_rectTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_contrastBrightTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
    }
    this.m_pickTool.setProjScreen(this.m_wProjScreen, this.m_hProjScreen);
    this.m_pickTool.setHeader(this.m_volumeHeader);
    this.m_pickTool.setData(this.m_volumeData);
    this.m_materialsTex2d.m_uniforms.xPixelSize.value = 1 / this.m_volumeHeader.m_pixelWidth;
    this.m_materialsTex2d.m_uniforms.yPixelSize.value = 1 / this.m_volumeHeader.m_pixelHeight;

    this.m_readyCounter++;
    // console.log('Graphics2d.createTileMaps() is finished');
  } // create via volume texture

  updateTexMapWithNewSliderPos() {
    if (this.m_material === null) {
      return;
    }
    const maxTex2d = this.m_materialsTex2d;
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      const zDim = this.m_volumeHeader.m_pixelDepth;
      let z = Math.floor(this.m_sliderPosition * zDim);
      z = (z <= zDim - 1) ? z : (zDim - 1);
      maxTex2d.m_uniforms.sliceIndex.value = z;
      maxTex2d.m_uniforms.numSlices.value = zDim;
      maxTex2d.m_uniforms.plane.value = Graphics2d.SLICE_AXIS_Z;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      // calc slice index
      const yDim = this.m_volumeHeader.m_pixelHeight;
      let y = Math.floor(this.m_sliderPosition * yDim);
      y = (y <= yDim - 1) ? y : (yDim - 1);
      maxTex2d.m_uniforms.sliceIndex.value = y;
      maxTex2d.m_uniforms.numSlices.value = yDim;
      maxTex2d.m_uniforms.plane.value = Graphics2d.SLICE_AXIS_Y;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      // calc slice index
      const xDim = this.m_volumeHeader.m_pixelWidth;
      let x = Math.floor(this.m_sliderPosition * xDim);
      x = (x <= xDim - 1) ? x : (xDim - 1);
      maxTex2d.m_uniforms.sliceIndex.value = x;
      maxTex2d.m_uniforms.numSlices.value = xDim;
      maxTex2d.m_uniforms.plane.value = Graphics2d.SLICE_AXIS_X;
    }
  } // updateTexMapWithNewSliderPos

  setSliderPosition(posNew) {
    this.m_sliderPosition = posNew;
    if (this.m_volumeData !== null) {
      // console.log('Slider is changed and data ready to display');
      this.updateTexMapWithNewSliderPos();
    }
    this.m_distanceTool.clearLines();
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_pickTool.clear();
    //this.m_gradTool.clear();
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    this.m_contrastBrightTool.clear();
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_filterTool.clear();
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
  }

  getSliceAxis() {
    return this.m_sliceAxis;
  }
  setSliceAxis(axisNumber) {
    if ((axisNumber < Graphics2d.SLICE_AXIS_X) || (axisNumber > Graphics2d.SLICE_AXIS_Z)) {
      console.log('Wrong axis index');
      return false;
    }
    this.m_sliceAxis = axisNumber;
    this.createTileMaps();
    this.m_distanceTool.clearLines();
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_pickTool.clear();
    //this.m_gradTool.clear();
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    this.m_contrastBrightTool.clear();
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_filterTool.clear();
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
    return true;
  }


  /**
  * Render something on screen
  */
  render() {
    this.m_renderer.render(this.m_scene, this.m_camera);
    // update text
    this.updateText();
    // need not update vertices no more
    this.m_geometry.verticesNeedUpdate = false;
    this.m_geometry.uvsNeedUpdate = false;
  }  // render
} // class Graphics2d

/** Slice axis */
Graphics2d.SLICE_AXIS_X = 0;
Graphics2d.SLICE_AXIS_Y = 1;
Graphics2d.SLICE_AXIS_Z = 2;
