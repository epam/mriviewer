import { describe, it, expect } from 'vitest';
import { render3dErrorMessage } from './render3dErrorMessage';
import { RENDER_ERROR } from './gate3dCapability';

describe('render3dErrorMessage', () => {
  it('returns null when there is no error (NONE / null / undefined)', () => {
    expect(render3dErrorMessage(RENDER_ERROR.NONE)).toBeNull();
    expect(render3dErrorMessage(null)).toBeNull();
    expect(render3dErrorMessage(undefined)).toBeNull();
  });

  it('maps the webgl2 reason to a WebGL2 message', () => {
    expect(render3dErrorMessage(RENDER_ERROR.WEBGL2)).toMatch(/WebGL2/);
  });

  it('maps the colorBufferFloat reason to a float color buffer message', () => {
    expect(render3dErrorMessage(RENDER_ERROR.COLOR_BUFFER_FLOAT)).toMatch(/float color buffer/i);
  });

  it('maps the shader reason to the exact shader-failure message', () => {
    expect(render3dErrorMessage(RENDER_ERROR.SHADER)).toBe('3D shaders failed to load.');
  });

  it('maps the framebuffer reason to the exact framebuffer message', () => {
    expect(render3dErrorMessage(RENDER_ERROR.FRAMEBUFFER)).toBe('3D render target (framebuffer) is incomplete.');
  });

  it('falls back to a generic message for an unknown reason', () => {
    expect(render3dErrorMessage('mystery')).toBe('3D rendering is unavailable (mystery).');
  });
});
