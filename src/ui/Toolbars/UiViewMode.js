/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import StoreActionType from '../../store/ActionTypes';
import { UIButton } from '../Button/Button';
import { Container } from './Container';
import ViewMode from '../../store/ViewMode';
import { Tooltip } from '../Tooltip/Tooltip';

class UiViewMode extends React.Component {
  constructor(props) {
    super(props);

    // main view configuration
    // setup true, where you want to see mode renderer
    //
    this.m_needModeMpr = true;
    this.m_needMode2d = true;
    this.m_needMode3dLight = true;
    this.m_needMode3d = true;

    this.onModeMpr = this.onModeMpr.bind(this);
    this.onMode2d = this.onMode2d.bind(this);
    this.onMode3dLight = this.onMode3dLight.bind(this);
    this.onMode3d = this.onMode3d.bind(this);
    this.onTool3d = this.onTool3d.bind(this);
    this.onView3d = this.onView3d.bind(this);
  }

  onMode(indexMode) {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: indexMode });
  }

  onTool_View(isOn) {
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_IS_TOOL3D, isTool3D: isOn });
    store.dispatch({ type: StoreActionType.SET_SLIDER_Contrast3D, sliderContrast3D: 0 });
  }

  onModeMpr() {
    this.onMode(ViewMode.VIEW_MPR);
  }

  onMode2d() {
    this.onMode(ViewMode.VIEW_2D);
  }

  onMode3dLight() {
    this.onMode(ViewMode.VIEW_3D_LIGHT);
  }

  onMode3d() {
    this.onMode(ViewMode.VIEW_3D);
  }

  onTool3d() {
    this.onTool_View(true);
  }

  onView3d() {
    this.onTool_View(false);
  }

  logObject(strTitle, obj) {
    let str = '';
    for (let prp in obj) {
      if (str.length > 0) {
        str += '\n';
      }
      str += prp + ' = ' + obj[prp];
    }
    console.log(`${strTitle}\n${str}`);
  }

  render() {
    const store = this.props;
    // this.logObject('UiViewMode this props: ', store);
    let viewMode = store.viewMode;
    let isTool3D = store.isTool3D;
    if (viewMode === ViewMode.VIEW_MPR && !this.m_needModeMpr) {
      viewMode = ViewMode.VIEW_2D;
    }
    if (viewMode === ViewMode.VIEW_3D_LIGHT && !this.m_needMode3dLight) {
      viewMode = ViewMode.VIEW_2D;
    }
    if (viewMode === ViewMode.VIEW_3D && !this.m_needMode3d) {
      viewMode = ViewMode.VIEW_2D;
    }
    if (viewMode === ViewMode.VIEW_2D && !this.m_needMode2d) {
      viewMode = ViewMode.VIEW_3D;
    }

    // const strMpr = (viewMode === ViewMode.VIEW_MPR) ? 'primary' : 'secondary';
    const str2d = viewMode === ViewMode.VIEW_2D;
    const str3dLight = viewMode === ViewMode.VIEW_3D_LIGHT;
    const str3d = viewMode === ViewMode.VIEW_3D;

    const strTool3Don = viewMode === ViewMode.VIEW_3D_LIGHT && isTool3D === true;
    const strTool3Doff = viewMode === ViewMode.VIEW_3D_LIGHT && isTool3D === false;

    const jsx3d = (
      <Tooltip content="Show volume in 3d mode with old rendering" placement="left">
        <UIButton handler={this.onMode3d} active={str3d} icon="3D" />
      </Tooltip>
    );

    const jsxViewTool = (
      <Container direction="vertical">
        <Tooltip content="Show volume in 3d mode with simple toolset" placement="left">
          <UIButton handler={this.onView3d} active={strTool3Doff} icon="V" />
        </Tooltip>
        <Tooltip content="Show volume in 2d mode per slice on selected orientation" placement="left">
          <UIButton handler={this.onTool3d} active={strTool3Don} icon="T" />
        </Tooltip>
      </Container>
    );

    const FOUR = 4;
    let needShow3d = false;

    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() > 0) {
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);
      if (vol !== null) {
        if (vol.m_bytesPerVoxel !== FOUR) {
          needShow3d = true;
        }
      }
    } // if more 0 volumes
    const test = true;

    return (
      <>
        <Container direction="vertical">
          <Tooltip content="Show volume in 2d mode per slice on selected orientation" placement="left">
            <UIButton handler={this.onMode2d} active={str2d} icon="2D" />
          </Tooltip>
          <Tooltip content="Show volume in 3d mode with fast rendering" placement="left">
            <UIButton handler={this.onMode3dLight} active={str3dLight} icon="lightning" />
          </Tooltip>
          {needShow3d ? jsx3d : ''}
        </Container>
        {viewMode === ViewMode.VIEW_3D_LIGHT && test ? jsxViewTool : ''}
      </>
    );
  }
}

export default connect((store) => store)(UiViewMode);
