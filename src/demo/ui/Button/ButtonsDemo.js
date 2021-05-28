/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import { UIButton } from "./Button"

const icons = ["logo", "2D", "3D", "angle", "area", "back", "brain", "brightness", "camera", "clear",
        "collapse", "coronal", "cursor", "download", "edge-detection", "eraser", "expand", "file",
        "folder", "forth", "grid", "I", "isosurface", "lightning", "line", "link", "lungs", "noise-reduction",
        "opacity", "report", "roll-up", "saggital", "scissors", "settings", "square", "target", "transverse",
        "triangle", "zoom-in", "zoom-out", "D", "E", "M", "T", "V",
];

export const ButtonsDemo = () => (
    <div style={{ padding: 20 }}>
            { icons.map(icon =><UIButton icon={icon} key={icon}  />) }
    </div>
);
