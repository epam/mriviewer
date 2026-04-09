/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SVG } from '../Button/SVG';

import css from './Slider.module.css';
import styles from './index.module.css';

export const SliderRow = ({ icon, title, children }) => {
  return (
    <div className={styles.container}>
      {icon && (
        <div className={css.icon}>
          <SVG name={icon} size={30} {...(title && { title })} />
        </div>
      )}
      <div className={css.slider}>{children}</div>
    </div>
  );
};
