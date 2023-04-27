/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderRow } from '../../Form';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export const BrightnessProperty = () => {
  const dispatch = useDispatch();
  const { brightness3DValue } = useSelector((state) => state);

  const onChangeSliderBrightness = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_Brightness, brightness3DValue: value });
  };

  return (
    <SliderRow icon={'brightness'} title={'Brightness'}>
      <Nouislider
        onChange={onChangeSliderBrightness}
        range={{ min: 0.0, max: 1.0 }}
        value={brightness3DValue}
        connect={[false, false]}
        step={0.00001}
      />
    </SliderRow>
  );
};
