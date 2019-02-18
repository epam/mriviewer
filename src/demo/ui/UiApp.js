/**
 * @fileOverview UiApp
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

import UiMain from './UiMain';
import UiOpenMenu from './UiOpenMenu';
import UiViewMode from './UiViewMode';
import UiAbout from './UiAbout';
import UiSaveMenu from './UiSaveMenu';
import UiReportMenu from './UiReportMenu';
import UiFilterMenu from './UiFilterMenu';


// ********************************************************
// Const
// ********************************************************

export const ModeView = {
  VIEW_NA: -1,
  VIEW_MPR: 0,
  VIEW_2D: 1,
  VIEW_3D_LIGHT: 2,
  VIEW_3D: 3
};

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiApp implements all application functionality. This is root class.
 */
export default class UiApp extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onMode = this.onMode.bind(this);
    this.state = {
      modeView: ModeView.VIEW_2D
    };
  }
  onMode(indexMode) {
    console.log(`cur mode view = ${indexMode}`);
    if (indexMode === undefined) {
      console.log('Unidefined indexMode !!!');
    }
    this.setState({ modeView: indexMode });
  }
  onRadio(evt) {
    // do nothing
  }
  /**
   * Main component render func callback
   */
  render() {
    //const styleBackColor = {
    //  'backgroundColor': '#e3f2fd',
    //};
    const onNewFileFunc = this.props.onNewFile;
    const isLoaded = this.props.isLoaded;
    const fileName = this.props.fileName;
    const vol = this.props.volume;
    const tex3d = this.props.texture3d;
    const strMessageOnMenu = (isLoaded) ? 'File: ' + fileName : 'Press Open button to load scene';

    const jsxNavBar =
      <div className="containter">
        <nav className="navbar navbar-expand-md navbar-fixed-top navbar-light bg-light main-nav">
          <div className="container">

            { /* Left part */ }
            <div className="navbar-collapse collapse nav-content order-2 pull-left">
              <ul className="nav navbar-nav">

                <UiAbout />
                { /* Status string */ }
                <li className="nav nav-item disabled">
                  <p className="navbar-text">
                    {strMessageOnMenu}
                  </p>
                </li>

              </ul>
            </div>

            { /* Center part */ }
            <ul className="nav navbar-nav text-nowrap flex-row mx-md-auto order-1 order-md-2">

              { /* Open menu */}
              <UiOpenMenu onNewFile={onNewFileFunc} />
              <UiSaveMenu isLoaded={isLoaded}  />
              <UiReportMenu isLoaded={isLoaded}  />
              <UiFilterMenu isLoaded={isLoaded}  />

              { /* button group */ }
              {(isLoaded) ? <UiViewMode modeView={this.state.modeView} onMode={this.onMode} /> : <p></p>}

            </ul>        

          </div>
        </nav>
        {(isLoaded) ? <UiMain modeView={this.state.modeView} volume={vol} texture3d={tex3d}  /> : <p></p>}
      </div>

    return jsxNavBar;
  } // end render
} // end class



