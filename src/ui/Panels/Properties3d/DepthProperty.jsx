/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderCaption, SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function DepthProperty() {
  const dispatch = useDispatch();
  const { sliderErDepth } = useSelector((state) => state);

  const onChange = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_ErDepth, sliderErDepth: value });
  };
  return (
    <>
      <SliderCaption caption="Depth" />
      <SliderRow>
        <Nouislider onChange={onChange} range={{ min: 1.0, max: 100.0 }} value={sliderErDepth} connect={[true, false]} step={0.00001} />
      </SliderRow>
    </>
  );
}
