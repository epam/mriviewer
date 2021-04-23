/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import UiMain2d from './UiMain2d';
import UiMain3dLight from './UiMain3dLight';

import ModeView from '../store/ModeView';

class UiMain extends React.Component {
  render() {
    const store = this.props;
    const modeViewIndex = store.modeView;
    const jsxMain2d = <UiMain2d/>;
    const jsxMain3dLight = <UiMain3dLight/>;

    const jsxArray = new Array(ModeView.VIEW_COUNT);
    jsxArray[ModeView.VIEW_2D] = jsxMain2d;
    jsxArray[ModeView.VIEW_3D_LIGHT] = jsxMain3dLight ;
    jsxArray[ModeView.VIEW_3D] = jsxMain3dLight;
    return jsxArray[modeViewIndex];
  };
}

export default connect(store => store)(UiMain);
