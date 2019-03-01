/**
 * @fileOverview UiApp
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';


import UiMain from './UiMain';
import UiOpenMenu from './UiOpenMenu';
import UiViewMode from './UiViewMode';
import UiAbout from './UiAbout';
import UiSaveMenu from './UiSaveMenu';
import UiReportMenu from './UiReportMenu';
import UiFilterMenu from './UiFilterMenu';

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiApp implements all application functionality. This is root class.
 */
class UiApp extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;
    const fileName = store.fileName;

    const strMessageOnMenu = (isLoaded) ? 'File: ' + fileName : 'Press Open button to load scene';

    const jsxNavBar =
      <div className="container-fluid">
        <nav className="navbar navbar-expand-md navbar-fixed-top navbar-light bg-light main-nav">

          { /* Left part */}
          <div className="navbar-collapse collapse nav-content order-2 pull-left">
            <ul className="nav navbar-nav">
              <UiAbout />
              { /* Status string */}
              <li>
                <p className="navbar-text">
                  {strMessageOnMenu}
                </p>
              </li>

            </ul>
          </div>

          { /* Center part */}
          <ul className="nav navbar-nav text-nowrap flex-row mx-md-auto order-1 order-md-2">

            { /* Open menu */}
            <UiOpenMenu />
            <UiSaveMenu />
            <UiReportMenu />
            <UiFilterMenu />

            { /* button group */}
            {(isLoaded) ? <UiViewMode /> : <p></p>}

          </ul>

        </nav>
        {(isLoaded) ? <UiMain /> : <p></p>}
      </div>

    return jsxNavBar;
  } // end render
} // end class

export default connect(store => store)(UiApp);
