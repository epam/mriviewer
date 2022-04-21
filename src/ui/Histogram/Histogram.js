// /*
//  * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import React, { useRef, useState, useEffect } from 'react';
// import TransfFunc from '../../engine/TransFunc';

// const DEFAULT_HEIGHT = 220;
// const NEED_TO_DRAW_VERTICAL_MARKS = false;

// const Histogram = (props) => {
//   const canvasRef = useRef(null);
//   const canvasHistogram = useRef(null);
//   const [width, setWidth] = useState(0);
//   const [height, setHeight] = useState(DEFAULT_HEIGHT);
//   let m_numColors = 0;
//   let m_histogram = [];
//   let m_peakIndex = -1;

//   let m_transfFunc = new TransfFunc();
//   let m_transfFuncCallback = undefined;
//   let m_transfFuncUpdateCallback = undefined;

//   useEffect(() => {
//     updateCanvas();
//     window.addEventListener('resize', handleResize, false);
//     setSize();
//   }, []);

//   useEffect(() => {
//     updateCanvas();
//     window.removeEventListener('resize', handleResize, false);
//   }, [handleResize]);

//   function handleResize() {
//     setSize();
//   }

//   function setSize() {
//     const { current } = canvasRef;
//     if (current !== null) {
//       const w = current.clientWidth - 2;
//       const h = current.clientHeight - 2;
//       // console.log(`UiHistogram. setSize. = ${w} * ${h}`);
//       setWidth(w);
//       setHeight(h);
//     }
//   }

//   function smoothHistogram(sigma = 1.2, needNormalize = true) {
//     const SIZE_DIV = 60;
//     let RAD = Math.floor(m_numColors / SIZE_DIV);
//     // avoid too large neighbourhood window size
//     const SIZE_LARGE = 32;
//     if (RAD > SIZE_LARGE) {
//       RAD = SIZE_LARGE;
//     }
//     // console.log(`smoothHistogram. RAD = ${RAD}`);

//     const KOEF = 1.0 / (2 * sigma * sigma);
//     const newHist = new Array(m_numColors);
//     let i;
//     let maxVal = 0;
//     for (i = 0; i < m_numColors; i++) {
//       let sum = 0;
//       let sumW = 0;
//       for (let di = -RAD; di <= RAD; di++) {
//         const ii = i + di;
//         const t = di / RAD;
//         const w = Math.exp(-t * t * KOEF);
//         if (ii >= 0 && ii < m_numColors) {
//           sum += m_histogram[ii] * w;
//           sumW += w;
//         }
//       }
//       sum /= sumW;
//       maxVal = sum > maxVal ? sum : maxVal;

//       newHist[i] = sum;
//     } // for (i)
//     // copy back to hist
//     if (needNormalize) {
//       for (i = 0; i < m_numColors; i++) {
//         m_histogram[i] = newHist[i] / maxVal;
//       } // for (i)
//     } else {
//       for (i = 0; i < m_numColors; i++) {
//         m_histogram[i] = newHist[i];
//       } // for (i)
//     }
//   } // smoothHistogram

//   const getVolumeHistogram = (vol) => {
//     const xDim = vol.m_xDim;
//     const yDim = vol.m_yDim;
//     const zDim = vol.m_zDim;
//     const dataArray = vol.m_dataArray;
//     const xyzDim = xDim * yDim * zDim;
//     const NUM_COLORS = 256;
//     m_numColors = NUM_COLORS;
//     m_histogram = new Array(m_numColors);
//     let i;
//     for (i = 0; i < m_numColors; i++) {
//       m_histogram[i] = 0;
//     }
//     for (i = 0; i < xyzDim; i++) {
//       const ind = dataArray[i];
//       m_histogram[ind]++;
//     }
//     // calc max value in histogram
//     let valMax = 0;
//     for (i = 0; i < m_numColors; i++) {
//       valMax = m_histogram[i] > valMax ? m_histogram[i] : valMax;
//     }
//     const SOME_SMALL_ADD = 0.001;
//     valMax += SOME_SMALL_ADD;
//     // scale values to [0..1]
//     const scl = 1.0 / valMax;
//     for (i = 0; i < m_numColors; i++) {
//       m_histogram[i] *= scl;
//     }
//     smoothHistogram();
//     getMaxPeak();
//   };

