/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import '../nouislider-custom.css';

import React from 'react';
import { connect } from 'react-redux';

import StoreActionType from '../store/ActionTypes';

import UiSettings from './Tollbars/UiMain';
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
import Graphics3d from "../engine/Graphics3d";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import UiZoomButtons  from "./UiZoomButtons";

class UiApp extends React.Component {
	constructor(props) {
		super(props);
		this.m_fileNameOnLoad = '';
		
		this.state = {
			alertTitle: '???',
			alertText: '???',
		};
		
		this.handleUrlInPath();
	}
	
	handleUrlInPath() {
		const strSearch = window.location.search;
		if (strSearch.length > 0) {
			const strReg = /\\?url=(\S+)/;
			const arr = strSearch.match(strReg);
			if (arr === null) {
				console.log('arguments should be in form: ?url=www.xxx.yy/zz/ww');
				return;
			}
			this.m_fileNameOnLoad = arr[1];
			this.validateUrl();
		}
	}
	
	validateUrl() {
		const regA = /^((ftp|http|https):\/\/)?(([\S]+)\.)?([\S]+)\.([A-z]{2,})(:\d{1,6})?\/[\S]+/;
		const regB = /(ftp|http|https):\/\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)(:([\d]+))?\/([\S]+)/;
		const isValidA = this.m_fileNameOnLoad.match(regA);
		const isValidB = this.m_fileNameOnLoad.match(regB);
		
		if ((isValidA === null) && (isValidB === null)) {
			console.log(`Not valid URL = ${this.m_fileNameOnLoad}`);
		}
	}
	
	showAlert(alertTitle, alertText) {
		this.setState({ alertTitle });
		this.setState({ alertText });
		this.onShowModalAlert();
	}
	
	componentDidMount() {
		this.props.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });
		
		// browser detector
		const browserDetector = new BrowserDetector();
		this.isWebGl20supported = browserDetector.checkWebGlSupported();
		if (!this.isWebGl20supported) {
			this.showAlert('Browser compatibility problem detected',
				'This browser not supported WebGL 2.0. Application functionality is decreased and app can be unstable');
		} else {
			const isValidBro = browserDetector.checkValidBrowser();
			if (!isValidBro) {
				this.showAlert('Browser compatibility problem detected',
					'App is specially designed for Chrome/Firefox/Opera/Safari browsers');
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
		
		const arrErrorsLoaded = this.props.arrErrors;
		
		const isReady = this.props.isLoaded && this.isWebGl20supported
		
		return (
			<DndProvider backend={HTML5Backend}>
				{this.props.progress > 0 && (
					<UIProgressBar
						active={this.props.progress}
						progress={this.props.progress}
					/>)}
				<div className={css.header}>
					<UiAbout/>
					<UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad}/>
				</div>
				{isReady && (<>
						<div className={css.left}>
							<UiViewMode/>
							{this.props.modeView === ModeView.VIEW_2D && <UiCtrl2d/>}
						</div>
						<div className={css.top}>
							{this.props.modeView === ModeView.VIEW_2D && <ExploreTools/>}
							{this.props.modeView === ModeView.VIEW_2D && <UiFilterMenu/>}
						</div>
						<div className={css.center}>
							{this.props.modeView === ModeView.VIEW_2D ? <Graphics2d/> : <Graphics3d/>}
						</div>
						<div className={css.bottleft}>
							{this.props.modeView === ModeView.VIEW_2D && <UiZoomButtons />}
						</div>
						<div className={css.settings}>
							<UiSettings/>
						</div>
					</>
				)}
				
				{arrErrorsLoaded.length > 0 && <UiErrConsole/>}
				
				{this.props.showModalText && <UiModalText stateVis={this.props.showModalText}
				                                          onHide={this.onHideModalText.bind(this)}
				                                          onShow={this.onShowModalText.bind(this)}/>}
				
				{this.props.showModalAlert && <UiModalAlert stateVis={this.props.showModalAlert}
				                                            onHide={this.onHideModalAlert.bind(this)}
				                                            onShow={this.onShowModalAlert.bind(this)}
				                                            title={this.props.alertTitle}
				                                            text={this.props.alertText}/>}
			</DndProvider>
		);
	}
}

export default connect(store => store)(UiApp);
