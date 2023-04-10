/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ModalBase';
import { UIButton } from '../Button/Button';

import css from './Modals.module.css';
import buttonCss from '../Button/Button.module.css';

export const ModalUrl = (props) => {
  const { stateVis, onHide, loadUrl } = props;
  const inputRef = useRef();

  return (
    <Modal isOpen={stateVis} close={onHide}>
      <ModalHeader title="Load data from external source via URL" close={onHide} />
      <ModalBody>
        <div className={css.row}>
          <label htmlFor="input-url" className={css.label}>
            Please provide direct URL to the file.
            <br />
            <br />
            NOTE: For current release we support only extension-ended URLs. Example: "https://some.domain.com/file.dicom".
          </label>
          <input id="input-url" ref={inputRef} placeholder="Enter URL" className={css.input} />
          {/* TODO: add validation for Url */}
        </div>
      </ModalBody>
      <ModalFooter>
        <UIButton caption="Submit" cx={buttonCss.apply} handler={() => loadUrl(inputRef.current.value)} />
      </ModalFooter>
    </Modal>
  );
};

export default ModalUrl;
