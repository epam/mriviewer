/**
 * @fileOverview UiReportMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiReportMenu some text later...
 */
class UiReportMenu extends React.Component {
  // invoked after render
  componentDidMount() {
  }
  render() {
    const store = this.props.store;
    const isLoaded = store.isLoaded;
    const strClass = (isLoaded) ? 'btn dropdown-toggle' : 'btn dropdown-toggle disabled';

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

const mapStateToProps = function(storeIn) {
  const objProps = {
    store: storeIn
  };
  return objProps;
}

export default connect(mapStateToProps)(UiReportMenu);
