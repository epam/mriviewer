/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import Screenshot from '../../engine/utils/Screenshot';
import ViewMode from '../../store/ViewMode';
import { Tooltip } from '../Tooltip/Tooltip';
import { UIButton } from '../Button/Button';
import UiModalInfo from '../Modals/ModalInfo';
import { useSelector } from 'react-redux';

export const UiReportMenu = () => {
  const [showModalDicomTags, setShowModalDicomTags] = useState(false);

  const { viewMode, graphics2d, volumeRenderer, isLoaded } = useSelector((state) => state);
  const onModalDicomTagsShow = () => {
    setShowModalDicomTags(true);
  };

  const onModalDicomTagsHide = () => {
    setShowModalDicomTags(false);
  };

  const onModalScreenshot = () => {
    const SHOT_W = 800;
    const SHOT_H = 600;

    const viewModeLocal = viewMode;
    if (viewModeLocal === ViewMode.VIEW_2D) {
      const gra2d = graphics2d;
      Screenshot.makeScreenshot(gra2d, SHOT_W, SHOT_H);
    } else if (viewModeLocal === ViewMode.VIEW_3D || viewModeLocal === ViewMode.VIEW_3D_LIGHT) {
      const volRender = volumeRenderer;
      Screenshot.makeScreenshot(volRender, SHOT_W, SHOT_H);
    } else {
      console.log('onModalScreenshot. not implemented yet');
    }
  };

  const isLoadedLocal = isLoaded;
  const strDisabled = !isLoadedLocal;
  return (
    <>
      <Tooltip content="Show tags">
        <UIButton icon="report" rounded mode="light" disabled={strDisabled} handler={onModalDicomTagsShow} />
      </Tooltip>
      <Tooltip content="Screenshot">
        <UIButton icon="camera" rounded mode="light" disabled={strDisabled} handler={onModalScreenshot} />
      </Tooltip>

      {showModalDicomTags && <UiModalInfo stateVis={showModalDicomTags} onHide={onModalDicomTagsHide} />}
    </>
  );
};
