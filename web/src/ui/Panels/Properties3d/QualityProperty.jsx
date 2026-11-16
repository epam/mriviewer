/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDispatch, useSelector } from 'react-redux';
import StoreActionType from '../../../store/ActionTypes';
import { SliderRow } from '../../Form';
import { Nouislider } from '../../Nouislider/Nouislider';
import React from 'react';

export const QualityProperty = () => {
  const dispatch = useDispatch();
  const { quality3DStepSize } = useSelector((state) => state);

  const onChangeSliderQuality = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_Quality, quality3DStepSize: value });
  };

  return (
    <SliderRow icon="triangle" title="Quality">
      <Nouislider
        onChange={onChangeSliderQuality}
        range={{ min: 0.0, max: 1.0 }}
        value={quality3DStepSize}
        connect={[false, false]}
        step={0.00001}
      />
    </SliderRow>
  );
};
