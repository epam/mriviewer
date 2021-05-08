/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

// Global imports
import React from 'react';
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom';
import { createStore } from 'redux';

// local imports
import App from './App';
import rootReducer from './store/Store';

// tests
describe('AppTests', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    const store = createStore(rootReducer);
    ReactDOM.render(<Provider store={store}>
      <App />
    </Provider>, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
