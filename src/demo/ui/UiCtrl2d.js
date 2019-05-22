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

import Nouislider from 'react-nouislider';

import Modes2d from '../store/Modes2d';
import StoreActionType from '../store/ActionTypes';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiCtrl2d some text later...
 */
class UiCtrl2d extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModeSaggital = this.onModeSaggital.bind(this);
    this.onModeCoronal = this.onModeCoronal.bind(this);
    this.onModeTransverse = this.onModeTransverse.bind(this);
    this.onMode = this.onMode.bind(this);
    this.m_updateEnable = true;
  }
  onMode(indexMode) {
    this.m_updateEnable = true;
    console.log(`2d controls. on new mode = ${indexMode}`);
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_MODE_2D, mode2d: indexMode });
    // clear all tools
    const gra2d = store.graphics2d;
    gra2d.clear();
    // init zoom
    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });
    store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
    store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });
    // re-render
    gra2d.forceUpdate();
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
  onChangeSliderSlice() {
    this.m_updateEnable = false;
    let val = 0.0;
    const aval = this.refs.slider1.slider.get();
    if (typeof (aval) === 'string') {
      val = Number.parseFloat(aval);
      // console.log(`onSlider. val = ${val}`);
      const store = this.props;
      store.dispatch({ type: StoreActionType.SET_SLIDER_2D, slider2d: val });
      // clear all 2d tools
      const gra2d = store.graphics2d;
      gra2d.clear();
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

    const strSlider1 = 'slider1';

    const wArr = [valSlider];
    const valToolTps = true;

    const strClass = 'btn btn-secondary';
    const strSag = strClass + ((mode2d === Modes2d.SAGGITAL) ? ' active' : '');
    const strCor = strClass + ((mode2d === Modes2d.CORONAL) ? ' active' : '');
    const strTra = strClass + ((mode2d === Modes2d.TRANSVERSE) ? ' active' : '');

    // console.log(`UiCtrl2d. render. mode2d = ${mode2d}`);

    // btn-default active

    const jsxRenderControls =
      <div className="card">
        <div className="card-header">
          Plane (slice) view
        </div>
        <div className="card-body">
          <div className="btn-group btn-block">
            <button type="button" className={strSag} onClick={this.onModeSaggital} >
              Saggital
            </button>
            <button type="button" className={strCor} onClick={this.onModeCoronal}  >
              Coronal
            </button>
            <button type="button" className={strTra} onClick={this.onModeTransverse} >
              Transverse
            </button>
          </div>
        </div>
        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            <p> Select </p>
            <Nouislider onSlide={this.onChangeSliderSlice.bind(this)} ref={strSlider1}
              range={{ min: 0.0, max: 1.0 }}
              start={wArr} step={0.02} tooltips={valToolTps} />
          </li>
        </ul>
      </div>
    return jsxRenderControls;
  }
}

export default connect(store => store)(UiCtrl2d);
