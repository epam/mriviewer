/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 2d area tool
 * @module app/scripts/graphics2d/filter.js
 */

export default class FilterTool {
  /**
   * Initialize area tool
   * @param (float) m_x - position on x for changing contrast
   * @param (float) m_y - position on y for changing brightness
   * @param (float) m_contrast - value of contrast
   * @param (float) m_brightness - value of brightness
   * @param (float) m_COBRflag - flag for changing contrast/brightness
   */
  constructor() {
    /*this.m_x = 0;
    this.m_y = 0;*/
    this.m_sigma = 0.8;
    //this.m_sigmaB = 0.01;
    //this.m_BIFIflag = false;
  }

  clear() {
    this.m_x = 0;
    this.m_y = 0;
    this.m_sigma = 0.8;
    //this.m_sigmaB = 0.01;
    //this.m_BIFIflag = false;
  }

  /*setPixelSize(xPixelSize, yPixelSize) { // in mm
    this.m_xPixelSize = xPixelSize;
    this.m_yPixelSize = yPixelSize;
  }

  onMouseMove(x,y) {
    if (this.m_x !== 0.0 && this.m_y !== 0.0) {
      this.m_sigma = Math.abs(this.m_x - x)*5;
    }
  }

  onMouseWheel(x,y){
    if(y > 0)
      this.m_sigmaB +=0.01;
    if(y < 0)
      this.m_sigmaB -=0.01;
    if(this.m_sigmaB < 0.01)
      this.m_sigmaB = 0.01;
    if(this.m_sigmaB > 0.1)
      this.m_sigmaB = 0.1;
  }
  onMouseDown(x,y) {
    this.m_BIFIflag = true;
    if(this.m_x === 0.0 && this.m_y === 0.0){
      this.m_sigma=0.01;
      this.m_sigmaB=0.01;
      this.m_x = x;
      this.m_y = y;
    }
  }*/
}
