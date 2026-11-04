/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';

import './index.css';
import './nouislider-custom.css';

const rootElement = document.getElementById('root');

createRoot(rootElement).render(
  <Provider store={store}>
    <App />
  </Provider>
);
