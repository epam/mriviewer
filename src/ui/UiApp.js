/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';

import BrowserDetector from '../engine/utils/BrowserDetector';
import { ReactComponent as Logo } from './icons/logo.svg'

import ViewModes from "../store/ViewModes";
import { Context } from "../context/Context";

import UIProgressBar from "./ProgressBar/UIProgressBar";
import { UiOpenMenu } from "./OpenFile/UiOpenMenu";
import UiMain3dLight from "./UiMain3dLight";

import css from "./UiApp.module.css";
import Graphics2d from "../engine/Graphics2d";

function validateBrowser() {
  const { context, setContext } = useContext(Context)
  
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
}

export const UiApp = () => {
  validateBrowser()

  return (
      <>
        <UIProgressBar />
        <div className={ css["header"] }>
          <Logo/>
          <UiOpenMenu />
        </div>

        {{
          [ViewModes.VIEW_2D]: <Graphics2d/>,
          [ViewModes.VIEW_3D]: <UiMain3dLight/>,
          [ViewModes.VIEW_3D_LIGHT]: <UiMain3dLight/>,
        }[context.viewMode]},
      </>
  )
}
