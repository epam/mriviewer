/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import Modes2d from '../store/Modes2d';
import StoreActionType from '../store/ActionTypes';
import { UIButton } from './Button/Button';
import { Container } from './Toolbars/Container';
import { Tooltip } from './Tooltip/Tooltip';

class UiCtrl2d extends React.Component {
  constructor(props) {
    super(props);
    this.onModeSaggital = this.onModeSaggital.bind(this);
    this.onModeCoronal = this.onModeCoronal.bind(this);
    this.onModeTransverse = this.onModeTransverse.bind(this);
    this.onMode = this.onMode.bind(this);
    this.m_updateEnable = true;
  }

  onMode(indexMode) {
    const store = this.props;
    const gra2d = store.graphics2d;

    this.m_updateEnable = true;
    store.dispatch({ type: StoreActionType.SET_MODE_2D, mode2d: indexMode });
    gra2d.m_mode2d = indexMode;
    gra2d.clear();

    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.0 });

    // build render image
    gra2d.forceUpdate();
    // render just builded image
    gra2d.forceRender();
  }

  onModeSaggital() {
    this.onMode(Modes2d.SAGGITAL);
  }

  onModeCoronal() {
    this.onMode(Modes2d.CORONAL);
  }

  onModeTransverse() {
    this.onMode(Modes2d.TRANSVERSE);
  }

  shouldComponentUpdate() {
    return this.m_updateEnable;
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const mode2d = store.mode2d;

    const varSag = mode2d === Modes2d.SAGGITAL;
    const varCor = mode2d === Modes2d.CORONAL;
    const varTra = mode2d === Modes2d.TRANSVERSE;

    return (
      <>
        <Container direction="vertical">
          <Tooltip content="Show slices along x axis" placement="left">
            <UIButton handler={this.onModeSaggital} active={varSag} icon="saggital" />
          </Tooltip>
          <Tooltip content="Show slices along y axis" placement="left">
            <UIButton handler={this.onModeCoronal} active={varCor} icon="coronal" />
          </Tooltip>
          <Tooltip content="Show slices along z axis" placement="left">
            <UIButton handler={this.onModeTransverse} active={varTra} icon="transverse" />
          </Tooltip>
        </Container>
      </>
    );
  }
}

export default connect((store) => store)(UiCtrl2d);
