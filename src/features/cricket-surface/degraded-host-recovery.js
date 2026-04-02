const RECOVERY_STORAGE_PREFIX = "adx:cricket-host-recovery:";
export const DEGRADED_HOST_RECOVERY_COOLDOWN_MS = 30_000;
export const DEGRADED_HOST_RECHECK_BUFFER_MS = 16;
export const DEGRADED_HOST_RECOVERY_REARM_MS = 1_500;

export const DEGRADED_HOST_RECOVERY_STATUS = Object.freeze({
  IDLE: "idle",
  RELOADING: "reloading",
  COOLDOWN: "cooldown",
  BLOCKED: "blocked",
});

function normalizeMatchId(value) {
  return String(value || "").trim();
}

function resolveRecoveryStorageContext(options = {}) {
  const renderState = options.renderState || null;
  const matchId = normalizeMatchId(options.matchId || renderState?.matchRouteId);
  const storageKey = getDegradedHostRecoveryKey(matchId);
  const windowRef = options.windowRef || renderState?.documentRef?.defaultView || null;
  const storage = windowRef?.sessionStorage || null;
  return {
    matchId,
    storageKey,
    storage,
    windowRef,
  };
}

export function getDegradedHostRecoveryKey(matchId) {
  const normalizedMatchId = normalizeMatchId(matchId);
  return normalizedMatchId ? `${RECOVERY_STORAGE_PREFIX}${normalizedMatchId}` : "";
}

export function hasDegradedHostRecoveryRecord(options = {}) {
  const { storage, storageKey } = resolveRecoveryStorageContext(options);
  return Boolean(readRecoveryRecord(storage, storageKey));
}

export function clearDegradedHostRecoveryRecord(options = {}) {
  const { matchId, storageKey, storage } = resolveRecoveryStorageContext(options);
  if (!storage || !storageKey || typeof storage.removeItem !== "function") {
    return {
      cleared: false,
      matchId,
      storageKey,
    };
  }

  try {
    storage.removeItem(storageKey);
    return {
      cleared: true,
      matchId,
      storageKey,
    };
  } catch (_) {
    return {
      cleared: false,
      matchId,
      storageKey,
    };
  }
}

export function hasPendingDegradedHostRecovery(renderState) {
  return (
    String(renderState?.surfaceStatus || "") === "missing-board" &&
    normalizeMatchId(renderState?.matchRouteId) &&
    renderState?.degradedHostInfo?.pending === true
  );
}

export function canDelayMissingMatchBoardGap(renderState) {
  return (
    String(renderState?.surfaceStatus || "") === "missing-board" &&
    normalizeMatchId(renderState?.matchRouteId) &&
    Boolean(renderState?.gridSnapshot?.root)
  );
}

export function resolvePendingDegradedHostRecheckDelay(renderState, options = {}) {
  if (!hasPendingDegradedHostRecovery(renderState)) {
    return -1;
  }

  const fallbackGraceMs = Math.max(
    0,
    Number.isFinite(Number(options.fallbackGraceMs)) ? Number(options.fallbackGraceMs) : 0
  );
  const bufferMs = Math.max(
    0,
    Number.isFinite(Number(options.bufferMs))
      ? Number(options.bufferMs)
      : DEGRADED_HOST_RECHECK_BUFFER_MS
  );
  const graceMs = Math.max(
    0,
    Number.isFinite(Number(renderState?.degradedHostInfo?.graceMs))
      ? Number(renderState.degradedHostInfo.graceMs)
      : fallbackGraceMs
  );
  const ageMs = Math.max(
    0,
    Number.isFinite(Number(renderState?.degradedHostInfo?.ageMs))
      ? Number(renderState.degradedHostInfo.ageMs)
      : 0
  );
  const remainingMs = Math.max(0, graceMs - ageMs);
  return Math.max(1, remainingMs + bufferMs);
}

