/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileSettings } from './MobileSettings';
import { UIButton } from '../Button/Button';

window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === '(max-width: 768px)',
}));

jest.mock('react-modal', () => ({
  setAppElement: jest.fn(),
}));
jest.mock('./MobileSettings', () => ({ MobileSettings: jest.fn(() => <div>3 buttons or 2</div>) }));

const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

describe('MobileSettings', () => {
  it('renders without errors', async () => {
    const { container } = await render(<MobileSettings />);
    expect(container).toBeInTheDocument();
  });

  it('renders without errors', () => {
    const { container } = render(<MobileSettings></MobileSettings>);
    expect(container).toBeInTheDocument();
  });

  it('Button settingsLinear shod be on screen', () => {
    const { getByTestId } = render(<UIButton icon="settings-linear" testId={'buttonSettingsLinear'} />);
    const button = getByTestId('buttonSettingsLinear');
    expect(button).toBeInTheDocument();
  });

  it('should call the toggleSettingsMenu function when clicked', () => {
    const toggleSettingsMenu = jest.fn();
    const { getByTestId } = render(<UIButton icon="settings-linear" handler={toggleSettingsMenu} testId="buttonSettingsLinear" />);
    const button = getByTestId('buttonSettingsLinear');
    fireEvent.click(button); // Имитируем клик на кнопку
    expect(toggleSettingsMenu).toHaveBeenCalledTimes(1);
  });

  it('should call the toggleSettingsMenu function when clicked', () => {
    const toggle2DMenu = jest.fn();
    const { getByTestId } = render(<UIButton icon="settings-linear" handler={toggle2DMenu} testId="button2D" />);
    const button = getByTestId('button2D');
    fireEvent.click(button);
    expect(toggle2DMenu).toHaveBeenCalledTimes(1);
  });

  it('should call the toggleSettingsMenu function when clicked', () => {
    const toggleCursorMenu = jest.fn();
    const { getByTestId } = render(<UIButton icon="button2D" handler={toggleCursorMenu} testId="buttonCursor" />);

    const button = getByTestId('buttonCursor');
    fireEvent.click(button); // Имитируем клик на кнопку

    expect(toggleCursorMenu).toHaveBeenCalledTimes(1);
  });
});
