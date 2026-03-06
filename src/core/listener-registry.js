function canAddListener(target) {
  return Boolean(target) && typeof target.addEventListener === "function";
}

function canRemoveListener(target) {
  return Boolean(target) && typeof target.removeEventListener === "function";
}

export function createListenerRegistry() {
  const listenersByKey = new Map();

  function register(options = {}) {
    const key = String(options.key || "");
    const target = options.target;
    const type = String(options.type || "");
    const handler = options.handler;
    const listenerOptions = options.options;

    if (!key || !canAddListener(target) || !type || typeof handler !== "function") {
      return () => {};
    }

    const existing = listenersByKey.get(key);
    if (existing) {
      return () => remove(key);
    }

    target.addEventListener(type, handler, listenerOptions);
    listenersByKey.set(key, {
      target,
      type,
      handler,
      options: listenerOptions,
    });

    return () => remove(key);
  }

  function remove(key) {
    const normalizedKey = String(key || "");
    if (!normalizedKey) {
      return false;
    }

    const record = listenersByKey.get(normalizedKey);
    if (!record) {
      return false;
    }

    if (canRemoveListener(record.target)) {
      record.target.removeEventListener(record.type, record.handler, record.options);
    }
    listenersByKey.delete(normalizedKey);
    return true;
  }

  function removeAll() {
    Array.from(listenersByKey.keys()).forEach((key) => {
      remove(key);
    });
  }

  function size() {
    return listenersByKey.size;
  }

  return {
    register,
    remove,
    removeAll,
    size,
  };
}