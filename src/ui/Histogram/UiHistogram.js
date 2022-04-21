/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import TransfFunc from '../../engine/TransFunc';

const DEFAULT_HEIGHT = 220;
const NEED_TO_DRAW_VERTICAL_MARKS = false;

export const UiHistogram = (props) => {
  const containerRef = useRef(null);
  const canvasHistogramRef = useRef(null);
  const didMount = useRef(false);
  let numColors = 0;
  let histogram = [];
  let peakIndex = -1;

  let mainTransfFunc = new TransfFunc();
  let transfFuncCallback = props.transfFunc;
  let transfFuncUpdateCallback = props.transfFuncUpdate;

  const { transfFuncUpdate } = props;
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  useEffect(() => {
    updateCanvas();
    window.addEventListener('resize', handleResize, false);
    setSize();
  }, []);

  useEffect(() => {
    if (didMount.current) {
      updateCanvas();
      window.removeEventListener('resize', handleResize, false);
    } else {
      didMount.current = true;
    }
  }, [handleResize]);

  function handleResize() {
    setSize();
  }

  function setSize() {
    const { current } = containerRef;
    if (current !== null) {
      const w = current.clientWidth - 2;
      const h = current.clientHeight - 2;
      // console.log(`UiHistogram. setSize. = ${w} * ${h}`);
      setWidth(w);
      setHeight(h);
    }
  }

  // useEffect(() => {
  //   // calculate width and height canvas
  //   function handleResize() {
  //     const { current } = containerRef;
  //     setCanvasSize({
  //       width: current.clientWidth - 2,
  //       height: current.clientHeight - 2,
  //     });
  //   }
  //   updateCanvas();
  //   window.addEventListener('resize', handleResize);
  //   handleResize();
  //   return () => {
  //     updateCanvas();
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);

  function smoothHistogram(sigma = 1.2, needNormalize = true) {
    const SIZE_DIV = 60;
    let RAD = Math.floor(numColors / SIZE_DIV);
    // avoid too large neighbourhood window size
    const SIZE_LARGE = 32;
    if (RAD > SIZE_LARGE) {
      RAD = SIZE_LARGE;
    }
    // console.log(`smoothHistogram. RAD = ${RAD}`);

    const KOEF = 1.0 / (2 * sigma * sigma);
    const newHist = new Array(numColors);
    let i;
    let maxVal = 0;
    for (i = 0; i < numColors; i++) {
      let sum = 0;
      let sumW = 0;
      for (let di = -RAD; di <= RAD; di++) {
        const ii = i + di;
        const t = di / RAD;
        const w = Math.exp(-t * t * KOEF);
        if (ii >= 0 && ii < numColors) {
          sum += histogram[ii] * w;
          sumW += w;
        }
      }
      sum /= sumW;
      maxVal = sum > maxVal ? sum : maxVal;

      newHist[i] = sum;
    } // for (i)
    // copy back to hist
    if (needNormalize) {
      for (i = 0; i < numColors; i++) {
        histogram[i] = newHist[i] / maxVal;
      } // for (i)
    } else {
      for (i = 0; i < numColors; i++) {
        histogram[i] = newHist[i];
      } // for (i)
    }
  } // smoothHistogram

  const getVolumeHistogram = (vol) => {
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const dataArray = vol.m_dataArray;
    const xyzDim = xDim * yDim * zDim;
    const NUM_COLORS = 256;
    numColors = NUM_COLORS;
    histogram = new Array(numColors);
    let i;
    for (i = 0; i < numColors; i++) {
      histogram[i] = 0;
    }
    for (i = 0; i < xyzDim; i++) {
      const ind = dataArray[i];
      histogram[ind]++;
    }
    // calc max value in histogram
    let valMax = 0;
    for (i = 0; i < numColors; i++) {
      valMax = histogram[i] > valMax ? histogram[i] : valMax;
    }
    const SOME_SMALL_ADD = 0.001;
    valMax += SOME_SMALL_ADD;
    // scale values to [0..1]
    const scl = 1.0 / valMax;
    for (i = 0; i < numColors; i++) {
      histogram[i] *= scl;
    }
    smoothHistogram();
    getMaxPeak();
  };

  function getMaxPeak() {
    // this.m_peakIndex = -1;
    let i;
    const hist = histogram;
    const MIN_SCAN = 12;
    const MAX_SCAN = numColors - 4;
    let maxPeakVal = 0;
    for (i = MAX_SCAN; i > MIN_SCAN; i--) {
      if (hist[i] > hist[i - 1] && hist[i] > hist[i + 1] && hist[i] > hist[i - 2] && hist[i] > hist[i + 2]) {
        const peakVal = hist[i];
        if (peakVal > maxPeakVal) {
          maxPeakVal = peakVal;
          peakIndex = i;
        }
        // console.log(`Local histogram peak in ${m_peakIndex}`);
      } // if (ha slocal peak)
    } // for (all colors to scan)
  }

  function forceRender() {
    setHeight(height);
    setWidth(width);
    if (transfFuncCallback !== undefined) {
      transfFuncCallback(mainTransfFunc);
    }
  }

  function onMouseDown(evt) {
    if (transfFuncCallback === undefined || transfFuncUpdateCallback === undefined) {
      return;
    }
    const box = canvasHistogramRef.current.getBoundingClientRect();
    const xScr = evt.clientX - box.left;
    const yScr = evt.clientY - box.top;
    const needRender = mainTransfFunc.onMouseDown(xScr, yScr);
    if (needRender) {
      forceRender();
    }
  }

  function onMouseUp(evt) {
    if (transfFuncCallback === undefined || transfFuncUpdateCallback === undefined) {
      return;
    }
    const box = canvasHistogramRef.current.getBoundingClientRect();
    const xScr = evt.clientX - box.left;
    const yScr = evt.clientY - box.top;
    const needRender = mainTransfFunc.onMouseUp(xScr, yScr);
    if (needRender) {
      forceRender();
    }
  }

  function onMouseMove(evt) {
    if (transfFuncCallback === undefined || transfFuncUpdateCallback === undefined) {
      return;
    }
    const box = canvasHistogramRef.current.getBoundingClientRect();
    const xScr = evt.clientX - box.left;
    const yScr = evt.clientY - box.top;
    const needRender = mainTransfFunc.onMouseMove(xScr, yScr);
    if (needRender) {
      forceRender();
    }
  }

  function updateCanvas() {
    if (canvasHistogramRef === undefined) {
      return;
    }
    const ctx = canvasHistogramRef.current.getContext('2d');
    const w = canvasHistogramRef.current.clientWidth;
    const h = canvasHistogramRef.current.clientHeight;
    ctx.fillStyle = 'rgb(220, 220, 220)';
    ctx.fillRect(0, 0, w, h);

    const vol = props.volume;
    if (vol !== null) {
      getVolumeHistogram(vol);
    }
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

    let maxHistValue = 1.0;
    if (peakIndex > 0) {
      maxHistValue = histogram[peakIndex] * 2;
      maxHistValue = maxHistValue > 1.0 ? 1.0 : maxHistValue;
    }
    let i;
    const NUM_X_MARKS = 4;
    for (i = 0; i <= NUM_X_MARKS; i++) {
      const x = xMin + Math.floor((wRect * i) / NUM_X_MARKS);
      ctx.moveTo(x, yMax);
      ctx.lineTo(x, yMax + 6);
      ctx.stroke();
      const valMark = Math.floor(0 + (numColors * i) / NUM_X_MARKS);
      if (i === 0) {
        ctx.textAlign = 'left';
      } else if (i === NUM_X_MARKS) {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'center';
      }
      ctx.fillText(valMark.toString(), x, yMax + 4);
    }

    if (NEED_TO_DRAW_VERTICAL_MARKS) {
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgb(120, 60, 60)';
      const NUM_Y_MARKS = 4;
      for (i = 0; i <= NUM_Y_MARKS; i++) {
        if (i === NUM_Y_MARKS) {
          ctx.textBaseline = 'top';
        }
        const y = yMax - Math.floor((hRect * i) / NUM_Y_MARKS);
        ctx.moveTo(xMin, y);
        ctx.lineTo(xMin - 4, y);
        ctx.stroke();
        const valMark = 0 + (maxHistValue * i) / NUM_Y_MARKS;
        ctx.fillText(valMark.toFixed(2), xMin + 6, y);
      }
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#080808';
    ctx.fillStyle = '#707070';

    ctx.beginPath();
    {
      ctx.moveTo(xMin, yMax);
      let i;
      let x, y;
      for (i = 0; i < numColors; i++) {
        x = xMin + Math.floor((wRect * i) / numColors);
        let v = histogram[i] / maxHistValue;
        v = v >= 1.0 ? 1.0 : v;
        y = yMax - Math.floor(hRect * v);
        ctx.lineTo(x, y);
      }
      y = yMax;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // draw peak
    if (peakIndex > 0) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#eeeeee';
      const x = xMin + Math.floor((wRect * peakIndex) / numColors);
      let v = histogram[peakIndex] / maxHistValue;
      v = v >= 1.0 ? 1.0 : v;
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
    if (transfFuncCallback !== undefined && transfFuncUpdate !== undefined) {
      mainTransfFunc.render(ctx, xMin, yMin, wRect, hRect);
    }
  }

  const vol = props.volume;
  if (vol === undefined) {
    return <p>UiHistogram.props volume is not defined !!!</p>;
  }
  if (vol === null) {
    return <p></p>;
  }
  const cw = width;
  const ch = height;
  return (
    <div ref={containerRef} style={{ cursor: 'initial' }}>
      <canvas ref={canvasHistogramRef} width={cw} height={ch} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} />
    </div>
  );
};
