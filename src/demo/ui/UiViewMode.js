/**
 * @fileOverview UiViewMode
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import { connect } from 'react-redux';

import ModeView from '../store/ModeView';
import StoreActionType from '../store/ActionTypes';

// ********************************************************
// Class
// ********************************************************



/**
 * Class UiViewMode some text later...
 */
class UiViewMode extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModeMpr = this.onModeMpr.bind(this);
    this.onMode2d = this.onMode2d.bind(this);
    this.onMode3dLight = this.onMode3dLight.bind(this);
    this.onMode3d = this.onMode3d.bind(this);
  }
  onMode(indexMode) {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: indexMode });
  }
  onModeMpr() {
    this.onMode(ModeView.VIEW_MPR);
  }
  onMode2d() {
    this.onMode(ModeView.VIEW_2D);
  }
  onMode3dLight() {
    this.onMode(ModeView.VIEW_3D_LIGHT);
  }
  onMode3d() {
    this.onMode(ModeView.VIEW_3D);
  }
  logObject(strTitle, obj) {
    let str = '';
    for (let prp in obj) {
      if (str.length > 0) {
        str += '\n';
      }
      str += prp + ' = ' + obj[prp];
    }
    console.log(`${strTitle}\n${str}`);
  }
  //
  render() {
    const store = this.props;
    // this.logObject('UiViewMode this props: ', store);
    const viewMode = store.modeView;

    const srtClass = 'btn btn-secondary';
    const strMpr = srtClass + ((viewMode === ModeView.VIEW_MPR) ? ' active' : '');
    const str2d = srtClass + ((viewMode === ModeView.VIEW_2D) ? ' active' : '');
    const str3dlight = srtClass + ((viewMode === ModeView.VIEW_3D_LIGHT) ? ' active' : '');
    const str3d = srtClass + ((viewMode === ModeView.VIEW_3D) ? ' active' : '');

    const jsxOut = 
      <div className="btn-group mx-3">
        <button type="button" className={strMpr} onClick={this.onModeMpr} >
          MPR
        </button>
        <button type="button" className={str2d} onClick={this.onMode2d}  >
          2D
        </button>
        <button type="button" className={str3dlight} onClick={this.onMode3dLight} >
          3D
          <span className="fa fa-bolt"></span>
        </button>
        <button type="button" className={str3d} onClick={this.onMode3d}  >
          3D
        </button>
      </div>

    return  jsxOut;
  }
}

export default connect(store => store)(UiViewMode);
