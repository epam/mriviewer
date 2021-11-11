/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

import StoreActionType from './store/ActionTypes';
import ViewMode from './store/ViewMode';
import Graphics2d from './engine/Graphics2d';
import BrowserDetector from './engine/utils/BrowserDetector';
import Graphics3d from './engine/Graphics3d';
import FileTools from './engine/loaders/FileTools';

import UiSettings from './ui/Toolbars/UiMain';
import UiOpenMenu from './ui/OpenFile/UiOpenMenu';
import UiViewMode from './ui/Toolbars/UiViewMode';
import UiFilterMenu from './ui/UiFilterMenu';
import UiModalText from './ui/Modals/UiModalText';
import UiModalAlert from './ui/Modals/ModalAlert';
import UiErrConsole from './ui/UiErrConsole';
import UiCtrl2d from './ui/UiCtrl2d';
import ExploreTools from './ui/Toolbars/ExploreTools';
import ZoomTools from './ui//UiZoomTools';
import UIProgressBar from './ui/ProgressBar/UIProgressBar';
import UiAbout from './ui/UiAbout';
import FullScreenToggle from './ui/Toolbars/FullScreen';

import css from './App.module.css';
import cx from 'classnames';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.m_store = null;
    this.m_fileNameOnLoad = '';

    this.state = {
      strAlertTitle: '???',
      strAlertText: '???',
      isFullMode: false,
    };

    this.appRef = React.createRef();
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

      if (!FileTools.isValidUrl(fileNameOnLoad)) {
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
      this.setState({
        strAlertText: 'This browser not supported WebGL 2.0. Application functionality is decreased and app can be unstable',
      });
      this.onShowModalAlert();
    } else {
      const isValidBro = browserDetector.checkValidBrowser();
      if (!isValidBro) {
        this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
        this.setState({ strAlertText: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers' });
        this.onShowModalAlert();
      }
    }
    document.addEventListener('fullscreenchange', this.onFullScreenChange);
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullScreenChange);
  }

  onShowModalText() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true });
  }

  onHideModalText() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: false });
  }

  onShowModalAlert() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: true });
  }

  onHideModalAlert() {
    this.props.dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: false });
  }

  startFullMode = () => {
    return this.appRef.current.requestFullscreen().then(() => {
      // TODO: add notification for user
      console.log(`%cFullscreen entered`, 'color:green');
    });
  };

  endFullMode = () => {
    return document.exitFullscreen().then(() => {
      // TODO: add notification for user
      console.log(`%cFullscreen exited`, 'color:green');
    });
  };

  handleFullMode = () => {
    const { isFullMode } = this.state;
    const fn = isFullMode ? this.endFullMode : this.startFullMode;
    fn().catch((err) => {
      // TODO: add notification for user
      console.log(`%cFullscreen error: ${err.message}`, 'color:red');
    });
  };

  onFullScreenChange = () => {
    this.setState((prev) => ({ isFullMode: !prev.isFullMode }));
  };

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    this.m_store = store;
    const arrErrorsLoadedd = store.arrErrors;
    const { isFullMode } = this.state;

    const isReady = store.isLoaded && this.isWebGl20supported;

    return (
      <DndProvider backend={HTML5Backend}>
        <div ref={this.appRef}>
          {this.props.progress > 0 && <UIProgressBar active={this.props.progress} progress={this.props.progress} />}
          {!isFullMode && (
            <div className={css.header}>
              <UiAbout />
              <UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad} />
            </div>
          )}
          {isReady && (
            <div className={cx(isFullMode && css.fullscreen)}>
              <div className={css.left}>
                <UiViewMode />
                {store.viewMode === ViewMode.VIEW_2D && <UiCtrl2d />}
              </div>
              <div className={css.top}>
                {store.viewMode === ViewMode.VIEW_2D && <ExploreTools />}
                {store.viewMode === ViewMode.VIEW_2D && <UiFilterMenu />}
                <FullScreenToggle isFullMode={isFullMode} handler={() => this.handleFullMode()} />
              </div>
              <div className={css.center}>{store.viewMode === ViewMode.VIEW_2D ? <Graphics2d /> : <Graphics3d />}</div>
              <div className={css.bottleft}>{store.viewMode === ViewMode.VIEW_2D && <ZoomTools />}</div>
              <div className={css.settings}>
                <UiSettings />
              </div>
            </div>
          )}

          {arrErrorsLoadedd.length > 0 && <UiErrConsole />}

          {this.props.showModalText && (
            <UiModalText
              stateVis={this.props.showModalText}
              onHide={this.onHideModalText.bind(this)}
              onShow={this.onShowModalText.bind(this)}
            />
          )}

          {this.props.showModalAlert && (
            <UiModalAlert
              stateVis={this.props.showModalAlert}
              onHide={this.onHideModalAlert.bind(this)}
              onShow={this.onShowModalAlert.bind(this)}
              title={this.props.strAlertTitle}
              text={this.props.strAlertText}
            />
          )}
        </div>
      </DndProvider>
    );
  }
}

export default connect((store) => store)(App);
