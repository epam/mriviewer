import { LeftToolbar } from './LeftToolbar';
import { renderWithState } from '../../utils/configureTest';
import ViewMode from '../../store/ViewMode';
import { useNeedShow3d } from '../../utils/useNeedShow3d';
import { ModeSwitcherToolbar } from './ModeSwitcherToolbar';
import { ModeFast3dToolbar } from './ModeFast3dToolbar';
import { Mode2dToolbar } from './Mode2dToolbar';

jest.mock('./ModeSwitcherToolbar', () => ({
  ModeSwitcherToolbar: jest.fn(() => <div>ModeSwitcherToolbar</div>),
}));
jest.mock('./ModeFast3dToolbar', () => ({
  ModeFast3dToolbar: jest.fn(() => <div>ModeFast3dToolbar</div>),
}));
jest.mock('./Mode2dToolbar', () => ({
  Mode2dToolbar: jest.fn(() => <div>Mode2dToolbar</div>),
}));

jest.mock('../../utils/useNeedShow3d');
const mockedUseNeedShow3d = useNeedShow3d;
describe('test leftToolbar', () => {
  it('should be render modeFast3Dtollbar', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    // eslint-disable-next-line react/react-in-jsx-scope
    const { store } = renderWithState(<LeftToolbar />, { viewMode: ViewMode.VIEW_3D_LIGHT });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_3D_LIGHT);
    expect(ModeSwitcherToolbar).toBeCalledTimes(1);
    expect(ModeFast3dToolbar).toBeCalledTimes(1);
    expect(Mode2dToolbar).toBeCalledTimes(0);
  });

  it('should be render mode2DTollbar', () => {
    mockedUseNeedShow3d.mockReturnValue(true);
    // eslint-disable-next-line react/react-in-jsx-scope
    const { store } = renderWithState(<LeftToolbar />, { viewMode: ViewMode.VIEW_2D });
    expect(store.getState().viewMode).toBe(ViewMode.VIEW_2D);
    expect(ModeSwitcherToolbar).toBeCalledTimes(2);
    expect(ModeFast3dToolbar).toBeCalledTimes(1);
    expect(Mode2dToolbar).toBeCalledTimes(1);
  });
});
