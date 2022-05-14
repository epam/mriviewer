/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Modes2d from '../../store/Modes2d';
import StoreActionType from '../../store/ActionTypes';
import { UIButton } from '../Button/Button';
import { Container } from '../Layout/Container';
import { Tooltip } from '../Tooltip/Tooltip';

export const Mode2dToolbar = () => {
  const dispatch = useDispatch();
  const { graphics2d, mode2d } = useSelector((state) => state);

  const onMode = (indexMode) => {
    dispatch({ type: StoreActionType.SET_MODE_2D, mode2d: indexMode });
    graphics2d.m_mode2d = indexMode;
    graphics2d.clear();

    dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });

    // build render image
    graphics2d.forceUpdate();
    // render just builded image
    graphics2d.forceRender();
  };

  const onModeSaggital = () => {
    onMode(Modes2d.SAGGITAL);
  };

  const onModeCoronal = () => {
    onMode(Modes2d.CORONAL);
  };

  const onModeTransverse = () => {
    onMode(Modes2d.TRANSVERSE);
  };

  const isModeActivated = (mode) => {
    return mode2d === mode;
  };

  return (
    <>
      <Container direction="vertical">
        <Tooltip content="Show slices along x axis" placement="left">
          <UIButton handler={onModeSaggital} active={isModeActivated(Modes2d.SAGGITAL)} icon="saggital" testId={'buttonSaggital'} />
        </Tooltip>
        <Tooltip content="Show slices along y axis" placement="left">
          <UIButton handler={onModeCoronal} active={isModeActivated(Modes2d.CORONAL)} icon="coronal" testId={'buttonCoronal'} />
        </Tooltip>
        <Tooltip content="Show slices along z axis" placement="left">
          <UIButton handler={onModeTransverse} active={isModeActivated(Modes2d.TRANSVERSE)} icon="transverse" testId={'buttonTransverse'} />
        </Tooltip>
      </Container>
    </>
  );
};
