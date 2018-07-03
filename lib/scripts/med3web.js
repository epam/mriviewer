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
* Local binary file loader
* @module lib/scripts/med3web
*/

// absolute imports
import jQuery from 'jquery';
import swal from 'sweetalert';

// app imports
import Graphics2d from './graphics2d/graphics2d';
import Graphics3d from './graphics3d/graphics3d';
import MprRenderer from './graphics2d/mprrenderer';
import GlCheck from './graphics3d/glcheck';
import BrowserDetector from './utils/browserdetector';

import KtxLoader from './loaders/ktxloader';
import DicomFolderLoader from './loaders/dicomloader';
import NiftiLoader from './loaders/niiloader';
import HdrLoader from './loaders/hdrloader';

import LoadResult from './loaders/loadresult';

import ActiveVolume from './actvolume/actvol';

// ******************************************************************
// Local file loader
// ******************************************************************

window.jQuery = window.$ = jQuery;

// eslint-disable-next-line
const MPI05 = Math.PI * 0.5;

/** File types for load */
export const loadFileType = {
  NA: 'not assigned',
  LOCALKTX: 'local ktx',
  LOCALDICOM: 'local dicom',
  LOCALNIFTI: 'local nifti',
  LOCALHDR: 'local hdr',
  LOCALIMG: 'local img',
  KTX: 'ktx',
  DICOM: 'dicom',
  NIFTI: 'nifti',
  HDR: 'hdr',
  IMG: 'img',
};

/** Render mode (2d, 3d, Mpr) */
export const RenderMode = {
  RENDER_MODE_2D: 0,
  RENDER_MODE_3D: 1,
  RENDER_MODE_MPR: 2,
};

export const LoadState = {
  LOAD_STATE_NA: 0,
  LOAD_STATE_LOADING: 1,
  LOAD_STATE_READY: 2,
};

/** Class Med3Web implements render library (2d and 3d) */
export default class Med3Web {
  /**
  * Constructor
  *
  * opts object properties:
  * container3d (object) dom element fro 3d render
  * container2d (object) dom element fro 2d render
  * loadUrlFile: string with url or filename
  * loadType: see loadFileType
  * menu: Menu
  */
  constructor(opts) {
    if (typeof opts === 'undefined') {
      console.log('Med3Web constructor has no params');
    }
    // print all options to console
    // for (const prop in opts) {
    //   if (opts.hasOwnProperty(prop)) {
    //     console.log(`opts prop = ${prop}`);
    //   }
    // }

    if (opts &&  (typeof opts.container3d === 'undefined')) {
      console.log('Med3Web constructor opts should have container3d ref');
    }
    if (opts &&  (typeof opts.container2d === 'undefined')) {
      console.log('Med3Web constructor opts should have container2d ref');
    }
    if (opts &&  (typeof opts.loadUrlFile === 'undefined')) {
      console.log('Med3Web constructor opts should have loadUrlFile - string');
    }
    if (opts &&  (typeof opts.loadUrlFile !== 'undefined')) {
      console.log(`opts.loadUrlFile = ${opts.loadUrlFile}`);
    }
    if (opts &&  (typeof opts.loadType === 'undefined')) {
      console.log('Med3Web constructor opts should have loadType');
    }
    if (opts &&  (typeof opts.loadType !== 'undefined')) {
      console.log(`opts.loadType = ${opts.loadType}`);
    }

    this.m_options = opts;
    /** Reference to html dom element for 3d rendering */
    this.m_container3d = (opts && opts.container3d) || $('#med3web-container-3d');
    /** Reference to html dom element for 2d rendering */
    this.m_container2d = (opts && opts.container2d) || $('#med3web-container-2d');
    /** Reference to html dom element for mpr rendering */
    this.m_containerMpr = $('#med3web-container-mpr');
    /** Load state */
    this.m_loadState = LoadState.LOAD_STATE_NA;
    /** Engine to render 3d graphics */
    this.m_engine3d = null;
    /** Engine to render 2d graphics */
    this.m_engine2d = null;
    /** Engine to render MPR mode 2d graphics */
    this.m_engineMpr = null;
    /** Is in 3d mode or 2d mode (default) */
    this.m_renderMode = RenderMode.RENDER_MODE_2D;
    /** Default settings for render values, used in shader */
    this.m_fileDataType = {
      thresholdIsosurf: 0.46,
      thresholdTissue1: 0.09,
      thresholdTissue2: 0.30,
      opacityTissue: 0.53,
      startRotX: -MPI05,
      startRotY: Math.PI,
      lightDirComp: -0.5773,
      brightness: 0.56,
    };
    /** Special ID to stop requests for render */
    this.m_animRequestId = 0;
    /** Menu reference to inform menu that data was loaded */
    this.m_menu = null;
    if (opts && opts.menuUI) {
      this.m_menu = opts.menuUI;
    }
  }

