import React from 'react';
import { renderWithState } from '../../utils/configureTest';
import { fireEvent, screen } from '@testing-library/react';
import { ModeSwitcherToolbar } from './ModeSwitcherToolbar';
import ViewMode from '../../store/ViewMode';
import { useNeedShow3d } from '../../utils/useNeedShow3d';

jest.mock('../../utils/useNeedShow3d');
const mockedUseNeedShow3d = useNeedShow3d;

describe('ModeSwitcherToolbarTest', () => {
  it('test button 2D', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_2D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    fireEvent.click(screen.getByTestId('Button2D'));
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
  });

  it('test button lightning', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_2D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    fireEvent.click(screen.getByTestId('ButtonLightning'));
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_3D_LIGHT);
  });

  it('test button 3D', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_2D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    fireEvent.click(screen.getByTestId('Button3D'));
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_3D);
  });

  it('should be render button3D', () => {
    mockedUseNeedShow3d.mockReturnValue(false);
    renderWithState(<ModeSwitcherToolbar />);
    expect(screen.queryByTestId('Button3D')).not.toBeInTheDocument();
  });

  it('should be render button3D', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    renderWithState(<ModeSwitcherToolbar />);
    expect(screen.getByTestId('Button3D')).toBeInTheDocument();
  });
});
