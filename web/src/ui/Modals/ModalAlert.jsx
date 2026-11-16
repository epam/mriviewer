/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ModalBase';
import { UIButton } from '../Button/Button';

import css from './Modals.module.css';

export const ModalAlert = (props) => {
  const { onHide, stateVis, title, text } = props;

  return (
    <Modal isOpen={stateVis} close={onHide}>
      <ModalHeader title={title} close={onHide} />
      <ModalBody>
        <p className={css.text}>{text}</p>
      </ModalBody>
      <ModalFooter>
        <UIButton caption="Ok" cx={css.button} handler={onHide} />
      </ModalFooter>
    </Modal>
  );
};

export default ModalAlert;
