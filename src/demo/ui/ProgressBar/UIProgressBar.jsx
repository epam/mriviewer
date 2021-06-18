/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import css from "./UIprogressBar.module.css";
import { connect } from "react-redux";

const UIProgressBar = (props) => {
  // console.log(`Progress ${props.progress}`);
  return props.progress &&
    (
      <>
        <div className={css.progress}>
          <div
            className={css.progressBar}
            style={{ width: `${props.progress < 1 ? props.progress * 100 : props.progress}%` }}
            role="progressbar"
            aria-valuenow={props.progress}
            aria-valuemin="0"
            aria-valuemax="1"
          />
        </div>
        {/*<span className={ css.label }>{text}</span>*/}
      </>
    );
};

export default connect(store => store)(UIProgressBar);
