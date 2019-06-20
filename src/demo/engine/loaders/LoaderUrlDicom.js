/**
 * @fileOverview LoaderUrlDicom
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import FileTools from './FileTools';
import LoadResult from '../LoadResult';
import Volume from '../Volume';
import FileLoader from './FileLoader';
import LoaderDicom from './LoaderDicom';

import Texture3D from '../Texture3D';
import StoreActionType from '../../store/ActionTypes';
import ModeView from '../../store/ModeView';
import Modes3d from '../../store/Modes3d';


// ********************************************************
// Const
// ********************************************************

// const DEBUG_PRINT_INDI_SLICE_INFO = false;
// const DEBUG_PRINT_TAGS_INFO = false;

const NEED_TEXTURE_SIZE_4X = true;

// ********************************************************
// Classs
// ********************************************************
class LoaderUrlDicom {
  constructor(store) {
    this.m_store = store;
    this.m_arrFileNames = null;
    this.m_errors = [];
    this.m_loaders = [];
    this.m_loaderDicom = null;

    this.callbackReadProgress = this.callbackReadProgress.bind(this);
    this.callbackReadComplete = this.callbackReadComplete.bind(this);
    this.m_fileName = '???';
  }
  /**
   * Progress read callback
   * 
   * @param {number ratio01 - ratio in range [0..1]
   */
  callbackReadProgress(ratio01) {
    const ratioPrc = Math.floor(ratio01 * 100);
    const store = this.m_store;
    const uiapp = store.uiApp;
    if (ratioPrc === 0) {
      uiapp.doShowProgressBar('Loading...');
    }
    if (ratioPrc >= 99) {
      // console.log(`callbackReadProgress. hide on = ${ratio01}`);
      uiapp.doHideProgressBar();
    } else {
      uiapp.doSetProgressBarRatio(ratioPrc);
    }
  } // callback progress
  /**
   * Invoked after read finished (or may be with error)
   * 
   * @param {number codeResult - one from LoadResult.XXX
   */
  callbackReadComplete(codeResult) {
    // console.log(`LoaderUrlDicom.callbackReadComplete: code = ${codeResult}`);
    if (codeResult !== LoadResult.SUCCESS) {
      console.log(`onCompleteFromUrlKtx. Bad result: ${codeResult}`);
      const arrErrors = [];
      const strErr = LoadResult.getResultString(codeResult);
      arrErrors.push(strErr);
      this.finalizeFailedLoadedVolume(this.m_volume, this.m_fileName, arrErrors);
      return;
    } else {
      this.finalizeSuccessLoadedVolume(this.m_volume, this.m_fileName);
    }
  }
  /**
   * End action if loading failed
   * 
   * @param {object} vol - destination readed volume
   * @param {string} fileNameIn - file name need to display
   * @param {object} arrErrors - array of string with error messages
   */
  finalizeFailedLoadedVolume(vol, fileNameIn, arrErrors) {
    // invoke notification
    const store = this.m_store;
    store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: false });
    store.dispatch({ type: StoreActionType.SET_VOLUME, volume: null });
    store.dispatch({ type: StoreActionType.SET_ERR_ARRAY, arrErrors: arrErrors });
    store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: fileNameIn });
    const uiapp = store.uiApp;
    uiapp.doHideProgressBar();
  }
  /**
   * On the end of success loading dicom folder
   * 
   * @param {object} vol - destination volume
   * @param {string} fileNameIn - short file name for readed
   */
  finalizeSuccessLoadedVolume(vol, fileNameIn) {
    if (vol.m_dataArray !== null)
    {
      if (NEED_TEXTURE_SIZE_4X) {
        vol.makeDimensions4x();
      }
      // invoke notification
      const store = this.m_store;
      store.dispatch({ type: StoreActionType.SET_VOLUME, volume: vol });
      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: fileNameIn });
      store.dispatch({ type: StoreActionType.SET_ERR_ARRAY, arrErrors: [] });
      const tex3d = new Texture3D();
      tex3d.createFromRawVolume(vol);
      store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
      store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: ModeView.VIEW_2D });
      store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
    }
  }
  /**
   * 
   * @param {object} arrFileNames - array of file names (with URL) 
   * @param {bool} fromGoogle - true if use google headers
   * 
   */
  loadFromUrlArray(arrFileNames, fromGoogle) {
    if (arrFileNames === undefined) {
      console.log('LoaderUrlDicom: no argument in constr');
    }
    const tp = typeof arrFileNames;
    if (tp !== 'object') {
      console.log(`LoaderUrlDicom: bad argument type: ${tp}, but expected object`);
    }
    this.m_arrFileNames = arrFileNames;

    const fileTools = new FileTools();
    let i;
    const numFiles = this.m_arrFileNames.length;

    console.log(`LoaderUrlDicom.loadFromUrlArray: start loading: ${numFiles} files`);
    console.log(`LoaderUrlDicom.loadFromUrlArray: from ${arrFileNames[0]} .. to ${arrFileNames[numFiles - 1]}  `);

    this.m_loaderDicom = new LoaderDicom(numFiles, false);

    this.m_volume = new Volume();
    const callbackProgress = this.callbackReadProgress;
    const callbackComplete = this.callbackReadComplete;
    callbackProgress(0.0);

    this.m_loaderDicom.m_numLoadedFiles = numFiles;
    this.m_loaderDicom.m_filesLoadedCounter = 0;
    this.m_loaderDicom.m_numFailsLoad = 0;

    // declare loaders array
    for (let i = 0; i < numFiles; i++) {
      this.m_loaderDicom.m_errors[i] = -1;
      this.m_loaderDicom.m_loaders[i] = null;
    }

    this.m_loaderDicom.m_zDim  = numFiles;
    for (i = 0; i < numFiles; i++) {
      const fileNameUrl = this.m_arrFileNames[i];
      const isValid = fileTools.isValidUrl(fileNameUrl);
      if (!isValid) {
        console.log(`LoaderUrlDicom.loadFromUrlArray: url is not valid = ${fileNameUrl}`);
        return false;
      }

      if (i === 0) {
        this.m_fileName = fileTools.getFileNameFromUrl(fileNameUrl);
      }

      // create loader for cur file
      this.m_loaders[i] = new FileLoader(fileNameUrl);
      const loader = this.m_loaders[i];
      const okLoader = this.m_loaderDicom.runLoader(this.m_volume, fileNameUrl,
        loader, i, callbackProgress, callbackComplete, fromGoogle);
      if (!okLoader) {
        return false;
      }
    } // for (i)
    // console.log('LoaderUrlDicom.loadFromUrlArray: func finished success');
    return true;
  } // end of load from url array


} // end class LoaderUrlDicom

export default LoaderUrlDicom;
