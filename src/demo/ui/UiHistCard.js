/**
 * @fileOverview UiHistCard
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { Card } from 'react-bootstrap';

import UiHistogram from './UiHistogram';


// ********************************************************
// Const
// ********************************************************


// ********************************************************
// Class
// ********************************************************

/**
 * Class UiHistCard some text later...
 */
class UiHistCard extends React.Component {
  /**
   * Main component render func callback
   */
  render() {
    const vol = this.props.volume;
    if (vol === undefined) {
      return <p>UiHistogram.props volume is not defined !!!</p>;
    }
    const transfFuncCallback = this.props.transfFunc;
    const transfFuncUpdateCallback = this.props.transfFuncUpdate;
    
    let strMsg = 'Volume histogram';
    if (vol !== null) {
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const bpp = vol.m_bytesPerVoxel;
      const strDim = xDim.toString() + '*' + yDim.toString() + '*' + zDim.toString();
      const strBox = vol.m_boxSize.x.toFixed(2) + '*' + vol.m_boxSize.y.toFixed(2) + '*' + vol.m_boxSize.z.toFixed(2);
      strMsg = 'Volume histogram: Dim = ' + strDim + '; bpp = ' + bpp.toString() + '; box = ' + strBox;
    }
    // const cw = this.state.width;
    // const ch = this.state.height;

    const jsxHistCard = 
      <Card>
        <Card.Body>
          <Card.Title>
            {strMsg}
          </Card.Title>
          <UiHistogram volume={vol}
            transfFunc={transfFuncCallback} transfFuncUpdate={transfFuncUpdateCallback}  />
          { /*
          <div ref={ (mount) => {this.m_canvasOwner = mount} }>
            <canvas ref="canvasHistogram" width={cw} height={ch} 
              onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} />
          </div>
          */ }
        </Card.Body>
      </Card>
    return jsxHistCard;
  } // end render

} // end class

export default UiHistCard;
