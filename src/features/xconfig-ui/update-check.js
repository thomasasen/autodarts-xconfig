const USERSCRIPT_DOWNLOAD_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js";
const USERSCRIPT_UPDATE_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js";
const UPDATE_STATUS_STORAGE_KEY = "autodarts-xconfig:update-status:v1";
const UPDATE_CHECK_TTL_MS = 60 * 60 * 1000;

function normalizeVersion(value) {
  return String(value || "").trim();
}

function createBaseUpdateStatus(installedVersion, capable) {
  return {
    capable: Boolean(capable),
    status: "idle",
    installedVersion: normalizeVersion(installedVersion),
    remoteVersion: "",
    available: false,
    checkedAt: 0,
    sourceUrl: "",
    downloadUrl: USERSCRIPT_DOWNLOAD_URL,
    error: "",
    stale: false,
  };
}

function safeParseJson(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function getStorageRef(windowRef) {
  const storageRef = windowRef?.localStorage || null;
  if (!storageRef || typeof storageRef.getItem !== "function" || typeof storageRef.setItem !== "function") {
    return null;
  }
  return storageRef;
}

function getFetchFn(windowRef) {
  return typeof windowRef?.fetch === "function" ? windowRef.fetch.bind(windowRef) : null;
}

function parseVersionToken(token) {
  const rawToken = String(token || "").trim();
  if (!rawToken) {
    return { type: "number", value: 0 };
  }
  if (/^\d+$/.test(rawToken)) {
    return { type: "number", value: Number.parseInt(rawToken, 10) };
  }
  return { type: "string", value: rawToken.toLowerCase() };
}

function compareVersions(leftVersion, rightVersion) {
  const leftParts = normalizeVersion(leftVersion).split(/[.-]/);
  const rightParts = normalizeVersion(rightVersion).split(/[.-]/);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftToken = parseVersionToken(leftParts[index]);
    const rightToken = parseVersionToken(rightParts[index]);

    if (leftToken.type === rightToken.type) {
      if (leftToken.value > rightToken.value) {
        return 1;
      }
      if (leftToken.value < rightToken.value) {
        return -1;
      }
      continue;
    }

    if (leftToken.type === "number") {
      return 1;
    }
    return -1;
  }

  return 0;
}

function parseUserscriptVersion(text) {
  const match = String(text || "").match(/@version\s+([^\s]+)/i);
  return normalizeVersion(match?.[1] || "");
}

function createResolvedUpdateStatus({
  capable,
  installedVersion,
  remoteVersion,
  checkedAt,
  sourceUrl,
  error = "",
  stale = false,
}) {
  const baseStatus = createBaseUpdateStatus(installedVersion, capable);
  const normalizedRemoteVersion = normalizeVersion(remoteVersion);
  const comparison = normalizedRemoteVersion
    ? compareVersions(normalizedRemoteVersion, baseStatus.installedVersion)
    : 0;

  return {
    ...baseStatus,
    status: normalizedRemoteVersion
      ? comparison > 0
        ? "available"
        : "current"
      : error
        ? "error"
        : "idle",
    remoteVersion: normalizedRemoteVersion,
    available: normalizedRemoteVersion ? comparison > 0 : false,
    checkedAt: Number(checkedAt) > 0 ? Number(checkedAt) : 0,
    sourceUrl: String(sourceUrl || "").trim(),
    error: String(error || "").trim(),
    stale: Boolean(stale),
  };
}

function readStoredPayload(storageRef) {
  if (!storageRef) {
    return null;
  }

  try {
    return safeParseJson(storageRef.getItem(UPDATE_STATUS_STORAGE_KEY));
  } catch (_) {
    return null;
  }
}

function writeStoredPayload(storageRef, payload) {
  if (!storageRef) {
    return;
  }

  try {
    storageRef.setItem(
      UPDATE_STATUS_STORAGE_KEY,
      JSON.stringify({
        remoteVersion: normalizeVersion(payload?.remoteVersion),
        checkedAt: Number(payload?.checkedAt) > 0 ? Number(payload.checkedAt) : 0,
        sourceUrl: String(payload?.sourceUrl || "").trim(),
      })
    );
  } catch (_) {
    // Ignore storage write failures.
  }
}

