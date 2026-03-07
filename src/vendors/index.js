function getWindowRef(explicitWindowRef = null) {
  if (explicitWindowRef && typeof explicitWindowRef === "object") {
    return explicitWindowRef;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  return null;
}

const vendorLoadState = {
  anime: {
    promise: null,
    cached: null,
  },
  confetti: {
    promise: null,
    cached: null,
  },
};

function createSafeImporter(loader) {
  return async function safeImport() {
    try {
      await loader();
      return true;
    } catch (_) {
      return false;
    }
  };
}

const importAnimeModule = createSafeImporter(() => import("./anime.min.cjs"));
const importConfettiModule = createSafeImporter(() => import("./canvas-confetti.browser.js"));

export function getAnime(windowRef = null) {
  if (typeof vendorLoadState.anime.cached === "function") {
    return vendorLoadState.anime.cached;
  }

  const resolvedWindow = getWindowRef(windowRef);
  if (resolvedWindow && typeof resolvedWindow.anime === "function") {
    vendorLoadState.anime.cached = resolvedWindow.anime;
    return vendorLoadState.anime.cached;
  }

  return null;
}

export function getConfetti(windowRef = null) {
  if (typeof vendorLoadState.confetti.cached === "function") {
    return vendorLoadState.confetti.cached;
  }

  const resolvedWindow = getWindowRef(windowRef);
  if (resolvedWindow && typeof resolvedWindow.confetti === "function") {
    vendorLoadState.confetti.cached = resolvedWindow.confetti;
    return vendorLoadState.confetti.cached;
  }

  return null;
}

export async function ensureAnimeLoaded(windowRef = null) {
  const resolvedWindow = getWindowRef(windowRef);
  if (!resolvedWindow) {
    return null;
  }

  const existing = getAnime(resolvedWindow);
  if (existing) {
    return existing;
  }

  const hadAnimeGlobalBeforeImport = typeof resolvedWindow.anime === "function";

  if (!vendorLoadState.anime.promise) {
    vendorLoadState.anime.promise = importAnimeModule();
  }
  await vendorLoadState.anime.promise;

  const loadedAnime = getAnime(resolvedWindow);
  if (
    loadedAnime &&
    !hadAnimeGlobalBeforeImport &&
    Object.prototype.hasOwnProperty.call(resolvedWindow, "anime")
  ) {
    try {
      delete resolvedWindow.anime;
    } catch (_) {
      // Fail-soft if host disallows property deletion.
    }
  }

  return loadedAnime;
}

export async function ensureConfettiLoaded(windowRef = null) {
  const resolvedWindow = getWindowRef(windowRef);
  if (!resolvedWindow) {
    return null;
  }

  const existing = getConfetti(resolvedWindow);
  if (existing) {
    return existing;
  }

  const hadConfettiGlobalBeforeImport = typeof resolvedWindow.confetti === "function";

  if (!vendorLoadState.confetti.promise) {
    vendorLoadState.confetti.promise = importConfettiModule();
  }
  await vendorLoadState.confetti.promise;

  const loadedConfetti = getConfetti(resolvedWindow);
  if (
    loadedConfetti &&
    !hadConfettiGlobalBeforeImport &&
    Object.prototype.hasOwnProperty.call(resolvedWindow, "confetti")
  ) {
    try {
      delete resolvedWindow.confetti;
    } catch (_) {
      // Fail-soft if host disallows property deletion.
    }
  }

  return loadedConfetti;
}
