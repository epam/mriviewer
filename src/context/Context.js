/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import ViewModes from "../store/ViewModes";
import { createContext } from "react";
import { Volume } from "../engine/Volume";

export const initialContext = {
  alert: {},
  progress: {
    show: false,
    text: '',
    value: 0,
  },
  volumeSet: [new Volume()],
  texture3d: {},
  arrErrors: [],
  viewMode: ViewModes.VIEW_2D
}

export const Context = createContext({ ...initialContext });
