/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import { UIButton } from "./Button"

const icons = { logo, file, folder, link, grid, download, report, camera,

  "2D": "2D", "3D": "3D", lightning,

    transverse, saggital, coronal,

  isosurface, E, M, T, V, I,

    opacity,

     angle, area, back, brain, brightness,  clear,
        collapse,  cursor,  "edge-detection": "edge-detection", eraser, expand,
         forth,   line,  lungs, "noise-reduction": "noise-reduction",
         "roll-up": "roll-up",  scissors, settings, square, target,
        triangle, "zoom-in": "zoom-in", "zoom-out": "zoom-out", D,
};

export const ButtonsDemo = () => (
    <div style={{ padding: 20 }}>
            { Object.keys(icons).map(icon =><UIButton icon={icon} key={icon}  />) }
    </div>
);
