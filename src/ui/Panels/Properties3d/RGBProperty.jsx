/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function RGBProperty({ changeOnlyRG = false }) {
  const dispatch = useDispatch();
  const { slider3d_r, slider3d_g, slider3d_b } = useSelector((state) => state);

  const onChange = (value) => {
    const [r, g, b] = value;
    dispatch({ type: StoreActionType.SET_SLIDER_3DR, slider3d_r: r });
    dispatch({ type: StoreActionType.SET_SLIDER_3DG, slider3d_g: g });
    if (!changeOnlyRG) {
      dispatch({ type: StoreActionType.SET_SLIDER_3DB, slider3d_b: b });
    }
  };

  const wArr = changeOnlyRG ? [slider3d_r, slider3d_g] : [slider3d_r, slider3d_g, slider3d_b];

  return (
    <SliderRow>
      <Nouislider onChange={onChange} range={{ min: 0.0, max: 1.0 }} value={wArr} connect={[false, true, false, true]} step={0.00001} />
    </SliderRow>
  );
}
