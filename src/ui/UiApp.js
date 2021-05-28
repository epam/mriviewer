/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect } from 'react';

import { ReactComponent as Logo } from './icons/logo.svg'

import { Context } from "../context/Context";
import { validateBrowser } from "../utils";

import UIProgressBar from "./ProgressBar/UIProgressBar";
import { UiOpenMenu } from "./OpenFile/UiOpenMenu";
// import UiMain3dLight from "./UiMain3dLight";

import Graphics2d from "../demo/engine/Graphics2d";

import { ButtonsDemo } from "./Button/ButtonsDemo";

import css from "./UiApp.module.css";


export const UiApp = () => {
  const { context, setContext } = useContext(Context);

  useEffect(() => {
      const alert = validateBrowser();
      if (alert) {
          setContext(prev => ({ ...prev, ...alert }))
      }
  }, []);


  return (
      <>
        <UIProgressBar />
        <div className={ css["header"] }>
          <Logo/>
          <UiOpenMenu />
        </div>
           <ButtonsDemo />
        {{
          '2D': <Graphics2d/>,
          // [ViewModes.VIEW_3D]: <UiMain3dLight/>,
          // [ViewModes.VIEW_3D_LIGHT]: <UiMain3dLight/>,
        }[context.viewMode]}
      </>
  )
}
