/**
 * @fileOverview ToolArea
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

import Modes2d from '../../store/Modes2d';
import ToolDistance from './ToolDistance';

// **********************************************
// Class
// **********************************************

class ToolArea {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;

    this.m_areas = [];
    this.m_inCreateMode = false;
    this.m_objSelfIntersect = null;

    this.m_xPixelSize = 0;
    this.m_yPixelSize = 0;

    this.m_objEdit = null;
    this.store = null;

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
    this.m_areas = [];
    this.m_inCreateMode = false;
    this.m_objSelfIntersect = null;
  }
  /**
   * Determine intersection with points in areas set.
   * Input - screen coordinates of pick point
   * Output - volume coordinate
   *  
   * @param {object} vScr - screen coordinates of poick
   * @param {object} store - global store
   */
  getEditPoint(vScr, store) {
    this.store = store;
    const numAreas = this.m_areas.length;
    for(let i = 0 ; i < numAreas; i++) {
      const objArea = this.m_areas[i];
      for (let j = 0; j < objArea.m_points.length; j++) {
        const vScrProj = ToolDistance.textureToScreen(objArea.m_points[j].x, objArea.m_points[j].y, this.m_wScreen, this.m_hScreen, store);
        const MIN_DIST = 4.0;
        if (this.getDistMm(vScr, vScrProj) <= MIN_DIST) {
          this.m_objEdit = objArea;
          return objArea.m_points[j];
        } // if too close pick
      } // for (j) all point in area
    } // for (i) all areas
    return null;
  }
  /**
   * Move edited point into new pos
   * 
   * @param {object} vVolOld 
   * @param {object} vVolNew 
   */
  moveEditPoint(vVolOld, vVolNew) {
    const x = vVolOld.x;
    const y = vVolOld.y;
    vVolOld.x = vVolNew.x;
    vVolOld.y = vVolNew.y;
    //const vObjSelfInters = ToolArea.getSelfIntersectPoint(this.m_objEdit.m_points);
    //if (vObjSelfInters !== null) {
    const hasInters = ToolArea.hasSelfIntersection(this.m_objEdit.m_points);
    if (hasInters) {
      // console.log('ToolArea. self inters found');
      vVolOld.x = x;
      vVolOld.y = y;
    }
    // update line len
    const store = this.store;
    this.m_objEdit.m_area = this.getPolyArea(this.m_objEdit.m_points, store);
  }
  /**
   * Remove highlighted object
   */
  deleteObject() {
    if (this.m_objEdit != null) {
      const ind = this.m_areas.indexOf(this.m_objEdit);
      if (ind >= 0) {
        this.m_areas.splice(ind, 1);
      }
    }
  }
  getDistMm(vs, ve) {
    const dx = vs.x - ve.x;
    const dy = vs.y - ve.y;
    const dist = Math.sqrt(dx * dx * this.m_xPixelSize * this.m_xPixelSize +
      dy * dy * this.m_yPixelSize * this.m_yPixelSize);
    return dist;
  }
  /**
   * Get lines intersection in 2d
   * 
   * @param {object} v0 
   * @param {object} v1 
   * @param {object} v2 
   * @param {object} v3 
   * @return {object} point (object with x,y) of intersection or null
   */
  static getLineIntersection(v0, v1, v2, v3) {
    const v23 = {
      x: v3.x - v2.x,
      y: v3.y - v2.y,
    };
    const n23 = {
      x: -v23.y,
      y: v23.x,
    };
    const v01 = {
      x: v1.x - v0.x,
      y: v1.y - v0.y,
    };
    const v02 = {
      x: v2.x - v0.x,
      y: v2.y - v0.y,
    };
    const dotUp = v02.x * n23.x + v02.y * n23.y;
    const dotDn = v01.x * n23.x + v01.y * n23.y;
    const TOO_SMALL = 1.0e-6;
    if (Math.abs(dotDn) < TOO_SMALL) {
      return null;
    }
    const t01 = dotUp / dotDn; // should be in [0..1]
    if ((t01 < 0.0) || (t01 > 1.0)) {
      return null;
    }
    // check intersect from 2nd line
    const v20 = {
      x: -v02.x,
      y: -v02.y,
    };
    const n01 = {
      x: -v01.y,
      y: v01.x
    };
    const dotProdDn = v23.x * n01.x + v23.y * n01.y;
    if (Math.abs(dotProdDn) < TOO_SMALL) {
      return null;
    }
    const dotProdUp = v20.x * n01.x + v20.y * n01.y;
    const t23 = dotProdUp / dotProdDn; // should be in [0..1]
    if ((t23 < 0.0) || (t23 > 1.0)) {
      return null;
    }
    const vIntersection = {
      x: v0.x + v01.x * t01,
      y: v0.y + v01.y * t01
    };
    return vIntersection;
  }
  static hasSelfIntersection(points) {
    let i, j;
    for (i = 0; i < points.length; i++) {
      const iNext = (i + 1 < points.length) ? (i + 1) : 0;
      const vA = points[i];
      const vB = points[iNext];
      for (j = 0; j < points.length; j++) {
        const jNext = (j + 1 < points.length) ? (j + 1) : 0;
        if ((i !== j) && (i !== jNext) && (iNext !== j) && (iNext !== jNext)) {
          const vC = points[j];
          const vD = points[jNext];
          const vIntersect = ToolArea.getLineIntersection(vA, vB, vC, vD);
          if (vIntersect !== null) {
            return true;
          }
        } // if not same index
        
      } // for (j)
    } // for (i)
    return false;
  }
  static getSelfIntersectPoint(points) {
    const numPoints = points.length;
    if (numPoints <= 3) {
      return null;
    }
    const vLast0 = points[numPoints - 2];
    const vLast1 = points[numPoints - 1];
    const limPoints = numPoints - 3;
    for (let i = 0; i < limPoints; i++) {
      const vLine0 = points[i + 0];
      const vLine1 = points[i + 1];
      const vIntersect = ToolArea.getLineIntersection(vLast0, vLast1, vLine0, vLine1);
      if (vIntersect !== null) {
        const objInter = {
          m_vIntersection: vIntersect,
          m_lineIndex: i
        }
        return objInter;
      }
    } // for (i) checked points in poly
    // check dist to first
    const dx = vLast1.x - points[0].x;
    const dy = vLast1.y - points[0].y;
    const MIN_DIST = 2.5;
    const MIN_DIST_SQ = MIN_DIST * MIN_DIST;
    if (dx * dx + dy * dy <= MIN_DIST_SQ) {
      const vInter = {
        x: vLast1.x,
        y: vLast1.y,
      };
      const objInter = {
        m_vIntersection: vInter,
        m_lineIndex: 0
      }
      // console.log('getSelfIntersection: detect with start');
      return objInter;
    }
    return null;
  }
  /**
   * 
   * @param {object} vNew - new added point
   * @param {array} points - array of polygon's points
   * @return true, if polygon is finished
   */
  addPointToPolygon(vNew, points) {
    const numPoints = points.length;
    if (numPoints === 0) {
      points.push(vNew);
      return false;
    }
    const objInter = this.m_objSelfIntersect;
    if (objInter !== null) {
      const polyNew = [];
      polyNew.push(objInter.m_vIntersection);
      for (let i = objInter.m_lineIndex + 1; i < numPoints - 1; i++) {
        const vAdd = {
          x: points[i].x,
          y: points[i].y
        }
        polyNew.push(vAdd);
      }
      // copy to points
      points.length = polyNew.length;
      for (let i = 0; i < polyNew.length; i++) {
        points[i].x = polyNew[i].x;
        points[i].y = polyNew[i].y;
      }
      this.m_objSelfIntersect = null;
      return true;
    } // if has some intersect point

    // just add point to poly
    points.push(vNew);
    return false;
  }
  /**
   * 
   * @param {array} points - array of points (x,y) props
   */
  getPolyArea(points, store) {
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
    // const zDim = vol.m_zDim;
    let xScale = 0.0, yScale = 0.0;
    if (mode2d === Modes2d.TRANSVERSE) {
      // z const
      xScale = xSize / xDim;
      yScale = ySize / yDim;
    } else if (mode2d === Modes2d.SAGGITAL) {
      // x const
      xScale = ySize / xDim;
      // yScale = zSize / yDim;
      yScale = zSize / zDim;
    } else {
      // y const
      xScale = xSize / xDim;
      // yScale = zSize / yDim;
      yScale = zSize / zDim;
    }

    let area = 0.0;
    const numPoints = points.length;
    let j = numPoints - 1;
    for (let i = 0; i < numPoints; i++) {
      const vi = points[i];
      const vj = points[j];
      let areaTri = (vj.x + vi.x) * (vj.y - vi.y) * xScale * yScale;
      areaTri = (areaTri > 0.0) ? areaTri : (-areaTri);
      area += areaTri;
      j = i;
    }
    return area * 0.5;
  }
  /**
   * When mouse button is pressed
   * 
   * @param {number} xScr - x screen coordinate
   * @param {number} yScr - y screen coordinate
   * @param {object} store  - global store with all app parameters
   */
  onMouseDown(xScr, yScr, store) {
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    if (!this.m_inCreateMode) {
      this.m_inCreateMode = true;
      // create new area
      const v0 = {
        x: vTex.x,
        y: vTex.y,
      }
      const v1 = {
        x: vTex.x,
        y: vTex.y,
      }
      const objArea = {
        m_isClosed: false,
        m_points: [],
        m_area: 0.0
      };
      objArea.m_points.push(v0);
      objArea.m_points.push(v1);
      this.m_areas.push(objArea);
    } else {
      // add new point to polygon
      const vNew = {
        x: vTex.x,
        y: vTex.y
      };
      const numAreas = this.m_areas.length;
      const objArea = this.m_areas[numAreas - 1];

      const isFinished = this.addPointToPolygon(vNew, objArea.m_points);
      if (isFinished) {
        objArea.m_isClosed = true;
        objArea.m_area = this.getPolyArea(objArea.m_points, store);
        console.log(`ToolArea. area = ${objArea.m_area}`);
        // prepare to new added polygon
        this.m_inCreateMode = false;
      }
    }
  }
  /**
   * When mouse is moved
   * 
   * @param {number} xScr - x screen coordinate
   * @param {number} yScr - y screen coordinate
   * @param {object} store  - global store with all app parameters
   */
  onMouseMove(xScr, yScr, store) {
    if (!this.m_inCreateMode) {
      return;
    }
    const vTex = ToolDistance.screenToTexture(xScr, yScr, this.m_wScreen, this.m_hScreen, store);
    // modify last point in last area
    const numAreas = this.m_areas.length;
    const objArea = this.m_areas[numAreas - 1];
    const numPoints = objArea.m_points.length;
    objArea.m_points[numPoints - 1].x = vTex.x;
    objArea.m_points[numPoints - 1].y = vTex.y;
    const pt = ToolArea.getSelfIntersectPoint(objArea.m_points);
    this.m_objSelfIntersect = pt;
    this.m_objGraphics2d.forceUpdate();
  }
  onMouseUp() { // ommited args: xScr, yScr, store
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

    // render possible self intersect point
    if (this.m_objSelfIntersect !== null) {
      const vTex = this.m_objSelfIntersect.m_vIntersection;
      const vScr = ToolDistance.textureToScreen(vTex.x, vTex.y, this.m_wScreen, this.m_hScreen, store);
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      const RAD_CIRCLE = 5.0;
      const M_PI = 3.1415926535;
      const TWO = 2;
      ctx.arc(vScr.x, vScr.y, RAD_CIRCLE, 0.0, TWO * M_PI);
      ctx.stroke();

    }

    ctx.strokeStyle = 'yellow';
    const numAreas = this.m_areas.length;
    for (let a = 0; a < numAreas; a++) {
      const objArea = this.m_areas[a];
      const isClosed = objArea.m_isClosed;
      const numPoints = (isClosed) ? (objArea.m_points.length + 1) : (objArea.m_points.length);
      // console.log(`ToolArea. render ${numPoints} points in poly`);

      // calc area centroid in screen
      let xScrCenter = 0.0;
      let yScrCenter = 0.0;

      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const iPoly = (i < objArea.m_points.length) ? (i) : 0;
        const vTex0 = objArea.m_points[iPoly];
        // console.log(`ToolArea. render point ${vTex0.x}, ${vTex0.y} `);
        const vScr = ToolDistance.textureToScreen(vTex0.x, vTex0.y, this.m_wScreen, this.m_hScreen, store);
        if (i === 0) {
          ctx.moveTo(vScr.x, vScr.y);
        } else {
          ctx.lineTo(vScr.x, vScr.y);
        }
        xScrCenter += vScr.x;
        yScrCenter += vScr.y;
      } // for (i) all points in poly
      ctx.stroke();

      if (numPoints > 0) {
        xScrCenter /= numPoints;
        yScrCenter /= numPoints;
      }

      // draw area
      if (isClosed) {
        const strMsg = objArea.m_area.toFixed(2) + ' mm^2';
        // const SHIFT_UP = 8;
        //const vTex0 = objArea.m_points[0];
        //const vs0 = ToolDistance.textureToScreen(vTex0.x, vTex0.y, this.m_wScreen, this.m_hScreen, store);
        //const xText = vs0.x;
        //const yText = vs0.y - SHIFT_UP;
        // ctx.fillText(strMsg, xText, yText);

        ctx.fillText(strMsg, xScrCenter, yScrCenter);
      } // if this poly closed
    } // for (a) all polys
  }

} // end class
export default ToolArea;
