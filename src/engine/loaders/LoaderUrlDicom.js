/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import Texture3D from '../Texture3D';
import StoreActionType from '../../store/ActionTypes';
import ModeView from '../../store/ModeView';
import Modes3d from '../../store/Modes3d';

const NEED_TEXTURE_SIZE_4X = true;

class LoaderUrlDicom {
  constructor(store) {
    this.m_store = store;
    this.m_arrFileNames = null;
    this.m_errors = [];
    this.m_loaders = [];
    this.m_loaderDicom = null;

    this.callbackReadProgress = this.callbackReadProgress.bind(this);
    this.m_fileName = '???';
  }

  /**
   * Progress read callback
   * 
   * @param {number ratio01 - ratio in range [0..1]
   */
  callbackReadProgress(ratio01) {
    const ratioPrc = Math.floor(ratio01);
    const store = this.m_store;
    if (ratioPrc >= .99) {
      // console.log(`callbackReadProgress. hide on = ${ratio01}`);
      store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 })
    } else {
      store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: ratioPrc })
    }
  } // callback progress



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
    store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });
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


} // end class LoaderUrlDicom

export default LoaderUrlDicom;
