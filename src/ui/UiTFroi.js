/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { connect } from 'react-redux';

import { Nouislider } from './Nouislider/Nouislider';
import StoreActionType from '../store/ActionTypes';
import { SliderRow } from './Form';

class UiTFroi extends React.Component {
  constructor(props) {
    super(props);
    this.m_updateEnable = true;
  }

  shouldComponentUpdate(nextProps) {
    let flag = this.m_updateEnable;
    if (this.props.mode3d !== nextProps.mode3d) {
      flag = true;
    }
    return flag;
  }

  onChangeSliderTF(value) {
    this.m_updateEnable = false;
    const [min, max] = value;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DR, slider3d_r: min });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DG, slider3d_g: max });
  }

  onChangeSliderOpacity(value) {
    this.m_updateEnable = false;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Opacity, opacityValue3D: value });
  }

  render() {
    const store = this.props;
    const slider3dr = store.slider3d_r;
    const slider3dg = store.slider3d_g;
    const wArr = [slider3dr, slider3dg];
    const opacityValue3D = store.opacityValue3D;
    const wArrOpacity = [opacityValue3D];

    return (
      <>
        <SliderRow>
          <Nouislider
            onChange={this.onChangeSliderTF.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            start={wArr}
            connect={[false, true, false]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
        <SliderRow icon="opacity" title="Opacity">
          <Nouislider
            onChange={this.onChangeSliderOpacity.bind(this)}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrOpacity}
            connect={[false, true]}
            step={0.00001}
            tooltips={true}
          />
        </SliderRow>
      </>
    );
  }
}

export default connect((store) => store)(UiTFroi);
