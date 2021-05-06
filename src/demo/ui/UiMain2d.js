/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useContext,
} from 'react';
import Graphics2d from '../engine/Graphics2d';
import UiVolumeSel from "./UiVolumeSel";
import { Context } from "../context/Context";

const UiMain2d = () => {
  const { context } = useContext(Context)
  const numVols = context.volumeSet.m_volumes.length;
  
  // function transferFuncCallback({ m_handleX, m_handleY, m_indexMoved: i }) {
  //   const x = m_handleX[i];
  //   const y = m_handleY[i];
  //   console.log(`moved point[${i}] = ${x}, ${y}  `);
  // }

    return <>
      {(numVols > 1) ? <UiVolumeSel /> : <br />}
      <Graphics2d/>
    </>;
  
}

export default UiMain2d;
