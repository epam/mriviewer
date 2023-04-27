/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

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
      if (xPos >= 0.0 && xPos + zoom <= 1.0 && yPos >= 0.0 && yPos + zoom <= 1.0) {
        const gra = store.graphics2d;
        gra.forceUpdate();
      }
    }
  }
}

// export default connect(store => store)(ToolZoom);
export default ToolZoom;
