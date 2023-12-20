import { MriEvents, MriExtensions } from '../../enums';
import { MRIEventsService, MRIStoreService, mriEventsService, mriStoreService } from '../../services';
import { getFileNameFromUrl, getFolderNameFromUrl } from '../../utils';

/**
 * Class responsible for loading MRI files from URLs.
 * It handles different file types and tracks the loading progress.
 */
export class MRIFileLoader {
  fileName = '';
  filesLength = 0;
  filesLoaded = 0;
  filesProgressByLength = false;
  store: MRIStoreService = mriStoreService;
  events: MRIEventsService = mriEventsService;

  constructor() {
    this.load = this.load.bind(this);
    this.callbackLoadProgress = this.callbackLoadProgress.bind(this);
  }

  /**
   * Main load function responsible for loading a file from a given URL.
   * @param {string} url - The URL of the file to load.
   * @returns {Promise<File[]>} A promise that resolves to an array of Files or rejects with an error.
   */
  async load(url: string): Promise<File[] | null> {
    this.filesLoaded = 0;
    this.filesProgressByLength = false;
    this.store.setLoadingProgress(0);
    this.store.startLoadingSpinner('Loading File...');
    const fileExtension = url.slice(url.lastIndexOf('.') + 1);

    switch (fileExtension) {
      case MriExtensions.KTX:
      case MriExtensions.NII:
      case MriExtensions.DCM:
      case MriExtensions.ZIP:
        return await this.fetchSingleFile(url);
      case MriExtensions.TXT:
        return await this.fetchTxtFile(url);
      case MriExtensions.HDR:
        return await this.fetchHdrFile(url);
      default:
        this.handleVolumeLoadFailed(`Unsupported file extension: ${fileExtension}`);
        return [];
    }
  }

  /**
   * Fetches a single file from the given URL and tracks its progress.
   * @param {string} url - The URL from which to fetch the file.
   * @returns {Promise<File[]>} A promise that resolves to an array containing the fetched file as a File object.
   */
  async fetchSingleFile(url: string): Promise<File[] | null> {
    const response = await this.fetchWithProgress(url, this.callbackLoadProgress);

    if (!response.ok) {
      this.handleVolumeLoadFailed(`Failed to fetch file from URL: ${url}`);
      return null;
    }

    const blob = await response.blob();

    const fileName = getFileNameFromUrl(url);
    const file = new File([blob], fileName, {
      type: blob.type,
    });

    return [file];
  }

  /**
   * Fetches the content of a .txt file and splits it by newlines.
   * @param {string} url - The URL of the .txt file.
   * @returns {Promise<string[]>} A promise that resolves to an array of strings from the .txt file.
   */
  async fetchTxtContent(url: string): Promise<string[]> {
    const response = await fetch(url);

    if (!response.ok) {
      this.handleVolumeLoadFailed(`Failed to fetch file list from URL: ${url}`);
      return [];
    }

    const content = await response.text();
    return content.split('\n').filter((line) => line.trim() !== '');
  }

  /**
   * Fetches multiple files defined in a .txt file located at the given URL.
   * @param {string} txtUrl - The URL of the .txt file containing the list of file URLs.
   * @returns {Promise<File[]>} A promise that resolves to an array of File objects.
   */
  async fetchTxtFile(txtUrl: string): Promise<File[] | null> {
    this.filesProgressByLength = true;
    const base = txtUrl.substring(0, txtUrl.lastIndexOf('/') + 1);
    const fileNames = await this.fetchTxtContent(txtUrl);
    this.filesLength = fileNames.length;
    const filePromises = fileNames.map((filename: string) => this.fetchSingleFile(base + filename));
    const files = await Promise.all(filePromises);
    const validFalies = files.filter(Boolean) as Array<File[]>;
    return validFalies.flat();
  }

  /**
   * Fetches a set of related .hdr and .img files for MRI data.
   * @param {string} url - The URL of the .hdr file.
   * @returns {Promise<File[]>} A promise that resolves to an array of File objects, or [] if failed.
   */
  async fetchHdrFile(url: string): Promise<File[]> {
    const folder = getFolderNameFromUrl(url);
    const fileName = getFileNameFromUrl(url);
    const regExp = /(\w+)_intn.(h|hdr)/;
    const arrGrp = regExp.exec(fileName) || [];
    const namePrefix = arrGrp[1];

    if (arrGrp.length !== 3) {
      this.handleVolumeLoadFailed(`LoaderHdr.readFromUrl: bad URL name = ${url}. Should be in template NNN_intn.h`);
      return [];
    }

    const fileNameIntensityHeader = folder + '/' + namePrefix + '_intn.hdr';
    const fileNameIntensityImage = folder + '/' + namePrefix + '_intn.img';
    const fileNameMaskHeader = folder + '/' + namePrefix + '_mask.hdr';
    const fileNameMaskImage = folder + '/' + namePrefix + '_mask.img';

    const urls = [fileNameIntensityHeader, fileNameIntensityImage, fileNameMaskHeader, fileNameMaskImage];
    this.filesProgressByLength = true;
    this.filesLength = urls.length;

    const filePromises = urls.map((url: string) => this.fetchSingleFile(url));

    const files = await Promise.all(filePromises);

    const validFalies = files.filter(Boolean) as Array<File[]>;

    return validFalies.flat();
  }

  /**
   * Fetches a file with progress tracking via XMLHttpRequest.
   * @param {string} url - The URL from which to fetch the file.
   * @param {Function} onProgress - Callback function to report progress.
   * @returns {Promise<Response>} A promise that resolves to the Response object of the request.
   */
  async fetchWithProgress(url: string, onProgress: Function): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('GET', url);

      xhr.onprogress = (event) => {
        if (event.lengthComputable && !this.filesProgressByLength) {
          const percentComplete = event.loaded / event.total;
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 403) {
          return this.handleVolumeLoadFailed(`Error 403 Forbiden, failed to fetch file from URL: ${url}`);
        }

        if (this.filesProgressByLength) {
          this.filesLoaded = this.filesLoaded + 1;
          const percentComplete = this.filesLoaded / this.filesLength;
          onProgress(percentComplete);
        }

        const blob = xhr.response;
        resolve(new Response(blob));
      };

      xhr.onerror = () => {
        this.handleVolumeLoadFailed(`Failed to fetch file from URL: ${url}`);
        reject();
      };

      xhr.responseType = 'blob';
      xhr.send();
    });
  }

  /**
   * Callback function to handle the progress of file loading.
   * @param {number} progress - The progress of the loading, as a number between 0 and 1.
   */
  callbackLoadProgress(progress: number) {
    const progressPercentage = Math.floor(progress * 100);
    this.store.setLoadingProgress(progressPercentage);
  }

  /**
   * Handles the event of a failed volume load operation.
   * @param {string} error - The error message to be handled.
   */
  handleVolumeLoadFailed(error: string) {
    this.events.emit(MriEvents.FILE_READ_ERROR, { error });
    this.store.setVolumeLoadFailed(this.fileName);
  }
}
