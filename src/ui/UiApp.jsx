/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, {useEffect, useState} from "react";
import {connect} from "react-redux";

import StoreActionType from '../store/ActionTypes';

import UiOpenMenu from './OpenFile/UiOpenMenu';
import UiViewMode from './Tollbars/UiViewMode';
import UiFilterMenu from './UiFilterMenu';
import UiModalText from './Modals/UiModalText';
import UiModalAlert from './Modals/ModalAlert';
import UiErrConsole from './UiErrConsole';
import ModeView from '../store/ModeView';
import Graphics2d from "../engine/Graphics2d";
import UiCtrl2d from "./UiCtrl2d";

import BrowserDetector from '../engine/utils/BrowserDetector';
import ExploreTools from "./Tollbars/ExploreTools";
import UIProgressBar from "./ProgressBar/UIProgressBar";
import UiAbout from "./UiAbout";

import css from "./UiApp.module.css";
import '../nouislider-custom.css';
import Graphics3d from "../engine/Graphics3d";
import ZoomTools from "./UiZoomTools";
import UiMainDNDContainer from "./Tollbars/UiMainDNDContainer";
import {useDrop} from "react-dnd";
import {DnDItemTypes} from "./Constants/DnDItemTypes";

const UiApp = (props) => {
    const [m_fileNameOnLoad, setM_fileNameOnLoad] = useState('');
    const [isWebGl20supported, setIsWebGl20supported] = useState('');
    const [strAlertTitle, setStrAlertTitle] = useState();
    const [strAlertText, setStrAlertText] = useState();

    const [, drop] = useDrop(() => ({
        accept: DnDItemTypes.SETTINGS,
        drop(item, monitor) {
            const delta = monitor.getDifferenceFromInitialOffset();
            return delta;
        }
    }), []);

    const arrErrorsLoaded = props.arrErrors;
    const isReady = props.isLoaded && isWebGl20supported;

    const onShowModalText = () => {
        props.dispatch({type: StoreActionType.SET_MODAL_TEXT, showModalText: true})
    }

    const onHideModalText = () => {
        props.dispatch({type: StoreActionType.SET_MODAL_TEXT, showModalText: false})
    }

    const onShowModalAlert = () => {
        props.dispatch({type: StoreActionType.SET_MODAL_ALERT, showModalAlert: true})
    }

    const onHideModalAlert = () => {
        props.dispatch({type: StoreActionType.SET_MODAL_ALERT, showModalAlert: false})
    }

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
            if ((isValidA === null) && (isValidB === null)) {
                console.log(`Not valid URL = ${fileNameOnLoad}`);
                return;
            }
            setM_fileNameOnLoad(fileNameOnLoad);
        }
    }, [m_fileNameOnLoad])


    useEffect(() => {
        props.dispatch({type: StoreActionType.SET_PROGRESS, progress: 0});

        // browser detector
        const browserDetector = new BrowserDetector();
        setIsWebGl20supported(browserDetector.checkWebGlSupported());
        if (!isWebGl20supported && isWebGl20supported !== '') {
            setStrAlertTitle('Browser compatibility problem detected');
            setStrAlertText('This browser not supported WebGL 2.0. Application functionality is decreased and' +
                ' app can be unstable');
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

    return (<div ref={drop}>
        {props.progress > 0 && (
            <UIProgressBar
                active={props.progress}
                progress={props.progress}
            />)}
        <div className={css.header}>
            <UiAbout/>
            <UiOpenMenu fileNameOnLoad={m_fileNameOnLoad}/>
        </div>
        {isReady && (<>
                <div className={css.left}>
                    <UiViewMode/>
                    {props.modeView === ModeView.VIEW_2D && <UiCtrl2d/>}
                </div>
                <div className={css.top}>
                    {props.modeView === ModeView.VIEW_2D && <ExploreTools/>}
                    {props.modeView === ModeView.VIEW_2D && <UiFilterMenu/>}
                </div>
                <div className={css.center}>
                    {props.modeView === ModeView.VIEW_2D ? <Graphics2d/> : <Graphics3d/>}
                </div>
                <div className={css.bottleft}>
                    {props.modeView === ModeView.VIEW_2D && <ZoomTools/>}
                </div>
                <UiMainDNDContainer/>
            </>
        )}

        {arrErrorsLoaded.length > 0 && <UiErrConsole/>}

        {props.showModalText && <UiModalText stateVis={props.showModalText}
                                             onHide={onHideModalText.bind(this)}
                                             onShow={onShowModalText.bind(this)}/>}

        {props.showModalAlert && <UiModalAlert stateVis={props.showModalAlert}
                                               onHide={onHideModalAlert.bind(this)}
                                               onShow={onShowModalAlert.bind(this)}
                                               title={strAlertTitle}
                                               text={strAlertText}/>}
    </div>);
}

export default connect(store => store)(UiApp);