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

import { Nav, Navbar, Container, ProgressBar, Row, Col } from 'react-bootstrap';
// import { OverlayTrigger, Tooltip } from 'react-bootstrap';
// import { Button } from 'react-bootstrap';

import StoreActionType from '../store/ActionTypes';

import UiMain from './UiMain';
import UiOpenMenu from './UiOpenMenu';
import UiViewMode from './UiViewMode';
import UiAbout from './UiAbout';
import UiSaveMenu from './UiSaveMenu';
import UiReportMenu from './UiReportMenu';
import UiFilterMenu from './UiFilterMenu';
import UiModalText from './UiModalText';
import UiModalAlert from './UiModalAlert';
import ModeView from '../store/ModeView';

//import BrowserDetector from '../engine/utils/BrowserDetector';


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

    this.onShowModalAlert = this.onShowModalAlert.bind(this);
    this.onHideModalAlert = this.onHideModalAlert.bind(this);

    this.doShowProgressBar = this.doShowProgressBar.bind(this);
    this.doHideProgressBar = this.doHideProgressBar.bind(this);
    this.doSetProgressBarRatio = this.doSetProgressBarRatio.bind(this);

    this.m_modalText = null;
    this.m_store = null;

    this.state = {
      showModalText: false,
      showProgressBar: false,
      progressBarRatio: 55,
      showModalAlert: false,
      strAlertTitle: '???',
      strAlertText: '???',
    };
  }
  componentDidMount() {
    const store = this.m_store;
    if (store === null) {
      console.log('UiApp. componentDidMount. store is NULL');
    }
    store.dispatch({ type: StoreActionType.SET_UI_APP, uiApp: this });

    // browser detector
    //const browserDetector = new BrowserDetector();
    const isWebGl20supported = true; //browserDetector.checkWebGlSupported();
    if (!isWebGl20supported) {
      this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
      this.setState({ strAlertText: 'This browser not supported WebGL 2.0. Application functinality is decreased and app can be unstable' });
      this.onShowModalAlert();
    } else {
      const isValidBro = true; //browserDetector.checkValidBrowser();
      if (!isValidBro) {
        this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
        this.setState({ strAlertText: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers' });
        this.onShowModalAlert();
      } // if not valid browser
    } // if webgl 2.0 supported
  }
  onShowModalText() {
    this.setState({ showModalText: true });
  }
  onHideModalText() {
    this.setState({ showModalText: false });
  }
  onShowModalAlert() {
    this.setState({ showModalAlert: true });
  }
  onHideModalAlert() {
    this.setState({ showModalAlert: false });
  }
  doShowProgressBar() {
    this.setState({ showProgressBar: true });
  }
  doHideProgressBar() {
    // console.log('doHideProgressBar');
    this.setState({ showProgressBar: false });
  }
  doSetProgressBarRatio(ratio) {
    // console.log(`doSetProgressBarRatio: ${ratio}`);
    this.setState({ progressBarRatio: ratio });
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

    const objPrgBarVis = 
      <Row>
        <Col>
        Loading...
          <ProgressBar animated variant="info"
            now={this.state.progressBarRatio} label={`${this.state.progressBarRatio}%`}  />
        </Col>
      </Row>
    const objProgressBar = (this.state.showProgressBar) ? objPrgBarVis : <p></p>;

    const jsxNavBarReact = 
      <Container fluid="true">
        <Navbar bg="light" variant="light" expand="lg" >
          <Navbar.Brand>
            <UiAbout />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">

              <Navbar.Text className="d-none d-sm-block">
                {strMessageOnMenu}
              </Navbar.Text>

              <UiOpenMenu />
              <UiSaveMenu />
              <UiReportMenu />
              {(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu /> : <p></p>}
              {(isLoaded) ? <UiViewMode /> : <p></p>}
            </Nav>
          </Navbar.Collapse>

        </Navbar>
        {(isLoaded) ? <UiMain /> : <p></p>}
        <UiModalText stateVis={this.state.showModalText}
          onHide={this.onHideModalText} onShow={this.onShowModalText} />
        <UiModalAlert stateVis={this.state.showModalAlert}
          onHide={this.onHideModalAlert} onShow={this.onShowModalAlert} 
          title={this.state.strAlertTitle} text={this.state.strAlertText} />

        {objProgressBar}
      </Container>;

    return jsxNavBarReact;
  } // end render
} // end class

/*
<Nav.Link href="#">
MPR
</Nav.Link>
<Nav.Link href="#">
  2D
</Nav.Link>
<Nav.Link href="#">
  3DLight
</Nav.Link>
<Nav.Link href="#">
  3D
</Nav.Link>
*/

export default connect(store => store)(UiApp);
