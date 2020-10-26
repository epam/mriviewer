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
* @module app/scripts/graphics2d/graphics23d
*/

import * as THREE from 'three';

// import MaterialTex2d from '../gfx/mattex2d';
// import MaterialColor2d from '../gfx/matcolor2d';
// import MeshText2D from './meshtext2d';
// import Line2D from './line2d';
// import Circle2D from './circle2d';
import DistanceTool from './distancetool';
// import AngleTool from './angletool';
// import AreaTool from './areatool';
// import ZoomTool from './zoomtool';
// import RectTool from './recttool';
// import MoveTool from './movetool';
// import DeleteTool from './deletetool';
// import EditTool from './edittool';
// import TextTool from './texttool';

/**  @constant {number} SCENE_3D_BACKGROUND_COLOR - backgroudn color for 3d window */
// const SCENE_2D_BACKGROUND_COLOR = 0xbbbbff; // 0x00

/** Possible 2d tools */
const tools2d = {
  INTENSITY: 'intensity',
  DISTANCE: 'distance',
  ANGLE: 'angle',
  AREA: 'area',
  RECT: 'rect',
  TEXT: 'text',
  GRAD: 'grad',
  COBR: 'cobr',
  BIFI: 'bifi',
  ZOOM: 'zoom',
  DELETE: 'delete',
  EDIT: 'edit',
};

/** Class Graphics2d is used for simple debug style 2d render */
export default class Graphics23d {

  /**
  * Initialize render
  * @param (object) container - object container for 3d rendering
  * @param (int) width - 2d canvas width
  * @param (int) height - 2d canvas height
  * @return {Object} Intsance of this class (singleton)
  */
  constructor(scene, width, height) {
    this.m_width = width;
    this.m_height = height;
    this.m_material = null;
    this.m_mesh = null;
    console.log(`Graphics2d create size = ${width} * ${height}`);
    this.m_scene = scene;

    this.m_materialsTex2d = null;
    this.m_material = null;

    //construct edit and move tools
    this.m_zoom = 1;
    this.m_savePosX = 0;
    this.m_savePosY = 0;
    this.m_posX = 0;
    this.m_posY = 0;
    this.m_move = false;
    this.m_wProjScreen = width;
    this.m_hProjScreen = height;

    this.m_showTileTexture = false;

    // prepare for render 2d lines on screen
    const xw = 1.0 / width;
    const yw = 1.0 / height;
    const TWICE = 2.0;
    this.m_lineWidth = TWICE * ((xw > yw) ? xw : yw);
    this.m_lineWidth = 0.002;

    this.m_textTime = -1000;
    this.m_text = null;
    this.m_toolType = tools2d.DISTANCE;
    //this.m_toolType = tools2d.INTENSITY;
    this.m_distanceTool = new DistanceTool(this.m_scene, this.m_lineWidth);
    /*this.m_angleTool = new AngleTool(this.m_scene, this.m_lineWidth);
    this.m_areaTool = new AreaTool(this.m_scene, this.m_lineWidth);
    this.m_rectTool = new RectTool(this.m_scene, this.m_lineWidth);
    this.m_textTool = new TextTool(this.m_scene);
    this.m_zoomTool = new ZoomTool(this.m_zoom);
    this.m_moveTool = new MoveTool(this.m_zoom, this.m_posX, this.m_posY);
    this.m_deleteTool = new DeleteTool(this.m_scene, this.m_lineWidth);
    this.m_editTool = new EditTool(this.m_scene, this.m_lineWidth);
    */
    //this.m_distanceTool.test();
  } // end of constructor
  set2dToolType(toolType) {
    this.m_toolType = toolType;
  }
  /**
   * Callback on file loaded
   */
  onFileLoaded() {
    this.m_distanceTool.clearLines();
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_textTool.clear();
    this.m_deleteTool.clearLines();
    this.m_editTool.clearLines();
  }
  clear2DTools() {
    this.m_distanceTool.clearLines();
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_textTool.clear();
    this.m_deleteTool.clearLines();
    this.m_editTool.clearLines();
  }
  default2DTools() {
    this.m_zoom = 1;
    this.m_posX = 0;
    this.m_posY = 0;
    this.m_savePosX = 0;
    this.m_savePosY = 0;
    this.m_materialsTex2d.m_uniforms.posX.value = this.m_posX;
    this.m_materialsTex2d.m_uniforms.posY.value = this.m_posY;
    this.m_materialsTex2d.m_uniforms.zoom.value = this.m_zoom;
    this.updateLines();
  }
  fov2Tan(fov) {
    const HALF = 0.5;
    return Math.tan(THREE.Math.degToRad(HALF * fov));
  }
  tan2Fov(tan) {
    const TWICE = 2.0;
    return THREE.Math.radToDeg(Math.atan(tan)) * TWICE;
  }
  /**
  * Keyboard event handler
  * @param (number) keyCode - keyboard code
  * @param (Boolean) debug - true if debug false otherwise
  */
  onKeyDown(keyCode, debug) {
    // console.log(`onKeyDown: ${keyCode}`);
    // const KEY_CODE_G = 71;
    if (debug) {
      // if (keyCode === KEY_CODE_G) {
      //   this.debugShowSliceFrom2dTiles();
      // }
    }
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
    if (this.m_levelSetMode) {
      return;
    }

    const TWICE = 2.0;
    const xt = xScr * TWICE - 1.0;
    const yt = yScr * TWICE - 1.0;
    //const yt = (1.0 - yScr) * TWICE - 1.0;

    switch (this.m_toolType) {
    case tools2d.DISTANCE:
      this.m_distanceTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
      break;
    case tools2d.ANGLE:
      this.m_angleTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
      break;
    case tools2d.TEXT:
      this.m_textTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
      break;
    case tools2d.AREA:
      this.m_areaTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
      break;
    case tools2d.RECT:
      this.m_rectTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
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
    case tools2d.ZOOM:
      this.m_move = true;
      this.m_moveTool.onMouseDown(xt, yt);
      break;
    case tools2d.DELETE:
      this.m_deleteTool.onMouseDown(xt, yt, this.m_distanceTool.m_distances, this.m_angleTool.m_angles,
        this.m_rectTool.m_areas, this.m_areaTool.m_distances, this.m_textTool.m_textArr,
        this.m_distanceTool.m_vertexes, this.m_angleTool.m_vertexes, this.m_rectTool.m_vertexes,
        this.m_areaTool.m_vertexes2, this.m_areaTool.m_last_lengths, this.m_areaTool.m_vertexes, this.m_areaTool,
        this.m_textTool.m_vertexes);
      console.log(`${this.m_areaTool.last_length}`);
      break;
    case tools2d.EDIT:
      this.m_editTool.onMouseDown();
      break;
    default:
      console.log('Unexpected 2d tool');
      break;
    }
  }
  /**
   * Mouse events handler
   * xScr, yScr in [0..1] is normalized mouse coordinate in screen
   */
  onMouseUp(xScr, yScr) {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return;
    }
    if ((xScr > this.m_wProjScreen) || (yScr > this.m_hProjScreen)) {
      // out of image
      return;
    }
    const TWICE = 2.0;
    const xt = xScr * TWICE - 1.0;
    const yt = yScr * TWICE - 1.0;
    //const yt = (1.0 - yScr) * TWICE - 1.0;

