/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import Modes3d from '../../store/Modes3d';
import StoreActionType from '../../store/ActionTypes';
import UiTF from '../UiTF';
import { UIButton } from '../Button/Button';
import { Container } from '../Toolbars/Container';
import { Tooltip } from '../Tooltip/Tooltip';
import css from '../Form/Slider.module.css';

class UiCtrl3dLight extends React.Component {
  constructor(props) {
    super(props);
    this.onModeA = this.onModeA.bind(this);
    this.onModeB = this.onModeB.bind(this);
    this.onModeC = this.onModeC.bind(this);
    this.onModeD = this.onModeD.bind(this);
    this.onMode = this.onMode.bind(this);
    this.m_updateEnable = true;
  }

  onMode(indexMode) {
    this.m_updateEnable = true;
    this.props.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: indexMode });
    const store = this.props;
    store.volumeRenderer.offAmbientTextureMode();
  }

  onModeA() {
    this.onMode(Modes3d.ISO);
    this.props.volumeRenderer.setEraserMode(false);
  }

  onModeB() {
    this.onMode(Modes3d.RAYCAST);
    this.props.volumeRenderer.setEraserMode(false);
  }

  onModeC() {
    this.onMode(Modes3d.RAYFAST);
    this.props.volumeRenderer.setEraserMode(false);
  }

  onModeD() {
    this.onMode(Modes3d.EREASER);
    this.props.volumeRenderer.setEraserMode(true);
  }

  shouldComponentUpdate() {
    return this.m_updateEnable;
  }

  render() {
    const store = this.props;
    const mode3d = store.mode3d;

    const strA = mode3d === Modes3d.ISO;
    const strB = mode3d === Modes3d.RAYCAST;
    const strC = mode3d === Modes3d.RAYFAST;
    const strD = mode3d === Modes3d.EREASER;

    return (
      <>
        <p className={css.caption}>3D mode selection</p>
        <Container direction="horizontal">
          <Tooltip content="Show just barrier value surface, 1st ray intersection">
            <UIButton active={strA} handler={this.onModeA} icon="I" />
          </Tooltip>
          <Tooltip content="Show complete 3D volumetric rendering">
            <UIButton active={strB} handler={this.onModeB} icon="V" />
          </Tooltip>
          <Tooltip content="Show maximum projection rendering">
            <UIButton active={strC} handler={this.onModeC} icon="M" />
          </Tooltip>
          <Tooltip content="Special volume eraser tool">
            <UIButton active={strD} handler={this.onModeD} icon="E" />
          </Tooltip>
        </Container>
        <UiTF />
      </>
    );
  }
}

export default connect((store) => store)(UiCtrl3dLight);
