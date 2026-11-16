/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { Container } from '../Layout/Container';
import { LungsTool } from './Filter/LungsTool';
import { DetectBrainTool } from './Filter/DetectBrainTool';
import { ToolbarContextProvider } from './ToolbarContext';
import { SobelTool } from './Filter/SobelTool';
import { BilateralTool } from './Filter/BilateralTool';

export const FilterTools = () => {
  return (
    <ToolbarContextProvider>
      <Container direction="horizontal">
        <LungsTool />
        <DetectBrainTool />
        <SobelTool />
        <BilateralTool />
      </Container>
    </ToolbarContextProvider>
  );
};
