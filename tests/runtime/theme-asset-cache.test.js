import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createThemeAssetCache, downloadThemeAsset, THEME_ASSET_STORAGE_PREFIX } from "../../src/shared/theme-asset-cache.js";
import { backgroundAssetKeys, requiredThemeAssetKeys } from "../../src/shared/theme-asset-selection.js";
import { COMMUNITY_PRESETS } from "../../src/shared/community-designs.js";

const bytes = new TextEncoder().encode("trusted image content");
const hash = createHash("sha256").update(bytes).digest("hex");
const catalog = { wallpaper: { sha256: hash, bytes: bytes.length, mime: "image/webp", file: "wallpaper.webp" } };
function fixture(options = {}) {
  const stored = options.stored || new Map();
  const requests = [];
  const cache = createThemeAssetCache({ catalog, releaseTag: "v3.5.12", getValue: (key) => stored.get(key),
    setValue: (key, value) => stored.set(key, value), download: async (url) => { requests.push(url); return bytes; }, ...options });
  return { cache, stored, requests };
}

test("gallery hydration only reads storage and never downloads an unused image", async () => {
  const f = fixture();
  assert.equal(f.cache.resolve("wallpaper"), "");
  await f.cache.hydrate(["wallpaper"]);
  assert.equal(f.requests.length, 0);
  assert.equal(f.cache.resolve("wallpaper"), "");
});

test("first activation downloads a pinned release and persists verified content separately", async () => {
  const f = fixture();
  const url = await f.cache.ensure("wallpaper");
  assert.equal(url, "data:image/webp;base64," + Buffer.from(bytes).toString("base64"));
  assert.deepEqual(f.requests, ["https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/v3.5.12/src/assets/theme-presets/wallpaper.webp"]);
  assert.deepEqual([...f.stored.keys()], [THEME_ASSET_STORAGE_PREFIX + hash]);
  assert.equal(f.cache.resolve("wallpaper"), url);
});

test("reload and a new release reuse checksum-addressed storage without network", async () => {
  const first = fixture();
  const expected = await first.cache.ensure("wallpaper");
  const next = fixture({ stored: first.stored, releaseTag: "v9.0.0", download: () => { throw new Error("offline"); } });
  await next.cache.hydrate(["wallpaper"]);
  assert.equal(await next.cache.ensure("wallpaper"), expected);
});

test("concurrent requests for the same image share a single download", async () => {
  const f = fixture();
  const first = f.cache.ensure("wallpaper");
  assert.equal(f.cache.ensure("wallpaper"), first);
  await first;
  assert.equal(f.requests.length, 1);
});

test("a changed checksum for the same key requires new bytes and preserves the old cached revision", async () => {
  const first = fixture();
  const oldUrl = await first.cache.ensure("wallpaper");
  const changed = new TextEncoder().encode("new revision of the image");
  const newHash = createHash("sha256").update(changed).digest("hex");
  const updated = { wallpaper: { ...catalog.wallpaper, sha256: newHash, bytes: changed.length } };
  const offline = fixture({ stored: first.stored, catalog: updated, download: () => { throw new Error("offline"); } });
  await assert.rejects(offline.cache.ensure("wallpaper"), /offline/);
  assert.equal(offline.cache.resolve("wallpaper"), "");
  assert.equal(first.cache.resolve("wallpaper"), oldUrl);
  const next = fixture({ stored: first.stored, catalog: updated, download: async () => changed });
  const newUrl = await next.cache.ensure("wallpaper");
  assert.notEqual(newUrl, oldUrl);
  assert.ok(first.stored.has(THEME_ASSET_STORAGE_PREFIX + hash));
  assert.ok(first.stored.has(THEME_ASSET_STORAGE_PREFIX + newHash));
});

test("bad downloads and corrupt stored images are not made available", async () => {
  const stored = new Map([[THEME_ASSET_STORAGE_PREFIX + hash, { sha256: hash, dataUrl: "data:image/webp;base64,YmFk" }]]);
  const f = fixture({ stored, download: async () => new TextEncoder().encode("wrong image") });
  await f.cache.hydrate(["wallpaper"]);
  assert.equal(f.cache.resolve("wallpaper"), "");
  await assert.rejects(f.cache.ensure("wallpaper"), /Prüfsumme/);
  assert.equal(f.cache.resolve("wallpaper"), "");
});

test("write failure preserves the previous image and permits a fresh retry", async () => {
  let fail = true;
  const stored = new Map();
  const f = fixture({ stored, setValue: (key, value) => { if (fail) throw new Error("quota"); stored.set(key, value); } });
  const events = [];
  f.cache.subscribe((event) => events.push(event));
  await assert.rejects(f.cache.ensure("wallpaper"), /dauerhaft gespeichert/);
  assert.equal(f.cache.resolve("wallpaper"), "");
  assert.equal(events.at(-1).error.code, "THEME_ASSET_FAILED");
  fail = false;
  assert.ok(await f.cache.ensure("wallpaper"));
  assert.equal(f.requests.length, 2);
});

test("a silently dropped write also fails instead of using a memory-only image", async () => {
  const f = fixture({ setValue: () => {} });
  await assert.rejects(f.cache.ensure("wallpaper"), /dauerhaft gespeichert/);
  assert.equal(f.cache.resolve("wallpaper"), "");
});

test("network and storage-read failures permit retry without poisoning in-flight state", async () => {
  let fail = true;
  const f = fixture({ getValue: () => { if (fail) throw new Error("storage"); }, download: () => { throw new Error("network offline"); } });
  await assert.rejects(f.cache.ensure("wallpaper"), /nicht gelesen/);
  fail = false;
  await assert.rejects(f.cache.ensure("wallpaper"), /network offline/);
  assert.equal(f.cache.resolve("wallpaper"), "");
});

test("downloads use anonymous binary requests and abort on a bounded deadline", async () => {
  let options;
  const result = downloadThemeAsset("https://raw.githubusercontent.com/example", (request) => { options = request; });
  assert.equal(options.anonymous, true);
  assert.equal(options.responseType, "arraybuffer");
  options.onload({ status: 200, response: bytes.buffer });
  assert.deepEqual(await result, bytes);
  let aborted = false;
  await assert.rejects(downloadThemeAsset("https://raw.githubusercontent.com/example", () => ({ abort: () => { aborted = true; } }), { timeoutMs: 5 }), /Zeitüberschreitung/);
  assert.equal(aborted, true);
});

test("selection requests only the current context and explicitly enabled surround", () => {
  const preset = COMMUNITY_PRESETS.find((entry) => entry.backgroundAssets.portrait && entry.backgroundAssets.cricket);
  const background = { enabled: true, communityPresetKey: preset.key, backgroundAssetKey: preset.backgroundAssetKey };
  assert.deepEqual(backgroundAssetKeys(background, { context: "cricket" }), [preset.backgroundAssets.cricket]);
  assert.deepEqual(backgroundAssetKeys(background, { portrait: true }), [preset.backgroundAssets.portrait]);
  const config = { features: { themes: { globalBackground: background }, boardSurround: { enabled: false, assetKey: "not-requested" } } };
  assert.deepEqual(requiredThemeAssetKeys(config, { context: "game" }), [preset.backgroundAssetKey]);
  assert.deepEqual(requiredThemeAssetKeys(config, { context: "menu" }), []);
  assert.deepEqual(backgroundAssetKeys({ ...background, backgroundImageDataUrl: "data:image/png;base64,AAAA" }), []);
});
