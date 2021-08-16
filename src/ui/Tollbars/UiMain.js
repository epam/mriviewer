/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import UiMainMpr from '../UiMainMpr';
import UiMain2d from '../UiMain2d';
import UiMain3dLight from '../UiMain3dLight';

import ViewMode from '../../store/ViewMode';

class UiMain extends React.Component {
  render() {
    const store = this.props;
    const viewModeIndex = store.viewMode;

    const jsxArray = new Array(ViewMode.VIEW_COUNT);
    jsxArray[ViewMode.VIEW_MPR] = <UiMainMpr/>;
    jsxArray[ViewMode.VIEW_2D] =  <UiMain2d/>;
    jsxArray[ViewMode.VIEW_3D_LIGHT] = <UiMain3dLight/> ;
    jsxArray[ViewMode.VIEW_3D] = <UiMain3dLight/>;
    return jsxArray[viewModeIndex];
  };
}

export default connect(store => store)(UiMain);
