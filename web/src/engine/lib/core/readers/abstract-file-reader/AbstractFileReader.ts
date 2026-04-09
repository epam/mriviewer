import LoadResult from '../../../../LoadResult';
import VolumeSet from '../../../../VolumeSet';
import LoaderDicom from '../../../../loaders/LoaderDicom';
import LoaderHdr from '../../../../loaders/LoaderHdr';
import MriViwer from '../../../MRIViewer';
import { volumeConfig } from '../../../config/volume.config';
import { MriEvents, MriExtensions } from '../../../enums';
import {
  MRIEventsService,
  MRILocalStorageService,
  MRIStoreService,
  mriEventsService,
  mriLocalStorageService,
  mriStoreService,
} from '../../../services';

/**
 * AbstractFileReader is an abstract class designed to be extended by specific file reader
 * implementations for medical imaging data. It provides basic functionality for reading files,
 * handling loading success or failure, and communicating with application services for state management
 * and event handling.
 *
 * @abstract
 */
export abstract class AbstractFileReader {
  // VolumeData
  volumeSet = new VolumeSet();
  volumeIndex: number = 0;
  // FileData
  fileName = '';
  fileExtension: MriExtensions | '' = '';
  // File Handlers
  loader: LoaderDicom | LoaderHdr | undefined;
  fileReader: FileReader = new FileReader();

  // Services
  store: MRIStoreService = mriStoreService;
  events: MRIEventsService = mriEventsService;
  localStorage: MRILocalStorageService = mriLocalStorageService;

  constructor() {
    this.callbackReadProgress = this.callbackReadProgress.bind(this);
    this.callbackReadComplete = this.callbackReadComplete.bind(this);
  }

  /**
   * Handles the successful loading of a volume. It updates the volume set, emits a success event,
   * and updates the local storage with the recent file.
   */
  public handleVolumeLoadSuccess() {
    const volume = this.volumeSet.getVolume(this.volumeIndex);

    if (!volume.m_dataArray) return;

    if (volumeConfig.setTextureSize4X) {
      volume.makeDimensions4x();
    }

    this.callbackReadProgress(1);
    MriViwer.events.emit(MriEvents.VOLUME_LOAD_SUCCESS);
    this.store.setVolume(this.volumeSet, this.volumeIndex, this.fileName);

    this.localStorage.saveRecentFiles(this.fileName);

    if (this.store.getState().graphics2d) {
      this.store.getState().graphics2d.forceUpdate();
    }
  }

  /**
   * Handles the failed read attempt of a volume by emitting an error event and updating the store with
   * the failure information.
   *
   * @param {string} error - The error message describing the failure.
   */
  public handleVolumeReadFailed(error: string) {
    this.events.emit(MriEvents.FILE_READ_ERROR, { error });
    this.store.setVolumeLoadFailed(this.fileName);
  }

  /**
   * A callback function that is called to update the read progress. It calculates the progress percentage
   * and updates the store with the new progress value.
   *
   * @param {number} progress - The current progress value as a fraction from 0 to 1.
   */
  public callbackReadProgress(progress: number) {
    const progressPercentage: number = Math.floor(progress * 100);
    this.store.setLoadingProgress(progressPercentage);
  }

  /**
   * A callback function that is called upon the completion of the read operation. It determines whether
   * the read was successful and either triggers the load success handler or the read failed handler.
   *
   * @param {number} status - The status code indicating the result of the file read operation.
   */
  public callbackReadComplete(status: number) {
    if (status === LoadResult.SUCCESS) {
      this.handleVolumeLoadSuccess();
    } else {
      const error = LoadResult.getResultString(status);
      this.handleVolumeReadFailed(error);
    }
  }
}
