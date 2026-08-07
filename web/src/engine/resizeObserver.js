export function observeCanvasResize(target, onResize) {
  if (!target || typeof onResize !== 'function' || typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  const observer = new ResizeObserver(() => onResize());
  observer.observe(target);

  return () => {
    observer.disconnect();
  };
}
