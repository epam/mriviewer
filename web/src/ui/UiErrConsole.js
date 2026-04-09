/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiErrConsole
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

class UiErrConsole extends React.Component {
  render() {
    return (
      <>
        Errors during read
        {this.props.arrErrors.map((d) => (
          <>{d}</>
        ))}
      </>
    );
  }
}
export default connect((store) => store)(UiErrConsole);
