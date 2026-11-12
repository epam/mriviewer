import { vi } from 'vitest';

const mockState = { gl: null, renderer: null };

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal();
  class FakeWebGLRenderer {
    constructor(params) {
      this.domElement = params.canvas;
      this.renderTargets = [];
      this.renderCalls = 0;
      this.glStatus = 0;
      mockState.renderer = this;
    }
    getContext() {
      return mockState.gl;
    }
    setSize() {}
    setClearColor() {}
    setRenderTarget(target) {
      this.renderTargets.push(target);
    }
    render() {
      this.renderCalls += 1;
    }
  }
  return { ...actual, WebGLRenderer: FakeWebGLRenderer };
});

vi.mock('./GlSelector', () => ({
  default: class FakeGlSelector {
    createWebGLContext() {
      this.canvas = document.createElement('canvas');
      return mockState.gl;
    }
    getCanvas() {
      return this.canvas;
    }
  },
}));

vi.mock('./orbitcontrol', () => ({ default: class FakeOrbitControl {} }));

import VolumeRenderer3d from './VolumeRenderer3d';

const FRAMEBUFFER_COMPLETE = 36053;
const FRAMEBUFFER_INCOMPLETE = 36054;
const SCENE_READY_COUNTER_OK = 5;

const makeGl = ({ webgl2 = true, colorBufferFloat = true, floatLinear = true, framebufferStatus = FRAMEBUFFER_COMPLETE } = {}) => {
  const gl = {
    FRAMEBUFFER: 36160,
    FRAMEBUFFER_COMPLETE,
    checkFramebufferStatus: () => framebufferStatus,
    getExtension: (name) => {
      if (name === 'EXT_color_buffer_float') {
        return colorBufferFloat ? {} : null;
      }
      if (name === 'OES_texture_float_linear') {
        return floatLinear ? {} : null;
      }
      return null;
    },
  };
  if (webgl2) {
    gl.texImage3D = () => {};
  }
  return gl;
};

const makeRenderer = (glOptions) => {
  mockState.gl = makeGl(glOptions);
  const mount = document.createElement('div');
  return new VolumeRenderer3d({ width: 100, height: 100, mount, curFileDataType: { thresholdIsosurf: 0.5 } });
};

const BOX = { x: 1, y: 1, z: 1 };
const NON_EMPTY_MIN = { x: 0, y: 0, z: 0 };
const NON_EMPTY_MAX = { x: 1, y: 1, z: 1 };

const markMaterialsReady = (renderer) => {
  renderer.matVolumeRender = {};
  renderer.matBF = {};
  renderer.matFF = {};
  renderer.matRenderToTexture = {};
  renderer.sceneReadyCounter = SCENE_READY_COUNTER_OK;
};

describe('VolumeRenderer3d capability gate', () => {
  it.each([
    ['a WebGL1 context', { webgl2: false }, 'webgl2'],
    ['a context without EXT_color_buffer_float', { colorBufferFloat: false }, 'colorBufferFloat'],
    ['a context without OES_texture_float_linear', { floatLinear: false }, 'floatLinear'],
  ])('reports the reason and builds nothing in initWithVolume for %s', (_name, glOptions, reason) => {
    const renderer = makeRenderer(glOptions);

    expect(renderer.getRenderErrorReason()).toBe(reason);
    expect(() => renderer.initWithVolume({}, BOX, NON_EMPTY_MIN, NON_EMPTY_MAX, false, false)).not.toThrow();

    expect(renderer.getRenderErrorReason()).toBe(reason);
    expect(renderer.matBF).toBeNull();
    expect(renderer.matFF).toBeNull();
    expect(renderer.matVolumeRender).toBeNull();
    expect(renderer.bfTexture).toBeNull();
    expect(renderer.isReadyToRender()).toBe(false);
  });

  it('starts without an error on a fully capable context', () => {
    const renderer = makeRenderer({});

    expect(renderer.getRenderErrorReason()).toBeNull();
    expect(renderer.capabilityGate.proceed).toBe(true);
  });
});

describe('VolumeRenderer3d framebuffer check', () => {
  it('keeps going when the back-face render target is complete', () => {
    const renderer = makeRenderer({ framebufferStatus: FRAMEBUFFER_COMPLETE });
    renderer.bfTexture = { id: 'bf' };

    expect(renderer.runFrameBufferCheck()).toBe(1);

    expect(renderer.getRenderErrorReason()).toBeNull();
    expect(mockState.renderer.renderTargets).toEqual([renderer.bfTexture, null]);
  });

  it('stops rendering and reports framebuffer when the target is incomplete', () => {
    const renderer = makeRenderer({ framebufferStatus: FRAMEBUFFER_INCOMPLETE });
    renderer.bfTexture = { id: 'bf' };
    markMaterialsReady(renderer);

    renderer.render();

    expect(renderer.checkFrameBufferMode).toBe(2);
    expect(renderer.getRenderErrorReason()).toBe('framebuffer');
    expect(mockState.renderer.renderCalls).toBe(0);
    expect(mockState.renderer.renderTargets).toEqual([renderer.bfTexture, null]);
  });

  it('does not check again after a failure', () => {
    const renderer = makeRenderer({ framebufferStatus: FRAMEBUFFER_INCOMPLETE });
    renderer.bfTexture = { id: 'bf' };
    markMaterialsReady(renderer);

    renderer.render();
    renderer.render();

    expect(mockState.renderer.renderTargets).toEqual([renderer.bfTexture, null]);
  });
});

describe('VolumeRenderer3d ready timeout', () => {
  it('reports shader when the scene never becomes ready within the timeout', () => {
    const renderer = makeRenderer({});
    renderer.sceneReadyStartTime = Date.now() - 60000;

    renderer.render();

    expect(renderer.getRenderErrorReason()).toBe('shader');
  });

  it('stays silent while the scene is still within the timeout', () => {
    const renderer = makeRenderer({});
    renderer.sceneReadyStartTime = Date.now();

    renderer.render();

    expect(renderer.getRenderErrorReason()).toBeNull();
  });

  it('does not overwrite a capability error with a shader error', () => {
    const renderer = makeRenderer({ colorBufferFloat: false });
    renderer.sceneReadyStartTime = Date.now() - 60000;

    renderer.render();

    expect(renderer.getRenderErrorReason()).toBe('colorBufferFloat');
  });
});
