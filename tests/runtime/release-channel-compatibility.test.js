import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildUserscriptHeader,
  USERSCRIPT_LEGACY_DOWNLOAD_URL,
  USERSCRIPT_RELEASE_DOWNLOAD_URL,
  USERSCRIPT_UPDATE_URL,
} from "../../scripts/userscript-build-config.mjs";
import {
  resolveLatestUpdateStatus,
  USERSCRIPT_UPDATE_FALLBACK_URL,
} from "../../src/features/xconfig-ui/update-check.js";
import { FakeStorage, createFakeWindow } from "./fake-dom.js";

const fixturePath = path.resolve(
  process.cwd(),
  "tests",
  "fixtures",
  "release-channel-metadata.json"
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const FUTURE_STABLE_VERSION = "3.4.2";
const currentMetaPath = path.resolve(process.cwd(), "dist", "autodarts-xconfig.meta.js");
const currentUserPath = path.resolve(process.cwd(), "dist", "autodarts-xconfig.user.js");

function buildMeta(version) {
  return `// ==UserScript==\n// @version      ${version}\n// ==/UserScript==\n`;
}

function withoutQuery(url) {
  const parsed = new URL(String(url || ""));
  parsed.search = "";
  return parsed.toString();
}

function readHistoricalMeta(commit) {
  return execFileSync(
    "git",
    ["show", `${commit}:dist/autodarts-xconfig.meta.js`],
    { cwd: process.cwd(), encoding: "utf8" }
  );
}

function parseMetadata(text) {
  const source = String(text || "");
  return {
    version: source.match(/@version\s+([^\s]+)/)?.[1] || "",
    updateUrl: source.match(/@updateURL\s+([^\s]+)/)?.[1] || "",
    downloadUrl: source.match(/@downloadURL\s+([^\s]+)/)?.[1] || "",
  };
}

test("historical fixtures match metadata stored in their real release commits", () => {
  assert.equal(fixture.oldestVerified.version, "1.2.0");
  assert.deepEqual(
    fixture.historicalClients.map((client) => client.version),
    ["2.0.70", "2.1.27", "2.6.0", "2.8.0", "2.9.1"]
  );

  for (const client of [fixture.oldestVerified, ...fixture.historicalClients]) {
    assert.match(client.commit, /^[0-9a-f]{40}$/);
    const historicalMetadata = parseMetadata(readHistoricalMeta(client.commit));
    assert.deepEqual(historicalMetadata, {
      version: client.version,
      updateUrl: client.updateUrl,
      downloadUrl: client.downloadUrl,
    });
    assert.equal(historicalMetadata.updateUrl, USERSCRIPT_UPDATE_URL);
    assert.equal(historicalMetadata.downloadUrl, USERSCRIPT_LEGACY_DOWNLOAD_URL);
  }
  assert.equal(fixture.migrationTarget.version, "2.9.2");
  assert.equal(fixture.migrationTarget.updateUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(fixture.migrationTarget.downloadUrl, USERSCRIPT_RELEASE_DOWNLOAD_URL);
});

test("2.9.1 Path A and Path B both install the same current 2.9.2 payload", () => {
  const historical291 = fixture.historicalClients.find((client) => client.version === "2.9.1");
  const installed291Metadata = parseMetadata(readHistoricalMeta(historical291.commit));
  const advertisedMetadata = parseMetadata(readFileSync(currentMetaPath, "utf8"));
  const rawBridgePayload = readFileSync(currentUserPath, "utf8");
  const rawBridgeMetadata = parseMetadata(rawBridgePayload);
  const releaseAssetMetadata = parseMetadata(rawBridgePayload);

  assert.equal(installed291Metadata.updateUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(installed291Metadata.downloadUrl, USERSCRIPT_LEGACY_DOWNLOAD_URL);
  assert.deepEqual(advertisedMetadata, {
    version: "2.9.2",
    updateUrl: USERSCRIPT_UPDATE_URL,
    downloadUrl: USERSCRIPT_RELEASE_DOWNLOAD_URL,
  });

  // Path A: the old installed download URL retrieves the permanent Raw user bridge.
  assert.equal(rawBridgeMetadata.version, "2.9.2");
  assert.equal(rawBridgeMetadata.updateUrl, USERSCRIPT_UPDATE_URL);
  assert.equal(rawBridgeMetadata.downloadUrl, USERSCRIPT_RELEASE_DOWNLOAD_URL);
  assert.match(rawBridgePayload, /initializeTampermonkeyRuntime/);

  // Path B: the newly advertised metadata retrieves the byte-identical release candidate.
  assert.deepEqual(releaseAssetMetadata, rawBridgeMetadata);
});

test("every representative legacy client can discover a future stable version directly", async () => {
  for (const client of fixture.historicalClients) {
    const requests = [];
    const windowRef = createFakeWindow({ localStorage: new FakeStorage() });
    windowRef.fetch = async (url) => {
      requests.push(String(url || ""));
      return {
        ok: true,
        status: 200,
        async text() {
          return buildMeta(FUTURE_STABLE_VERSION);
        },
      };
    };

    const status = await resolveLatestUpdateStatus({
      windowRef,
      installedVersion: client.version,
      force: true,
      now: 1_770_400_000_000,
    });

    assert.equal(status.available, true, client.version);
    assert.equal(status.remoteVersion, FUTURE_STABLE_VERSION, client.version);
    assert.deepEqual(requests.map(withoutQuery), [USERSCRIPT_UPDATE_URL], client.version);
    assert.equal(requests.some((url) => withoutQuery(url) === USERSCRIPT_UPDATE_FALLBACK_URL), false);
  }
});

test("legacy Raw payload bridge installs the current header and migrates future payloads to Releases", () => {
  const currentHeaderServedFromRawBridge = buildUserscriptHeader(FUTURE_STABLE_VERSION);

  assert.match(currentHeaderServedFromRawBridge, /@version\s+3\.4\.2/);
  assert.match(
    currentHeaderServedFromRawBridge,
    new RegExp(`@updateURL\\s+${USERSCRIPT_UPDATE_URL.replaceAll(".", "\\.")}`)
  );
  assert.match(
    currentHeaderServedFromRawBridge,
    new RegExp(`@downloadURL\\s+${USERSCRIPT_RELEASE_DOWNLOAD_URL.replaceAll(".", "\\.")}`)
  );
  assert.notEqual(USERSCRIPT_LEGACY_DOWNLOAD_URL, USERSCRIPT_RELEASE_DOWNLOAD_URL);
});
