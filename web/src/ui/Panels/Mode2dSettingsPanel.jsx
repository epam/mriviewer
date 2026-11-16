/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SegmentationProperty } from './Properties2d/SegmentationProperty';
import SelectVolumeProperty from './Properties2d/SelectVolumeProperty';
import { SliderCaption } from '../Form';
import { TransverseProperty } from './Properties2d/TransverseProperty';
import { useSelector, useDispatch } from 'react-redux';
import ColorPicker from '../Panels/ColorPicker/ColorPicker';
import './ColorPicker/ColorPicker.css';
import StoreActionType from '../../store/ActionTypes';
import Tools2dType from '../../engine/tools2d/ToolTypes';

export const Mode2dSettingsPanel = () => {
  const { volumeSet } = useSelector((state) => state);
  const { m_volumes } = volumeSet;
  const { indexTools2d } = useSelector((state) => state);
  const { selectedColor } = useSelector((state) => state);
  const dispatch = useDispatch();

  const handleColorChange = (newColor) => {
    dispatch({ type: StoreActionType.SET_SELECTED_COLOR, selectedColor: newColor.hex });
  };

  return (
    <>
      <SliderCaption caption="Slider" />
      <TransverseProperty />
      <SegmentationProperty />
      {m_volumes.length > 1 && <SelectVolumeProperty />}
      {indexTools2d === Tools2dType.PAINT && (
        <div className="colorPicker">
          <p>Select color:</p>
          <ColorPicker sketchPickerClass="sketchPicker" selectedColor={selectedColor} onChange={handleColorChange} />
        </div>
      )}
    </>
  );
};
