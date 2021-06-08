/**
 * @fileOverview UiCtrl2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

// special css for NoUiSlioder
import 'nouislider/distribute/nouislider.css';

import React from 'react';
import { connect } from 'react-redux';
import { ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';

import Modes2d from '../store/Modes2d';
import StoreActionType from '../store/ActionTypes';
import { UIButton } from "./Button/Button";

class UiCtrl2d extends React.Component {
  constructor(props) {
    super(props);
    this.onModeSaggital = this.onModeSaggital.bind(this);
    this.onModeCoronal = this.onModeCoronal.bind(this);
    this.onModeTransverse = this.onModeTransverse.bind(this);
    this.onMode = this.onMode.bind(this);
    this.m_updateEnable = true;
  }

  onMode(indexMode) {
    const store = this.props;
    const gra2d = store.graphics2d;

    this.m_updateEnable = true;
    store.dispatch({ type: StoreActionType.SET_MODE_2D, mode2d: indexMode });
    gra2d.m_mode2d = indexMode;
    gra2d.clear();

    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
    store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
    store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });

    // build render image
    gra2d.forceUpdate();
    // render just builded image
    gra2d.forceRender();
  }

  onModeSaggital() {
    this.onMode(Modes2d.SAGGITAL);
  }

  onModeCoronal() {
    this.onMode(Modes2d.CORONAL);
  }

  onModeTransverse() {
    this.onMode(Modes2d.TRANSVERSE);
  }

  onChangeSliderSlice(e) {
    if (this.refs === undefined) {
      return;
    }
    this.m_updateEnable = false;
    let val = 0.0;
    const aval = e.target.value;
    if (typeof (aval) === 'string') {
      val = Number.parseFloat(aval);
      // console.log(`onSlider. val = ${val}`);
      // convert slider value from [0.. ?dim] to [0..1]
      const store = this.props;
      const mode2d = store.mode2d;
      const volSet = store.volumeSet;
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);
      let xDim = 0, yDim = 0, zDim = 0;
      if (vol !== null) {
        xDim = vol.m_xDim;
        yDim = vol.m_yDim;
        zDim = vol.m_zDim;
      }
  
      let slideRangeMax = 0;
      if (mode2d === Modes2d.SAGGITAL) {
        slideRangeMax = xDim;
      } else if (mode2d === Modes2d.CORONAL) {
        slideRangeMax = yDim;
      } else if (mode2d === Modes2d.TRANSVERSE) {
        slideRangeMax = zDim;
      }
      const valNormalizedTo01 = val / slideRangeMax; 
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

  shouldComponentUpdate() {
    // return false;
    // return true;
    return this.m_updateEnable;
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const valSlider = store.slider2d;
    const mode2d = store.mode2d;

    const varSag = mode2d === Modes2d.SAGGITAL
    const varCor = mode2d === Modes2d.CORONAL
    const varTra = mode2d === Modes2d.TRANSVERSE

    let xDim = 0, yDim = 0, zDim = 0;
    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() > 0) {
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);
      if (vol !== null) {
        xDim = vol.m_xDim;
        yDim = vol.m_yDim;
        zDim = vol.m_zDim;
      }
    } // if more 0 volumes
    // slider maximum value is depend on current x or y or z 2d mode selection
    let slideRangeMax = 0;
    if (mode2d === Modes2d.SAGGITAL) {
      slideRangeMax = xDim - 1;
    } else if (mode2d === Modes2d.CORONAL) {
      slideRangeMax = yDim - 1;
    } else if (mode2d === Modes2d.TRANSVERSE) {
      slideRangeMax = zDim - 1;
    }

    const wArr = [Math.floor(valSlider * slideRangeMax)];
    // // special formatter interface for show only intefer numbers
    // // in slider:
    // // provide two conversion functions:
    // // to (int -> string)
    // // from (string -> int)
    // const formatterInt = {
    //   to(valNum) {
    //     const i = Math.floor(valNum);
    //     return i.toString();
    //   },
    //   from(valStr) {
    //     return parseInt(valStr);
    //   }
    // };

    const jsxSlider = (slideRangeMax > 0) ?
        <>
          <input type="range"
                        onChange={this.onChangeSliderSlice.bind(this)}
                 min={0}
                 max={slideRangeMax}
                 value={wArr[0]}
            step={1} />
        </>
       : null;

    const jsxSliceSelector = (slideRangeMax > 0) ?
      <>
        <ButtonGroup className="mr-2" aria-label="Ctrl2d group">
          <OverlayTrigger key="zx" placement="bottom" overlay={
            <Tooltip>
              Show slices along x axis
            </Tooltip>
          }>
            <UIButton handler={this.onModeSaggital} active={varSag} icon="saggital" />
          </OverlayTrigger>

          <OverlayTrigger key="zy" placement="bottom" overlay={
            <Tooltip>
              Show slices along y axis
            </Tooltip>
          }>
            <UIButton handler={this.onModeCoronal} active={varCor} icon="coronal" />
          </OverlayTrigger>

          <OverlayTrigger key="za" placement="bottom" overlay={
            <Tooltip>
              Show slices along z axis
            </Tooltip>
          }>
            <UIButton handler={this.onModeTransverse} active={varTra} icon="transverse" />
          </OverlayTrigger>
        </ButtonGroup>
      </> : null

    return <>
      {jsxSliceSelector}
      {jsxSlider}
    </>;
  }
}

export default connect(store => store)(UiCtrl2d);
