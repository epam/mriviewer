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
  transferFuncCallback(transfFuncObj) {
    const i = transfFuncObj.m_indexMoved;
    const x = transfFuncObj.m_handleX[i];
    const y = transfFuncObj.m_handleY[i];
    console.log(`moved point[${i}] = ${x}, ${y}  `);
  }
  /*
   *
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const vol = store.volume;

    const NEED_TANSF_FUNC = false;
    const funcTra = (NEED_TANSF_FUNC) ? this.transferFuncCallback : undefined;

    const jsxMain2d = 
      <Row>
        <Col xs lg="4">
          <UiCtrl2d />
          <UiTools2d />
          <UiHistogram volume={vol} transfFunc={funcTra} />
        </Col>
        <Col xs lg="8">
          <Graphics2d  />
        </Col>
      </Row>

    return jsxMain2d;
  };
}

export default connect(store => store)(UiMain2d);
