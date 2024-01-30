/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState } from 'react';
import StoreActionType from '../store/ActionTypes';

import FullScreenToggle from './Toolbars/FullScreen';
import UiModalText from './Modals/UiModalText';
import UiModalAlert from './Modals/ModalAlert';
import ModeView from '../store/ViewMode';
import Graphics2d from '../engine/Graphics2d';
import BrowserDetector from '../engine/utils/BrowserDetector';
import UIProgressBar from './ProgressBar/UIProgressBar';
import Graphics3d from '../engine/Graphics3d';
import ZoomTools from './UiZoomTools';
import { useDrop } from 'react-dnd';
import { DnDItemTypes } from './Constants/DnDItemTypes';
import { Header } from './Header/Header';
import { RightPanel } from './Panels/RightPanel';
import Spinner from './ProgressBar/UISpinner';
import { AppContextProvider } from './App/AppContext';

import { LeftToolbar } from './LeftToolbar/LeftToolbar';
import { useDispatch, useSelector } from 'react-redux';
import { TopToolbar } from './TopToolbar/TopToolbar';
import { UiAbout } from './Header/UiAbout';
import { MobileSettings } from './MobileSettings/MobileSettings';
import StartScreen from './StartScreen/StartScreen';
import MriViwer from '../engine/lib/MRIViewer';
import { MriEvents } from '../engine/lib/enums';

import css from './Main.module.css';
import cx from 'classnames';
import '../nouislider-custom.css';
import UiModalWindowCenterWidth from './Modals/UiModalWindowCenterWidth';
import { useOnEvent } from './hooks/useOnEvent';
import { mriEventsService } from '../engine/lib/services';
import UiModalConfirmation from './Modals/UiModalConfirmation';
import PositionTool3D from './Toolbars/PositionTool3D';

