/**
 * @fileOverview ToolDistance
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

import Modes2d from '../../store/Modes2d';

// **********************************************
// Class
// **********************************************

class ToolDistance {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;
  
    this.m_pointStart = null;
    this.m_lines = [];
    this.m_mouseDown = false;

    this.m_objEdit = null;

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;
  }
  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }
  /**
   * 
   * @param {number} xs - world units hor / volume pixels (x)
   * @param {number} ys - world units ver / volume pixels (y) 
   */
  setPixelSize(xs, ys) {
    this.m_xPixelSize = xs;
    this.m_yPixelSize = ys;
  }
  /**
   * Determine intersection with points in lines set.
   * Input - screen coordinates of pick point
   * Output - volume coordinate
   *  
   * @param {object} vScr - screen coordinates of poick
   * @param {object} store - global store
   */
  getEditPoint(vScr, store) {
    const numLines = this.m_lines.length;
    for (let i = 0; i < numLines; i++) {
      const objLine = this.m_lines[i];
      const vScrS = ToolDistance.textureToScreen(objLine.vs.x, objLine.vs.y, this.m_wScreen, this.m_hScreen, store);
      const vScrE = ToolDistance.textureToScreen(objLine.ve.x, objLine.ve.y, this.m_wScreen, this.m_hScreen, store);
      const MIN_DIST = 4.0;
      if (this.getDistMm(vScr, vScrS) <= MIN_DIST) {
        this.m_objEdit = objLine;
        return objLine.vs;
      }
      if (this.getDistMm(vScr, vScrE) <= MIN_DIST) {
        this.m_objEdit = objLine;
        return objLine.ve;
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
    this.m_objEdit.distMm = this.getDistMm(this.m_objEdit.vs, this.m_objEdit.ve);
  }
  /**
   * Remove highlighted object
   */
  deleteObject() {
    if (this.m_objEdit != null) {
      const ind = this.m_lines.indexOf(this.m_objEdit);
      if (ind >= 0) {
        this.m_lines.splice(ind, 1);
      }
    }
  }
  static screenToTexture(xScr, yScr, wScr, hScr, store) {
    const xRel = xScr / wScr;
    const yRel = yScr / hScr;

    const mode2d = store.mode2d;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const zoom = store.render2dZoom;
    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;

    const vTex = {
      x: 0.0,
      y: 0.0,
    };
    if (mode2d === Modes2d.TRANSVERSE) {
      // z const
      vTex.x = Math.floor((xPos + xRel * zoom) * xDim);
      vTex.y = Math.floor((yPos + yRel * zoom) * yDim);
    }
    if (mode2d === Modes2d.SAGGITAL) {
      // x const
      vTex.x = Math.floor((xPos + xRel * zoom) * yDim);
      vTex.y = Math.floor((yPos + yRel * zoom) * zDim);
    }
    if (mode2d === Modes2d.CORONAL) {
      // y const
      vTex.x = Math.floor((xPos + xRel * zoom) * xDim);
      vTex.y = Math.floor((yPos + yRel * zoom) * zDim);
    }
    return vTex;
  }
  static textureToScreen(xTex, yTex, wScr, hScr, store) {
    const vScr = {
      x: 0.0,
      y: 0.0,
    };
    const mode2d = store.mode2d;
    const volSet = store.volumeSet; 
    const vol = volSet.getVolume(store.volumeIndex);
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const zoom = store.render2dZoom;
    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;
    if (mode2d === Modes2d.TRANSVERSE) {
      // z const
      vScr.x = ((xTex / xDim) - xPos) / zoom;
      vScr.y = ((yTex / yDim) - yPos) / zoom;
    }
    if (mode2d === Modes2d.SAGGITAL) {
      // x const
      vScr.x = ((xTex / yDim) - xPos) / zoom;
      vScr.y = ((yTex / zDim) - yPos) / zoom;
    }
    if (mode2d === Modes2d.CORONAL) {
      // y const
      vScr.x = ((xTex / xDim) - xPos) / zoom;
      vScr.y = ((yTex / zDim) - yPos) / zoom;
    }
    vScr.x *= wScr;
    vScr.y *= hScr;
    return vScr;
  }
  getDistMm(vs, ve) {
    const dx = vs.x - ve.x;
    const dy = vs.y - ve.y;
    const dist = Math.sqrt(dx * dx * this.m_xPixelSize * this.m_xPixelSize +
      dy * dy * this.m_yPixelSize * this.m_yPixelSize);
    return dist;
  }
  onMouseDown(xScr, yScr, store) {
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    const vStart = {
      x: vTex.x,
      y: vTex.y,
    };
    const vEnd = {
      x: vTex.x,
      y: vTex.y
    };
    const objLine = {
      vs: vStart,
      ve: vEnd,
      distMm: 0.0,
    };
    this.m_lines.push(objLine);
    this.m_mouseDown = true;
    // this.m_pointStart = v;
    // console.log(`onMouseDown: ${xScr}, ${yScr}`);
  }
  onMouseMove(xScr, yScr, store) {
    if (!this.m_mouseDown) {
      return;
    }
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    // get last line and change end
    const vEnd = {
      x: vTex.x,
      y: vTex.y,
    };
    const numLines = this.m_lines.length;
    if (numLines > 0) {
      const objLastLine = this.m_lines[numLines - 1];
      objLastLine.ve = vEnd;
      objLastLine.distMm = this.getDistMm(objLastLine.vs, objLastLine.ve);
      const MIN_DIST_MM = 0.00001;
      if (objLastLine.distMm > MIN_DIST_MM) {
        // invoke render event
        this.m_objGraphics2d.forceUpdate();
      } // if last line is long enough
    } // if num lines more 0
  }
  onMouseUp() { // omitted args: xScr, yScr, store
    this.m_mouseDown = false;
    const numLines = this.m_lines.length;
    if (numLines > 0) {
      const objLastLine = this.m_lines[numLines - 1];
      objLastLine.distMm = this.getDistMm(objLastLine.vs, objLastLine.ve);
      const MIN_DIST_MM = 0.00001;
      if (objLastLine.distMm <= MIN_DIST_MM) {
        // remove last line
        this.m_lines.pop();
        console.log('ToolDistance: pop last line');
      } // if last line is long enough
    } // if num lines more 0

  }
  clear() {
    this.m_lines = [];
  }
  //
  // render lines on screen
  // 
  render(ctx, store) {
    const numLines = this.m_lines.length;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'yellow';
    ctx.fillStyle = 'white';
    const FONT_SZ = 16;
    ctx.font = FONT_SZ.toString() + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'center';
    for (let i = 0; i < numLines; i++) {
      const objLine = this.m_lines[i];
      const distMm = objLine.distMm;
      const vsTex = objLine.vs;
      const veTex = objLine.ve;
      const vs = ToolDistance.textureToScreen(vsTex.x, vsTex.y, this.m_wScreen, this.m_hScreen, store);
      const ve = ToolDistance.textureToScreen(veTex.x, veTex.y, this.m_wScreen, this.m_hScreen, store);
      ctx.beginPath();
      ctx.moveTo(vs.x, vs.y);
      ctx.lineTo(ve.x, ve.y);
      ctx.stroke();
      // draw text
      const xText = Math.floor((vs.x + ve.x) * 0.5);
      const yText = Math.floor((vs.y + ve.y) * 0.5);
      const strMsg = distMm.toFixed(3) + ' mm';
      ctx.fillText(strMsg, xText, yText);
    }
  }

} // end class

export default ToolDistance;
