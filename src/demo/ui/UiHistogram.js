/**
 * @fileOverview UiHistogram
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

import TransfFunc from '../engine/TransFunc';

// ********************************************************
// Const
// ********************************************************

const DEFAULT_HEIGHT = 220;
const NEED_TO_DRAW_VERTICAL_MARKS = false;

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiHistogram some text later...
 */
export default class UiHistogram extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.m_histogram = [];
    this.m_numColors = 0;

    this.m_transfFunc = new TransfFunc();
    this.m_transfFuncCallback = undefined;
    this.m_transfFuncUpdateCallback = undefined;

    this.setSize = this.setSize.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.state = {
      width: 0,
      height: DEFAULT_HEIGHT,
    };
  }
  componentDidMount() {
    this.updateCanvas();
    window.addEventListener('resize', this.handleResize, false);
    this.setSize();    
  }
  componentDidUpdate() {
    this.updateCanvas();
    window.removeEventListener('resize', this.handleResize, false);
  }
  handleResize() {
    this.setSize();
  }
  setSize() {
    const objOwner = this.m_canvasOwner;
    if (objOwner !== null) {
      const w = objOwner.clientWidth - 2;
      const h = objOwner.clientHeight - 2;
      // console.log(`UiHistogram. setSize. = ${w} * ${h}`);
      this.setState({ width: w });
      this.setState({ height: h });
    }
  }
  getVolumeHistogram(vol) {
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const dataArray = vol.m_dataArray;
    const xyzDim = xDim * yDim * zDim;
    const NUM_COLORS = 256;
    this.m_numColors = NUM_COLORS;
    this.m_histogram = new Array(this.m_numColors);
    let i;
    for (i = 0; i < this.m_numColors; i++) {
      this.m_histogram[i] = 0;
    }
    for (i = 0; i < xyzDim; i++) {
      const ind = dataArray[i];
      this.m_histogram[ind]++;
    }
    // calc max value in histogram
    let valMax = 0;
    for (i = 0; i < this.m_numColors; i++) {
      valMax = (this.m_histogram[i] > valMax) ? this.m_histogram[i] : valMax;
    }
    const SOME_SMALL_ADD = 0.001;
    valMax += SOME_SMALL_ADD;
    // scale values to [0..1]
    const scl = 1.0 / valMax;
    for (i = 0; i < this.m_numColors; i++) {
      this.m_histogram[i] *= scl;
    }
    this.smoothHistogram();
    this.getMaxPeak();
  }
  assignArray(numColors, histogramArray) {
    this.m_numColors = numColors;
    this.m_histogram = histogramArray;
  }
  getLastMaxIndex(valMin = 0.0) {
    const IND_MIN = 4;
    let i;

    let found = false;
    for (i = this.m_numColors - IND_MIN; i > IND_MIN; i--) {
      if (this.m_histogram[i] > valMin) {
        if ((this.m_histogram[i] > this.m_histogram[i - 2]) && 
          (this.m_histogram[i] > this.m_histogram[i + 2])) {
          found = true; break;
        } // if local maximum
      } // if mor min
    } // for (i)
    if (!found) {
      console.log(`getLastMaxIndex. Not found!`);
      return -1;
    }
    return i;

  } // end get last max index
  //
  //
  getMaxPeak() {
    this.m_peakIndex = -1;
    let i;
    const hist = this.m_histogram;
    const MIN_SCAN = 12;
    const MAX_SCAN = this.m_numColors - 4;
    let maxPeakVal = 0;
    for (i = MAX_SCAN; i > MIN_SCAN; i--) {
      if ((hist[i] > hist[i - 1]) && (hist[i] > hist[i + 1]) && 
        (hist[i] > hist[i - 2]) && (hist[i] > hist[i + 2])) {
        const peakVal = hist[i];
        if (peakVal > maxPeakVal) {
          maxPeakVal = peakVal;
          this.m_peakIndex = i;
        }
        // console.log(`Local histogram peak in ${this.m_peakIndex}`);
      } // if (ha slocal peak)
    } // for (all colors to scan) 
  }
  smoothHistogram(sigma = 1.2, needNormalize = true) {
    const SIZE_DIV = 60;
    let RAD = Math.floor(this.m_numColors / SIZE_DIV);
    // avoid too large neighbourhood window size
    const SIZE_LARGE = 32;
    if (RAD > SIZE_LARGE) {
      RAD = SIZE_LARGE;
    }
    // console.log(`smoothHistogram. RAD = ${RAD}`);

    const KOEF = 1.0 / (2 * sigma * sigma);
    const newHist = new Array(this.m_numColors);
    let i;
    let maxVal = 0;
    for (i = 0; i < this.m_numColors; i++) {
      let sum = 0;
      let sumW = 0;
      for (let di = -RAD; di <= RAD; di++) {
        const ii = i + di;
        const t = di / RAD;
        const w = Math.exp(-t * t * KOEF);
        if ((ii >= 0) && (ii < this.m_numColors)) {
          sum += this.m_histogram[ii] * w;
          sumW += w;
        }
      }
      sum /= sumW;
      maxVal = (sum > maxVal) ? sum : maxVal;

      newHist[i] = sum;
    } // for (i)
    // copy back to hist
    if (needNormalize) {
      for (i = 0; i < this.m_numColors; i++) {
        this.m_histogram[i] = newHist[i] / maxVal;
      } // for (i)
    } else {
      for (i = 0; i < this.m_numColors; i++) {
        this.m_histogram[i] = newHist[i];
      } // for (i)
    }
  } // smoothHistogram
  onMouseDown(evt) {
    if ((this.m_transfFuncCallback === undefined) ||
      (this.m_transfFuncUpdateCallback === undefined)) {
      return;
    }
    const box = this.refs.canvasHistogram.getBoundingClientRect();
    const xScr = evt.clientX - box.left;
    const yScr = evt.clientY - box.top;
    const needRender = this.m_transfFunc.onMouseDown(xScr, yScr);
    if (needRender) {
      this.forceRender();
    }
  }
  onMouseUp(evt) {
    if ((this.m_transfFuncCallback === undefined) ||
      (this.m_transfFuncUpdateCallback === undefined)) {
      return;
    }
    const box = this.refs.canvasHistogram.getBoundingClientRect();
    const xScr = evt.clientX - box.left;
    const yScr = evt.clientY - box.top;
    const needRender = this.m_transfFunc.onMouseUp(xScr, yScr);
    if (needRender) {
      this.forceRender();
    }
  }
  onMouseMove(evt) {
    if ((this.m_transfFuncCallback === undefined) ||
      (this.m_transfFuncUpdateCallback === undefined)) {
      return;
    }
    const box = this.refs.canvasHistogram.getBoundingClientRect();
    const xScr = evt.clientX - box.left;
    const yScr = evt.clientY - box.top;
    const needRender = this.m_transfFunc.onMouseMove(xScr, yScr);
    if (needRender) {
      this.forceRender();
    }
  }
  updateCanvas() {
    if (this.refs.canvasHistogram === undefined) {
      return;
    }
    const ctx = this.refs.canvasHistogram.getContext('2d');
    const w = this.refs.canvasHistogram.clientWidth;
    const h = this.refs.canvasHistogram.clientHeight;
    ctx.fillStyle = 'rgb(220, 220, 220)';
    ctx.fillRect(0,0, w, h);

    // was 300 * 250
    // console.log(`updateCanvas. canvas dim = ${w} * ${h}`); 

    const vol = this.props.volume;
    if (vol !== null) {
      this.getVolumeHistogram(vol);
    }

    // rect inside
    // const xMin = Math.floor(0.10 * w);
    // const xMax = Math.floor(0.95 * w);
    const xMin = Math.floor(0.01 * w);
    const xMax = Math.floor(0.99 * w);
    const yMin = Math.floor(0.05 * h);
    const yMax = Math.floor(0.95 * h);
    const wRect = xMax - xMin;
    const hRect = yMax - yMin;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0a0a0a';

    ctx.moveTo(xMin, yMax);
    ctx.lineTo(xMin, yMin);
    ctx.stroke();

    ctx.moveTo(xMin, yMax);
    ctx.lineTo(xMax, yMax);
    ctx.stroke();

    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgb(120, 20, 20)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // detect max visible value in hist
    let maxHistValue = 1.0;
    if (this.m_peakIndex > 0) {
      maxHistValue = this.m_histogram[this.m_peakIndex] * 2;
      maxHistValue = (maxHistValue > 1.0) ? 1.0 : maxHistValue;
    }

    // draw marks horizontal
    let i;
    const NUM_X_MARKS = 4;
    for (i = 0; i <= NUM_X_MARKS; i++) {
      const x = xMin + Math.floor(wRect * i / NUM_X_MARKS);
      ctx.moveTo(x, yMax);
      ctx.lineTo(x, yMax + 6);
      ctx.stroke();
      const valMark = Math.floor(0 + this.m_numColors * i / NUM_X_MARKS);
      if (i === 0) {
        ctx.textAlign = 'left';
      } else if (i === NUM_X_MARKS) {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'center';
      }
      ctx.fillText(valMark.toString(), x, yMax + 4);
    }
    // draw marks vertical
    if (NEED_TO_DRAW_VERTICAL_MARKS) {
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgb(120, 60, 60)';
      const NUM_Y_MARKS = 4;
      for (i = 0; i <= NUM_Y_MARKS; i++) {
        if (i === NUM_Y_MARKS) {
          ctx.textBaseline = 'top';
        }
        const y = yMax - Math.floor(hRect * i / NUM_Y_MARKS);
        ctx.moveTo(xMin, y);
        ctx.lineTo(xMin - 4, y);
        ctx.stroke();
        const valMark = (0 + maxHistValue * i / NUM_Y_MARKS);
        ctx.fillText(valMark.toFixed(2), xMin + 6, y);
      }
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#080808';
    ctx.fillStyle = '#707070';
    // draw histogram function line
    ctx.beginPath();
    {
      ctx.moveTo(xMin, yMax);
      let i;
      let x, y;
      for (i = 0; i < this.m_numColors; i++) {
        x = xMin + Math.floor(wRect * i / this.m_numColors);
        let v = this.m_histogram[i] / maxHistValue;
        v = (v >= 1.0) ? 1.0 : v;
        y = yMax - Math.floor(hRect * v);
        ctx.lineTo(x, y);
      } // for (i) all colors
      y = yMax;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // draw peak
    if (this.m_peakIndex > 0) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#eeeeee';
      const x = xMin + Math.floor(wRect * this.m_peakIndex / this.m_numColors);
      let v = this.m_histogram[this.m_peakIndex] / maxHistValue;
      v = (v >= 1.0) ? 1.0 : v;
      let y = yMax - Math.floor(hRect * v);
      ctx.beginPath();
      ctx.setLineDash([5, 15]);
      ctx.moveTo(x, y);
      y = yMax;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // render points and lines for modified transfer fucntion
    if ((this.m_transfFuncCallback !== undefined) &&
      (this.m_transfFuncUpdateCallback !== undefined)) {
      this.m_transfFunc.render(ctx, xMin, yMin, wRect, hRect);
    }
  } // end update canvas
  forceRender() {
    this.setState({ state: this.state });
    if (this.m_transfFuncCallback !== undefined) {
      this.m_transfFuncCallback(this.m_transfFunc);
    }
  }
  /**
   * Main component render func callback
   */
  render() {
    const vol = this.props.volume;
    if (vol === undefined) {
      return <p>UiHistogram.props volume is not defined !!!</p>;
    }
    if (vol === null) {
      return <p></p>;
    }
    this.m_transfFuncCallback = this.props.transfFunc;
    this.m_transfFuncUpdateCallback = this.props.transfFuncUpdate;
  
    const cw = this.state.width;
    const ch = this.state.height;

    const jsxHist = 
      <div ref={ (mount) => {this.m_canvasOwner = mount} }>
        <canvas ref="canvasHistogram" width={cw} height={ch} 
          onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} />
      </div>;
    return jsxHist;
  }
}
 