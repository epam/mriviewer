/**
 * @fileOverview UiMain3dLight
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import UiCtrl3dLight from './UiCtrl3dLight';
import Graphics3d from '../engine/Graphics3d';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMain3dLight some text later...
 */
class UiMain3dLight extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    // const store = this.props;
    // const vol = store.volume;

    const jsxMain3dLight = <div className="row">
      <div className="col-md-4">
        <UiCtrl3dLight />
      </div>
      <div className="col-md-8">
        <Graphics3d />
      </div>
    </div>
    return jsxMain3dLight;
  };
}

export default connect(store => store)(UiMain3dLight);
