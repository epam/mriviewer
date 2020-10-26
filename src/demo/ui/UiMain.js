/**
 * @fileOverview UiMain
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import UiMainMpr from './UiMainMpr';
import UiMain2d from './UiMain2d';
import UiMain3dLight from './UiMain3dLight';

import ModeView from '../store/ModeView';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMain some text later...
 */
class UiMain extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const modeViewIndex = store.modeView;
    const jsxMainMpr = <UiMainMpr></UiMainMpr>;
    const jsxMain2d = <UiMain2d></UiMain2d>;
    const jsxMain3dLight = <UiMain3dLight></UiMain3dLight>;

    const jsxArray = new Array(ModeView.VIEW_COUNT);
    jsxArray[ModeView.VIEW_MPR] = jsxMainMpr;
    jsxArray[ModeView.VIEW_2D] = jsxMain2d;
    jsxArray[ModeView.VIEW_3D_LIGHT] = jsxMain3dLight ;
    jsxArray[ModeView.VIEW_3D] = jsxMain3dLight;
    const jsxRet = jsxArray[modeViewIndex];
    return jsxRet;
  };
}

export default connect(store => store)(UiMain);
