import test from "node:test";
import assert from "node:assert/strict";

import {
  openUserscriptInstall,
  USERSCRIPT_DOWNLOAD_URL,
  USERSCRIPT_UPDATE_URL,
  resolveLatestUpdateStatus,
  shouldRefreshUpdateStatus,
} from "../../src/features/xconfig-ui/update-check.js";
import { FakeStorage, createFakeWindow } from "./fake-dom.js";

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
  const normalized = Object.entries(values).reduce((result, [key, value]) => {
    result[String(key || "").toLowerCase()] = String(value || "");
    return result;
  }, {});

  return {
    get(name) {
      return normalized[String(name || "").toLowerCase()] || null;
    },
  };
}

test("resolveLatestUpdateStatus adds cache-busting query to remote update requests", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url, options = {}) => {
    requests.push({ url: String(url || ""), options });
    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta("2.0.3");
      },
    };
  };

  const now = 1_770_300_000_000;
  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.0.2",
    force: true,
    now,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.0.3");
  assert.equal(status.sourceUrl, USERSCRIPT_DOWNLOAD_URL);
  assert.equal(requests.length, 2);

  const [metaRequest, downloadRequest] = requests;
  const metaRequestUrl = new URL(metaRequest.url);
  const downloadRequestUrl = new URL(downloadRequest.url);
  assert.equal(getUrlWithoutQuery(metaRequest.url), USERSCRIPT_UPDATE_URL);
  assert.equal(getUrlWithoutQuery(downloadRequest.url), USERSCRIPT_DOWNLOAD_URL);
  assert.equal(metaRequestUrl.searchParams.get("_adxconfig_ts"), String(now));
  assert.equal(downloadRequestUrl.searchParams.get("_adxconfig_ts"), String(now));
  assert.equal(metaRequest.options.cache, "no-store");
  assert.equal(downloadRequest.options.cache, "no-store");
});

test("resolveLatestUpdateStatus falls back from meta to userscript URL with cache-busting query", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    requests.push(String(url || ""));
    if (requests.length === 1) {
      throw new Error("network down");
    }
    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta("2.0.3");
      },
    };
  };

  const now = 1_770_300_123_456;
  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.0.2",
    force: true,
    now,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.0.3");
  assert.equal(status.sourceUrl, USERSCRIPT_DOWNLOAD_URL);
  assert.equal(requests.length, 2);

  const firstRequestUrl = new URL(requests[0]);
  const secondRequestUrl = new URL(requests[1]);
  assert.equal(getUrlWithoutQuery(requests[0]), USERSCRIPT_UPDATE_URL);
  assert.equal(getUrlWithoutQuery(requests[1]), USERSCRIPT_DOWNLOAD_URL);
  assert.equal(firstRequestUrl.searchParams.get("_adxconfig_ts"), String(now));
  assert.equal(secondRequestUrl.searchParams.get("_adxconfig_ts"), String(now));
});

