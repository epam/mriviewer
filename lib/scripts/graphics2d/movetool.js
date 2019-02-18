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
 * @module app/scripts/graphics2d/areatool
 */

export default class MoveTool {

  /**
   * Initialize area tool
   * @param (object) scene - scene object
   * @param (object) lineWidth - width of all lines
   */
  constructor(zoom, posX, posY) {
    /** @property {float} m_zoom - size of zoom */
    this.m_zoom = zoom;
    /** @property {Array} m_delta - array of pairs (dx, dy)  */
    this.m_delta = [];
    /** @property {float} m_tempCoordinates - coordinates of start position of mouse */
    this.m_tempCoordinates = [];
    this.m_delta.x = posX;
    this.m_delta.y = posY;
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseDown(x, y) {
    this.m_runningState = true;
    console.log(`${this.m_runningState}`);
    this.m_tempCoordinates.x = x;
    this.m_tempCoordinates.y = y;
  }

  /**
   * Mouse down events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseUp() {
    this.m_runningState = false;
    console.log(`${this.m_runningState}`);
  }

  /**
   * Mouse move events handler
   * @param (float) x - mouse x coordinate
   * @param (float) y - mouse y coordinate
   */
  onMouseMove(x, y) {
    if (this.m_runningState) {
      this.m_delta.x = this.m_tempCoordinates.x - x;
      this.m_delta.y = this.m_tempCoordinates.y - y;
    }
    return this.m_delta;
  }
}
