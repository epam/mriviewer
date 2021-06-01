/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import css from "./UIprogressBar.module.css";
import { connect } from "react-redux";

const UIProgressBar = () => {
    const { context: { progress: { show, text, value } } } = this.props;

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

export default connect(store => store)(UIProgressBar);
