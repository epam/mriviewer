/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import UiApp from './ui/UiApp';

import { Context, initialContext } from "./context/Context";

const App = () => {
  const [context, setContext] = useState({ ...initialContext })
  
  return <Context.Provider value={{ context, setContext }}>
    <UiApp/>
  </Context.Provider>
};

export default App;
