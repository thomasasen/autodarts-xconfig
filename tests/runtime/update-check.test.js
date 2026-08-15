import test from "node:test";
import assert from "node:assert/strict";

import {
  openUserscriptInstall,
  USERSCRIPT_DOWNLOAD_URL,
  USERSCRIPT_UPDATE_FALLBACK_URL,
  USERSCRIPT_UPDATE_URL,
  resolveLatestUpdateStatus,
  shouldRefreshUpdateStatus,
} from "../../src/features/xconfig-ui/update-check.js";
import { FakeStorage, createFakeWindow } from "./fake-dom.js";

const RELEASE_USER_URL =
  "https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.user.js";
const STORAGE_KEY = "autodarts-xconfig:update-status:v1";

function buildUserscriptMeta(version) {
  return `// ==UserScript==
// @name         autodarts-xconfig
// @version      ${version}
// ==/UserScript==
`;
}

function getUrlWithoutQuery(url) {
  const parsed = new URL(String(url || ""));
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function createHeaders(values = {}) {
  const normalized = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      String(key || "").toLowerCase(),
      String(value || ""),
    ])
  );

  return {
    get(name) {
      return normalized[String(name || "").toLowerCase()] || null;
    },
  };
}

function createMetaResponse(version, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers: createHeaders(options.headers),
    async text() {
      return buildUserscriptMeta(version);
    },
  };
}

function assertNoReleasePayloadRequest(requests) {
  const requestedSources = requests.map((request) =>
    getUrlWithoutQuery(typeof request === "string" ? request : request.url)
  );
  assert.equal(requestedSources.includes(RELEASE_USER_URL), false);
}

test("normal update check requests only the primary Raw metadata endpoint", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url, options = {}) => {
    requests.push({ url: String(url || ""), options });
    return createMetaResponse("2.9.2");
  };

  const now = 1_770_300_000_000;
  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    now,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.9.2");
  assert.equal(status.sourceUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(requests.length, 1);
  assert.equal(getUrlWithoutQuery(requests[0].url), USERSCRIPT_UPDATE_URL);
  assert.equal(new URL(requests[0].url).searchParams.get("_adxconfig_ts"), String(now));
  assert.equal(requests[0].options.cache, "no-store");
  assertNoReleasePayloadRequest(requests);
});

test("forced update check bypasses fresh cache without requesting release user payload", async () => {
  const now = 1_770_300_100_000;
  const localStorage = new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({
      remoteVersion: "2.9.1",
      checkedAt: now - 1_000,
      sourceUrl: USERSCRIPT_UPDATE_URL,
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    requests.push(String(url || ""));
    return createMetaResponse("2.9.2");
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now,
  });

  assert.equal(status.available, true);
  assert.equal(requests.length, 1);
  assert.equal(getUrlWithoutQuery(requests[0]), USERSCRIPT_UPDATE_URL);
  assertNoReleasePayloadRequest(requests);
});

test("primary failure falls back only to release metadata and never release user payload", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    const requestUrl = String(url || "");
    requests.push(requestUrl);
    if (getUrlWithoutQuery(requestUrl) === USERSCRIPT_UPDATE_URL) {
      throw new Error("primary unavailable");
    }
    return createMetaResponse("2.9.2");
  };

  const now = 1_770_300_123_456;
  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.9.2");
  assert.equal(status.sourceUrl, USERSCRIPT_UPDATE_FALLBACK_URL);
  assert.deepEqual(
    requests.map(getUrlWithoutQuery),
    [USERSCRIPT_UPDATE_URL, USERSCRIPT_UPDATE_FALLBACK_URL]
  );
  for (const requestUrl of requests) {
    assert.equal(new URL(requestUrl).searchParams.get("_adxconfig_ts"), String(now));
  }
  assertNoReleasePayloadRequest(requests);
});

test("conditional primary request reuses cached version on 304 without fallback", async () => {
  const localStorage = new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({
      remoteVersion: "2.9.2",
      checkedAt: 0,
      sourceUrl: USERSCRIPT_UPDATE_URL,
      validators: {
        [USERSCRIPT_UPDATE_URL]: {
          remoteVersion: "2.9.2",
          etag: '"abc"',
          lastModified: "Mon, 01 Jan 2024 00:00:00 GMT",
        },
      },
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url, options = {}) => {
    requests.push({ url: String(url || ""), options });
    return createMetaResponse("", {
      ok: false,
      status: 304,
      headers: {
        etag: '"abc"',
        "last-modified": "Mon, 01 Jan 2024 00:00:00 GMT",
      },
    });
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now: 1_770_301_000_000,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.9.2");
  assert.equal(status.sourceUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.headers["If-None-Match"], '"abc"');
  assert.equal(
    requests[0].options.headers["If-Modified-Since"],
    "Mon, 01 Jan 2024 00:00:00 GMT"
  );
  assertNoReleasePayloadRequest(requests);
});

test("successful primary response persists validator metadata", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  windowRef.fetch = async () =>
    createMetaResponse("2.9.2", {
      headers: {
        etag: '"etag-xyz"',
        "last-modified": "Tue, 02 Jan 2024 00:00:00 GMT",
      },
    });

  await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now: 1_770_301_100_000,
  });

  const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(persisted.remoteVersion, "2.9.2");
  assert.equal(persisted.sourceUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(persisted.validators[USERSCRIPT_UPDATE_URL].remoteVersion, "2.9.2");
  assert.equal(persisted.validators[USERSCRIPT_UPDATE_URL].etag, '"etag-xyz"');
  assert.equal(
    persisted.validators[USERSCRIPT_UPDATE_URL].lastModified,
    "Tue, 02 Jan 2024 00:00:00 GMT"
  );
});

