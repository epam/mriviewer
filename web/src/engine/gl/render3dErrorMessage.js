import { RENDER_ERROR } from './gate3dCapability';

export const RENDER_ERROR_MESSAGE = {
  [RENDER_ERROR.WEBGL2]: '3D rendering requires WebGL2, which is not available in this browser.',
  [RENDER_ERROR.COLOR_BUFFER_FLOAT]:
    '3D rendering requires float color buffer support (EXT_color_buffer_float), which is unavailable on this device.',
  [RENDER_ERROR.SHADER]: '3D shaders failed to load.',
};

export function render3dErrorMessage(reason) {
  if (!reason) {
    return null;
  }
  return RENDER_ERROR_MESSAGE[reason] || `3D rendering is unavailable (${reason}).`;
}
