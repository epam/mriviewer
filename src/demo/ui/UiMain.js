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


import UiControls from './UiControls';
import UiRenderView from './UiRenderView';
import UiHistogram from './UiHistogram';


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
  onSliderSlice(val) {
    this.setState({ slider2d: val });
  }
  onMode2d(ind) {
    this.setState({ mode2d: ind });
  }
  onMode3d(ind) {
    this.setState({ mode3d: ind });
  }
  onSliderSlice3dr(val) {
    this.setState({ slider3d_r: val });
  }
  onSliderSlice3dg(val) {
    this.setState({ slider3d_g: val });
  }
  onSliderSlice3db(val) {
    this.setState({ slider3d_b: val });
  }
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props.store;
    const modeViewIndex = store.modeView;
    const vol = store.volume;

    const strStyleX = {
      "overflowX": "auto"
    };
    const strStyleY = {
      "overflowY": "auto"
    };

    const jsxRenderMain =
    <div className="row" style={strStyleX} >
      <div className="col-md-4" style={strStyleY}>
        <UiControls />
        <UiHistogram modeView={modeViewIndex} volume={vol} />
      </div>
      <div className="col-md-8" style={strStyleY}>
        <UiRenderView />
      </div>
    </div>
    return jsxRenderMain;
  };
}

const mapStateToProps = function(storeIn) {
  const objProps = {
    store: storeIn
  };
  return objProps;
}

export default connect(mapStateToProps)(UiMain);
