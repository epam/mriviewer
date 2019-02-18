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
import Nouislider from 'react-nouislider';

import { Modes3d } from './UiMain';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiCtrl3dLight some text later...
 */
export default class UiCtrl3dLight extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModeA = this.onModeA.bind(this);
    this.onModeB = this.onModeB.bind(this);
    this.onModeC = this.onModeC.bind(this);
    this.onMode = this.onMode.bind(this);
    this.m_updateEnable = true;
  }
  onMode(indexMode) {
    this.m_updateEnable = true;
    console.log(`2d controls. mode = ${indexMode}`);
    // this.setState({mode2d: indexMode});
    const onModeChange = this.props.onMode3d;
    onModeChange(indexMode);

  }
  onModeA() {
    this.onMode(Modes3d.ISO);
  }
  onModeB() {
    this.onMode(Modes3d.RAYCAST);
  }
  onModeC() {
    this.onMode(Modes3d.RAYFAST);
  }
  onChangeSliderSlice() {
    this.m_updateEnable = false;
    const arrStr = this.refs.slider3d.slider.get();
    const numSliders = arrStr.length;
    if ((typeof(arrStr[0]) === 'string') && (numSliders === 3)) {
      const rVal = Number.parseFloat(arrStr[0]);
      const gVal = Number.parseFloat(arrStr[1]);
      const bVal = Number.parseFloat(arrStr[2]);
      // console.log(`onSlider. val = ${val}`);
      const onSlider3dr = this.props.onSlider3dr;
      const onSlider3dg = this.props.onSlider3dg;
      const onSlider3db = this.props.onSlider3db;
      onSlider3dr(rVal);
      onSlider3dg(gVal);
      onSlider3db(bVal);
    }
  }
  shouldComponentUpdate() {
    return this.m_updateEnable;
  }
  /**
   * Main component render func callback
   */
  render() {
    const slider3dr = this.props.slider3dr;
    const slider3dg = this.props.slider3dg;
    const slider3db = this.props.slider3db;
    const mode3d = this.props.mode3d;

    const strSlider3d = 'slider3d';

    const wArr = [slider3dr, slider3dg, slider3db];
    const valToolTps = true;

    const strClass = 'btn btn-info';
    const strA = strClass + ((mode3d === Modes3d.ISO) ? ' active' : '');
    const strB = strClass + ((mode3d === Modes3d.RAYCAST) ? ' active' : '');
    const strC = strClass + ((mode3d === Modes3d.RAYFAST) ? ' active' : '');

    // console.log(`UiControls. render. flags = ${bCheckedSag}+${bCheckedCor}+${bCheckedTra}`);

    // btn-default active

    const jsxRenderControls =
      <div className="card">
        <div className="card-header">
          3d view settings
        </div>

        <div className="card-body mb-4">
          <div className="d-inline-flex">

            <div className="btn-group mx-3 my-4">
              <button type="button" className={strA} onClick={this.onModeA} >
                Mode Isosurface
              </button>
              <button type="button" className={strB} onClick={this.onModeB}  >
                Mode Raycast
              </button>
              <button type="button" className={strC} onClick={this.onModeC} >
                Mode Rayfix
              </button>
            </div>

          </div>

          <Nouislider onSlide={this.onChangeSliderSlice.bind(this)} ref={strSlider3d}
            pips={{ mode: 'range', density: 2 }} range={{ min: 0.0, max: 1.0 }}
            start={wArr} step={0.02} tooltips={valToolTps} />

        </div>

      </div>
    return jsxRenderControls;
  }
}

