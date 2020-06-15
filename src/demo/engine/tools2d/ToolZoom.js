/**
 * @fileOverview ToolZoom
 * @author Epam
 * @version 1.0.0
 */


// **********************************************
// Imports
// **********************************************

// import React from 'react';
// import { connect } from 'react-redux';

import StoreActionType from '../../store/ActionTypes';

// **********************************************
// Class
// **********************************************

class ToolZoom {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;

    this.setScreenDim = this.setScreenDim.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.state = {
      mouseDown: false,
      xMouse: 0,
      yMouse: 0,
    };
  }
  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }
  onMouseDown(xScr, yScr) {
    this.state.mouseDown = true;
    this.state.xMouse = xScr;
    this.state.yMouse = yScr;
  }
  onMouseUp() {
    this.state.mouseDown = false;
  }
  onMouseMove(store, xScr, yScr) {
    if (this.state.mouseDown) {
      const dx = xScr - this.state.xMouse;
      const dy = yScr - this.state.yMouse;

      this.state.xMouse = xScr;
      this.state.yMouse = yScr;


      const zoom = store.render2dZoom;
      const dxMove = (dx / this.m_wScreen) * zoom;
      const dyMove = (dy / this.m_hScreen) * zoom;
      // console.log(`dxyMove = ${dxMove}, ${dyMove}`);
      const xPos = store.render2dxPos - dxMove;
      const yPos = store.render2dyPos - dyMove;

      // check new 2d transform is valid (not clipped)
      if ((xPos >= 0.0) && (xPos + zoom <= 1.0) && 
        (yPos >= 0.0) && (yPos + zoom <= 1.0)) {
        store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPos });
        store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPos });
        const gra = store.graphics2d;
        gra.forceUpdate();
      }
    }
  }
  onMouseWheel(store, evt) {
    const delta = Math.max(-1, Math.min(1, (evt.deltaY || -evt.detail)));
    const MULT_STEP = 0.04;
    const step = -delta * MULT_STEP;
    // console.log(`onMouseWheel. step = ${step}`);

    const zoom = store.render2dZoom;
    let zoomNew = zoom + step;
    if (zoomNew > 1.0) {
      zoomNew -= step;
    }
    if (zoomNew <= 0.0) {
      zoomNew += step;
    }
    if (zoomNew !== zoom) {
      const xPos = store.render2dxPos;
      const yPos = store.render2dyPos;
      const xPosNew = xPos - step * 0.5;
      const yPosNew = yPos - step * 0.5;
      // console.log(`onMouseWheel. zoomNew = ${zoomNew}, xyPos = ${xPosNew},${yPosNew}`);
      store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: zoomNew });
      store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew });
      store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew });

      const gra = store.graphics2d;
      gra.forceUpdate();
    }
  } // end on mouse wheel

}
// export default connect(store => store)(ToolZoom);
export default ToolZoom;
