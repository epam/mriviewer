/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useContext, useState } from 'react';

const ToolbarContext = React.createContext(null);
export const ToolbarContextProvider = ({ children }) => {
  const [activeTool, setActiveTool] = useState(null);
  const value = { activeTool, setActiveTool };
  return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};

export const useToolbarContext = () => {
  const context = useContext(ToolbarContext);
  const contextName = 'ToolbarContext';

  if (!context) {
    throw new Error(`Used outside of "${contextName}"`);
  }

  return context;
};
