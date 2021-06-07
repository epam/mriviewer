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

import UiCtrl2d from './UiCtrl2d';
import Graphics2d from '../engine/Graphics2d';
import UiSegm2d from './UiSegm2d';
import UiVolumeSel from './UiVolumeSel'

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
    const volSet = store.volumeSet;
    const vols = volSet.m_volumes;
    const numVols = vols.length;

    return <>
      <UiCtrl2d/>
      <UiSegm2d/>
      {(numVols > 1) ? <UiVolumeSel /> : <br />}
      <Graphics2d/>
    </>;
  };
}

export default connect(store => store)(UiMain2d);
