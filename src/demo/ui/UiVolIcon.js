/**
 * @fileOverview UiVolIcon
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';
import { VOLUME_ICON_SIDE } from '../engine/Volume';

// ********************************************************
// Class
// ********************************************************

class UiVolIcon extends React.Component {
  constructor(props) {
    super(props);
    this.m_volIndex = -1;
  }
  componentDidMount() {
    // console.log("UiVlIcon.componentDidMount");
    const store = this.props;
    const volSet = store.volumeSet;
    const vol = volSet.getVolume(this.m_volIndex);
    // console.log(`vol icon = ${vol.m_xIcon} * ${vol.m_yIcon}`);

    const objCanvas = this.m_mount;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext('2d');
    const w = objCanvas.clientWidth;
    const h = objCanvas.clientHeight;
    if (w * h === 0) {
      return;
    }
    // clear dest image
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0,0, w, h);

    if (vol.m_xIcon <= 0) {
      // draw cross on whole image
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w - 1, h - 1);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w - 1, 0);
      ctx.lineTo(0, h - 1);
      ctx.stroke();
      return;
    }
    // copy icon data to screen
    const imgData = ctx.createImageData(w, h);
    const dataDst = imgData.data;
    const numPixels = w * h;
    let j = 0;
    for (let i = 0; i < numPixels; i++) {
      const val = vol.m_dataIcon[i];
      dataDst[j + 0] = val;
      dataDst[j + 1] = val;
      dataDst[j + 2] = val;
      dataDst[j + 3] = 255;
      j += 4;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  // render on screen
  render() {
    const side = VOLUME_ICON_SIDE;
    this.m_volIndex = this.props.index;;
    const jsxCanvas = <canvas ref={ (mount) => {this.m_mount = mount} } width={side} height={side} />
    return jsxCanvas;
  }

} // end class UiVolIcon
export default connect(store => store)(UiVolIcon);
