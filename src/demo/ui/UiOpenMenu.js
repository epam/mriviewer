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
import { NavDropdown, Button, Modal, InputGroup, FormControl } from 'react-bootstrap';

import Volume from '../engine/Volume';
import Texture3D from '../engine/Texture3D';

import UiModalDemo from './UiModalDemo';
import StoreActionType from '../store/ActionTypes';

// ********************************************************
// Const
// ********************************************************

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

    this.onModalUrlShow = this.onModalUrlShow.bind(this);
    this.onModalUrlHide = this.onModalUrlHide.bind(this);
    this.onClickLoadUrl = this.onClickLoadUrl.bind(this);

    this.onModalDropboxShow = this.onModalDropboxShow.bind(this);
    this.onModalDropboxHide = this.onModalDropboxHide.bind(this);

    this.onModalDemoOpenShow = this.onModalDemoOpenShow.bind(this);
    this.onModalDemoOpenHide = this.onModalDemoOpenHide.bind(this);

    this.onDemoSelected = this.onDemoSelected.bind(this);

    this.m_fileName = '';
    this.m_fileReader = null;
    this.state = {
      strUrl: '',
      showModalUrl: false,
      showModalDropbox: false,
      showModalDemo: false
    };
  }
  onFileContentRead() {
    console.log('UiOpenMenu. onFileContectRead ...');
    const strContent = this.m_fileReader.result;
    // console.log(`file content = ${strContent.substring(0, 64)}`);
    // console.log(`onFileContentRead. type = ${typeof strContent}`);
    const vol = new Volume();
    const callbackProgress = null;
    const callbackComplete = null;
    let readOk = false;
    if (this.m_fileName.endsWith('.ktx') || this.m_fileName.endsWith('.KTX')) {
      // if read ktx
      readOk = vol.readFromKtx(strContent, callbackProgress, callbackComplete);
    } else {
      console.log(`onFileContentRead: unknown file type: ${this.m_fileName}`);
    }
    if (readOk) {
      console.log('nFileContentRead finished OK');
      // invoke notification
      const store = this.props;

      store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
      store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: this.m_fileName });
      store.dispatch({ type: StoreActionType.SET_VOLUME, volume: vol });
      const tex3d = new Texture3D();
      tex3d.createFromRawVolume(vol);
      store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
    }
  }
  handleFileSelected(evt) {
    if (evt.target.files !== undefined) {
      console.log(`UiOpenMenu. handleFileSelected. obj = ${evt.target.files[0].name}`);
      const file = evt.target.files[0];
      this.m_fileName = file.name;
      this.m_fileReader = new FileReader();
      this.m_fileReader.onloadend = this.onFileContentRead;
      this.m_fileReader.readAsArrayBuffer(file);
    }
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
  onClickLoadUrl() {
    this.setState({ showModalUrl: false });
    const strUrl = this.state.strUrl;
    console.log(`onClickLoadUrl with strUrl = ${strUrl}`);
    if (strUrl.startsWith('http')) {
      if(strUrl.endsWith('.ktx')) {
        // TODO: open KTX by url
        const vol = new Volume();
        const callbackProgress = null;
        const callbackComplete = null;
        const readOk = vol.readFromKtxUrl(strUrl, callbackProgress, callbackComplete);
        if (readOk) {
          console.log('onFileContentRead finished OK');
          // invoke notification
          // const func = this.props.onNewFile;
          // func(this.m_fileName, vol);

        } // if read ok
      } // if KTX
    } // if valid url
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
      fileName = 'data/brain181.zip';
    }
    if (fileName.length > 0) {
      /*
      fs.open(fileName, 'r', (err, f) => {
        if (err) {
          console.log(`fie open ERR = ${err}`);
          return err;
        }
        console.log('fie is OPENED');
      });

      const zip = new StreamZip({
        file: fileName,
        storeEntries: true
      });
      zip.on('error', err => {
        console.log(`ZIP read error: ${err}`);
      });
      zip.on('ready', () => {
        // Take a look at the files
        console.log('Entries read: ' + zip.entriesCount);
        for (const entry of Object.values(zip.entries())) {
          const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
          console.log(`Entry ${entry.name}: ${desc}`);
        }
        // Read a file in memory
        let zipDotTxtContents = zip.entryDataSync('path/inside/zip.txt').toString('utf8');
        console.log("The content of path/inside/zip.txt is: " + zipDotTxtContents);
    
        // Do not forget to close the file once you're done
        zip.close()
      });
      */

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
