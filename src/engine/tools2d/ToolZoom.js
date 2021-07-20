/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import StoreActionType from '../../store/ActionTypes';

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
        // store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPos });
        // store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPos });
        const gra = store.graphics2d;
        gra.forceUpdate();
      }
    }
  }
  
  onMouseWheel(store, evt) {
    const step = evt.deltaY * 2 ** (-16);

    console.log(`onMouseWheel.evt = ${{ evt }}`);
    console.log(`onMouseWheel.store = ${{ store }}`);
    
    const zoom = store.render2dZoom;
    let zoomNew = zoom + step;
    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;
    const xPosNew = xPos - step;
    const yPosNew = yPos - step;
    // console.log(`onMouseWheel. zoom = ${zoom} zoomNew = ${zoomNew}, xyPos = ${xPosNew},${yPosNew}`);
    if (Math.abs(zoomNew) > 1) {
      return;
    }
    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: zoomNew });
    store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew - step / 2 });
    store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew - step / 2 });
    
    store.graphics2d.forceUpdate();
  } // end on mouse wheel
  
}

// export default connect(store => store)(ToolZoom);
export default ToolZoom;
