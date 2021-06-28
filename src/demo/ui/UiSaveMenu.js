/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview UiSaveMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import UiModalSaveNifti from './Modals/UiModalSaveNifti';
import { UIButton } from "./Button/Button";

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiSaveMenu some text later...
 */
class UiSaveMenu extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    this.onModalSaveNiftiShow = this.onModalSaveNiftiShow.bind(this);
    this.onModalSaveNiftiHide = this.onModalSaveNiftiHide.bind(this);

    this.state = {
      showModalSaveNifti: false,
    };
  }

  // invoked after render
  componentDidMount() {
  }

  onModalSaveNiftiShow() {
    this.setState({ showModalSaveNifti: true });
  }

  onModalSaveNiftiHide() {
    this.setState({ showModalSaveNifti: false });
    // console.log('onModalSaveNiftiHide...');
  }

  //
  // render
  //
  render() {
    return <>
      <UIButton rounded icon="download" handler={evt => this.onModalSaveNiftiShow(evt)} mode={this.props.isLoaded ? "accent" : ""} />
      <UiModalSaveNifti stateVis={this.state.showModalSaveNifti} onHide={this.onModalSaveNiftiHide} />
      </>
  }
}

export default connect(store => store)(UiSaveMenu);


