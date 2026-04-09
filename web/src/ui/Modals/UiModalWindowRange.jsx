/*
 * Copyright 2023 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ModalHeader, ModalBody } from './ModalBase';
import { Nouislider } from '../Nouislider/Nouislider';
import { LARGE_NUMBER } from '../Constants/WindowSet.constants';

const UiModalWindowRange = ({ close, onChange, connect, title, m_dataMin, m_dataMax, windowMin, windowMax, className, step }) => {
  let valMin = 0;
  let valMax = 5000;
  let valDelta = valMax - valMin;
  let valStep = 50;
  if (m_dataMin !== LARGE_NUMBER) {
    valMin = m_dataMin;
    valMax = m_dataMax;
    valDelta = valMax - valMin;
    valStep = step ? step : Math.floor(valDelta / 32);
  }

  const rangeTwo = {
    min: step ? 0 : Math.floor(valMin - valDelta / 4),
    max: step ? 1 : Math.floor(valMax + valDelta / 4),
  };
  const wMin = step ? windowMin : Math.floor(windowMin);
  const wMax = step ? windowMax : Math.floor(windowMax);
  const wArr = [wMin, wMax];

  return (
    <div className={className}>
      <ModalHeader title={title} close={close} />
      <ModalBody>
        Window range
        <Nouislider onChange={onChange} range={rangeTwo} value={wArr} step={valStep} connect={connect} />
      </ModalBody>
    </div>
  );
};

export default UiModalWindowRange;
