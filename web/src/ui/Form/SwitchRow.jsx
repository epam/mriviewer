/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cx from 'classnames';

import styles from './index.module.css';
import css from './SwitchRow.module.css';

export const SwitchRow = ({ children }) => {
  return <div className={cx(styles.container, css.row)}>{children}</div>;
};
