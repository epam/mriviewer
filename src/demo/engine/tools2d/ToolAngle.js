/**
 * @fileOverview ToolAngle
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

// import Modes2d from '../../store/Modes2d';
import ToolDistance from './ToolDistance';

// **********************************************
// Class
// **********************************************

class ToolAngle {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;
    this.m_volume = null;

    const v0 = {
      x: 0.0, y: 0.0
    };
    const v1 = {
      x: 0.0, y: 0.0
    };
    const v2 = {
      x: 0.0, y: 0.0
    };
    this.m_points = [ v0, v1, v2 ];
    this.m_numClicks = 0;
    this.m_angles = [];

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render = this.render.bind(this);
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
  getAngle() {
    const v1x = this.m_points[1].x - this.m_points[0].x;
    const v1y = this.m_points[1].y - this.m_points[0].y;
    const v2x = this.m_points[2].x - this.m_points[0].x;
    const v2y = this.m_points[2].y - this.m_points[0].y;
    const dotProd = v1x * v2x + v1y * v2y;
    const v1len = Math.sqrt(v1x * v1x + v1y * v1y);
    const v2len = Math.sqrt(v2x * v2x + v2y * v2y);
    const cosAlp = dotProd / (v1len * v2len);
    const M_180 = 180.0;
    const M_PI = 3.1415926535;
    if (cosAlp > 1.0) {
      // console.log('get Angle > 1');
      return 0.0;
    }
    if (cosAlp < -1.0) {
      // console.log('get Angle < -1');
      return 180.0;
    }
    const ang = Math.acos(cosAlp) * M_180 / M_PI;
    return ang;
  }
  onMouseDown(xScr, yScr, store) {
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    if (this.m_numClicks === 0) {
      // assign all 3 points at the same place
      for (let i = 0; i < 3; i++) {
        this.m_points[i].x = vTex.x;
        this.m_points[i].y = vTex.y;
      }

      this.m_numClicks++;
      // console.log('1st click: add 3 points');
    } else if (this.m_numClicks === 1) {
      this.m_numClicks++;
      // console.log(`2st click: points are: ${this.m_points[0].x}, ${this.m_points[0].y} -> ${this.m_points[1].x}, ${this.m_points[1].y}`);
    } else {
      console.log('3rd click: finalize angle');
      // this.m_numClicks === 2
      const v0 = {
        x: this.m_points[0].x,
        y: this.m_points[0].y,
      };
      const v1 = {
        x: this.m_points[1].x,
        y: this.m_points[1].y,
      };
      const v2 = {
        x: this.m_points[2].x,
        y: this.m_points[2].y,
      };
      const ang = this.getAngle();

      const objAngle = {
        points: [ v0, v1, v2 ],
        angle: ang,
      };
      this.m_angles.push(objAngle);
      this.m_numClicks = 0;
    }
  }
  onMouseMove(xScr, yScr, store) {
    if (this.m_numClicks === 0) {
      return;
    }
    // modify point in points array
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    const NUM_3 = 3;
    for (let idx = this.m_numClicks; idx < NUM_3; idx++) {
      this.m_points[idx].x = vTex.x;
      this.m_points[idx].y = vTex.y;
      // console.log(`onMouseMove. modify point[${idx}]: now = ${vTex.x}, ${vTex.y}`);
    }
    // invoke redraw
    this.m_objGraphics2d.forceUpdate();
  }
  onMouseUp(xScr, yScr, store) {
  }
  clear() {
    this.m_angles = [];
    this.m_numClicks = 0;
  }
  //
  // render lines on screen
  // 
  render(ctx, store) {
    const NUM_3 = 3;

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'yellow';
    ctx.fillStyle = 'white';
    const FONT_SZ = 16;
    ctx.font = FONT_SZ.toString() + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (this.m_numClicks > 0) {
      for(let i = 1; i < NUM_3; i++) {
        const vTex0 = this.m_points[0];
        const vTex1 = this.m_points[i];
        const vs = ToolDistance.textureToScreen(vTex0.x, vTex0.y, this.m_wScreen, this.m_hScreen, store);
        const ve = ToolDistance.textureToScreen(vTex1.x, vTex1.y, this.m_wScreen, this.m_hScreen, store);
        const dx = vs.x - ve.x;
        const dy = vs.y - ve.y;
        const MIN_DIST2 = 2 * 2;
        if ((dx * dx) + (dy * dy) >= MIN_DIST2) {
          ctx.beginPath();
          ctx.moveTo(vs.x, vs.y);
          ctx.lineTo(ve.x, ve.y);
          ctx.stroke();
        } // if line is not degradate to point
      } // for all 3 vertices
      // draw angle
      let ang = 0.0;
      if (this.m_numClicks >= 2) {
        ang = this.getAngle();
      }
      const strMsg = ang.toFixed(3) + '°';
      const vTex0 = this.m_points[0];
      const vs0 = ToolDistance.textureToScreen(vTex0.x, vTex0.y, this.m_wScreen, this.m_hScreen, store);
      const SHIFT_UP = 8;
      const xText = vs0.x;
      const yText = vs0.y + SHIFT_UP;
      ctx.fillText(strMsg, xText, yText);

    } // if we have angle under build

    // draw ready angles
    const numAngles = this.m_angles.length;
    for (let a = 0; a < numAngles; a++) {
      const objAngle = this.m_angles[a];
      for (let i = 1; i < NUM_3; i++) {
        const vTex0 = objAngle.points[0];
        const vTex1 = objAngle.points[i];
        const vs = ToolDistance.textureToScreen(vTex0.x, vTex0.y, this.m_wScreen, this.m_hScreen, store);
        const ve = ToolDistance.textureToScreen(vTex1.x, vTex1.y, this.m_wScreen, this.m_hScreen, store);
        ctx.beginPath();
        ctx.moveTo(vs.x, vs.y);
        ctx.lineTo(ve.x, ve.y);
        ctx.stroke();
      } // for points in angle
      // draw angle
      const strMsg = objAngle.angle.toFixed(3) + '°';
      const vTex0 = objAngle.points[0];
      const vs0 = ToolDistance.textureToScreen(vTex0.x, vTex0.y, this.m_wScreen, this.m_hScreen, store);
      const SHIFT_UP = 8;
      const xText = vs0.x;
      const yText = vs0.y + SHIFT_UP;
      ctx.fillText(strMsg, xText, yText);

    } // for all angles
  } // end render


} // end class
export default ToolAngle;

