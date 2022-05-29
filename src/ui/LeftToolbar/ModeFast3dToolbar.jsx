/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tooltip } from '../Tooltip/Tooltip';
import { UIButton } from '../Button/Button';
import { Container } from '../Layout/Container';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StoreActionType from '../../store/ActionTypes';

export function ModeFast3dToolbar() {
  const dispatch = useDispatch();
  const { isTool3D } = useSelector((state) => state);

  const toggleIsTool3d = () => {
    dispatch({ type: StoreActionType.SET_IS_TOOL3D, isTool3D: !isTool3D });
    dispatch({ type: StoreActionType.SET_SLIDER_Contrast3D, sliderContrast3D: 0 });
  };

  return (
    <Container direction="vertical">
      <Tooltip content="Show volume in 3d mode with simple toolset" placement="left">
        <UIButton handler={toggleIsTool3d} active={!isTool3D} icon="V" testId={'buttonV'} />
      </Tooltip>
      <Tooltip content="Show volume in 2d mode per slice on selected orientation" placement="left">
        <UIButton handler={toggleIsTool3d} active={isTool3D} icon="T" testId={'buttonT'} />
      </Tooltip>
    </Container>
  );
}
