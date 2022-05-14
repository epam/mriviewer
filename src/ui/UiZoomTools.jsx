/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { connect } from 'react-redux';
import Tools2dType from '../engine/tools2d/ToolTypes';
import StoreActionType from '../store/ActionTypes';
import { buttonsBuilder } from './Button/Button';
import { Container } from './Layout/Container';

const UiZoomTools = (props) => {
  const [activeButton, setActiveButton] = useState(Tools2dType.NONE);

  const mediator = (buttonId) => {
    setActiveButton(buttonId);
    props.dispatch({ type: StoreActionType.SET_2D_TOOLS_INDEX, indexTools2d: buttonId });

    if (buttonId === Tools2dType.ZOOM_100) {
      props.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
      props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
      props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });

      props.graphics2d.forceUpdate();
      props.graphics2d.forceRender();
    }
  };

  const buttons = [
    {
      icon: 'zoom',
      caption: 'Zoom in/out',
      handler: mediator.bind(null, Tools2dType.ZOOM),
      id: Tools2dType.ZOOM,
    },
    {
      icon: 'zoom_100',
      caption: 'Zoom to default',
      handler: mediator.bind(null, Tools2dType.ZOOM_100),
      id: Tools2dType.ZOOM_100,
    },
  ];

  return <Container direction="vertical">{buttonsBuilder(buttons, { activeButton }, 'left')}</Container>;
};

export default connect((store) => store)(UiZoomTools);
