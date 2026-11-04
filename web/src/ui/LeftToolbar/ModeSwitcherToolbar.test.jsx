import React from 'react';
import { renderWithState } from '../../utils/configureTest';
import { fireEvent, screen } from '@testing-library/react';
import { ModeSwitcherToolbar } from './ModeSwitcherToolbar';
import ViewMode from '../../store/ViewMode';
import { useNeedShow3d } from '../../utils/useNeedShow3d';
import { mriLocalStorageService } from '../../engine/lib/services';

vi.mock('../../utils/useNeedShow3d');

vi.mock('../../engine/lib/services', () => ({
  mriLocalStorageService: {
    getViewMode: vi.fn(),
    saveViewMode: vi.fn(),
  },
}));

const mockedUseNeedShow3d = useNeedShow3d;

describe('ModeSwitcherToolbarTest', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

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
    expect(mriLocalStorageService.saveViewMode).toHaveBeenCalledWith(ViewMode.VIEW_3D);
  });

  it('hides the 3D button when the volume does not support it', () => {
    mockedUseNeedShow3d.mockReturnValue(false);
    renderWithState(<ModeSwitcherToolbar />);
    expect(screen.queryByTestId('Button3D')).not.toBeInTheDocument();
  });

  it('shows the 3D button when the volume supports it', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    renderWithState(<ModeSwitcherToolbar />);
    expect(screen.getByTestId('Button3D')).toBeInTheDocument();
  });

  it.each([ViewMode.VIEW_2D, ViewMode.VIEW_3D_LIGHT, ViewMode.VIEW_3D])('restores the saved view mode %s on mount', (savedMode) => {
    mockedUseNeedShow3d.mockReturnValue(true);
    mriLocalStorageService.getViewMode.mockReturnValue(savedMode);

    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_2D });

    expect(store.getState().viewMode).toBe(savedMode);
  });
});
