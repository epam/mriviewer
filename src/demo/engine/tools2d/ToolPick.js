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
    this.m_strMessage = '';
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
    const sliderPosition = store.slider2d;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const zoom = store.render2dZoom;
    const xPos = store.render2dxPos;
    const yPos = store.render2dyPos;
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
  onMouseDown(xScr, yScr, store) {
    if ((this.m_wScreen === 0) || (this.m_hScreen === 0)) {
      console.log('ToolPick. onMouseDown. Bad screen size');
      return;
    }

    const xRatioImage = xScr / this.m_wScreen;
    const yRatioImage = yScr / this.m_hScreen;
    if ((xRatioImage > 1.0) || (yRatioImage > 1.0)) {
      // out if rendered image
      return;
    }
    const vTex = this.screenToTexture(xRatioImage, yRatioImage, store);

    const volSet = store.volumeSet;
    const vol = volSet.getVolume(store.volumeIndex);
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
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
    let off = vTex.x + (vTex.y * xDim) + (vTex.z * xDim * yDim);
    let val = 0;
    if (bpp === ONE) {
      val = vol.m_dataArray[off];
    } else if (bpp === FOUR) {
      off = off * FOUR;
      val = vol.m_dataArray[off];
    }
    
    this.m_xMessage = xScr;
    this.m_yMessage = yScr;
    this.m_strMessage = 'x,y,z = ' + (vTex.x).toString() + ', ' + (vTex.y).toString() + ', ' + (vTex.z).toString() + 
      '. val = ' + val.toString();
    // console.log(`ToolPick. onMouseDown. ${this.m_strMessage}`);
    this.m_timeStart = Date.now();
    setTimeout(this.onTimerEnd, 1500);

  } // end onMouseDown
  onTimerEnd() {
    this.m_objGraphics2d.forceUpdate();
  }
  render(ctx) {
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
      ctx.fillStyle = 'white';
      const FONT_SZ = 16;
      ctx.font = FONT_SZ.toString() + 'px Arial';
      const sizeTextRect = ctx.measureText(this.m_strMessage);
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

      ctx.fillText(this.m_strMessage, this.m_xMessage, this.m_yMessage);
    }
  }
}
export default ToolPick;
