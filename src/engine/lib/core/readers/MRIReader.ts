import { isValidUrl } from '../../utils';
import { MRIFileLoader } from '../loaders/MRIFileLoader';
import { MRIFileReaderFactory } from './file-reader-factory/MRIReaderFactory';

export class MRIReader {
  fileLoader = new MRIFileLoader();
  fileReader = new MRIFileReaderFactory();

  async read(data: File[] | string): Promise<void> {
    if (data && data.length && data[0] instanceof File) {
      this.fileReader.read(data as File[]);
    } else if (isValidUrl(data as string)) {
      const files: File[] | null = await this.fileLoader.load(data as string);

      if (files) {
        this.fileReader.read(files);
      }
    } else {
      throw new Error('Invalid input. Expected a File or URL.');
    }
  }
}

// Create the singleton instance and freeze it
const mriReader = new MRIReader();
Object.freeze(mriReader);

export default mriReader;
