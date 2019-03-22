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
    this.m_volume = null;
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
  setVolume(vol) {
    this.m_volume = vol;
  }
  onMouseDown(xScr, yScr, mode2d, sliderPosition, zoom, posX, posY) {
    if ((this.m_wScreen === 0) || (this.m_hScreen === 0)) {
      console.log('ToolPick. onMouseDown. Bad screen size');
      return;
    }
    if (this.m_volume === null) {
      console.log('ToolPick. onMouseDown. Volume not set');
      return;
    }
    const xRatioImage = xScr / this.m_wScreen;
    const yRatioImage = yScr / this.m_hScreen;
    let xVol = 0;
    let yVol = 0;
    let zVol = 0;
    if (mode2d === Modes2d.SAGGITAL) {
      // x
      xVol = Math.floor(sliderPosition * (this.m_volume.m_xDim - 1));
      yVol = Math.floor(xRatioImage * (this.m_volume.m_yDim - 1));
      zVol = Math.floor(yRatioImage * (this.m_volume.m_zDim - 1));
    } else if (mode2d === Modes2d.CORONAL) {
      // y
      xVol = Math.floor(xRatioImage * (this.m_volume.m_xDim - 1));
      yVol = Math.floor(sliderPosition * (this.m_volume.m_yDim - 1));
      zVol = Math.floor(yRatioImage * (this.m_volume.m_yDim - 1));
    } else if (mode2d === Modes2d.TRANSVERSE) {
      // z
      xVol = Math.floor(xRatioImage * (this.m_volume.m_xDim - 1));
      yVol = Math.floor(yRatioImage * (this.m_volume.m_yDim - 1));
      zVol = Math.floor(sliderPosition * (this.m_volume.m_zDim - 1));
    }
    const off = xVol + (yVol * this.m_volume.m_xDim) + (zVol * this.m_volume.m_xDim * this.m_volume.m_yDim);
    const val = this.m_volume.m_dataArray[off];

    this.m_xMessage = xScr;
    this.m_yMessage = yScr;
    this.m_strMessage = 'x,y,z = ' + xVol.toString() + ', ' + yVol.toString() + ', ' + zVol.toString() + 
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
