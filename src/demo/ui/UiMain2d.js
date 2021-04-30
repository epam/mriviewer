/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Graphics2d from '../engine/Graphics2d';
import UiVolumeSel from './UiVolumeSel'

export default class UiMain2d extends React.Component {
  numVols = useState({ numVols: 0 }).volumeSet.m_volumes.length;
  
  transferFuncCallback({ m_handleX, m_handleY, m_indexMoved: i }) {
    const x = m_handleX[i];
    const y = m_handleY[i];
    console.log(`moved point[${i}] = ${x}, ${y}  `);
  }

  render() {
    const jsxVolSel = (this.numVols > 1) ? <UiVolumeSel /> : <br />

    return <>
      {jsxVolSel}
      <Graphics2d/>
    </>;
  };
}
