/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';

import BrowserDetector from '../engine/utils/BrowserDetector';
import { ReactComponent as Logo } from './icons/logo.svg'
import UiOpenMenu from "./UiOpenMenu";
import './UiApp.css'
import UiMain2d from "./UiMain2d";
import UiMain3dLight from "./UiMain3dLight";
import ViewModes from "../store/ViewModes";
import { Context } from "../context/Context";

const UiApp = () => {
  const { context, setContext } = useContext(Context)
   console.log( `initial context: ${JSON.stringify(context, null, 2)}`);
  
  const browserDetector = new BrowserDetector();
  const isWebGl20supported = browserDetector.checkWebGlSupported();
  
  if (!isWebGl20supported) {
    setContext({
      ...context, alert: {
        title: 'Browser compatibility problem detected',
        text: 'This browser not supported WebGL 2.0. Application functinality is decreased and app can be unstable'
      }
    })
  } else {
    const isValidBro = browserDetector.checkValidBrowser();
    if (!isValidBro) {
      setContext({
        ...context,
        alert: {
          title: 'Browser compatibility problem detected',
          text: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers'
        }
      })
    }
  }
  
  return <div className="file-area">
    {/*<div className="progress--top">*/}
    {/*  <progress value={context.progress.value}/>*/}
    {/*  <span className="progress__text">{context.progress.text}</span>}*/}
    {/*</div>*/}
    <Logo/>
    <UiOpenMenu fileNameOnLoad={'m_fileNameOnLoad'}/>
    {{
      [ViewModes.VIEW_2D]: <UiMain2d/>,
      [ViewModes.VIEW_3D]: <UiMain3dLight/>,
      [ViewModes.VIEW_3D_LIGHT]: <UiMain3dLight/>,
    }[context.viewMode]},
    
    {/*<UiSaveMenu/>*/}
    {/*<UiReportMenu/>*/}
    {/*{(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu/> : <p></p>}*/}
  </div>;
}

export default UiApp;
