/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderCaption, SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function IsosurfaceProperty() {
  const dispatch = useDispatch();
  const { isoThresholdValue } = useSelector((state) => state);

  const onChange = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_Isosurface, isoThresholdValue: value });
  };
  return (
    <>
      <SliderCaption caption="Isosurface" />
      <SliderRow>
        <Nouislider onChange={onChange} range={{ min: 0.0, max: 1.0 }} value={isoThresholdValue} connect={[true, false]} step={0.00001} />
      </SliderRow>
    </>
  );
}
