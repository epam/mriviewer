/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import css from './Switch.module.css';

export const Switch = ({ value, onValueChange }) => {
  return (
    <label className={css.switch}>
      <input type="checkbox" className={css.checkbox} checked={value} onChange={() => onValueChange(!value)} />
      <span className={css.toggle} />
    </label>
  );
};
