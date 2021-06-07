/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

import { Container } from "./Container";
import { buttonsBuilder } from "../Button/Button";
import Tools2dType from "../../engine/tools2d/ToolTypes";


export const ExploreTools = () => {
  const [activeButton, setActiveButton] = useState("cursor");
  
  const mockedHandler = (icon) => {
    setActiveButton(icon);
    console.log(`${icon} button clicked`);
  }
  
  
  const buttons = [
    {
      id: Tools2dType.DEFAULT,
      icon: "cursor",
      handler: mockedHandler.bind(null, Tools2dType.DEFAULT)
    },
    {
      icon: "target",
      caption: "Get voxel intensity",
      handler: mockedHandler.bind(null, Tools2dType.INTENSITY),
      id: Tools2dType.INTENSITY
    },
    {
      icon: "line",
      caption: "Measure distance between voxels",
      handler: mockedHandler.bind(null, Tools2dType.DISTANCE),
      id: Tools2dType.DISTANCE
    },
    {
      icon: "angle",
      caption: "Measure angle between voxels",
      handler: mockedHandler.bind(null, Tools2dType.ANGLE),
      id: Tools2dType.ANGLE,
    },
    {
      icon: "area",
      caption: "Calculate arbitrary area",
      handler: mockedHandler.bind(null, Tools2dType.AREA),
      id: Tools2dType.AREA,
    },
    {
      icon: "square",
      caption: "Calculate rectangular area",
      handler: mockedHandler.bind(null, Tools2dType.RECT),
      id: Tools2dType.RECT,
    },
    {
      icon: "T",
      caption: "Add annotation text",
      handler: mockedHandler.bind(null, Tools2dType.TEXT),
      id: Tools2dType.TEXT,
    },
    {
      icon: "eraser",
      caption: "Delete annotation object",
      handler: mockedHandler.bind(null, Tools2dType.DELETE),
      id: Tools2dType.DELETE,
    }
  ];
  
  return (
    <Container direction="horizontal">
      {buttonsBuilder(buttons, { activeButton })}
    </Container>
  )
};
