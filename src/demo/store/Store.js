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
  slider3d_r: 0.09,
  slider3d_g: 0.3,
  slider3d_b: 0.46,
  mode3d: Modes3d.RAYCAST,
  sliderOpacity: 0.53,
  sliderIsosurface: 0.46,
  sliderBrightness: 0.56,
  sliderCut: 1.0,
  sliderQuality: 0.35,
  sliderErRadius: 0.5,
  sliderErDepth: 0.5,
  ereaseStart: false,
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
    return Object.assign({}, state, { slider3d_r: action.slider3d_r });
  case StoreActionType.SET_SLIDER_3DG:
    return Object.assign({}, state, { slider3d_g: action.slider3d_g });
  case StoreActionType.SET_SLIDER_3DB:
    return Object.assign({}, state, { slider3d_b: action.slider3d_b });
  case StoreActionType.SET_SLIDER_Opacity:
    return Object.assign({}, state, { sliderOpacity: action.sliderOpacity });
  case StoreActionType.SET_SLIDER_Isosurface:
    return Object.assign({}, state, { sliderIsosurface: action.sliderIsosurface });
  case StoreActionType.SET_SLIDER_ErRadius:
    return Object.assign({}, state, { sliderErRadius: action.sliderErRadius });
  case StoreActionType.SET_SLIDER_ErDepth:
    return Object.assign({}, state, { sliderErDepth: action.sliderErDepth });
  case StoreActionType.SET_EREASE_START:
    return Object.assign({}, state, { ereaseStart: action.ereaseStart });
  case StoreActionType.SET_SLIDER_Brightness:
    return Object.assign({}, state, { sliderBrightness: action.sliderBrightness });
  case StoreActionType.SET_SLIDER_Cut:
    return Object.assign({}, state, { sliderCut: action.sliderCut });
  case StoreActionType.SET_SLIDER_Quality:
    return Object.assign({}, state, { sliderQuality: action.sliderQuality });
  default:
    return state;
  }
}

export default medReducer;
