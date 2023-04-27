/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';

import { Modal, ModalHeader, ModalBody } from './ModalBase';
import { ButtonContainer } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';

import { demoData } from './demoData';

import css from './Modals.module.css';

const ModalDemo = (props) => {
  const { stateVis, onHide, onSelectDemo } = props;

  const onDemo = useCallback(
    (id) => {
      onSelectDemo(id);
      onHide();
    },
    [onSelectDemo, onHide]
  );

  return (
    <Modal isOpen={stateVis} close={onHide}>
      <ModalHeader title="Load demo data" close={onHide} />
      <ModalBody>
        <div className={css.cards}>
          {demoData.map((data) => (
            <DemoItem {...data} onClick={() => onDemo(data.id)} key={data.id} />
          ))}
        </div>
      </ModalBody>
    </Modal>
  );
};

const DemoItem = ({ tooltip, image, alt, onClick }) => {
  return (
    <Tooltip content={tooltip}>
      <ButtonContainer onClick={onClick} cx={css.card}>
        <img alt={alt} src={image} />
      </ButtonContainer>
    </Tooltip>
  );
};

export default ModalDemo;
