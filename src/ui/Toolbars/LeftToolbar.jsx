/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';

import ViewMode from '../../store/ViewMode';
import { ModeSwitcherToolbar } from './Left/ModeSwitcherToolbar';
import { Fast3dToolbar } from './Left/Fast3dToolbar';
import ModeView from '../../store/ViewMode';
import { Mode2dToolbar } from './Left/Mode2dToolbar';

export const LeftToolbar = () => {
  const { viewMode } = useSelector((state) => state);

  return (
    <>
      <ModeSwitcherToolbar />
      {viewMode === ViewMode.VIEW_3D_LIGHT && <Fast3dToolbar />}
      {viewMode === ModeView.VIEW_2D && <Mode2dToolbar />}
    </>
  );
};
