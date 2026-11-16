/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useSelector } from 'react-redux';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { getPalette } from '../../../engine/loaders/RoiPaletteItems';

export const RoiSelectProperty = () => {
  const { volumeRenderer } = useSelector((state) => state);
  const [isSelectedAll, setSelectedAll] = React.useState(false);
  const [checked, setChecked] = React.useState([]);

  const palette = getPalette();

  const selectAll = () => {
    const newChecked = isSelectedAll ? [] : palette.map((item) => item.roiId);
    setSelectedAll(!isSelectedAll);

    setChecked(newChecked);
    volumeRenderer.updateSelectedRoiMap(newChecked);
  };

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
    volumeRenderer.updateSelectedRoiMap(newChecked);
  };

  const getColorByRGB = (color) => {
    const [r, g, b] = color.split(' ');
    const rCol = Math.floor(r * 255);
    const gCol = Math.floor(g * 255);
    const bCol = Math.floor(b * 255);
    return '#' + rCol.toString(16) + gCol.toString(16) + bCol.toString(16);
  };

  return (
    <>
      ROI Selector
      <FormGroup row style={{ height: '300px', overflowY: 'auto' }}>
        <FormControlLabel control={<Checkbox onChange={selectAll} />} label={isSelectedAll ? 'Select none' : 'Select all'} />
        {palette.map(({ roiId, name, roiColor }) => {
          return (
            <FormControlLabel
              key={roiId}
              control={<Checkbox checked={checked.indexOf(roiId) !== -1} onChange={handleToggle(roiId)} />}
              label={name}
              color={getColorByRGB(roiColor)}
            />
          );
        })}
      </FormGroup>
    </>
  );
};
