/**
 * @fileOverview ToolDelete
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

import ToolDistance from './ToolDistance';

// **********************************************
// Class
// **********************************************

class ToolDelete {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render = this.render.bind(this);

    this.m_mousePressed = false;
    this.m_pointTracked = null;
    this.m_toolTracked = null;
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
    this.m_mousePressed = false;
    this.m_pointTracked = null;
    this.m_toolTracked = null;
  }
  /**
   * When mouse pressed down
   */  
  onMouseDown() { // ommited args: xScr, yScr, store
    this.m_mousePressed = true;

    if (this.m_pointTracked !== null) {
      this.m_toolTracked.deleteObject(this.m_pointTracked);
      this.m_pointTracked = null;
      // invoke forced 2d render
      this.m_objGraphics2d.forceUpdate();
    }
  }
  onMouseMove(xScr, yScr, store) {
    if (!this.m_mousePressed) {
      // fly mouse over objects on 2d screen
      const vScr = {
        x: xScr, y: yScr
      };

      const toolDist = this.m_objGraphics2d.m_toolDistance;
      const toolAngle = this.m_objGraphics2d.m_toolAngle;
      const toolArea = this.m_objGraphics2d.m_toolArea;
      const toolRect = this.m_objGraphics2d.m_toolRect;
      const toolText = this.m_objGraphics2d.m_toolText;
      const tools = [
        toolDist, toolAngle, toolArea, toolRect, toolText
      ];
      const trackedBefore = (this.m_pointTracked !== null);
      this.m_pointTracked = null;
      const numTools = tools.length;
      for (let i = 0; i < numTools; i++) {
        const objTool = tools[i];
        const vDetect = objTool.getEditPoint(vScr, store);
        if (vDetect !== null) {
          // console.log(`ToolEdit. point tracked: ${vDetect.x}, ${vDetect.y}`);
          this.m_pointTracked = vDetect;
          this.m_toolTracked = objTool;
          break;
        }
      } // for i all tools
      const trackedNow = (this.m_pointTracked !== null);
      if (trackedNow || (trackedBefore && !trackedNow)) {
        // invoke forced 2d render
        this.m_objGraphics2d.forceUpdate();
      }

    } else {
      /*
      if (this.m_pointTracked !== null) {
        const vTexNew = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
        this.m_toolTracked.moveEditPoint(this.m_pointTracked, vTexNew);
        // invoke forced 2d render
        this.m_objGraphics2d.forceUpdate();
      } // if we have tracked point
      */
    }
  }
  onMouseUp() { // ommited args: xScr, yScr, store
    this.m_mousePressed = false;
  }
  /**
   * Render all areas on screen in 2d mode
   * 
   * @param {object} ctx - html5 canvas context
   * @param {object} store - global store with app parameters
   */
  render(ctx, store) {
    if (this.m_pointTracked !== null) {
      const vScr = ToolDistance.textureToScreen(this.m_pointTracked.x, this.m_pointTracked.y, this.m_wScreen, this.m_hScreen, store);
      const RAD_CIRCLE_EDIT = 4;
      //ctx.lineWidth = 2;
      //ctx.strokeStyle = 'green';
      ctx.fillStyle = 'rgb(250, 120, 120)';
      ctx.beginPath();
      ctx.arc(vScr.x, vScr.y, RAD_CIRCLE_EDIT, 0.0, 2 * 3.1415962, false);
      // ctx.stroke();
      ctx.fill();
    }
  } // end render
} // end class ToolText

export default ToolDelete;
