/**
 * @fileOverview UiModalDemo
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import { Container, Row, Col, Image } from 'react-bootstrap';
import { Modal, Button } from 'react-bootstrap';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiModalDemo some text later...
 */
class UiModalDemo extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onModalShow = this.onModalShow.bind(this);
    this.onModalHide = this.onModalHide.bind(this);
    this.onButton0 = this.onButton0.bind(this);
    this.onButton1 = this.onButton1.bind(this);
    this.onDemo = this.onDemo.bind(this);
    this.state = {
      showModalDemo: false
    };
  }
  onModalShow() {
    this.setState({ showModalDemo: true });
  }
  onModalHide() {
    this.setState({ showModalDemo: false });
  }
  onDemo(index) {
    const onSelectFunc = this.props.onSelectDemo;
    const onHideFunc = this.props.onHide;
    onHideFunc();
    onSelectFunc(index);
  }
  onButton0() {
    this.onDemo(0);
  }
  onButton1() {
    this.onDemo(1);
  }
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;

    const jsxModalDemo = 
      <Modal show={stateVis} onHide={onHideFunc} >
        <Modal.Title>
          Load demo data
        </Modal.Title>
        <Modal.Header closeButton>
          <Modal.Body>

            <Container>
              <Row>
                <Col xs={6} md={4}>
                  <Button variant="light" onClick={this.onButton0} >
                    <Image src="images/thumb_lungs.png" alt="lungs" thumbnail />
                  </Button>
                </Col>
                <Col xs={6} md={4}>
                  <Button variant="light" onClick={this.onButton1} >
                    <Image src="images/thumb_brain.png" alt="brain" thumbnail />
                  </Button>
                </Col>
              </Row>
            </Container>

          </Modal.Body>
        </Modal.Header>
      </Modal>
    return jsxModalDemo;
  } // end render
} // end class

export default connect(store => store)(UiModalDemo);