    if (this.m_levelSetMode) {
      // only for first step of level set
      if (this.m_levelSetCircle !== null) {
        this.clearLevelSetCenter();
      }
      this.drawLevelSetCenter(xt, yt);
      return;
    }
    switch (this.m_toolType) {
    case tools2d.DISTANCE:
      break;
    case tools2d.ANGLE:
      break;
    case tools2d.AREA:
      break;
    case tools2d.RECT:
      break;
    case tools2d.TEXT:
      break;
    case tools2d.COBR:
      break;
    case tools2d.BIFI:
      break;
    case tools2d.ZOOM:
      this.m_move = false;
      this.m_moveTool.onMouseUp();
      this.m_savePosX = this.m_posX;
      this.m_savePosY = this.m_posY;
      break;
    case tools2d.DELETE:
      break;
    case tools2d.EDIT:
      this.m_editTool.onMouseUp();
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
    const yt = yScr * TWICE - 1.0;
    //const yt = (1.0 - yScr) * TWICE - 1.0;

    switch (this.m_toolType) {
    case tools2d.DISTANCE:
      this.m_distanceTool.onMouseMove(xt, yt, this.m_zoom);
      break;
    case tools2d.ANGLE:
      this.m_angleTool.onMouseMove(xt, yt);
      break;
    case tools2d.AREA:
      this.m_areaTool.onMouseMove(xt, yt);
      break;
    case tools2d.RECT:
      this.m_rectTool.onMouseMove(xt, yt, this.m_zoom);
      break;
    case tools2d.TEXT:
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
    case tools2d.ZOOM:
      if (this.m_move) {
        this.updateMove(xt, yt);
      }
      break;
    case tools2d.DELETE:
      this.m_deleteTool.onMouseMove(xt, yt, this.m_zoom, this.m_distanceTool.m_distances, this.m_angleTool.m_angles,
        this.m_rectTool.m_areas, this.m_areaTool.m_distances, this.m_textTool.m_textArr);
      break;
    case tools2d.EDIT: // TO DO: add text tool
      this.m_editTool.onMouseMove(xt, yt, this.m_zoom, this.m_distanceTool.m_distances, this.m_angleTool.m_angles,
        this.m_rectTool.m_areas, this.m_areaTool.m_distances, this.m_areaTool, this.m_textTool,
        this.m_posX * (this.m_wProjScreen), this.m_posY * (this.m_hProjScreen));
      //this.m_areaTool.updateVertexes(this.m_zoom, this.m_posX * (this.m_wProjScreen), this.m_posY *
      // (this.m_hProjScreen));
      this.m_distanceTool.updateVertexes(this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
      this.m_angleTool.updateVertexes(this.m_zoom, this.m_posX * (this.m_wProjScreen),
        this.m_posY * (this.m_hProjScreen));
      break;
    default:
      console.log('Unexpected 2d tool');
      break;
    }
  }
  /**
   * Mouse events handler
   * xScr, yScr in [0..1] is normalized mouse coordinate in screen
   */
  onMouseWheel(wheelDeltaY) {
    switch (this.m_toolType) {
    case tools2d.DISTANCE:
      break;
    case tools2d.ANGLE:
      break;
    case tools2d.AREA:
      break;
    case tools2d.RECT:
      break;
    case tools2d.TEXT:
      break;
    case tools2d.COBR:
      break;
    case tools2d.BIFI:
      break;
    case tools2d.ZOOM:
      this.m_zoomTool.onMouseWheel(wheelDeltaY);
      this.updateZoom();
      this.createMarkLinesAndText();
      break;
    case tools2d.DELETE:
      break;
    case tools2d.EDIT:
      break;
    default:
      console.log('Unexpected 2d tool');
      break;
    }
  }
  updateLines() {
    this.m_distanceTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_angleTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_rectTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_textTool.updateAll(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_areaTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_deleteTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_editTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
  }
  updateMove(xt, yt) {
    const TWICE = 2;
    const delta = (TWICE - TWICE * this.m_zoom);
    const coord = this.m_moveTool.onMouseMove(xt, yt);
    if (((this.m_savePosX + coord.x) <= Math.abs(delta)) && ((this.m_savePosX + coord.x) > 0)) {
      this.m_posX = this.m_savePosX + coord.x;
      this.m_materialsTex2d.m_uniforms.posX.value = this.m_posX;
    } else if (this.m_savePosX + coord.x > Math.abs(delta)) {
      this.m_posX = Math.abs(delta);
      this.m_materialsTex2d.m_uniforms.posX.value = this.m_posX;
    } else {
      this.m_posX = 0;
      this.m_materialsTex2d.m_uniforms.posX.value = this.m_posX;
    }

    if (((this.m_savePosY + coord.y) >= (-1) * Math.abs(delta)) && ((this.m_savePosY + coord.y) < 0)) {
      this.m_posY = this.m_savePosY + coord.y;
      this.m_materialsTex2d.m_uniforms.posY.value = this.m_posY;
    } else if (this.m_savePosY + coord.y < (-1) * Math.abs(delta)) {
      this.m_posY = (-1) * Math.abs(delta);
      this.m_materialsTex2d.m_uniforms.posY.value = this.m_posY;
    } else {
      this.m_posY = 0;
      this.m_materialsTex2d.m_uniforms.posY.value = this.m_posY;
    }
    this.updateLines();
  }
  updateZoom() {
    const TWICE = 2;
    this.m_materialsTex2d.m_uniforms.zoom.value = this.m_zoomTool.m_zoom;
    this.m_zoom = this.m_zoomTool.m_zoom;
    const delta = (TWICE - TWICE * this.m_zoom);
    if (this.m_posX > delta) {
      this.m_posX = delta;
      this.m_materialsTex2d.m_uniforms.posX.value = this.m_posX;
    }
    if ((this.m_posY < (-1) * delta) && (this.m_posY < 0)) {
      this.m_posY = (-1) * delta;
      this.m_materialsTex2d.m_uniforms.posY.value = this.m_posY;
    }
    this.updateLines();
  }
  updateText() {
    //this.m_pickTool.update();
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
}