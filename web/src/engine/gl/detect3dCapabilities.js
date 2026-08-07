export const CAP_REASON = {
  OK: null,
  WEBGL2: 'webgl2',
  COLOR_BUFFER_FLOAT: 'colorBufferFloat',
};

export function isWebGL2Context(gl) {
  if (!gl) {
    return false;
  }
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  return typeof gl.texImage3D === 'function';
}

export function hasColorBufferFloat(gl) {
  if (!gl || typeof gl.getExtension !== 'function') {
    return false;
  }
  return gl.getExtension('EXT_color_buffer_float') != null;
}

export function detect3dCapabilities(gl) {
  const webgl2 = isWebGL2Context(gl);
  if (!webgl2) {
    return { webgl2: false, colorBufferFloat: false, reason: CAP_REASON.WEBGL2 };
  }
  const colorBufferFloat = hasColorBufferFloat(gl);
  if (!colorBufferFloat) {
    return { webgl2: true, colorBufferFloat: false, reason: CAP_REASON.COLOR_BUFFER_FLOAT };
  }
  return { webgl2: true, colorBufferFloat: true, reason: CAP_REASON.OK };
}
