/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DragAndDropContainer } from './DragAndDropContainer';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

describe('Test DragAndDrop', () => {
  it('should render', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <DragAndDropContainer>test</DragAndDropContainer>
      </DndProvider>
    );

    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
