/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function ContrastProperty() {
  const dispatch = useDispatch();
  const { brightness3DValue } = useSelector((state) => state);

  const onChangeSliderContrast3D = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_Contrast3D, sliderContrast3D: value });
  };

  return (
    <SliderRow title="Cut plane opacity">
      <Nouislider
        onChange={onChangeSliderContrast3D}
        range={{ min: 0.0, max: 1.0 }}
        value={brightness3DValue}
        connect={[false, false]}
        step={0.00001}
        tooltips={true}
      />
    </SliderRow>
  );
}
