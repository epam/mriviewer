/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ModeFast3dSettingsPanel } from './ModeFast3dSettingsPanel';
import { renderWithState } from '../../utils/configureTest';
import { CutProperty } from './Properties3d/CutProperty';
import { BrightnessProperty } from './Properties3d/BrightnessProperty';
import { QualityProperty } from './Properties3d/QualityProperty';
import { ContrastProperty } from './Properties3d/ContrastProperty';
import { useNeedShow3d } from '../../utils/useNeedShow3d';
import { Mode3dSelectionTabs } from './Tabs/Mode3dSelectionTabs';
import { RoiSelectProperty } from './Properties3d/RoiSelectProperty';
import { RGBProperty } from './Properties3d/RGBProperty';
import { OpacityProperty } from './Properties3d/OpacityProperty';

vi.mock('./Tabs/Mode3dSelectionTabs', () => ({ Mode3dSelectionTabs: vi.fn(() => <div>Mode3dSelectionTabs</div>) }));
vi.mock('./Properties3d/RoiSelectProperty', () => ({ RoiSelectProperty: vi.fn(() => <div>RoiSelectProperty</div>) }));
vi.mock('./Properties3d/RGBProperty', () => ({ RGBProperty: vi.fn(() => <div>RGBProperty</div>) }));
vi.mock('./Properties3d/OpacityProperty', () => ({ OpacityProperty: vi.fn(() => <div>OpacityProperty</div>) }));
vi.mock('./Properties3d/CutProperty', () => ({ CutProperty: vi.fn(() => null) }));
vi.mock('./Properties3d/BrightnessProperty', () => ({ BrightnessProperty: vi.fn(() => null) }));
vi.mock('./Properties3d/QualityProperty', () => ({ QualityProperty: vi.fn(() => null) }));
vi.mock('./Properties3d/ContrastProperty', () => ({ ContrastProperty: vi.fn(() => null) }));

vi.mock('../../utils/useNeedShow3d');
const mockedUseNeedShow3d = useNeedShow3d;

describe('Test ModeFast3dSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    renderWithState(<ModeFast3dSettingsPanel />);

    expect(Mode3dSelectionTabs).toBeCalledTimes(1);
    expect(CutProperty).toBeCalledTimes(1);
    expect(BrightnessProperty).toBeCalledTimes(1);
    expect(QualityProperty).toBeCalledTimes(1);

    expect(ContrastProperty).toBeCalledTimes(0);
    expect(RoiSelectProperty).toBeCalledTimes(0);
    expect(RGBProperty).toBeCalledTimes(0);
    expect(OpacityProperty).toBeCalledTimes(0);
  });

  it('should render when needShow3d is false', () => {
    mockedUseNeedShow3d.mockReturnValue(false);
    renderWithState(<ModeFast3dSettingsPanel />);

    expect(Mode3dSelectionTabs).toBeCalledTimes(0);

    expect(RoiSelectProperty).toBeCalledTimes(1);
    expect(RGBProperty).toBeCalledTimes(1);
    expect(OpacityProperty).toBeCalledTimes(1);
  });

  it('should render when isTool3d true', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    renderWithState(<ModeFast3dSettingsPanel />, { isTool3D: true });

    expect(ContrastProperty).toBeCalledTimes(1);

    expect(BrightnessProperty).toBeCalledTimes(0);
    expect(QualityProperty).toBeCalledTimes(0);
  });
});
