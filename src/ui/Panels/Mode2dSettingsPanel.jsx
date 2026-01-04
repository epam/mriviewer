/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { SegmentationProperty } from './Properties2d/SegmentationProperty';
import SelectVolumeProperty from './Properties2d/SelectVolumeProperty';
import { SliderCaption } from '../Form';
import { TransverseProperty } from './Properties2d/TransverseProperty';
import { useSelector } from 'react-redux';
import UiModalWindowRange from '../Modals/UiModalWindowRange';
import { activeViewService } from '../../engine/lib/core/graphics/ActiveViewService';

import css from './Mode2dSettingsPanel.module.css';
import modalCss from '../Modals/Modals.module.css';

export const Mode2dSettingsPanel = () => {
  const { volumeSet, showWindowRangeSlider } = useSelector((state) => state);
  const [winMin, setWinMin] = useState(0);
  const [winMax, setWinMax] = useState(1);
  const { m_volumes } = volumeSet;
  const renderMode = activeViewService.getActiveMode();

  const handlerWindowRange = (value) => {
    const [min, max] = value;
    setWinMin(min);
    setWinMax(max);
    activeViewService.setDataWindow(value);
  };

  // Determine the class name based on the renderMode
  const className = renderMode === '3_AXIS' ? css.settingsPanelHorizontal : css.settingsPanelVertical;

  return (
    <div className={`${css.settingsPanel} ${className}`}>
      <div className={css.sliderWrapper}>
        <SliderCaption caption="Slider" />
        <TransverseProperty />
        <SegmentationProperty />
      </div>
      {m_volumes.length > 1 && <SelectVolumeProperty className={css.selectVolumeBlock} />}
      {showWindowRangeSlider && (
        <UiModalWindowRange
          className={modalCss.modalWindowRange}
          onChange={handlerWindowRange}
          connect={true}
          title="Select window range to display DICOM"
          m_dataMin={0}
          m_dataMax={1}
          windowMin={winMin}
          windowMax={winMax}
          step={0.1}
        />
      )}
    </div>
  );
};