//   function getMaxPeak() {
//     // this.m_peakIndex = -1;
//     let i;
//     const hist = m_histogram;
//     const MIN_SCAN = 12;
//     const MAX_SCAN = m_numColors - 4;
//     let maxPeakVal = 0;
//     for (i = MAX_SCAN; i > MIN_SCAN; i--) {
//       if (hist[i] > hist[i - 1] && hist[i] > hist[i + 1] && hist[i] > hist[i - 2] && hist[i] > hist[i + 2]) {
//         const peakVal = hist[i];
//         if (peakVal > maxPeakVal) {
//           maxPeakVal = peakVal;
//           m_peakIndex = i;
//         }
//         // console.log(`Local histogram peak in ${m_peakIndex}`);
//       } // if (ha slocal peak)
//     } // for (all colors to scan)
//   }

//   function forceRender() {
//     setHeight(height);
//     setWidth(width);
//     if (m_transfFuncCallback !== undefined) {
//       m_transfFuncCallback(m_transfFunc);
//     }
//   }

//   function onMouseDown(evt) {
//     if (m_transfFuncCallback === undefined || m_transfFuncUpdateCallback === undefined) {
//       return;
//     }
//     const box = canvasHistogram.getBoundingClientRect();
//     const xScr = evt.clientX - box.left;
//     const yScr = evt.clientY - box.top;
//     const needRender = m_transfFunc.onMouseDown(xScr, yScr);
//     if (needRender) {
//       forceRender();
//     }
//   }

//   function onMouseUp(evt) {
//     if (m_transfFuncCallback === undefined || m_transfFuncUpdateCallback === undefined) {
//       return;
//     }
//     const box = canvasHistogram.getBoundingClientRect();
//     const xScr = evt.clientX - box.left;
//     const yScr = evt.clientY - box.top;
//     const needRender = m_transfFunc.onMouseUp(xScr, yScr);
//     if (needRender) {
//       forceRender();
//     }
//   }

//   function onMouseMove(evt) {
//     if (m_transfFuncCallback === undefined || m_transfFuncUpdateCallback === undefined) {
//       return;
//     }
//     const box = canvasHistogram.getBoundingClientRect();
//     const xScr = evt.clientX - box.left;
//     const yScr = evt.clientY - box.top;
//     const needRender = m_transfFunc.onMouseMove(xScr, yScr);
//     if (needRender) {
//       forceRender();
//     }
//   }

//   function updateCanvas() {
//     if (canvasHistogram === undefined) {
//       return;
//     }
//     const ctx = canvasHistogram.getContext('2d');
//     const w = canvasHistogram.clientWidth;
//     const h = canvasHistogram.clientHeight;
//     ctx.fillStyle = 'rgb(220, 220, 220)';
//     ctx.fillRect(0, 0, w, h);

//     const vol = props.volume;
//     if (vol !== null) {
//       getVolumeHistogram(vol);
//     }
//     const xMin = Math.floor(0.01 * w);
//     const xMax = Math.floor(0.99 * w);
//     const yMin = Math.floor(0.05 * h);
//     const yMax = Math.floor(0.95 * h);
//     const wRect = xMax - xMin;
//     const hRect = yMax - yMin;

//     ctx.lineWidth = 1;
//     ctx.strokeStyle = '#0a0a0a';

//     ctx.moveTo(xMin, yMax);
//     ctx.lineTo(xMin, yMin);
//     ctx.stroke();

//     ctx.moveTo(xMin, yMax);
//     ctx.lineTo(xMax, yMax);
//     ctx.stroke();

//     ctx.font = '10px Arial';
//     ctx.fillStyle = 'rgb(120, 20, 20)';
//     ctx.textBaseline = 'top';
//     ctx.textAlign = 'center';

//     let maxHistValue = 1.0;
//     if (m_peakIndex > 0) {
//       maxHistValue = m_histogram[m_peakIndex] * 2;
//       maxHistValue = maxHistValue > 1.0 ? 1.0 : maxHistValue;
//     }
//     let i;
//     const NUM_X_MARKS = 4;
//     for (i = 0; i <= NUM_X_MARKS; i++) {
//       const x = xMin + Math.floor((wRect * i) / NUM_X_MARKS);
//       ctx.moveTo(x, yMax);
//       ctx.lineTo(x, yMax + 6);
//       ctx.stroke();
//       const valMark = Math.floor(0 + (m_numColors * i) / NUM_X_MARKS);
//       if (i === 0) {
//         ctx.textAlign = 'left';
//       } else if (i === NUM_X_MARKS) {
//         ctx.textAlign = 'right';
//       } else {
//         ctx.textAlign = 'center';
//       }
//       ctx.fillText(valMark.toString(), x, yMax + 4);
//     }

