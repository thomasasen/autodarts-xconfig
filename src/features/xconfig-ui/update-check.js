const USERSCRIPT_DOWNLOAD_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js";
const USERSCRIPT_UPDATE_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js";
const UPDATE_STATUS_STORAGE_KEY = "autodarts-xconfig:update-status:v1";
const UPDATE_CHECK_TTL_MS = 60 * 60 * 1000;
const UPDATE_CACHE_BUST_PARAM = "_adxconfig_ts";
const UPDATE_SOURCE_PRIORITY = Object.freeze({
  [USERSCRIPT_UPDATE_URL]: 1,
  [USERSCRIPT_DOWNLOAD_URL]: 2,
});

function normalizeVersion(value) {
  return String(value || "").trim();
}

function normalizeHeaderValue(value) {
  return String(value || "").trim();
}

function normalizeValidatorEntry(entry = {}) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const remoteVersion = normalizeVersion(entry.remoteVersion);
  const etag = normalizeHeaderValue(entry.etag);
  const lastModified = normalizeHeaderValue(entry.lastModified);

  if (!remoteVersion && !etag && !lastModified) {
    return null;
  }

  return {
    remoteVersion,
    etag,
    lastModified,
  };
}

function normalizeValidatorsMap(values) {
  if (!values || typeof values !== "object") {
    return {};
  }

  return Object.keys(values).reduce((result, sourceUrl) => {
    const normalizedSourceUrl = String(sourceUrl || "").trim();
    if (!normalizedSourceUrl) {
      return result;
    }

    const normalizedEntry = normalizeValidatorEntry(values[sourceUrl]);
    if (!normalizedEntry) {
      return result;
    }

    result[normalizedSourceUrl] = normalizedEntry;
    return result;
  }, {});
}

function mergeValidatorEntry(validators, sourceUrl, nextEntry) {
  const normalizedSourceUrl = String(sourceUrl || "").trim();
  const nextValidators = {
    ...normalizeValidatorsMap(validators),
  };

  if (!normalizedSourceUrl) {
    return nextValidators;
  }

  const normalizedEntry = normalizeValidatorEntry(nextEntry);
  if (!normalizedEntry) {
    delete nextValidators[normalizedSourceUrl];
    return nextValidators;
  }

  nextValidators[normalizedSourceUrl] = normalizedEntry;
  return nextValidators;
}

function getResponseHeader(response, headerName) {
  const normalizedHeaderName = String(headerName || "").trim().toLowerCase();
  if (!normalizedHeaderName) {
    return "";
  }

  if (typeof response?.headers?.get === "function") {
    return normalizeHeaderValue(response.headers.get(headerName));
  }

  if (response?.headers && typeof response.headers === "object") {
    const match = Object.keys(response.headers).find(
      (key) => String(key || "").trim().toLowerCase() === normalizedHeaderName
    );
    if (match) {
      return normalizeHeaderValue(response.headers[match]);
    }
  }

  return "";
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
    validators: {},
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

function getUpdateSourcePriority(sourceUrl) {
  return UPDATE_SOURCE_PRIORITY[String(sourceUrl || "").trim()] || 0;
}

function buildCacheBustedUrl(sourceUrl, now = Date.now()) {
  const normalizedSourceUrl = String(sourceUrl || "").trim();
  if (!normalizedSourceUrl) {
    return "";
  }

  const cacheBustValue = String(Math.max(0, Number(now) || 0));
  try {
    const parsed = new URL(normalizedSourceUrl);
    parsed.searchParams.set(UPDATE_CACHE_BUST_PARAM, cacheBustValue);
    return parsed.toString();
  } catch (_) {
    const separator = normalizedSourceUrl.includes("?") ? "&" : "?";
    return `${normalizedSourceUrl}${separator}${UPDATE_CACHE_BUST_PARAM}=${encodeURIComponent(cacheBustValue)}`;
  }
}

function createResolvedUpdateStatus({
  capable,
  installedVersion,
  remoteVersion,
  checkedAt,
  sourceUrl,
  error = "",
  stale = false,
  validators = {},
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
    validators: normalizeValidatorsMap(validators),
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
        validators: normalizeValidatorsMap(payload?.validators),
      })
    );
  } catch (_) {
    // Ignore storage write failures.
  }
}

