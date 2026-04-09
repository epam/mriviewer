import LoadResult from '../../../../LoadResult';
import Volume from '../../../../Volume';
import LoaderDcmDaikon from '../../../../loaders/LoaderDcmDaikon';
import LoaderDicom from '../../../../loaders/LoaderDicom';
import LoaderHdr from '../../../../loaders/LoaderHdr';
import { MriExtensions } from '../../../enums';
import { SingleFileReader } from '../single-file-reader/SingleFileReader';

/**
 * The `MultiFileReader` class extends `SingleFileReader` to handle reading and processing
 * multiple files. It supports reading DICOM series and header-image pairs for volume rendering.
 */
export class MultiFileReader extends SingleFileReader {
  files: Array<File> = [];
  fileIndex: number = 0;
  filesLength: number = 0;

  volumeRoi = new Volume();

  constructor() {
    super();

    this.read = this.read.bind(this);
    this.readMultipleHdr = this.readMultipleHdr.bind(this);
    this.onFileContentReadMultipleDicom = this.onFileContentReadMultipleDicom.bind(this);
  }

  /**
   * Reads multiple files and determines the processing method based on file extension.
   * @param {File[]} files - An array of `File` objects to be read.
   */
  read(files: any): void {
    this.files = this.getFilesOrderToRead(files);
    this.filesLength = this.files.length;
    this.setFileData(this.files[0]);
    this.volumeSet.addVolume(new Volume());
    this.readFile(0);

    switch (this.fileExtension) {
      case '':
      case MriExtensions.DCM:
        this.loader = new LoaderDicom(this.filesLength);
        this.store.setDicomLoader(this.loader);
        this.fileReader.onloadend = this.onFileContentReadMultipleDicom;
        break;
      case MriExtensions.HDR:
      case MriExtensions.IMG:
        this.loader = new LoaderHdr();
        this.fileReader.onloadend = this.readMultipleHdr;
        break;
      default:
        this.handleVolumeReadFailed(`Unsupported file extension: ${this.fileExtension}`);
        break;
    }
  }

  /**
   * Orders files based on their last modified date and filters out files that don't match the primary file extension.
   * @param {File[]} files - An array of `File` objects to be ordered.
   * @returns {File[]} An ordered array of `File` objects.
   */
  getFilesOrderToRead(files: File[]): File[] {
    const plainFiles: File[] = Array.from(files);
    const fileExtension = this.getFileExtension(plainFiles[0]);

    if (fileExtension === MriExtensions.HDR || fileExtension === MriExtensions.IMG) {
      return plainFiles;
    }

    return plainFiles
      .filter((file) => {
        return this.getFileExtension(file) === fileExtension;
      })
      .sort((a, b) => a.lastModified - b.lastModified);
  }

  /**
   * Reads a slice of a DICOM file using the Daikon loader.
   * @param {string | ArrayBuffer | null} content - The content of the DICOM file.
   * @returns {LoadResult} The result of the read operation.
   */
  readSliceDicomViaDaikon(content: string | ArrayBuffer | null) {
    const loaderDaikon = new LoaderDcmDaikon();
    return loaderDaikon.readSlice(this.loader, this.fileIndex, this.fileName, content);
  }

  /**
   * Reads the file at the given index.
   * @param {number} index - The index of the file to read.
   */
  readFile(index: number): void {
    const file = this.files[index];
    this.setFileData(file);
    this.fileReader.readAsArrayBuffer(file);
    this.callbackReadProgress(this.fileIndex / this.filesLength);
  }

  /**
   * Handler for when content of a DICOM file is read.
   */
  onFileContentReadMultipleDicom(): void {
    this.fileIndex++;

    if (this.fileIndex === this.files.length) {
      return this.callbackReadSingleDicomComplete(LoadResult.SUCCESS);
    }
    const readStatus = this.readSliceDicomViaDaikon(this.fileReader.result);

    if (readStatus === LoadResult.SUCCESS && this.fileIndex < this.filesLength) {
      this.readFile(this.fileIndex);
      this.fileReader.onloadend = this.onFileContentReadMultipleDicom;
    } else {
      this.handleVolumeReadFailed(`Failed on parsing of this file: ${this.fileName}.${this.fileExtension}`);
    }
  }

  /**
   * Handler for reading multiple HDR (header) files.
   */
  readMultipleHdr() {
    this.fileIndex++;

    const VALID_NUM_FILES_2 = 2;
    const VALID_NUM_FILES_4 = 4;

    // Extract main part of the filename
    const regExpFileName = /([\S]+)\.[\S]+/;
    const fnameArr = regExpFileName.exec(this.fileName);
    let detectedMask = false;
    let detectedIntensity = false;

    if (fnameArr && fnameArr.length === 2) {
      const fname = fnameArr[1];
      detectedMask = fname.endsWith('_mask');
      detectedIntensity = fname.endsWith('_intn');
    }

    let volDst = this.volumeSet.getVolume(0);

    if (this.fileIndex > VALID_NUM_FILES_2) {
      volDst = this.volumeRoi;
    }

    if (detectedIntensity) {
      volDst = this.volumeSet.getVolume(0);
    }

    if (detectedMask && this.filesLength !== VALID_NUM_FILES_4) {
      volDst = this.volumeRoi;
    }

    const content = this.fileReader.result;

    const readSuccess =
      this.fileExtension === MriExtensions.HDR
        ? (this.loader as LoaderHdr).readFromBufferHeader(volDst, content, this.callbackReadProgress, this.callbackReadComplete)
        : (this.loader as LoaderHdr).readFromBufferImage(volDst, content, this.callbackReadProgress, this.callbackReadComplete);

    volDst = this.volumeSet.getVolume(0);

    if (readSuccess && this.fileIndex === this.filesLength) {
      const loaderHdr = this.loader as LoaderHdr;
      let ok = loaderHdr.createVolumeFromHeaderAndImage(volDst);

      if (this.filesLength === VALID_NUM_FILES_4 && ok) {
        ok = loaderHdr.createRoiVolumeFromHeaderAndImage(volDst, this.volumeRoi);
      }

      this.callbackReadProgress(1.0);
      this.callbackReadComplete(ok ? LoadResult.SUCCESS : LoadResult.UNKNOWN);
    }

    if (this.fileIndex < this.filesLength) {
      this.readFile(this.fileIndex);
      this.fileReader.onloadend = this.readMultipleHdr;
    }
  }
}
