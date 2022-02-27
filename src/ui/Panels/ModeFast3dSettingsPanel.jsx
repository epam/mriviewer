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

export const ModeFast3dSettingsPanel = () => {
  const { isTool3D } = useSelector((state) => state);

  return (
    <>
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
