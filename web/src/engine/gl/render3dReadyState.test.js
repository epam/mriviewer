import { describe, it, expect } from 'vitest';
import { evaluateReadyState, mapFramebufferStatus, SCENE_READY_TIMEOUT_MS } from './render3dReadyState';
import { RENDER_ERROR } from './gate3dCapability';

describe('evaluateReadyState', () => {
  const base = { readyCounter: 5, expectedCounter: 5, materialsReady: true, elapsedMs: 0, timeoutMs: SCENE_READY_TIMEOUT_MS };

  it('is ready when counter reached and materials present', () => {
    expect(evaluateReadyState(base)).toEqual({ ready: true, timedOut: false, error: RENDER_ERROR.NONE });
  });

  it('is not ready and not timed out while still within the timeout window', () => {
    const r = evaluateReadyState({ ...base, readyCounter: 3, elapsedMs: 100 });
    expect(r).toEqual({ ready: false, timedOut: false, error: RENDER_ERROR.NONE });
  });

  it('surfaces a shader error once the counter is stuck past the timeout', () => {
    const r = evaluateReadyState({ ...base, readyCounter: 3, elapsedMs: SCENE_READY_TIMEOUT_MS });
    expect(r).toEqual({ ready: false, timedOut: true, error: RENDER_ERROR.SHADER });
  });

  it('treats missing materials as not ready even when the counter is complete', () => {
    const r = evaluateReadyState({ ...base, materialsReady: false, elapsedMs: 50 });
    expect(r.ready).toBe(false);
    expect(r.timedOut).toBe(false);
  });

  it('times out on complete counter but missing materials past the deadline', () => {
    const r = evaluateReadyState({ ...base, materialsReady: false, elapsedMs: SCENE_READY_TIMEOUT_MS + 1 });
    expect(r).toEqual({ ready: false, timedOut: true, error: RENDER_ERROR.SHADER });
  });

  it('does not time out when timing is not numeric (never surfaces a false shader error)', () => {
    const r = evaluateReadyState({ ...base, readyCounter: 3, elapsedMs: undefined, timeoutMs: undefined });
    expect(r).toEqual({ ready: false, timedOut: false, error: RENDER_ERROR.NONE });
  });
});

describe('mapFramebufferStatus', () => {
  const FRAMEBUFFER_COMPLETE = 0x8cd5;

  it('reports ok when status equals the complete value', () => {
    expect(mapFramebufferStatus(FRAMEBUFFER_COMPLETE, FRAMEBUFFER_COMPLETE)).toEqual({ ok: true, error: RENDER_ERROR.NONE });
  });

  it('reports a framebuffer error for any incomplete status', () => {
    expect(mapFramebufferStatus(0x8cd6, FRAMEBUFFER_COMPLETE)).toEqual({ ok: false, error: RENDER_ERROR.FRAMEBUFFER });
  });
});
