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

import UiModalSaveNifti from './UiModalSaveNifti';

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

    this.onModalSaveNiftiShow = this.onModalSaveNiftiShow.bind(this);
    this.onModalSaveNiftiHide = this.onModalSaveNiftiHide.bind(this);

    this.state = {
      showModalSaveNifti: false,
    };
  }
  // invoked after render
  componentDidMount() {
  }
  onModalSaveNiftiShow() {
    this.setState({ showModalSaveNifti: true });
  }
  onModalSaveNiftiHide() {
    this.setState({ showModalSaveNifti: false });
    // console.log('onModalSaveNiftiHide...');
  }
  //
  // render
  //
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
          <button className="dropdown-item" type="button" onClick={evt => this.onModalSaveNiftiShow(evt)} >
            <i className="fas fa-globe"></i>
            Save to Nifti
          </button>
        </div>
        <UiModalSaveNifti stateVis={this.state.showModalSaveNifti} onHide={this.onModalSaveNiftiHide} />
      </div>

    return jsxSaveMenu;
  }
}

export default connect(store => store)(UiSaveMenu);


