// Explicit, isolated extension QA: node --test e2e/tampermonkey-install.node.mjs
// Downloads the official Chrome-update package; never uses a personal browser profile.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { readZip } from "../scripts/import-community-designs.mjs";
import { THEME_ASSET_CATALOG } from "../src/shared/theme-asset-catalog.js";
import { THEME_ASSET_RELEASE_TAG } from "../src/shared/theme-asset-source.js";
import { THEME_ASSET_STORAGE_PREFIX } from "../src/shared/theme-asset-cache.js";

const officialCrx = "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=149.0.0.0&acceptformat=crx2,crx3&x=id%3Ddhdgffkkebhmkfjojejmpbldmpobfkfo%26uc";
const root = process.cwd();
const artifactRoot = path.join(root, "reports/presentation-release", `tampermonkey-${Date.now()}`);
const controlScript = `// ==UserScript==
// @name xconfig-TM-startup-control
// @namespace urn:xconfig:isolated-install-test
// @version 0.0.1
// @match https://play.autodarts.com/*
// @run-at document-end
// @grant GM_getValue
// @grant GM_setValue
// ==/UserScript==
const counter = GM_getValue("startup-control", 0) + 1;
GM_setValue("startup-control", counter);
document.documentElement.setAttribute("data-tm-startup-control", String(counter));
`;
async function until(read, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await read();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Condition was not reached within ${timeout}ms`);
}

test("official Tampermonkey installs and runs the generated xConfig candidate in a fresh browser profile", { timeout: 300000 }, async (testContext) => {
  await mkdir(artifactRoot, { recursive: true });
  const report = { stages: [], artifacts: artifactRoot };
  let context;
  let server;
  const browserErrors = [];
  const record = async (stage, details = {}) => {
    report.stages.push({ stage, ...details });
    console.log(JSON.stringify({ stage, ...details }));
    await writeFile(path.join(artifactRoot, "report.json"), JSON.stringify(report, null, 2));
  };
  try {
    const response = await fetch(officialCrx, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Official CRX endpoint returned HTTP ${response.status}`);
    const crx = Buffer.from(await response.arrayBuffer());
    assert.equal(crx.toString("ascii", 0, 4), "Cr24");
    assert.equal(crx.readUInt32LE(4), 3);
    await writeFile(path.join(artifactRoot, "tampermonkey.crx"), crx);
    const extension = path.join(artifactRoot, "extension");
    await mkdir(extension);
    for (const [name, bytes] of readZip(crx.subarray(12 + crx.readUInt32LE(8)))) {
      const file = path.resolve(extension, name);
      assert.ok(file.startsWith(extension + path.sep), `Unsafe archive path: ${name}`);
      if (name.endsWith("/")) { await mkdir(file, { recursive: true }); continue; }
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes);
    }
    const manifest = JSON.parse(await readFile(path.join(extension, "manifest.json"), "utf8"));
    await record("official-extension-downloaded", { source: officialCrx, redirect: response.url, version: manifest.version, manifestVersion: manifest.manifest_version, sha256: createHash("sha256").update(crx).digest("hex") });
    const profile = path.join(artifactRoot, "profile");
    const launchOptions = {
      channel: "chromium", headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      viewport: { width: 1400, height: 1000 },
    };
    context = await chromium.launchPersistentContext(profile, launchOptions);
    context.setDefaultTimeout(30000);
    context.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text().slice(0, 2000)); });
    let worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
    const extensionId = new URL(worker.url()).host;
    const extensionInfo = await worker.evaluate(() => ({ id: chrome.runtime.id, version: chrome.runtime.getManifest().version, userScriptsAvailable: Boolean(chrome.userScripts) }));
    await record("real-extension-service-worker", { browser: context.browser().version(), url: worker.url(), ...extensionInfo });
    const management = await context.newPage();
    await management.goto(`chrome://extensions/?id=${extensionId}`);
    await management.screenshot({ path: path.join(artifactRoot, "extension-settings.png"), fullPage: true });
    await management.locator("#devMode").click();
    const allowScripts = management.locator("#allow-user-scripts cr-toggle");
    await allowScripts.click();
    assert.equal(await allowScripts.evaluate((node) => node.checked), true);
    const reloadedWorker = context.waitForEvent("serviceworker");
    await worker.evaluate(() => chrome.runtime.reload()).catch(() => {});
    worker = await reloadedWorker;
    await record("real-userscripts-permission-enabled", { userScriptsAvailable: await worker.evaluate(() => Boolean(chrome.userScripts)) });
    const dashboard = await context.newPage();
    await dashboard.goto(`chrome-extension://${extensionId}/options.html`);
    await dashboard.waitForFunction(() => document.body.children.length > 0);
    const bundle = await readFile(path.join(root, "dist/autodarts-xconfig.user.js"));
    if (process.env.AD_EXPECTED_BUNDLE_SHA256) assert.equal(createHash("sha256").update(bundle).digest("hex"), process.env.AD_EXPECTED_BUNDLE_SHA256);
    await record("candidate-served-unchanged", { bytes: bundle.length, sha256: createHash("sha256").update(bundle).digest("hex") });
    server = createServer((request, response) => {
      const payload = request.url === "/autodarts-xconfig.user.js" ? bundle : request.url === "/startup-control.user.js" ? Buffer.from(controlScript) : null;
      if (!payload) { response.writeHead(404); response.end(); return; }
      response.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Content-Length": payload.length });
      response.end(payload);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const installUrl = `http://127.0.0.1:${server.address().port}/autodarts-xconfig.user.js`;
    const download = await context.newPage();
    await download.goto(installUrl).catch((error) => console.log("INSTALL-NAVIGATION", error.message));
    const installer = await until(() => context.pages().find((page) => page.url().includes(`://${extensionId}/ask.html`)));
    const installButton = installer.getByRole("button", { name: /^(Installieren|Install)$/ });
    await installButton.waitFor();
    await installer.screenshot({ path: path.join(artifactRoot, "real-install-confirmation.png"), fullPage: false });
    await record("real-install-confirmation-visible", { url: installer.url(), title: await installer.title() });
    await installButton.click();
    await until(() => installer.isClosed(), 60000);
    await record("real-install-confirmation-completed");
    const storedMetadata = await until(() => worker.evaluate(async () => {
      const rows = Object.entries(await chrome.storage.local.get(null)).filter(([key]) => key.includes("@meta#")).map(([, wrapper]) => {
        const script = wrapper.value;
        return { name: script.name, version: script.version, enabled: script.enabled, grant: script.grant };
      });
      return rows.length ? rows : null;
    }), 60000);
    assert.equal(storedMetadata.length, 1);
    assert.equal(storedMetadata[0].name, "autodarts-xconfig");
    assert.equal(storedMetadata[0].enabled, true);
    assert.deepEqual(storedMetadata[0].grant, ["GM_getValue", "GM_setValue", "GM_xmlhttpRequest", "GM.getValue", "GM.setValue"]);
    await record("real-extension-stored-userscript", { metadata: storedMetadata });
    const storedSource = await worker.evaluate(async () => {
      const wrapper = Object.entries(await chrome.storage.local.get(null)).find(([key]) => key.includes("@source#"))?.[1];
      if (typeof wrapper?.value !== "string") return { type: typeof wrapper?.value };
      const bytes = new TextEncoder().encode(wrapper.value);
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return { bytes: bytes.length, sha256: [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("") };
    });
    assert.equal(storedSource.sha256, createHash("sha256").update(bundle).digest("hex"));
    await record("real-installed-source-matches-candidate", storedSource);
    await dashboard.goto(`chrome-extension://${extensionId}/options.html#nav=dashboard`);
    await dashboard.reload();
    const originalFixture = await readFile(path.join(root, "tests/fixtures/autodarts/x01-match-modern.html"), "utf8");
    const fixture = originalFixture.replace("<body>", '<body><div id="root"><nav class="navigation"><a href="/matches">Matches</a><a href="/statistics">Statistics</a></nav>').replace("</body>", "</div></body>");
    await context.route("https://play.autodarts.com/**", (route) => route.fulfill({ contentType: "text/html", body: fixture }));
    const match = await context.newPage();
    match.on("pageerror", (error) => console.log("FIXTURE-PAGE-ERROR", error.message));
    await match.goto("https://play.autodarts.com/ad-xconfig");
    await match.locator("#ad-xconfig-panel-host").waitFor({ timeout: 60000 });
    await record("real-extension-injected-xconfig", { pageWorldApiVisible: await match.evaluate(() => Boolean(window.__adXConfig)) });
    await match.screenshot({ path: path.join(artifactRoot, "xconfig-injected.png"), fullPage: false });
    await match.locator("[data-adxconfig-action='open-settings'][data-feature-key='live-board-enhancement']").first().click();
    const intensity = match.locator("[data-setting-key='intensity'][data-setting-control='range']");
    await intensity.evaluate((node) => { node.value = "47"; node.dispatchEvent(new Event("change", { bubbles: true })); });
    await until(() => match.evaluate(() => Object.keys(localStorage).some((key) => localStorage.getItem(key)?.includes('"intensity":47'))));
    await match.reload();
    await match.locator("[data-adxconfig-action='open-settings'][data-feature-key='live-board-enhancement']").first().click({ timeout: 60000 });
    assert.equal(await match.locator("[data-setting-key='intensity'][data-setting-control='range']").inputValue(), "47");
    await record("installed-runtime-config-survives-reload", { intensity: 47 });
    // Real GM transport and promise-based storage; no network/storage replacements.
    const nativeAsset = THEME_ASSET_CATALOG.cyberpunk;
    const nativeUrl = `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/${THEME_ASSET_RELEASE_TAG}/src/assets/theme-presets/${nativeAsset.file}`;
    const nativeResponse = await fetch(nativeUrl, { signal: AbortSignal.timeout(30000) });
    assert.equal(nativeResponse.status, 200);
    assert.equal(createHash("sha256").update(Buffer.from(await nativeResponse.arrayBuffer())).digest("hex"), nativeAsset.sha256);
    await match.locator("[data-adxconfig-action='close-settings']").click();
    await match.locator("[data-adxconfig-action='open-settings'][data-feature-key='theme-global-presets']").first().click();
    await match.locator(".ad-xconfig-theme-preset-card[data-theme-preset-key='cyberpunk']").click();
    await match.locator("[data-adxconfig-action='undoThemeGlobalPreset']").waitFor({ timeout: 60000 });
    const cacheKey = THEME_ASSET_STORAGE_PREFIX + nativeAsset.sha256;
    const storedCache = await until(() => worker.evaluate(async (key) => {
      const storage = await chrome.storage.local.get(null);
      for (const [storageKey, wrapper] of Object.entries(storage)) {
        const serialized = JSON.stringify(wrapper);
        if (serialized.includes(key) && serialized.includes("data:image/jpeg;base64,")) return { storageKey, containsVerifiedImage: true };
      }
      return null;
    }, cacheKey));
    await record("real-GM-downloaded-and-persisted-image", { url: nativeUrl, sha256: nativeAsset.sha256, ...storedCache });
    // Prevent any further internet access while serving only the isolated host fixture.
    await context.route("https://raw.githubusercontent.com/**", (route) => route.abort());
    await context.setOffline(true);
    await match.goto("https://play.autodarts.com/matches/offline-cache");
    await match.waitForFunction(() => document.getElementById("ad-ext-theme-global-background-style")?.textContent.includes("data:image/jpeg;base64,"));
    await record("real-GM-cache-renders-after-offline-reload");
    await context.setOffline(false);
    await dashboard.reload();
    await dashboard.getByText("autodarts-xconfig", { exact: true }).waitFor();
    await dashboard.screenshot({ path: path.join(artifactRoot, "installed-userscript.png"), fullPage: false });
    await record("real-userscript-listed-installed");
    // A real, tiny userscript distinguishes extension-start failures from xConfig failures.
    // It uses Tampermonkey's own GM APIs, not test replacements.
    const controlDownload = await context.newPage();
    await controlDownload.goto(`http://127.0.0.1:${server.address().port}/startup-control.user.js`).catch(() => {});
    const controlInstaller = await until(() => context.pages().find((page) => page.url().includes(`://${extensionId}/ask.html`)));
    await controlInstaller.getByRole("button", { name: /^(Installieren|Install)$/ }).click();
    await until(() => controlInstaller.isClosed());
    await until(() => worker.evaluate(async () => Object.values(await chrome.storage.local.get(null)).some((wrapper) => wrapper?.value?.name === "xconfig-TM-startup-control")));
    await match.reload();
    await match.waitForFunction(() => document.documentElement.hasAttribute("data-tm-startup-control"));
    const controlBeforeRestart = Number(await match.locator("html").getAttribute("data-tm-startup-control"));
    await record("real-startup-control-before-restart", { counter: controlBeforeRestart });
    // Restart the actual browser and extension; keep only this test's isolated profile.
    for (const page of context.pages()) await page.close();
    await context.newPage();
    await context.close();
    context = await chromium.launchPersistentContext(profile, launchOptions);
    context.setDefaultTimeout(60000);
    const restartedWorker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
    const reopenedDashboard = await context.newPage();
    await reopenedDashboard.goto(`chrome-extension://${extensionId}/options.html#nav=dashboard`);
    await reopenedDashboard.getByText("autodarts-xconfig", { exact: true }).waitFor();
    await until(() => restartedWorker.evaluate(async () => (await chrome.userScripts.getScripts()).length > 0), 60000);
    await record("browser-restarted-with-installed-userscript");
    await context.route("https://play.autodarts.com/**", (route) => route.fulfill({ contentType: "text/html", body: fixture }));
    const restarted = await context.newPage();
    await restarted.goto("https://play.autodarts.com/ad-xconfig");
    await restarted.waitForFunction(() => document.documentElement.hasAttribute("data-tm-startup-control"), null, { timeout: 30000 }).catch(() => {});
    const coldStart = await restarted.evaluate(() => ({ controlCounter: document.documentElement.getAttribute("data-tm-startup-control"), xconfigUiPresent: Boolean(document.getElementById("ad-xconfig-panel-host")) }));
    await record("real-browser-restart-control-result", coldStart);
    await testContext.test("installed runtime and GM storage survive a full browser restart", async (coldTest) => {
      if (!coldStart.controlCounter) {
        const reason = "Environment control failed: the real Tampermonkey control userscript also did not execute after browser restart; xConfig cold-start remains unverified.";
        await record("cold-start-verification-blocked", { reason });
        coldTest.skip(reason);
        return;
      }
      assert.ok(Number(coldStart.controlCounter) > controlBeforeRestart, "The real Tampermonkey GM counter must survive browser restart.");
      await restarted.locator("[data-adxconfig-action='open-settings'][data-feature-key='live-board-enhancement']").first().click();
      assert.equal(await restarted.locator("[data-setting-key='intensity'][data-setting-control='range']").inputValue(), "47");
      await restarted.screenshot({ path: path.join(artifactRoot, "runtime-after-browser-restart.png"), fullPage: false });
      await record("real-installed-runtime-and-config-survive-browser-restart", { intensity: 47 });
    });
  } catch (error) {
    await record("failed", { message: error.stack || error.message, browserErrors });
    if (context) {
      for (const [index, page] of context.pages().entries()) {
        await page.screenshot({ path: path.join(artifactRoot, `failure-${index}.png`), fullPage: true }).catch(() => {});
        await writeFile(path.join(artifactRoot, `failure-${index}.html`), await page.content().catch(() => "")).catch(() => {});
      }
    }
    throw error;
  } finally {
    await context?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
});
