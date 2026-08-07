import { describe, it, expect } from 'vitest';
import { detect3dCapabilities, isWebGL2Context, hasColorBufferFloat, CAP_REASON } from './detect3dCapabilities';

function makeWebGL2(extPresent) {
  return {
    texImage3D() {},
    getExtension(name) {
      if (name === 'EXT_color_buffer_float' && extPresent) {
        return {};
      }
      return null;
    },
  };
}

function makeWebGL1() {
  return {
    getExtension() {
      return null;
    },
  };
}

describe('detect3dCapabilities', () => {
  it('reports ok for WebGL2 with EXT_color_buffer_float', () => {
    const caps = detect3dCapabilities(makeWebGL2(true));
    expect(caps).toEqual({ webgl2: true, colorBufferFloat: true, reason: CAP_REASON.OK });
  });

  it('reports webgl2 reason for a WebGL1 context', () => {
    const caps = detect3dCapabilities(makeWebGL1());
    expect(caps.webgl2).toBe(false);
    expect(caps.colorBufferFloat).toBe(false);
    expect(caps.reason).toBe('webgl2');
  });

  it('reports colorBufferFloat reason for WebGL2 without the extension', () => {
    const caps = detect3dCapabilities(makeWebGL2(false));
    expect(caps.webgl2).toBe(true);
    expect(caps.colorBufferFloat).toBe(false);
    expect(caps.reason).toBe('colorBufferFloat');
  });

  it('treats a null context as no capability', () => {
    const caps = detect3dCapabilities(null);
    expect(caps.webgl2).toBe(false);
    expect(caps.reason).toBe('webgl2');
  });

  it('isWebGL2Context detects the WebGL2-only texImage3D method', () => {
    expect(isWebGL2Context(makeWebGL2(true))).toBe(true);
    expect(isWebGL2Context(makeWebGL1())).toBe(false);
    expect(isWebGL2Context(null)).toBe(false);
  });

  it('hasColorBufferFloat reflects the extension presence', () => {
    expect(hasColorBufferFloat(makeWebGL2(true))).toBe(true);
    expect(hasColorBufferFloat(makeWebGL2(false))).toBe(false);
    expect(hasColorBufferFloat(null)).toBe(false);
  });
});
