/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import css from '../UiApp.module.css';
import UiAbout from '../UiAbout';
import UiOpenMenu from '../OpenFile/UiOpenMenu';

export function Header({ fileNameOnLoad }) {
  return (
    <div className={css.header}>
      <UiAbout />
      <UiOpenMenu fileNameOnLoad={fileNameOnLoad} />
    </div>
  );
}
