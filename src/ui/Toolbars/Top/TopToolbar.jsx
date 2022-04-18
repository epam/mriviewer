/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';

import ModeView from '../../../store/ViewMode';
import ExploreTools from './ExploreTools';
import UiFilterMenu from '../../UiFilterMenu';

export const TopToolbar = () => {
  const { viewMode } = useSelector((state) => state);

  return (
    <>
      {viewMode === ModeView.VIEW_2D && <ExploreTools />}
      {viewMode === ModeView.VIEW_2D && <UiFilterMenu />}
    </>
  );
};
