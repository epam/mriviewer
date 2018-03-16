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


export default class ZoomTool {

  /**
   * Initialize area tool
   * @param (object) scene - scene object
   * @param (object) lineWidth - width of all lines
   */
  constructor(zoom) {
    /** @property {float} m_zoom - size of zoom */
    this.m_zoom = zoom;
  }

  /**
   * Return running state
   * @return {boolean} True if last line has not been fixed yet
   */
  isRunning() {
    return this.m_runningState;
  }

  /**
   * Mouse down events handler
   * @param (float) wheelDeltaX - mouse wheel x coordinate
   * @param (float) wheelDeltaY - mouse wheel y coordinate
   * @param (float) wheelDeltaFactor - mouse wheel delta coordinate
   */
  onMouseWheel(wheelDeltaY) {
    const MAX_ZOOM = 1;
    const MIN_ZOOM = 0.125;
    const TRANSFORM = 0.0001;
    if ((this.m_zoom + wheelDeltaY * TRANSFORM >= MIN_ZOOM) && (this.m_zoom + wheelDeltaY * TRANSFORM <= MAX_ZOOM)) {
      this.m_zoom = this.m_zoom + wheelDeltaY * TRANSFORM;
    }
  }

  makeDefault() {
    this.m_zoom = 1;
  }
}
