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
    this.handleMenuFile = this.handleMenuFile.bind(this);
    this.handleFileSelected = this.handleFileSelected.bind(this);
    this.handleFileRead = this.handleFileRead.bind(this);
    this.m_fileName = '';
    this.m_fileReader = null;
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
    console.log(`UiOpenMenu. handleFileSelected. obj = ${evt.target.files[0].name}`);
    const file = evt.target.files[0];
    this.m_fileName = file.name;
    this.m_fileReader = new FileReader();
    this.m_fileReader.onloadend = this.handleFileRead;
    this.m_fileReader.readAsArrayBuffer(file);
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
  handleMenuFile(evt) {
    evt.preventDefault();
    this.m_fileSelector.click();
  }
  render() {
    // const strLinkRoot = '#';
    //const styleIcon = {
    //  'textAlign': 'center',
    //  'display': 'table-cell',
    //  'verticalAlign': 'middle',
    //};

    const jsxOpenMenu =
      <div className="dropdown">
        <button className="btn dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-folder-open"></i>
          Open
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <button className="dropdown-item" type="button" onClick={evt => this.handleMenuFile(evt)} >
            <i className="fas fa-desktop"></i>
            Computer
          </button>
          <button className="dropdown-item" type="button">
            <i className="fas fa-globe-americas"></i>
            Url
          </button>
          <button className="dropdown-item" type="button">
            <i className="fas fa-dropbox"></i>
            Dropbox
          </button>
        </div>
      </div>

    return jsxOpenMenu;
  }
}
 