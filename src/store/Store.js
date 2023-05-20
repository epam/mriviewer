/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

//

import StoreActionType from './ActionTypes';
import ViewMode from './ViewMode';
import Modes2d from './Modes2d';
import Modes3d from './Modes3d';

//
// Global app settings with initial configuration
//
export const initialState = {
  isLoaded: false, // true when file is loaded
  fileName: 'brain.ktx', // file name
  volumeSet: null, // Volume[]
  volumeIndex: 0, // Index of volume (usually 0)
  viewMode: ViewMode.VIEW_2D, // 2D or 3D
  mode2d: Modes2d.TRANSVERSE, // 2D planar slice direction
  sliceRatio: 0.5, // current slice number / slices amount
  slider3d_r: 0.09, // 3D slicer Red
  slider3d_g: 0.3, // 3D slicer Green
  slider3d_b: 0.46, // 3D slicer Blue
  mode3d: Modes3d.RAYCAST, // 3D rendering mode
  opacityValue3D: 0.53, // 3D Opacity value
  isoThresholdValue: 0.46, // Surface ISO threshold value
  brightness3DValue: 0.56, // 3D brightness
  cut3DRatio: 1.0, // Slice 3D ratio
  quality3DStepSize: 0.35, // 3D quality
  sliderErRadius: 50.0, // 3D eraser radius
  sliderErDepth: 50.0, // 3D eraser depth
  volumeRenderer: null,
  indexTools2d: 0,
  render2dZoom: 1.0,
  render2dxPos: 0.0,
  render2dyPos: 0.0,
  graphics2d: null,
  progress: 0, // 0 to 1
  titleProgressBar: '',
  dicomInfo: null,
  isTool3D: false,
  sliderContrast3D: 0.0,
  arrErrors: [],
  dicomSeries: [],
  loaderDicom: null,
  spinner: false, //true when mock data is loading
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
    case StoreActionType.SET_VOLUME_SET:
      return Object.assign({}, state, { volumeSet: action.volumeSet });
    case StoreActionType.SET_VOLUME_INDEX:
      return Object.assign({}, state, { volumeIndex: action.volumeIndex });
    case StoreActionType.SET_TEXTURE3D:
      return Object.assign({}, state, { texture3d: action.texture3d });
    case StoreActionType.SET_MODE_VIEW:
      return Object.assign({}, state, { viewMode: action.viewMode });
    case StoreActionType.SET_MODE_2D:
      return Object.assign({}, state, { mode2d: action.mode2d });
    case StoreActionType.SET_SLIDER_2D:
      return Object.assign({}, state, { sliceRatio: action.sliceRatio });
    case StoreActionType.SET_MODE_3D:
      return Object.assign({}, state, { mode3d: action.mode3d });
    case StoreActionType.SET_SLIDER_3DR:
      return Object.assign({}, state, { slider3d_r: action.slider3d_r });
    case StoreActionType.SET_SLIDER_3DG:
      return Object.assign({}, state, { slider3d_g: action.slider3d_g });
    case StoreActionType.SET_SLIDER_3DB:
      return Object.assign({}, state, { slider3d_b: action.slider3d_b });
    case StoreActionType.SET_SLIDER_Opacity:
      return Object.assign({}, state, { opacityValue3D: action.opacityValue3D });
    case StoreActionType.SET_SLIDER_Isosurface:
      return Object.assign({}, state, { isoThresholdValue: action.isoThresholdValue });
    case StoreActionType.SET_SLIDER_ErRadius:
      return Object.assign({}, state, { sliderErRadius: action.sliderErRadius });
    case StoreActionType.SET_SLIDER_ErDepth:
      return Object.assign({}, state, { sliderErDepth: action.sliderErDepth });
    case StoreActionType.SET_VOLUME_Renderer:
      return Object.assign({}, state, { volumeRenderer: action.volumeRenderer });
    case StoreActionType.SET_SLIDER_Brightness:
      return Object.assign({}, state, { brightness3DValue: action.brightness3DValue });
    case StoreActionType.SET_SLIDER_Cut:
      return Object.assign({}, state, { cut3DRatio: action.cut3DRatio });
    case StoreActionType.SET_SLIDER_Quality:
      return Object.assign({}, state, { quality3DStepSize: action.quality3DStepSize });
    case StoreActionType.SET_2D_TOOLS_INDEX:
      return Object.assign({}, state, { indexTools2d: action.indexTools2d });
    case StoreActionType.SET_2D_ZOOM:
      return Object.assign({}, state, { render2dZoom: action.render2dZoom });
    case StoreActionType.SET_2D_X_POS:
      return Object.assign({}, state, { render2dxPos: action.render2dxPos });
    case StoreActionType.SET_2D_Y_POS:
      return Object.assign({}, state, { render2dyPos: action.render2dyPos });
    case StoreActionType.SET_GRAPHICS_2D:
      return Object.assign({}, state, { graphics2d: action.graphics2d });
    case StoreActionType.SET_PROGRESS:
      return Object.assign({}, state, { progress: action.progress });
    case StoreActionType.SET_PROGRESS_INFO:
      return Object.assign({}, state, { titleProgressBar: action.titleProgressBar });
    case StoreActionType.SET_DICOM_INFO:
      return Object.assign({}, state, { dicomInfo: action.dicomInfo });
    case StoreActionType.SET_IS_TOOL3D:
      return Object.assign({}, state, { isTool3D: action.isTool3D });
    case StoreActionType.SET_SLIDER_Contrast3D:
      return Object.assign({}, state, { sliderContrast3D: action.sliderContrast3D });
    case StoreActionType.SET_ERR_ARRAY:
      return Object.assign({}, state, { arrErrors: action.arrErrors });
    case StoreActionType.SET_DICOM_SERIES:
      return Object.assign({}, state, { dicomSeries: action.dicomSeries });
    case StoreActionType.SET_LOADER_DICOM:
      return Object.assign({}, state, { loaderDicom: action.loaderDicom });
    case StoreActionType.SET_MODAL_TEXT:
      return Object.assign({}, state, { showModalText: action.showModalText });
    case StoreActionType.SET_MODAL_ALERT:
      return Object.assign({}, state, { showModalAlert: action.showModalAlert });
    case StoreActionType.SET_SPINNER:
      return Object.assign({}, state, { spinner: action.spinner });
    default:
      return state;
  }
};

export default medReducer;