export function resolveMissingMatchBoardGapDelay(renderState, options = {}) {
  if (!canDelayMissingMatchBoardGap(renderState)) {
    return -1;
  }

  const pendingDelay = resolvePendingDegradedHostRecheckDelay(renderState, options);
  if (pendingDelay > 0) {
    return pendingDelay;
  }

  const fallbackGraceMs = Math.max(
    0,
    Number.isFinite(Number(options.fallbackGraceMs)) ? Number(options.fallbackGraceMs) : 0
  );
  const bufferMs = Math.max(
    0,
    Number.isFinite(Number(options.bufferMs))
      ? Number(options.bufferMs)
      : DEGRADED_HOST_RECHECK_BUFFER_MS
  );
  return Math.max(1, fallbackGraceMs + bufferMs);
}

function readRecoveryRecord(storage, storageKey) {
  if (!storage || !storageKey || typeof storage.getItem !== "function") {
    return null;
  }

  const rawValue = storage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function writeRecoveryRecord(storage, storageKey, record) {
  if (!storage || !storageKey || typeof storage.setItem !== "function") {
    return false;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(record));
    return true;
  } catch (_) {
    return false;
  }
}

export function maybeRecoverDegradedMatchHost(options = {}) {
  const renderState = options.renderState || null;
  if (String(renderState?.surfaceStatus || "") !== "degraded-host") {
    return {
      status: DEGRADED_HOST_RECOVERY_STATUS.IDLE,
      matchId: "",
      storageKey: "",
      attempts: 0,
      cooldownMs: 0,
    };
  }

  const matchId = normalizeMatchId(renderState?.matchRouteId);
  const storageKey = getDegradedHostRecoveryKey(matchId);
  const windowRef = options.windowRef || renderState?.documentRef?.defaultView || null;
  const storage = windowRef?.sessionStorage || null;
  const locationRef = windowRef?.location || null;
  const currentUrl = String(locationRef?.href || "").trim();
  const cooldownMs = Math.max(
    0,
    Number.isFinite(Number(options.cooldownMs))
      ? Number(options.cooldownMs)
      : DEGRADED_HOST_RECOVERY_COOLDOWN_MS
  );

  if (!matchId || !storageKey || !windowRef || !locationRef || !currentUrl) {
    return {
      status: DEGRADED_HOST_RECOVERY_STATUS.BLOCKED,
      matchId,
      storageKey,
      attempts: 0,
      cooldownMs,
    };
  }

  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const record = readRecoveryRecord(storage, storageKey);
  const attempts = Math.max(0, Number(record?.attempts || 0));
  const lastAttemptAt = Math.max(0, Number(record?.lastAttemptAt || 0));
  if (lastAttemptAt > 0 && nowMs - lastAttemptAt < cooldownMs) {
    return {
      status: DEGRADED_HOST_RECOVERY_STATUS.COOLDOWN,
      matchId,
      storageKey,
      attempts,
      cooldownMs,
    };
  }

  const nextAttempts = attempts + 1;
  writeRecoveryRecord(storage, storageKey, {
    attempts: nextAttempts,
    lastAttemptAt: nowMs,
    href: currentUrl,
  });

  if (typeof locationRef.reload === "function") {
    locationRef.reload();
    return {
      status: DEGRADED_HOST_RECOVERY_STATUS.RELOADING,
      matchId,
      storageKey,
      attempts: nextAttempts,
      cooldownMs,
    };
  }

  if (typeof locationRef.replace === "function") {
    locationRef.replace(currentUrl);
    return {
      status: DEGRADED_HOST_RECOVERY_STATUS.RELOADING,
      matchId,
      storageKey,
      attempts: nextAttempts,
      cooldownMs,
    };
  }

  return {
    status: DEGRADED_HOST_RECOVERY_STATUS.BLOCKED,
    matchId,
    storageKey,
    attempts: nextAttempts,
    cooldownMs,
  };
}
