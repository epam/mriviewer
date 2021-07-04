/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';

import packageJson from '../../../package.json';
import UiSkelAni from './UiSkelAni';
import { UIButton } from "./Button/Button";
import { connect } from "react-redux";

import css from "./UiAbout.module.css";

class UiLogoAbout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalShow: false
    };
    this.onShow = this.onShow.bind(this);
    this.onHide = this.onHide.bind(this);
  }

  onShow() {
    this.props.graphics2d?.clear()
    this.setState({ modalShow: true });
  }

  onHide() {
    this.setState({ modalShow: false });
  }

  render() {

    const strVer = packageJson.version;
    const strName = packageJson.name;
    const strDescription = packageJson.description;
    const strAuthor = packageJson.author;
    const strYear = packageJson.year;

    const strButtonOnly = <UIButton
      icon="logo"
      cx={ css.logo }
      handler={this.state.modalShow ? this.onHide : this.onShow} />
    const strButtonWithTrigger =
    <OverlayTrigger
      key="about"
      placement="bottom"
      overlay = {
        <Tooltip>
          See detailed information about this app
        </Tooltip>
      }
    >
      {strButtonOnly}
    </OverlayTrigger>;

    const strBtnDynamic = (this.state.modalShow) ? strButtonOnly : strButtonWithTrigger;


    return <>

      {strBtnDynamic}

      <Modal show={this.state.modalShow} onHide={this.onHide}>
        <Modal.Title>
          <center>{strName}</center>
        </Modal.Title>
        <Modal.Header>
          <Modal.Body className="text-center">
            <UiSkelAni/>
            <p>
              {strDescription}
            </p>
            <p>
              <b>Version: </b> {strVer}
            </p>
            <p>
              <b>Copyright: </b> {strYear} {strAuthor}
            </p>

          </Modal.Body>
        </Modal.Header>

        <Modal.Footer>
          <UIButton handler={this.onHide} icon="triangle" type="submit" mode="accent" />
        </Modal.Footer>

      </Modal>
    </>;

  }
}

export default connect(store => store)(UiLogoAbout);
