/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import SaverNifti from '../../engine/savers/SaverNifti';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ModalBase';
import { UIButton } from '../Button/Button';
import buttonCss from '../Button/Button.module.css';
import modalCss from './Modals.module.css';

export function UiModalSaveNifti(props) {
  const { stateVis, onHide } = props;
  const [fileName, setFileName] = useState('dump');
  const { volumeSet, volumeIndex, volumeRenderer } = useSelector((state) => state);
  const onSaveNifti = () => {
    const vol = volumeSet.getVolume(volumeIndex);

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
    const vR = volumeRenderer;
    if (vR !== null) {
      volData = vR.volumeUpdater.bufferR;
    }
    const niiArr = SaverNifti.writeBuffer(volData, volSize);
    const textToSaveAsBlob = new Blob([niiArr], { type: 'application/octet-stream' });
    const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    const isExtensionValid = fileName.trim().endsWith('.nii');
    let fileNameWithExtension = fileName;

    if (!isExtensionValid) {
      fileNameWithExtension = `${fileName}.nii`;
      setFileName(fileNameWithExtension);
    }
    // console.log(`Save to file ${fileName}`);

    const downloadLink = document.createElement('a');
    downloadLink.download = fileNameWithExtension;
    downloadLink.innerHTML = 'Download File';
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = (event) => document.body.removeChild(event.target);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);

    downloadLink.click();
  }; // end on save nifti

  const onTexChange = (evt) => {
    const strText = evt.target.value;
    setFileName(strText);
  };

  const handleFormSubmit = () => {
    evt.preventDefault();
    onSaveNifti();
  };

  return (
    <Modal isOpen={stateVis} onHide={onHide}>
      <ModalHeader title="Save to Nifty" />
      <ModalBody>
        <label className={modalCss.input_label_left}>Enter file name:</label>
        <input
          required
          type="text"
          placeholder="Enter file name here"
          className={modalCss.input}
          value={fileName}
          onChange={onTexChange}
          onKeyUp={(evt) => {
            handleFormSubmit(evt);
          }}
        />
      </ModalBody>
      <ModalFooter>
        <UIButton handler={onSaveNifti} caption="Save" mode={'accent'} cx={buttonCss.apply} />
        <UIButton handler={onHide} caption="Cancel" cx={buttonCss.cancel} />
      </ModalFooter>
    </Modal>
  );
}
