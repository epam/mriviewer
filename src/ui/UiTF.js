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
import UiHistogram from './UiHistogram';
import { SliderCaption, SliderRow, SwitchRow } from "./Form";
import { Switch } from "./Form/Switch";


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************
/**
 * Class UiTF some text later...
 */
class UiTF extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      AO: false,
    }
    //this.onUndo = this.onUndo.bind(this);
    this.m_updateEnable = true;
    this.toggleAO = this.toggleAO.bind(this);
    this.onAO = this.onAO.bind(this);
    this.offAO = this.offAO.bind(this);
    this.onStartEr = this.onStartEr.bind(this);
    this.onStopEr = this.onStopEr.bind(this);
    this.onUndo = this.onUndo.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  toggleAO(newVal) {
    newVal ? this.onAO() : this.offAO();
    this.setState({ AO: newVal });
  }

  onAO() {
    const store = this.props;
    const isoThreshold = store.sliderIsosurface;//this.refs.sliderIsosurface.slider.get();
    store.volumeRenderer.setAmbientTextureMode(isoThreshold);
  }

  offAO() {
    const store = this.props;
    store.volumeRenderer.offAmbientTextureMode();
  }

  onStartEr() {
    const store = this.props;
    store.volumeRenderer.setEraserStart(true);
  }

  onStopEr() {
    const store = this.props;
    store.volumeRenderer.setEraserStart(false);
  }

  onUndo() {
    const store = this.props;
    store.volumeRenderer.undoEraser();
  }

  onSave() {
    const store = this.props;
    store.volumeRenderer.volumeUpdater.updateVolumeTextureWithMask();
    console.log(`onSave`);
  }

  onChangeSliderTF() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderTF.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DR, slider3d_r: Number.parseFloat(aval[0]) });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DG, slider3d_g: Number.parseFloat(aval[1]) });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DB, slider3d_b: Number.parseFloat(aval[2]) });
  }

  shouldComponentUpdate(nextProps) {
    //return this.m_updateEnable;
    let flag = this.m_updateEnable;
    if (this.props.mode3d !== nextProps.mode3d) {
      flag = true;
    }
    return flag;
    //return true;
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

  onChangeSliderErRadius() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderErRadius.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_ErRadius, sliderErRadius: Number.parseFloat(aval) });
  }

  onChangeSliderErDepth() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderErDepth.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_ErDepth, sliderErDepth: Number.parseFloat(aval) });
  }

  transferFuncCallback(transfFuncObj) {
    const i = transfFuncObj.m_indexMoved;
    const x = transfFuncObj.m_handleX[i];
    const y = transfFuncObj.m_handleY[i];
    console.log(`moved point[${i}] = ${x}, ${y}  `);
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const mode3d = store.mode3d;
    const slider3dr = store.slider3d_r;
    const slider3dg = store.slider3d_g;
    const slider3db = store.slider3d_b;
    const sliderOpacity = store.sliderOpacity;
    const sliderIsosurface = store.sliderIsosurface;
    const sliderErRadius = store.sliderErRadius;
    const sliderErDepth = store.sliderErDepth;
    const wArr = [slider3dr, slider3dg, slider3db];
    const wArrOpacity = [sliderOpacity];
    const wArrIsosurface = [sliderIsosurface];
    const wArrErRadius = [sliderErRadius];
    const wArrErDepth = [sliderErDepth];

    let vol = null;
    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() > 0) {
      const volIndex = store.volumeIndex;
      vol = volSet.getVolume(volIndex);
    }

    const NEED_TANSF_FUNC = true;
    const funcTra = (NEED_TANSF_FUNC) ? this.transferFuncCallback : undefined;
    //store.volumeRenderer.updateTransferFuncTexture(this.m_transfFunc.m_handleX, this.m_transfFunc.m_handleY);
    /*
    const styleObj = {
      margin: '30px 0px 0px'
    };
    */
    const jsxVolumeTF =
      <>
        <UiHistogram volume={vol} transfFunc={funcTra}/>
        <SliderCaption caption="Set" />
          <SliderRow >
            <Nouislider onSlide={this.onChangeSliderTF.bind(this)} ref={'sliderTF'}
                        range={{ min: 0.0, max: 1.0 }}
                        start={wArr} connect={[false, true, false, true]} step={0.02} tooltips={true}/>
          </SliderRow>
        <SliderRow icon="opacity" title="Opacity">
          <Nouislider onSlide={this.onChangeSliderOpacity.bind(this)} ref={'sliderOpacity'}
                      range={{ min: 0.0, max: 1.0 }}
                      start={wArrOpacity} connect={[true, false]} step={0.02} tooltips={true}/>
        </SliderRow>
      </>;

    const jsxIsoTF =
      <>
        <UiHistogram volume={vol} transfFunc={funcTra}/>
        <SliderCaption caption="Isosurface" />
        <SliderRow>
          <Nouislider onSlide={this.onChangeSliderIsosurface.bind(this)} ref={'sliderIsosurface'}
                      range={{ min: 0.0, max: 1.0 }}
                      start={wArrIsosurface} connect={[true, false]} step={0.02} tooltips={true}/>
        </SliderRow>
        <SwitchRow>
          Ambient Occlusion
          <Switch value={ this.state.AO } onValueChange={ this.toggleAO }/>
        </SwitchRow>
      </>
    const jsxEreaser =
      <>
        Press Control + Mouse Down [+ Mouse Move] for erease
        <SliderCaption caption="Radius" />
        <SliderRow>
          <Nouislider onSlide={this.onChangeSliderErRadius.bind(this)} ref={'sliderErRadius'}
                      range={{ min: 1.0, max: 100.0 }}
                      start={wArrErRadius} connect={[true, false]} step={0.02} tooltips={true}/>
        </SliderRow>
        <SliderCaption caption="Depth" />
        <SliderRow>
          <Nouislider onSlide={this.onChangeSliderErDepth.bind(this)} ref={'sliderErDepth'}
                      range={{ min: 1.0, max: 100.0 }}
                      start={wArrErDepth} connect={[true, false]} step={0.02} tooltips={true}/>
        </SliderRow>
        <SliderCaption caption="Isosurface" />
        <SliderRow>
          <Nouislider onSlide={this.onChangeSliderIsosurface.bind(this)} ref={'sliderIsosurface'}
                      range={{ min: 0.0, max: 1.0 }}
                      start={wArrIsosurface} connect={[true, false]} step={0.02} tooltips={true}/>
        </SliderRow>

        <button type="button" className={'btn btn-outline-dark'} onClick={this.onUndo}>
          Undo
        </button>
        <button type="button" className={'btn btn-outline-dark'} onClick={this.onSave}>
          Save
        </button>
      </>

    const jsxRayfastTF = null

    console.log(`UiTF . mode = ${mode3d}`);
    const jsxArray = [jsxIsoTF, jsxVolumeTF, jsxRayfastTF, jsxEreaser];
    const jsxRet = jsxArray[mode3d];
    return jsxRet;
  }
}

export default connect(store => store)(UiTF);
