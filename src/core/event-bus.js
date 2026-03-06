export function createEventBus() {
  const listenersByEvent = new Map();

  function on(eventName, handler) {
    if (!eventName || typeof handler !== "function") {
      return () => {};
    }

    const normalizedEventName = String(eventName);
    let listeners = listenersByEvent.get(normalizedEventName);
    if (!listeners) {
      listeners = new Set();
      listenersByEvent.set(normalizedEventName, listeners);
    }

    listeners.add(handler);

    return () => {
      off(normalizedEventName, handler);
    };
  }

  function off(eventName, handler) {
    const normalizedEventName = String(eventName || "");
    const listeners = listenersByEvent.get(normalizedEventName);
    if (!listeners) {
      return false;
    }

    const deleted = listeners.delete(handler);
    if (!listeners.size) {
      listenersByEvent.delete(normalizedEventName);
    }

    return deleted;
  }

  function emit(eventName, payload) {
    const normalizedEventName = String(eventName || "");
    const listeners = listenersByEvent.get(normalizedEventName);
    if (!listeners || !listeners.size) {
      return 0;
    }

    const handlers = Array.from(listeners);
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (_) {
        // Keep the bus resilient: one failing consumer must not block others.
      }
    });

    return handlers.length;
  }

  function clear(eventName) {
    if (typeof eventName === "undefined") {
      listenersByEvent.clear();
      return;
    }

    listenersByEvent.delete(String(eventName));
  }

  function listenerCount(eventName) {
    if (typeof eventName === "undefined") {
      return Array.from(listenersByEvent.values()).reduce(
        (total, listeners) => total + listeners.size,
        0
      );
    }

    return listenersByEvent.get(String(eventName))?.size || 0;
  }

  return {
    on,
    off,
    emit,
    clear,
    listenerCount,
  };
}