test("legacy 2.9.1 cache entries remain readable but their Raw user validator is never fetched", async () => {
  const legacyCheckedAt = 1_770_301_000_000;
  const localStorage = new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({
      remoteVersion: "2.9.1",
      checkedAt: legacyCheckedAt,
      sourceUrl: USERSCRIPT_DOWNLOAD_URL,
      validators: {
        [USERSCRIPT_UPDATE_URL]: { remoteVersion: "2.9.1", etag: '"meta-old"' },
        [USERSCRIPT_DOWNLOAD_URL]: { remoteVersion: "2.9.1", etag: '"user-old"' },
      },
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    requests.push(String(url || ""));
    return createMetaResponse("2.9.2");
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now: legacyCheckedAt + 10_000,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.9.2");
  assert.deepEqual(requests.map(getUrlWithoutQuery), [USERSCRIPT_UPDATE_URL]);
  assertNoReleasePayloadRequest(requests);
});

test("older remote metadata never offers a downgrade", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    requests.push(String(url || ""));
    return createMetaResponse("2.9.2");
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "3.4.2",
    force: true,
    now: 1_770_301_200_000,
  });

  assert.equal(status.status, "current");
  assert.equal(status.available, false);
  assert.equal(status.remoteVersion, "2.9.2");
  assertNoReleasePayloadRequest(requests);
});

test("failed primary and fallback checks preserve cached state as stale", async () => {
  const cachedCheckedAt = 1_770_301_000_000;
  const localStorage = new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({
      remoteVersion: "2.9.2",
      checkedAt: cachedCheckedAt,
      sourceUrl: USERSCRIPT_UPDATE_URL,
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    requests.push(String(url || ""));
    throw new Error("network down");
  };

  const now = 1_770_302_000_000;
  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now,
  });

  assert.equal(status.remoteVersion, "2.9.2");
  assert.equal(status.available, true);
  assert.equal(status.stale, true);
  assert.equal(status.checkedAt, now);
  assert.deepEqual(
    requests.map(getUrlWithoutQuery),
    [USERSCRIPT_UPDATE_URL, USERSCRIPT_UPDATE_FALLBACK_URL]
  );
  assertNoReleasePayloadRequest(requests);
});

test("failed checks are throttled within the ttl window", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  let callCount = 0;
  windowRef.fetch = async () => {
    callCount += 1;
    throw new Error("network down");
  };

  const firstNow = 1_770_302_000_000;
  const firstStatus = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now: firstNow,
  });
  assert.equal(firstStatus.status, "error");
  assert.equal(callCount, 2);

  const secondStatus = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    now: firstNow + 10_000,
  });
  assert.equal(callCount, 2);
  assert.equal(secondStatus.checkedAt, firstNow);
});

test("aborted primary request is stale-neutral and does not attempt fallback", async () => {
  const cachedCheckedAt = 1_770_301_000_000;
  const localStorage = new FakeStorage({
    [STORAGE_KEY]: JSON.stringify({
      remoteVersion: "2.9.2",
      checkedAt: cachedCheckedAt,
      sourceUrl: USERSCRIPT_UPDATE_URL,
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  let callCount = 0;
  windowRef.fetch = async () => {
    callCount += 1;
    const error = new Error("aborted");
    error.name = "AbortError";
    throw error;
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.9.1",
    force: true,
    now: 1_770_302_000_000,
  });
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

  assert.equal(callCount, 1);
  assert.equal(status.remoteVersion, "2.9.2");
  assert.equal(status.checkedAt, cachedCheckedAt);
  assert.equal(status.error, "");
  assert.equal(stored.checkedAt, cachedCheckedAt);
});

test("shouldRefreshUpdateStatus respects ttl boundary", () => {
  const now = 1_770_300_000_000;
  const ttlMs = 60 * 60 * 1000;
  assert.equal(shouldRefreshUpdateStatus({ checkedAt: now - (ttlMs - 1) }, now), false);
  assert.equal(shouldRefreshUpdateStatus({ checkedAt: now - ttlMs }, now), true);
});

test("manual install keeps the browser-tested Raw compatibility bridge", () => {
  const windowRef = createFakeWindow();
  const originalNow = Date.now;
  Date.now = () => 1_770_300_999_000;
  try {
    assert.equal(openUserscriptInstall(windowRef), true);
  } finally {
    Date.now = originalNow;
  }

  const installUrl = String(windowRef.__openedUrls.at(-1) || "");
  assert.equal(getUrlWithoutQuery(installUrl), USERSCRIPT_DOWNLOAD_URL);
  assert.equal(new URL(installUrl).searchParams.get("_adxconfig_ts"), "1770300999000");
  assert.notEqual(getUrlWithoutQuery(installUrl), RELEASE_USER_URL);
});
