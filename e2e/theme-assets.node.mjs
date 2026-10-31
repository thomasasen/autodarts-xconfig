// Explicit integration QA of the production browser cache, runtime and settings UI.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { chromium, expect } from "@playwright/test";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";
import { THEME_ASSET_CATALOG } from "../src/shared/theme-asset-catalog.js";
import { THEME_ASSET_RELEASE_TAG } from "../src/shared/theme-asset-source.js";
import { THEME_ASSET_STORAGE_PREFIX } from "../src/shared/theme-asset-cache.js";
import { CONFIG_STORAGE_KEY } from "../src/config/config-store.js";

let browser;
let code;
let html;
const root = process.cwd();
const prefix = `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/${THEME_ASSET_RELEASE_TAG}/src/assets/theme-presets/`;
before(async () => {
  const result = await build({ stdin: { contents: `
    export { initializeTampermonkeyRuntime } from './src/runtime/bootstrap-runtime.js';
    export { createThemeGlobalTemplatePresetPatch } from './src/shared/theme-global-template-presets.js';
    export { COMMUNITY_PRESETS } from './src/shared/community-designs.js';
    export { resolveThemePresetAsset, resolveThemePresetPreview } from '#theme-preset-assets';
  `, resolveDir: root }, bundle: true, platform: "browser", format: "iife", globalName: "LazyTest", loader: USERSCRIPT_ASSET_LOADERS, write: false, logLevel: "silent" });
  code = result.outputFiles[0].text;
  html = (await readFile(path.join(root, "tests/fixtures/autodarts/x01-match-modern.html"), "utf8"))
    .replace("<body>", '<body><div id="root"><nav class="navigation"><a href="/matches">Matches</a><a href="/statistics">Statistics</a></nav>')
    .replace("</body>", "</div></body>");
  browser = await chromium.launch({ headless: true, channel: "chromium" });
});
after(async () => browser?.close());

async function open() {
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 } });
  page.on("pageerror", (error) => console.log("LAZY-PAGE-ERROR", error.message));
  const state = { stored: new Map(), requests: [], fail: "", failFile: "", hold: null, writeFailure: false };
  await page.exposeFunction("qaRead", (key) => state.stored.get(key));
  await page.exposeFunction("qaWrite", (key, value) => {
    if (state.writeFailure && key.startsWith(THEME_ASSET_STORAGE_PREFIX)) throw new Error("quota");
    state.stored.set(key, value);
  });
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith("https://play.autodarts.com/")) return route.fulfill({ contentType: "text/html", body: html });
    if (!url.startsWith(prefix)) return route.abort();
    state.requests.push(url);
    if (state.hold) await state.hold;
    if (state.failFile && url.endsWith(state.failFile)) return route.abort();
    if (state.fail === "network") return route.abort();
    if (state.fail === "corrupt") return route.fulfill({ body: "wrong image" });
    const file = url.slice(prefix.length);
    assert.ok(Object.values(THEME_ASSET_CATALOG).some((entry) => entry.file === file));
    return route.fulfill({ body: await readFile(path.join(root, "src/assets/theme-presets", file)), headers: { "Access-Control-Allow-Origin": "*" } });
  });
  await page.addInitScript({ content: code + "\nwindow.LazyTest = LazyTest;" });
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", async () => {
      try { window.lazyRuntime = await LazyTest.initializeTampermonkeyRuntime({ windowRef: window, documentRef: document,
        gmGetValue: window.qaRead, gmSetValue: window.qaWrite,
        gmRequest: (request) => {
          const controller = new AbortController();
          fetch(request.url, { signal: controller.signal }).then(async (response) => request.onload({ status: response.status, response: await response.arrayBuffer() })).catch(request.onerror);
          return { abort: () => controller.abort() };
        },
      }); } catch (error) { window.initError = error.message; }
    });
  });
  await page.goto("https://play.autodarts.com/matches/lazy-assets");
  await page.waitForFunction(() => Boolean(window.lazyRuntime || window.initError));
  assert.equal(await page.evaluate(() => window.initError || ""), "");
  return { page, state };
}

async function apply(page, key, extras = false) {
  return page.evaluate(async ({ key, extras }) => {
    try { await window.lazyRuntime.saveConfig(LazyTest.createThemeGlobalTemplatePresetPatch(key, { includeSurround: extras })); return { ok: true }; }
    catch (error) { return { ok: false, message: error.message }; }
  }, { key, extras });
}

