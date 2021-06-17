/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import Modes2d from '../store/Modes2d';
import StoreActionType from '../store/ActionTypes';
import { UIButton } from "./Button/Button";
import { Container } from "./Tollbars/Container";

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
    store.dispatch({ type: StoreActionType.SET_2D_X_POS, render2dxPos: 0.0 });
    store.dispatch({ type: StoreActionType.SET_2D_Y_POS, render2dyPos: 0.0 });

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

    const varSag = mode2d === Modes2d.SAGGITAL
    const varCor = mode2d === Modes2d.CORONAL
    const varTra = mode2d === Modes2d.TRANSVERSE
    
    const jsxSliceSelector =
      <>
        <Container direction="vertical">
          <OverlayTrigger key="zx" placement="bottom" overlay={
            <Tooltip>
              Show slices along x axis
            </Tooltip>
          }>
            <UIButton handler={this.onModeSaggital} active={varSag} icon="saggital" />
          </OverlayTrigger>

          <OverlayTrigger key="zy" placement="bottom" overlay={
            <Tooltip>
              Show slices along y axis
            </Tooltip>
          }>
            <UIButton handler={this.onModeCoronal} active={varCor} icon="coronal" />
          </OverlayTrigger>

          <OverlayTrigger key="za" placement="bottom" overlay={
            <Tooltip>
              Show slices along z axis
            </Tooltip>
          }>
            <UIButton handler={this.onModeTransverse} active={varTra} icon="transverse" />
          </OverlayTrigger>
        </Container>
      </>

    return <>
      {jsxSliceSelector}
    </>;
  }
}

export default connect(store => store)(UiCtrl2d);
