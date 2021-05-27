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
import { NavDropdown } from 'react-bootstrap';

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
    const strDisabled = (isLoaded) ? false : true;
   
    const jsxSaveMenu =
      <NavDropdown id="save-nav-dropdown" 
        disabled={strDisabled}
        title={
          <div style={{ display: 'inline-block' }}> 
            <i className="fas fa-save"></i>
            Save
          </div>
        } >
        <NavDropdown.Item onClick={evt => this.onModalSaveNiftiShow(evt)}  >
          <i className="fas fa-globe"></i>
          Save to Nifti
        </NavDropdown.Item>
        <UiModalSaveNifti stateVis={this.state.showModalSaveNifti} onHide={this.onModalSaveNiftiHide} />
      </NavDropdown>;


    return jsxSaveMenu;
  }
}

export default connect(store => store)(UiSaveMenu);