test("offline gallery has bundled previews; activation alone downloads and persists the selected original", async () => {
  const { page, state } = await open();
  try {
    state.fail = "network";
    await page.goto("https://play.autodarts.com/ad-xconfig");
    await page.waitForFunction(() => Boolean(window.lazyRuntime));
    await page.locator("[data-adxconfig-action='open-settings'][data-feature-key='theme-global-presets']").first().click();
    await page.locator(".ad-xconfig-theme-preset-card").first().waitFor();
    assert.equal(state.requests.length, 0);
    assert.equal(await page.locator(".ad-xconfig-theme-preset-wallpaper").evaluateAll((images) => images.every((image) => image.src.startsWith("data:image/"))), true);
    assert.equal(await page.locator(".ad-xconfig-theme-preset-wallpaper").first().evaluate(async (image) => { await image.decode(); return image.naturalWidth > 0; }), true);
    state.fail = "";
    assert.deepEqual(await apply(page, "cyberpunk"), { ok: true });
    assert.equal(state.requests.length, 1);
    assert.ok(state.requests[0].endsWith(THEME_ASSET_CATALOG.cyberpunk.file));
    assert.ok(state.stored.has(THEME_ASSET_STORAGE_PREFIX + THEME_ASSET_CATALOG.cyberpunk.sha256));
    const backup = await page.evaluate(async () => JSON.stringify(await window.lazyRuntime.createSettingsExport({ includeAssets: true })));
    assert.equal(backup.includes(THEME_ASSET_STORAGE_PREFIX), false, "library cache must stay separate from settings backups");
    state.fail = "network";
    await page.reload();
    await page.waitForFunction(() => Boolean(window.lazyRuntime));
    assert.equal(state.requests.length, 1);
    await page.goto("https://play.autodarts.com/matches/lazy-assets");
    await page.waitForFunction(() => window.lazyRuntime && LazyTest.resolveThemePresetAsset("cyberpunk"));
    assert.equal(state.requests.length, 1, "reload must not need the network for a stored image");
    assert.equal(state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey, "cyberpunk");
  } finally { await page.close(); }
});

test("failed downloads and writes keep settings and displayed wallpaper unchanged, then retry succeeds", async () => {
  const { page, state } = await open();
  try {
    assert.deepEqual(await apply(page, "cyberpunk"), { ok: true });
    await page.waitForSelector("#ad-ext-theme-global-background-style", { state: "attached" });
    await page.evaluate(() => { window.oldWallpaper = document.getElementById("ad-ext-theme-global-background-style").textContent; });
    const previous = structuredClone(state.stored.get(CONFIG_STORAGE_KEY));
    for (const failure of ["network", "corrupt", "quota"]) {
      state.fail = failure === "quota" ? "" : failure;
      state.writeFailure = failure === "quota";
      const result = await apply(page, "fire");
      assert.equal(result.ok, false, failure);
      assert.deepEqual(state.stored.get(CONFIG_STORAGE_KEY), previous, failure);
      assert.equal(await page.evaluate(() => document.getElementById("ad-ext-theme-global-background-style").textContent === window.oldWallpaper), true, failure);
    }
    state.fail = ""; state.writeFailure = false;
    assert.deepEqual(await apply(page, "fire"), { ok: true });
    assert.equal(state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey, "fire");
  } finally { await page.close(); }
});