test("resolveLatestUpdateStatus uses conditional request headers and reuses cached version on 304", async () => {
  const localStorage = new FakeStorage({
    "autodarts-xconfig:update-status:v1": JSON.stringify({
      remoteVersion: "2.0.3",
      checkedAt: 0,
      sourceUrl: USERSCRIPT_UPDATE_URL,
      validators: {
        [USERSCRIPT_UPDATE_URL]: {
          remoteVersion: "2.0.3",
          etag: "\"abc\"",
          lastModified: "Mon, 01 Jan 2024 00:00:00 GMT",
        },
      },
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url, options = {}) => {
    requests.push({ url: String(url || ""), options });
    return {
      ok: false,
      status: 304,
      headers: createHeaders({
        etag: "\"abc\"",
        "last-modified": "Mon, 01 Jan 2024 00:00:00 GMT",
      }),
      async text() {
        return "";
      },
    };
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.0.2",
    force: true,
    now: 1_770_301_000_000,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.0.3");
  assert.equal(status.sourceUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(requests.length, 2);

  const request = requests[0];
  assert.equal(getUrlWithoutQuery(request.url), USERSCRIPT_UPDATE_URL);
  assert.equal(request.options.headers["If-None-Match"], "\"abc\"");
  assert.equal(request.options.headers["If-Modified-Since"], "Mon, 01 Jan 2024 00:00:00 GMT");
});

test("resolveLatestUpdateStatus persists validator metadata from successful responses", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });

  windowRef.fetch = async () => {
    return {
      ok: true,
      status: 200,
      headers: createHeaders({
        etag: "\"etag-xyz\"",
        "last-modified": "Tue, 02 Jan 2024 00:00:00 GMT",
      }),
      async text() {
        return buildUserscriptMeta("2.0.4");
      },
    };
  };

  await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.0.2",
    force: true,
    now: 1_770_301_100_000,
  });

  const persisted = JSON.parse(localStorage.getItem("autodarts-xconfig:update-status:v1"));
  assert.equal(persisted.remoteVersion, "2.0.4");
  assert.equal(persisted.sourceUrl, USERSCRIPT_DOWNLOAD_URL);
  assert.equal(persisted.validators[USERSCRIPT_UPDATE_URL].remoteVersion, "2.0.4");
  assert.equal(persisted.validators[USERSCRIPT_UPDATE_URL].etag, "\"etag-xyz\"");
  assert.equal(
    persisted.validators[USERSCRIPT_UPDATE_URL].lastModified,
    "Tue, 02 Jan 2024 00:00:00 GMT"
  );
  assert.equal(persisted.validators[USERSCRIPT_DOWNLOAD_URL].remoteVersion, "2.0.4");
});

test("resolveLatestUpdateStatus prefers the newest published version across meta and userscript endpoints", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const requests = [];
  windowRef.fetch = async (url) => {
    const requestUrl = String(url || "");
    requests.push(requestUrl);
    if (getUrlWithoutQuery(requestUrl) === USERSCRIPT_UPDATE_URL) {
      return {
        ok: true,
        status: 200,
        async text() {
          return buildUserscriptMeta("2.0.3");
        },
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta("2.0.4");
      },
    };
  };

  const status = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.0.2",
    force: true,
    now: 1_770_301_050_000,
  });

  assert.equal(status.available, true);
  assert.equal(status.remoteVersion, "2.0.4");
  assert.equal(status.sourceUrl, USERSCRIPT_DOWNLOAD_URL);
  assert.equal(requests.length, 2);
});

test("resolveLatestUpdateStatus throttles repeated failed checks within ttl window", async () => {
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
    installedVersion: "2.0.2",
    force: true,
    now: firstNow,
  });

  assert.equal(firstStatus.status, "error");
  assert.equal(firstStatus.checkedAt, firstNow);
  const callsAfterFirstAttempt = callCount;
  assert.equal(callsAfterFirstAttempt >= 1, true);

  const secondStatus = await resolveLatestUpdateStatus({
    windowRef,
    installedVersion: "2.0.2",
    force: false,
    now: firstNow + 10_000,
  });

  assert.equal(callCount, callsAfterFirstAttempt);
  assert.equal(secondStatus.checkedAt, firstNow);
});

test("shouldRefreshUpdateStatus respects ttl boundary", () => {
  const now = 1_770_300_000_000;
  const ttlMs = 60 * 60 * 1000;
  const freshStatus = { checkedAt: now - (ttlMs - 1) };
  const expiredStatus = { checkedAt: now - ttlMs };

  assert.equal(shouldRefreshUpdateStatus(freshStatus, now), false);
  assert.equal(shouldRefreshUpdateStatus(expiredStatus, now), true);
});

test("openUserscriptInstall adds cache-busting query to install URL", () => {
  const windowRef = createFakeWindow();
  const originalNow = Date.now;
  Date.now = () => 1_770_300_999_000;
  try {
    const opened = openUserscriptInstall(windowRef);
    assert.equal(opened, true);
  } finally {
    Date.now = originalNow;
  }

  const installUrl = String(windowRef.__openedUrls.at(-1) || "");
  const parsed = new URL(installUrl);
  assert.equal(getUrlWithoutQuery(installUrl), USERSCRIPT_DOWNLOAD_URL);
  assert.equal(parsed.searchParams.get("_adxconfig_ts"), "1770300999000");
});
