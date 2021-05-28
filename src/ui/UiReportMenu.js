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

import UiModalDicomTags from './UiModalDicomTags';
import Screenshot from '../demo/engine/utils/Screenshot';
import ViewModes from '../store/ViewModes';

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
    if (modeView === ViewModes.VIEW_2D) {
      const gra2d = store.graphics2d;
      Screenshot.makeScreenshot(gra2d, SHOT_W, SHOT_H);
    } else if ((modeView === ViewModes.VIEW_3D) || (modeView === ViewModes.VIEW_3D_LIGHT)) {
      const volRender = store.volumeRenderer;
      Screenshot.makeScreenshot(volRender, SHOT_W, SHOT_H);
    } else {
      console.log('onModalScreenshot. not implemented yet');
    }
  }

  // invoked after render
  componentDidMount() {
  }

  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;

    const strDisabled = (isLoaded) ? false : true;
    const jsxReportMenu = 
      <NavDropdown id="save-nav-dropdown" 
        disabled={strDisabled}
        title={
          <div style={{ display: 'inline-block' }}> 
            <i className="fas fa-book"></i>
            Report
          </div>
        } >
        <NavDropdown.Item onClick={this.onModalDicomTagsShow} >
          <i className="fas fa-clipboard-list"></i>
          Show tags
        </NavDropdown.Item>

        <NavDropdown.Item onClick={this.onModalScreenshot} >
          <i className="fas fa-camera"></i>
          Screenshot
        </NavDropdown.Item>

        <UiModalDicomTags stateVis={this.state.showModalDicomTags}
          onHide={this.onModalDicomTagsHide} />

      </NavDropdown>;    

    return jsxReportMenu;
  }
}

export default connect(store => store)(UiReportMenu);
