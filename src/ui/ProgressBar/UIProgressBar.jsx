/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import css from './UIprogressBar.module.css';

const UIProgressBar = () => {
  const { progress, titleProgressBar } = useSelector((state) => state);
  const progressWidth = `${progress < 1 ? progress * 100 : progress}%`;

  return (
    <>
      <div className={css.progress}>
        <span className={css.label}>{titleProgressBar}</span>
        <div
          className={css.progressBar}
          style={{ width: `${progressWidth}` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="1"
        />
      </div>
    </>
  );
};

export default React.memo(UIProgressBar);
