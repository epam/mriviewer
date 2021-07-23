/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiTF
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import Nouislider from 'react-nouislider';
import StoreActionType from '../store/ActionTypes';
import { SliderRow } from "./Form";


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************
/**
 * Class UiTF some text later...
 */
class UiTFroi extends React.Component {
  constructor(props) {
    super(props);
    this.m_updateEnable = true;
  }

  shouldComponentUpdate(nextProps) {
    //return this.m_updateEnable;
    let flag = this.m_updateEnable;
    if (this.props.mode3d !== nextProps.mode3d) {
      flag = true;
    }
    return flag;
  }

  onChangeSliderTF() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderTF.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DR, slider3d_r: Number.parseFloat(aval[0]) });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DG, slider3d_g: Number.parseFloat(aval[1]) });
  }

  onChangeSliderOpacity() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderOpacity.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Opacity, sliderOpacity: Number.parseFloat(aval) });
  }

  onChangeSliderIsosurface() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderIsosurface.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Isosurface, sliderIsosurface: Number.parseFloat(aval) });
  }

  render() {
    const store = this.props;
    const slider3dr = store.slider3d_r;
    const slider3dg = store.slider3d_g;
    const wArr = [slider3dr, slider3dg];
    const sliderOpacity = store.sliderOpacity;
    const wArrOpacity = [sliderOpacity];

    return <>
      <SliderRow>
        <Nouislider onSlide={this.onChangeSliderTF.bind(this)} ref={'sliderTF'}
                    range={{ min: 0.0, max: 1.0 }}
                    start={wArr} connect={[false, true, false]} step={0.00001} tooltips={true}/>
      </SliderRow>
      <SliderRow icon="opacity" title="Opacity">
        <Nouislider onSlide={this.onChangeSliderOpacity.bind(this)} ref={'sliderOpacity'}
                    range={{ min: 0.0, max: 1.0 }}
                    start={wArrOpacity} connect={[false, true]} step={0.00001} tooltips={true}/>
      </SliderRow>
    </>;
  }
}

export default connect(store => store)(UiTFroi);
