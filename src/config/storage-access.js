function toErrorMessage(error) {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return String(error || "unknown error").trim() || "unknown error";
}

export function resolveLocalStorage(options = {}) {
  if (options.localStorageRef !== undefined) {
    return options.localStorageRef;
  }

  try {
    if (options.windowRef) {
      return options.windowRef.localStorage || null;
    }
  } catch (_) {
    return null;
  }

  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

export function readStorageValue(storage, key) {
  try {
    if (!storage || typeof storage.getItem !== "function") {
      return { ok: false, value: null, reason: "unavailable" };
    }
    return { ok: true, value: storage.getItem(key), reason: "" };
  } catch (error) {
    return { ok: false, value: null, reason: toErrorMessage(error) };
  }
}

export function writeStorageValue(storage, key, value) {
  try {
    if (!storage || typeof storage.setItem !== "function") {
      return { ok: false, reason: "unavailable" };
    }
    storage.setItem(key, value);
    return { ok: true, reason: "" };
  } catch (error) {
    return { ok: false, reason: toErrorMessage(error) };
  }
}
