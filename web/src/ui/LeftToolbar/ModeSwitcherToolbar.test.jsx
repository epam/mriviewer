import React from 'react';
import { renderWithState } from '../../utils/configureTest';
import { fireEvent, screen } from '@testing-library/react';
import { ModeSwitcherToolbar } from './ModeSwitcherToolbar';
import ViewMode from '../../store/ViewMode';
import { useNeedShow3d } from '../../utils/useNeedShow3d';
import { mriLocalStorageService } from '../../engine/lib/services';

vi.mock('../../utils/useNeedShow3d');

vi.mock('../../engine/lib/services/LocalStorageService', async function mockLocalStorage(importOriginal) {
  return {
    ...(await importOriginal()),
    default: {
      getViewMode: vi.fn(),
      saveViewMode: vi.fn(),
    },
  };
});

const mockedUseNeedShow3d = useNeedShow3d;

describe('ModeSwitcherToolbar', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mriLocalStorageService.getViewMode.mockReturnValue('');
  });

  it('switches from 3D to 2D and saves the preference', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_3D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_3D);
    fireEvent.click(screen.getByTestId('Button2D'));
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    expect(mriLocalStorageService.saveViewMode).toHaveBeenCalledExactlyOnceWith(ViewMode.VIEW_2D);
  });

  it('switches to fast 3D and saves the preference', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_2D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    fireEvent.click(screen.getByTestId('ButtonLightning'));
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_3D_LIGHT);
    expect(mriLocalStorageService.saveViewMode).toHaveBeenCalledExactlyOnceWith(ViewMode.VIEW_3D_LIGHT);
  });

  it('switches to 3D and saves the preference', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    const { store } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_2D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    fireEvent.click(screen.getByTestId('Button3D'));
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_3D);
    expect(mriLocalStorageService.saveViewMode).toHaveBeenCalledExactlyOnceWith(ViewMode.VIEW_3D);
  });

  it('hides the 3D button when 3D is unavailable', () => {
    mockedUseNeedShow3d.mockReturnValue(false);
    renderWithState(<ModeSwitcherToolbar />);
    expect(screen.queryByTestId('Button3D')).not.toBeInTheDocument();
  });

  it('shows the 3D button when 3D is available', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    renderWithState(<ModeSwitcherToolbar />);
    expect(screen.getByTestId('Button3D')).toBeInTheDocument();
  });

  it.each([ViewMode.VIEW_2D, ViewMode.VIEW_3D_LIGHT, ViewMode.VIEW_3D])('restores saved view mode %s on mount', (savedMode) => {
    mockedUseNeedShow3d.mockReturnValue(true);
    mriLocalStorageService.getViewMode.mockReturnValue(savedMode);

    const { store, initialState } = renderWithState(<ModeSwitcherToolbar />, { viewMode: ViewMode.VIEW_NA });

    expect(initialState.viewMode).toBe(ViewMode.VIEW_NA);
    expect(mriLocalStorageService.getViewMode).toHaveBeenCalledExactlyOnceWith();
    expect(store.getState().viewMode).toBe(savedMode);
    expect(mriLocalStorageService.saveViewMode).toHaveBeenCalledExactlyOnceWith(savedMode);
  });
});
