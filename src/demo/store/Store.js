//

import StoreActionType from './ActionTypes';
import ModeView from './ModeView';
import Modes2d from './Modes2d';
import Modes3d from './Modes3d';

//
// Global app settings with initial configuration
//
export const initialState = {
  isLoaded: false,
  fileName: 'brain.ktx',
  volume: null,
  texture3d: null,
  modeView: ModeView.VIEW_2D,
  mode2d: Modes2d.TRANSVERSE,
  slider2d: 0.5,
  slider3d_r: 0.2,
  slider3d_g: 0.5,
  slider3d_b: 0.8,
  mode3d: Modes3d.ISO,
};
//
// App reducer
//
const medReducer = (state = initialState, action) => {
  switch (action.type) {
  case StoreActionType.SET_IS_LOADED:
    return Object.assign({}, state, { isLoaded: action.isLoaded });
  case StoreActionType.SET_FILENAME:
    return Object.assign({}, state, { fileName: action.fileName });
  case StoreActionType.SET_VOLUME:
    return Object.assign({}, state, { volume: action.volume });
  case StoreActionType.SET_TEXTURE3D:
    return Object.assign({}, state, { texture3d: action.texture3d });
  case StoreActionType.SET_MODE_VIEW:
    return Object.assign({}, state, { modeView: action.modeView });
  case StoreActionType.SET_MODE_2D:
    return Object.assign({}, state, { mode2d: action.mode2d });
  case StoreActionType.SET_SLIDER_2D:
    return Object.assign({}, state, { slider2d: action.slider2d });
  case StoreActionType.SET_MODE_3D:
    return Object.assign({}, state, { mode3d: action.mode3d });
  case StoreActionType.SET_SLIDER_3DR:
    return Object.assign({}, state, { slider3d_r: action.slider3dr });
  case StoreActionType.SET_SLIDER_3DG:
    return Object.assign({}, state, { slider3d_g: action.slider3dg });
  case StoreActionType.SET_SLIDER_3DB:
    return Object.assign({}, state, { slider3d_b: action.slider3db });
  default:
    return state;
  }
}

export default medReducer;
