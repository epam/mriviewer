/*
 * Copyright 2021 EPAM Systems, Inc. (https://www.epam.com/)
 * SPDX-License-Identifier: Apache-2.0
 */

import { observeCanvasResize } from './resizeObserver';

describe('observeCanvasResize', () => {
  let instances;
  let OriginalResizeObserver;

  beforeEach(() => {
    instances = [];
    OriginalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observed = [];
        this.disconnected = false;
        instances.push(this);
      }
      observe(el) {
        this.observed.push(el);
      }
      disconnect() {
        this.disconnected = true;
      }
      trigger() {
        this.callback([], this);
      }
    };
  });

  afterEach(() => {
    global.ResizeObserver = OriginalResizeObserver;
  });

  it('observes the target element with a ResizeObserver', () => {
    const target = {};
    observeCanvasResize(target, () => {});
    expect(instances).toHaveLength(1);
    expect(instances[0].observed).toContain(target);
  });

  it('invokes the recompute callback when the observer fires', () => {
    const onResize = vi.fn();
    observeCanvasResize({}, onResize);
    expect(onResize).not.toHaveBeenCalled();
    instances[0].trigger();
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it('invokes the recompute callback on window resize (DPR change)', () => {
    const onResize = vi.fn();
    observeCanvasResize({}, onResize);
    window.dispatchEvent(new Event('resize'));
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer and stops firing after cleanup', () => {
    const onResize = vi.fn();
    const cleanup = observeCanvasResize({}, onResize);
    cleanup();
    expect(instances[0].disconnected).toBe(true);
    window.dispatchEvent(new Event('resize'));
    expect(onResize).not.toHaveBeenCalled();
  });

  it('returns a no-op cleanup for a missing target', () => {
    const cleanup = observeCanvasResize(null, () => {});
    expect(instances).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
  });

  it('returns a no-op cleanup when no callback is provided', () => {
    const cleanup = observeCanvasResize({}, null);
    expect(instances).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
  });

  it('still wires window resize when ResizeObserver is unavailable', () => {
    global.ResizeObserver = undefined;
    const onResize = vi.fn();
    const cleanup = observeCanvasResize({}, onResize);
    window.dispatchEvent(new Event('resize'));
    expect(onResize).toHaveBeenCalledTimes(1);
    cleanup();
    window.dispatchEvent(new Event('resize'));
    expect(onResize).toHaveBeenCalledTimes(1);
  });
});
