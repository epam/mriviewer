/**
 * @fileOverview TransfFunc
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

class TransfFunc {
  constructor() {
    this.m_mouseDown = false;
    this.m_indexMoved = -1;

    this.m_numHandles = 10;
    this.m_handleColors = [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 128, b: 64 },
      { r: 255, g: 0, b: 0 },
      { r: 128, g: 64, b: 64 },
      { r: 128, g: 0, b: 0 },
      { r: 64, g: 64, b: 64 },
      { r: 128, g: 128, b: 128 },
      { r: 192, g: 192, b: 192 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
    ];
    this.m_handleX = [
      0, 22, 40, 55, 61, 115, 118, 125, 160, 255
    ];
    this.m_handleY = [
      0, 0, 0.3, 0.12, 0, 0, 0.4, 0.8, 0.95, 1.0
    ];
    // screen projections
    this.m_proj = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 }
    ];
    // check correct array size
    if (this.m_handleColors.length !== this.m_numHandles) {
      console.log(`Wrong array this.m_handleColors: ${this.m_handleColors.length} !== ${this.m_numHandles}`);
    }
  } // end constructor
  render(ctx, xMin, yMin, wScreen, hScreen) {

    this.m_xMin = xMin;
    this.m_yMin = yMin;
    this.m_wScreen = wScreen;
    this.m_hScreen = hScreen;

    const X_MAX = 255;
    const Y_MAX = 1.0;
    const RAD_CIRCLE = Math.floor(wScreen / 50.0);
    this.m_radCircle = RAD_CIRCLE;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000'
    let xPre, yPre;

    // draw lines
    xPre = -1; yPre = -1;
    for (let i = 0; i < this.m_numHandles; i++) {
      const xFunc = this.m_handleX[i];
      const yFunc = this.m_handleY[i];
      const x = xMin + Math.floor(wScreen * xFunc / X_MAX);
      const y = yMin + Math.floor(hScreen - 1 - hScreen * yFunc / Y_MAX);
      this.m_proj[i].x = x;
      this.m_proj[i].y = y;
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(xPre, yPre);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      xPre = x;
      yPre = y;
    } // for (i) all handle points
    // draw ellipses
    for (let i = 0; i < this.m_numHandles; i++) {
      const xFunc = this.m_handleX[i];
      const yFunc = this.m_handleY[i];
      const x = xMin + Math.floor(wScreen * xFunc / X_MAX);
      const y = yMin + Math.floor(hScreen - 1 - hScreen * yFunc / Y_MAX);
      let strRCol = this.m_handleColors[i].r.toString(16);
      let strGCol = this.m_handleColors[i].g.toString(16);
      let strBCol = this.m_handleColors[i].b.toString(16);
      strRCol = (strRCol.length === 1) ? ('0' + strRCol) : strRCol;
      strGCol = (strGCol.length === 1) ? ('0' + strGCol) : strGCol;
      strBCol = (strBCol.length === 1) ? ('0' + strBCol) : strBCol;
      const strColor = `#${strRCol}${strGCol}${strBCol}`;
      // console.log(`strColor = ${strColor}`);
      ctx.fillStyle = strColor;
      ctx.beginPath();
      ctx.ellipse(x, y, RAD_CIRCLE, RAD_CIRCLE, 0.0, 0.0, Math.PI * 2.0);
      ctx.fill();
      ctx.stroke();
    } // for (i) all handle points

  } // end render
  onMouseDown(xScr, yScr) {
    for (let i = 0; i < this.m_numHandles; i++) {
      const dx = xScr - this.m_proj[i].x;
      const dy = yScr - this.m_proj[i].y;
      const dist2 = dx * dx + dy * dy;
      const MIN_DIST_2 = this.m_radCircle * this.m_radCircle;
      if (dist2 <= MIN_DIST_2) {
        console.log(`Picked point ${i}`);
        this.m_mouseDown = true;
        this.m_indexMoved = i;
      }
    }
    return false;
  }
  /**
   * on mouse up even t handler
   * 
   * @param {number} xScr - mouse x position on screen
   * @param {number} yScr - mouse y position on screen
   */
  onMouseUp() {
    this.m_mouseDown = false;
    return false;
  }
  onMouseMove(xScr, yScr) {
    if (this.m_mouseDown) {
      const isBorderPoint = (this.m_indexMoved === 0) || (this.m_indexMoved === this.m_numHandles - 1);
      let xScrNew;
      let yScrNew;
      if (isBorderPoint) {
        xScrNew = this.m_proj[this.m_indexMoved].x;
      } else {
        xScrNew = xScr;
        xScrNew = (xScrNew < this.m_proj[this.m_indexMoved - 1].x) ? this.m_proj[this.m_indexMoved - 1].x : xScrNew;
        xScrNew = (xScrNew > this.m_proj[this.m_indexMoved + 1].x) ? this.m_proj[this.m_indexMoved + 1].x : xScrNew;
      }

      yScrNew = yScr;
      if (yScrNew < this.m_yMin) {
        yScrNew = this.m_yMin;
        // console.log('Clip by min y');
      }
      if (yScrNew > this.m_yMin + this.m_hScreen) {
        yScrNew = this.m_yMin + this.m_hScreen;
        // console.log('Clip by max y');
      }
      this.m_proj[this.m_indexMoved].x = xScrNew;
      this.m_proj[this.m_indexMoved].y = yScrNew;

      const X_MAX = 255;
      const Y_MAX = 1.0;
      const xFunc = (xScrNew - this.m_xMin) * X_MAX / this.m_wScreen;
      const yFunc = (this.m_yMin + this.m_hScreen - 1 - yScrNew) * Y_MAX / this.m_hScreen;
      this.m_handleX[this.m_indexMoved] = xFunc;
      this.m_handleY[this.m_indexMoved] = yFunc;
      return true;
    }
    return false;
  }
}; //end class TransfFunc

export default TransfFunc;
