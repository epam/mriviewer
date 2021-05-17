/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

class UiModalAlert extends React.Component {
  constructor(props) {
    super(props);
    this.onButtonOk = this.onButtonOk.bind(this);

    this.m_showFunc = null;
    this.m_hideFunc = null;

    this.state = {
      title: '',
      text: '',
    };
  }

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

    return <Modal show={stateVis} onHide={onHideFunc}>

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
            <Button onClick={this.onButtonOk}>
              Ok
            </Button>
          </Col>

          <Col lg xl="10">
          </Col>
        </Row>

      </Modal.Body>

    </Modal>;
  } // end render

} // end class

export default connect(store => store)(UiModalAlert);
