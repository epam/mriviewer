/**
 * @fileOverview UiRoiSelect
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import { connect } from 'react-redux';
import { Form, Card } from 'react-bootstrap';
import { Row, Col } from 'react-bootstrap';

import RoiPalette from '../engine/loaders/roipalette';


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

class UiRoiSelect extends React.Component {
  constructor(props) {
    super(props);

    this.m_setRoiFunc = undefined;

    this.onChangeSelectAll = this.onChangeSelectAll.bind(this);
    this.onChangeRoiIndi = this.onChangeRoiIndi.bind(this);

    this.m_roiPalette = new RoiPalette();
    const arrPal = this.m_roiPalette.getPalette();
    const numPalElems = arrPal.length;
    
    const NUM_PAL_ELEMS = 94;
    if (numPalElems !== NUM_PAL_ELEMS) {
      console.log(`numPalElems = ${numPalElems}, but expected = ${NUM_PAL_ELEMS} `);
    }

    const arrState = arrPal.map( (elem) => {
      const ename = elem.name;
      const ecolor = elem.roiColor;
      const eid = elem.roiId;
      const eposition = elem.position;

      const arrColor = ecolor.split(' ');
      const rCol = Math.floor(arrColor[0] * 255);
      const gCol = Math.floor(arrColor[1] * 255);
      const bCol = Math.floor(arrColor[2] * 255);
      const strCol = '#' + rCol.toString(16) + gCol.toString(16) + bCol.toString(16);
      // console.log(`palElem = ${strCol} `);

      const obj  = {
        name: ename,
        color: ecolor,
        strColor: strCol,
        id: eid,
        position: eposition,
        selected: false,
      };
      // console.log(`palElem = ${obj.name}, ${rcol}, ${rid}, ${posi} `);
      return obj;
    });
    this.state = {
      allSelected: false,
      checkboxes: arrState,
    };
  }
  /**
   * On change individual
   * 
   * @param {object} evt - event
   */
  onChangeRoiIndi(evt) {
    // obj is type: HTMLInputElement
    const obj = evt.target;
    const isCheck = obj.checked;
    const id = Number.parseInt(obj.id);
    const ind = this.state.checkboxes.findIndex( elem => {
      const isEq = (elem.id === id);
      return isEq;
    });
    // console.log(`id = ${id}`);
    // console.log(`ind = ${ind}`);
    // console.log(`isCheck = ${isCheck}`);

    const arrStates = this.state.checkboxes;
    if (ind >= 0) {
      arrStates[ind].selected = isCheck;
      this.setState({ checkboxes: arrStates });

      if (this.m_setRoiFunc !== undefined) {
        this.m_setRoiFunc(arrStates);
      }
    }
  }
  /**
   * On select all chech box event handler
   * 
   * @param {object} evt  - event
   */
  onChangeSelectAll(evt) {
    const isCheck = evt.target.checked;
    // console.log(`isCheck = ${isCheck}`);
    const arrStates = this.state.checkboxes;
    const numElems = arrStates.length;
    for (let i = 0; i < numElems; i++) {
      arrStates[i].selected = isCheck;
    }
    this.setState({ checkboxes: arrStates });
    this.setState({ allSelected: isCheck });
    if (this.m_setRoiFunc !== undefined) {
      this.m_setRoiFunc(arrStates);
    }
  }
  render() {
    this.m_setRoiFunc = this.props.setRoiFunc;
    const isAllSel = this.state.allSelected;
    const strSel = (isAllSel) ? 'Select none' : 'Select all';
    const jsxRoiCard =
      <Card style={{ height: '350px', 'overflowY': 'auto' }}>
        <Card.Body>
          <Card.Title>
            ROI Selector
          </Card.Title>
          <Form.Group controlId="ROI selector">
            <Form.Check type="checkbox" key="selall" label={strSel} onChange={this.onChangeSelectAll}/>
            {this.state.checkboxes.map(elem => {
              const strCol = elem.strColor;
              const obj = 
                  <Row key={elem.id} id={elem.id} >
                    <Col xs lg="11">
                      <Form.Check type="checkbox" label={elem.name} key={elem.id}
                        id={elem.id}
                        checked={elem.selected}
                        onChange={this.onChangeRoiIndi} />
                    </Col>
                    <Col xs lg="1">
                      <i className="fa fa-square" style={{ 'color': strCol }}>  </i>
                    </Col>
                  </Row>
              return obj;
            })}
          </Form.Group>
        </Card.Body>
      </Card>;

    return jsxRoiCard;
  }
}

export default connect(store => store)(UiRoiSelect);