//     if (NEED_TO_DRAW_VERTICAL_MARKS) {
//       ctx.textBaseline = 'bottom';
//       ctx.textAlign = 'left';
//       ctx.fillStyle = 'rgb(120, 60, 60)';
//       const NUM_Y_MARKS = 4;
//       for (i = 0; i <= NUM_Y_MARKS; i++) {
//         if (i === NUM_Y_MARKS) {
//           ctx.textBaseline = 'top';
//         }
//         const y = yMax - Math.floor((hRect * i) / NUM_Y_MARKS);
//         ctx.moveTo(xMin, y);
//         ctx.lineTo(xMin - 4, y);
//         ctx.stroke();
//         const valMark = 0 + (maxHistValue * i) / NUM_Y_MARKS;
//         ctx.fillText(valMark.toFixed(2), xMin + 6, y);
//       }
//     }

//     ctx.lineWidth = 2;
//     ctx.strokeStyle = '#080808';
//     ctx.fillStyle = '#707070';

//     ctx.beginPath();
//     {
//       ctx.moveTo(xMin, yMax);
//       let i;
//       let x, y;
//       for (i = 0; i < m_numColors; i++) {
//         x = xMin + Math.floor((wRect * i) / m_numColors);
//         let v = m_histogram[i] / maxHistValue;
//         v = v >= 1.0 ? 1.0 : v;
//         y = yMax - Math.floor(hRect * v);
//         ctx.lineTo(x, y);
//       }
//       y = yMax;
//       ctx.lineTo(x, y);
//     }
//     ctx.closePath();
//     ctx.fill();
//     // draw peak
//     if (m_peakIndex > 0) {
//       ctx.lineWidth = 1;
//       ctx.strokeStyle = '#eeeeee';
//       const x = xMin + Math.floor((wRect * m_peakIndex) / m_numColors);
//       let v = m_histogram[m_peakIndex] / maxHistValue;
//       v = v >= 1.0 ? 1.0 : v;
//       let y = yMax - Math.floor(hRect * v);
//       ctx.beginPath();
//       ctx.setLineDash([5, 15]);
//       ctx.moveTo(x, y);
//       y = yMax;
//       ctx.lineTo(x, y);
//       ctx.stroke();
//       ctx.setLineDash([]);
//     }
//     // render points and lines for modified transfer fucntion
//     if (m_transfFuncCallback !== undefined && m_transfFuncUpdateCallback !== undefined) {
//       m_transfFunc.render(ctx, xMin, yMin, wRect, hRect);
//     }
//   }

//   const vol = props.volume;
//   if (vol === undefined) {
//     return <p>UiHistogram.props volume is not defined !!!</p>;
//   }
//   if (vol === null) {
//     return <p></p>;
//   }

//   m_transfFuncCallback = props.transfFunc;
//   m_transfFuncUpdateCallback = props.transfFuncUpdate;
//   const cw = width;
//   const ch = height;
//   const jsxHist = (
//     <div ref={canvasRef} style={{ cursor: 'initial' }}>
//       <canvas ref={canvasHistogram} width={cw} height={ch} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} />
//     </div>
//   );
//   return jsxHist;
// };

// export default Histogram;

// // /*
// //  * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
// //  * SPDX-License-Identifier: Apache-2.0
// //  */

// // import React from 'react';

// // import TransfFunc from '../../engine/TransFunc';

// // const DEFAULT_HEIGHT = 220;
// // const NEED_TO_DRAW_VERTICAL_MARKS = false;

// // export default class UiHistogram extends React.Component {
// //   constructor(props) {
// //     super(props);
// //     this.m_histogram = [];
// //     this.m_numColors = 0;

// //     this.m_transfFunc = new TransfFunc();
// //     this.m_transfFuncCallback = undefined;
// //     this.m_transfFuncUpdateCallback = undefined;

// //     this.setSize = this.setSize.bind(this);
// //     this.onMouseDown = this.onMouseDown.bind(this);
// //     this.onMouseUp = this.onMouseUp.bind(this);
// //     this.onMouseMove = this.onMouseMove.bind(this);

