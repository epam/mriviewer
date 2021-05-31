/**
 * @fileOverview UiAbout
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Modal } from 'react-bootstrap'

import packageJson from '../../../package.json';
import UiSkelAni from './UiSkelAni';
import { SVG } from "./Button/SVG";
import { UIButton } from "./Button/Button";

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiAbout dialog
 */
export default class UiAbout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalShow: false
    };
    this.onShow = this.onShow.bind(this);
    this.onHide = this.onHide.bind(this);
  }

  onShow() {
    this.setState({ modalShow: true });
  }

  onHide() {
    this.setState({ modalShow: false });
  }

  render() {

    const strVer = packageJson.version;
    const strName = packageJson.name;
    const strDescription = packageJson.description;
    const strAuthor = packageJson.author;
    const strYear = packageJson.year;

    const strButtonOnly =  <SVG onClick={this.onShow} name="logo" title="Logo"/>
    const strButtonWithTrigger =
    <OverlayTrigger 
      key="about"
      placement="bottom"
      overlay = {
        <Tooltip>
          See detailed information about this app
        </Tooltip>
      }
    >
      {strButtonOnly}
    </OverlayTrigger>;

    const strBtnDynamic = (this.state.modalShow) ? strButtonOnly : strButtonWithTrigger;


    const strAbout = 
    <>

      {strBtnDynamic}

      <Modal show={this.state.modalShow} onHide={this.onHide} >
        <Modal.Title>
          {strName}
        </Modal.Title>
        <Modal.Header>
          <Modal.Body className="text-center">
            <UiSkelAni />
            <p>
              {strDescription}
            </p>
            <p>
              <b>Version: </b> {strVer}
            </p>
            <p>
              <b>Copyright: </b> {strYear} {strAuthor}
            </p>

          </Modal.Body>
        </Modal.Header>

        <Modal.Footer>
          <UIButton handler={this.onHide} icon="square" />
        </Modal.Footer>

      </Modal>
    </>
    return strAbout;

  }
}

