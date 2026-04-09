/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Switch, SwitchRow } from '../../Form';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

export function AmbientOcclusionProperty() {
  const [ambient, setAmbient] = useState(false);
  const { volumeRenderer, isoThresholdValue } = useSelector((state) => state);

  const onChange = (value) => {
    if (value) {
      volumeRenderer.setAmbientTextureMode(isoThresholdValue);
    } else {
      volumeRenderer.offAmbientTextureMode();
    }
    setAmbient(value);
  };
  return (
    <>
      <SwitchRow>
        Ambient Occlusion
        <Switch value={ambient} onValueChange={onChange} />
      </SwitchRow>
    </>
  );
}
