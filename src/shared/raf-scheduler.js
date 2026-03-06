export function createRafScheduler(callback, options = {}) {
  const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
  const raf =
    (windowRef && typeof windowRef.requestAnimationFrame === "function"
      ? windowRef.requestAnimationFrame.bind(windowRef)
      : null) ||
    ((fn) => setTimeout(fn, 16));

  const cancelRaf =
    (windowRef && typeof windowRef.cancelAnimationFrame === "function"
      ? windowRef.cancelAnimationFrame.bind(windowRef)
      : null) ||
    ((id) => clearTimeout(id));

  let scheduled = false;
  let handle = 0;

  function schedule() {
    if (scheduled) {
      return;
    }

    scheduled = true;
    handle = raf(() => {
      scheduled = false;
      handle = 0;
      callback();
    });
  }

  function cancel() {
    if (!scheduled) {
      return;
    }

    cancelRaf(handle);
    scheduled = false;
    handle = 0;
  }

  return {
    schedule,
    cancel,
    isScheduled: () => scheduled,
  };
}