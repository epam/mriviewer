import React from 'react';
import { ModeFast3dToolbar } from './ModeFast3dToolbar';
import { renderWithState } from '../../utils/configureTest';
import { fireEvent, screen } from '@testing-library/react';

describe('ModeFast3dToolbarTest', () => {
  it('Test UIButton V', () => {
    const { store } = renderWithState(<ModeFast3dToolbar />, { isTool3D: true });
    expect(store.getState().isTool3D).toBe(true);

    fireEvent.click(screen.getByTestId('buttonV'));

    expect(store.getState().sliderContrast3D).toBe(0);
    expect(store.getState().isTool3D).toBe(false);
  });

  it('Test UIButton T', () => {
    const { store } = renderWithState(<ModeFast3dToolbar />, { isTool3D: true });
    expect(store.getState().isTool3D).toBe(true);

    fireEvent.click(screen.getByTestId('buttonT'));

    expect(store.getState().isTool3D).toBe(false);
    expect(store.getState().sliderContrast3D).toBe(0);
  });
});
