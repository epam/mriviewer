/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useSelector } from 'react-redux';
import UiCtrl3dLight from './UiCtrl3dLight';
import { BrightnessProperty } from './Properties3d/BrightnessProperty';
import { QualityProperty } from './Properties3d/QualityProperty';
import { CutProperty } from './Properties3d/CutProperty';
import { ContrastProperty } from './Properties3d/ContrastProperty';
import { useNeedShow3d } from '../useNeedShow3d';
import { RoiSelectProperty } from './Properties3d/RoiSelectProperty';
import UiTFroi from '../UiTFroi';

export const ModeFast3dSettingsPanel = () => {
  const { isTool3D, volumeSet, volumeIndex } = useSelector((state) => state);
  const needShow3d = useNeedShow3d(volumeSet, volumeIndex);

  return (
    <>
      {!needShow3d && (
        <>
          <RoiSelectProperty />
          <UiTFroi />
        </>
      )}
      <UiCtrl3dLight />
      <CutProperty />
      {isTool3D ? (
        <>
          <ContrastProperty />
        </>
      ) : (
        <>
          <BrightnessProperty />
          <QualityProperty />
        </>
      )}
    </>
  );
};
