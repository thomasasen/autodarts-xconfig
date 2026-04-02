const RECOVERY_STORAGE_PREFIX = "adx:cricket-host-recovery:";
export const DEGRADED_HOST_RECOVERY_COOLDOWN_MS = 30_000;

export const DEGRADED_HOST_RECOVERY_STATUS = Object.freeze({
  IDLE: "idle",
  RELOADING: "reloading",
  COOLDOWN: "cooldown",
  BLOCKED: "blocked",
});

function normalizeMatchId(value) {
  return String(value || "").trim();
}

export function getDegradedHostRecoveryKey(matchId) {
  const normalizedMatchId = normalizeMatchId(matchId);
  return normalizedMatchId ? `${RECOVERY_STORAGE_PREFIX}${normalizedMatchId}` : "";
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
