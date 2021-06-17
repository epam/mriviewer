/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiMainMpr
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMainMpr some text later...
 */
class UiMainMpr extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const jsxRet = <p>MPR is not implemented yet</p>;
    return jsxRet;
  };
}

export default connect(store => store)(UiMainMpr);
