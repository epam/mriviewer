/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import UiCtrl3dLight from './UiCtrl3dLight';
import UiCtrl3d from './UiCtrl3d';

import { Nouislider } from './Nouislider/Nouislider';
import StoreActionType from '../store/ActionTypes';
import ViewMode from '../store/ViewMode';
import { SliderRow } from './Form';
import { CutProperty } from './Panels/Properties3d/CutProperty';

class UiMain3dLight extends React.Component {
  constructor(props) {
    super(props);
    this.m_updateEnable = true;
  }

  onChangeSliderBrightness(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Brightness, brightness3DValue: value });
  }

  onChangeSliderQuality(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Quality, quality3DStepSize: value });
  }

  onChangeSliderContrast3D(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Contrast3D, sliderContrast3D: value });
  }

  shouldComponentUpdate(nextProps) {
    let flag = this.m_updateEnable;
    if (this.props.isTool3D !== nextProps.isTool3D || this.props.viewMode !== nextProps.viewMode) {
      flag = true;
    }
    return flag;
  }

  render() {
    const store = this.props;
    const viewModeIndex = store.viewMode;

    const brightness3DValue = store.brightness3DValue;
    const quality3DStepSize = store.quality3DStepSize;

    const wArrBrightness = [brightness3DValue];
    const wArrQuality = [quality3DStepSize];
    const jsx3dLight = <UiCtrl3dLight />;
    const jsx3d = <UiCtrl3d />;

    const jsxArray = new Array(ViewMode.VIEW_COUNT);
    jsxArray[ViewMode.VIEW_3D_LIGHT] = jsx3dLight;
    jsxArray[ViewMode.VIEW_3D] = jsx3d;
    const jsxRet = jsxArray[viewModeIndex];
    const jsxView = (
      <>
        <SliderRow icon={'brightness'} title={'Brightness'}>
          <Nouislider
            onChange={this.onChangeSliderBrightness.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            overflow-scroll={'true'}
            start={wArrBrightness}
            connect={[false, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <SliderRow icon="triangle" title="Quality">
          <Nouislider
            onChange={this.onChangeSliderQuality.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            overflow-scroll={'true'}
            start={wArrQuality}
            connect={[false, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
      </>
    );

    const jsxTool = (
      <>
        <SliderRow title="Cut plane opacity">
          <Nouislider
            onChange={this.onChangeSliderContrast3D.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            overflow-scroll={'true'}
            start={wArrBrightness}
            connect={[false, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
      </>
    );

    return (
      <>
        {jsxRet}
        <CutProperty />
        {store.isTool3D === false ? jsxView : jsxTool}
      </>
    );
  }
}

export default connect((store) => store)(UiMain3dLight);
