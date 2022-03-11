/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ModeFast3dSettingsPanel } from './ModeFast3dSettingsPanel';
import { renderWithState } from '../../utils/configureTest';
import UiCtrl3dLight from './UiCtrl3dLight';
import { CutProperty } from './Properties3d/CutProperty';
import { BrightnessProperty } from './Properties3d/BrightnessProperty';
import { QualityProperty } from './Properties3d/QualityProperty';
import { ContrastProperty } from './Properties3d/ContrastProperty';

jest.mock('./UiCtrl3dLight', () => jest.fn(() => null));
jest.mock('./Properties3d/CutProperty', () => ({ CutProperty: jest.fn(() => null) }));
jest.mock('./Properties3d/BrightnessProperty', () => ({ BrightnessProperty: jest.fn(() => null) }));
jest.mock('./Properties3d/QualityProperty', () => ({ QualityProperty: jest.fn(() => null) }));
jest.mock('./Properties3d/ContrastProperty', () => ({ ContrastProperty: jest.fn(() => null) }));

describe('Test ModeFast3dSettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', () => {
    renderWithState(<ModeFast3dSettingsPanel />);

    expect(UiCtrl3dLight).toBeCalledTimes(1);
    expect(CutProperty).toBeCalledTimes(1);

    expect(ContrastProperty).toBeCalledTimes(0);

    expect(BrightnessProperty).toBeCalledTimes(1);
    expect(QualityProperty).toBeCalledTimes(1);
  });

  it('should render when isTool3d true', () => {
    renderWithState(<ModeFast3dSettingsPanel />, { isTool3D: true });

    expect(ContrastProperty).toBeCalledTimes(1);

    expect(BrightnessProperty).toBeCalledTimes(0);
    expect(QualityProperty).toBeCalledTimes(0);
  });
});
