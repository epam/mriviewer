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
import Nouislider from 'react-nouislider';

import { Modes2d } from './UiMain';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiCtrl2d some text later...
 */
export default class UiCtrl2d extends React.Component {
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
    // this.setState({mode2d: indexMode});
    const onModeChange = this.props.onMode2d;
    onModeChange(indexMode);
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
    if (typeof(aval) === 'string') {
      val = Number.parseFloat(aval);
      // console.log(`onSlider. val = ${val}`);
      const onSlider = this.props.onSliderSlice;
      onSlider(val);
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
    const valSlider = this.props.sliderValue;
    const mode2d = this.props.mode2d;

    const strSlider1 = 'slider1';

    const wArr = [valSlider];
    const valToolTps = true;

    const strClass = 'btn btn-info';
    const strSag = strClass + ((mode2d === Modes2d.SAGGITAL) ? ' active' : '');
    const strCor = strClass + ((mode2d === Modes2d.CORONAL) ? ' active' : '');
    const strTra = strClass + ((mode2d === Modes2d.TRANSVERSE) ? ' active' : '');

    console.log(`UiControls. render. mode2d = ${mode2d}`);

    // btn-default active

    const jsxRenderControls =
      <div className="card">
        <div className="card-header">
          Plane (slice) view
        </div>

        <div className="card-body mb-4">
          <div className="d-inline-flex">

            <div className="btn-group mx-3 my-4">
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

          <Nouislider onSlide={this.onChangeSliderSlice.bind(this)} ref={strSlider1}
            pips={{ mode: 'range', density: 2 }} range={{ min: 0.0, max: 1.0 }}
            start={wArr} step={0.02} tooltips={valToolTps} />

        </div>

      </div>
    return jsxRenderControls;
  }
}

