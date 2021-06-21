/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import { UIButton } from "./Button"

const icons = {
  
  logo, file, folder, link, grid, download, report, camera,

  "2D": "2D", "3D": "3D", lightning,

  transverse, saggital, coronal,

  isosurface, E, M, V, I,

  opacity,
  
  cursor, target, line, angle, area, square, T, edit, clear, eraser,
  
  "zoom": "zoom", "zoom_100": "zoom_100",
  
  lungs, brain, "edge-detection": "edge-detection", "noise-reduction": "noise-reduction",
  
  back, brightness, expand,
  collapse, forth, "roll-up": "roll-up",  scissors, settings,
  triangle,  D,
};

export const ButtonsDemo = () => (
    <div style={{ padding: 20 }}>
            { Object.keys(icons).map(icon =><UIButton icon={icon} key={icon}  />) }
    </div>
);
