import { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const UiVolIcon = (props) => {
  const { index } = props;
  const objCanvas = useRef(null);
  const iconSide = 100;

  // Use the useSelector hook here
  const volSet = useSelector((state) => state.volumeSet);

  const createIcon = (vol) => {
    // Define icon dimensions
    const numPixelsIcon = iconSide * iconSide;

    // Create a new array to hold the icon data
    const dataIcon = new Uint8Array(numPixelsIcon);

    // Determine scale and central slice
    const sizeSrcMax = Math.max(vol.m_xDim, vol.m_yDim);
    const scale = sizeSrcMax / iconSide;
    const zCenter = Math.floor(vol.m_zDim / 2);
    const zOff = zCenter * vol.m_xDim * vol.m_yDim;

    // Calculate dimensions for the icon
    const wDst = Math.floor((iconSide * vol.m_xDim) / sizeSrcMax);
    const hDst = Math.floor((iconSide * vol.m_yDim) / sizeSrcMax);
    const xDstL = Math.floor(iconSide / 2 - wDst / 2);
    const yDstT = Math.floor(iconSide / 2 - hDst / 2);

    // Loop to fill the icon data
    for (let yDst = 0; yDst < hDst; yDst++) {
      const ySrc = Math.floor(yDst * scale);
      for (let xDst = 0; xDst < wDst; xDst++) {
        const xSrc = Math.floor(xDst * scale);
        const val = vol.m_dataArray[xSrc + ySrc * vol.m_xDim + zOff];
        const xWrite = xDst + xDstL;
        const yWrite = yDst + yDstT;
        dataIcon[xWrite + yWrite * iconSide] = val;
      }
    }

    return dataIcon;
  };

  useEffect(() => {
    const vol = volSet.getVolume(index);

    // Early exit if volume data or canvas is not available
    if (!vol || !objCanvas.current) return;
    console.log('vol = ', vol);
    const iconData = createIcon(vol);
    const canvas = objCanvas.current;
    const ctx = canvas.getContext('2d');

    // Set up canvas dimensions
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Clear canvas with a background color
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(0, 0, w, h);

    // Prepare image data for canvas
    const imgData = ctx.createImageData(w, h);
    for (let i = 0, len = w * h; i < len; i++) {
      const val = iconData[i];
      const pixelIndex = i * 4;
      imgData.data[pixelIndex] = val; // R
      imgData.data[pixelIndex + 1] = val; // G
      imgData.data[pixelIndex + 2] = val; // B
      imgData.data[pixelIndex + 3] = 255; // A
    }

    // Draw the image data to the canvas
    ctx.putImageData(imgData, 0, 0);
  }, [index, volSet]);

  return <canvas ref={objCanvas} width={iconSide} height={iconSide} />;
};
