/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

import SaverNifti from '../../engine/savers/SaverNifti';
import { Modal, ModalBody, ModalHeader } from "./ModalBase";
import { UIButton } from "../Button/Button";

class UiModalSaveNifti extends React.Component {
  
  constructor(props) {
    super(props);
    this.onModalShow = this.onModalShow.bind(this);
    this.onModalHide = this.onModalHide.bind(this);
    this.onButtonSave = this.onButtonSave.bind(this);
    this.onTexChange = this.onTexChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.onSaveNifti = this.onSaveNifti.bind(this);
    
    this.m_hideFunc = null;
    
    this.state = {
      showModalSaveNifti: false,
      text: 'dump'
    };
  } // end constr
  
  onButtonSave() {
    // console.log('on button save');
    this.m_hideFunc();
    this.onSaveNifti();
  }
  
  onModalShow() {
    this.setState({ showModalSaveNifti: true });
  }
  
  onModalHide() {
    this.setState({ showModalSaveNifti: false });
  }
  
  handleFormSubmit(evt) {
    evt.preventDefault();
    this.m_hideFunc();
    this.onSaveNifti();
  }
  
  onTexChange(evt) {
    const strText = evt.target.value;
    // console.log(`onTexChange. text = ${strText}`);
    this.setState({ text: strText });
  }
  
  // invoked on save nifti file format
  onSaveNifti() {
    const store = this.props;
    
    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);
    
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const xBox = vol.m_boxSize.x;
    const yBox = vol.m_boxSize.y;
    const zBox = vol.m_boxSize.z;
    const volSize = {
      x: xDim,
      y: yDim,
      z: zDim,
      pixdim1: xBox / xDim,
      pixdim2: yBox / yDim,
      pixdim3: zBox / zDim,
    };
    let volData = vol.m_dataArray;
    const vR = store.volumeRenderer;
    if (vR !== null) {
      volData = vR.volumeUpdater.bufferR;
    }
    ;
    
    const niiArr = SaverNifti.writeBuffer(volData, volSize);
    const textToSaveAsBlob = new Blob([niiArr], { type: 'application/octet-stream' });
    const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    let fileName = this.state.text;
    const goodSuffix = fileName.endsWith('.nii');
    if (!goodSuffix) {
      fileName = fileName.concat('.nii');
    }
    // console.log(`Save to file ${fileName}`);
    
    const downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.innerHTML = 'Download File';
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = event => document.body.removeChild(event.target);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
  } // end on save nifti
  
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    this.m_hideFunc = onHideFunc;
    return <Modal show={stateVis} onHide={onHideFunc}>
      <ModalBody>
        <ModalHeader title="Save to Nifty"/>
        <input required
               type="text"
               placeholder="Enter file name here"
               value={this.state.text} onChange={this.onTexChange}
               onKeyUp={() => (evt) => {
                 this.handleFormSubmit(evt)
               }}
        />
          .nii
        <UIButton handler={this.onButtonSave} caption="Save"/>
        <UIButton handler={onHideFunc} caption="Cancel"/>
      </ModalBody>
    </Modal>;
  }
}

export default connect(store => store)(UiModalSaveNifti);
