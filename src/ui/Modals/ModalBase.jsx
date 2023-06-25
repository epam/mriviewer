/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactModal from 'react-modal';
import { SVG } from '../Button/SVG';
import { ButtonContainer } from '../Button/Button';

import css from './Modals.module.css';

ReactModal.setAppElement('#root');

export const Modal = ({ isOpen, close, children, customStyles = {} }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      parentSelector={() => document.querySelector('#root')}
      style={customStyles}
      className={css.modal}
      overlayClassName={css.overlay}
      onRequestClose={close}
    >
      {children}
    </ReactModal>
  );
};

export const ModalHeader = ({ title, close }) => {
  return (
    <div className={css.header}>
      <h5 className={css.title}>{title}</h5>
      {close && <CloseButton onClick={close} />}
    </div>
  );
};

export const CloseButton = ({ onClick }) => (
  <ButtonContainer onClick={onClick} cx={css.close}>
    <SVG name="clear" title="close" />
  </ButtonContainer>
);

export const ModalBody = ({ children }) => {
  return <div className={css.body}>{children}</div>;
};

export const ModalFooter = ({ children }) => {
  return <div className={css.footer}>{children}</div>;
};
