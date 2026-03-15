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
  assert.equal(requests.length, 1);

  const request = requests[0];
  const requestUrl = new URL(request.url);
  assert.equal(getUrlWithoutQuery(request.url), USERSCRIPT_UPDATE_URL);
  assert.equal(requestUrl.searchParams.get("_adxconfig_ts"), String(now));
  assert.equal(request.options.cache, "no-store");
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
