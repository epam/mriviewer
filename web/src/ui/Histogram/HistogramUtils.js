/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default class HistogramUtils extends React.Component {
  constructor(props) {
    super(props);
    this.m_numColors = 0;
    this.m_histogram = [];
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
        if (this.m_histogram[i] > this.m_histogram[i - 2] && this.m_histogram[i] > this.m_histogram[i + 2]) {
          found = true;
          break;
        } // if local maximum
      } // if mor min
    } // for (i)
    if (!found) {
      console.log(`getLastMaxIndex. Not found!`);
      return -1;
    }
    return i;
  } // end get last max index

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
        if (ii >= 0 && ii < this.m_numColors) {
          sum += this.m_histogram[ii] * w;
          sumW += w;
        }
      }
      sum /= sumW;
      maxVal = sum > maxVal ? sum : maxVal;

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
}