// //     this.state = {
// //       width: 0,
// //       height: DEFAULT_HEIGHT,
// //     };
// //   }

// //   componentDidMount() {
// //     this.updateCanvas();
// //     window.addEventListener('resize', this.handleResize, false);
// //     this.setSize();
// //   }

// //   componentDidUpdate() {
// //     this.updateCanvas();
// //     window.removeEventListener('resize', this.handleResize, false);
// //   }

// //   handleResize() {
// //     this.setSize();
// //   }

// //   setSize() {
// //     const objOwner = this.m_canvasOwner;
// //     if (objOwner !== null) {
// //       const w = objOwner.clientWidth - 2;
// //       const h = objOwner.clientHeight - 2;
// //       // console.log(`UiHistogram. setSize. = ${w} * ${h}`);
// //       this.setState({ width: w });
// //       this.setState({ height: h });
// //     }
// //   }

// //   getVolumeHistogram(vol) {
// //     const xDim = vol.m_xDim;
// //     const yDim = vol.m_yDim;
// //     const zDim = vol.m_zDim;
// //     const dataArray = vol.m_dataArray;
// //     const xyzDim = xDim * yDim * zDim;
// //     const NUM_COLORS = 256;
// //     this.m_numColors = NUM_COLORS;
// //     this.m_histogram = new Array(this.m_numColors);
// //     let i;
// //     for (i = 0; i < this.m_numColors; i++) {
// //       this.m_histogram[i] = 0;
// //     }
// //     for (i = 0; i < xyzDim; i++) {
// //       const ind = dataArray[i];
// //       this.m_histogram[ind]++;
// //     }
// //     // calc max value in histogram
// //     let valMax = 0;
// //     for (i = 0; i < this.m_numColors; i++) {
// //       valMax = this.m_histogram[i] > valMax ? this.m_histogram[i] : valMax;
// //     }
// //     const SOME_SMALL_ADD = 0.001;
// //     valMax += SOME_SMALL_ADD;
// //     // scale values to [0..1]
// //     const scl = 1.0 / valMax;
// //     for (i = 0; i < this.m_numColors; i++) {
// //       this.m_histogram[i] *= scl;
// //     }
// //     this.smoothHistogram();
// //     this.getMaxPeak();
// //   }

// //   getMaxPeak() {
// //     this.m_peakIndex = -1;
// //     let i;
// //     const hist = this.m_histogram;
// //     const MIN_SCAN = 12;
// //     const MAX_SCAN = this.m_numColors - 4;
// //     let maxPeakVal = 0;
// //     for (i = MAX_SCAN; i > MIN_SCAN; i--) {
// //       if (hist[i] > hist[i - 1] && hist[i] > hist[i + 1] && hist[i] > hist[i - 2] && hist[i] > hist[i + 2]) {
// //         const peakVal = hist[i];
// //         if (peakVal > maxPeakVal) {
// //           maxPeakVal = peakVal;
// //           this.m_peakIndex = i;
// //         }
// //         // console.log(`Local histogram peak in ${this.m_peakIndex}`);
// //       } // if (ha slocal peak)
// //     } // for (all colors to scan)
// //   }

// //   smoothHistogram(sigma = 1.2, needNormalize = true) {
// //     const SIZE_DIV = 60;
// //     let RAD = Math.floor(this.m_numColors / SIZE_DIV);
// //     // avoid too large neighbourhood window size
// //     const SIZE_LARGE = 32;
// //     if (RAD > SIZE_LARGE) {
// //       RAD = SIZE_LARGE;
// //     }
// //     // console.log(`smoothHistogram. RAD = ${RAD}`);

// //     const KOEF = 1.0 / (2 * sigma * sigma);
// //     const newHist = new Array(this.m_numColors);
// //     let i;
// //     let maxVal = 0;
// //     for (i = 0; i < this.m_numColors; i++) {
// //       let sum = 0;
// //       let sumW = 0;
// //       for (let di = -RAD; di <= RAD; di++) {
// //         const ii = i + di;
// //         const t = di / RAD;
// //         const w = Math.exp(-t * t * KOEF);
// //         if (ii >= 0 && ii < this.m_numColors) {
// //           sum += this.m_histogram[ii] * w;
// //           sumW += w;
// //         }
// //       }
// //       sum /= sumW;
// //       maxVal = sum > maxVal ? sum : maxVal;

