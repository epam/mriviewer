const BYTES_PER_PIXEL = 4;

export function resamplePixels(src, srcWidth, srcHeight, dstWidth, dstHeight) {
  const dst = new Uint8ClampedArray(dstWidth * dstHeight * BYTES_PER_PIXEL);
  if (srcWidth <= 0 || srcHeight <= 0 || dstWidth <= 0 || dstHeight <= 0) {
    return dst;
  }
  for (let y = 0; y < dstHeight; y++) {
    const srcY = Math.min(srcHeight - 1, Math.floor(((y + 0.5) * srcHeight) / dstHeight));
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.min(srcWidth - 1, Math.floor(((x + 0.5) * srcWidth) / dstWidth));
      const iSrc = (srcY * srcWidth + srcX) * BYTES_PER_PIXEL;
      const iDst = (y * dstWidth + x) * BYTES_PER_PIXEL;
      dst[iDst] = src[iSrc];
      dst[iDst + 1] = src[iSrc + 1];
      dst[iDst + 2] = src[iSrc + 2];
      dst[iDst + 3] = src[iSrc + 3];
    }
  }
  return dst;
}
