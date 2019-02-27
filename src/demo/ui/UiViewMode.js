/**
 * @fileOverview UiViewMode
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import { ModeView } from  './UiApp';

// ********************************************************
// Class
// ********************************************************



/**
 * Class UiViewMode some text later...
 */
export default class UiViewMode extends React.Component {
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
  onModeMpr() {
    const onMode = this.props.onMode;
    onMode(ModeView.VIEW_MPR);
  }
  onMode2d() {
    const onMode = this.props.onMode;
    onMode(ModeView.VIEW_2D);
  }
  onMode3dLight() {
    const onMode = this.props.onMode;
    onMode(ModeView.VIEW_3D_LIGHT);
  }
  onMode3d() {
    const onMode = this.props.onMode;
    onMode(ModeView.VIEW_3D);
  }
  //
  render() {
    const viewMode = this.props.modeView;
    // console.log(`remnder. viewMode = ${viewMode}`);

    const srtClass = 'btn btn-secondary';
    const strMpr = srtClass + ((viewMode === 0) ? ' active' : '');
    const str2d = srtClass + ((viewMode === 1) ? ' active' : '');
    const str3dlight = srtClass + ((viewMode === 2) ? ' active' : '');
    const str3d = srtClass + ((viewMode === 3) ? ' active' : '');

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
