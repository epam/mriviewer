/**
 * @fileOverview UiControls
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

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
class UiControls extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props.store;
    const modeViewIndex = store.modeView;

    const jsxMpr = <div> Not impl.mpr setings !!!</div>;
    const jsx2d = <UiCtrl2d  />;
    const jsx3dLight = <UiCtrl3dLight />;
    const jsx3d = <div>Not impl 3d mode settings !!!</div>;
    const jsxArray = [jsxMpr, jsx2d, jsx3dLight, jsx3d];
    const jsxRet = jsxArray[modeViewIndex];
    return jsxRet;
  }
}

const mapStateToProps = function(storeIn) {
  const objProps = {
    store: storeIn
  };
  return objProps;
}

export default connect(mapStateToProps)(UiControls);

