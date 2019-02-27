/**
 * @fileOverview UiTF
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

import { ModeView } from './UiApp';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************
/**
 * Class UiControls some text later...
 */
export default class UiControls extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.m_modeView = ModeView.VIEW_2D;
  }
  //
  //shouldComponentUpdate() {
  //  return false;
  //}
  //
  onChangeSliderOpacity() {
  }
  onChangeSliderIsosurface() {
  }
  onChangeSliderTF() {
  }  
  /**
   * Main component render func callback
   */
  render() {
    const modeViewIndex = this.props.modeView;
    const mode3d = this.props.mode3d;
    const slider3dr = this.props.slider3dr;
    const slider3dg = this.props.slider3dg;
    const slider3db = this.props.slider3db;
    const sliderIsosurface = slider3dr;
    const sliderOpacity = slider3dr;
    const strSliderTF = 'sliderTF';
    const strSliderIsosurface = 'sliderIsosurface';
    const strSliderOpacity = 'sliderOpacity';
    const valToolTps = true;
    const wArr = [slider3dr, slider3dg, slider3db];
    const wArrOpacity = [slider3dr];
    const wArrIsosurface = [slider3dr];

    this.m_modeView = modeViewIndex;
    const styleObj = {
      borderColor: 'red white', 
      borderStyle: 'solid' 
    };
    const jsxVolumeTF =
      <div className="list-group" style={styleObj}>
        <li className="list-group-item">
          <Nouislider onSlide={this.onChangeSliderTF.bind(this)} ref={strSliderTF}
            range={{ min: 0.0, max: 1.0 }}
            start={wArr} connect={[false, true, false, true]} step={0.02} tooltips={valToolTps} />
        </li>
        <li className="list-group-item">
          <p> Opacity </p>
          <Nouislider onSlide={this.onChangeSliderOpacity.bind(this)} ref={strSliderOpacity}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrOpacity} step={0.02} tooltips={valToolTps} />
        </li>
      </div>

    const jsxIsoTF =
      <ui>
        <li className="list-group-item">
          <p> Isosurface </p>
          <Nouislider onSlide={this.onChangeSliderIsosurface.bind(this)} ref={strSliderIsosurface}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrIsosurface} step={0.02} tooltips={valToolTps} />
        </li>
      </ui>

    const jsxArray = [jsxIsoTF, jsxVolumeTF, jsxIsoTF];
    const jsxRet = jsxArray[mode3d];
    return jsxRet;
  }
}
