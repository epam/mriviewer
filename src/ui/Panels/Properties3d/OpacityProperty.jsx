/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function OpacityProperty() {
  const dispatch = useDispatch();
  const { opacityValue3D } = useSelector((state) => state);

  const onChangeSliderOpacity = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_Opacity, opacityValue3D: value });
  };
  return (
    <SliderRow icon="opacity" title="Opacity">
      <Nouislider
        onChange={onChangeSliderOpacity.bind(this)}
        range={{ min: 0.0, max: 1.0 }}
        value={opacityValue3D}
        connect={[true, false]}
        step={2 ** -8}
      />
    </SliderRow>
  );
}
