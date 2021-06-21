/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import UiApp from './ui/UiApp';

class App extends React.Component {
  render() {
    return <UiApp/>
  }
}

export default connect(store => store)(App);
