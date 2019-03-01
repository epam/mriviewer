/**
 * @fileOverview UiMain2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import UiCtrl2d from './UiCtrl2d';
import {  W_RENDER, H_RENDER } from './UiRenderView';
import Graphics2d from '../engine/Graphics2d';
import UiHistogram from './UiHistogram';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMain2d some text later...
 */
class UiMain2d extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const vol = store.volume;

    const jsxMain2d = <div className="row">
      <div className="col-md-4">
        <UiCtrl2d />
        <UiHistogram volume={vol}/>
      </div>
      <div className="col-md-8">
        <Graphics2d wScreen={W_RENDER} hScreen={H_RENDER} />
      </div>
    </div>
    return jsxMain2d;
  };
}

export default connect(store => store)(UiMain2d);
