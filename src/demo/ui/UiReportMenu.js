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
import { NavDropdown } from 'react-bootstrap';

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
    const store = this.props;
    const isLoaded = store.isLoaded;

    const strDisabled = (isLoaded) ? false : true;
    const jsxReportMenu = 
      <NavDropdown id="save-nav-dropdown" 
        disabled={strDisabled}
        title={
          <div style={{ display: 'inline-block' }}> 
            <i className="fas fa-book"></i>
            Report
          </div>
        } >
        <NavDropdown.Item>
          <i className="fas fa-clipboard-list"></i>
          Show tags
        </NavDropdown.Item>

        <NavDropdown.Item>
          <i className="fas fa-camera"></i>
          Screenshot
        </NavDropdown.Item>

      </NavDropdown>;    

    return jsxReportMenu;
  }
}

export default connect(store => store)(UiReportMenu);
