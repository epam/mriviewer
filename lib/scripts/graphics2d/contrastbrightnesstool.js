/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
 * 2d area tool
 * @module app/scripts/graphics2d/contrastbrightnesstool.js
 */

export default class ContrastBrightnessTool {

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
    this.m_contrast = 1;
    this.m_brightness = 0;
    this.m_COBRflag = false;
  }

  clear() {
    /*this.m_x = 0;
    this.m_y = 0;*/
    this.m_contrast = 1;
    this.m_brightness = 0;
    this.m_COBRflag = false;
  }

  setPixelSize(xPixelSize, yPixelSize) { // in mm
    this.m_xPixelSize = xPixelSize;
    this.m_yPixelSize = yPixelSize;
  }

  /*onMouseMove(x,y) {

    if (this.m_x !== 0.0 && this.m_y !== 0.0) {
      this.m_contrast = (this.m_x - x)*10;
      this.m_brightness = (this.m_y - y);
    }
  }

  onMouseDown(x,y) {
    this.m_COBRflag = true;
    if(this.m_x === 0.0 && this.m_y === 0.0){
      this.m_x = x;
      this.m_y = y;
    }
  }*/
}