test("pending activation leaves the browser responsive and changes nothing before verification", async () => {
  const { page, state } = await open();
  let release;
  try {
    const before = structuredClone(state.stored.get(CONFIG_STORAGE_KEY));
    state.hold = new Promise((resolve) => { release = resolve; });
    await page.evaluate(() => {
      window.framesWhileLoading = 0;
      const tick = () => { window.framesWhileLoading++; if (window.framesWhileLoading < 30) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      window.activation = window.lazyRuntime.saveConfig(LazyTest.createThemeGlobalTemplatePresetPatch("matrix"));
    });
    await page.waitForFunction(() => window.framesWhileLoading >= 5);
    assert.deepEqual(state.stored.get(CONFIG_STORAGE_KEY), before);
    release();
    await page.evaluate(() => window.activation);
    assert.equal(state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey, "matrix");
  } finally { release?.(); await page.close(); }
});

test("community activation requests only the current background and opt-in surround", async () => {
  const { page, state } = await open();
  try {
    const preset = await page.evaluate(() => LazyTest.COMMUNITY_PRESETS.find((entry) => entry.surroundAssetKey && entry.backgroundAssets.portrait && entry.backgroundAssets.cricket));
    assert.ok(preset);
    assert.deepEqual(await apply(page, preset.key), { ok: true });
    assert.deepEqual(state.requests, [prefix + THEME_ASSET_CATALOG[preset.backgroundAssetKey].file]);
    assert.deepEqual(await apply(page, preset.key, true), { ok: true });
    assert.equal(state.requests.length, 2);
    assert.equal(state.requests[1], prefix + THEME_ASSET_CATALOG[preset.surroundAssetKey].file);
    assert.equal(state.stored.get(CONFIG_STORAGE_KEY).features.boardSurround.enabled, true);
  } finally { await page.close(); }
});

test("the visible retry button retries the failed new preset and retains Undo", async () => {
  const { page, state } = await open();
  try {
    assert.deepEqual(await apply(page, "cyberpunk"), { ok: true });
    await page.goto("https://play.autodarts.com/ad-xconfig");
    await page.waitForFunction(() => Boolean(window.lazyRuntime));
    await page.locator("[data-adxconfig-action='open-settings'][data-feature-key='theme-global-presets']").first().click();
    state.fail = "network";
    const failedRequest = page.waitForRequest((request) => request.url() === prefix + THEME_ASSET_CATALOG.fire.file);
    await page.locator(".ad-xconfig-theme-preset-card[data-theme-preset-key='fire']").click();
    await failedRequest;
    await page.waitForFunction(() => document.querySelector(".ad-xconfig-notice")?.textContent.includes('Preset "Fire" konnte nicht angewendet werden.'));
    await page.locator("[data-adxconfig-action='retryThemeAssets']").waitFor();
    assert.equal(state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey, "cyberpunk");
    await page.waitForTimeout(3500);
    assert.equal(await page.locator("[data-adxconfig-action='retryThemeAssets']").count(), 1, "failed asset notice must remain actionable");
    state.fail = "";
    await page.locator("[data-adxconfig-action='retryThemeAssets']").click();
    await page.locator("[data-adxconfig-action='undoThemeGlobalPreset']").waitFor();
    await expect.poll(() => state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey).toBe("fire");
    assert.equal(state.requests.filter((url) => url.endsWith(THEME_ASSET_CATALOG.fire.file)).length, 2, JSON.stringify(state.requests));
    await page.locator("[data-adxconfig-action='undoThemeGlobalPreset']").waitFor();
    await page.locator("[data-adxconfig-action='undoThemeGlobalPreset']").click();
    await expect.poll(() => state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey).toBe("cyberpunk");
  } finally { await page.close(); }
});

test("orientation changes during activation are rechecked before committing the new design", async () => {
  const { page, state } = await open();
  let release;
  try {
    assert.deepEqual(await apply(page, "cyberpunk"), { ok: true });
    const previous = structuredClone(state.stored.get(CONFIG_STORAGE_KEY));
    const preset = await page.evaluate(() => LazyTest.COMMUNITY_PRESETS.find((entry) => entry.backgroundAssets.portrait && entry.backgroundAssets.game && entry.backgroundAssets.portrait !== entry.backgroundAssets.game));
    state.hold = new Promise((resolve) => { release = resolve; });
    state.failFile = THEME_ASSET_CATALOG[preset.backgroundAssets.portrait].file;
    const firstRequest = page.waitForRequest((request) => request.url() === prefix + THEME_ASSET_CATALOG[preset.backgroundAssets.game].file);
    await page.evaluate((key) => {
      window.activation = window.lazyRuntime.saveConfig(LazyTest.createThemeGlobalTemplatePresetPatch(key)).then(() => ({ ok: true }), (error) => ({ ok: false, message: error.message }));
    }, preset.key);
    await firstRequest;
    await page.setViewportSize({ width: 600, height: 1000 });
    release();
    const result = await page.evaluate(() => window.activation);
    assert.equal(result.ok, false);
    assert.deepEqual(state.stored.get(CONFIG_STORAGE_KEY), previous);
    assert.equal(await page.evaluate(() => document.getElementById("ad-ext-theme-global-background-style").textContent.includes(LazyTest.resolveThemePresetAsset("cyberpunk"))), true);
  } finally { release?.(); await page.close(); }
});

test("settings import preserves the current design on download failure and can retry the original import", async () => {
  const source = await open();
  const target = await open();
  try {
    assert.deepEqual(await apply(source.page, "fire"), { ok: true });
    const exported = await source.page.evaluate(() => window.lazyRuntime.createSettingsExport({ includeAssets: true }));
    assert.deepEqual(await apply(target.page, "cyberpunk"), { ok: true });
    const previous = structuredClone(target.state.stored.get(CONFIG_STORAGE_KEY));
    target.state.fail = "network";
    const result = await target.page.evaluate(async (exported) => {
      try { await window.lazyRuntime.importSettings(exported.payload, { mode: "replace" }); return { ok: true }; }
      catch (error) { return { ok: false, code: error.code }; }
    }, exported);
    assert.deepEqual(result, { ok: false, code: "THEME_ASSET_FAILED" });
    assert.deepEqual(target.state.stored.get(CONFIG_STORAGE_KEY), previous);
    target.state.fail = "";
    await target.page.evaluate(() => window.lazyRuntime.retryThemeAssets());
    assert.equal(target.state.stored.get(CONFIG_STORAGE_KEY).features.themes.globalBackground.backgroundAssetKey, "fire");
  } finally { await source.page.close(); await target.page.close(); }
});
