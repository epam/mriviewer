import JSZip from 'jszip';

const IGNORED_FILE_PREFIXES = ['__MACOSX/', '._'];

/**
 * ArchiveReader is a utility class for reading and extracting files from ZIP archives.
 * It uses the JSZip library to handle the zip file format. The class can filter out
 * unnecessary files based on predefined rules, such as ignoring certain file prefixes.
 */
export class ArchiveReader {
  /**
   * Reads the provided ZIP file and returns a list of extracted files, omitting any
   * files that meet the criteria to be ignored.
   *
   * @param {File} file - The ZIP file to be read.
   * @returns {Promise<File[]>} A promise that resolves to an array of File objects extracted from the ZIP archive,
   *                            sorted by their last modified date.
   */
  async readZipFile(file: File): Promise<File[]> {
    const zip = new JSZip();
    const unzippedFiles: File[] = [];

    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    await zip.loadAsync(arrayBuffer);

    for (const fileName in zip.files) {
      if (this.shouldSkipFile(fileName)) {
        continue;
      }

      const zipObject = zip.files[fileName];

      if (!zipObject.dir) {
        const blob = await zipObject.async('blob');
        unzippedFiles.push(new File([blob], fileName, { type: blob.type }));
      }
    }

    return unzippedFiles.sort((a, b) => a.lastModified - b.lastModified);
  }

  /**
   * Checks whether a file from the ZIP archive should be ignored based on its file name.
   * Files starting with certain prefixes (e.g., '__MACOSX/', '._') are ignored.
   *
   * @param {string} fileName - The name of the file to check.
   * @returns {boolean} True if the file should be skipped; false otherwise.
   */
  private shouldSkipFile(fileName: string): boolean {
    return IGNORED_FILE_PREFIXES.some((prefix) => fileName.startsWith(prefix));
  }

  /**
   * Reads the content of the provided File object as an ArrayBuffer.
   * This is a utility method used internally by the readZipFile method.
   *
   * @param {File} file - The file whose contents are to be read.
   * @returns {Promise<ArrayBuffer>} A promise that resolves with the ArrayBuffer representation of the file's content.
   */
  readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
