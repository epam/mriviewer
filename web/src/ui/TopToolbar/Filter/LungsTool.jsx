/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StoreActionType from '../../../store/ActionTypes';
import { ToolButton } from '../ToolButton';
import { checkVolume } from './checkVolume';
import { useAppContext } from '../../App/AppContext';
import { lungsFillJob } from './Jobs/lungsFillJob';

export const LungsTool = () => {
  const { startJob } = useAppContext();
  const dispatch = useDispatch();
  const { volumeSet, volumeIndex, graphics2d } = useSelector((state) => state);

  const volume = volumeSet.getVolume(volumeIndex);
  const [isSeed, setSeed] = useState(false);

  const handleChange = () => {
    if (!checkVolume(volume)) {
      return;
    }

    startJob(lungsFillJob(volume, setSeed), () => {
      // update render
      graphics2d.forceUpdate();
    });
  };

  useEffect(() => {
    if (isSeed) {
      dispatch({ type: StoreActionType.SET_LUNGS_SEED_STATUS, lungsSeedStatus: true });
      setSeed(false);
    }
  }, [isSeed]);
  return (
    <>
      <ToolButton content="Lungs segmentation" onChange={handleChange} icon="lungs" />
    </>
  );
};
