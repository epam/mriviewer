/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import { UIButton } from '../Button/Button';
import { Container } from '../Layout/Container';
import { useDispatch, useSelector } from 'react-redux';
import StoreActionType from '../../store/ActionTypes';
import ViewMode from '../../store/ViewMode';
import { useNeedShow3d } from '../../utils/useNeedShow3d';

export function ModeSwitcherToolbar() {
  const dispatch = useDispatch();
  const { volumeSet, volumeIndex, viewMode } = useSelector((state) => state);

  const needShow3d = useNeedShow3d(volumeSet, volumeIndex);

  const setMode = (indexMode) => {
    dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: indexMode });
  };

  const set2dMode = () => {
    setMode(ViewMode.VIEW_2D);
  };

  const setFast3dMode = () => {
    setMode(ViewMode.VIEW_3D_LIGHT);
  };

  const set3dMode = () => {
    setMode(ViewMode.VIEW_3D);
  };

  const isModeActivated = (mode) => {
    return viewMode === mode;
  };

  return (
    <Container direction="vertical">
      <Tooltip content="Show volume in 2d mode per slice on selected orientation" placement="left">
        <UIButton handler={set2dMode} active={isModeActivated(ViewMode.VIEW_2D)} icon="2D" testId={'Button2D'} />
      </Tooltip>
      <Tooltip content="Show volume in 3d mode with fast rendering" placement="left">
        <UIButton handler={setFast3dMode} active={isModeActivated(ViewMode.VIEW_3D_LIGHT)} icon="lightning" testId={'ButtonLightning'} />
      </Tooltip>
      {needShow3d && (
        <Tooltip content="Show volume in 3d mode with old rendering" placement="left">
          <UIButton handler={set3dMode} active={isModeActivated(ViewMode.VIEW_3D)} icon="3D" testId={'Button3D'} />
        </Tooltip>
      )}
    </Container>
  );
}
