/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import UiCtrl3dLight from './UiCtrl3dLight';
import UiCtrl3d from './UiCtrl3d';

import Nouislider from 'react-nouislider';
import StoreActionType from '../store/ActionTypes';
import ViewMode from '../store/ViewMode';
import { SliderRow } from './Form';

class UiMain3dLight extends React.Component {
  /**
   * Main component render func callback
   */
  constructor(props) {
    super(props);
    this.m_updateEnable = true;
    this.cut3DRatio = React.createRef();
    this.brightness3DValue = React.createRef();
    this.quality3DStepSize = React.createRef();
    this.sliderContrast3D = React.createRef();
  }

  onChangeSliderBrightness() {
    this.m_updateEnable = false;
    const aval = this.brightness3DValue.current.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Brightness, brightness3DValue: Number.parseFloat(aval) });
  }

  onChangeSliderCut() {
    this.m_updateEnable = false;
    const aval = this.cut3DRatio.current.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Cut, cut3DRatio: Number.parseFloat(aval) });
  }

  onChangeSliderQuality() {
    this.m_updateEnable = false;
    const aval = this.quality3DStepSize.current.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Quality, quality3DStepSize: Number.parseFloat(aval) });
  }

  onChangeSliderContrast3D() {
    this.m_updateEnable = false;
    const aval = this.sliderContrast3D.current.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Contrast3D, sliderContrast3D: Number.parseFloat(aval) });
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
    const cut3DRatio = store.cut3DRatio;
    const quality3DStepSize = store.quality3DStepSize;

    const wArrBrightness = [brightness3DValue];
    const wArrCut = [cut3DRatio];
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
            onSlide={this.onChangeSliderBrightness.bind(this)}
            ref={this.brightness3DValue}
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
            onSlide={this.onChangeSliderQuality.bind(this)}
            ref={this.quality3DStepSize}
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
            onSlide={this.onChangeSliderContrast3D.bind(this)}
            ref={this.sliderContrast3D}
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
        <SliderRow icon="scissors" title="Cut">
          <Nouislider
            onSlide={this.onChangeSliderCut.bind(this)}
            ref={this.cut3DRatio}
            range={{ min: 0.0, max: 1.0 }}
            overflow-scroll={'true'}
            start={wArrCut}
            connect={[false, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        {store.isTool3D === false ? jsxView : jsxTool}
      </>
    );
  }
}

export default connect((store) => store)(UiMain3dLight);
