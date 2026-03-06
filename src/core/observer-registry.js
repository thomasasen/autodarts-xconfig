function resolveMutationObserver(MutationObserverRef) {
  if (typeof MutationObserverRef === "function") {
    return MutationObserverRef;
  }
  if (typeof MutationObserver !== "undefined") {
    return MutationObserver;
  }
  return null;
}

export function createObserverRegistry() {
  const observersByKey = new Map();

  function register(key, observer) {
    const normalizedKey = String(key || "");
    if (!normalizedKey || !observer) {
      return null;
    }

    const existing = observersByKey.get(normalizedKey);
    if (existing) {
      return existing;
    }

    observersByKey.set(normalizedKey, observer);
    return observer;
  }

  function registerMutationObserver(options = {}) {
    const key = String(options.key || "");
    if (!key || typeof options.callback !== "function") {
      return null;
    }

    const existing = observersByKey.get(key);
    if (existing) {
      return existing;
    }

    const ObserverClass = resolveMutationObserver(options.MutationObserverRef);
    if (!ObserverClass) {
      return null;
    }

    const target = options.target;
    if (!target || typeof target !== "object") {
      return null;
    }

    const observer = new ObserverClass(options.callback);
    const observeOptions = options.observeOptions || {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    };

    if (typeof observer.observe === "function") {
      observer.observe(target, observeOptions);
    }

    observersByKey.set(key, observer);
    return observer;
  }

  function disconnect(key) {
    const normalizedKey = String(key || "");
    if (!normalizedKey) {
      return false;
    }

    const observer = observersByKey.get(normalizedKey);
    if (!observer) {
      return false;
    }

    if (typeof observer.disconnect === "function") {
      observer.disconnect();
    }
    observersByKey.delete(normalizedKey);
    return true;
  }

  function disconnectAll() {
    Array.from(observersByKey.keys()).forEach((key) => {
      disconnect(key);
    });
  }

  function get(key) {
    return observersByKey.get(String(key || "")) || null;
  }

  function size() {
    return observersByKey.size;
  }

  return {
    register,
    registerMutationObserver,
    disconnect,
    disconnectAll,
    get,
    size,
  };
}