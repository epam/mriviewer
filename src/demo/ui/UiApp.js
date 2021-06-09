import React from 'react';
import { connect } from 'react-redux';

import StoreActionType from '../store/ActionTypes';

import UiMain from './UiMain';
import UiOpenMenu from './UiOpenMenu';
import UiViewMode from './UiViewMode';
import UiFilterMenu from './UiFilterMenu';
import UiModalText from './UiModalText';
import UiModalAlert from './Modals/ModalAlert';
import UiErrConsole from './UiErrConsole';
import ModeView from '../store/ModeView';

import BrowserDetector from '../engine/utils/BrowserDetector';
import ExploreTools from "./Tollbars/ExploreTools";
import UIProgressBar from "./ProgressBar/UIProgressBar";
import UiAbout from "./UiAbout";
import css from "./UiApp.module.css";
import { Container } from "./Tollbars/Container";

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
    this.props.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true })
  }

  onHideModalText() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: false })
  }

  onShowModalAlert() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: true })
  }

  onHideModalAlert() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: false })
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    this.m_store = store;
    const arrErrorsLoadedd = store.arrErrors;

    const isReady = store.isLoaded && this.isWebGl20supported
    
    return <>
      {(this.props.progress) ?
        <UIProgressBar active={this.props.progress}
                       progress={this.props.progress}/>
        : null}
<div className={css["header"]}>
        <UiAbout active={false}/>
        
        <UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad}/>
      </div>
      {(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu/> : null}
      {(isReady) ? <>
        <Container direction="vertical">
          <UiViewMode/>
          <UiMain/>
        </Container>
        <ExploreTools/>
      </> : null}
      
      {(arrErrorsLoadedd.length > 0) ? <UiErrConsole/> : null}
      <UiModalText stateVis={this.props.showModalText}
                   onHide={this.onHideModalText}
                   onShow={this.onShowModalText}/>
      <UiModalAlert stateVis={this.props.showModalAlert}
                    onHide={this.onHideModalAlert}
                    onShow={this.onShowModalAlert}
                    title={this.props.strAlertTitle}
                    text={this.props.strAlertText}/>
    </>;
  }
  
}

export default connect(store => store)(UiApp);
