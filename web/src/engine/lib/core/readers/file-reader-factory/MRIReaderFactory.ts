import { MriEvents, MriExtensions } from '../../../enums';
import { ArchiveReader } from '../archive-reader/ArchiveReader';
import { MultiFileReader } from '../multi-file-reader/MultiFileReader';
import { SingleFileReader } from '../single-file-reader/SingleFileReader';
import { MRIStoreService, MRIEventsService, mriEventsService, mriStoreService } from '../../../services';

/**
 * Factory class for creating file readers based on the type and number of files provided.
 * It handles the reading of single, multiple, and archived files by delegating to specific reader classes.
 */
export class MRIFileReaderFactory {
  fileReader: SingleFileReader | MultiFileReader | ArchiveReader | undefined;
  store: MRIStoreService = mriStoreService;
  events: MRIEventsService = mriEventsService;

  constructor() {
    this.read = this.read.bind(this);
  }

  /**
   * Reads the provided files and processes them according to their type and quantity.
   * Emits an event in case of an error or delegates the file reading to the appropriate reader.
   *
   * @param {File[]} files - An array of files to be read.
   * @returns {Promise<void>} A promise that resolves when the file reading operation is complete.
   */
  async read(files: File[]): Promise<void> {
    if (!files || !files.length) {
      return this.events.emit(MriEvents.FILE_READ_ERROR, { error: 'No files provided' });
    }

    this.store.startLoadingSpinner('Processing File...');

    // Single ZIP file scenario
    if (files.length === 1 && files[0].name.endsWith(MriExtensions.ZIP)) {
      this.fileReader = new ArchiveReader();
      const unzippedFiles = await this.fileReader.readZipFile(files[0]);
      return this.read(unzippedFiles);
    }

    // Single non-ZIP file scenario
    if (files.length === 1) {
      this.fileReader = new SingleFileReader();
      return this.fileReader.read(files[0]);
    }

    // Multiple files scenario
    this.fileReader = new MultiFileReader();
    (this.fileReader as MultiFileReader).read(files);
  }
}
