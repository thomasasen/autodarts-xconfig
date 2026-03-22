import {
  resolveLatestUpdateStatus,
  shouldRefreshUpdateStatus,
} from "./update-check.js";

export function createUpdateStatusController(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || null;
  const installedVersion = String(options.installedVersion || "").trim();
  const state = options.state || null;
  const setNotice = typeof options.setNotice === "function" ? options.setNotice : () => {};
  const queueSync = typeof options.queueSync === "function" ? options.queueSync : () => {};
  const updateIntervalMs = Number(options.updateIntervalMs) || 0;

  function setUpdateStatus(nextStatus = {}) {
    state.updateStatus = {
      ...state.updateStatus,
      ...nextStatus,
      installedVersion,
    };
    queueSync();
  }

  function refreshUpdateStatus(config = {}) {
    const force = Boolean(config.force);
    const announce = Boolean(config.announce);

    if (!state.updateStatus.capable) {
      return Promise.resolve(state.updateStatus);
    }
    if (state.updateCheckPromise) {
      if (force && announce) {
        state.pendingManualUpdateCheck = {
          force: true,
          announce: true,
        };
      }
      return state.updateCheckPromise;
    }
    if (!force && !shouldRefreshUpdateStatus(state.updateStatus)) {
      return Promise.resolve(state.updateStatus);
    }

    setUpdateStatus({
      status: "checking",
      error: "",
      stale: Boolean(state.updateStatus.stale && state.updateStatus.checkedAt > 0),
    });

    const updatePromise = resolveLatestUpdateStatus({
      windowRef,
      installedVersion,
      force,
    })
      .then((nextStatus) => {
        setUpdateStatus(nextStatus);
        if (announce) {
          if (nextStatus.status === "available") {
            setNotice(
              "info",
              `Update gefunden: ${installedVersion} -> ${nextStatus.remoteVersion}.`
            );
          } else if (nextStatus.status === "current") {
            setNotice("success", `Kein neueres Update gefunden. Aktuell installiert: ${installedVersion}.`);
          } else if (nextStatus.status === "error" || nextStatus.error) {
            setNotice("error", nextStatus.error || "Update-Prüfung fehlgeschlagen.");
          }
        }
        return nextStatus;
      })
      .finally(() => {
        state.updateCheckPromise = null;
        const pendingManualUpdateCheck = state.pendingManualUpdateCheck;
        state.pendingManualUpdateCheck = null;
        if (pendingManualUpdateCheck && state.started) {
          refreshUpdateStatus(pendingManualUpdateCheck);
        }
      });

    state.updateCheckPromise = updatePromise;
    return updatePromise;
  }

  function stopAutoUpdateChecks() {
    if (state.updateCheckIntervalHandle && typeof windowRef.clearInterval === "function") {
      windowRef.clearInterval(state.updateCheckIntervalHandle);
    }
    state.updateCheckIntervalHandle = null;
  }

  function startAutoUpdateChecks() {
    stopAutoUpdateChecks();
    if (!state.updateStatus.capable || typeof windowRef.setInterval !== "function") {
      return;
    }
    state.updateCheckIntervalHandle = windowRef.setInterval(() => {
      if (!state.started || documentRef?.visibilityState === "hidden") {
        return;
      }
      refreshUpdateStatus({
        force: false,
        announce: false,
      });
    }, updateIntervalMs);
  }

  function onVisibilityChange() {
    if (!state.started || documentRef?.visibilityState === "hidden") {
      return;
    }
    refreshUpdateStatus({
      force: false,
      announce: false,
    });
  }

  return {
    refreshUpdateStatus,
    startAutoUpdateChecks,
    stopAutoUpdateChecks,
    onVisibilityChange,
  };
}
