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
import { connect } from 'react-redux';

import Nouislider from 'react-nouislider';
import StoreActionType from '../store/ActionTypes';


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************
/**
 * Class UiTF some text later...
 */
class UiTFroi extends React.Component {
  constructor(props) {
    super(props);
    this.m_updateEnable = true;
  }
  shouldComponentUpdate(nextProps) {
    //return this.m_updateEnable;
    let flag = this.m_updateEnable;
    if (this.props.mode3d !== nextProps.mode3d) {
      flag = true;
    }
    return flag;
  }
  onChangeSliderTF() {
    this.m_updateEnable = false;
    const aval = this.refs.sliderTF.slider.get();
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DR, slider3d_r: Number.parseFloat(aval[0]) });
    store.dispatch({ type: StoreActionType.SET_SLIDER_3DG, slider3d_g: Number.parseFloat(aval[1]) });
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
  /**
   * Main component render func callback
    const jsxRet = jsxArray[mode3d];
   */
  render() {
    const store = this.props;
    let mode3d = store.mode3d;
    if (mode3d > 1) {
      mode3d = 1;
    }
    const slider3dr = store.slider3d_r;
    const slider3dg = store.slider3d_g;
    const wArr = [slider3dr, slider3dg];
    const sliderOpacity = store.sliderOpacity;
    const sliderIsosurface = store.sliderIsosurface;
    const wArrOpacity = [sliderOpacity];
    const wArrIsosurface = [sliderIsosurface];

    const jsxVolumeTF =
      <ul className="list-group" >
        <li className="list-group-item">
          <Nouislider onSlide={this.onChangeSliderTF.bind(this)} ref={'sliderTF'}
            range={{ min: 0.0, max: 1.0 }}
            start={wArr} connect={[false, true, false]} step={0.02} tooltips={true} />
        </li>
        <li className="list-group-item">
          <p> Opacity </p>
          <Nouislider onSlide={this.onChangeSliderOpacity.bind(this)} ref={'sliderOpacity'}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrOpacity} connect={[false, true]} step={0.02} tooltips={true} />
        </li>
      </ul>
    const jsxIsoTF =
      <ul className="list-group">
        <li className="list-group-item">
          <p> Isosurface </p>
          <Nouislider onSlide={this.onChangeSliderIsosurface.bind(this)} ref={'sliderIsosurface'}
            range={{ min: 0.0, max: 1.0 }}
            start={wArrIsosurface} connect={[false, true]} step={0.02} tooltips={true} />
        </li>
      </ul>
    const jsxArray = [jsxIsoTF, jsxVolumeTF];
    const jsxRet = jsxArray[1];
    return jsxRet;
  }
}

export default connect(store => store)(UiTFroi);
