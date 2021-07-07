/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./ModalBase";
import { UIButton } from "../Button/Button"
import css from "./Modals.module.css";

class UiModalText extends React.Component {
  constructor(props) {
    super(props);
    this.onButtonOk = this.onButtonOk.bind(this);
    this.onTexChange = this.onTexChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    // this.onSaveNifti = this.onSaveNifti.bind(this);
    
    this.m_showFunc = null;
    this.m_hideFunc = null;
    
    this.state = {
      text: ''
    };
  } // end constr
  
  onTextEntered() {
    const store = this.props;
    const gra = store.graphics2d;
    const toolText = gra.m_toolText;
    toolText.setText(this.state.text);
    this.setState({ text: '' });
  }
  
  /**
   * When user press OK button
   */
  onButtonOk() {
    // console.log('on button ok');
    this.m_hideFunc();
    this.onTextEntered();
  }
  
  handleFormSubmit(evt) {
    evt.preventDefault();
    this.m_hideFunc();
    this.onTextEntered();
  }
  
  onTexChange(evt) {
    const strText = evt.target.value;
    // console.log(`onTexChange. text = ${strText}`);
    this.setState({ text: strText });
  }
  
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    const onShowFunc = this.props.onShow;
    this.m_hideFunc = onHideFunc;
    this.m_showFunc = onShowFunc;
    // console.log(`UiModalText. setup funcs: ${this.m_showFunc}, ${this.m_hideFunc}`);
    
    return <Modal isOpen={stateVis} close={onHideFunc}>
      <ModalHeader title="Input text" close={ onHideFunc } />
      <ModalBody>
        <input required type="text" placeholder="" style={{ width: "70%" }}
               className={css.input}
               value={this.state.text} onChange={this.onTexChange} autoFocus={true}/>
      </ModalBody>
      <ModalFooter>
        <UIButton handler={onHideFunc} caption="Cancel"/>
        <UIButton handler={this.handleFormSubmit} caption="Apply"/>
      </ModalFooter>
    </Modal>
  }
}

export default connect(store => store)(UiModalText);
