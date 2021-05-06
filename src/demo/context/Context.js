/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import ViewModes from "../store/ViewModes";
import { createContext } from "react";
import VolumeSet from "../engine/VolumeSet";

export const initialContext = {
  alert: {},
  progress: {
    show: false,
    text: '',
    value: 0,
  },
  volumeSet: new VolumeSet(),
  arrErrors: [],
  viewMode: ViewModes.VIEW_2D
}

export const Context = createContext({ ...initialContext });
