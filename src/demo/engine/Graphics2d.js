/**
 * @fileOverview Graphics2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import Modes2d from '../store/Modes2d';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class Graphics2d some text later...
 */
class Graphics2d extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    this.m_sliceRatio = 0.5;
    this.m_mode2d = Modes2d.TRANSVERSE;

    // animation
    this.animate = this.animate.bind(this);
    this.m_frameId = null;
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
  animate() {
    // this.renderScene();
    // this.m_frameId = window.requestAnimationFrame(this.animate);
  }
  componentDidMount() {
    // this.start();
    this.renderScene();
  }
  componentWillUnmount() {
    // this.stop()
  }
  componentDidUpdate() {
    this.renderScene();
  }
  renderScene() {
    const ctx = this.refs.canvasGra2d.getContext('2d');
    const w = this.refs.canvasGra2d.clientWidth;
    const h = this.refs.canvasGra2d.clientHeight;
    ctx.fillStyle = 'rgb(240, 240, 240)';
    ctx.fillRect(0,0, w, h);
    // console.log(`render scene 2d. screen = ${w} * ${h}`);

    // Test draw chessboard
    const NEED_TEST_RAINBOW = false;
    if (NEED_TEST_RAINBOW) {
      const wImg = 800;
      const hImg = 600;
      const imgData = ctx.createImageData(wImg, hImg);
      const dataDst = imgData.data;
      let j = 0;
      for (let y = 0; y < hImg; y++) {
        for (let x = 0; x < wImg; x++) {
          dataDst[j + 0] = Math.floor(255 * x / wImg);
          dataDst[j + 1] = Math.floor(255 * y / hImg);
          dataDst[j + 2] = 120;
          dataDst[j + 3] = 255;
          j += 4;
        } // for (x)
      } // for (y)
      ctx.putImageData(imgData, 0, 0); 
    }

    const store = this.props.store;
    const vol = store.volume;
    const mode2d = store.mode2d;
    const sliceRatio = store.slider2d;


    if (vol !== null) {
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const xyDim = xDim * yDim;
      const dataSrc = vol.m_dataArray; // 8 byte array
      if (dataSrc.length !== xDim * yDim * zDim) {
        console.log(`Bad src data len = ${dataSrc.length}, but expect ${xDim}*${yDim}*${zDim}`);
      }

      // console.log(`Graphics2d. mode=${this.m_mode2d} slice src=${xDim}*${yDim}*${zDim} into ${w}*${h}`);

      const imgData = ctx.createImageData(w, h);
      const dataDst = imgData.data;
      if (dataDst.length !== w * h * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${w}*${h}*4`);
      }

      
      if (mode2d === Modes2d.TRANSVERSE) {
        // z slice
        const zSlice = Math.floor(zDim * sliceRatio);
        const zOff = zSlice * xyDim;
        const xStep = xDim / w
        const yStep = yDim / h;
        let j = 0;
        let ay = 0.0;
        for (let y = 0; y < h; y++, ay += yStep) {
          const ySrc = Math.floor(ay);
          const yOff = ySrc * xDim;
          let ax = 0.0;
          for (let x = 0; x < w; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[zOff + yOff + xSrc];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } else if (mode2d === Modes2d.SAGGITAL) {
        // x slice
        const xSlice = Math.floor(xDim * sliceRatio);

        const yStep = yDim / w
        const zStep = zDim / h;
        let j = 0;
        let az = 0.0;
        for (let y = 0; y < h; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ay = 0.0;
          for (let x = 0; x < w; x++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            const val = dataSrc[zOff + yOff + xSlice];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } else if (mode2d === Modes2d.CORONAL) {
        // y slice
        const ySlice = Math.floor(yDim * sliceRatio);
        const yOff = ySlice * xDim;

        const xStep = xDim / w
        const zStep = zDim / h;
        let j = 0;
        let az = 0.0;
        for (let y = 0; y < h; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ax = 0.0;
          for (let x = 0; x < w; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[zOff + yOff + xSrc];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      }

      ctx.putImageData(imgData, 0, 0); 

    } // if not empty vol
  } // render scene
  /**
   * Main component render func callback
   */
  render() {
    const wScreen = this.props.wScreen;
    const hScreen = this.props.hScreen;
 
    const vol = this.props.volume;
    if (vol !== null) {
      this.m_vol = vol;
    }
    this.m_sliceRatio = this.props.sliderValue;
    this.m_mode2d = this.props.mode2d;

    const jsxGrap2d = 
      <canvas ref="canvasGra2d" width={wScreen} height={hScreen}/>
    return jsxGrap2d;
  }
}

const mapStateToProps = function(storeIn) {
  const objProps = {
    store: storeIn
  };
  return objProps;
}

export default connect(mapStateToProps)(Graphics2d);


 