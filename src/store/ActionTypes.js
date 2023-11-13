/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Action type for redux reducer
//
const StoreActionType = {
  SET_IS_LOADED: 0, // boolean (progress = 100%)
  SET_FILENAME: 1,
  SET_VOLUME_SET: 2,
  SET_VOLUME_INDEX: 3,

  SET_TEXTURE3D: 4,
  SET_MODE_VIEW: 5,
  SET_MODE_2D: 6,
  SET_SLIDER_2D: 7,
  SET_MODE_3D: 8,
  SET_SLIDER_3DR: 9,
  SET_SLIDER_3DG: 10,
  SET_SLIDER_3DB: 11,
  SET_SLIDER_Opacity: 12,
  SET_SLIDER_Isosurface: 13,
  SET_SLIDER_Brightness: 14,
  SET_SLIDER_Cut: 15,
  SET_SLIDER_Quality: 16,
  SET_SLIDER_ErRadius: 17,
  SET_SLIDER_ErDepth: 18,
  SET_VOLUME_Renderer: 19,

  SET_2D_TOOLS_INDEX: 20,
  SET_2D_ZOOM: 21,
  SET_2D_X_POS: 22,
  SET_2D_Y_POS: 23,
  SET_GRAPHICS_2D: 24,
  SET_PROGRESS: 25,
  SET_DICOM_INFO: 26,
  SET_IS_TOOL3D: 27,
  SET_SLIDER_Contrast3D: 28,
  SET_ERR_ARRAY: 29,
  SET_MODE_3Droi: 30,
  SET_DICOM_SERIES: 31,
  SET_LOADER_DICOM: 32,
  SET_MODAL_TEXT: 33,
  SET_MODAL_ALERT: 34,
  SET_SPINNER: 35,
  SET_PROGRESS_INFO: 36,
  SET_SPINNER_TITLE: 37,
  SET_SPINNER_PROGRESS: 38,
};
export default StoreActionType;
