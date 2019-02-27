/**
 * @fileOverview UiControls
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

import { ModeView } from './UiApp';
import UiCtrl2d from './UiCtrl2d';
import UiCtrl3dLight from './UiCtrl3dLight';

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
  /**
   * Main component render func callback
   */
  render() {
    const valSlider = this.props.sliderValue;
    const mode2d = this.props.mode2d;
    const onMode2d = this.props.onMode2d;
    const modeViewIndex = this.props.modeView;
    const onSliderSlice = this.props.onSliderSlice;
    const vol = this.props.volume;


    const mode3d = this.props.mode3d;
    const onMode3d = this.props.onMode3d;
    const slider3dr = this.props.slider3dr;
    const slider3dg = this.props.slider3dg;
    const slider3db = this.props.slider3db;
    const onSlider3dr = this.props.onSlider3dr;
    const onSlider3dg = this.props.onSlider3dg;
    const onSlider3db = this.props.onSlider3db;

    this.m_modeView = modeViewIndex;

    const jsxMpr = <div> Not impl.mpr setings !!!</div>;
    const jsx2d = <UiCtrl2d mode2d={mode2d} onMode2d={onMode2d} sliderValue={valSlider} onSliderSlice={onSliderSlice} />;
    const jsx3dLight = <UiCtrl3dLight mode3d={mode3d}  onMode3d={onMode3d} modeView={modeViewIndex}
      slider3dr={slider3dr} slider3dg={slider3dg} slider3db={slider3db}
      onSlider3dr={onSlider3dr} onSlider3dg={onSlider3dg} onSlider3db={onSlider3db} volume={vol}/>;
    const jsx3d = <div>Not impl 3d mode settings !!!</div>;
    const jsxArray = [jsxMpr, jsx2d, jsx3dLight, jsx3d];
    const jsxRet = jsxArray[modeViewIndex];
    return jsxRet;
  }
}