  /**
  * Merge 2 textures (intensity + roi mask) into a single one.
  * @param {number} xDim Dimension on x
  * @param {number} yDim Dimension on y
  * @param {number} zDim Dimension on z
  * @param {array} volIntensity volume 1-byte array with intensities
  * @param {array} volMask volume 1-byte array with mask (0 or 255)
  */
  combineWithRoiTexture(xDim, yDim, zDim, volIntensity, volMask) {
    const BYTES_IN_RGBA = 4;
    const numPixels = xDim * yDim * zDim;
    const volNew = new Uint8Array(numPixels * BYTES_IN_RGBA);
    const OFF0 = 0; const OFF1 = 1;
    const OFF2 = 2; const OFF3 = 3;
    const ROI_MAGIC_BACK = 0;
    const ROI_MAGIC_BRAIN = 62;
    const ROI_MAGIC_SKULL = 250;
    let j = 0;
    for (let i = 0; i < numPixels; i++, j += BYTES_IN_RGBA) {
      const volInt = volIntensity[i];
      const msk = volMask[i];

      let volRoi = ROI_MAGIC_BACK;
      if (volInt > 0) {
        volRoi = (msk !== 0) ? ROI_MAGIC_BRAIN : ROI_MAGIC_SKULL;
      }
      volNew[j + OFF0] = volInt;
      volNew[j + OFF1] = 0;
      volNew[j + OFF2] = 0;
      volNew[j + OFF3] = volRoi;
    }
    return volNew;
  }