// //       newHist[i] = sum;
// //     } // for (i)
// //     // copy back to hist
// //     if (needNormalize) {
// //       for (i = 0; i < this.m_numColors; i++) {
// //         this.m_histogram[i] = newHist[i] / maxVal;
// //       } // for (i)
// //     } else {
// //       for (i = 0; i < this.m_numColors; i++) {
// //         this.m_histogram[i] = newHist[i];
// //       } // for (i)
// //     }
// //   } // smoothHistogram

// //   onMouseDown(evt) {
// //     if (this.m_transfFuncCallback === undefined || this.m_transfFuncUpdateCallback === undefined) {
// //       return;
// //     }
// //     const box = this.refs.canvasHistogram.getBoundingClientRect();
// //     const xScr = evt.clientX - box.left;
// //     const yScr = evt.clientY - box.top;
// //     const needRender = this.m_transfFunc.onMouseDown(xScr, yScr);
// //     if (needRender) {
// //       this.forceRender();
// //     }
// //   }

// //   onMouseUp(evt) {
// //     if (this.m_transfFuncCallback === undefined || this.m_transfFuncUpdateCallback === undefined) {
// //       return;
// //     }
// //     const box = this.refs.canvasHistogram.getBoundingClientRect();
// //     const xScr = evt.clientX - box.left;
// //     const yScr = evt.clientY - box.top;
// //     const needRender = this.m_transfFunc.onMouseUp(xScr, yScr);
// //     if (needRender) {
// //       this.forceRender();
// //     }
// //   }

// //   onMouseMove(evt) {
// //     if (this.m_transfFuncCallback === undefined || this.m_transfFuncUpdateCallback === undefined) {
// //       return;
// //     }
// //     const box = this.refs.canvasHistogram.getBoundingClientRect();
// //     const xScr = evt.clientX - box.left;
// //     const yScr = evt.clientY - box.top;
// //     const needRender = this.m_transfFunc.onMouseMove(xScr, yScr);
// //     if (needRender) {
// //       this.forceRender();
// //     }
// //   }

// //   updateCanvas() {
// //     if (this.refs.canvasHistogram === undefined) {
// //       return;
// //     }
// //     const ctx = this.refs.canvasHistogram.getContext('2d');
// //     const w = this.refs.canvasHistogram.clientWidth;
// //     const h = this.refs.canvasHistogram.clientHeight;
// //     ctx.fillStyle = 'rgb(220, 220, 220)';
// //     ctx.fillRect(0, 0, w, h);

// //     const vol = this.props.volume;
// //     if (vol !== null) {
// //       this.getVolumeHistogram(vol);
// //     }

// //     const xMin = Math.floor(0.01 * w);
// //     const xMax = Math.floor(0.99 * w);
// //     const yMin = Math.floor(0.05 * h);
// //     const yMax = Math.floor(0.95 * h);
// //     const wRect = xMax - xMin;
// //     const hRect = yMax - yMin;

// //     ctx.lineWidth = 1;
// //     ctx.strokeStyle = '#0a0a0a';

// //     ctx.moveTo(xMin, yMax);
// //     ctx.lineTo(xMin, yMin);
// //     ctx.stroke();

// //     ctx.moveTo(xMin, yMax);
// //     ctx.lineTo(xMax, yMax);
// //     ctx.stroke();

// //     ctx.font = '10px Arial';
// //     ctx.fillStyle = 'rgb(120, 20, 20)';
// //     ctx.textBaseline = 'top';
// //     ctx.textAlign = 'center';

// //     let maxHistValue = 1.0;
// //     if (this.m_peakIndex > 0) {
// //       maxHistValue = this.m_histogram[this.m_peakIndex] * 2;
// //       maxHistValue = maxHistValue > 1.0 ? 1.0 : maxHistValue;
// //     }

// //     let i;
// //     const NUM_X_MARKS = 4;
// //     for (i = 0; i <= NUM_X_MARKS; i++) {
// //       const x = xMin + Math.floor((wRect * i) / NUM_X_MARKS);
// //       ctx.moveTo(x, yMax);
// //       ctx.lineTo(x, yMax + 6);
// //       ctx.stroke();
// //       const valMark = Math.floor(0 + (this.m_numColors * i) / NUM_X_MARKS);
// //       if (i === 0) {
// //         ctx.textAlign = 'left';
// //       } else if (i === NUM_X_MARKS) {
// //         ctx.textAlign = 'right';
// //       } else {
// //         ctx.textAlign = 'center';
// //       }
// //       ctx.fillText(valMark.toString(), x, yMax + 4);
// //     }

