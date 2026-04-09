/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Slider } from '@mui/material';
import styled from '@emotion/styled';

const ColorizedSlider = styled(Slider)(() => ({
  color: '#3880ff',
  height: 2,
  padding: '15px 0',
  '& .MuiSlider-thumb': {
    height: 30,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    '&:focus, &:hover, &.Mui-active': {
      boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)',
    },
  },
  '& .MuiSlider-valueLabel': {
    fontSize: 12,
    fontWeight: 'normal',
    top: -6,
    backgroundColor: 'unset',
    '&:before': {
      display: 'none',
    },
    '& *': {
      background: 'transparent',
    },
  },
  '& .MuiSlider-track': {
    height: 10,
    border: 'none',
    background: 'var(--red)',
  },
  '& .MuiSlider-rail': {
    height: 10,
    opacity: 0.5,
    backgroundColor: '#bfbfbf',
  },
}));

// eslint-disable-next-line react/display-name
export const Nouislider = (props) => {
  const { range, step, onChange, getAriaValueText, value } = props;
  const onSliderChange = (event, value) => {
    if (!event || !onChange) return;
    onChange(value);
  };

  return (
    <ColorizedSlider
      value={value}
      onChange={onSliderChange}
      step={step}
      min={range.min}
      max={range.max}
      getAriaValueText={getAriaValueText}
      valueLabelDisplay="auto"
    />
  );
};