export const Main = () => {
  const dispatch = useDispatch();
  const {
    isLoaded,
    progress,
    spinner,
    viewMode,
    showModalText,
    showModalAlert,
    showModalWindowCW,
    showModalConfirmation,
    lungsSeedStatus,
  } = useSelector((state) => state);

  const [m_fileNameOnLoad, setM_fileNameOnLoad] = useState(false);
  const [isWebGl20supported, setIsWebGl20supported] = useState(true);
  const [strAlertTitle, setStrAlertTitle] = useState('');
  const [strAlertText, setStrAlertText] = useState('');
  const [isFullMode, setIsFullMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const appRef = useRef();
  const mriViwer = useRef(MriViwer).current;

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleFileReadError = (eventData) => {
      setStrAlertTitle('File Read Error');
      setStrAlertText(eventData.error);
      onShowModalAlert();
    };

    // Subscribe to the FILE_READ_ERROR event
    mriViwer.events.on(MriEvents.FILE_READ_ERROR, handleFileReadError);

    // Clean up
    return () => {
      mriViwer.events.off(MriEvents.FILE_READ_ERROR, handleFileReadError);
    };
  }, []);

  const [, drop] = useDrop(
    () => ({
      accept: DnDItemTypes.SETTINGS,
      drop(item, monitor) {
        const delta = monitor.getDifferenceFromInitialOffset();
        return delta;
      },
    }),
    []
  );

  const isReady = isLoaded && isWebGl20supported;
  const onShowModalText = () => {
    dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: true });
  };

  const onHideModalText = () => {
    dispatch({ type: StoreActionType.SET_MODAL_TEXT, showModalText: false });
  };

  const onShowModalAlert = () => {
    dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: true });
  };

  const onHideModalAlert = () => {
    dispatch({ type: StoreActionType.SET_MODAL_ALERT, showModalAlert: false });
  };

  const startFullMode = () => {
    return appRef.current.requestFullscreen().then(() => {
      // TODO: add notification for user
      console.log(`%cFullscreen entered`, 'color:green');
    });
  };

  const endFullMode = () => {
    return document.exitFullscreen().then(() => {
      // TODO: add notification for user
      console.log(`%cFullscreen exited`, 'color:green');
    });
  };

  const handleFullMode = () => {
    const fn = isFullMode ? endFullMode : startFullMode;
    fn().catch((err) => {
      // TODO: add notification for user
      console.log(`%cFullscreen error: ${err.message}`, 'color:red');
    });
  };

  const onFullScreenChange = () => {
    setIsFullMode(!isFullMode);
  };
  useEffect(() => {
    const strSearch = window.location.search;
    if (strSearch.length > 0) {
      const strReg = /\\?url=(\S+)/;
      const arr = strSearch.match(strReg);
      if (arr === null) {
        console.log('arguments should be in form: ?url=www.xxx.yy/zz/ww');
        return;
      }
      let fileNameOnLoad = arr[1];
      const regA = /^((ftp|http|https):\/\/)?(([\S]+)\.)?([\S]+)\.([A-z]{2,})(:\d{1,6})?\/[\S]+/;
      const regB = /(ftp|http|https):\/\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)(:([\d]+))?\/([\S]+)/;
      const isValidA = fileNameOnLoad.match(regA);
      const isValidB = fileNameOnLoad.match(regB);
      if (isValidA === null && isValidB === null) {
        console.log(`Not valid URL = ${fileNameOnLoad}`);
        return;
      }
      setM_fileNameOnLoad(fileNameOnLoad);
    }
  }, [m_fileNameOnLoad]);

  useEffect(() => {
    // browser detector
    const browserDetector = new BrowserDetector();
    setIsWebGl20supported(browserDetector.checkWebGlSupported());
    if (!isWebGl20supported) {
      setStrAlertTitle('Browser compatibility problem detected');
      setStrAlertText('This browser not supported WebGL 2.0. Application functionality is decreased and' + ' app can be unstable');
      onShowModalAlert();
    } else {
      const isValidBro = browserDetector.checkValidBrowser();
      if (!isValidBro) {
        setStrAlertTitle('Browser compatibility problem detected');
        setStrAlertText('App is specially designed for Chrome/Firefox/Opera/Safari browsers');
        onShowModalAlert();
      }
    }
  }, [strAlertText, strAlertTitle, isWebGl20supported]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange);
    };
  }, [isFullMode, isMobile]);

  const onHide = () => {
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_WINDOW_WC, showModalWindowCW: false });
  };

  useOnEvent(mriEventsService.FILE_READ_SUCCESS, onHide);

  useEffect(() => {
    if (lungsSeedStatus) {
      setStrAlertTitle('Attention!');
      setStrAlertText(' Please note, the uploaded image may not contain lungs!');
      onShowModalAlert();
      dispatch({ type: StoreActionType.SET_LUNGS_SEED_STATUS, lungsSeedStatus: false });
    }
  });

  return (
    <AppContextProvider>
      <div ref={appRef} style={{ height: '100%' }}>
        <div ref={drop} style={{ height: '100%' }}>
          {progress > 0 ? <UIProgressBar /> : null}
          {spinner ? <Spinner /> : null}
          {isReady ? (
            <div className={css.header}>
              {!isFullMode && (
                <div className={css.header__logo}>
                  <UiAbout />
                </div>
              )}
              {isReady && (
                <div className={cx(isFullMode && css.fullscreen)}>
                  <div className={css.header__panels}>
                    <TopToolbar />
                    <div className={css.top}>
                      <FullScreenToggle isFullMode={isFullMode} handler={() => handleFullMode()} />
                      {viewMode === ModeView.VIEW_3D && <PositionTool3D />}
                    </div>
                  </div>
                </div>
              )}
              {!isFullMode && (
                <div className={css.header__right}>
                  <Header />
                </div>
              )}
            </div>
          ) : (
            <StartScreen />
          )}
          {isReady && (
            <div className={cx(isFullMode && css.fullscreen)}>
              <div className={css.left}>
                <LeftToolbar />
              </div>

              <div className={css.center}>{viewMode === ModeView.VIEW_2D ? <Graphics2d /> : <Graphics3d />}</div>
              <div className={css.bottleft}>{viewMode === ModeView.VIEW_2D && <ZoomTools />}</div>
              <RightPanel />
            </div>
          )}
          {isReady && isMobile && (
            <div className={cx(isFullMode && css.fullscreen)}>
              <div className={css.center}>{viewMode === ModeView.VIEW_2D ? <Graphics2d /> : <Graphics3d />}</div>
              <MobileSettings />
            </div>
          )}
          {showModalText && (
            <UiModalText stateVis={showModalText} onHide={onHideModalText.bind(this)} onShow={onShowModalText.bind(this)} />
          )}
          {showModalAlert && (
            <UiModalAlert
              stateVis={showModalAlert}
              onHide={onHideModalAlert.bind(this)}
              onShow={onShowModalAlert.bind(this)}
              title={strAlertTitle}
              text={strAlertText}
            />
          )}
          {showModalWindowCW && <UiModalWindowCenterWidth stateVis={showModalWindowCW} onHide={onHide} />}
          {showModalConfirmation && <UiModalConfirmation />}
        </div>
      </div>
    </AppContextProvider>
  );
};
