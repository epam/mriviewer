/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { Mode2dSettingsPanel } from './Mode2dSettingsPanel';
import { Mode3dSettingsPanel } from './Mode3dSettingsPanel';
import ViewMode from '../../store/ViewMode';
import { DragAndDropContainer } from '../DragAndDrop/DragAndDropContainer';
import { ModeFast3dSettingsPanel } from './ModeFast3dSettingsPanel';

export const RightPanel = () => {
  const { viewMode } = useSelector((state) => state);
  return (
    <DragAndDropContainer>
      {viewMode === ViewMode.VIEW_2D && <Mode2dSettingsPanel />}
      {viewMode === ViewMode.VIEW_3D_LIGHT && <ModeFast3dSettingsPanel />}
      {viewMode === ViewMode.VIEW_3D && <Mode3dSettingsPanel />}
    </DragAndDropContainer>
  );
};
