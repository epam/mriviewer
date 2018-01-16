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
import swal from 'sweetalert';

// relative project imports
import Graphics2d from './graphics2d/graphics2d';
import LoadResult from './loaders/loadresult';
import KtxLoader from './loaders/ktxloader';
import DicomFolderLoader from './loaders/dicomloader';
import NiftiLoader from './loaders/niiloader';
import HdrLoader from './loaders/hdrloader';

import Graphics3d from './graphics3d/graphics3d';
import GlCheck from './graphics3d/glcheck';
import Menu, { loadFileType } from './menu';

import BrowserDetector from './utils/browserdetector';
import config from '../../tools/config';

window.jQuery = window.$ = jQuery;
require('bootstrap');

// ******************************************************************
// Consts
// ******************************************************************

// const MAX_GPU_TEXTURE_SIDE = 16384 * 2;

let engine3d = null;
/** 2d rendering engine */
let engine2d = null;
/** menu */
let menu = null;
/** loader for KTX files */
let loaderKtx = null;
/** loader for OBJ files */
// let loaderObj = null;

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

function callbackFileLoaded() {
  if (menu) {
    menu.onFileLoaded(curFileDataType);
  }
  if (engine2d) {
    engine2d.onFileLoaded();
  }
  if (engine3d) {
    engine3d.renderState = engine3d.RENDER_STATE.ENABLED;
  }
}

// ******************************************************************
// Check Chrome browser and file: protocol scheme
// To avoid possibility to open local file
// ******************************************************************
function isChromeAndFile() {
  // console.log(`document.location.protocol = ${document.location.protocol}`);
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
      && !/Chromium/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
  return isChrome && (document.location.protocol === 'file:');
}


// ******************************************************************
// Dicom folder loading
// ******************************************************************

function dicomOnSucces(dataName, loader, header, dataSize, dataArray) {
  const xd =  header.m_pixelWidth;
  const yd =  header.m_pixelHeight;
  const zd =  header.m_pixelDepth;
  console.log(`Success loading Dicom: ${dataName} dim=${xd}*${yd}*${zd}`);
  const box = loader.getBoxSize();
  const nonEmptyBoxMin = loader.getNonEmptyBoxMin();
  const nonEmptyBoxMax = loader.getNonEmptyBoxMax();
  engine2d.m_volumeHeader = header;
  engine2d.m_volumeData = dataArray;
  engine2d.m_volumeBox = box;
  engine2d.m_volumeInfo = loader.getDicomInfo();
  if (engine2d.m_volumeData === null) {
    console.log('BAD null volume data array');
  } else {
    menu.stopProgressBar();
    engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax);
    engine2d.createTileMapsWithTexture(engine3d.volTexture);
    callbackFileLoaded();
  }
}

/** Failed load Dicom file callback */
function dicomOnFail(dataName, status) {
  const strTitle = `Error loading: ${dataName}`;
  const strMessage = LoadResult.getResultString(status);
  menu.stopProgressBar();
  swal({
    title: strTitle,
    text: strMessage,
    icon: 'error',
    button: 'continue',
  });
}

