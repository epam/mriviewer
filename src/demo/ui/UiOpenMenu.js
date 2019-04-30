/**
 * @fileOverview UiOpenMenu
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import { connect } from 'react-redux';
import { NavDropdown, Button, Modal, InputGroup, FormControl, } from 'react-bootstrap';

import Volume from '../engine/Volume';
import Texture3D from '../engine/Texture3D';

import UiModalDemo from './UiModalDemo';
import StoreActionType from '../store/ActionTypes';
import ModeView from '../store/ModeView';
import Modes3d from '../store/Modes3d';

// import { timingSafeEqual } from 'crypto';
import LoadResult from '../engine/LoadResult';
import FileTools from '../engine/loaders/FileTools';
import LoaderDicom from '../engine/loaders/LoaderDicom';
import LoaderHdr from '../engine/loaders/LoaderHdr';

// ********************************************************
// Const
// ********************************************************

/** deep artificially fix volume texture size to 4 * N */
const NEED_TEXTURE_SIZE_4X = true;

// ********************************************************
// Class
// ********************************************************


/**
 * Class UiOpenMenu some text later...
 */
class UiOpenMenu extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onButtonLocalFile = this.onButtonLocalFile.bind(this);
    this.handleFileSelected = this.handleFileSelected.bind(this);
    this.onFileContentRead = this.onFileContentRead.bind(this);
    this.onFileContentReadMultipleDicom = this.onFileContentReadMultipleDicom.bind(this);
    this.onFileContentReadMultipleHdr = this.onFileContentReadMultipleHdr.bind(this);

    this.onModalUrlShow = this.onModalUrlShow.bind(this);
    this.onModalUrlHide = this.onModalUrlHide.bind(this);
    this.onClickLoadUrl = this.onClickLoadUrl.bind(this);
    this.onCompleteFromUrlKtx = this.onCompleteFromUrlKtx.bind(this);

    this.onModalDropboxShow = this.onModalDropboxShow.bind(this);
    this.onModalDropboxHide = this.onModalDropboxHide.bind(this);

    this.onModalDemoOpenShow = this.onModalDemoOpenShow.bind(this);
    this.onModalDemoOpenHide = this.onModalDemoOpenHide.bind(this);

    this.onDemoSelected = this.onDemoSelected.bind(this);

    this.callbackReadProgress = this.callbackReadProgress.bind(this);
    this.callbackReadComplete = this.callbackReadComplete.bind(this);

    this.m_fileName = '';
    this.m_fileReader = null;
    this.state = {
      strUrl: '',
      showModalUrl: false,
      showModalDropbox: false,
      showModalDemo: false,
    };
    this.m_volume = null;
    this.m_volumeRoi = null;
    this.m_updateEnable = true;
    this.roiMode = false;
  }
  finalizeSuccessLoadedVolume(vol, fileNameIn) {
    if (NEED_TEXTURE_SIZE_4X) {
      vol.makeDimensions4x();
    }
    // invoke notification
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_VOLUME, volume: vol });
    store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
    store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: fileNameIn });
    const tex3d = new Texture3D();
    tex3d.createFromRawVolume(vol);
    store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
    store.dispatch({ type: StoreActionType.SET_MODE_VIEW, modeView: ModeView.VIEW_2D });
    store.dispatch({ type: StoreActionType.SET_MODE_3D, mode3d: Modes3d.RAYCAST });
  }
  readCallbackComplete(errCode) {
    if (errCode !== LoadResult.SUCCESS) {
      const strErr = LoadResult.getResultString(errCode);
      console.log(`readCallbackComplete. Bad result = ${errCode}: ${strErr}`);
    }
  }
  callbackReadProgress(ratio01) {
    // console.log(`callbackReadProgress = ${ratio01}`);
    const ratioPrc = Math.floor(ratio01 * 100);
    const store = this.props;
    const uiapp = store.uiApp;
    if (ratioPrc === 0) {
      uiapp.doShowProgressBar();
    }
    if (ratioPrc >= 99) {
      // console.log(`callbackReadProgress. hide on = ${ratio01}`);
      uiapp.doHideProgressBar();
    } else {
      uiapp.doSetProgressBarRatio(ratioPrc);
    }
  } // callback progress
  callbackReadComplete() {
    const store = this.props;
    const uiapp = store.uiApp;
    // console.log(`callbackReadComplete wiyth err = ${loadErrorCode}`);
    uiapp.doHideProgressBar();
  }
  // based on local file read
  // read from string content in this.m_fileReader.result
  //
  onFileContentRead() {
    console.log('UiOpenMenu. onFileContectRead ...');
    const strContent = this.m_fileReader.result;
    // console.log(`file content = ${strContent.substring(0, 64)}`);
    // console.log(`onFileContentRead. type = ${typeof strContent}`);
    const vol = new Volume();
    const callbackProgress = this.callbackReadProgress;
    const callbackComplete = this.callbackReadComplete;
    let readOk = false;
    if (this.m_fileName.endsWith('.ktx') || this.m_fileName.endsWith('.KTX')) {
      // if read ktx
      readOk = vol.readFromKtx(strContent, callbackProgress, callbackComplete);
    } else if (this.m_fileName.endsWith('.nii') || this.m_fileName.endsWith('.NII')) {
      readOk = vol.readFromNifti(strContent, callbackProgress, callbackComplete);
    } else if (this.m_fileName.endsWith('.dcm') || this.m_fileName.endsWith('.DCM')) {
      readOk = vol.readFromDicom(strContent, callbackProgress, callbackComplete);
    } else if (this.m_fileName.endsWith('.hdr') || this.m_fileName.endsWith('.HDR')) {
      // readOk = vol.readFromHdrHeader(strContent, callbackProgress, callbackComplete);
      console.log(`cant read single hdr file: ${this.m_fileName}`);
      readOk = false;
    } else if (this.m_fileName.endsWith('.img') || this.m_fileName.endsWith('.IMG')) {
      // readOk = vol.readFromHdrImage(strContent, callbackProgress, callbackComplete);
      console.log(`cant read single img file: ${this.m_fileName}`);
      readOk = false;
    } else {
      console.log(`onFileContentRead: unknown file type: ${this.m_fileName}`);
    }
    if (readOk) {
      console.log('onFileContentRead finished OK');
      this.finalizeSuccessLoadedVolume(vol, this.m_fileName);
    } else {
      console.log(`onFileContentRead failed! reading ${this.m_fileName} file`);
    }
  }
  //
  // read hdr/img. content is in this.m_fileReader.result
  //
  onFileContentReadMultipleHdr() {
    const VALID_NUM_FILES_2 = 2;
    const VALID_NUM_FILES_4 = 4;
    if ((this.m_numFiles !== VALID_NUM_FILES_2) && (this.m_numFiles !== VALID_NUM_FILES_4)) {
      console.log(`onFileContentReadMultipleHdr: can read ${VALID_NUM_FILES_2} or ${VALID_NUM_FILES_4} files for multiple hdr loader`);  
      return;
    }

    const isHdr = this.m_fileName.endsWith('hdr') || this.m_fileName.endsWith('HDR');
    console.log(`onFileContentReadMultipleHdr: read file ${this.m_fileName}. Ratio=${this.m_fileIndex} / ${this.m_numFiles}`);
    this.m_fileIndex++;
    const ratioLoad = this.m_fileIndex / this.m_numFiles;
    const strContent = this.m_fileReader.result;
    // const lenContent = strContent.length;

    if (this.m_fileIndex <= 1) {
      this.callbackReadProgress(0.0);
    }

    if ((this.m_numFiles === VALID_NUM_FILES_4) && (this.m_volumeRoi === null)) {
      this.m_volumeRoi = new Volume();
    }

    const callbackProgress = null;
    const callbackComplete = null;

    const regExpFileName = /([\S]+)\.[\S]+/;
    const fnameArr = regExpFileName.exec(this.m_fileName);
    const numFN = fnameArr.length;
    // console.log(`!!!!!!!!!!!!!!!!!!! FILE NAME = ${fnameArr[1]}, NUMFN = ${numFN}`);
    let detectedMask  = false;
    let detectedIntensity = false;
    if (numFN === 2) {
      const fname = fnameArr[1];
      if (fname.endsWith('_mask')) {
        detectedMask = true;
      }
      if (fname.endsWith('_intn')) {
        detectedIntensity = true;
      }
    }
    let volDst = (this.m_fileIndex <= VALID_NUM_FILES_2) ? this.m_volume : this.m_volumeRoi;
    if (detectedIntensity) {
      volDst = this.m_volume;
      // console.log('intensity vol by name');
    }
    if (detectedMask) {
      volDst = this.m_volumeRoi;
      this.roiMode = true;
      // console.log('mask vol by name');
      if (this.m_numFiles !== VALID_NUM_FILES_4) {
        console.log('You need to load 4 files, if one of them has _mask in name');
        return;
      }
    }


    let readOk = false;
    if (isHdr) {
      readOk = this.m_loader.readFromBufferHeader(volDst, strContent, callbackProgress, callbackComplete);
    } else {
      readOk = this.m_loader.readFromBufferImage(volDst, strContent, callbackProgress, callbackComplete);
    }

    if (readOk && (this.m_fileIndex === this.m_numFiles)) {
      let ok = false;
      if (this.m_numFiles === VALID_NUM_FILES_2) {
        ok = this.m_loader.createVolumeFromHeaderAndImage(this.m_volume);
      } else if (this.m_numFiles === VALID_NUM_FILES_4) {
        // intensity data 16 -> 8 bpp
        ok = this.m_loader.createVolumeFromHeaderAndImage(this.m_volume);
        if (ok) {
          // mix 8 bpp intensity and roi pixels
          ok = this.m_loader.createRoiVolumeFromHeaderAndImage(this.m_volume, this.m_volumeRoi);
        }
      }
      if (!ok) {
        this.callbackReadProgress(1.0);
        this.callbackReadComplete(LoadResult.FAIL, null, 0, null);
        return;
      }
      this.finalizeSuccessLoadedVolume(this.m_volume, this.m_fileName);
      console.log(`onFileContentReadMultipleHdr read all ${this.m_numFiles} files`);

      this.callbackReadProgress(1.0);
      this.callbackReadComplete(LoadResult.SUCCES, null, 0, null);
    }

    // read again new file
    if (this.m_fileIndex < this.m_numFiles) {
      this.callbackReadProgress(ratioLoad);
      this.m_fileReader.onloadend = this.onFileContentReadMultipleHdr;
      const file = this.m_files[this.m_fileIndex];
      this.m_fileName = file.name;
      this.m_fileReader.readAsArrayBuffer(file);
    }

  }
  //
  // read from string content in this.m_fileReader.result
  //
  onFileContentReadMultipleDicom() {
    // console.log('UiOpenMenu. onFileContentReadMultipleDicom ...');
    const strContent = this.m_fileReader.result;
    this.m_fileIndex++;
    const ratioLoad = this.m_fileIndex / this.m_numFiles;
    // console.log(`onFileContentReadMultipleDicom. r = ${ratioLoad}`);
    const callbackProgress = null;
    const callbackComplete = null;

    if (this.m_fileIndex <= 1) {
      this.callbackReadProgress(0.0);
    }

    const readOk = this.m_volume.readSingleSliceFromDicom(this.m_loader, this.m_fileIndex - 1, 
      this.m_fileName, ratioLoad, strContent, callbackProgress, callbackComplete);
    if (!readOk) {
      console.log('onFileContentReadMultipleDicom. Error read individual file');
    }
    if (readOk && (this.m_fileIndex === this.m_numFiles)) {
      this.m_loader.createVolumeFromSlices(this.m_volume);
      this.finalizeSuccessLoadedVolume(this.m_volume, this.m_fileName);
      console.log(`onFileContentReadMultipleDicom read all ${this.m_numFiles} files`);

      this.callbackReadProgress(1.0);
      this.callbackReadComplete(LoadResult.SUCCES, null, 0, null);
    }
    // read again new file
    if (this.m_fileIndex < this.m_numFiles) {
      // print console loading progress
      const NUM_PARTS_REPORT = 16;
      const STEP_PROGRESS = Math.floor(this.m_numFiles / NUM_PARTS_REPORT);
      if ((this.m_fileIndex % STEP_PROGRESS) === 0) {
        // console.log(`onFileContentReadMultipleDicom. Loading completed = ${ratioLoad}`);
        this.callbackReadProgress(ratioLoad);
      }

      this.m_fileReader.onloadend = this.onFileContentReadMultipleDicom;
      const file = this.m_files[this.m_fileIndex];
      this.m_fileName = file.name;
      this.m_fileReader.readAsArrayBuffer(file);
    }
  }
  //
  // Perform open file after it selected in dialog
  handleFileSelected(evt) {
    if (evt.target.files !== undefined) {
      const numFiles = evt.target.files.length;
      console.log(`UiOpenMenu. Trying to open ${numFiles} files`);
      console.log(`UiOpenMenu. handleFileSelected. file[0] = ${evt.target.files[0].name}`);
      if (numFiles === 1) {
        const file = evt.target.files[0];
        this.m_fileName = file.name;
        this.m_fileReader = new FileReader();
        this.m_fileReader.onloadend = this.onFileContentRead;
        this.m_fileReader.readAsArrayBuffer(file);
      } else {
        // not single file was open
        this.m_files = evt.target.files;
        this.m_fileIndex = 0;
        this.m_numFiles = numFiles;
        this.m_fileReader = new FileReader();
        // if multiple files, create Dicom loader
        this.m_loader = null;
        if (evt.target.files[0].name.endsWith(".dcm")) {
          this.m_loader = new LoaderDicom(numFiles);
          this.m_fileReader.onloadend = this.onFileContentReadMultipleDicom;
        } else if ((evt.target.files[0].name.endsWith(".hdr")) || (evt.target.files[0].name.endsWith(".img"))) {
          this.m_loader = new LoaderHdr(numFiles);
          this.m_fileReader.onloadend = this.onFileContentReadMultipleHdr;
        }
        
        const vol = new Volume();
        this.m_volume = vol;
        this.m_volumeRoi = null;

        const file = evt.target.files[0];
        this.m_fileName = file.name;
        this.m_fileReader.readAsArrayBuffer(file);
      } // if num files > 1
    } // if event is mnot empty
  }
  buildFileSelector() {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', '.ktx,.dcm,.nii,.hdr,.h,.img');
    fileSelector.setAttribute('multiple', '');
    fileSelector.onchange = this.handleFileSelected;
    return fileSelector;
  }
  // invoked after render
  componentDidMount() {
    this.m_fileSelector = this.buildFileSelector();
  }
  onButtonLocalFile(evt) {
    evt.preventDefault();
    this.m_fileSelector.click();
  }
  //
  onModalUrlShow() {
    console.log(`onModalUrlShow`);
    this.setState({ strUrl: '' }); 
    this.setState({ showModalUrl: true });
  }
  onModalUrlHide() {
    console.log(`onModalUrlHide`);
    this.setState({ showModalUrl: false });
  }
  onChangeUrlString(evt) {
    const str = evt.target.value;
    this.setState({ strUrl: str }); 
    console.log(`onChangeUrlString. str = ${str}`)
  }
  convertUrlToFileName(strUrl) {
    const ind = strUrl.lastIndexOf('/');
    if (ind > 0) {
      const strRet = strUrl.substring(ind + 1);
      return strRet;
    } else {
      console.log(`Strange URL: ${strUrl}`);
      return '???';
    }
  }
  onCompleteFromUrlKtx(codeResult, head, dataSize, dataArray) {
    if (codeResult !== LoadResult.SUCCESS) {
      console.log(`onCompleteFromUrlKtx. Bad result: ${codeResult}`);
      return;
    }
    const vol = new Volume();
    vol.m_dataSize = dataSize;
    vol.m_dataArray = dataArray;
    vol.m_xDim = head.m_pixelWidth;
    vol.m_yDim = head.m_pixelHeight;
    vol.m_zDim = head.m_pixelDepth;
    this.m_fileName = this.convertUrlToFileName(this.m_url);
    this.finalizeSuccessLoadedVolume(vol, this.m_fileName);

    this.callbackReadComplete(LoadResult.SUCCESS, null, 0, null);
  }
  loadFromUrl(strUrl) {
    const fileTools = new FileTools();
    const isValid = fileTools.isValidUrl(strUrl);
    if (isValid) {
      this.m_url = strUrl;
      if (strUrl.endsWith('.ktx')) {
        const vol = new Volume();
        const callbackProgress = this.callbackReadProgress;
        this.callbackReadProgress(0.0);
        const readOk = vol.readFromKtxUrl(strUrl, callbackProgress, this.onCompleteFromUrlKtx);
        if (readOk) {
          // if read ok
          // console.log('UiOpenMenu. onClickLoadUrl: read OK');
        } else {
          // bad read
          console.log(`UiOpenMenu. onClickLoadUrl: failed loading url:${strUrl}`);
        }
        // if KTX
      } else {
        console.log(`UiOpenMenu. Unknow file type from URL = ${strUrl}`);
      }
      // if valid url
    } else {
      console.log(`UiOpenMenu. Bad URL = ${strUrl}`);
    }
  }
  onClickLoadUrl() {
    this.setState({ showModalUrl: false });
    const strUrl = this.state.strUrl;
    console.log(`onClickLoadUrl with strUrl = ${strUrl}`);
    this.loadFromUrl(strUrl);
  }
  //
  onModalDropboxShow() {
    console.log(`onModalDropboxShow`);
    this.setState({ showModalDropbox: true });
  }
  onModalDropboxHide() {
    console.log(`onModalDropboxHide`);
    this.setState({ showModalDropbox: false });
  }
  onModalDemoOpenShow() {
    this.setState({ showModalDemo: true });
  }
  onModalDemoOpenHide() {
    this.setState({ showModalDemo: false });
  }
  onDemoSelected(index) {
    console.log(`TODO: selected demo = ${index}. Need open file...`);
    let fileName = '';
    if (index === 0) {
      const FN_ENCODED = 'http://www.e-joufs.sv/qsjwbuf/nfe4xfc/ebub/luy/31212219.luy';
      const ft = new FileTools();
      fileName = ft.decodeUrl(FN_ENCODED);
    } else if (index === 1) {
      const FN_ENCO = 'http://www.e-joufs.sv/qsjwbuf/nfe4xfc/ebub/luy/tfu11.luy';
      const ft = new FileTools();
      fileName = ft.decodeUrl(FN_ENCO);
    }
    if (fileName.length > 0) {
      this.loadFromUrl(fileName);
    } // if fileName not empty
  } // end of onDemoSelected
  //
  shouldComponentUpdate() {
    return true;
  }
  render() {
    const jsxOpenMenu =
      <NavDropdown id="basic-nav-dropdown" title={
        <div style={{ display: 'inline-block' }}> 
          <i className="fas fa-folder-open"></i>
          Open
        </div>
      } >
        <NavDropdown.Item href="#actionOpenComputer" onClick={evt => this.onButtonLocalFile(evt)}>
          <i className="fas fa-desktop"></i>
          Computer
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionOpenUrl" onClick={this.onModalUrlShow} >
          <i className="fas fa-globe-americas"></i>
          Url
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionOpenDropbox" onClick={this.onModalDropboxShow} >
          <i className="fas fa-dropbox"></i>
          Dropbox
        </NavDropdown.Item>

        <NavDropdown.Divider />

        <NavDropdown.Item href="#actionOpenDropbox" onClick={this.onModalDemoOpenShow} >
          <i className="fas fa-brain"></i>
          Demo models Open
        </NavDropdown.Item>

        <Modal show={this.state.showModalUrl} onHide={this.onModalUrlHide} >
          <Modal.Title>
            Load data from external source
          </Modal.Title>

          <Modal.Header closeButton>
            <Modal.Body>

              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text id="inputGroup-sizing-default">
                    Input URL to open
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                  placeholder="Enter URL here"
                  aria-label="Default"
                  aria-describedby="inputGroup-sizing-default"
                  onChange={this.onChangeUrlString.bind(this)} />
                <InputGroup.Append>
                  <Button variant="outline-secondary" onClick={this.onClickLoadUrl}>
                    Load
                  </Button>
                </InputGroup.Append>
              </InputGroup>

            </Modal.Body>
          </Modal.Header>
        </Modal>

        <Modal show={this.state.showModalDropbox} onHide={this.onModalDropboxHide} >
          <Modal.Title>
            Load data from dropbox storage
          </Modal.Title>
          <Modal.Header closeButton>
            <Modal.Body>
              TODO: later...
            </Modal.Body>
          </Modal.Header>
        </Modal>

        <UiModalDemo stateVis={this.state.showModalDemo}
          onHide={this.onModalDemoOpenHide} onSelectDemo={this.onDemoSelected}  />
      </NavDropdown>

    return jsxOpenMenu;
  }
}

export default connect(store => store)(UiOpenMenu);
