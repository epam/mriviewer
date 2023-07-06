/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview ToolText
 * @author Epam
 * @version 1.0.0
 */

// **********************************************
// Imports
// **********************************************

import ToolDistance from './ToolDistance';
import StoreActionType from '../../store/ActionTypes';
// import UiModalText from '../../ui/UiModalText';

// **********************************************
// Class
// **********************************************

class ToolText {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;

    this.m_texts = [];
    this.m_pointPressed = null;

    this.m_objEdit = null;

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render = this.render.bind(this);
    this.setText = this.setText.bind(this);
  }

  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }

  setPixelSize(xs, ys) {
    this.m_xPixelSize = xs;
    this.m_yPixelSize = ys;
  }

  /**
   * Determine intersection with points in all texts.
   * Input - screen coordinates of pick point
   * Output - volume coordinate
   *
   * @param {object} vScr - screen coordinates of poick
   * @param {object} store - global store
   */
  getEditPoint(vScr, store) {
    const numTexts = this.m_texts.length;
    for (let i = 0; i < numTexts; i++) {
      const objText = this.m_texts[i];
      const vScrProj = ToolDistance.textureToScreen(objText.point.x, objText.point.y, this.m_wScreen, this.m_hScreen, store);
      const MIN_DIST = 4.0;
      if (this.getDistMm(vScr, vScrProj) <= MIN_DIST) {
        this.m_objEdit = objText;
        return objText.point;
      }
    }
    return null;
  }

  /**
   * Move edited point into new pos
   *
   * @param {object} vVolOld
   * @param {object} vVolNew
   */
  moveEditPoint(vVolOld, vVolNew) {
    vVolOld.x = vVolNew.x;
    vVolOld.y = vVolNew.y;
    // update info about text
  }

  /**
   * Remove highlighted object
   *
   */
  deleteObject() {
    if (this.m_objEdit != null) {
      const ind = this.m_texts.indexOf(this.m_objEdit);
      if (ind >= 0) {
        this.m_texts.splice(ind, 1);
      }
    }
  }

  getDistMm(vs, ve) {
    const dx = vs.x - ve.x;
    const dy = vs.y - ve.y;
    const dist = Math.sqrt(dx * dx * this.m_xPixelSize * this.m_xPixelSize + dy * dy * this.m_yPixelSize * this.m_yPixelSize);
    return dist;
  }

  setText(str) {
    const lines = str.split('\n');
    const lineHeight = 16;
    const spacing = 4;

    for (let i = 0; i < lines.length; i++) {
      const objText = {
        point: {
          x: this.m_pointPressed.x,
          y: this.m_pointPressed.y + i * (lineHeight + spacing),
        },
        text: lines[i],
      };
      this.m_texts.push(objText);
    }

    // invoke render
    this.m_objGraphics2d.forceUpdate();
  }

  clear() {
    this.m_texts = [];
  }

  /**
   * When mouse pressed down
   *
   * @param {number} xScr - x coordinate of click on screen
   * @param {number} yScr - y coordinate of click on screen
   * @param {object} store - global storage
   */
  onMouseDown(xScr, yScr, store) {
    this.m_pointPressed = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);

    store.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true });
  }

  onMouseMove() {
    // args ommited: xScr, yScr, store
  }

  onMouseUp() {
    // args ommited: xScr, yScr, store
  }

  /**
   * Render all areas on screen in 2d mode
   *
   * @param {object} ctx - html5 canvas context
   * @param {object} store - global store with app parameters
   */
  render(ctx, store) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'yellow';
    ctx.fillStyle = 'white';
    const FONT_SZ = 16;
    const LINE_HEIGHT = FONT_SZ * 1.2; // Added this line for line height calculation
    ctx.font = `${FONT_SZ}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Changed from 'bottom' to 'middle' to better center multiline text

    const numTexts = this.m_texts.length;
    for (let i = 0; i < numTexts; i++) {
      const objText = this.m_texts[i];
      const vTex = objText.point;
      const vScr = ToolDistance.textureToScreen(vTex.x, vTex.y, this.m_wScreen, this.m_hScreen, store);
      const lines = objText.text.split('\n'); // Split the text by newline character

      for (let j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], vScr.x, vScr.y + j * LINE_HEIGHT - ((lines.length - 1) * LINE_HEIGHT) / 2);
      }
    } // for (i)

    /*
    const numRects = this.m_rects.length;
    for (let i = 0; i < numRects; i++) {
      const objRect = this.m_rects[i];
      const vTexMin = objRect.vMin;
      const vTexMax = objRect.vMax;
      const vScrMin = ToolDistance.textureToScreen(vTexMin.x, vTexMin.y, this.m_wScreen, this.m_hScreen, store);
      const vScrMax = ToolDistance.textureToScreen(vTexMax.x, vTexMax.y, this.m_wScreen, this.m_hScreen, store);
      ctx.beginPath();
      ctx.moveTo(vScrMin.x, vScrMin.y);
      ctx.lineTo(vScrMax.x, vScrMin.y);
      ctx.lineTo(vScrMax.x, vScrMax.y);
      ctx.lineTo(vScrMin.x, vScrMax.y);
      ctx.lineTo(vScrMin.x, vScrMin.y);
      ctx.stroke();
      // draw text
      const xText = Math.floor((vScrMin.x + vScrMax.x) * 0.5);
      const yText = Math.floor((vScrMin.y + vScrMax.y) * 0.5);
      const strMsg = objRect.area.toFixed(2) + ' mm^2';
      ctx.fillText(strMsg, xText, yText);
    } // for (i) all rects
    */
  } // end render
} // end class ToolText

export default ToolText;
