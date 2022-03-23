/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createStore } from 'redux';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import rootReducer from '../store/Store';

export function renderWithState(ui, preloadedState) {
  const store = createStore(rootReducer, preloadedState);
  const initialState = store.getState();
  const result = render(<Provider store={store}>{ui}</Provider>);

  return {
    ...result,
    store,
    initialState,
  };
}
