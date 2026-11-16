import { RENDER_ERROR } from './gate3dCapability';

export const SCENE_READY_TIMEOUT_MS = 10000;

export function evaluateReadyState({ readyCounter, expectedCounter, materialsReady, elapsedMs, timeoutMs }) {
  if (readyCounter === expectedCounter && materialsReady) {
    return { ready: true, timedOut: false, error: RENDER_ERROR.NONE };
  }
  if (typeof elapsedMs === 'number' && typeof timeoutMs === 'number' && elapsedMs >= timeoutMs) {
    return { ready: false, timedOut: true, error: RENDER_ERROR.SHADER };
  }
  return { ready: false, timedOut: false, error: RENDER_ERROR.NONE };
}

export function mapFramebufferStatus(status, completeValue) {
  if (status === completeValue) {
    return { ok: true, error: RENDER_ERROR.NONE };
  }
  return { ok: false, error: RENDER_ERROR.FRAMEBUFFER };
}
