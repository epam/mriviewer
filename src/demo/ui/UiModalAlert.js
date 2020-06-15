/**
 * @fileOverview UiModalAlert
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { Modal, Button, Row, Col } from 'react-bootstrap';

// ********************************************************
// Class
// ********************************************************

class UiModalAlert extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onButtonOk = this.onButtonOk.bind(this);

    this.m_showFunc = null;
    this.m_hideFunc = null;

    this.state = {
      title: '',
      text: '',
    };
  } // end constr
  /**
   * When user press OK button
   */
  onButtonOk() {
    // console.log('on button OK');
    this.m_hideFunc();
  }
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    const onShowFunc = this.props.onShow;
    this.m_hideFunc = onHideFunc;
    this.m_showFunc = onShowFunc;
    // console.log(`UiModalAlert. setup funcs: ${this.m_showFunc}, ${this.m_hideFunc}`);

    const strTitle = this.props.title;
    const strText = this.props.text;

    const jsxModalAlert =
    <Modal show={stateVis} onHide={onHideFunc} >

      <Modal.Header closeButton>
        <Modal.Title>
          {strTitle}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          {strText}
        </p>


        <Row>
          <Col lg xl="2">
            <Button onClick={this.onButtonOk} >
              Ok
            </Button>
          </Col>

          <Col lg xl="10">
          </Col>
        </Row>

      </Modal.Body>

    </Modal>
    return jsxModalAlert;
  } // end render

} // end class

export default connect(store => store)(UiModalAlert);
