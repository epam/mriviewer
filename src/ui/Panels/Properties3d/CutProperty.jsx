/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nouislider } from '../../Nouislider/Nouislider';
import { SliderRow } from '../../Form';
import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';

export function CutProperty() {
  const dispatch = useDispatch();
  const { cut3DRatio } = useSelector((state) => state);

  const onChange = (value) => {
    dispatch({ type: StoreActionType.SET_SLIDER_Cut, cut3DRatio: value });
  };

  return (
    <SliderRow icon="scissors" title="Cut">
      <Nouislider onChange={onChange} range={{ min: 0.0, max: 1.0 }} value={cut3DRatio} connect={[false, false]} step={0.00001} />
    </SliderRow>
  );
}
