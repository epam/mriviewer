/**
 * @fileOverview UiSaveMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import SaverNifti from '../engine/savers/SaverNifti';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiSaveMenu some text later...
 */
class UiSaveMenu extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onSaveNifti = this.onSaveNifti.bind(this);
  }
  // invoked after render
  componentDidMount() {
  }
  // invoked on save nifti file format
  onSaveNifti() {
    const store = this.props;
    const vol = store.volume;
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const xBox = vol.m_boxSize.x;
    const yBox = vol.m_boxSize.y;
    const zBox = vol.m_boxSize.z;
    const volSize = {
      x: xDim,
      y: yDim,
      z: zDim,
      pixdim1: xBox / xDim,
      pixdim2: yBox / yDim,
      pixdim3: zBox / zDim,
    };
    const volData = vol.m_dataArray;
    const niiArr = SaverNifti.writeBuffer(volData, volSize);
    const textToSaveAsBlob = new Blob([niiArr], { type: 'application/octet-stream' });
    const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    // TODO !!!!!!!
    const fileName = `test_save.nii`;

    const downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.innerHTML = 'Download File';
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = event => document.body.removeChild(event.target);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);

    downloadLink.click();



  } // end on save nifti
  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;
    const strClass = (isLoaded) ? 'btn dropdown-toggle' : 'btn dropdown-toggle disabled';

    const jsxSaveMenu =
      <div className="dropdown">
        <button className={strClass} type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-save"></i>
          Save
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <button className="dropdown-item" type="button" onClick={evt => this.onSaveNifti(evt)} >
            <i className="fas fa-globe"></i>
            Save to Nifti
          </button>
        </div>
      </div>

    return jsxSaveMenu;
  }
}

export default connect(store => store)(UiSaveMenu);


