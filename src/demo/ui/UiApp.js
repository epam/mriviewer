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

import { Nav, Navbar, Container } from 'react-bootstrap';


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

    const jsxNavBarReact = 
      <Container fluid="true">
        <Navbar bg="light" >
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Navbar>
                <UiAbout />
              </Navbar>

              <Navbar.Text className="d-none d-sm-block">
                {strMessageOnMenu}
              </Navbar.Text>
            </Nav>
            <Nav>

              <UiOpenMenu />
              <UiSaveMenu />
              <UiReportMenu />
              <UiFilterMenu />


              {(isLoaded) ? <UiViewMode /> : <p></p>}


            </Nav>
          </Navbar.Collapse>
        </Navbar>
        {(isLoaded) ? <UiMain /> : <p></p>}
      </Container>;

    return jsxNavBarReact;
  } // end render
} // end class

export default connect(store => store)(UiApp);
