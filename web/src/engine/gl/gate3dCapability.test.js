import { describe, it, expect } from 'vitest';
import { decide3dCapabilityGate, gate3dCapabilityFromGl, RENDER_ERROR } from './gate3dCapability';

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

describe('decide3dCapabilityGate', () => {
  it('proceeds on full WebGL2 + float color buffer capability', () => {
    const gate = decide3dCapabilityGate({ webgl2: true, colorBufferFloat: true, reason: RENDER_ERROR.NONE });
    expect(gate).toEqual({ proceed: true, isWebGL2: 1, error: RENDER_ERROR.NONE });
  });

  it('blocks and reports webgl2 when the context is not WebGL2', () => {
    const gate = decide3dCapabilityGate({ webgl2: false, colorBufferFloat: false, reason: RENDER_ERROR.WEBGL2 });
    expect(gate.proceed).toBe(false);
    expect(gate.isWebGL2).toBe(0);
    expect(gate.error).toBe(RENDER_ERROR.WEBGL2);
  });

  it('blocks and reports colorBufferFloat when the float extension is missing', () => {
    const gate = decide3dCapabilityGate({ webgl2: true, colorBufferFloat: false, reason: RENDER_ERROR.COLOR_BUFFER_FLOAT });
    expect(gate.proceed).toBe(false);
    expect(gate.isWebGL2).toBe(1);
    expect(gate.error).toBe(RENDER_ERROR.COLOR_BUFFER_FLOAT);
  });

  it('blocks a null/undefined capability object', () => {
    expect(decide3dCapabilityGate(null).proceed).toBe(false);
    expect(decide3dCapabilityGate(null).error).toBe(RENDER_ERROR.WEBGL2);
    expect(decide3dCapabilityGate(undefined).proceed).toBe(false);
  });
});

describe('gate3dCapabilityFromGl', () => {
  it('proceeds for a capable WebGL2 context', () => {
    expect(gate3dCapabilityFromGl(makeWebGL2(true))).toEqual({ proceed: true, isWebGL2: 1, error: RENDER_ERROR.NONE });
  });

  it('blocks a WebGL1 context', () => {
    const gate = gate3dCapabilityFromGl(makeWebGL1());
    expect(gate.proceed).toBe(false);
    expect(gate.error).toBe(RENDER_ERROR.WEBGL2);
  });

  it('blocks a WebGL2 context lacking EXT_color_buffer_float', () => {
    const gate = gate3dCapabilityFromGl(makeWebGL2(false));
    expect(gate.proceed).toBe(false);
    expect(gate.error).toBe(RENDER_ERROR.COLOR_BUFFER_FLOAT);
  });

  it('blocks a null context', () => {
    expect(gate3dCapabilityFromGl(null).proceed).toBe(false);
  });
});
