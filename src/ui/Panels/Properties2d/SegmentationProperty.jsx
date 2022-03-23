/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { Switch, SwitchRow } from '../../Form';

export const SegmentationProperty = () => {
  const [isSegmented, setSegmented] = useState(false);
  const { graphics2d } = useSelector((state) => state);

  const toggleSegmentation = () => {
    const value = !isSegmented;
    setSegmented(value);

    if (graphics2d !== null) {
      graphics2d.m_isSegmented = value;
      graphics2d.forceUpdate();
      graphics2d.forceRender();

      const { segm2d } = graphics2d;
      if (segm2d !== null && value) {
        if (segm2d.model == null) {
          segm2d.onLoadModel();
        }
      }
    }
  };

  return (
    <>
      You can use automatic 2d image segmentation only for brain-like data
      <SwitchRow>
        Segmentation 2d (brain only)
        <Switch value={isSegmented} onValueChange={toggleSegmentation} />
      </SwitchRow>
      Switch checker above on and see segmentation result on right
    </>
  );
};
