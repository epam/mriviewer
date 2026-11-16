/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToolButton } from '../ToolButton';
import UiModalBilateral from '../../Modals/UiModalBilateral';

export const BilateralTool = () => {
  const [showModal, setShowModal] = useState(false);

  const hideModal = () => {
    setShowModal(false);
  };

  const handleChange = () => {
    setShowModal(true);
  };

  return (
    <>
      <ToolButton content="Bilateral (denoise or smooth)" onChange={handleChange} icon="noise-reduction" />
      {showModal && <UiModalBilateral stateVis={showModal} onHide={hideModal} />}
    </>
  );
};
