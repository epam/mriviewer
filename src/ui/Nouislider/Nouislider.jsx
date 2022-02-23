/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Slider } from '@mui/material';

// eslint-disable-next-line react/display-name
export const Nouislider = React.forwardRef((props, ref) => {
  const { range, step, start, onChange } = props;
  const onSliderChange = (event, value) => {
    if (!event || !onChange) return;
    onChange(value);
  };
  return (
    <Slider ref={ref} defaultValue={start} onChange={onSliderChange} step={step} min={range.min} max={range.max} valueLabelDisplay="auto" />
  );
});
