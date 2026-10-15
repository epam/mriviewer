import React from 'react';
import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithState } from '../utils/configureTest';
import VolumeSet from './VolumeSet';

const rendererState = { reason: null, renderCalls: 0 };

vi.mock('./VolumeRenderer3d', () => ({
  default: class FakeVolumeRenderer3d {
    constructor() {
      return new Proxy(this, {
        get: (target, prop) => {
          if (prop === 'getRenderErrorReason') {
            return () => rendererState.reason;
          }
          if (prop === 'render') {
            return () => {
              rendererState.renderCalls += 1;
            };
          }
          return prop in target ? target[prop] : () => {};
        },
      });
    }
  },
}));

import Graphics3d from './Graphics3d';

const ERROR_TEST_ID = 'graphics3d-render-error';

describe('Graphics3d render error overlay', () => {
  beforeEach(() => {
    rendererState.reason = null;
    rendererState.renderCalls = 0;
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows no overlay when the renderer reports no error', () => {
    renderWithState(<Graphics3d />, { volumeSet: new VolumeSet() });

    expect(screen.queryByTestId(ERROR_TEST_ID)).toBeNull();
  });

  it.each([
    ['webgl2', '3D rendering requires WebGL2, which is not available in this browser.'],
    ['colorBufferFloat', '3D rendering requires float color buffer support (EXT_color_buffer_float), which is unavailable on this device.'],
    [
      'floatLinear',
      '3D rendering requires linear filtering of float textures (OES_texture_float_linear), which is unavailable on this device.',
    ],
    ['shader', '3D shaders failed to load.'],
    ['framebuffer', '3D render target (framebuffer) is incomplete.'],
  ])('shows the %s message in an alert when the renderer reports it', (reason, message) => {
    rendererState.reason = reason;

    renderWithState(<Graphics3d />, { volumeSet: new VolumeSet() });

    const overlay = screen.getByTestId(ERROR_TEST_ID);
    expect(overlay.textContent).toBe(message);
    expect(overlay.getAttribute('role')).toBe('alert');
  });

  it('shows a generic message for an unknown reason instead of nothing', () => {
    rendererState.reason = 'something-new';

    renderWithState(<Graphics3d />, { volumeSet: new VolumeSet() });

    expect(screen.getByTestId(ERROR_TEST_ID).textContent).toBe('3D rendering is unavailable (something-new).');
  });
});