// //     if (NEED_TO_DRAW_VERTICAL_MARKS) {
// //       ctx.textBaseline = 'bottom';
// //       ctx.textAlign = 'left';
// //       ctx.fillStyle = 'rgb(120, 60, 60)';
// //       const NUM_Y_MARKS = 4;
// //       for (i = 0; i <= NUM_Y_MARKS; i++) {
// //         if (i === NUM_Y_MARKS) {
// //           ctx.textBaseline = 'top';
// //         }
// //         const y = yMax - Math.floor((hRect * i) / NUM_Y_MARKS);
// //         ctx.moveTo(xMin, y);
// //         ctx.lineTo(xMin - 4, y);
// //         ctx.stroke();
// //         const valMark = 0 + (maxHistValue * i) / NUM_Y_MARKS;
// //         ctx.fillText(valMark.toFixed(2), xMin + 6, y);
// //       }
// //     }

// //     ctx.lineWidth = 2;
// //     ctx.strokeStyle = '#080808';
// //     ctx.fillStyle = '#707070';

// //     ctx.beginPath();
// //     {
// //       ctx.moveTo(xMin, yMax);
// //       let i;
// //       let x, y;
// //       for (i = 0; i < this.m_numColors; i++) {
// //         x = xMin + Math.floor((wRect * i) / this.m_numColors);
// //         let v = this.m_histogram[i] / maxHistValue;
// //         v = v >= 1.0 ? 1.0 : v;
// //         y = yMax - Math.floor(hRect * v);
// //         ctx.lineTo(x, y);
// //       }
// //       y = yMax;
// //       ctx.lineTo(x, y);
// //     }
// //     ctx.closePath();
// //     ctx.fill();
// //     // draw peak
// //     if (this.m_peakIndex > 0) {
// //       ctx.lineWidth = 1;
// //       ctx.strokeStyle = '#eeeeee';
// //       const x = xMin + Math.floor((wRect * this.m_peakIndex) / this.m_numColors);
// //       let v = this.m_histogram[this.m_peakIndex] / maxHistValue;
// //       v = v >= 1.0 ? 1.0 : v;
// //       let y = yMax - Math.floor(hRect * v);
// //       ctx.beginPath();
// //       ctx.setLineDash([5, 15]);
// //       ctx.moveTo(x, y);
// //       y = yMax;
// //       ctx.lineTo(x, y);
// //       ctx.stroke();
// //       ctx.setLineDash([]);
// //     }
// //     // render points and lines for modified transfer fucntion
// //     if (this.m_transfFuncCallback !== undefined && this.m_transfFuncUpdateCallback !== undefined) {
// //       this.m_transfFunc.render(ctx, xMin, yMin, wRect, hRect);
// //     }
// //   } // end update canvas

// //   forceRender() {
// //     this.setState({ state: this.state });
// //     if (this.m_transfFuncCallback !== undefined) {
// //       this.m_transfFuncCallback(this.m_transfFunc);
// //     }
// //   }

// //   render() {
// //     const vol = this.props.volume;
// //     if (vol === undefined) {
// //       return <p>UiHistogram.props volume is not defined !!!</p>;
// //     }
// //     if (vol === null) {
// //       return <p></p>;
// //     }
// //     this.m_transfFuncCallback = this.props.transfFunc;
// //     this.m_transfFuncUpdateCallback = this.props.transfFuncUpdate;

// //     const cw = this.state.width;
// //     const ch = this.state.height;

// //     const jsxHist = (
// //       <div
// //         ref={(mount) => {
// //           this.m_canvasOwner = mount;
// //         }}
// //         style={{ cursor: 'initial' }}
// //       >
// //         <canvas
// //           ref="canvasHistogram"
// //           width={cw}
// //           height={ch}
// //           onMouseDown={this.onMouseDown}
// //           onMouseUp={this.onMouseUp}
// //           onMouseMove={this.onMouseMove}
// //         />
// //       </div>
// //     );
// //     return jsxHist;
// //   }
// // }
