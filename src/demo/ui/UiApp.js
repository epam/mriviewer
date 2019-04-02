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


import StoreActionType from '../store/ActionTypes';

import UiMain from './UiMain';
import UiOpenMenu from './UiOpenMenu';
import UiViewMode from './UiViewMode';
import UiAbout from './UiAbout';
import UiSaveMenu from './UiSaveMenu';
import UiReportMenu from './UiReportMenu';
import UiFilterMenu from './UiFilterMenu';
import UiModalText from './UiModalText';

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiApp implements all application functionality. This is root class.
 */
class UiApp extends React.Component {
  constructor(props) {
    super(props);

    this.onShowModalText = this.onShowModalText.bind(this);
    this.onHideModalText = this.onHideModalText.bind(this);

    this.m_modalText = null;
    this.m_store = null;

    this.state = {
      showModalText: false,
    };
  }
  componentDidMount() {
    const store = this.m_store;
    if (store === null) {
      console.log('UiApp. componentDidMount. store is NULL');
    }
    store.dispatch({ type: StoreActionType.SET_UI_APP, uiApp: this });
  }
  onShowModalText() {
    this.setState({ showModalText: true });
  }
  onHideModalText() {
    this.setState({ showModalText: false });
  }
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    this.m_store = store;
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
        <UiModalText stateVis={this.state.showModalText}
          onHide={this.onHideModalText} onShow={this.onShowModalText} />
      </Container>;

    return jsxNavBarReact;
  } // end render
} // end class

export default connect(store => store)(UiApp);
