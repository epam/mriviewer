/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import BrowserDetector from '../engine/utils/BrowserDetector';
import StoreActionType from '../store/ActionTypes';
import { ReactComponent as Logo } from './icons/logo.svg'
import UiOpenMenu from "./UiOpenMenu";

class UiApp extends React.Component {
  constructor(props) {
    super(props);
    this.m_store = null;
    this.m_fileNameOnLoad = '';
  }
  UNSAFE_componentWillMount() {
    let fileNameOnLoad = '';
    const strSearch = window.location.search;
    if (strSearch.length > 0) {
      const strReg = /\\?url=(\S+)/;
      const arr = strSearch.match(strReg);
      if (arr === null) {
        console.log('arguments should be in form: ?url=www.xxx.yy/zz/ww');
        return;
      }
      fileNameOnLoad = arr[1];
      const regA = /^((ftp|http|https):\/\/)?(([\S]+)\.)?([\S]+)\.([A-z]{2,})(:\d{1,6})?\/[\S]+/;
      const regB = /(ftp|http|https):\/\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)(:([\d]+))?\/([\S]+)/;
      const isValidA = fileNameOnLoad.match(regA);
      const isValidB = fileNameOnLoad.match(regB);
      if ((isValidA === null) && (isValidB === null)) {
        console.log(`Not valid URL = ${fileNameOnLoad}`);
        return;
      }
      this.m_fileNameOnLoad = fileNameOnLoad;
    }
  }
  componentDidMount() {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_UI_APP, uiApp: this });
		
    // browser detector
    const browserDetector = new BrowserDetector();
    this.isWebGl20supported = browserDetector.checkWebGlSupported();
    if (!this.isWebGl20supported) {
      this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
      this.setState({ strAlertText: 'This browser not supported WebGL 2.0. Application functinality is decreased and app can be unstable' });
      // this.onShowModalAlert();
    } else {
      const isValidBro = browserDetector.checkValidBrowser();
      if (!isValidBro) {
        this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
        this.setState({ strAlertText: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers' });
        // this.onShowModalAlert();
      }
    }
  }
  render() {
    return <div>
      <Logo />
      <UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad}/>
			
      {/*{(isLoaded && this.isWebGl20supported) ? <UiViewMode/> : <p></p>}*/}
      {/*{(isLoaded) ? <UiMain/> : <p></p>}*/}
      {/*<UiSaveMenu/>*/}
      {/*<UiReportMenu/>*/}
      {/*{(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu/> : <p></p>}*/}
      {/*{objProgressBar}*/}
      {/*<UiModalText stateVis={this.state.showModalText}*/}
      {/*  onHide={this.onHideModalText} onShow={this.onShowModalText}/>*/}
      {/*<UiModalAlert stateVis={this.state.showModalAlert}*/}
      {/*  onHide={this.onHideModalAlert} onShow={this.onShowModalAlert}*/}
      {/*  title={this.state.strAlertTitle} text={this.state.strAlertText}/>*/}
      {/*{(arrErrorsLoadedd.length > 0) ? <UiErrConsole/> : <p></p>}*/}
    </div>;
  }
}

export default connect(store => store)(UiApp);
