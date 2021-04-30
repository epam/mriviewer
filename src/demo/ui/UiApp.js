/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import BrowserDetector from '../engine/utils/BrowserDetector';
import StoreActionType from '../store/ActionTypes';
import { ReactComponent as Logo } from './icons/logo.svg'
import UiOpenMenu from "./UiOpenMenu";
import './UiApp.css'
import UiViewMode from "./UiViewMode";
import UiMain from "./UiMain";

export default class UiApp extends React.Component {
  constructor(props) {
    super(props);
    this.m_store = null;
  }
  
  componentDidMount() {
    const store = this.props;
    // todo: singleton progressbar
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
    return <div className="app-grid">
      <Logo/>
      <UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad}/>
      
      {(this.isWebGl20supported) ? <UiViewMode/> : null}
      {<UiMain/>}
      {/*<UiSaveMenu/>*/}
      {/*<UiReportMenu/>*/}
      {/*{(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu/> : <p></p>}*/}
      {/*{objProgressBar}*/}
    </div>;
  }
}
