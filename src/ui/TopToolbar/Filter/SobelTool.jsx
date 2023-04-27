/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToolButton } from '../ToolButton';
import { useAppContext } from '../../App/AppContext';
import { checkVolume } from './checkVolume';
import StoreActionType from '../../../store/ActionTypes';
import ViewMode from '../../../store/ViewMode';
import Modes3d from '../../../store/Modes3d';
import { sobelJob } from './Jobs/sobelJob';

export const SobelTool = () => {
  const dispatch = useDispatch();
  const { startJob } = useAppContext();
  const { volumeSet, volumeIndex, graphics2d } = useSelector((state) => state);

  const volume = volumeSet.getVolume(volumeIndex);

  const handleChange = () => {
    if (!checkVolume(volume)) {
      return;
    }

    startJob(sobelJob(volume), () => {
      dispatch({ type: StoreActionType.SET_VOLUME_SET, volumeSet: volumeSet });
      dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: ViewMode.VIEW_2D });
      dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });

      // update render
      graphics2d.forceUpdate();
    });
  };

  return <ToolButton content="Sobel filter" onChange={handleChange} icon="edge-detection" />;
};
