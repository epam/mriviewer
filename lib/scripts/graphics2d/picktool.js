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
 * 2d mode pick tool
 * @module app/scripts/graphics2d/picktool
 */

import MeshText2D from './meshtext2d';
import Graphics2d from './graphics2d';

export default class PickTool {
  constructor(scene) {
    this.m_scene = scene;
    this.m_text = null;
    this.m_wProjScreen = 0.0;
    this.m_hProjScreen = 0.0;
    this.m_volHeader = null;
    this.m_volData = null;
  } // end of constructor

  clear() {
    // remove message from srceen
    if (this.m_text !== null) {
      this.m_scene.remove(this.m_text);
    }
  }
  setProjScreen(wProjScreen, hProjScreen) {
    this.m_wProjScreen = wProjScreen;
    this.m_hProjScreen = hProjScreen;
  }
  setHeader(header) {
    this.m_volHeader = header;
  }
  setData(vdata) {
    this.m_volData = vdata;
  }

  onMouseDown(xScr, yScr, sliceAxis, sliderPosition, zoom, posX, posY) {
    // remove old message from screen
    this.clear();

    const xRatioImage = xScr / this.m_wProjScreen;
    const yRatioImage = yScr / this.m_hProjScreen;

    const xDim = this.m_volHeader.m_pixelWidth;
    const yDim = this.m_volHeader.m_pixelHeight;
    const zDim = this.m_volHeader.m_pixelDepth;

    let w = 0;
    let h = 0;

    let x = 0;
    let y = 0;
    let z = 0;

    if (sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      w = xDim;
      h = yDim;
      x = Math.floor(xRatioImage * w);
      y = Math.floor(yRatioImage * h);
      z = Math.floor(sliderPosition * zDim);
      z = (z <= zDim - 1) ? z : (zDim - 1);
    } else if (sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      w = xDim;
      h = zDim;
      x = Math.floor(xRatioImage * w);
      z = Math.floor(yRatioImage * h);
      y = Math.floor(sliderPosition * yDim);
      y = (y <= yDim - 1) ? y : (yDim - 1);
    } else if (sliceAxis === Graphics2d.SLICE_AXIS_X) {
      w = yDim;
      h = zDim;
      y = Math.floor(xRatioImage * w);
      z = Math.floor(yRatioImage * h);
      x = Math.floor(sliderPosition * xDim);
      x = (x <= xDim - 1) ? x : (xDim - 1);
    }

    const offDst = x + (y * xDim) + (z * xDim * yDim);
    const val = this.m_volData[offDst];
    const BORDER = 512;
    const TWICE = 2;
    const ACCURACY = 2;
    const strMsg = `x,y,z = ${(x * zoom + (posX) / TWICE * BORDER).toFixed(ACCURACY)},
    ${(y * zoom - ((posY) / TWICE) * BORDER).toFixed(ACCURACY)},${z}, Value = ${val}`;
    // console.log(strMsg);

    this.m_text = new MeshText2D(strMsg);
    // eslint-disable-next-line
    const xt = xScr * 2.0 - 1.0;
    // eslint-disable-next-line
    const yt = (1.0 - yScr) * 2.0 - 1.0;

    const xAlign = (xRatioImage < 0.5) ? MeshText2D.ALIGN_LEFT : MeshText2D.ALIGN_RIGHT;
    const yAlign = (yRatioImage < 0.5) ? MeshText2D.ALIGN_TOP : MeshText2D.ALIGN_BOTTOM;
    // in [0..2]
    const TEXT_STRING_HEIGHT_SCR = 0.05;
    const TEXT_BACK_COLOR_MESSAGE = 'rgba(0, 0, 0, 255)';
    const TEXT_COLOR_MESSAGE = 'rgba(255, 255, 255, 255)';
    this.m_text.updateText(xt, yt, TEXT_STRING_HEIGHT_SCR, xAlign, yAlign, TEXT_BACK_COLOR_MESSAGE, TEXT_COLOR_MESSAGE);
    this.m_scene.add(this.m_text);
    const d = new Date();
    this.m_textTime = d.getTime();
  }

  update() {
    const d = new Date();
    const curTime = d.getTime();
    const delta = curTime - this.m_textTime;
    const TIME_TO_REMOVE_STRING = 2000;
    if ((this.m_text !== null) && (delta > TIME_TO_REMOVE_STRING)) {
      this.m_scene.remove(this.m_text);
      this.m_text = null;
      this.m_textTime = -10000;
    }
  }
} // end of class
