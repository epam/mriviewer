/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
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
    if (this.m_zoom + wheelDeltaY * TRANSFORM >= MIN_ZOOM && this.m_zoom + wheelDeltaY * TRANSFORM <= MAX_ZOOM) {
      this.m_zoom = this.m_zoom + wheelDeltaY * TRANSFORM;
    }
  }

  makeDefault() {
    this.m_zoom = 1;
  }
}
