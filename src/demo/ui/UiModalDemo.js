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

// File list for demo

//
// OneDrive links
//
// ktx / ct_256..
// https://epam-my.sharepoint.com/:u:/p/vladislav_shubnikov/EY01jASe0VBFgBAF8Y8Wb70BBnJMKnsR7Lttj-ikMLT25A?e=3PZffy
// ktx / lungs_256....
// https://epam-my.sharepoint.com/:u:/p/vladislav_shubnikov/EVvyy6uKRvxLnfOyWYSay-IBrKxDYmOm8b7OLPUzRkWY5g?e=T6i7YM
// nifti / gm3_...
// https://epam-my.sharepoint.com/:u:/p/vladislav_shubnikov/ERGfqrfwaONFo1GvgGdJkTwBypBudizNsKmYiQN5ucw-4A?e=rQtgJi
//

// Old refs
//
// https://med3web.opensource.epam.com/data/ktx/ct_256_256_256.ktx
// https://med3web.opensource.epam.com/data/dicom/20121029/2_1.dcm
// https://med3web.opensource.epam.com/data/hdr/set_mask.h
// https://med3web.opensource.epam.com/data/ktx/brain.ktx
// https://med3web.opensource.epam.com/data/ktx/brain_clipped.ktx

//

//
// http://www.d-inter.ru/private/med3web/data/ktx/ct_256_256_256.ktx
// http://www.d-inter.ru/private/med3web/data/ktx/lungs_256_256_256.ktx
// http://www.d-inter.ru/private/med3web/data/nifti/gm3_512_512_165.nii
//
// http://www.d-inter.ru/private/med3web/data/dicom/00cba091fa4ad62cc3200a657aeb957e/034673134cbef5ea15ff9e0c8090500a.dcm
// http://www.d-inter.ru/private/med3web/data/dicom/woman_pelvis/vhf.901.dcm
//

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
    this.onButton2 = this.onButton2.bind(this);
    this.onButton3 = this.onButton3.bind(this);
    this.onButton4 = this.onButton4.bind(this);
    this.onButton5 = this.onButton5.bind(this);
    this.onButton6 = this.onButton6.bind(this);
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
  onButton2() {
    this.onDemo(2);
  }
  onButton3() {
    this.onDemo(3);
  }
  onButton4() {
    this.onDemo(4);
  }
  onButton5() {
    this.onDemo(5);
  }
  onButton6() {
    this.onDemo(6);
  }
  render() {
    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;

    const jsxModalDemo = 
      <Modal show={stateVis} onHide={onHideFunc} >
        <Modal.Header closeButton>
          <Modal.Title>
            Load demo data
          </Modal.Title>
        </Modal.Header>
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
              <Col xs={6} md={4}>
                <Button variant="light" onClick={this.onButton2} >
                  <Image src="images/thumb_gm3_512_512_165.png" alt="gm3" thumbnail />
                </Button>
              </Col>
              <Col xs={6} md={4}>
                <Button variant="light" onClick={this.onButton3} >
                  <Image src="images/thumb_woman_pelvis.png" alt="woman_pelvis" thumbnail />
                </Button>
              </Col>
              <Col xs={6} md={4}>
                <Button variant="light" onClick={this.onButton4} >
                  <Image src="images/thumb_ocb.png" alt="woman_pelvis" thumbnail />
                </Button>
              </Col>
              <Col xs={6} md={4}>
                <Button variant="light" onClick={this.onButton5} >
                  <Image src="images/thumb_ct_256.png" alt="ct_256" thumbnail />
                </Button>
              </Col>
              <Col xs={6} md={4}>
                <Button variant="light" onClick={this.onButton6} >
                  <Image src="images/thumb_lungs_256.png" alt="lungs_256" thumbnail />
                </Button>
              </Col>

            </Row>
          </Container>

        </Modal.Body>
      </Modal>
    return jsxModalDemo;
  } // end render
} // end class

export default connect(store => store)(UiModalDemo);
