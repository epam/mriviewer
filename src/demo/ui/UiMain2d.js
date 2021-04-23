/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'react-redux';

// import UiCtrl2d from './UiCtrl2d';
import Graphics2d from '../engine/Graphics2d';
// import UiTools2d from './UiTools2d';
// import UiSegm2d from './UiSegm2d';
import UiVolumeSel from './UiVolumeSel'

// import UiHistCard from './UiHistCard';
class UiMain2d extends React.Component {
  transferFuncCallback(transfFuncObj) {
    const i = transfFuncObj.m_indexMoved;
    const x = transfFuncObj.m_handleX[i];
    const y = transfFuncObj.m_handleY[i];
    console.log(`moved point[${i}] = ${x}, ${y}  `);
  }
  render() {
    const store = this.props;
    // const dicomSeries = store.dicomSeries;
    // const numSer = dicomSeries.length;
    const volSet = store.volumeSet;
    const vols = volSet.m_volumes;
    const numVols = vols.length;
    const jsxVolSel = (numVols > 1) ? <UiVolumeSel /> : <br />


    const jsxMain2d = <div>
      {/*<UiCtrl2d />*/}
      {/*<UiTools2d />*/}
      {/*<UiSegm2d />*/}
      {jsxVolSel}

      <Graphics2d  />
    </div>
    return jsxMain2d;
  };
}

export default connect(store => store)(UiMain2d);