/** create simple cube mesh from current loaded volume data */
function callbackLoadDicomFolder(urlDicomFolder) {
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }
  // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
  const needScaleDownTexture = true;
  const loaderDicom = new DicomFolderLoader(needScaleDownTexture);
  menu.startProgressBar();
  loaderDicom.readFolder(urlDicomFolder, (status, header, dataSize, dataArray) => {
    if (status === LoadResult.SUCCESS) {
      dicomOnSucces(urlDicomFolder, loaderDicom, header, dataSize, dataArray);
    } else {
      console.log('Error load dicom folder');
      dicomOnFail(urlDicomFolder, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
  console.log('Dicom folder os loaded');
}

function callbackLoadLocalDicomFolder(files) {
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }

  // check try to open single dicom file: this is strange for 1st version:
  // Assumed, that application works with volumes (series of dicom files) but not
  // with single dicom file (like another competitor apps do)
  const numFiles = files.length;
  if (numFiles <= 1) {
    const str1 = 'You have tried to open SINGLE dicom file.\n';
    const str2 = 'App is not supported single 2d slice image.\n';
    const str3 = 'Only full 3d volumes can be processed.\n';
    const str4 = 'Use SHIFT key in file dialog to open complete dicom folder.';
    const str = str1.concat(str2, str3, str4);
    // console.log(str);
    swal({
      title: 'Dicom folder load failed!',
      text: str,
      icon: 'warning',
      button: 'continue',
    });
    return;
  }
  // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
  const needScaleDownTexture = true;
  const loaderDicom = new DicomFolderLoader(needScaleDownTexture);
  menu.startProgressBar();
  loaderDicom.readFiles(files, (status, header, dataSize, dataArray) => {
    if (status === LoadResult.SUCCESS) {
      dicomOnSucces(files[0].name, loaderDicom, header, dataSize, dataArray);
    } else {
      console.log('Error loading dicom data');
      dicomOnFail(files[0].name, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}

// ******************************************************************
// Load KTX file callback
// ******************************************************************

/** Successull load KTX file callback */
function ktxOnSuccess(dataName, loader, header, dataSize, dataArray) {
  const hd = loader.m_header;
  console.log(`Success loading KTX: ${dataName} dim=${hd.m_pixelWidth}*${hd.m_pixelHeight}*${hd.m_pixelDepth}`);
  const box = loader.getBoxSize();
  /** @property {object} m_boxSize - vertex3f with physic volume dimension */
  const nonEmptyBoxMin = {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  };
  const nonEmptyBoxMax = {
    x: 1.0,
    y: 1.0,
    z: 1.0,
  };
  engine2d.m_volumeHeader = header;
  engine2d.m_volumeData = dataArray;
  engine2d.m_volumeBox = box;
  engine2d.m_volumeInfo = null;

  if (engine2d.m_volumeData === null) {
    console.log('BAD null volume data array');
  } else {
    menu.stopProgressBar();
    engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax);
    engine2d.createTileMapsWithTexture(engine3d.volTexture);
    callbackFileLoaded();
  }
}
/** Failed load KTX file callback */
function ktxOnFail(dataName, status) {
  const strTitle = `Error loading: ${dataName}`;
  const strMessage = LoadResult.getResultString(status);
  menu.stopProgressBar();
  swal({
    title: strTitle,
    text: strMessage,
    icon: 'error',
    button: 'continue',
  });
}

/** Load KTX volume (lungs data) from URL */
function callbackLoadKtxFile(strUrl) {
  if (strUrl.length < 1) {
    return;
  }
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }
  console.log(`Now loading from URL ${strUrl} ...`);
  menu.startProgressBar();
  loaderKtx = new KtxLoader();
  loaderKtx.readFromURL(strUrl, (status, header, dataSize, dataArray) => {
    if (status === LoadResult.SUCCESS) {
      ktxOnSuccess(strUrl, loaderKtx, header, dataSize, dataArray);
    } else {
      ktxOnFail(strUrl, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}

/** Load KTX volume from local file */
function callbackLoadLocalKtxFile(file) {
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }
  console.log(`Now loading from local file ${file.name} ...`);

  menu.startProgressBar();
  loaderKtx = new KtxLoader();
  loaderKtx.readFromFile(file, (status, header, dataSize, dataArray) => {
    if (status === LoadResult.SUCCESS) {
      ktxOnSuccess(file.name, loaderKtx, header, dataSize, dataArray);
    } else {
      ktxOnFail(file.name, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}

// ******************************************************************
// Load NIFTI file callback
// ******************************************************************

/** Successull load nifti file callback */
function niftiOnSuccess(dataName, loader, header, dataSize, dataArray) {
  const hx = header.m_pixelWidth;
  const hy = header.m_pixelHeight;
  const hz = header.m_pixelDepth;
  console.log(`Success loading Nifti: ${dataName} dim = ${hx} * ${hy} * ${hz}`);
  const box = loader.getBoxSize();
  const nonEmptyBoxMin = {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  };
  const nonEmptyBoxMax = {
    x: 1.0,
    y: 1.0,
    z: 1.0,
  };
  engine2d.m_volumeHeader = header;
  engine2d.m_volumeData = dataArray;
  engine2d.m_volumeBox = box;
  engine2d.m_volumeInfo = loader.getDicomInfo();

  if (engine2d.m_volumeData === null) {
    console.log('BAD null volume data array');
  } else {
    menu.stopProgressBar();
    engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax);
    engine2d.createTileMapsWithTexture(engine3d.volTexture);
    callbackFileLoaded();
  }
}

/** Failed load nifti file callback */
function niftiOnFail(dataName, status) {
  const strTitle = `Error loading: ${dataName}`;
  const strMessage = LoadResult.getResultString(status);
  menu.stopProgressBar();
  swal({
    title: strTitle,
    text: strMessage,
    icon: 'error',
    button: 'continue',
  });
}

/** Load nifti volume from local file */
function callbackLoadLocalNiftiFile(file) {
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }
  console.log(`Now loading from local Nifti file ${file.name} ...`);
  menu.startProgressBar();
  // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
  const needScaleDownTexture = true;
  const loaderNifti = new NiftiLoader(needScaleDownTexture);
  loaderNifti.readFromFile(file, (status, header, dataSize, dataArray) => {
    if (status === LoadResult.SUCCESS) {
      niftiOnSuccess(file.name, loaderNifti, header, dataSize, dataArray);
    } else {
      niftiOnFail(file.name, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}
function callbackLoadNiftiFile(url) {
  if (url.length < 1) {
    return;
  }
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }

  console.log(`Now loading Nifti from URL ${url} ...`);

  menu.startProgressBar();
  // console.log(`max texture size: ${engine3d.maxTextureSize} ...`);
  // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
  const needScaleDownTexture = true;
  const loaderNifti = new NiftiLoader(needScaleDownTexture);
  loaderNifti.readFromURL(url, (status, header, dataSize, dataArray) => {
    if (status === LoadResult.SUCCESS) {
      niftiOnSuccess(url, loaderNifti, header, dataSize, dataArray);
    } else {
      niftiOnFail(url, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}

// ******************************************************************
// Hdr format loading
// ******************************************************************

/** Successull load hdr file callback */
function hdrOnSuccess(dataName, loader, header, dataSize, dataArray, isRoiVolume) {
  const hx = header.m_pixelWidth;
  const hy = header.m_pixelHeight;
  const hz = header.m_pixelDepth;
  console.log(`Success loading Hdr: ${dataName} dim = ${hx} * ${hy} * ${hz}. isRoi:${isRoiVolume}`);
  const box = loader.getBoxSize();
  const nonEmptyBoxMin = {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  };
  const nonEmptyBoxMax = {
    x: 1.0,
    y: 1.0,
    z: 1.0,
  };
  engine2d.m_volumeHeader = header;
  engine2d.m_volumeData = dataArray;
  engine2d.m_volumeBox = box;
  engine2d.m_volumeInfo = loader.getDicomInfo();

  if (engine2d.m_volumeData === null) {
    console.log('BAD null volume data array');
  } else {
    menu.stopProgressBar();
    engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax, isRoiVolume);
    engine2d.createTileMapsWithTexture(engine3d.volTexture, isRoiVolume);
    callbackFileLoaded();
  }
}

/** Failed load hdr file callback */
function hdrOnFail(dataName, status) {
  const strTitle = `Error loading: ${dataName}`;
  const strMessage = LoadResult.getResultString(status);
  menu.stopProgressBar();
  swal({
    title: strTitle,
    text: strMessage,
    icon: 'error',
    button: 'continue',
  });
}

/** Load hdr volume from local files */
function callbackLoadLocalHdrFiles(files) {
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }
  const numFiles = files.length;
  const NUM_FILES_IN_PAIR = 2;
  if (numFiles !== NUM_FILES_IN_PAIR) {
    console.log(`HDR. Should be 2 files but found ${numFiles} ...`);
    return;
  }

  menu.startProgressBar();
  // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
  const needScaleDownTexture = true;
  const loaderHdr = new HdrLoader(needScaleDownTexture);
  for (let i = 0; i < numFiles; i++) {
    const file = files[i];
    console.log(`Now loading from local Hdr file ${file.name} ...`);
  }

  loaderHdr.readFromFiles(files, (status, header, dataSize, dataArray, isRoiVolume) => {
    if (status === LoadResult.SUCCESS) {
      hdrOnSuccess(files[0].name, loaderHdr, header, dataSize, dataArray, isRoiVolume);
    } else {
      hdrOnFail(files[0].name, status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}
function callbackLoadHdrFiles(strFileNameHead) {
  if (strFileNameHead.length < 1) {
    return;
  }
  const canOpen = !isChromeAndFile();
  if (!canOpen) {
    swal({
      title: 'Error',
      text: 'Cant open local file with this browser',
      icon: 'error',
      button: 'continue',
    });
    return;
  }

  const urls = [];
  const strFileNameImg = strFileNameHead.replace('.h', '.img');
  urls.push(strFileNameHead);
  urls.push(strFileNameImg);


  menu.startProgressBar();
  // console.log(`max texture size: ${engine3d.maxTextureSize} ...`);
  // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
  const needScaleDownTexture = true;
  const loaderHdr = new HdrLoader(needScaleDownTexture);
  loaderHdr.readFromURLS(urls, (status, header, dataSize, dataArray, isRoiVolume) => {
    if (status === LoadResult.SUCCESS) {
      hdrOnSuccess(urls[0], loaderHdr, header, dataSize, dataArray, isRoiVolume);
    } else {
      hdrOnFail(urls[0], status);
    }
  }, (ratioLoaded) => {
    console.log(`Loading ratio = ${ratioLoaded}`);
    menu.updateProgressBar(ratioLoaded);
  });
}

// ******************************************************************
// 2D Scene
// ******************************************************************

/** Init 2d scene rendering */
function initScene2d() {
  // сonst w = $(root3dContainer).width() - 2;
  // const h = $(root3dContainer).height() - 4 - 2; // '-2' is for borders, will be removed later
  const w = Math.floor(root2dContainer.width());
  // const h = Math.floor(root2dContainer.height()) - 5.0;
  const h = Math.floor(root2dContainer.height());
  engine2d = new Graphics2d(root2dContainer, w, h);
  // mouse callback
  root2dContainer.on('mousedown', (evt) => {
    if (menu.curModeSuffix === '2d') {
      const x = evt.offsetX + 0.0;
      const y = evt.offsetY + 0.0;
      const xScr = x / w;
      const yScr = y / h;
      engine2d.onMouseDown(xScr, yScr);
    }
  });
  root2dContainer.on('mousemove', (evt) => {
    if (menu.curModeSuffix === '2d') {
      const x = evt.offsetX + 0.0;
      const y = evt.offsetY + 0.0;
      const xScr = x / w;
      const yScr = y / h;
      engine2d.onMouseMove(xScr, yScr);
    }
  });
}

// ******************************************************************
// 3D Scene
// ******************************************************************


/** Create 3d scene with default torus geometry object */
function initScene3d() {
  // check web gl
  const glcheck = new GlCheck();
  const supportedFlags = glcheck.getSupportedFlags();
  const webglVersion = glcheck.getWebglVersion();
  const webglRenderer = glcheck.getWebglRenderer();
  const maxTextureSize = glcheck.getMaxTextureSize();

  if (supportedFlags !== GlCheck.SUPPORT_ALL) {
    const strSupportTextFloatLin =
      ((supportedFlags & GlCheck.SUPPORT_FLAG_TEXTURE_FLOAT_LINEAR) !== 0) ? 'YES' : 'NO';
    const strSupportFiltAni = ((supportedFlags & GlCheck.SUPPORT_FLAG_FILTER_ANI) !== 0) ? 'YES' : 'NO';
    const strSupportIndexUint = ((supportedFlags & GlCheck.SUPPORT_FLAG_INDEX_UINT) !== 0) ? 'YES' : 'NO';

    const strTextFloatLin = `OES_texture_float_linear = ${strSupportTextFloatLin}`;
    const strFiltAni = `EXT_texture_filter_anisotropic = ${strSupportFiltAni}`;
    const strIndexUint = `OES_element_index_uint = ${strSupportIndexUint}`;

    const strGlVersion = `WebGL version = ${webglVersion}\nWebGL renderer = ${webglRenderer}`;
    const strLog = `App cant run on this browser/device due to low 
      WebGL capabilities:\n${strTextFloatLin}\n${strFiltAni}\n${strIndexUint}\n${strGlVersion}`;
    // console.log(strLog);
    const strTitle1 = 'Med3web is designed for Chrome/Firefox/Safari browsers.';
    const strTitle2 = 'The application can be slow or unstable in this web browser.';
    const strTitleFinal = `${strTitle1} ${strTitle2}`;
    swal({
      title: strTitleFinal,
      text: strLog,
      icon: 'warning',
      button: 'continue',
    });
    return false;
  }
  engine3d = new Graphics3d(engine2d, root3dContainer, curFileDataType, maxTextureSize);
  return true;
}

/** Setup animation for all DOM elements: 2d and 3d containters */
function animateRender() {
  requestAnimationFrame(animateRender);
  if (engine3d === null) {
    return;
  }
  if (document.hasFocus()) {
    if (menu !== null) {
      menu.updateInfoContainer();
      if (menu.curModeSuffix === '3d') {
        switch (engine3d.renderState) {
          case engine3d.RENDER_STATE.ENABLED:
            engine3d.render();
            break;
          case engine3d.RENDER_STATE.ONCE:
            engine3d.render();
            engine3d.renderState = engine3d.RENDER_STATE.DISABLED;
            break;
          default:
        }
      }
      if (menu.curModeSuffix === '2d') {
        engine2d.render();
      }
    } // if menu exist
  } // if app window has focus
} // func animateRender

/** Performed once during main web page load */
function onPageLoad() {
  if (this !== window) {
    console.log('This is NOT window context!');
  }

  // check browser/device
  const browserChecker = new BrowserDetector();
  const isValid = browserChecker.checkValidBrowser();
  if (!isValid) {
    console.log('Found non valid browser');
  }

  curFileDataType = slider3dInitVal.undefined;

  initScene2d();
  const okInit3d = initScene3d();
  if (!okInit3d) {
    return;
  }

  menu = new Menu(engine2d, engine3d);

  $(this).on('loadFile', (event) => {
    const dataType = event.detail.dataType;
    curFileDataType = slider3dInitVal[dataType];
    if (engine3d) {
      engine3d.setFileDataType(curFileDataType);
    }
    const fileType = event.detail.fileType;
    switch (fileType) {
      case loadFileType.DICOM:
        callbackLoadDicomFolder(event.detail.data);
        break;
      case loadFileType.LOCALDICOM:
        callbackLoadLocalDicomFolder(event.detail.data);
        break;
      case loadFileType.KTX:
        callbackLoadKtxFile(event.detail.data);
        break;
      case loadFileType.LOCALKTX:
        callbackLoadLocalKtxFile(event.detail.data);
        break;
      case loadFileType.LOCALNIFTI:
        callbackLoadLocalNiftiFile(event.detail.data);
        break;
      case loadFileType.NIFTI:
        callbackLoadNiftiFile(event.detail.data);
        break;
      case loadFileType.LOCALHDR:
        callbackLoadLocalHdrFiles(event.detail.data);
        break;
      case loadFileType.HDR:
        callbackLoadHdrFiles(event.detail.data);
        break;
      default:
        console.log('Unexpected load file type');
        break;
    }
  });

  $(this).on('newTag', (event) => {
    menu.onNewTag(event.detail.group,
      event.detail.element,
      event.detail.desc,
      event.detail.value,
      event.detail.imageNumber,
      event.detail.fileName);
  });

  // Load default volume
  callbackLoadKtxFile(config.data.onloadsrc);

  animateRender();
}

/** Load main function action */
window.onload = onPageLoad;
