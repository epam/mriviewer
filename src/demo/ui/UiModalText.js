/**
 * @fileOverview UiModalText
 * @author Epam
 * @version 1.0.0
 */

// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

// ********************************************************
// Class
// ********************************************************

class UiModalText extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onButtonOk = this.onButtonOk.bind(this);
    this.onTexChange = this.onTexChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    // this.onSaveNifti = this.onSaveNifti.bind(this);

    this.m_showFunc = null;
    this.m_hideFunc = null;

    this.state = {
      text: ''
    };
  } // end constr
  onTextEntered() {
    const store = this.props;
    const gra = store.graphics2d;
    const toolText = gra.m_toolText;
    toolText.setText(this.state.text);
    this.setState({ text: '' });
  }
  /**
   * When user press OK button
   */
  onButtonOk() {
    // console.log('on button ok');
    this.m_hideFunc();
    this.onTextEntered();
  }
  handleFormSubmit(evt) {
    evt.preventDefault();
    this.m_hideFunc();
    this.onTextEntered();
  }
  onTexChange(evt) {
    const strText = evt.target.value;
    // console.log(`onTexChange. text = ${strText}`);
    this.setState({ text: strText });
  }
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;
    const onShowFunc = this.props.onShow;
    this.m_hideFunc = onHideFunc;
    this.m_showFunc = onShowFunc;
    // console.log(`UiModalText. setup funcs: ${this.m_showFunc}, ${this.m_hideFunc}`);

    const jsxModalText =
    <Modal show={stateVis} onHide={onHideFunc} >

      <Modal.Body>

        <Modal.Title>
          Input text
        </Modal.Title>

        <Form onSubmit={evt => this.handleFormSubmit(evt)} >
          <Form.Control required type="text" placeholder=""
            defaultValue={this.state.text} onChange={this.onTexChange} autoFocus={true}  />
        </Form>
        <Row>
          <Col lg xl="2">
            <Button onClick={onHideFunc} >
              Cancel
            </Button>
          </Col>

          <Col lg xl="2">
            <Button onClick={this.onButtonOk} >
              Ok
            </Button>
          </Col>

          <Col lg xl="8">
          </Col>

        </Row>

      </Modal.Body>

    </Modal>
    return jsxModalText;
  } // end render

} // end class

export default connect(store => store)(UiModalText);
