/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { UIButton } from '../Button/Button';
import { useOnEvent } from '../hooks/useOnEvent';
import { ModalSelectFile } from '../Modals/ModalSelectFile';
import { OpenFromURLComponent, OpenDemoComponent } from '../FileReaders';
import { Tooltip } from '../Tooltip/Tooltip';
import { UiSaveMenu } from '../OpenFile/UiSaveMenu';
import { UiReportMenu } from '../OpenFile/UiReportMenu';

import { MriEvents } from '../../engine/lib/enums';

import css from './Header.module.css';

export function Header() {
  const [showOpenFromDeviceModal, setShowOpenFromDeviceModal] = useState(false);

  const onButtonOpenLocalFileClick = () => {
    setShowOpenFromDeviceModal(true);
  };

  const onHide = () => {
    setShowOpenFromDeviceModal(false);
  };

  useOnEvent(MriEvents.VOLUME_LOAD_SUCCESS, onHide);

  return (
    <header className={css.header}>
      <UiSaveMenu />
      <UiReportMenu />
      <Tooltip content="Open file or folder">
        <UIButton icon="folder" handler={onButtonOpenLocalFileClick} cx={css.header_button} />
      </Tooltip>
      <Tooltip content="Open external URL">
        <OpenFromURLComponent cx={css.header_button} />
      </Tooltip>
      <Tooltip content="Open demo data">
        <OpenDemoComponent cx={css.header_button} />
      </Tooltip>
      {showOpenFromDeviceModal && <ModalSelectFile stateVis={showOpenFromDeviceModal} onHide={onHide} />}
    </header>
  );
}
