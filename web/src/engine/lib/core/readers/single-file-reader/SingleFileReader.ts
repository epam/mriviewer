import StoreActionType from '../../../../../store/ActionTypes';
import LoadResult from '../../../../LoadResult';
import Volume from '../../../../Volume';
import LoaderDcmDaikon from '../../../../loaders/LoaderDcmDaikon';
import LoaderDicom from '../../../../loaders/LoaderDicom';
import LoaderKtx from '../../../../loaders/LoaderKtx';
import LoaderNifti from '../../../../loaders/LoaderNifti';
import { MriEvents, MriExtensions } from '../../../enums';
import { AbstractFileReader } from '../abstract-file-reader/AbstractFileReader';

/**
 * The `SingleFileReader` class extends `AbstractFileReader` to handle the reading and processing
 * of single files. It supports reading various medical imaging formats such as DICOM, KTX, and NIFTI.
 */
export class SingleFileReader extends AbstractFileReader {
  constructor() {
    super();
    this.read = this.read.bind(this);
    this.readSingleFile = this.readSingleFile.bind(this);
    this.fileReadProgress = this.fileReadProgress.bind(this);
    this.callbackReadSingleDicomComplete = this.callbackReadSingleDicomComplete.bind(this);
    this.handleVolumeParametersSetSuccess = this.handleVolumeParametersSetSuccess.bind(this);

    this.events.on(MriEvents.VOLUME_PARAMETERS_SET_SUCCESS, this.handleVolumeParametersSetSuccess);
  }

  /**
   * Initiates reading of a single file.
   * @param {File} file - The file to be read.
   */
  read(file: File): void {
    this.setFileData(file);
    this.fileReader.readAsArrayBuffer(file);
    this.fileReader.onloadend = this.readSingleFile;
    this.fileReader.addEventListener('progress', this.fileReadProgress);
  }

  /**
   * Called when the FileReader has completed loading the file's data.
   * Delegates to readFileData for processing the content.
   */
  readSingleFile() {
    const data = this.fileReader.result as ArrayBuffer;
    this.volumeSet.addVolume(new Volume());
    this.readFileData(data);
  }

  /**
   * Processes the read data based on the file extension.
   * @param {ArrayBuffer} data - The data to be processed.
   */
  readFileData(data: ArrayBuffer) {
    switch (this.fileExtension) {
      case '':
      case MriExtensions.DCM:
      case MriExtensions.TXT:
        this.readFromDicom(data);
        break;
      case MriExtensions.KTX:
        this.readFromKtx(data);
        break;
      case MriExtensions.NII:
        this.readFromNifti(data);
        break;
      default:
        this.handleVolumeReadFailed(`Unsupported file extension: ${this.fileExtension}`);
        break;
    }
  }

  /**
   * Reads and processes a KTX file's data.
   * @param {ArrayBuffer} content - The file content.
   * @returns {LoadResult} The result of the read operation.
   */
  readFromKtx(content: ArrayBuffer) {
    const loader = new LoaderKtx();
    const vol = this.volumeSet.getVolume(0);
    const ret = loader.readFromBuffer(vol, content, this.callbackReadProgress, this.callbackReadComplete);
    return ret;
  }

  /**
   * Reads and processes a NIFTI file's data.
   * @param {ArrayBuffer} content - The file content.
   * @returns {LoadResult} The result of the read operation.
   */
  readFromNifti(content: ArrayBuffer) {
    const loader = new LoaderNifti();
    const vol = this.volumeSet.getVolume(0);
    const ret = loader.readFromBuffer(vol, content, this.callbackReadProgress, this.callbackReadComplete);
    return ret;
  }

  /**
   * Reads and processes a DICOM file's data.
   * @param {ArrayBuffer} content - The file content.
   * @returns {LoadResult} The result of the read operation.
   */
  readFromDicom(content: ArrayBuffer) {
    this.loader = new LoaderDicom(1);
    const loaderDcm = new LoaderDcmDaikon();
    const status = loaderDcm.readSingleSlice(this.store, this.loader, 0, this.fileName, content);
    this.callbackReadSingleDicomComplete(status);
    return status;
  }

  /**
   * Sets metadata such as the file name and extension for the file being processed.
   * @param {File} file - The file for which to set data.
   */
  setFileData(file: File): void {
    this.fileName = file.name.toLowerCase();
    this.fileExtension = this.getFileExtension(file);
  }

  /**
   * Retrieves the extension of the given file.
   * @param {File} file - The file from which to extract the extension.
   * @returns {MriExtensions | ''} The file extension, or an empty string if no extension is found.
   */
  getFileExtension(file: File): MriExtensions | '' {
    const parts = file.name.toLowerCase().split('.');

    if (parts.length === 1) {
      return '';
    }

    return (parts[parts.length - 1] as MriExtensions) || '';
  }

  /**
   * Handles the progress event of the FileReader, updating the callback with the load progress.
   * @param {Object} progressEvent - The progress event emitted by FileReader.
   * @param {number} progressEvent.loaded - The number of bytes loaded.
   * @param {number} progressEvent.total - The total number of bytes.
   */
  fileReadProgress({ loaded, total }: { loaded: number; total: number }) {
    this.callbackReadProgress(loaded / total);
  }

  /**
   * Callback invoked upon completion of reading a single DICOM file.
   * @param {number} status - The status of the read operation.
   */
  callbackReadSingleDicomComplete(status: number) {
    if (status !== LoadResult.SUCCESS) {
      return this.callbackReadComplete(status);
    }

    this.callbackReadProgress(1);
    this.store.setSingleDicom(this.volumeSet, this.volumeIndex, this.loader);
    this.events.emit(MriEvents.FILE_READ_SUCCESS);
  }

  /**
   * Handles the successful setting of volume parameters after reading the file.
   */
  handleVolumeParametersSetSuccess(): void {
    this.handleVolumeLoadSuccess();

    if (this.loader && this.loader instanceof LoaderDicom) {
      const dicomSeries = this.loader.m_slicesVolume.getSeries();
      this.store.dispatch({ type: StoreActionType.SET_DICOM_SERIES, dicomSeries });
    }
  }
}