  /**
  * Remove skull from brain volumetric image
  */
  performSkullRemove() {
    const gra = this.m_engine2d;
    let volTextureSrc = gra.m_volumeData;
    let xDim = gra.m_volumeHeader.m_pixelWidth;
    let yDim = gra.m_volumeHeader.m_pixelHeight;
    let zDim = gra.m_volumeHeader.m_pixelDepth;
    const TWICE = 2;
    if (zDim < xDim / TWICE) {
      const xNew = xDim >> 1;
      const yNew = yDim >> 1;
      const zNew = zDim << 1;
      const volTexNew = Graphics2d.rescale(xDim, yDim, zDim, volTextureSrc, xNew, yNew, zNew);
      volTextureSrc = volTexNew;
      xDim = xNew; yDim = yNew;
      zDim = zNew;
      this.m_engine2d.m_volumeHeader.m_pixelWidth = xDim;
      this.m_engine2d.m_volumeHeader.m_pixelHeight = yDim;
      this.m_engine2d.m_volumeHeader.m_pixelDepth = zDim;
    }
    // console.log(`performSkullRemove. vol = ${xDim}*${yDim}*${zDim}...`);

    const xyzDim = xDim * yDim * zDim;
    const volTextureDst = new Uint8Array(xyzDim);
    const NEED_LOG = true;
    const CREATE_TYPE = ActiveVolume.REMOVE_SKULL;
    const actVolume = new ActiveVolume();
    const resSkullRem =
      actVolume.skullRemove(xDim, yDim, zDim, volTextureSrc, volTextureDst, CREATE_TYPE, NEED_LOG);
    if (resSkullRem !== 1) {
      console.log(`Bad skullRemove result = ${resSkullRem}`);
    }
    let isRoiVolume = false;

    if (CREATE_TYPE === ActiveVolume.CREATE_MASK) {
      // now create argb texture with intensity and roi
      isRoiVolume = true;
      const newDataArray = this.combineWithRoiTexture(xDim, yDim, zDim, volTextureSrc, volTextureDst);
      // const isRoiVolume = false;
      // const newDataArray = volTextureDst;

      // start create data for render
      this.m_engine2d.m_volumeData = newDataArray;

      // create header for ARGB data (4 bytes per voxel, not 1 byte)
      const KTX_GL_RGBA = 0x1908;
      const KTX_UNSIGNED_BYTE = 0x1401;
      const header = {
        m_pixelWidth: xDim,
        m_pixelHeight: yDim,
        m_pixelDepth: zDim,
        m_glType: KTX_UNSIGNED_BYTE,
        m_glTypeSize: 1,
        m_glFormat: KTX_GL_RGBA,
        m_glInternalFormat: KTX_GL_RGBA,
        m_glBaseInternalFormat: KTX_GL_RGBA,
      };
      this.m_engine2d.m_volumeHeader = header;
    } else if (CREATE_TYPE === ActiveVolume.REMOVE_SKULL) {
      // create header for 1-byte greyscale data
      this.m_engine2d.m_volumeData = volTextureDst;
      const KTX_GL_RED = 0x1903;
      const KTX_UNSIGNED_BYTE = 0x1401;
      const header = {
        m_pixelWidth: xDim,
        m_pixelHeight: yDim,
        m_pixelDepth: zDim,
        m_glType: KTX_UNSIGNED_BYTE,
        m_glTypeSize: 1,
        m_glFormat: KTX_GL_RED,
        m_glInternalFormat: KTX_GL_RED,
        m_glBaseInternalFormat: KTX_GL_RED,
      };
      this.m_engine2d.m_volumeHeader = header;
    }

    const box = this.m_engine2d.m_volumeBox;
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
    this.m_engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax, isRoiVolume);
    this.m_engine2d.createTileMapsWithTexture(this.m_engine3d.volTexture, isRoiVolume);
    this.m_engineMpr.create();
    this._callbackFileLoaded();
  }

  // ******************************************************************
  // 2D Scene
  // ******************************************************************

  /** Init 2d scene rendering */
  _initScene2d() {
    if (this.m_container2d === null) {
      return false;
    }
    const w2d = Math.floor(this.m_container2d.width());
    const h2d = Math.floor(this.m_container2d.height());
    this.m_engine2d = new Graphics2d(this.m_container2d, w2d, h2d);
    const wMpr = Math.floor(this.m_containerMpr.width());
    const hMpr = Math.floor(this.m_containerMpr.height());
    this.m_engineMpr = new MprRenderer(this.m_containerMpr, wMpr, hMpr, this.m_engine2d);

    // mouse callback
    this.m_container2d.on('mousedown', (evt) => {
      if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        const x = evt.offsetX + 0.0;
        const y = evt.offsetY + 0.0;
        const xScr = x / w2d;
        const yScr = y / h2d;
        this.m_engine2d.onMouseDown(xScr, yScr);
      }
    });
    this.m_container2d.on('mousemove', (evt) => {
      if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        const x = evt.offsetX + 0.0;
        const y = evt.offsetY + 0.0;
        const xScr = x / w2d;
        const yScr = y / h2d;
        this.m_engine2d.onMouseMove(xScr, yScr);
      }
    });
    this.m_container2d.on('mouseup', (evt) => {
      if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        const x = evt.offsetX + 0.0;
        const y = evt.offsetY + 0.0;
        const xScr = x / w2d;
        const yScr = y / h2d;
        this.m_engine2d.onMouseUp(xScr, yScr);
      }
    });
    this.m_container2d.on('mousewheel', (evt) => {
      if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        const wheelDeltaY = evt.originalEvent.deltaY;
        console.log(evt.originalEvent.wheelDeltaY);
        this.m_engine2d.onMouseWheel(wheelDeltaY);
      }
    });
    this.m_container2d.on('wheel', (evt) => {
      const OLD_WHEEL_SCALE = 25;
      if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        const wheelDeltaY = evt.originalEvent.deltaY * OLD_WHEEL_SCALE;
        console.log(evt.originalEvent.wheelDeltaY);
        this.m_engine2d.onMouseWheel(wheelDeltaY);
      }
    });
    // keyboard callback
    document.addEventListener('keydown', (evt) => {
      const DEBUG_MODE = true;//false;
      if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        this.m_engine2d.onKeyDown(evt.keyCode, DEBUG_MODE);
        // some incomplete feature: remove skull by pressing C key on keyboard
        const KEY_CODE_C = 67;
        if (evt.keyCode === KEY_CODE_C) {
          this.performSkullRemove();
        }

      } else if (this.m_renderMode === RenderMode.RENDER_MODE_3D) {
        this.m_engine3d.onKeyDown(evt.keyCode, DEBUG_MODE);
      } else if (this.m_renderMode === RenderMode.RENDER_MODE_MPR) {
        this.m_engineMpr.onKeyDown(evt.keyCode, DEBUG_MODE);
      }
    });
    return true;
  }

  // ******************************************************************
  // 3D Scene
  // ******************************************************************

  /** Create 3d scene with default torus geometry object */
  _initScene3d() {
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
      const strLog = `App cant run on this browser/device due to low WebGL 
        capabilities:\n${strTextFloatLin}\n${strFiltAni}\n${strIndexUint}\n${strGlVersion}`;
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
    this.m_engine3d = new Graphics3d(this.m_engine2d,
      this.m_container3d, this.m_fileDataType, maxTextureSize);
    return true;
  }

  /** Action on every tick: update, render */
  _onTick() {
    // create request for animation
    this.m_animRequestId = requestAnimationFrame(() => {
      this._onTick();
    }); // callback for animation frame request

    if (this.m_engine3d === null) {
      return;
    }
    if (document.hasFocus() && (this.m_loadState === LoadState.LOAD_STATE_READY)) {
      if (this.m_renderMode === RenderMode.RENDER_MODE_3D) {
        // 3d render invoke
        switch (this.m_engine3d.renderState) {
          case this.m_engine3d.RENDER_STATE.ENABLED:
            this.m_engine3d.render();
            break;
          case this.m_engine3d.RENDER_STATE.ONCE:
            this.m_engine3d.render();
            this.m_engine3d.renderState = this.m_engine3d.RENDER_STATE.DISABLED;
            break;
          default:
        }
      } else if (this.m_renderMode === RenderMode.RENDER_MODE_2D) {
        // 2d render invoke
        this.m_engine2d.render(Graphics2d.RENDER_AS_2D);
      } else if (this.m_renderMode === RenderMode.RENDER_MODE_MPR) {
        // MPR render invoke
        this.m_engineMpr.render();
      }
    } // if app window has focus
  }

  /** Start animation */
  _run() {
    // _animCallback();
    this.m_animRequestId = requestAnimationFrame(() => {
      this._onTick();
    }); // callback for animation frame request
  } // _run

  /** Setup render structure (see this.m_fileDataType)*/
  setCurFileDataType(dataType) {
    if (typeof dataType === 'undefined') {
      consoloe.log('Med3Web.setCurFileDataType should have structure as a parameter');
      return false;
    }
    Object.assign(this.m_fileDataType, dataType);
    this.m_engine3d.setFileDataType(this.m_fileDataType);
    return true;
  }
  setLoadState(state) {
    if (typeof state === 'undefined') {
      console.log('Med3Web.setRenderState should have parameter of renderState type');
      return false;
    }
    this.m_loadState = state;
    return true;
  }
  getLoadState() {
    return this.m_loadState;
  }
  /** Setup mode: true: 3d mode, false = 2d mode */
  setRenderMode(mode) {
    if (typeof mode === 'undefined') {
      consoloe.log('Med3Web.setRenderMode should have parameter of RenderMode type');
      return false;
    }
    this.m_renderMode = mode;
    return true;
  }

  /** Create all renderers (2d and 3d) and run */
  init() {
    // check browser type is supported
    const browserChecker = new BrowserDetector();
    const isValid = browserChecker.checkValidBrowser();
    if (!isValid) {
      console.log('Found non valid browser');
      return false;
    }
    this._initScene2d();
    const okInit3d = this._initScene3d();
    if (!okInit3d) {
      return false;
    }
    let okLoadScene = true;
    if (this.m_options && this.m_options.loadUrlFile && (this.m_options.loadUrlFile.length > 1)) {
      okLoadScene = this.loadScene(this.m_options.loadUrlFile, this.m_options.loadType);
      if (!okLoadScene) {
        swal({
          title: 'Error load',
          text: 'Cant read scene',
          icon: 'error',
          button: 'continue',
        });
      }
    } else {
      console.log('Med3Web.init without load scene');
    }
    this._run();
    return okLoadScene;
  }

  /** Destroy all */
  term() {
    this.m_engine3d = null;
    this.m_engine2d = null;
    this.m_engineMpr = null;
    cancelAnimationFrame(this.m_animRequestId);
  }

  /** Get screen copy */
  getScreenshot(width, height) {
    if (this.m_engine3d) {
      if (width === 'undefined') {
        const W_SHOT = 128;
        const H_SHOT = 128;
        return this.m_engine3d.screenshot(W_SHOT, H_SHOT);
      } else {
        return this.m_engine3d.screenshot(width, height);
      }
    }
    return null;
  }

  /** Load scene */
  loadScene(urlFile, fileType) {
    let okLoad = false;
    this.setLoadState(LoadState.LOAD_STATE_LOADING);
    switch (fileType) {
      case loadFileType.DICOM:
        okLoad = this._callbackLoadDicomFolder(urlFile);
        break;
      case loadFileType.LOCALDICOM:
        okLoad = this._callbackLoadLocalDicomFolder(urlFile);
        break;
      case loadFileType.KTX:
        okLoad = this._callbackLoadKtxFile(urlFile);
        break;
      case loadFileType.LOCALKTX:
        okLoad = this._callbackLoadLocalKtxFile(urlFile);
        break;
      case loadFileType.LOCALNIFTI:
        okLoad = this._callbackLoadLocalNiftiFile(urlFile);
        break;
      case loadFileType.NIFTI:
        okLoad = this._callbackLoadNiftiFile(urlFile);
        break;
      case loadFileType.LOCALHDR:
        okLoad = this._callbackLoadLocalHdrFiles(urlFile);
        break;
      case loadFileType.HDR:
        okLoad = this._callbackLoadHdrFiles(urlFile);
        break;
      default:
        console.log('Unexpected load file type');
        break;
    }
    return okLoad;
  } // end loadScene

  // ****************************************************************
  // Loaders
  // Dicom loader
  // ****************************************************************

  /**Check Chrome browser and file: protocol scheme
    to avoid possibility to open local file
  */
  _isChromeAndFile() {
    // console.log(`document.location.protocol = ${document.location.protocol}`);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
      && !/Chromium/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    return isChrome && (document.location.protocol === 'file:');
  }

  /** Finalize open file */
  _callbackFileLoaded() {
    if (this.m_menu) {
      this.m_menu.onFileLoaded(this.m_fileDataType);
    }
    if (this.m_engine2d) {
      this.m_engine2d.onFileLoaded();
    }
    if (this.m_engine3d) {
      this.m_engine3d.renderState = this.m_engine3d.RENDER_STATE.ENABLED;
    }
    if (this.m_engineMpr) {
      this.m_engineMpr.onFileLoaded();
    }
    this.setLoadState(LoadState.LOAD_STATE_READY);
  }
  /** if read dicom folder success */
  _dicomOnSucces(dataName, loader, header, dataSize, dataArray) {
    const xd =  header.m_pixelWidth;
    const yd =  header.m_pixelHeight;
    const zd =  header.m_pixelDepth;
    console.log(`Success loading Dicom: ${dataName} dim=${xd}*${yd}*${zd}`);
    const box = loader.getBoxSize();
    const nonEmptyBoxMin = loader.getNonEmptyBoxMin();
    const nonEmptyBoxMax = loader.getNonEmptyBoxMax();
    this.m_engine2d.m_volumeHeader = header;
    this.m_engine2d.m_volumeData = dataArray;
    this.m_engine2d.m_volumeBox = box;
    this.m_engine2d.m_volumeInfo = loader.getDicomInfo();
    if (this.m_engine2d.m_volumeData === null) {
      console.log('BAD null volume data array');
    } else {
      if (this.m_menu) {
        this.m_menu.stopProgressBar();
      }
      this.m_engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax);
      this.m_engine2d.createTileMapsWithTexture(this.m_engine3d.origVolumeTex);
      this.m_engineMpr.create();
      this._callbackFileLoaded();
    }
  }
  /** if read dicom folder failed */
  _dicomOnFail(dataName, status) {
    const strTitle = `Error loading: ${dataName}`;
    const strMessage = LoadResult.getResultString(status);
    if (this.m_menu) {
      this.m_menu.stopProgressBar();
    }
    swal({
      title: strTitle,
      text: strMessage,
      icon: 'error',
      button: 'continue',
    });
  }

  /** read  dicom folder via URL*/
  _callbackLoadDicomFolder(urlDicomFolder) {
    if (typeof urlDicomFolder === 'undefined') {
      console.log('should be folder');
      return false;
    }
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }
    const needScaleDownTexture = true;
    const loaderDicom = new DicomFolderLoader(needScaleDownTexture);
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    const okLoad = loaderDicom.readFolder(urlDicomFolder, (status, header, dataSize, dataArray) => {
      if (status === LoadResult.SUCCESS) {
        this._dicomOnSucces(urlDicomFolder, loaderDicom, header, dataSize, dataArray);
      } else {
        console.log('Error load dicom folder');
        this._dicomOnFail(urlDicomFolder, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    if (okLoad) {
      console.log('Dicom folder os loaded');
      return true;
    } else {
      console.log('Dicom folder read error');
      return false;
    }
  }

  /** read local dicom folder */
  _callbackLoadLocalDicomFolder(files) {
    if (typeof files === 'undefined') {
      console.log('should be array as argument');
      return false;
    }
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
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
      return false;
    }
    // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
    const needScaleDownTexture = true;
    const loaderDicom = new DicomFolderLoader(needScaleDownTexture);
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    loaderDicom.readFiles(files, (status, header, dataSize, dataArray, incorrectFileName) => {
      if (status === LoadResult.SUCCESS) {
        this._dicomOnSucces(files[0].name, loaderDicom, header, dataSize, dataArray);
      } else {
        console.log('Error loading dicom data');
        this._dicomOnFail(incorrectFileName || files[0].name, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  }

  // ******************************************************************
  // Load KTX file callback
  // ******************************************************************

  /** If loading KTX succeded */
  _ktxOnSuccess(dataName, loader, header, dataSize, dataArray) {
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
    this.m_engine2d.m_volumeHeader = header;
    this.m_engine2d.m_volumeData = dataArray;
    this.m_engine2d.m_volumeBox = box;
    this.m_engine2d.m_volumeInfo = null;

    if (this.m_engine2d.m_volumeData === null) {
      console.log('BAD null volume data array');
    } else {
      if (this.m_menu) {
        this.m_menu.stopProgressBar();
      }
      this.m_engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax);
      this.m_engine2d.createTileMapsWithTexture(this.m_engine3d.origVolumeTex);
      this.m_engineMpr.create();
      this._callbackFileLoaded();
    }
  }
  /** If loading KTX failed */
  _ktxOnFail(dataName, status) {
    const strTitle = `Error loading: ${dataName}`;
    const strMessage = LoadResult.getResultString(status);
    if (this.m_menu) {
      this.m_menu.stopProgressBar();
    }
    swal({
      title: strTitle,
      text: strMessage,
      icon: 'error',
      button: 'continue',
    });
  }
  /** Load remote KTX volume from URL */
  _callbackLoadKtxFile(strUrl) {
    if (typeof strUrl === 'undefined') {
      console.log('argument should be string with url');
      return false;
    }
    if (strUrl.length < 1) {
      console.log('argument should be string non zero length');
      return false;
    }
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }
    console.log(`Now loading from URL ${strUrl} ...`);
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    const loaderKtx = new KtxLoader();
    loaderKtx.readFromURL(strUrl, (status, header, dataSize, dataArray) => {
      if (status === LoadResult.SUCCESS) {
        this._ktxOnSuccess(strUrl, loaderKtx, header, dataSize, dataArray);
      } else {
        this._ktxOnFail(strUrl, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  }
  /** Load KTX volume from local file */
  _callbackLoadLocalKtxFile(file) {
    if (typeof file === 'undefined') {
      console.log('argument should be string local file');
      return false;
    }
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }
    console.log(`Now loading from local file ${file.name} ...`);

    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    const loaderKtx = new KtxLoader();
    loaderKtx.readFromFile(file, (status, header, dataSize, dataArray) => {
      if (status === LoadResult.SUCCESS) {
        this._ktxOnSuccess(file.name, loaderKtx, header, dataSize, dataArray);
      } else {
        this._ktxOnFail(file.name, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  }

  // ******************************************************************
  // Load Nifti file callback
  // ******************************************************************
  _niftiOnSuccess(dataName, loader, header, dataSize, dataArray) {
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
    this.m_engine2d.m_volumeHeader = header;
    this.m_engine2d.m_volumeData = dataArray;
    this.m_engine2d.m_volumeBox = box;
    this.m_engine2d.m_volumeInfo = loader.getDicomInfo();

    if (this.m_engine2d.m_volumeData === null) {
      console.log('BAD null volume data array');
    } else {
      if (this.m_menu) {
        this.m_menu.stopProgressBar();
      }
      this.m_engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax);
      this.m_engine2d.createTileMapsWithTexture(this.m_engine3d.origVolumeTex);
      this.m_engineMpr.create();
      this._callbackFileLoaded();
    }
  }

  /** Failed load nifti file callback */
  _niftiOnFail(dataName, status) {
    const strTitle = `Error loading: ${dataName}`;
    const strMessage = LoadResult.getResultString(status);
    if (this.m_menu) {
      this.m_menu.stopProgressBar();
    }
    swal({
      title: strTitle,
      text: strMessage,
      icon: 'error',
      button: 'continue',
    });
  }

  /** Load nifti volume from local file */
  _callbackLoadLocalNiftiFile(file) {
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }
    console.log(`Now loading from local Nifti file ${file.name} ...`);
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
    const needScaleDownTexture = true;
    const loaderNifti = new NiftiLoader(needScaleDownTexture);
    loaderNifti.readFromFile(file, (status, header, dataSize, dataArray) => {
      if (status === LoadResult.SUCCESS) {
        this._niftiOnSuccess(file.name, loaderNifti, header, dataSize, dataArray);
      } else {
        this._niftiOnFail(file.name, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  }
  _callbackLoadNiftiFile(url) {
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }
    console.log(`Now loading Nifti from URL ${url} ...`);
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    // console.log(`max texture size: ${engine3d.maxTextureSize} ...`);
    // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
    const needScaleDownTexture = true;
    const loaderNifti = new NiftiLoader(needScaleDownTexture);
    loaderNifti.readFromURL(url, (status, header, dataSize, dataArray) => {
      if (status === LoadResult.SUCCESS) {
        this._niftiOnSuccess(url, loaderNifti, header, dataSize, dataArray);
      } else {
        this._niftiOnFail(url, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  } // load nifti via url

  // ******************************************************************
  // Hdr format loading
  // ******************************************************************
  _hdrOnSuccess(dataName, loader, header, dataSize, dataArray, isRoiVolume) {
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
    this.m_engine2d.m_volumeHeader = header;
    this.m_engine2d.m_volumeData = dataArray;
    this.m_engine2d.m_volumeBox = box;
    this.m_engine2d.m_volumeInfo = loader.getDicomInfo();

    if (this.m_engine2d.m_volumeData === null) {
      console.log('BAD null volume data array');
    } else {
      if (this.m_menu) {
        this.m_menu.stopProgressBar();
      }
      this.m_engine3d.callbackCreateCubeVolumeBF(window, box, nonEmptyBoxMin, nonEmptyBoxMax, isRoiVolume);
      this.m_engine2d.createTileMapsWithTexture(this.m_engine3d.volTexture, isRoiVolume);
      this.m_engineMpr.create();
      this._callbackFileLoaded();
    }
  }
  _hdrOnFail(dataName, status) {
    const strTitle = `Error loading: ${dataName}`;
    const strMessage = LoadResult.getResultString(status);
    if (this.m_menu) {
      this.m_menu.stopProgressBar();
    }
    swal({
      title: strTitle,
      text: strMessage,
      icon: 'error',
      button: 'continue',
    });
  }
  /** Load hdr volume from local files */
  _callbackLoadLocalHdrFiles(files) {
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }
    const numFiles = files.length;
    const NUM_FILES_IN_PAIR = 2;
    const NUM_FILES_INT_ROI = 4;
    if ((numFiles !== NUM_FILES_IN_PAIR) && (numFiles !== NUM_FILES_INT_ROI)) {
      console.log(`HDR. Should be 2 or 4 files but found ${numFiles} ...`);
      return false;
    }
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
    const needScaleDownTexture = true;
    const loaderHdr = new HdrLoader(needScaleDownTexture);
    for (let i = 0; i < numFiles; i++) {
      const file = files[i];
      console.log(`Now loading from local Hdr file ${file.name} ...`);
    }

    loaderHdr.readFromFiles(files, (status, header, dataSize, dataArray, isRoiVolume) => {
      if (status === LoadResult.SUCCESS) {
        this._hdrOnSuccess(files[0].name, loaderHdr, header, dataSize, dataArray, isRoiVolume);
      } else {
        this._hdrOnFail(file.name, status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  }
  /** read local hdr files from urls divided by ; */
  _callbackLoadHdrFiles(strFileNameHeads) {
    const canOpen = !this._isChromeAndFile();
    if (!canOpen) {
      swal({
        title: 'Error',
        text: 'Cant open local file with this browser',
        icon: 'error',
        button: 'continue',
      });
      return false;
    }

    const strFileNameHeadsList = strFileNameHeads.split(';');
    const urls = [];
    const strFileNameImgList = strFileNameHeadsList.map(x => x.replace('.h', '.img'));
    for (let i = 0; i < strFileNameHeadsList.length; ++i) {
      urls.push(strFileNameHeadsList[i]);
      urls.push(strFileNameImgList[i]);
    }
    if (this.m_menu) {
      this.m_menu.startProgressBar();
    }
    // console.log(`max texture size: ${engine3d.maxTextureSize} ...`);
    // const needScaleDownTexture = (engine3d.maxTextureSize < MAX_GPU_TEXTURE_SIDE);
    const needScaleDownTexture = true;
    const loaderHdr = new HdrLoader(needScaleDownTexture);
    loaderHdr.readFromURLS(urls, (status, header, dataSize, dataArray, isRoiVolume) => {
      if (status === LoadResult.SUCCESS) {
        this._hdrOnSuccess(urls[0], loaderHdr, header, dataSize, dataArray, isRoiVolume);
      } else {
        this._hdrOnFail(urls[0], status);
      }
    }, (ratioLoaded) => {
      console.log(`Loading ratio = ${ratioLoaded}`);
      if (this.m_menu) {
        this.m_menu.updateProgressBar(ratioLoaded);
      }
    });
    return true;
  } // load hdr file via url

}
