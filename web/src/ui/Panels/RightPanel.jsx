/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { useState } from 'react';

import { Mode2dSettingsPanel } from './Mode2dSettingsPanel';
import { Mode3dSettingsPanel } from './Mode3dSettingsPanel';
import ViewMode from '../../store/ViewMode';
import { DragAndDropContainer } from '../DragAndDrop/DragAndDropContainer';
import { ModeFast3dSettingsPanel } from './ModeFast3dSettingsPanel';
import UiModalWindowRange from '../Modals/UiModalWindowRange';

import modalCss from '../Modals/Modals.module.css';

export const RightPanel = () => {
  const { viewMode, showWindowRangeSlider, graphics2d } = useSelector((state) => state);
  const [winMin, setWinMin] = useState(0);
  const [winMax, setWinMax] = useState(1);

  const handlerWindowRange = (value) => {
    const [min, max] = value;
    setWinMin(min);
    setWinMax(max);
    graphics2d.setDataWindow(value);
  };

  return (
    <DragAndDropContainer>
      {viewMode === ViewMode.VIEW_2D && <Mode2dSettingsPanel />}
      {viewMode === ViewMode.VIEW_3D_LIGHT && <ModeFast3dSettingsPanel />}
      {viewMode === ViewMode.VIEW_3D && <Mode3dSettingsPanel />}
      {showWindowRangeSlider && (
        <div>
          <UiModalWindowRange
            className={modalCss.modalWindowRange}
            onChange={handlerWindowRange}
            connect={true}
            title="Select window center and width to display DICOM"
            m_dataMin={0}
            m_dataMax={1}
            windowMin={winMin}
            windowMax={winMax}
            step={0.1}
          />
        </div>
      )}
    </DragAndDropContainer>
  );
};
