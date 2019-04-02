/**
 * @fileOverview ToolText
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

import ToolDistance from './ToolDistance';
// import UiModalText from '../../ui/UiModalText';

// **********************************************
// Class
// **********************************************

class ToolText {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;
    this.m_volume = null;

    this.m_texts = [];
    this.m_pointPressed = null;

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
  setVolume(vol) {
    this.m_volume = vol;
  }
  setPixelSize(xs, ys) {
    this.m_xPixelSize = xs;
    this.m_yPixelSize = ys;
  }
  setText(str) {
    this.m_text = str;
    console.log(`set text = ${str}`);
    const objText = {
      point: {
        x: this.m_pointPressed.x,
        y: this.m_pointPressed.y
      },
      text: str
    };
    this.m_texts.push(objText);
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
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    this.m_pointPressed = vTex;

    const uiApp = store.uiApp;
    uiApp.onShowModalText();
  }
  onMouseMove(xScr, yScr, store) {
  }
  onMouseUp(xScr, yScr, store) {
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

    const numTexts = this.m_texts.length;
    for (let i = 0; i < numTexts; i++) {
      const objText = this.m_texts[i];
      const vTex = objText.point;
      const vScr = ToolDistance.textureToScreen(vTex.x, vTex.y, this.m_wScreen, this.m_hScreen, store);
      const strMsg = objText.text;
      ctx.fillText(strMsg, vScr.x, vScr.y);
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
