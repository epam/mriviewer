/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

export default class ZoomTool {
  constructor(zoom) {
    this.m_zoom = zoom;
  }

  applyDelta(wheelDeltaY) {
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
