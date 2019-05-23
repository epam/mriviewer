/**
 * @fileOverview UiReportMenu
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { NavDropdown } from 'react-bootstrap';

import UiModalDicomTags from './UiModalDicomTags';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiReportMenu some text later...
 */
class UiReportMenu extends React.Component {
  // constructor
  constructor(props) {
    super(props);

    this.onModalDicomTagsShow = this.onModalDicomTagsShow.bind(this);
    this.onModalDicomTagsHide = this.onModalDicomTagsHide.bind(this);

    this.state = {
      showModalDicomTags: false,
    };
  }
  onModalDicomTagsShow() {
    this.setState({ showModalDicomTags: true });
  }
  onModalDicomTagsHide() {
    this.setState({ showModalDicomTags: false });
  }
  onModalScreenshot() {
  }
  // invoked after render
  componentDidMount() {
  }
  render() {
    const store = this.props;
    const isLoaded = store.isLoaded;

    const strDisabled = (isLoaded) ? false : true;
    const jsxReportMenu = 
      <NavDropdown id="save-nav-dropdown" 
        disabled={strDisabled}
        title={
          <div style={{ display: 'inline-block' }}> 
            <i className="fas fa-book"></i>
            Report
          </div>
        } >
        <NavDropdown.Item onClick={this.onModalDicomTagsShow} >
          <i className="fas fa-clipboard-list"></i>
          Show tags
        </NavDropdown.Item>

        <NavDropdown.Item onClick={this.onModalScreenshot} >
          <i className="fas fa-camera"></i>
          Screenshot
        </NavDropdown.Item>

        <UiModalDicomTags stateVis={this.state.showModalDicomTags}
          onHide={this.onModalDicomTagsHide} />

      </NavDropdown>;    

    return jsxReportMenu;
  }
}

export default connect(store => store)(UiReportMenu);
