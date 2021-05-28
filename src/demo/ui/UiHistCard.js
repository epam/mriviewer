/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import UiHistogram from './UiHistogram';

const UiHistCard = ({
    volume,
    transfFunc,
    transfFuncUpdate,
  }) => {
  const vol = volume;
  if (vol === undefined) {
    return <p>UiHistogram.props volume is not defined !!!</p>;
  }
  
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

  return <Card>
    <Card.Body>
      <Card.Title>
        {strMsg}
      </Card.Title>
      <UiHistogram volume={vol}
                   transfFunc={transfFunc} transfFuncUpdate={transfFuncUpdate}/>
      { /*
        <div ref={ (mount) => {this.m_canvasOwner = mount} }>
          <canvas ref="canvasHistogram" width={cw} height={ch}
            onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} />
        </div>
        */}
    </Card.Body>
  </Card>;
};

export default UiHistCard;
