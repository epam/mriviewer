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
      checkboxes: arrState,
    };
  }
  render() {

    /*
          {this.state.checkboxes.map(elem => {
            const obj = <Form.Check type="checkbox" label={elem.name} />;
            return obj;
          })}
    */          

    //                   <i className="fa fa-question-circle">  </i>


    const jsxRoiModal =
      <Card style={{ height: '350px', 'overflowY': 'auto' }}>
        <Card.Body>
          <Card.Title>
            ROI Selector
          </Card.Title>
          <Form.Group controlId="ROI selector">
            {this.state.checkboxes.map(elem => {
              const strCol = elem.strColor;
              const obj = 
                  <Form.Check type="checkbox" label={elem.name} key={elem.id} style={{ 'background-color': strCol }} />
              return obj;
            })}
          </Form.Group>
        </Card.Body>
      </Card>;

    //return jsxRoiSel;
    return jsxRoiModal;
  }
}

export default connect(store => store)(UiRoiSelect);
