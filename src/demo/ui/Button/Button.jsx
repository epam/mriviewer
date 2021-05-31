/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import cx from "classnames";

import { SVG } from "./SVG";

import css from "./Button.module.css";


export const UIButton = ({ icon, caption, handler, active, rounded, type = "button", mode }) => {
    const modeStyle = (mode === "light" && css.light) ||  (mode === "accent" && css.accent)
    return (
        <button
            type={type}
            className={ cx(css.button, active && css.active, rounded && css.rounded, modeStyle) }
            onClick={ handler }
            caption={ icon && caption }
        >
            { icon ? <SVG name={ icon } title={ caption }/> : caption }
        </button>
    )
}

export const buttonsBuilder = (buttons, options = { activeButton: null }) =>
    buttons.map(button => <UIButton {...button} key={ button.icon || button.caption } active={ button.icon === options.activeButton }/>);
