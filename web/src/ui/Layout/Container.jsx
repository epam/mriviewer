/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cx from 'classnames';

import css from './Container.module.css';

export const Container = ({ children, direction }) => {
  const alignStyle = direction === 'vertical' ? css.vertical : css.horizontal;
  return <div className={cx(css.container, alignStyle)}>{children}</div>;
};
