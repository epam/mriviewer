/*
 * Copyright 2023 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Modal, ModalBody, ModalFooter } from './ModalBase';
import { UIButton } from '../Button/Button';

import { applyWindowRangeData } from '../../engine/utils/SettingsGraphics2d';
import StoreActionType from '../../store/ActionTypes';
import css from './Modals.module.css';
import { MriEvents } from '../../engine/lib/enums';
import MriViwer from '../../engine/lib/MRIViewer';

const UiModalConfirmation = () => {
  const dispatch = useDispatch();
  const store = useSelector((state) => state);

  const onButtonClickYes = (e) => {
    e.preventDefault();
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_CONFIRMATION, showModalConfirmation: false });
    dispatch({ type: StoreActionType.SET_SHOW_WINDOW_RANGE, showWindowRangeSlider: true });
    dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_SELECT_FILES, showModalSelectFiles: false });
    applyWindowRangeData(store, 0, 1);
    MriViwer.events.emit(MriEvents.VOLUME_PARAMETERS_SET_SUCCESS);
  };

  const onButtonClickNo = (e) => {
    e.preventDefault();
    dispatch({ type: StoreActionType.SET_IS_16_BIT, is16bit: false });
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_WINDOW_WC, showModalWindowCW: true });
    dispatch({ type: StoreActionType.SET_SHOW_MODAL_CONFIRMATION, showModalConfirmation: false });
  };

  return (
    <Modal cx={{ className: css.confirmation }} isOpen={true}>
      <ModalBody>
        <p>16-bit images can hold more colors per channel than 8-bit, which gives better image quality.</p>
        <p>At the same time it uses more computer resources.</p>
        <p>Do you want to activate 16-bit rendering for uploaded files?</p>
      </ModalBody>
      <ModalFooter>
        <UIButton handler={onButtonClickYes} caption="Yes" />
        <UIButton handler={onButtonClickNo} caption="No" />
      </ModalFooter>
    </Modal>
  );
};

export default UiModalConfirmation;
