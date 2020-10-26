//
//
//

// **********************************************
// Import
// **********************************************

import VolumeSet from '../VolumeSet';
import LoadResult from '../LoadResult';
import FileTools from './FileTools';
import FileLoader from './FileLoader';
import LoaderDcmDaikon from './LoaderDcmDaikon';
import LoaderDicom from './LoaderDicom';
// import DicomSlicesVolume from './dicomslicesvolume';

// **********************************************
// Const
// **********************************************

const DEBUG_PRINT_TAGS_INFO = false;

// **********************************************
// Class
// **********************************************

class LoaderDcmUrlDaikon {
  constructor() {
    this.m_loaderDaikon = new LoaderDcmDaikon();
    this.readReadyFileList = this.readReadyFileList.bind(this);
  }
  readFromUrl(volSet, strUrl, callbackComplete, callbackProgress) {
    // check arguments
    console.assert(volSet != null, "Null volume");
    console.assert(volSet instanceof VolumeSet, "Should be volume set");
    console.assert(strUrl != null, "Null string url");
    console.assert(typeof(strUrl) === 'string', "Should be string in url");

    // replace file name to 'file_list.txt'
    const ft = new FileTools();
    const isValidUrl = ft.isValidUrl(strUrl);
    if (!isValidUrl) {
      console.log(`readFromUrl: not vaild URL = = ${strUrl} `);
      return false;
    }
    this.m_folder = ft.getFolderNameFromUrl(strUrl);
    const urlFileList = this.m_folder + '/file_list.txt';
    console.log(`readFromUrl: load file = ${urlFileList} `);

    callbackProgress(0.0);
    
    const fileLoader = new FileLoader(urlFileList);
    this.m_fileListCounter = 0;
    fileLoader.readFile((arrBuf) => {
      this.m_fileListCounter += 1;
      if (this.m_fileListCounter === 1) {
        const okRead = this.readReadyFileList(volSet, arrBuf, callbackComplete, callbackProgress);
        return okRead;
      }
      return true;
    }, (errMsg) => {
      console.log(`Error read file: ${errMsg}`);
      // callbackComplete(LoadResult.ERROR_CANT_OPEN_URL, null, 0, null);
      return false;
    }); // get file from server
    return true;
  } // end read from url
  //
  readReadyFileList(volSet, arrBuf, callbackComplete, callbackProgress) {
    const uint8Arr = new Uint8Array(arrBuf);
    const strFileContent = String.fromCharCode.apply(null, uint8Arr);

    const LEN_LOG = 64;
    const strLog = strFileContent.substr(0, LEN_LOG);
    console.log(`Loaded file list. Started with:  ${strLog} ...`);

    const arrFileNames = strFileContent.split('\n');

    let numFiles = arrFileNames.length;
    // check last empty elements
    const MIN_FILE_NAME_SIZE = 4;
    for (let i = numFiles - 1; i >= 0; i--) {
      if (arrFileNames[i].endsWith('\r')) {
        arrFileNames[i] = arrFileNames[i].substring(0, arrFileNames[i].length - 1);
      }
      if (arrFileNames[i].length < MIN_FILE_NAME_SIZE) {
        arrFileNames.pop();
      }
    }
    numFiles = arrFileNames.length;
    this.m_loaders = [];
    this.m_errors = [];
    // declare slices array
    for (let i = 0; i < numFiles; i++) {
      // this.m_slices[i] = null;
      this.m_errors[i] = -1;
      this.m_loaders[i] = null;
    }
    

    const zDim = numFiles;
    console.log(`Loaded file list. ${numFiles} files will be loaded. 1st file in list is = ${arrFileNames[0]}`);
    console.log(`Loaded file list. Last file in list is = ${arrFileNames[numFiles - 1]}`);

    this.m_loaderDaikon.m_loaderDicom = new LoaderDicom(numFiles);

    // physical dimension
    this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing = {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
    this.m_boxSize = {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    };
    this.m_filesLoadedCounter = 0;
    this.m_numFailsLoad = 0;
    this.m_numLoadedFiles = numFiles;

    this.m_loaderDaikon.m_loaderDicom.m_imagePosMin = {
      // eslint-disable-next-line
      x: +1.0e12,
      // eslint-disable-next-line
      y: +1.0e12,
      // eslint-disable-next-line
      z: +1.0e12
    };
    this.m_loaderDaikon.m_loaderDicom.m_imagePosMax = {
      // eslint-disable-next-line
      x: -1.0e12,
      // eslint-disable-next-line
      y: -1.0e12,
      // eslint-disable-next-line
      z: -1.0e12
    };

    // eslint-disable-next-line
    this.m_loaderDaikon.m_sliceLocMin = +1.0e12;
    // eslint-disable-next-line
    this.m_loaderDaikon.m_sliceLocMax = -1.0e12;

    for (let i = 0; (i < this.m_numLoadedFiles) && (this.m_numFailsLoad < 1); i++) {
      const urlFile = `${this.m_folder}/${arrFileNames[i]}`;
      // console.log(`trying read file ${urlFile} from web`);

      this.m_loaders[i] = new FileLoader(urlFile);
      const loader = this.m_loaders[i];
      loader.readFile((fileArrBu) => {
        const ratioLoaded = this.m_filesLoadedCounter / this.m_numLoadedFiles;
        const VAL_MASK = 7;
        if ((callbackProgress !== undefined) && ((this.m_filesLoadedCounter & VAL_MASK) === 0)) {
          //console.log(`LoadDcmUrlDaikon. Progress = ${ratioLoaded}`);
          callbackProgress(ratioLoaded);
        }
        //if ((callbackProgress !== undefined) &&
        //  (this.m_filesLoadedCounter + 1 === this.m_numLoadedFiles)) {
        //  callbackProgress(1.0);
        //}
        const ret = this.m_loaderDaikon.loadSingleSlice(i, urlFile, fileArrBu);
        if (ret !== LoadResult.SUCCESS) {
          return ret;
        }
        // console.log(`LoadDcmUrlDaikon. Loaded/All = ${this.m_filesLoadedCounter} / ${this.m_numLoadedFiles}`);
        this.m_filesLoadedCounter += 1;
        if (this.m_filesLoadedCounter === this.m_numLoadedFiles) {
          // Finalize physic dimension
          if (DEBUG_PRINT_TAGS_INFO) {
            console.log(`slice location (min, max) = ${this.m_sliceLocMin}, ${this.m_sliceLocMax}`);
          }
          const imagePosBox = {
            x: this.m_loaderDaikon.m_loaderDicom.m_imagePosMax.x - this.m_loaderDaikon.m_loaderDicom.m_imagePosMin.x,
            y: this.m_loaderDaikon.m_loaderDicom.y - this.m_loaderDaikon.m_loaderDicom.m_imagePosMin.y,
            z: this.m_loaderDaikon.m_loaderDicom.m_imagePosMax.z - this.m_loaderDaikon.m_loaderDicom.m_imagePosMin.z
          };
          const TOO_MIN = 0.00001;
          let zBox;
          if (Math.abs(this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing.z) > TOO_MIN) {
            zBox = this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing.z * zDim;
          } else {
            zBox = imagePosBox.z;
            if (Math.abs(zBox) < TOO_MIN) {
              zBox = imagePosBox.x;
              if (Math.abs(zBox) < TOO_MIN) {
                zBox = imagePosBox.y;
              }
            }
          } // if pixel spacing 0
          if (zBox < TOO_MIN) {
            zBox = 1.0;
          }
          const xDim = this.m_loaderDaikon.m_loaderDicom.m_xDim;
          const yDim = this.m_loaderDaikon.m_loaderDicom.m_yDim;
  
          this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing.z = zBox / zDim;
          this.m_boxSize.z = zDim * this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing.z;
          this.m_boxSize.x = xDim * this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing.x;
          this.m_boxSize.y = yDim * this.m_loaderDaikon.m_loaderDicom.m_pixelSpacing.y;
          console.log(`LoadDcmUrlDaikon. Volume local phys dim: ${this.m_boxSize.x} * ${this.m_boxSize.y} * ${this.m_boxSize.z}`);

          // TODO: add hash
          let series = this.m_loaderDaikon.m_loaderDicom.m_slicesVolume.getSeries();
          if (series.length === 0) {
            this.m_loaderDaikon.m_loaderDicom.m_slicesVolume.buildSeriesInfo();
            series = this.m_loaderDaikon.m_loaderDicom.m_slicesVolume.getSeries();
          }
          const indexSerie = 0;
          const hash = series[indexSerie].m_hash;
          const errStatus = this.m_loaderDaikon.m_loaderDicom.createVolumeFromSlices(volSet, indexSerie,  hash);
          if (callbackProgress !== null) {
            callbackProgress(1.0);
          }

          if (callbackComplete !== null) {
            callbackComplete(errStatus);
            return true;
          }
        } // if last file
      }); // file buffer is ready to parse
  
    } // for i all files

    return LoadResult.SUCCESS;
  } // end readReadyFileList

} // end class LoaderDcmUrlDaikon

export default LoaderDcmUrlDaikon;