/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from "react-redux";

import packageJson from '../../package.json';
import UiSkelAni from './UiSkelAni';
import { UIButton } from "./Button/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modals/ModalBase";

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
    
    return <>
      <UIButton
        cx={ css.logo }
        icon="logo"
        caption="See detailed information about this app"
        handler={this.onShow}/>
      {this.state.modalShow && (
      <Modal isOpen={this.state.modalShow} close={this.onHide}>
        <ModalHeader title={strName} />
        <ModalBody>
          <center>
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
          </center>
        </ModalBody>
        <ModalFooter>
          <UIButton handler={this.onHide} caption="Ok" type="submit" mode="accent"/>
        </ModalFooter>
      </Modal>
      )}
    </>;
  }
}

export default connect(store => store)(UiLogoAbout);
