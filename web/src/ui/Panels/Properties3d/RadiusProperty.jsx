/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderCaption, SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function RadiusProperty() {
  const dispatch = useDispatch();
  const { sliderErRadius } = useSelector((state) => state);

  const onChange = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_ErRadius, sliderErRadius: value });
  };
  return (
    <>
      <SliderCaption caption="Radius" />
      <SliderRow>
        <Nouislider onChange={onChange} range={{ min: 1.0, max: 100.0 }} value={sliderErRadius} connect={[true, false]} step={0.00001} />
      </SliderRow>
    </>
  );
}
