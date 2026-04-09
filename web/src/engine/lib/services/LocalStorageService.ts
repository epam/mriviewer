export class MRILocalStorageService {
  RECENT_FILES_KEY: string = 'recentFiles';

  constructor() {
    this.saveRecentFiles = this.saveRecentFiles.bind(this);
  }

  get localStorage(): Storage {
    if (!localStorage) {
      throw new Error('Local Storage is not available');
    }

    return localStorage;
  }

  getData(key: string): string {
    const stringData = this.localStorage.getItem(key);
    return stringData ? JSON.parse(stringData) : '';
  }

  setData(key: string, data: any): void {
    this.localStorage.setItem(key, JSON.stringify(data));
  }

  saveRecentFiles(fileName: string): void {
    const recentFiles = this.getData(this.RECENT_FILES_KEY);
    const limitedRecentFiles = recentFiles.slice(0, 2);
    const data = [{ fileName, timestamp: Date.now() }, ...limitedRecentFiles];
    this.setData(this.RECENT_FILES_KEY, data);
  }
}

// Create the singleton instance and freeze it
const mriLocalStorageService = new MRILocalStorageService();
Object.freeze(mriLocalStorageService);

// Export the FileLoader singleton instance
export default mriLocalStorageService;
