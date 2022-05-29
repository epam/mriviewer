/*
 * Copyright 2022 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { VOLUME_ICON_SIDE } from '../../../engine/Volume';

export const UiVolIcon = (props) => {
  let m_volIndex = -1;
  useEffect(() => {
    // console.log("UiVlIcon.componentDidMount");
    const store = useSelector((state) => state);
    const volSet = store.volumeSet;
    const vol = volSet.getVolume(m_volIndex);
    // console.log(`vol icon = ${vol.m_xIcon} * ${vol.m_yIcon}`);
    const objCanvas = useRef(null);
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.current.getContext('2d');
    const w = objCanvas.current.clientWidth;
    const h = objCanvas.current.clientHeight;
    if (w * h === 0) {
      return;
    }
    // clear dest image
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0, 0, w, h);
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
  }, []);
  const side = VOLUME_ICON_SIDE;
  m_volIndex = props.index;
  return <canvas ref={objCanvas} width={side} height={side} />;
};
