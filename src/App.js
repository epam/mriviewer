/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import UiApp from './ui/UiApp';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

const App = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <UiApp />
    </DndProvider>
  );
};

export default App;
