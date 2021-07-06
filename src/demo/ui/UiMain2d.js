/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import UiSegm2d from './UiSegm2d';
import UiVolumeSel from './UiVolumeSel'
import Nouislider from "react-nouislider";
import Modes2d from "../store/Modes2d";
import StoreActionType from "../store/ActionTypes";
import { SliderCaption, SliderRow } from "./Form";


class UiMain2d extends React.Component {
  constructor(props) {
    super(props);
    const store = this.props;
    const volSet = store.volumeSet;
    const vols = volSet.m_volumes;
    let xDim = 0, yDim = 0, zDim = 0;
    if (vols.length > 0) {
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);
      if (vol !== null) {
        xDim = vol.m_xDim;
        yDim = vol.m_yDim;
        zDim = vol.m_zDim;
      }
    } // if more 0 volumes


    // slider maximum value is depend on current x or y or z 2d mode selection
    this.slideRangeMax = 0;
    if (store.mode2d === Modes2d.SAGGITAL) {
      this.slideRangeMax = xDim - 1;
    } else if (store.mode2d === Modes2d.CORONAL) {
      this.slideRangeMax = yDim - 1;
    } else if (store.mode2d === Modes2d.TRANSVERSE) {
      this.slideRangeMax = zDim - 1;
    }

    this.slider = React.createRef();
    this.m_updateEnable = true;
    this.onChangeSliderSlice = this.onChangeSliderSlice.bind(this);
  }

  transferFuncCallback(transfFuncObj) {
    const i = transfFuncObj.m_indexMoved;
    const x = transfFuncObj.m_handleX[i];
    const y = transfFuncObj.m_handleY[i];
    console.log(`moved point[${i}] = ${x}, ${y}  `);
  }

  shouldComponentUpdate() {
    return this.m_updateEnable;
  }


  onChangeSliderSlice() {
    if (!this.slider.current) return;
    this.m_updateEnable = false;
    let val = 0.0;
    const aval = this.slider.current.slider.get()
    if (typeof (aval) === 'string') {
      val = +aval;
      // console.log(`onSlider. val = ${val}`);
      // convert slider value from [0.. ?dim] to [0..1]
      const valNormalizedTo01 = val / this.slideRangeMax;
      const store = this.props;
      store.dispatch({ type: StoreActionType.SET_SLIDER_2D, slider2d: valNormalizedTo01 });
      // clear all 2d tools
      const gra2d = store.graphics2d;
      gra2d.clear();

      // re-render (and rebuild segm if present)
      gra2d.forceUpdate();

      // render just builded image
      gra2d.forceRender();
    }
  }

  /*
   *
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const valSlider = store.slider2d;

    const wArr = [Math.floor(valSlider * this.slideRangeMax)];
    // special formatter interface for show only intefer numbers
    // in slider:
    // provide two conversion functions:
    // to (int -> string)
    // from (string -> int)

    const formatterInt = {
      to(valNum) {
        const i = Math.floor(valNum);
        return i.toString();
      },
      from(valStr) {
        return parseInt(valStr);
      }
    };

    return <>
      <SliderCaption caption="Slider" />
      <SliderRow icon="transverse">
        <Nouislider onUpdate={this.onChangeSliderSlice}
                    ref={this.slider}
                    range={{ min: 0, max: this.slideRangeMax }}
                    start={wArr} step={1}
                    format={formatterInt}
                    tooltips={true} />
      </SliderRow>
      <UiSegm2d />
      {(store.volumeSet.m_volumes.length > 1) ? <UiVolumeSel /> : <br />}
    </>;
  };
}

export default connect(store => store)(UiMain2d);
