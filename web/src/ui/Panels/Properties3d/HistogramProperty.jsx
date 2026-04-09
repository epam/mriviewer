/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useSelector } from 'react-redux';
import UiHistogram from '../../Histogram/UiHistogram';

export function HistogramProperty() {
  const { volumeSet, volumeIndex, volumeRenderer } = useSelector((state) => state);

  const volume = volumeSet.getVolume(volumeIndex);

  const transfer = (value) => {
    const { m_handleX, m_handleY } = value;
    // console.log(`moved point[${m_indexMoved}] = ${m_handleX[i]}, ${m_handleY[i]}  `);
    volumeRenderer.updateTransferFuncTexture(m_handleX, m_handleY);
  };

  return <UiHistogram volume={volume} transfFunc={transfer} transfFuncUpdate={volumeRenderer} />;
}
