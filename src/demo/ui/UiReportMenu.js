/**
 * @fileOverview UiReportMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiReportMenu some text later...
 */
export default class UiReportMenu extends React.Component {
  //constructor(props) {
  //  super(props);
  //}
  // invoked after render
  componentDidMount() {
  }
  render() {
    const isLoaded = this.props.isLoaded;
    const strClass = (isLoaded) ? 'btn-sm dropdown-toggle' : 'btn-sm dropdown-toggle disabled';

    const jsxReportMenu =
      <div className="dropdown">
        <button className={strClass} type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-book"></i>
          Report
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">

          <button className="dropdown-item" type="button"  >
            <i className="fas fa-clipboard-list"></i>
            Show tags
          </button>

          <button className="dropdown-item" type="button"  >
            <i className="fas fa-camera"></i>
            Screenshot
          </button>

        </div>
      </div>

    return jsxReportMenu;
  }
}
