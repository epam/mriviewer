export function computeCanvasLayout(containerW, containerH, imageAspect, dpr = 1, zoom = 1) {
  const safeDpr = dpr > 0 ? dpr : 1;
  const safeZoom = zoom > 0 ? zoom : 1;

  const backingW = Math.max(0, Math.round(containerW * safeDpr));
  const backingH = Math.max(0, Math.round(containerH * safeDpr));

  if (backingW === 0 || backingH === 0 || !(imageAspect > 0)) {
    return { backingW, backingH, drawW: 0, drawH: 0, offsetX: 0, offsetY: 0 };
  }

  const containerAspect = backingW / backingH;

  let fitW;
  let fitH;
  if (imageAspect > containerAspect) {
    fitW = backingW;
    fitH = backingW / imageAspect;
  } else {
    fitH = backingH;
    fitW = backingH * imageAspect;
  }

  const drawW = fitW * safeZoom;
  const drawH = fitH * safeZoom;

  const offsetX = (backingW - drawW) / 2;
  const offsetY = (backingH - drawH) / 2;

  return { backingW, backingH, drawW, drawH, offsetX, offsetY };
}
