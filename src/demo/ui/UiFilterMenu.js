/**
 * @fileOverview UiFilterMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { NavDropdown } from 'react-bootstrap';
import LungsFillTool from '../engine/actvolume/lungsfill/lft';

import ActiveVolume from '../engine/actvolume/actvol';
import StoreActionType from '../store/ActionTypes';
import Texture3D from '../engine/Texture3D';
import ModeView from '../store/ModeView';
import Modes3d from '../store/Modes3d';

import SobelEdgeDetector from '../engine/imgproc/Sobel';
import UiModalBilateral from './UiModalBilateral';


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiFilterMenu some text later...
 */
class UiFilterMenu extends React.Component {
  // invoked after render
  constructor(props) {
    super(props);
    this.onButtonLungsSeg = this.onButtonLungsSeg.bind(this);
    this.onLungsFillerCallback = this.onLungsFillerCallback.bind(this);
    this.onButtonDetectBrain = this.onButtonDetectBrain.bind(this);
    this.onSkullRemoveCallback = this.onSkullRemoveCallback.bind(this);
    this.onButtonSobel = this.onButtonSobel.bind(this);
    this.onSobelCallback = this.onSobelCallback.bind(this);
    this.onButtonBilateral = this.onButtonBilateral.bind(this);

    this.showModalBilateral = this.showModalBilateral.bind(this);
    this.hideModalBilateral = this.hideModalBilateral.bind(this);
    this.state = {
      showModalBilateral: false,
    };


    //this.callbackProgressFun = this.callbackProgressFun.bind(this);
  }
  /*
  callbackProgressFun(ratio01) {
    // console.log(`callbackReadProgress = ${ratio01}`);
    const store = this.props;
    const uiapp = store.uiApp;
    const ratioPrc = Math.floor(ratio01 * 100);
    if (ratioPrc === 0) {
      uiapp.doShowProgressBar('reading...');
    }
    if (ratioPrc >= 99) {
      // console.log(`callbackReadProgress. hide on = ${ratio01}`);
      uiapp.doHideProgressBar();
    } else {
      uiapp.doSetProgressBarRatio(ratioPrc);
    }
  } // callback progress
  */
  onButtonLungsSeg() {
    //evt.preventDefault();
    const store = this.props;
    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    if ((vol === undefined) || (vol === null)) {
      console.log('onButtonDetectBrain: no volume!');
      return;
    }
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    if (xDim * yDim * zDim < 1) {
      console.log(`onButtonDetectBrain: bad volume! dims = ${xDim}*${yDim}*${zDim}`);
      return;
    }
    const ONE = 1;
    if (vol.m_bytesPerVoxel !== ONE) {
      console.log('onButtonDetectBrain: supported only 1bpp volumes');
      return;
    }

    this.lungsFiller = new LungsFillTool(vol);
    //const callbackProgress = this.callbackProgressFun;
    //lungsFiller.run(callbackProgress);
    const uiApp = store.uiApp;
    uiApp.doShowProgressBar('lungsFiller...');
    uiApp.doSetProgressBarRatio(0.0);
    const SK_REM_DELAY_MSEC = 200;
    this.m_timerId = setTimeout(this.onLungsFillerCallback, SK_REM_DELAY_MSEC);
    //store.volumeRenderer.volumeUpdater.createUpdatableVolumeTex(store.volume, false, null);
  }
  onLungsFillerCallback() {
    const store = this.props;
    const ratioUpdate = this.lungsFiller.m_ratioUpdate;
    console.log(`onLungsFillerCallback: iter counter = ${ratioUpdate}`);
    const uiApp = store.uiApp;
    uiApp.doSetProgressBarRatio(ratioUpdate);

    const isFinished = this.lungsFiller.run();
 
    if (isFinished) {
      console.log('`onSkullRemoveCallback: iters finished!');
      uiApp.doHideProgressBar();
      clearInterval(this.m_timerId);
      this.m_timerId = 0;
      // store.graphics2d.renderScene();
    }
    // update render
    store.graphics2d.forceUpdate();
    // next update timer
    if (!isFinished) {
      const SK_REM_DELAY_MSEC = 200;
      this.m_timerId = setTimeout(this.onLungsFillerCallback, SK_REM_DELAY_MSEC);
    }
  }
  // on sobel
  onButtonSobel() {
    // get globals
    const store = this.props;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    if ((vol === undefined) || (vol === null)) {
      console.log('onButtonSobel: no volume!');
      return;
    }
    this.m_vol = vol;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    if (xDim * yDim * zDim < 1) {
      console.log(`onButtonSobel: bad volume! dims = ${xDim}*${yDim}*${zDim}`);
      return;
    }
    // let volTextureSrc = vol.m_dataArray;
    const ONE = 1;
    if (vol.m_bytesPerVoxel !== ONE) {
      console.log('onButtonSobel: supported only 1bpp volumes');
      return;
    }

    console.log('onButtonSobel: start sobel...');
    //const xyzDim = xDim * yDim * zDim;
    //const volTextureDst = new Uint8Array(xyzDim);

    const sobel = new SobelEdgeDetector();
    sobel.start(vol);
    this.m_sobel = sobel;

    const uiApp = store.uiApp;
    uiApp.doShowProgressBar('Apply sobel edge detector...');
    uiApp.doSetProgressBarRatio(0.0);

    const SOBEL_UPDATE_DELAY_MSEC = 150;
    this.m_timerId = setTimeout(this.onSobelCallback, SOBEL_UPDATE_DELAY_MSEC);

  } // end onButtonSobel
  // callback for periodicallt invoke sobel 3d volume filtering
  onSobelCallback() {
    this.m_sobel.update();

    const store = this.props;

    let ratioUpdate = this.m_sobel.getRatio();
    ratioUpdate = (ratioUpdate < 1.0) ? ratioUpdate : 1.0;
    ratioUpdate *= 100;
    ratioUpdate = Math.floor(ratioUpdate);
    // console.log('ratio = ' + ratioUpdate.toString() );

    const uiApp = store.uiApp;
    uiApp.doSetProgressBarRatio(ratioUpdate);

    const isFinished = this.m_sobel.isFinished();

    if (isFinished) {
      console.log('`onSobelCallback: iters finished!');
      uiApp.doHideProgressBar();

      clearInterval(this.m_timerId);
      this.m_timerId = 0;

      const volSet = store.volumeSet;
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);

      // normalize dst
      this.m_sobel.normalizeDstImage();

      // copy result pixels into source
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const xyzDim = xDim * yDim * zDim;
      const pixelsDst = this.m_sobel.getPixelsDst()
      for (let i = 0; i < xyzDim; i++) {
        vol.m_dataArray[i] = Math.floor(pixelsDst[i]);
      } // for i
      this.m_sobel.stop();

      // rebuild 3d data
      store.dispatch({ type: StoreActionType.SET_VOLUME_SET, volumeSet: volSet });
      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      const tex3d = new Texture3D();
      tex3d.createFromRawVolume(vol);
      store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
      store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: ModeView.VIEW_2D });
      store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
    } // if finished
    // update render
    store.graphics2d.forceUpdate();
    // next update timer
    if (!isFinished) {
      const SOBEL_UPDATE_DELAY_MSEC = 150;
      this.m_timerId = setTimeout(this.onSobelCallback, SOBEL_UPDATE_DELAY_MSEC);
    }
  } // end onSobelCallback
  //
  // on Bilateral
  //
  onButtonBilateral() {
    this.showModalBilateral();
  }
  //
  // detect brain segmentation
  //
  onButtonDetectBrain() {
    // get globals
    const store = this.props;

    const volSet = store.volumeSet;
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);

    if ((vol === undefined) || (vol === null)) {
      console.log('onButtonDetectBrain: no volume!');
      return;
    }
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    if (xDim * yDim * zDim < 1) {
      console.log(`onButtonDetectBrain: bad volume! dims = ${xDim}*${yDim}*${zDim}`);
      return;
    }
    let volTextureSrc = vol.m_dataArray;
    const ONE = 1;
    if (vol.m_bytesPerVoxel !== ONE) {
      console.log('onButtonDetectBrain: supported only 1bpp volumes');
      return;
    }

    // non-proportional scale for too non-squared volumes
    // TODO:...
    /*
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
    */
    const xyzDim = xDim * yDim * zDim;
    const volTextureDst = new Uint8Array(xyzDim);
    const NEED_LOG = true;
    const CREATE_TYPE = ActiveVolume.REMOVE_SKULL;
    const actVolume = new ActiveVolume();
    this.m_actVolume = actVolume;

    const uiApp = store.uiApp;
    uiApp.doShowProgressBar('Remove skull...');
    uiApp.doSetProgressBarRatio(0.0);

    this.m_geoRender = actVolume.skullRemoveStart(xDim, yDim, zDim,
      volTextureSrc, volTextureDst, CREATE_TYPE, NEED_LOG);
    const SK_REM_DELAY_MSEC = 10;
    this.m_timerId = setTimeout(this.onSkullRemoveCallback, SK_REM_DELAY_MSEC);

    // let isRoiVolume = false;
    if (CREATE_TYPE === ActiveVolume.CREATE_MASK) {
      /*
      // now create argb texture with intensity and roi
      isRoiVolume = true;
      const newDataArray = this.combineWithRoiTexture(xDim, yDim, zDim, volTextureSrc, volTextureDst);

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
      */
    } else if (CREATE_TYPE === ActiveVolume.REMOVE_SKULL) {
      // vol.m_dataArray = volTextureDst;
    }

    /*
    store.dispatch({ type: StoreActionType.SET_VOLUME, volume: vol });
    store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
    const tex3d = new Texture3D();
    tex3d.createFromRawVolume(vol);
    store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
    store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: ModeView.VIEW_2D });
    store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });

    // update render
    store.graphics2d.forceUpdate();
    */
  }
  onSkullRemoveCallback() {
    const store = this.props;
    const iterCounter = this.m_actVolume.m_updateCounter;
    // console.log(`onSkullRemoveCallback: iter counter = ${iterCounter}`);

    const maxCounter = this.m_actVolume.m_numPredSteps;
    let ratioUpdate = iterCounter / maxCounter;
    ratioUpdate = (ratioUpdate < 1.0) ? ratioUpdate : 1.0;
    ratioUpdate *= 100;

    const uiApp = store.uiApp;
    uiApp.doSetProgressBarRatio(ratioUpdate);

    const isFinished = this.m_actVolume.skullRemoveUpdate(this.m_geoRender);
 
    if (isFinished) {
      console.log('`onSkullRemoveCallback: iters finished!');

      uiApp.doHideProgressBar();

      clearInterval(this.m_timerId);
      this.m_timerId = 0;
      this.m_actVolume.skullRemoveStop(this.m_geoRender);

      // perform finalize skull remove
      const volSet = store.volumeSet;
      const volIndex = store.volumeIndex;
      const vol = volSet.getVolume(volIndex);

      const volTextureDst = this.m_actVolume.m_volTexDst;
      vol.m_dataArray = volTextureDst;

      store.dispatch({ type: StoreActionType.SET_VOLUME_SET, volumeSet: volSet });
      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      const tex3d = new Texture3D();
      tex3d.createFromRawVolume(vol);
      store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
      store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: ModeView.VIEW_2D });
      store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
    }
    // update render
    store.graphics2d.forceUpdate();
    // next update timer
    if (!isFinished) {
      const SK_REM_DELAY_MSEC = 10;
      this.m_timerId = setTimeout(this.onSkullRemoveCallback, SK_REM_DELAY_MSEC);
    }
  }
  componentDidMount() {
  }
  showModalBilateral() {
    this.setState({ showModalBilateral: true });
  }
  hideModalBilateral() {
    this.setState({ showModalBilateral: false });
    // console.log('onModalSaveNiftiHide...');
  }
  //
  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;

    const strDisabled = (isLoaded) ? false : true;
    const jsxFilterMenu =
      <NavDropdown id="save-nav-dropdown" 
        disabled={strDisabled}
        title={
          <div style={{ display: 'inline-block' }}> 
            <i className="fas fa-broom"></i>
            Filter
          </div>
        } >
        <NavDropdown.Item href="#actionLungsSeg" onClick={evt => this.onButtonLungsSeg(evt)}>
          <i className="fas fa-cloud"></i>
          Lungs segmentation
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionDataectBrain" onClick={evt => this.onButtonDetectBrain(evt)}>
          <i className="fas fa-brain"></i>
          Auto detect brain
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionSobel" onClick={evt => this.onButtonSobel(evt)}>
          Sobel filter
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionBilateral" onClick={evt => this.onButtonBilateral(evt)}>
          Bilateral (denoise or smooth)
        </NavDropdown.Item>
        <UiModalBilateral stateVis={this.state.showModalBilateral} onHide={this.hideModalBilateral} />
      </NavDropdown>;

    return jsxFilterMenu;
  }
}
 
export default connect(store => store)(UiFilterMenu);