async function fetchRemoteVersion(fetchFn) {
  const candidateUrls = [USERSCRIPT_UPDATE_URL, USERSCRIPT_DOWNLOAD_URL];
  let lastError = null;

  for (const sourceUrl of candidateUrls) {
    try {
      const response = await fetchFn(sourceUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response || !response.ok) {
        throw new Error(`HTTP ${Number(response?.status) || 0}`);
      }

      const version = parseUserscriptVersion(await response.text());
      if (version) {
        return {
          remoteVersion: version,
          sourceUrl,
        };
      }

      throw new Error("Version nicht gefunden.");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Versionsabgleich fehlgeschlagen.");
}

export function readStoredUpdateStatus(options = {}) {
  const windowRef = options.windowRef || null;
  const installedVersion = normalizeVersion(options.installedVersion);
  const storageRef = getStorageRef(windowRef);
  const capable = Boolean(getFetchFn(windowRef));
  const storedPayload = readStoredPayload(storageRef);

  if (!storedPayload || typeof storedPayload !== "object") {
    return createBaseUpdateStatus(installedVersion, capable);
  }

  return createResolvedUpdateStatus({
    capable,
    installedVersion,
    remoteVersion: storedPayload.remoteVersion,
    checkedAt: storedPayload.checkedAt,
    sourceUrl: storedPayload.sourceUrl,
  });
}

export function shouldRefreshUpdateStatus(updateStatus, now = Date.now()) {
  const checkedAt = Number(updateStatus?.checkedAt || 0);
  if (checkedAt <= 0) {
    return true;
  }
  return Number(now) - checkedAt >= UPDATE_CHECK_TTL_MS;
}

export async function resolveLatestUpdateStatus(options = {}) {
  const windowRef = options.windowRef || null;
  const installedVersion = normalizeVersion(options.installedVersion);
  const force = Boolean(options.force);
  const now = Number(options.now || Date.now());
  const fetchFn = getFetchFn(windowRef);
  const storageRef = getStorageRef(windowRef);
  const cachedStatus = readStoredUpdateStatus({
    windowRef,
    installedVersion,
  });

  if (!fetchFn) {
    return cachedStatus;
  }

  if (!force && !shouldRefreshUpdateStatus(cachedStatus, now)) {
    return cachedStatus;
  }

  try {
    const remoteInfo = await fetchRemoteVersion(fetchFn);
    const nextStatus = createResolvedUpdateStatus({
      capable: true,
      installedVersion,
      remoteVersion: remoteInfo.remoteVersion,
      checkedAt: now,
      sourceUrl: remoteInfo.sourceUrl,
    });
    writeStoredPayload(storageRef, nextStatus);
    return nextStatus;
  } catch (error) {
    const message = String(error?.message || "Update-Prüfung fehlgeschlagen.").trim();
    if (cachedStatus.checkedAt > 0) {
      return {
        ...cachedStatus,
        error: message,
        stale: true,
      };
    }

    return createResolvedUpdateStatus({
      capable: true,
      installedVersion,
      remoteVersion: "",
      checkedAt: 0,
      sourceUrl: "",
      error: message,
    });
  }
}

export function openUserscriptInstall(windowRef) {
  if (typeof windowRef?.open === "function") {
    const openedWindow = windowRef.open(USERSCRIPT_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
    if (openedWindow && typeof openedWindow.focus === "function") {
      openedWindow.focus();
    }
    return Boolean(openedWindow);
  }

  if (windowRef?.location) {
    windowRef.location.href = USERSCRIPT_DOWNLOAD_URL;
    return true;
  }

  return false;
}

export { USERSCRIPT_DOWNLOAD_URL, USERSCRIPT_UPDATE_URL };
