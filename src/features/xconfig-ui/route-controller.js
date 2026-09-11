export function createShellRouteController(options = {}) {
  const windowRef = options.windowRef || null;
  const state = options.state || null;
  const configPath = String(options.configPath || "").trim();
  const configHash = String(options.configHash || "").trim();
  const normalizeRoutePath =
    typeof options.normalizeRoutePath === "function" ? options.normalizeRoutePath : (value) => String(value || "");
  const isLegacyConfigPath =
    typeof options.isLegacyConfigPath === "function" ? options.isLegacyConfigPath : () => false;
  const isConfigHash =
    typeof options.isConfigHash === "function" ? options.isConfigHash : () => false;
  const queueSync = typeof options.queueSync === "function" ? options.queueSync : () => {};

  function isConfigRoute() {
    const locationRef = windowRef?.location || null;
    return (
      isLegacyConfigPath(locationRef?.pathname || "", configPath) ||
      isConfigHash(locationRef?.hash || "", configHash)
    );
  }

  function resolveBaseRouteForConfigHash() {
    const currentPath = normalizeRoutePath(windowRef?.location?.pathname || "");
    if (currentPath && currentPath !== configPath) {
      return currentPath;
    }
    if (state?.lastNonConfigRoute && state.lastNonConfigRoute !== configPath) {
      return state.lastNonConfigRoute;
    }
    return "/lobbies";
  }

  function buildConfigHashRoute() {
    const search = String(windowRef?.location?.search || "");
    return `${resolveBaseRouteForConfigHash()}${search}${configHash}`;
  }

  function buildCurrentReturnRoute() {
    const pathname = normalizeRoutePath(windowRef?.location?.pathname || "");
    if (!pathname || pathname === configPath) {
      return "";
    }
    return `${pathname}${String(windowRef?.location?.search || "")}`;
  }

  function normalizeLegacyConfigPathIfNeeded() {
    if (!isLegacyConfigPath(windowRef?.location?.pathname || "", configPath)) {
      return false;
    }
    if (typeof windowRef?.history?.replaceState !== "function") {
      return false;
    }
    windowRef.history.replaceState({ adxconfig: true }, "", buildConfigHashRoute());
    return true;
  }

  function navigateToConfigRoute() {
    if (!isConfigRoute()) {
      state.lastNonConfigRoute = buildCurrentReturnRoute() || "/lobbies";
      windowRef.history.pushState({ adxconfig: true }, "", buildConfigHashRoute());
    } else if (normalizeLegacyConfigPathIfNeeded()) {
      // Legacy /ad-xconfig URLs should be normalized once to avoid 404 on hard reload.
    }
    queueSync();
  }

  function navigateBack() {
    const target = state?.lastNonConfigRoute && state.lastNonConfigRoute !== configPath
      ? state.lastNonConfigRoute
      : "/lobbies";
    windowRef.history.pushState({}, "", target);
    queueSync();
  }

  return {
    buildConfigHashRoute,
    buildCurrentReturnRoute,
    isConfigRoute,
    navigateBack,
    navigateToConfigRoute,
    normalizeLegacyConfigPathIfNeeded,
    resolveBaseRouteForConfigHash,
  };
}
