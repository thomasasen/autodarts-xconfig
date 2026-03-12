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
      return await loader();
    } catch (_) {
      return null;
    }
  };
}

const importAnimeModule = createSafeImporter(() => import("./anime.min.cjs"));
const importConfettiModule = createSafeImporter(() => import("./canvas-confetti.browser.js"));

export function getAnime(windowRef = null) {
  const resolvedWindow = getWindowRef(windowRef);
  if (resolvedWindow && typeof resolvedWindow.anime === "function") {
    vendorLoadState.anime.cached = resolvedWindow.anime;
    return vendorLoadState.anime.cached;
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.anime === "function") {
    vendorLoadState.anime.cached = globalThis.anime;
    return vendorLoadState.anime.cached;
  }

  if (typeof vendorLoadState.anime.cached === "function") {
    return vendorLoadState.anime.cached;
  }

  return null;
}

export function getConfetti(windowRef = null) {
  const resolvedWindow = getWindowRef(windowRef);
  if (resolvedWindow && typeof resolvedWindow.confetti === "function") {
    vendorLoadState.confetti.cached = resolvedWindow.confetti;
    return vendorLoadState.confetti.cached;
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.confetti === "function") {
    vendorLoadState.confetti.cached = globalThis.confetti;
    return vendorLoadState.confetti.cached;
  }

  if (typeof vendorLoadState.confetti.cached === "function") {
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
  const importedAnimeModule = await vendorLoadState.anime.promise;
  if (importedAnimeModule && typeof vendorLoadState.anime.cached !== "function") {
    const importedAnimeCandidate =
      importedAnimeModule.default || importedAnimeModule.anime || importedAnimeModule;
    if (typeof importedAnimeCandidate === "function") {
      vendorLoadState.anime.cached = importedAnimeCandidate;
    }
  }

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
  const importedConfettiModule = await vendorLoadState.confetti.promise;
  if (importedConfettiModule && typeof vendorLoadState.confetti.cached !== "function") {
    const importedConfettiCandidate =
      importedConfettiModule.default || importedConfettiModule.confetti || importedConfettiModule;
    if (typeof importedConfettiCandidate === "function") {
      vendorLoadState.confetti.cached = importedConfettiCandidate;
    }
  }

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
