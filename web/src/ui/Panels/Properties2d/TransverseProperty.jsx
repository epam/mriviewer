/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderRow } from '../../Form';
import { useDispatch, useSelector } from 'react-redux';
import Modes2d from '../../../store/Modes2d';
import StoreActionType from '../../../store/ActionTypes';

export const TransverseProperty = () => {
  const dispatch = useDispatch();
  const { volumeSet, volumeIndex, sliceRatio, mode2d, graphics2d } = useSelector((state) => state);
  const { m_volumes } = volumeSet;
  let xDim = 0,
    yDim = 0,
    zDim = 0;
  if (m_volumes.length > 0) {
    const volume = volumeSet.getVolume(volumeIndex);
    if (volume !== null) {
      xDim = volume.m_xDim;
      yDim = volume.m_yDim;
      zDim = volume.m_zDim;
    }
  }

  // slider maximum value is depend on current x or y or z 2d mode selection
  const getMaxRange = () => {
    if (mode2d === Modes2d.SAGGITAL) {
      return xDim - 1;
    } else if (mode2d === Modes2d.CORONAL) {
      return yDim - 1;
    } else if (mode2d === Modes2d.TRANSVERSE) {
      return zDim - 1;
    }
  };
  const slideRangeMax = getMaxRange();

  const onChangeSliderSlice = (value) => {
    const ratio = value / slideRangeMax;
    dispatch({ type: StoreActionType.SET_SLIDER_2D, sliceRatio: ratio });
    // clear all 2d tools
    graphics2d.clear();

    // re-render (and rebuild segm if present)
    graphics2d.forceUpdate();

    // render just builded image
    graphics2d.forceRender();
  };

  const start = [Math.floor(sliceRatio * slideRangeMax)];

  const getAriaValueText = (value) => {
    return Math.floor(value).toString();
  };

  return (
    <SliderRow icon="transverse">
      <Nouislider
        onChange={onChangeSliderSlice}
        range={{ min: 0, max: slideRangeMax }}
        value={start}
        step={1}
        getAriaValueText={getAriaValueText}
        tooltips={true}
      />
    </SliderRow>
  );
};
