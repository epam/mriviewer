/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

import css from './UIprogressBar.module.css';
import { connect } from 'react-redux';
import StoreActionType from '../../store/ActionTypes';

const UIProgressBar = (props) => {
  useEffect(() => {
    props.dispatch({ type: StoreActionType.SET_PROGRESS, payload: { progress: props.progress, titleProgressBar: 'Initialazing' } });
  }, [props.progress]);

  console.log(`Progress ${props.progress}`);
  return (
    <>
      <div className={css.progress}>
        <span className={css.label}>{props.titleProgressBar}</span>
        <div
          className={css.progressBar}
          style={{ width: `${props.progress < 1 ? props.progress * 100 : props.progress}%` }}
          role="progressbar"
          aria-valuenow={props.progress}
          aria-valuemin="0"
          aria-valuemax="1"
        />
      </div>
    </>
  );
};

export default connect((store) => store)(UIProgressBar);
