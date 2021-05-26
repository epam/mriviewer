/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext } from "react";

export const initialContext = {
  alert: {},
  progress: {
    show: false,
    text: '',
    value: 0,
  },
  volumeSet: [],
  volSetInfo: {},
  volumeIndex: 0,
  texture3d: {},
  arrErrors: [],
  viewMode: '2D',
  render2dZoom: 0,
  render2dyPos: 0,
  render2dxPos: 0,
  slider2d: 0,

  ff: {
    NEED_TEST_RAINBOW: true,
  }
}

export const Context = createContext({ ...initialContext });
