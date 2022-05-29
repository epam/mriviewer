import React from 'react';
import Modes2d from '../../store/Modes2d';
import { Mode2dToolbar } from './Mode2dToolbar';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithState } from '../../utils/configureTest';

describe('Mode2dToolbarTest', () => {
  const initialState = {
    mode2d: Modes2d.SAGGITAL,
    graphics2d: { m_mode2d: null, clear: () => {}, forceUpdate: () => {}, forceRender: () => {} },
  };
  it('test button saggital', () => {
    const { store } = renderWithState(<Mode2dToolbar />, initialState);
    expect(store.getState().mode2d).toBe(Modes2d.SAGGITAL);
    expect(store.getState().graphics2d.m_mode2d).toBe(null);
    fireEvent.click(screen.getByTestId('buttonSaggital'));
    expect(store.getState().graphics2d.m_mode2d).toBe(Modes2d.SAGGITAL);
    expect(store.getState().mode2d).toBe(Modes2d.SAGGITAL);
    expect(store.getState().render2dZoom).toBe(1);
  });

  it('test button coronal', () => {
    const { store } = renderWithState(<Mode2dToolbar />, initialState);
    expect(store.getState().mode2d).toBe(Modes2d.SAGGITAL);
    expect(store.getState().graphics2d.m_mode2d).toBe(0);
    fireEvent.click(screen.getByTestId('buttonCoronal'));
    expect(store.getState().graphics2d.m_mode2d).toBe(Modes2d.CORONAL);
    expect(store.getState().mode2d).toBe(Modes2d.CORONAL);
    expect(store.getState().render2dZoom).toBe(1);
  });

  it('test button transverse', () => {
    const { store } = renderWithState(<Mode2dToolbar />, initialState);
    expect(store.getState().mode2d).toBe(Modes2d.SAGGITAL);
    expect(store.getState().graphics2d.m_mode2d).toBe(1);
    fireEvent.click(screen.getByTestId('buttonTransverse'));
    expect(store.getState().graphics2d.m_mode2d).toBe(Modes2d.TRANSVERSE);
    expect(store.getState().mode2d).toBe(Modes2d.TRANSVERSE);
    expect(store.getState().render2dZoom).toBe(1);
  });
});
