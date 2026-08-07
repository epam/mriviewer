export const CAP_REASON = {
  OK: null,
  WEBGL2: 'webgl2',
  COLOR_BUFFER_FLOAT: 'colorBufferFloat',
  FLOAT_LINEAR: 'floatLinear',
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

export function hasFloatLinear(gl) {
  if (!gl || typeof gl.getExtension !== 'function') {
    return false;
  }
  return gl.getExtension('OES_texture_float_linear') != null;
}

export function detect3dCapabilities(gl) {
  const webgl2 = isWebGL2Context(gl);
  if (!webgl2) {
    return { webgl2: false, colorBufferFloat: false, floatLinear: false, reason: CAP_REASON.WEBGL2 };
  }
  const colorBufferFloat = hasColorBufferFloat(gl);
  if (!colorBufferFloat) {
    return { webgl2: true, colorBufferFloat: false, floatLinear: false, reason: CAP_REASON.COLOR_BUFFER_FLOAT };
  }
  const floatLinear = hasFloatLinear(gl);
  if (!floatLinear) {
    return { webgl2: true, colorBufferFloat: true, floatLinear: false, reason: CAP_REASON.FLOAT_LINEAR };
  }
  return { webgl2: true, colorBufferFloat: true, floatLinear: true, reason: CAP_REASON.OK };
}
