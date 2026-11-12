import { createStore } from 'redux';
import StoreActionType from './ActionTypes';
import reducer from './Store';
import Modes2d from './Modes2d';
import Modes3d from './Modes3d';
import ViewMode from './ViewMode';

describe('Redux store integration', () => {
  it('accepts every application action through Redux dispatch', () => {
    const store = createStore((state = null) => state);

    Object.values(StoreActionType).forEach((type) => {
      const action = { type };
      expect(store.dispatch(action)).toBe(action);
    });
  });

  it('updates loading state through the application reducer', () => {
    const store = createStore(reducer);

    store.dispatch({ type: StoreActionType.SET_SPINNER, spinner: true });
    expect(store.getState().spinner).toBe(true);

    store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: 'study.dcm' });
    store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 1 });
    store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
    store.dispatch({ type: StoreActionType.SET_SPINNER, spinner: false });

    expect(store.getState()).toMatchObject({
      fileName: 'study.dcm',
      progress: 1,
      isLoaded: true,
      spinner: false,
    });
  });

  it('updates 2D controls and switches to 3D without losing their state', () => {
    const store = createStore(reducer);

    store.dispatch({ type: StoreActionType.SET_MODE_2D, mode2d: Modes2d.CORONAL });
    store.dispatch({ type: StoreActionType.SET_2D_ZOOM, render2dZoom: 1.5 });
    store.dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: ViewMode.VIEW_3D });
    store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.ISO });
    store.dispatch({ type: StoreActionType.SET_SLIDER_Isosurface, isoThresholdValue: 0.7 });
    store.dispatch({ type: StoreActionType.SET_SLIDER_Opacity, opacityValue3D: 0.4 });

    expect(store.getState()).toMatchObject({
      mode2d: Modes2d.CORONAL,
      render2dZoom: 1.5,
      viewMode: ViewMode.VIEW_3D,
      mode3d: Modes3d.ISO,
      isoThresholdValue: 0.7,
      opacityValue3D: 0.4,
    });
  });
});
