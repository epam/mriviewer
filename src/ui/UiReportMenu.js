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

import Screenshot from '../engine/utils/Screenshot';
import ViewMode from '../store/ViewMode';
import { Tooltip } from './Tooltip/Tooltip';
import { UIButton } from "./Button/Button";
import UiModalInfo from "./Modals/ModalInfo";

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
    const viewMode = store.viewMode;
    if (viewMode === ViewMode.VIEW_2D) {
      const gra2d = store.graphics2d;
      Screenshot.makeScreenshot(gra2d, SHOT_W, SHOT_H);
    } else if ((viewMode === ViewMode.VIEW_3D) || (viewMode === ViewMode.VIEW_3D_LIGHT)) {
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
            <Tooltip content="Show tags">
              <UIButton icon="report" rounded mode="light" disabled={strDisabled}
                          handler={this.onModalDicomTagsShow}/>
            </Tooltip>
          <Tooltip content="Screenshot">
          <UIButton icon="camera" rounded mode="light" disabled={strDisabled}
                          handler={this.onModalScreenshot}/>
          </Tooltip>

      { this.state.showModalDicomTags && (
          <UiModalInfo
              stateVis={this.state.showModalDicomTags}
              onHide={this.onModalDicomTagsHide}
          />
      ) }
    </>;
  }
}

export default connect(store => store)(UiReportMenu);
