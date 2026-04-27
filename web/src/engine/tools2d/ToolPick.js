/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview ToolPick
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

class ToolPick {
  constructor(objGra) {
    this.m_objGraphics2d = objGra;
    this.m_wScreen = 0;
    this.m_hScreen = 0;
    this.m_strMessageOnClick = '';
    this.m_strMessageOnMove = '';
    this.m_xMessage = 0;
    this.m_yMessage = 0;
    this.m_timeStart = 0;

    this.onTimerEnd = this.onTimerEnd.bind(this);
  }

  setScreenDim(wScr, hScr) {
    this.m_wScreen = wScr;
    this.m_hScreen = hScr;
  }

  /**
   * @param {number} xScr - relative x screen position. In [0..1]
   * @param {number} yScr - relative y screen position. In [0..1]
   * @param {object} store - global parameters store
   * @return object with props x,y,z - texture coordinates
   */
  screenToTexture(xScr, yScr, store) {
    const vTex = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
    const mode2d = store.mode2d;
    const sliderPosition = store.sliceRatio;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const objCanvas = store.graphics2d.m_mount.current;
    const canvasRect = objCanvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    const centerX = (canvasWidth - store.graphics2d.imgData.width) / 2;
    const centerY = (canvasHeight - store.graphics2d.imgData.height) / 2;
    const xPos = (store.render2dxPos - centerX) / store.graphics2d.imgData.width;
    const yPos = (store.render2dyPos - centerY) / store.graphics2d.imgData.height;
    const zoom = store.render2dZoom;

    if (mode2d === Modes2d.TRANSVERSE) {
      // z: const
      vTex.x = Math.floor((xPos + xScr * zoom) * xDim);
      vTex.y = Math.floor((yPos + yScr * zoom) * yDim);
      vTex.z = Math.floor(sliderPosition * zDim);
    }
    if (mode2d === Modes2d.SAGGITAL) {
      // x: const
      vTex.x = Math.floor(sliderPosition * xDim);
      vTex.y = Math.floor((xPos + xScr * zoom) * yDim);
      vTex.z = Math.floor((yPos + yScr * zoom) * zDim);
    }
    if (mode2d === Modes2d.CORONAL) {
      // y: const
      vTex.x = Math.floor((xPos + xScr * zoom) * xDim);
      vTex.y = Math.floor(sliderPosition * yDim);
      vTex.z = Math.floor((yPos + yScr * zoom) * zDim);
    }
    return vTex;
  }

  getMessageText(xScr, yScr, store) {
    if (this.m_wScreen === 0 || this.m_hScreen === 0) {
      console.log('ToolPick. onMouseDown. Bad screen size');
      return;
    }
    const xRatioImage = xScr / this.m_wScreen;
    const yRatioImage = yScr / this.m_hScreen;
    const vTex = this.screenToTexture(xRatioImage, yRatioImage, store);

    const volSet = store.volumeSet;
    const vol = volSet.getVolume(store.volumeIndex);
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;

    if (vTex.x < 0 || vTex.y < 0 || vTex.z < 0 || vTex.x >= vol.m_xDim || vTex.y >= vol.m_yDim) {
      return 'x: 0  y: 0  z: 0  val: 0';
    }
    /*
    if (mode2d === Modes2d.SAGGITAL) {
      // x
      xVol = Math.floor(sliderPosition * (this.m_volume.m_xDim - 1));
      yVol = Math.floor(xRatioImage * (this.m_volume.m_yDim - 1));
      zVol = Math.floor(yRatioImage * (this.m_volume.m_zDim - 1));
    } else if (mode2d === Modes2d.CORONAL) {
      // y
      xVol = Math.floor(xRatioImage * (this.m_volume.m_xDim - 1));
      yVol = Math.floor(sliderPosition * (this.m_volume.m_yDim - 1));
      zVol = Math.floor(yRatioImage * (this.m_volume.m_zDim - 1));
    } else if (mode2d === Modes2d.TRANSVERSE) {
      // z
      xVol = Math.floor(xRatioImage * (this.m_volume.m_xDim - 1));
      yVol = Math.floor(yRatioImage * (this.m_volume.m_yDim - 1));
      zVol = Math.floor(sliderPosition * (this.m_volume.m_zDim - 1));
    }
    const off = xVol + (yVol * this.m_volume.m_xDim) + (zVol * this.m_volume.m_xDim * this.m_volume.m_yDim);
    */

    const ONE = 1;
    const FOUR = 4;
    const bpp = vol.m_bytesPerVoxel;
    let off = vTex.x + vTex.y * xDim + vTex.z * xDim * yDim;
    let val = 0;
    if (bpp === ONE) {
      val = vol.m_dataArray[off];
    } else if (bpp === FOUR) {
      off = off * FOUR;
      val = vol.m_dataArray[off];
    }
    return `x: ${vTex.x.toString()}  y: ${vTex.y.toString()}  z: ${vTex.z.toString()}  val: ${val.toString()}`;
  }

  onMouseDown(xScr, yScr, store) {
    const message = this.getMessageText(xScr, yScr, store);
    if (!message) return;
    this.m_strMessageOnClick = message;
    this.m_xMessage = xScr;
    this.m_yMessage = yScr;
    this.m_timeStart = Date.now();
    setTimeout(this.onTimerEnd, 6000);
  } // end onMouseDown

  onMouseMove(xScr, yScr, store) {
    const message = this.getMessageText(xScr, yScr, store);
    if (!message) return;
    this.m_strMessageOnMove = message;
  }

  onTimerEnd() {
    this.m_objGraphics2d.forceUpdate();
  }

  render(ctx) {
    ctx.fillStyle = 'white';
    const FONT_SZ = 16;
    ctx.font = FONT_SZ.toString() + 'px Arial';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText(this.m_strMessageOnMove, 0, this.m_hScreen);

    if (this.m_timeStart === 0) {
      return;
    }
    const TIME_SHOW_MS = 1200;
    const timeCur = Date.now();
    const timeDelta = timeCur - this.m_timeStart;
    // console.log(`ToolPick. dt = ${timeDelta}`);
    if (timeDelta < TIME_SHOW_MS) {
      // render message
      // console.log('ToolPick. Render message on ctx');
      const sizeTextRect = ctx.measureText(this.m_strMessageOnClick);
      // console.log(`ToolPick. draw text. x = ${this.m_xMessage}, szRect = ${sizeTextRect.width}, wScr = ${this.m_wScreen}`);
      if (this.m_xMessage + sizeTextRect.width < this.m_wScreen) {
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'right';
      }
      if (this.m_yMessage + FONT_SZ < this.m_hScreen) {
        ctx.textBaseline = 'top';
      } else {
        ctx.textBaseline = 'bottom';
      }

      ctx.fillText(this.m_strMessageOnClick, this.m_xMessage, this.m_yMessage);
    }
  }
}
export default ToolPick;
