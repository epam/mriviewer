/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiSegm2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

// import StoreActionType from '../store/ActionTypes';
// import Tools2dType from '../engine/tools2d/ToolTypes';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Switch, SwitchRow } from "./Form";

// ********************************************************
// Class
// ********************************************************
class UiSegm2d extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeSegm2d = this.onChangeSegm2d.bind(this);
    this.state = {
      isSegmented: false,
    };
  }

  onChangeSegm2d() {
    // console.log('UiSegm2d. onChangeSegm2d ...');
    this.setState({ isSegmented: !this.state.isSegmented });

    const store = this.props;
    const gra2d = store.graphics2d;
    if (gra2d !== null) {

      gra2d.m_isSegmented = !this.state.isSegmented;
      gra2d.forceUpdate();
      gra2d.forceRender();
      const segm = gra2d.segm2d;
      if ((segm !== null)  && (!this.state.isSegmented)) {
        if (segm.model == null) {
          //console.log('onChangeSegm2d. onLoadModel ...');
          segm.onLoadModel();
        } else {
          //console.log('onChangeSegm2d. start apply image ...');
          //segm.startApplyImage();
        }
      }
    }
  } // end of onChangeSegm2d

  // render UI for 2d segmentation on screen
  render() {
    const strTitle = 'Segmentation 2d (brain only)';
    return <>
      <OverlayTrigger
        key="about"
        placement="bottom"
        overlay={
          <Tooltip>
            You can use automatic 2d image segmentation only for brain-like data
          </Tooltip>
        }
      >
        <SwitchRow>
          { strTitle }
          <Switch value={ this.state.isSegmented } onValueChange={ this.onChangeSegm2d }/>
        </SwitchRow>
      </OverlayTrigger>
      Switch checker above on and see segmentation result on right
    </>;
  }
}

export default connect(store => store)(UiSegm2d);

