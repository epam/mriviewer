/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { Tooltip } from '../../Tooltip/Tooltip';
import { UIButton } from '../../Button/Button';
import { Container } from '../Container';
import { useDispatch, useSelector } from 'react-redux';
import StoreActionType from '../../../store/ActionTypes';
import ViewMode from '../../../store/ViewMode';

export function ModeSwitcherToolbar() {
  const dispatch = useDispatch();
  const { volumeSet, volumeIndex, viewMode } = useSelector((state) => state);

  const FOUR = 4;
  const needShow3d = useMemo(() => {
    const volume = volumeSet.getVolume(volumeIndex);
    if (volume !== null) {
      if (volume.m_bytesPerVoxel !== FOUR) {
        return true;
      }
    }
    return false;
  }, [volumeSet, volumeIndex]);

  const setMode = (indexMode) => {
    dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: indexMode });
  };

  const onMode2d = () => {
    setMode(ViewMode.VIEW_2D);
  };

  const onModeFast3d = () => {
    setMode(ViewMode.VIEW_3D_LIGHT);
  };

  const onModeOld3d = () => {
    setMode(ViewMode.VIEW_3D);
  };

  const isModeActivated = (mode) => {
    return viewMode === mode;
  };

  return (
    <Container direction="vertical">
      <Tooltip content="Show volume in 2d mode per slice on selected orientation" placement="left">
        <UIButton handler={onMode2d} active={isModeActivated(ViewMode.VIEW_2D)} icon="2D" />
      </Tooltip>
      <Tooltip content="Show volume in 3d mode with fast rendering" placement="left">
        <UIButton handler={onModeFast3d} active={isModeActivated(ViewMode.VIEW_3D_LIGHT)} icon="lightning" />
      </Tooltip>
      {needShow3d && (
        <Tooltip content="Show volume in 3d mode with old rendering" placement="left">
          <UIButton handler={onModeOld3d} active={isModeActivated(ViewMode.VIEW_3D)} icon="3D" />
        </Tooltip>
      )}
    </Container>
  );
}
