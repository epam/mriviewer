/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from "react";

import { Context } from "../../context/Context";

import css from "./UIprogressBar.module.css";

const UIProgressBar = () => {
    const { context: { progress: { show, text, value } } } = useContext(Context);

    return show && (
        <>
            <div className={ css.progress }>
                <div
                    className={ css.progressBar }
                    style={ { width: `${value}%` } }
                    role="progressbar"
                    aria-valuenow={ value }
                    aria-valuemin="0"
                    aria-valuemax="100"
                />
            </div>
            <span className={ css.label }>{text}</span>
        </>
    );
};

export default UIProgressBar;
