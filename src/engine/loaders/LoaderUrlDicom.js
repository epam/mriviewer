/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import StoreActionType from '../../store/ActionTypes';
import ViewMode from '../../store/ViewMode';
import Modes3d from '../../store/Modes3d';

const NEED_TEXTURE_SIZE_4X = true;

class LoaderUrlDicom {
  constructor(store) {
    this.m_store = store;
    this.m_errors = [];
    this.m_loaders = [];

    this.callbackReadProgress = this.callbackReadProgress.bind(this);
    this.m_fileName = '???';
  }

  /**
   * Progress read callback
   *
   * @param ratio01
   */
  callbackReadProgress(ratio01) {
    const ratioPrc = Math.floor(ratio01);
    const store = this.m_store;
    if (ratioPrc >= 0.99) {
      // console.log(`callbackReadProgress. hide on = ${ratio01}`);
      store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: 0 });
    } else {
      store.dispatch({ type: StoreActionType.SET_PROGRESS, progress: ratioPrc });
    }
  } // callback progress

  /**
   * On the end of success loading dicom folder
   *
   * @param {object} volume - destination volume
   * @param {string} fileNameIn - short file name for readed
   */
  finalizeSuccessLoadedVolume(volume, fileNameIn) {
    if (volume.m_dataArray !== null) {
      if (NEED_TEXTURE_SIZE_4X) {
        volume.makeDimensions4x();
      }
      // invoke notification
      const store = this.m_store;
      store.dispatch({ type: StoreActionType.SET_VOLUME_SET, volume });
      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: fileNameIn });
      store.dispatch({ type: StoreActionType.SET_ERR_ARRAY, arrErrors: [] });
      store.dispatch({ type: StoreActionType.SET_MODE_VIEW, viewMode: ViewMode.VIEW_2D });
      store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
    }
  }
} // end class LoaderUrlDicom

export default LoaderUrlDicom;
