/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

import { Container } from "./Container";
import { buttonsBuilder } from "../Button/Button";


export const ExploreTools = () => {
    const [activeButton, setActiveButton] = useState("cursor");

    const mockedHandler = (icon) => {
        setActiveButton(icon);
        console.log(`${icon} button clicked`);
    }

    const buttons = [
        {
            icon: "cursor",
            handler: mockedHandler.bind(null, 'cursor')
        },
        {
            icon: "target",
            caption: "Get voxel intensity",
            handler: mockedHandler.bind(null, 'target')
        },
        {
            icon: "line",
            caption: "Measure distance between voxels",
            handler: mockedHandler.bind(null, 'line')
        },
        {
            icon: "angle",
            caption: "Measure angle between voxels",
            handler: mockedHandler.bind(null, 'angle')
        },
        {
            icon: "area",
            caption: "Calculate arbitrary area",
            handler: mockedHandler.bind(null, 'area')
        },
        {
            icon: "square",
            caption: "Calculate rectangular area",
            handler: mockedHandler.bind(null, 'square')
        },
        {
            icon: "T",
            caption: "Add annotation text",
            handler: mockedHandler.bind(null, 'T')
        },
        {
            icon: "eraser",
            caption: "Delete annotation object",
            handler: mockedHandler.bind(null, 'eraser')
        }
    ];

    return (
        <Container direction="horizontal">
            {buttonsBuilder(buttons, { activeButton })}
        </Container>
    )
};
