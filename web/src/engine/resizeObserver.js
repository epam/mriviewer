export function observeCanvasResize(target, onResize) {
  if (!target || typeof onResize !== 'function') {
    return () => {};
  }

  let observer = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => onResize());
    observer.observe(target);
  }

  const onWindowResize = () => onResize();
  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  if (hasWindow) {
    window.addEventListener('resize', onWindowResize);
  }

  return () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (hasWindow) {
      window.removeEventListener('resize', onWindowResize);
    }
  };
}
