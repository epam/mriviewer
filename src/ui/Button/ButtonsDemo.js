/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import { UIButton } from "./Button"

export const ButtonsDemo = () => (
    <div style={{ padding: 20 }}>
        <UIButton icon="logo" />
        <UIButton icon="2D" active />
        <UIButton icon="3D" rounded />
        <UIButton icon="angle" handler={ () => console.log('click')} />
        <UIButton icon="area" />
        <UIButton icon="back" rounded  mode="light" active />
        <UIButton icon="brain" />
        <UIButton icon="brightness" rounded mode="light" />
        <UIButton icon="camera" />
        <UIButton icon="clear" />
        <UIButton icon="collapse" rounded mode="accent" active />
        <UIButton icon="coronal" />
        <UIButton icon="cursor" />
        <UIButton icon="D" />
        <UIButton icon="download" rounded mode="accent" />
        <UIButton icon="E" />
        <UIButton icon="edge-detection" />
        <UIButton icon="eraser" />
        <UIButton icon="expand" />
        <UIButton icon="file" />
        <UIButton icon="folder" />
        <UIButton icon="forth" />
        <UIButton icon="grid" />
        <UIButton icon="I" />
        <UIButton icon="isosurface" />
        <UIButton icon="lightning" />
        <UIButton icon="line" />
        <UIButton icon="link" />
        <UIButton icon="lungs" />
        <UIButton icon="M" />
        <UIButton icon="noise-reduction" />
        <UIButton icon="opacity" />
        <UIButton icon="report" />
        <UIButton icon="roll-up" />
        <UIButton icon="saggital" />
        <UIButton icon="scissors" />
        <UIButton icon="settings" />
        <UIButton icon="square" />
        <UIButton icon="T" />
        <UIButton icon="target" />
        <UIButton icon="transverse" />
        <UIButton icon="triangle" />
        <UIButton icon="V" />
        <UIButton icon="zoom-in" />
        <UIButton icon="zoom-out" />
        <UIButton caption={"Click me!"} />
        <UIButton caption={"Click me!"} active />
        <UIButton caption={"Click me!"} mode="accent"/>
        <UIButton caption={"Click me!"} mode="accent" active/>
        <UIButton caption={"Click me!"} mode="light"/>
        <UIButton caption={"Click me!"} mode="light" active/>
    </div>
);
