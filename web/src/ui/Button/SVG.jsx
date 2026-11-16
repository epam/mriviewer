/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const DEFAULT_SIZE = 25;
const DEFAULT_COLOR = '#ffffff';

export const SVG = ({ name, width = DEFAULT_SIZE, height = DEFAULT_SIZE, title, color = DEFAULT_COLOR }) => {
  return (
    <svg fill={color} width={width} height={height} {...(title ? { 'aria-labelledby': 'title' } : { 'aria-hidden': 'true' })}>
      {title && <title>{title}</title>}
      <use xlinkHref={`/sprite.svg#${name}`} />
    </svg>
  );
};
