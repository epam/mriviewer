/**
 * @fileOverview UiCtrl3dLight
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
import StoreActionType from '../store/ActionTypes';
import UiHistogram from './UiHistogram';
import { SVG } from "./Button/SVG";

/**
 * Class UiCtrl3dLight some text later...
 */
class UiCtrl3d extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.aval = 0;
    this.transferFuncCallback = this.transferFuncCallback.bind(this);
    this.m_updateEnable = true;
  }

  onChangeSliderOpacity(e) {
    this.m_updateEnable = false;
    this.aval = e.target.value;
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_Opacity, sliderOpacity: Number.parseFloat(this.aval) });
  }

  shouldComponentUpdate() {
    return this.m_updateEnable;
    //return true;
  }

  transferFuncCallback(transfFuncObj) {
    const i = transfFuncObj.m_indexMoved;
    const x = transfFuncObj.m_handleX[i];
    const y = transfFuncObj.m_handleY[i];
    console.log(`moved point[${i}] = ${x}, ${y}  `);
    const vr = this.props.volumeRenderer;
    vr.updateTransferFuncTexture(transfFuncObj.m_handleX, transfFuncObj.m_handleY);
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const sliderOpacity = store.sliderOpacity;
    this.aval = sliderOpacity;
    // const wArrOpacity = [sliderOpacity];

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    const NEED_TANSF_FUNC = true;
    const funcTra = (NEED_TANSF_FUNC) ? this.transferFuncCallback : undefined;
    const funcTrTex = (store.volumeRenderer === null) ? null : store.volumeRenderer;
    //const store = this.props;
    //const mode3d = store.mode3d;


    // console.log(`UiCtr3dLight. render. flags = ${bCheckedSag}+${bCheckedCor}+${bCheckedTra}`);

    // btn-default active

    return <>
      <UiHistogram volume={vol} transfFunc={funcTra} transfFuncUpdate={funcTrTex}/>
      <p> Opacity </p>
      <SVG name="opacity"/>
      <input type="range" onChange={this.onChangeSliderOpacity.bind(this)}
             value={this.aval} max={1} step={0.02}/>
      <p>Value: {this.aval}</p>
    </>
  }
}

export default connect(store => store)(UiCtrl3d);
