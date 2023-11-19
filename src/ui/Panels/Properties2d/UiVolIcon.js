import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { VOLUME_ICON_SIDE } from '../../../engine/Volume';

export const UiVolIcon = (props) => {
  const { index } = props;
  const objCanvas = useRef(null);

  // Use the useSelector hook here
  const volSet = useSelector((state) => state.volumeSet);

  useEffect(() => {
    const vol = volSet.getVolume(index);

    if (!objCanvas.current) {
      return;
    }
    const ctx = objCanvas.current.getContext('2d');
    const w = objCanvas.current.clientWidth;
    const h = objCanvas.current.clientHeight;
    if (w * h === 0) {
      return;
    }
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0, 0, w, h);
    if (vol.m_xIcon <= 0) {
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
  }, [index, volSet]); // Add both index and volSet as dependencies.

  const side = VOLUME_ICON_SIDE;
  return <canvas ref={objCanvas} width={side} height={side} />;
};
