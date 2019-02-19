/**
 * @fileOverview UiOpenMenu
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import Volume from '../engine/Volume';
import { NavDropdown, Button, Modal, InputGroup, FormControl } from 'react-bootstrap';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************



/**
 * Class UiOpenMenu some text later...
 */
export default class UiOpenMenu extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onButtonLocalFile = this.onButtonLocalFile.bind(this);
    this.handleFileSelected = this.handleFileSelected.bind(this);
    this.handleFileRead = this.handleFileRead.bind(this);

    this.onModalUrlShow = this.onModalUrlShow.bind(this);
    this.onModalUrlHide = this.onModalUrlHide.bind(this);
    this.onClickLoadUrl = this.onClickLoadUrl.bind(this);

    this.onModalDropboxShow = this.onModalDropboxShow.bind(this);
    this.onModalDropboxHide = this.onModalDropboxHide.bind(this);

    this.m_fileName = '';
    this.m_fileReader = null;
    this.state = {
      strUrl: '',
      showModalUrl: false,
      showModalDropbox: false
    };
  }
  handleFileRead() {
    console.log('UiOpenMenu. handleFileRead ...');
    const strContent = this.m_fileReader.result;
    // console.log(`file content = ${strContent.substring(0, 64)}`);
    // console.log(`handleFileRead. type = ${typeof strContent}`);
    const vol = new Volume();
    const callbackProgress = null;
    const callbackComplete = null;
    const readOk = vol.readFromKtx(strContent, callbackProgress, callbackComplete);
    if (readOk) {
      console.log('handleFileRead finished OK');
      // invoke notification
      const func = this.props.onNewFile;
      func(this.m_fileName, vol);
    }
  }
  handleFileSelected(evt) {
    if (evt.target.files !== undefined) {
      console.log(`UiOpenMenu. handleFileSelected. obj = ${evt.target.files[0].name}`);
      const file = evt.target.files[0];
      this.m_fileName = file.name;
      this.m_fileReader = new FileReader();
      this.m_fileReader.onloadend = this.handleFileRead;
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
          console.log('handleFileRead finished OK');
          // invoke notification
          const func = this.props.onNewFile;
          func(this.m_fileName, vol);
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

      </NavDropdown>

    return jsxOpenMenu;
  }
}
 
