/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

class UiErrConsole extends React.Component {
  render() {
    const store = this.props;
    const arrErr = store.arrErrors;
    return <div>
      Errors during read
      {arrErr.map((d) => {
        const strErr = d;
        return  { strErr };
      })}
    </div>;
  }
}
export default connect(store => store)(UiErrConsole);
