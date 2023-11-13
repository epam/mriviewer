/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

import { connect } from 'react-redux';
import Tools2dType from '../engine/tools2d/ToolTypes';
import StoreActionType from '../store/ActionTypes';
import { buttonsBuilder } from './Button/Button';
import { Container } from './Layout/Container';

const UiZoomTools = (props) => {
  const MIN_ZOOM_THRESHOLD = 0.8;
  const [activeButton, setActiveButton] = useState(Tools2dType.NONE);

  const zoomImage = (step, buttonId) => {
    const currentZoom = props.render2dZoom;
    let newZoom = Math.round((currentZoom + step) * 10) / 10;
    const objCanvas = props.graphics2d.m_mount.current;
    const canvasRect = objCanvas.getBoundingClientRect();
    let xPosNew;
    let yPosNew;

    if (buttonId === Tools2dType.ZOOM_IN && newZoom > 0) {
      xPosNew = props.render2dxPos + (canvasRect.width / 2) * Math.abs(step);
      yPosNew = props.render2dyPos + (canvasRect.height / 2) * Math.abs(step);
    } else if (buttonId === Tools2dType.ZOOM_OUT && newZoom < 1) {
      const initialX = canvasRect.width * currentZoom + props.render2dxPos;
      const initialY = canvasRect.height * currentZoom + props.render2dyPos;
      xPosNew = initialX - (initialX - props.render2dxPos) * (newZoom / currentZoom);
      yPosNew = initialY - (initialY - props.render2dyPos) * (newZoom / currentZoom);
    }

    if (xPosNew < 0) {
      xPosNew = 0;
    }
    if (yPosNew < 0) {
      yPosNew = 0;
    }
    if (newZoom > 1) {
      newZoom = 1;
      xPosNew = 0;
      yPosNew = 0;
    }
    if (newZoom < 0.1) {
      return;
    }
    props.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: newZoom });
    props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: xPosNew });
    props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: yPosNew });
  };

  const mediator = (buttonId) => {
    setActiveButton(buttonId);
    props.dispatch({ type: StoreActionType.SET_2D_TOOLS_INDEX, indexTools2d: buttonId });

    if (buttonId === Tools2dType.ZOOM_100 || (buttonId === Tools2dType.ZOOM_OUT && props.render2dZoom > MIN_ZOOM_THRESHOLD)) {
      props.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
      props.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
      props.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });
    } else {
      zoomImage(buttonId === Tools2dType.ZOOM_IN ? -0.1 : 0.1, buttonId);
    }
  };

  useEffect(() => {
    props.graphics2d.forceUpdate();
    props.graphics2d.forceRender();
  }, [props.render2dZoom]);

  const buttons = [
    {
      icon: 'zoom_in',
      caption: 'Zoom in',
      handler: mediator.bind(null, Tools2dType.ZOOM_IN),
      id: Tools2dType.ZOOM_IN,
    },
    {
      icon: 'zoom_out',
      caption: 'Zoom out',
      handler: mediator.bind(null, Tools2dType.ZOOM_OUT),
      id: Tools2dType.ZOOM_OUT,
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
