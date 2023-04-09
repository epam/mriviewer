/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { Container } from '../Layout/Container';
import { buttonsBuilder } from '../Button/Button';
import Tools2dType from '../../engine/tools2d/ToolTypes';
import StoreActionType from '../../store/ActionTypes';
import { connect } from 'react-redux';

const ExploreTools = (props) => {
  const [activeButton, setActiveButton] = useState(Tools2dType.ZOOM_100);

  const mediator = (buttonId) => {
    setActiveButton(buttonId);
    console.log(`${buttonId} button clicked`);
    props.dispatch({ type: StoreActionType.SET_2D_TOOLS_INDEX, indexTools2d: buttonId });

    if (buttonId === Tools2dType.ZOOM_100) {
      props.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
      props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
      props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });

      props.graphics2d.forceUpdate();
      props.graphics2d.forceRender();
    }

    if (buttonId === Tools2dType.CLEAR) {
      const gra2d = props.graphics2d;
      gra2d.clear();
    }
  };

  const buttons = [
    {
      id: Tools2dType.NONE,
      icon: 'cursor',
      caption: 'Explore model',
      handler: mediator.bind(null, Tools2dType.NONE),
    },
    {
      icon: 'target',
      caption: 'Get voxel intensity',
      handler: mediator.bind(null, Tools2dType.INTENSITY),
      id: Tools2dType.INTENSITY,
    },
    {
      icon: 'line',
      caption: 'Measure distance between voxels',
      handler: mediator.bind(null, Tools2dType.DISTANCE),
      id: Tools2dType.DISTANCE,
    },
    {
      icon: 'angle',
      caption: 'Measure angle between voxels',
      handler: mediator.bind(null, Tools2dType.ANGLE),
      id: Tools2dType.ANGLE,
    },
    {
      icon: 'area',
      caption: 'Calculate arbitrary area',
      handler: mediator.bind(null, Tools2dType.AREA),
      id: Tools2dType.AREA,
    },
    {
      icon: 'square',
      caption: 'Calculate rectangular area',
      handler: mediator.bind(null, Tools2dType.RECT),
      id: Tools2dType.RECT,
    },
    {
      icon: 'T',
      caption: 'Add annotation text',
      handler: mediator.bind(null, Tools2dType.TEXT),
      id: Tools2dType.TEXT,
    },
    {
      icon: 'edit',
      caption: 'Move annotation text',
      handler: mediator.bind(null, Tools2dType.EDIT),
      id: Tools2dType.EDIT,
    },
    {
      icon: 'clear',
      caption: 'Clear all objects',
      handler: mediator.bind(null, Tools2dType.CLEAR),
      id: Tools2dType.CLEAR,
    },
    {
      icon: 'eraser',
      caption: 'Delete annotation object',
      handler: mediator.bind(null, Tools2dType.DELETE),
      id: Tools2dType.DELETE,
    },
  ];

  return <Container direction="horizontal">{buttonsBuilder(buttons, { activeButton })}</Container>;
};

export default connect((store) => store)(ExploreTools);
