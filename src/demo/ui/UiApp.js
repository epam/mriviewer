import React from 'react';
import { connect } from 'react-redux';

import { ProgressBar } from 'react-bootstrap';
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
import UiErrConsole from './UiErrConsole';
import ModeView from '../store/ModeView';

import BrowserDetector from '../engine/utils/BrowserDetector';
import { ExploreTools } from "./Tollbars/ExploreTools";

class UiApp extends React.Component {
  constructor(props) {
    super(props);

    this.m_store = null;
    this.m_fileNameOnLoad = '';

    this.state = {
      strAlertTitle: '???',
      strAlertText: '???',
    };
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
    const store = this.m_store;
    if (store === null) {
      console.log('UiApp. componentDidMount. store is NULL');
    }

    store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });

    // browser detector
    const browserDetector = new BrowserDetector();
    this.isWebGl20supported = browserDetector.checkWebGlSupported();
    if (!this.isWebGl20supported) {
      this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
      this.setState({ strAlertText: 'This browser not supported WebGL 2.0. Application functinality is decreased and app can be unstable' });
      store.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true })
    } else {
      const isValidBro = browserDetector.checkValidBrowser();
      if (!isValidBro) {
        this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
        this.setState({ strAlertText: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers' });
        store.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true })
      }
    }
  }

  onShowModalText() {
    store.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true })
  }

  onHideModalText() {
    store.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: false  })
  }

  onShowModalAlert() {
    store.dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: true })
  }

  onHideModalAlert() {
    store.dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: false })
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    this.m_store = store;
    const isLoaded = store.isLoaded;
    const fileName = store.fileName;
    const arrErrorsLoadedd = store.arrErrors;

    const strMessageOnMenu = (isLoaded) ? 'File: ' + fileName : 'Press Open button to load scene';

    const objProgressBar = (this.m_store.progress) ?
      <ProgressBar
        animated variant="success"

        now={this.m_store.progress}
        label={`${this.m_store.progress}%`}/>
      : null;

    return <>
      {objProgressBar}
      <UiAbout/>
      {strMessageOnMenu}
      <UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad}/>

      <UiSaveMenu/>
      <UiReportMenu/>
      {(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu/> : <p></p>}
      {(isLoaded && this.isWebGl20supported) ? <UiViewMode/> : <p></p>}


      <ExploreTools/>
      {(isLoaded) ? <UiMain/> : <p></p>}
      {(arrErrorsLoadedd.length > 0) ? <UiErrConsole/> : <p></p>}
      <UiModalText stateVis={this.m_store.showModalText}
                   onHide={this.onHideModalText} onShow={this.onShowModalText}/>
      <UiModalAlert stateVis={this.m_store.showModalAlert}
                    onHide={this.onHideModalAlert} onShow={this.onShowModalAlert}
                    title={this.state.strAlertTitle} text={this.state.strAlertText}/></>;
  }
}

export default connect(store => store)(UiApp);
