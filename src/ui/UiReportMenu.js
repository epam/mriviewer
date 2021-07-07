/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiReportMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import UiModalDicomTags from './Modals/UiModalDicomTags';
import Screenshot from '../engine/utils/Screenshot';
import ModeView from '../store/ModeView';
import { UIButton } from "./Button/Button";

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiReportMenu some text later...
 */
class UiReportMenu extends React.Component {
  // constructor
  constructor(props) {
    super(props);

    this.onModalDicomTagsShow = this.onModalDicomTagsShow.bind(this);
    this.onModalDicomTagsHide = this.onModalDicomTagsHide.bind(this);
    this.onModalScreenshot = this.onModalScreenshot.bind(this);

    this.state = {
      showModalDicomTags: false,
    };
  }

  onModalDicomTagsShow() {
    this.setState({ showModalDicomTags: true });
  }

  onModalDicomTagsHide() {
    this.setState({ showModalDicomTags: false });
  }

  onModalScreenshot() {
    const SHOT_W = 800;
    const SHOT_H = 600;

    const store = this.props;
    const modeView = store.modeView;
    if (modeView === ModeView.VIEW_2D) {
      const gra2d = store.graphics2d;
      Screenshot.makeScreenshot(gra2d, SHOT_W, SHOT_H);
    } else if ((modeView === ModeView.VIEW_3D) || (modeView === ModeView.VIEW_3D_LIGHT)) {
      const volRender = store.volumeRenderer;
      Screenshot.makeScreenshot(volRender, SHOT_W, SHOT_H);
    } else {
      console.log('onModalScreenshot. not implemented yet');
    }
  }

  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;

    const strDisabled = (!isLoaded);
    return <>
      <UIButton caption="Show tags" icon="report" rounded mode="light" disabled={strDisabled}
                handler={this.onModalDicomTagsShow}/>
      <UIButton caption="Screenshot" icon="camera" rounded mode="light" disabled={strDisabled}
                handler={this.onModalScreenshot}/>

      <UiModalDicomTags stateVis={this.state.showModalDicomTags}
                        onHide={this.onModalDicomTagsHide}/>

    </>;
  }
}

export default connect(store => store)(UiReportMenu);
