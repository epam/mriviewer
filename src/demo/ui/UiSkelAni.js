/**
 * @fileOverview UiSkelAni
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiSkelAni some text later...
 */
class UiSkelAni extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    this.animate = this.animate.bind(this);

    this.m_mount = null;
    this.m_frameId = null;

  }
  animate() {
    this.renderWithCtx();
    this.m_frameId = window.requestAnimationFrame(this.animate);
  }
  start() {
    if (this.m_frameId === null) {
      this.m_frameId = requestAnimationFrame(this.animate);
    }
  }
  stop() {
    cancelAnimationFrame(this.m_frameId);
    this.m_frameId = null;
  }
  componentDidMount() {
    // console.log('UiSkelAni. start animations');
    this.start();
  }
  componentWillUnmount() {
    // console.log('UiSkelAni. stop animations');
    this.stop();
  }
  /**
   * Main component render func callback
   */
  render() {
    const strStyle = {
      border: '0px solid black'
    };
    const jsxAni = <canvas className="img-responsive" style={strStyle} ref={ (mount) => {this.m_mount = mount} } min-width="240px" width="240px" height="200px" />
    return jsxAni;
  } // end render
  /**
   * Draw center part of lungs pixtre
   * 
   * @param {object} ctx 
   * @param {number} w - screen width
   * @param {number} h - screen heigth
   * @param {number} timeCur - current time
   */
  drawCentral(ctx, w, h, timeCur) {
    ctx.strokeStyle = 'rgb(190, 190, 190)';
    ctx.lineWidth = 4;
    const w2 = Math.floor(w * 0.5);

    const W_REF = 240.0;
    const H_REF = 200.0;

    const Y_SPINE_LINE_TOP = 88.0;
    const Y_SPINE_MARK_TOP = 131.0;
    const Y_SPINE_BOT = 195.0;

    ctx.beginPath();
    ctx.moveTo(w2, Math.floor(h * Y_SPINE_BOT / H_REF));
    ctx.lineTo(w2, Math.floor(h * Y_SPINE_LINE_TOP / H_REF));
    ctx.stroke();

    const MARK_WIDTH = w * 20.0 / W_REF;
    const NUM_SPINE_MARKS = 5;
    for (let i = 0; i <= NUM_SPINE_MARKS; i++) {
      const tHeight = i / NUM_SPINE_MARKS;
      const y = Math.floor(Y_SPINE_MARK_TOP + (Y_SPINE_BOT - Y_SPINE_MARK_TOP) * tHeight);

      const TIME_MULT = 0.0008;
      const PHASE_MULT = 3.1415926 * 0.4;
      const timeArg = timeCur * TIME_MULT + (tHeight * PHASE_MULT);
      const wCur = Math.floor(MARK_WIDTH * 0.2 + 0.8 * MARK_WIDTH * Math.cos(timeArg));

      ctx.beginPath();
      ctx.moveTo(w2 - wCur * 0.5, y);
      ctx.lineTo(w2 + wCur * 0.5, y);
      ctx.stroke();
    } // for u all marks on vert spine

    // draw top "heart" shape

    const shp = [
      112, 89,
      112, 81,
      112, 62,
      112, 49,
      113, 36,
      104, 31,
      94, 32,
      94, 20,
      96, 8,
      108, 8,
      112, 11,
      120, 12,
      128, 11,
      132, 8,
      146, 8,
      146, 20,
      146, 32,
      136, 31,
      127, 36,
      128, 49,
      128, 62,
      128, 81,
      128, 89,
      119, 88
    ];
    const numPointsInShape = Math.floor(shp.length / 2);
    const numCurves2nd = Math.floor(numPointsInShape / 2);

    ctx.fillStyle = 'rgb(255, 210, 210)';
    ctx.beginPath();
    ctx.moveTo(w2, Math.floor(h * Y_SPINE_LINE_TOP / H_REF));
    let j = 0;
    for (let s = 0; s < numCurves2nd; s++, j += 4) {
      const x1 = Math.floor(w * shp[j + 0] / W_REF);
      const y1 = Math.floor(h * shp[j + 1] / H_REF);
      const x2 = Math.floor(w * shp[j + 2] / W_REF);
      const y2 = Math.floor(h * shp[j + 3] / H_REF);
      ctx.quadraticCurveTo(x1, y1, x2, y2);
    }
    ctx.stroke();
    ctx.fill();
  } // draw central
  /**
   * Transform pic coords to screen coords with current object center (xHeart, yHeart) ,
   * scale and mirror feature
   * 
   * @param {*} xHeart 
   * @param {*} yHeart 
   * @param {*} scale 
   * @param {*} isMirroredX 
   * @param {*} x 
   * @param {*} y 
   * @param {*} vec 
   */
  static vecTransform(xHeart, yHeart, scale, isMirroredX, x, y, vec) {
    const X_HEART = 178.0;
    const Y_HEART = 112.0;
    const xRelCenter = (isMirroredX) ? (X_HEART - x) : (x - X_HEART);
    const yRelCenter = (y - Y_HEART);
    vec.x = xHeart + (xRelCenter * scale);
    vec.y = yHeart + (yRelCenter * scale);
  }
  /**
   * Draw small leave near line segment of blood vessel
   * 
   * @param {object} ctx 
   * @param {number} x0 - first point, x coordinate
   * @param {number} y0 - first point, y coordinate
   * @param {number} x1 - second point, x coordinate
   * @param {number} y1 - second point, y coordinate
   * @param {number} index - index of point in set
   */
  static drawLeave(ctx, x0, y0, x1, y1, index) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const ang = ((index & 1) === 0) ? (25.0 * 3.14 / 180.0) : -(25.0 * 3.14 / 180.0);
    const vx = dx * Math.cos(ang) - dy * Math.sin(ang);
    const vy = dx * Math.sin(ang) + dy * Math.cos(ang);
    const xc = Math.floor((x0 + x1) * 0.5);
    const yc = Math.floor((y0 + y1) * 0.5);

    const MULT = 0.8;

    ctx.beginPath();
    ctx.moveTo(xc, yc);
    ctx.lineTo(Math.floor(xc + vx * MULT), Math.floor(yc + vy * MULT));
    ctx.stroke();
  }
  /**
   * Render single heart
   * 
   * @param {object} ctx - context to render 2d
   * @param {number} w - screen width
   * @param {number} h - screen height
   * @param {number} xHeart - center x of heart
   * @param {number} yHeart - xenter y of heart
   * @param {boolean} isMirroredX - is right (non mirrored)
   * @param {number} scale - value in [0.5 .. 1.0]
   * @param {number} animParam - value in [0..1]
   */
  drawHeart(ctx, w, h, xHeart, yHeart, isMirroredX, scale, animParam) {
    const W_REF = 240.0;
    const H_REF = 200.0;
    const hp = [
      186, 195,
      179, 195,
      171, 188,
      149, 166,
      132, 126,
      123, 111,
      131, 100,
      145, 78,
      145, 60,
      150, 47,
      159, 50,
      184, 56,
      203, 49,
      213, 41,
      217, 51,
      226, 77,
      218, 104,
      208, 134,
      208, 158,
      207, 167,
      203, 175,
      196, 195,
      186, 195,
    ];
    const numLines = Math.floor((hp.length - 1) / 2);
    const vec0 = { x: 0.0, y: 0.0 };
    const vec1 = { x: 0.0, y: 0.0 };

    UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, hp[0], hp[1], vec0);
    UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, hp[13 * 2 + 0], hp[13 * 2 + 1], vec1);
    const gx0 = Math.floor(w * vec0.x / W_REF);
    const gy0 = Math.floor(h * vec0.y / H_REF);
    const gx1 = Math.floor(w * vec1.x / W_REF);
    const gy1 = Math.floor(h * vec1.y / H_REF);

    const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    grad.addColorStop(0.0, 'rgb(86, 0, 0)');
    grad.addColorStop(1.0, 'rgb(255, 170, 170)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, hp[0], hp[1], vec0);
    const x0 = Math.floor(w * vec0.x / W_REF);
    const y0 = Math.floor(h * vec0.y / H_REF);

    ctx.moveTo(x0, y0);
    let j = 2;
    for (let i = 0; i < numLines; i++, j += 4) {
      UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, hp[j + 0], hp[j + 1], vec0);
      UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, hp[j + 2], hp[j + 3], vec1);

      const x0 = Math.floor(w * vec0.x / W_REF);
      const y0 = Math.floor(h * vec0.y / H_REF);
      const x1 = Math.floor(w * vec1.x / W_REF);
      const y1 = Math.floor(h * vec1.y / H_REF);
      ctx.quadraticCurveTo(x0, y0, x1, y1);
    } // for (i) all points
    ctx.stroke();
    ctx.fill();

    // draw blood vessels
    const vessel0 = [
      151, 75,
      154, 68,
      155, 61,
      151, 55
    ];
    const vessel1 = [
      145, 89,
      156, 86, 
      165, 82,
      172, 77,
      177, 69,
      177, 61
    ];
    const vessel2 = [
      143, 100,
      157, 101,
      168, 98,
      179, 94,
      186, 87,
      192, 80,
      197, 76,
      205, 75
    ];
    const vessel3 = [
      146, 109,
      160, 107,
      172, 107,
      183, 112,
      192, 119,
      199, 125,
      200, 130,
      198, 137,
      195, 142,
      189, 144
    ];
    const vessel4 = [
      145, 123,
      160, 124,
      171, 128,
      178, 138,
      183, 151,
      184, 160,
      181, 168
    ];
    const vessel5 = [
      149, 142,
      161, 146,
      167, 153,
      171, 158,
      171, 164
    ];
    const vessels = [
      vessel0, vessel1, vessel2, vessel3, vessel4, vessel5
    ];
    const strAlpha = animParam.toFixed(2);
    const strColor = 'rgba(180, 180, 180, ' + strAlpha + ')';
    // console.log(`strColor = ${strColor}`);
    ctx.strokeStyle = strColor;
    ctx.lineWidth = 1;

    const numVessels = vessels.length;
    for (let v = 0; v < numVessels; v++) {
      const ves = vessels[v];
      const numPoints = ves.length;
      ctx.beginPath();

      let j = 0;
      for (let i = 0; i < numPoints; i++, j += 2) {
        UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, ves[j + 0], ves[j + 1], vec0);
        const x0 = Math.floor(w * vec0.x / W_REF);
        const y0 = Math.floor(h * vec0.y / H_REF);
        if (i === 0) {
          ctx.moveTo(x0, y0);
        } else {
          ctx.lineTo(x0, y0);
        } // if not first
      } // for (i) all points
      ctx.stroke();

      let xp = -1;
      let yp = -1;
      j = 0;
      for (let i = 0; i < numPoints; i++, j += 2) {
        UiSkelAni.vecTransform(xHeart, yHeart, scale, isMirroredX, ves[j + 0], ves[j + 1], vec0);
        const x0 = Math.floor(w * vec0.x / W_REF);
        const y0 = Math.floor(h * vec0.y / H_REF);
        if (i === 0) {
        } else {
          UiSkelAni.drawLeave(ctx, xp, yp, x0, y0, i);
        } // if not first
        xp = x0; yp = y0;
      } // for (i) all points


    } // for (v) all vessels

  } // draw heart
  /**
   * Render scene on canvas
   */
  renderWithCtx() {
    const objCanvas = this.m_mount;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext('2d');
    const w = objCanvas.clientWidth;
    const h = objCanvas.clientHeight;
    if (w * h === 0) {
      return;
    }
    // console.log(`UiSkelAni. renderCtx. screen = ${w} * ${h}`);
    // clerar all screen
    ctx.fillStyle = 'rgb(250, 250, 250)';
    ctx.fillRect(0,0, w, h);

    const timeCur = Date.now();
    this.drawCentral(ctx, w, h, timeCur);

    const MULT_SCALE = 0.001;
    const PHASE_SCALE = 3.14 * 0.5;
    const lAnim = Math.abs( Math.cos(timeCur * MULT_SCALE)  );
    const lScale = 0.6 + 0.4 * lAnim;
    const rAnim = Math.abs( Math.cos((timeCur * MULT_SCALE) + PHASE_SCALE) );
    const rScale = 0.6 + 0.4 * rAnim;
    // console.log(`UiSkelAni. lScale = ${lScale}, rScale = ${rScale}`);
    
    const X_HEART_R = 178.0;
    const Y_HEART_R = 112.0;
    const NOT_MIRR = false;
    this.drawHeart(ctx, w, h, X_HEART_R, Y_HEART_R, NOT_MIRR, rScale, rAnim);

    const X_HEART_L = 120.0 - 58.0;
    const Y_HEART_L = 112.0;
    const IS_MIRR = true;
    this.drawHeart(ctx, w, h, X_HEART_L, Y_HEART_L, IS_MIRR, lScale, lAnim);

  } // end of render

} // end class

export default connect(store => store)(UiSkelAni);
