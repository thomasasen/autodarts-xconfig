export function queueWindowSync(state, windowRef, onSync) {
  if (!state?.started || state.syncScheduled) {
    return;
  }

  state.syncScheduled = true;
  const useRaf = typeof windowRef?.requestAnimationFrame === "function";
  const scheduler = useRaf
    ? windowRef.requestAnimationFrame.bind(windowRef)
    : (callback) => windowRef.setTimeout(callback, 0);

  state.syncHandleType = useRaf ? "raf" : "timeout";
  state.syncHandle = scheduler(() => {
    state.syncScheduled = false;
    state.syncHandle = null;
    state.syncHandleType = "";
    if (!state.started) {
      return;
    }
    if (typeof onSync === "function") {
      onSync();
    }
  });
}

export function cancelWindowSync(state, windowRef) {
  if (state?.syncHandle === null) {
    if (state) {
      state.syncScheduled = false;
      state.syncHandleType = "";
    }
    return;
  }

  if (state?.syncHandleType === "raf" && typeof windowRef?.cancelAnimationFrame === "function") {
    windowRef.cancelAnimationFrame(state.syncHandle);
  } else if (state?.syncHandleType === "timeout" && typeof windowRef?.clearTimeout === "function") {
    windowRef.clearTimeout(state.syncHandle);
  }

  if (state) {
    state.syncHandle = null;
    state.syncHandleType = "";
    state.syncScheduled = false;
  }
}

export function createShellSyncScheduler(options = {}) {
  const windowRef = options.windowRef || null;
  const state = options.state || null;
  const onSync = typeof options.onSync === "function" ? options.onSync : () => {};

  return {
    queueSync() {
      queueWindowSync(state, windowRef, onSync);
    },
    cancelQueuedSync() {
      cancelWindowSync(state, windowRef);
    },
  };
}
