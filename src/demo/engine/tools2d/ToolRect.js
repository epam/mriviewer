/**
 * @fileOverview ToolRect
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

import ToolDistance from './ToolDistance';
import Modes2d from '../../store/Modes2d';

// **********************************************
// Class
// **********************************************

class ToolRect {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;

    this.m_rects = [];
    this.m_inCreateMode = false;

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;

    this.m_store = null;
    this.m_objEdit = null;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render = this.render.bind(this);
  }
  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }
  setPixelSize(xs, ys) {
    this.m_xPixelSize = xs;
    this.m_yPixelSize = ys;
  }
  clear() {
    this.m_rects = [];
    this.m_inCreateMode = false;
  }
  getDistMm(vs, ve) {
    const dx = vs.x - ve.x;
    const dy = vs.y - ve.y;
    const dist = Math.sqrt(dx * dx * this.m_xPixelSize * this.m_xPixelSize +
      dy * dy * this.m_yPixelSize * this.m_yPixelSize);
    return dist;
  }
  /**
   * Determine intersection with points in rect set.
   * Input - screen coordinates of pick point
   * Output - volume coordinate
   *  
   * @param {object} vScr - screen coordinates of pick
   * @param {object} store - global store
   */
  getEditPoint(vScr, store) {
    const numRects = this.m_rects.length;
    for (let i = 0; i < numRects; i++) {
      const objRect = this.m_rects[i];
      const vScrMin = ToolDistance.textureToScreen(objRect.vMin.x, objRect.vMin.y, this.m_wScreen, this.m_hScreen, store);
      const vScrMax = ToolDistance.textureToScreen(objRect.vMax.x, objRect.vMax.y, this.m_wScreen, this.m_hScreen, store);

      const MIN_DIST = 4.0;
      if (this.getDistMm(vScr, vScrMin) <= MIN_DIST) {
        this.m_objEdit = objRect;
        return objRect.vMin;
      }
      if (this.getDistMm(vScr, vScrMax) <= MIN_DIST) {
        this.m_objEdit = objRect;
        return objRect.vMax;
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
    // update line len
    this.getRectArea(this.m_objEdit, this.m_store);
  }
  /**
   * Remove highlighted object
   * 
   */
  deleteObject() {
    if (this.m_objEdit != null) {
      const ind = this.m_rects.indexOf(this.m_objEdit);
      if (ind >= 0) {
        this.m_rects.splice(ind, 1);
      }
    }
  }
  getRectArea(objRect, store) {
    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);
                                          
    const xSize = vol.m_boxSize.x;
    const ySize = vol.m_boxSize.y;
    const zSize = vol.m_boxSize.z;
    const mode2d = store.mode2d;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    let xScale = 0.0, yScale = 0.0;
    if (mode2d === Modes2d.TRANSVERSE) {
      // z const
      xScale = xSize / xDim;
      yScale = ySize / yDim;
    } else if (mode2d === Modes2d.SAGGITAL) {
      // x const
      xScale = ySize / xDim;
      yScale = zSize / zDim;
    } else {
      // y const
      xScale = xSize / xDim;
      yScale = zSize / zDim;
    }
    const dx = Math.abs(objRect.vMax.x - objRect.vMin.x); 
    const dy = Math.abs(objRect.vMax.y - objRect.vMin.y); 
    objRect.area = xScale * yScale * dx * dy; 
  }
  onMouseDown(xScr, yScr, store) {
    this.m_store = store;
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    if (!this.m_inCreateMode)
    {
      this.m_inCreateMode = true;
      // start add rect
      const objRect = {
        vMin: {
          x: vTex.x,
          y: vTex.y,
        },
        vMax: {
          x: vTex.x,
          y: vTex.y,
        },
        area: 0.0,
      };
      this.m_rects.push(objRect);
    } else {
      this.m_inCreateMode = false;
    }
  }
  onMouseMove(xScr, yScr, store) {
    if (this.m_inCreateMode) {
      const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
      const numRects = this.m_rects.length;
      const objRect = this.m_rects[numRects - 1];
      objRect.vMax.x = vTex.x;
      objRect.vMax.y = vTex.y;
      this.getRectArea(objRect, store);
      this.m_objGraphics2d.forceUpdate();
    } // if in create rect mode
  }
  onMouseUp() { // ommitred args: xScr, yScr, store
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
    ctx.font = FONT_SZ.toString() + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

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
  } // end render
} // end class ToolRect

export default ToolRect;
