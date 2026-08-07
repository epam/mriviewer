import { detect3dCapabilities, CAP_REASON } from './detect3dCapabilities';

export const RENDER_ERROR = {
  NONE: CAP_REASON.OK,
  WEBGL2: CAP_REASON.WEBGL2,
  COLOR_BUFFER_FLOAT: CAP_REASON.COLOR_BUFFER_FLOAT,
  SHADER: 'shader',
};

export function decide3dCapabilityGate(caps) {
  if (!caps || caps.webgl2 !== true) {
    return { proceed: false, isWebGL2: 0, error: RENDER_ERROR.WEBGL2 };
  }
  if (caps.colorBufferFloat !== true) {
    return { proceed: false, isWebGL2: 1, error: RENDER_ERROR.COLOR_BUFFER_FLOAT };
  }
  return { proceed: true, isWebGL2: 1, error: RENDER_ERROR.NONE };
}

export function gate3dCapabilityFromGl(gl) {
  return decide3dCapabilityGate(detect3dCapabilities(gl));
}
