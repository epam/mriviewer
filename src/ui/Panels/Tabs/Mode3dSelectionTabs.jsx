/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import StoreActionType from '../../../store/ActionTypes';
import { useDispatch, useSelector } from 'react-redux';
import Modes3d from '../../../store/Modes3d';
import { Box, Tab, Tabs } from '@mui/material';
import { TabPanel } from './TabPanel';
import css from '../../Form/Slider.module.css';
import { HistogramProperty } from '../Properties3d/HistogramProperty';
import { IsosurfaceProperty } from '../Properties3d/IsosurfaceProperty';
import { AmbientOcclusionProperty } from '../Properties3d/AmbientOcclusionProperty';
import { SliderCaption } from '../../Form';
import { RGBProperty } from '../Properties3d/RGBProperty';
import { OpacityProperty } from '../Properties3d/OpacityProperty';
import { RadiusProperty } from '../Properties3d/RadiusProperty';
import { DepthProperty } from '../Properties3d/DepthProperty';
import { FlexRow } from '../../Layout/FlexRow';
import { UIButton } from '../../Button/Button';
import { MuiStyledTooltip } from '../../Tooltip/atoms/MuiStyledTooltip';

export function Mode3dSelectionTabs() {
  const dispatch = useDispatch();
  const { mode3d, volumeRenderer } = useSelector((state) => state);

  const handleChange = (event, value) => {
    dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: value });
    volumeRenderer.offAmbientTextureMode();

    if (value === Modes3d.EREASER) {
      volumeRenderer.setEraserMode(true);
    } else {
      volumeRenderer.setEraserMode(false);
    }
  };

  const onUndo = () => {
    volumeRenderer.undoEraser();
  };

  const onSave = () => {
    volumeRenderer.volumeUpdater.updateVolumeTextureWithMask();
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <p className={css.caption}>3D mode selection</p>
        <Tabs value={mode3d} onChange={handleChange} aria-label="basic tabs example" textColor="inherit" indicatorColor="secondary">
          <MuiStyledTooltip arrow title=" Show just barrier value surface, 1st ray intersection">
            <Tab label="I" value={Modes3d.ISO} />
          </MuiStyledTooltip>
          <MuiStyledTooltip arrow title="Show complete 3d volumetric rendering">
            <Tab label="V" value={Modes3d.RAYCAST} />
          </MuiStyledTooltip>
          <MuiStyledTooltip arrow title="Show maximum projection rendering">
            <Tab label="M" value={Modes3d.RAYFAST} />
          </MuiStyledTooltip>
          <MuiStyledTooltip arrow title="Special volume eraser tool">
            <Tab label="E" value={Modes3d.EREASER} />
          </MuiStyledTooltip>
        </Tabs>
      </Box>
      <TabPanel index={Modes3d.ISO} value={mode3d}>
        <HistogramProperty />
        <IsosurfaceProperty />
        <AmbientOcclusionProperty />
      </TabPanel>
      <TabPanel index={Modes3d.RAYCAST} value={mode3d}>
        <HistogramProperty />
        <SliderCaption caption="Set" />
        <RGBProperty />
        <OpacityProperty />
      </TabPanel>
      <TabPanel index={Modes3d.RAYFAST} value={mode3d} />
      <TabPanel index={Modes3d.EREASER} value={mode3d}>
        Press Control + Mouse Down [+ Mouse Move] for erase
        <RadiusProperty />
        <DepthProperty />
        <IsosurfaceProperty />
        <FlexRow>
          <UIButton caption="Undo" mode="light" onClick={onUndo} />
          <UIButton caption="Save" mode="accent" onClick={onSave} />
        </FlexRow>
      </TabPanel>
    </>
  );
}
