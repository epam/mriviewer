/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import { createStore } from 'redux';

import rootReducer from './store/Store';

import App from './App';

import './index.css';
import './nouislider-custom.css';

const rootElement = document.getElementById('root');

const store = createStore(rootReducer);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootElement
);