async function fetchRemoteVersionFromSource(fetchFn, sourceUrl, options = {}) {
  const now = Number(options.now || Date.now());
  const validators = normalizeValidatorsMap(options.validators);
  const requestUrl = buildCacheBustedUrl(sourceUrl, now);
  const cachedValidator = validators[sourceUrl] || null;
  const headers = {};

  if (cachedValidator?.etag) {
    headers["If-None-Match"] = cachedValidator.etag;
  }
  if (cachedValidator?.lastModified) {
    headers["If-Modified-Since"] = cachedValidator.lastModified;
  }

  const response = await fetchFn(requestUrl, {
    method: "GET",
    cache: "no-store",
    ...(Object.keys(headers).length ? { headers } : {}),
  });

  const statusCode = Number(response?.status) || 0;
  const responseEtag = getResponseHeader(response, "etag");
  const responseLastModified = getResponseHeader(response, "last-modified");

  if (statusCode === 304) {
    const remoteVersion = normalizeVersion(cachedValidator?.remoteVersion);
    if (!remoteVersion) {
      throw new Error("Version nicht gefunden.");
    }

    return {
      remoteVersion,
      sourceUrl,
      validatorEntry: {
        remoteVersion,
        etag: responseEtag || cachedValidator?.etag || "",
        lastModified: responseLastModified || cachedValidator?.lastModified || "",
      },
    };
  }

  if (!response || !response.ok) {
    throw new Error(`HTTP ${statusCode}`);
  }

  const remoteVersion = parseUserscriptVersion(await response.text());
  if (!remoteVersion) {
    throw new Error("Version nicht gefunden.");
  }

  return {
    remoteVersion,
    sourceUrl,
    validatorEntry: {
      remoteVersion,
      etag: responseEtag,
      lastModified: responseLastModified,
    },
  };
}

function pickPreferredRemoteVersion(candidates = []) {
  return candidates.reduce((bestCandidate, candidate) => {
    if (!bestCandidate) {
      return candidate;
    }

    const comparison = compareVersions(candidate.remoteVersion, bestCandidate.remoteVersion);
    if (comparison > 0) {
      return candidate;
    }
    if (comparison < 0) {
      return bestCandidate;
    }

    return getUpdateSourcePriority(candidate.sourceUrl) > getUpdateSourcePriority(bestCandidate.sourceUrl)
      ? candidate
      : bestCandidate;
  }, null);
}

async function fetchRemoteVersion(fetchFn, options = {}) {
  const now = Number(options.now || Date.now());
  const validators = normalizeValidatorsMap(options.validators);
  const candidateUrls = [USERSCRIPT_UPDATE_URL, USERSCRIPT_DOWNLOAD_URL];
  let lastError = null;
  let nextValidators = validators;
  const resolvedCandidates = [];

  for (const sourceUrl of candidateUrls) {
    try {
      const remoteInfo = await fetchRemoteVersionFromSource(fetchFn, sourceUrl, {
        now,
        validators: nextValidators,
      });
      nextValidators = mergeValidatorEntry(nextValidators, sourceUrl, remoteInfo.validatorEntry);
      resolvedCandidates.push({
        remoteVersion: remoteInfo.remoteVersion,
        sourceUrl,
      });
    } catch (error) {
      lastError = error;
    }
  }

  const preferredCandidate = pickPreferredRemoteVersion(resolvedCandidates);
  if (preferredCandidate) {
    return {
      remoteVersion: preferredCandidate.remoteVersion,
      sourceUrl: preferredCandidate.sourceUrl,
      validators: nextValidators,
    };
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
    validators: storedPayload.validators,
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
    const remoteInfo = await fetchRemoteVersion(fetchFn, {
      now,
      validators: cachedStatus.validators,
    });
    const nextStatus = createResolvedUpdateStatus({
      capable: true,
      installedVersion,
      remoteVersion: remoteInfo.remoteVersion,
      checkedAt: now,
      sourceUrl: remoteInfo.sourceUrl,
      validators: remoteInfo.validators,
    });
    writeStoredPayload(storageRef, nextStatus);
    return nextStatus;
  } catch (error) {
    const message = String(error?.message || "Update-Prüfung fehlgeschlagen.").trim();
    if (cachedStatus.checkedAt > 0 && cachedStatus.remoteVersion) {
      const staleStatus = {
        ...cachedStatus,
        error: message,
        stale: true,
        checkedAt: now,
      };
      writeStoredPayload(storageRef, staleStatus);
      return staleStatus;
    }

    const errorStatus = createResolvedUpdateStatus({
      capable: true,
      installedVersion,
      remoteVersion: "",
      checkedAt: now,
      sourceUrl: "",
      error: message,
      validators: cachedStatus.validators,
    });
    writeStoredPayload(storageRef, errorStatus);
    return errorStatus;
  }
}

export function openUserscriptInstall(windowRef) {
  const installUrl = buildCacheBustedUrl(USERSCRIPT_DOWNLOAD_URL, Date.now()) || USERSCRIPT_DOWNLOAD_URL;
  if (typeof windowRef?.open === "function") {
    const openedWindow = windowRef.open(installUrl, "_blank", "noopener,noreferrer");
    if (openedWindow && typeof openedWindow.focus === "function") {
      openedWindow.focus();
    }
    return Boolean(openedWindow);
  }

  if (windowRef?.location) {
    windowRef.location.href = installUrl;
    return true;
  }

  return false;
}

export { USERSCRIPT_DOWNLOAD_URL, USERSCRIPT_UPDATE_URL };
