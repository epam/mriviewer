/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
* Main app mopdule
* @module app/scripts/main
*/

// ******************************************************************
// Imports
// ******************************************************************

// absolute imports
import jQuery from 'jquery';
import Menu from './menu';
import config from '../../tools/config';
import Med3Web, { loadFileType } from '../../lib/scripts/med3web';

window.jQuery = window.$ = jQuery;
require('bootstrap');

// ******************************************************************
// Consts
// ******************************************************************

// const MAX_GPU_TEXTURE_SIDE = 16384 * 2;

/** menu */
let menu = null;

let med3Web = null;

// eslint-disable-next-line
const MPI05 = Math.PI * 0.5;

/** Initial values for 3d sliders */
const slider3dInitVal = {
  ct: {
    thresholdIsosurf: 0.43,
    thresholdTissue1: 0.1,
    thresholdTissue2: 0.35,
    opacityTissue: 0.35,
    startRotX: 0.0,
    startRotY: 0.0,
    lightDirComp: 0.5773,
    brightness: 0.69,
  },
  lungs: {
    thresholdIsosurf: 0.6,
    thresholdTissue1: 0.02,
    thresholdTissue2: 0.09,
    opacityTissue: 0.37,
    startRotX: -MPI05,
    startRotY: Math.PI,
    lightDirComp: -0.5773,
    brightness: 0.82,
  },
  pelvis: {
    thresholdIsosurf: 0.64,
    thresholdTissue1: 0.13,
    thresholdTissue2: 0.45,
    opacityTissue: 1.0,
    startRotX: -MPI05,
    startRotY: Math.PI,
    lightDirComp: -0.5773,
    brightness: 0.5,
  },
  nifti: {
    thresholdIsosurf: 0.5,
    thresholdTissue1: 0.12,
    thresholdTissue2: 0.35,
    opacityTissue: 0.72,
    startRotX: -MPI05,
    startRotY: 0.0,
    lightDirComp: -0.5773,
    brightness: 0.5,
  },
  hdr: {
    thresholdIsosurf: 0.95,
    thresholdTissue1: 0.12,
    thresholdTissue2: 0.25,
    opacityTissue: 0.72,
    startRotX: 0.0,
    startRotY: 0.0,
    lightDirComp: -0.5773,
    brightness: 0.5,
  },
  undefined: {
    thresholdIsosurf: 0.46,
    thresholdTissue1: 0.09,
    thresholdTissue2: 0.30,
    opacityTissue: 0.53,
    startRotX: -MPI05,
    startRotY: Math.PI,
    lightDirComp: -0.5773,
    brightness: 0.56,
  },
};

/** Type of currently opened file: ct, lungs or dicom */
let curFileDataType;

/** container for 2d visualization */
const root2dContainer = $('#med3web-container-2d');
/** container for 3d visualization */
const root3dContainer = $('#med3web-container-3d');

/** Setup animation for all DOM elements: 2d and 3d containters */
function animateMenu() {
  requestAnimationFrame(animateMenu);
  if (document.hasFocus()) {
    if (menu !== null) {
      menu.updateEachFrame();
    } // if menu exist
  } // if app window has focus
} // func animateRender

/** Get load type by file name */
function _getLoadFileType(strFileName) {
  let fileType = loadFileType.NA;
  if (strFileName.endsWith('.ktx')) {
    fileType = loadFileType.KTX;
  }
  if (strFileName.endsWith('.dcm')) {
    fileType = loadFileType.DICOM;
  }
  if (strFileName.endsWith('.nii')) {
    fileType = loadFileType.NIFTI;
  }
  if (strFileName.endsWith('.h') || strFileName.endsWith('.hdr')) {
    fileType = loadFileType.HDR;
  }
  return fileType;
}

/** Performed once during main web page load */
function onPageLoad() {
  if (this !== window) {
    console.log('This is NOT window context!');
  }

  curFileDataType = slider3dInitVal.undefined;
  menu = new Menu();

  const fileNameOnLoad = config.data.onloadsrc;
  const fileTypeOnLoad = _getLoadFileType(fileNameOnLoad);
  const opts = {
    container3d: root3dContainer,
    container2d: root2dContainer,
    // Load default volume
    loadUrlFile: fileNameOnLoad,
    loadType: fileTypeOnLoad,
    menuUI: menu
  };

  med3Web = new Med3Web(opts);
  const okInit = med3Web.init();
  if (!okInit) {
    return;
  }
  window.med3web = med3Web;

  // setup render engines for menu
  menu.setRenderEngine(med3Web);

  $(this).on('loadFile', (event) => {
    const dataType = event.detail.dataType;
    // pass render settings to render object
    curFileDataType = slider3dInitVal[dataType];
    med3Web.setCurFileDataType(curFileDataType);
    const fileUrl = event.detail.data;

    // detect fie type
    const fileType = event.detail.fileType;
    opts.loadType = fileType;
    med3Web.loadScene(fileUrl, opts.loadType);
  }); // if on load file

  $(this).on('newTag', (event) => {
    menu.onNewTag(event.detail.group,
      event.detail.element,
      event.detail.desc,
      event.detail.value,
      event.detail.imageNumber,
      event.detail.fileName);
  });
  animateMenu();
}

/** Load main function action */
window.onload = onPageLoad;
