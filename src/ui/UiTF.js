/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { connect } from 'react-redux';

import { Nouislider } from './Nouislider/Nouislider';
import StoreActionType from '../store/ActionTypes';
import UiHistogram from './UiHistogram';
import { SliderCaption, SliderRow, SwitchRow } from './Form';
import { Switch } from './Form/Switch';
import { UIButton } from './Button/Button';
import { FlexRow } from './Layout/FlexRow';

class UiTF extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      AO: false,
    };
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
    const isoThreshold = store.isoThresholdValue;
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

  onChangeSliderTF(value) {
    this.m_updateEnable = false;
    const [r, g, b] = value;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DR, slider3d_r: r });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DG, slider3d_g: g });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DB, slider3d_b: b });
  }

  shouldComponentUpdate(nextProps) {
    let flag = this.m_updateEnable;
    if (this.props.mode3d !== nextProps.mode3d) {
      flag = true;
    }
    return flag;
  }

  onChangeSliderOpacity(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Opacity, opacityValue3D: value });
  }

  onChangeSliderIsosurface(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Isosurface, isoThresholdValue: value });
  }

  onChangeSliderErRadius(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_ErRadius, sliderErRadius: value });
  }

  onChangeSliderErDepth(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_ErDepth, sliderErDepth: value });
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
    const opacityValue3D = store.opacityValue3D;
    const isoThresholdValue = store.isoThresholdValue;
    const sliderErRadius = store.sliderErRadius;
    const sliderErDepth = store.sliderErDepth;
    const wArr = [slider3dr, slider3dg, slider3db];
    const wArrOpacity = [opacityValue3D];
    const wArrIsosurface = [isoThresholdValue];
    const wArrErRadius = [sliderErRadius];
    const wArrErDepth = [sliderErDepth];

    let vol = null;
    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() > 0) {
      const volIndex = store.volumeIndex;
      vol = volSet.getVolume(volIndex);
    }

    const NEED_TANSF_FUNC = true;
    const funcTra = NEED_TANSF_FUNC ? this.transferFuncCallback : undefined;
    //store.volumeRenderer.updateTransferFuncTexture(this.m_transfFunc.m_handleX, this.m_transfFunc.m_handleY);
    /*
    const styleObj = {
      margin: '30px 0px 0px'
    };
    */
    const jsxVolumeTF = (
      <>
        <UiHistogram volume={vol} transfFunc={funcTra} />
        <SliderCaption caption="Set" />
        <SliderRow>
          <Nouislider
            onChange={this.onChangeSliderTF.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            start={wArr}
            connect={[false, true, false, true]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <SliderRow icon="opacity" title="Opacity">
          <Nouislider
            onChange={this.onChangeSliderOpacity.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrOpacity}
            connect={[true, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
      </>
    );

    const jsxIsoTF = (
      <>
        <UiHistogram volume={vol} transfFunc={funcTra} />
        <SliderCaption caption="Isosurface" />
        <SliderRow>
          <Nouislider
            onChange={this.onChangeSliderIsosurface.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrIsosurface}
            connect={[true, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <SwitchRow>
          Ambient Occlusion
          <Switch value={this.state.AO} onValueChange={this.toggleAO} />
        </SwitchRow>
      </>
    );
    const jsxEreaser = (
      <>
        Press Control + Mouse Down [+ Mouse Move] for erease
        <SliderCaption caption="Radius" />
        <SliderRow>
          <Nouislider
            onChange={this.onChangeSliderErRadius.bind(this)}
            range={{ min: 1.0, max: 100.0 }}
            start={wArrErRadius}
            connect={[true, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <SliderCaption caption="Depth" />
        <SliderRow>
          <Nouislider
            onChange={this.onChangeSliderErDepth.bind(this)}
            range={{ min: 1.0, max: 100.0 }}
            start={wArrErDepth}
            connect={[true, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <SliderCaption caption="Isosurface" />
        <SliderRow>
          <Nouislider
            onChange={this.onChangeSliderIsosurface.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrIsosurface}
            connect={[true, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <FlexRow>
          <UIButton caption="Undo" mode="light" onClick={this.onUndo} />
          <UIButton caption="Save" mode="accent" onClick={this.onSave} />
        </FlexRow>
      </>
    );

    const jsxRayfastTF = null;

    console.log(`UiTF . mode = ${mode3d}`);
    const jsxArray = [jsxIsoTF, jsxVolumeTF, jsxRayfastTF, jsxEreaser];
    const jsxRet = jsxArray[mode3d];
    return jsxRet;
  }
}

export default connect((store) => store)(UiTF);
