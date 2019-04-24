/**
 * @fileOverview UiMain2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'react-bootstrap';

import UiCtrl2d from './UiCtrl2d';
import Graphics2d from '../engine/Graphics2d';
import UiHistogram from './UiHistogram';
import UiTools2d from './UiTools2d';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiMain2d some text later...
 */
class UiMain2d extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const vol = store.volume;

    const jsxMain2d = 
      <Row>
        <Col xs lg="4">
          <UiCtrl2d />
          <UiTools2d />
          <UiHistogram volume={vol}/>
        </Col>
        <Col xs lg="8">
          <Graphics2d  />
        </Col>
      </Row>

    return jsxMain2d;
  };
}

export default connect(store => store)(UiMain2d);
