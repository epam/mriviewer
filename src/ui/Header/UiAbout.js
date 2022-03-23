/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import packageJson from '../../../package.json';
import UiSkelAni from '../UiSkelAni';
import { UIButton } from '../Button/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../Modals/ModalBase';
import { useSelector } from 'react-redux';

import css from './UiAbout.module.css';

export const UiAbout = () => {
  const [modalShow, setModalShow] = useState(false);
  const strVer = packageJson.version;
  const strName = packageJson.name;
  const strDescription = packageJson.description;
  const strAuthor = packageJson.author;
  const strYear = packageJson.year;
  const { graphics2d } = useSelector((state) => state);

  const onShow = () => {
    graphics2d?.clear();
    setModalShow(true);
  };

  const onHide = () => {
    setModalShow(false);
  };

  return (
    <>
      <UIButton cx={css.logo} icon="logo" caption="See detailed information about this app" handler={onShow} />
      {modalShow && (
        <Modal isOpen={modalShow} close={onHide}>
          <ModalHeader title={strName} />
          <ModalBody>
            <center>
              <UiSkelAni />
              <p>{strDescription}</p>
              <p>
                <b>Version: </b> {strVer}
              </p>
              <p>
                <b>Copyright: </b> {strYear} {strAuthor}
              </p>
            </center>
          </ModalBody>
          <ModalFooter>
            <UIButton handler={onHide} caption="Ok" type="submit" mode="accent" />
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
