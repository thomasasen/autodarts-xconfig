// Explicit browser QA: node --test e2e/presentation-quality.node.mjs
// Uses a fresh headless profile and local structural fixtures, never a user's session.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { chromium, firefox } from "playwright";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";
import { THEME_PRESET_ASSET_FILES } from "../src/shared/theme-preset-assets.manifest.js";
import { THEME_ASSET_RELEASE_TAG } from "../src/shared/theme-asset-source.js";

const root = process.cwd();
const browserEngine = process.env.AD_BROWSER_ENGINE === "firefox" ? firefox : chromium;
const executablePath = process.env.AD_BROWSER_EXECUTABLE || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
let browser;
let code;
const artifacts = path.join(root, "reports/presentation-release/screenshots", process.env.AD_BROWSER_ENGINE || "chrome");
const nativeBoardSvg = readFileSync(path.join(root, "tests/fixtures/autodarts/dartboard-modern.html"), "utf8").match(/<svg\b[\s\S]*?<\/svg>/)[0];

before(async () => {
  const result = await build({ stdin: { contents: `
    export { createScreenProfileController } from './src/features/themes/game-layout/screen-profiles.js';
    export { mountThemeGameLayout } from './src/features/themes/game-layout/index.js';
    export { mountThemeGlobalBackground } from './src/features/themes/global-background/index.js';
    export { mountThemeGlobalTypography } from './src/features/themes/global-typography/index.js';
    export { mountBotBoardStyle } from './src/features/bot-board-style/index.js';
    export { mountDartMarkerReplacer } from './src/features/dart-marker-replacer/index.js';
    export { mountTvBoardZoom } from './src/features/tv-board-zoom/index.js';
    export { mountCricketLayout } from './src/features/cricket-layout/index.js';
    export * as x01Rules from './src/domain/x01-rules.js';
    export { THEME_GLOBAL_TEMPLATE_PRESETS, createThemeGlobalTemplatePresetPatch } from './src/shared/theme-global-template-presets.js';
    export { BOARD_STYLE_DESIGNS } from './src/shared/board-style-assets.manifest.js';
    export { mountBoardSurround } from './src/features/board-surround/index.js';
    export { mountLiveBoardEnhancement } from './src/features/live-board-enhancement/index.js';
    export { createPlayerGlowController, buildPlayerGlowStyle } from './src/features/themes/global-typography/player-glow.js';
    export { resolveBoardRenderSurface } from './src/shared/dartboard-svg.js';
    export { buildThemeVisualSettingsCss } from './src/features/themes/shared/theme-visuals.js';
    export { buildThemeGlobalTypographyStyleText } from './src/features/themes/global-typography/style.js';
    export { COMMUNITY_PRESETS, COMMUNITY_SURROUNDS } from './src/shared/community-designs.js';
    export { resolveThemePresetAsset } from '#theme-preset-assets';
    export { configureThemePresetAssets, ensureThemePresetAsset } from '#theme-preset-assets';
  `, resolveDir: root }, bundle: true, format: "iife", globalName: "ADXQuality", platform: "browser", target: ["chrome111", "firefox121"], loader: USERSCRIPT_ASSET_LOADERS, write: false, logLevel: "silent" });
  code = result.outputFiles[0].text;
  browser = await browserEngine.launch({ headless: true, ...(browserEngine === chromium && executablePath ? { executablePath } : {}) });
  console.log(`Isolated browser: ${browser.version()}`);
  await mkdir(artifacts, { recursive: true });
});
after(async () => browser?.close());

const nativeCss = `
*{box-sizing:border-box}html,body{margin:0;background:#10151e;color:white;font:16px Arial}main{padding:16px}
.match-root{display:flex;gap:16px;width:100%;min-width:0;align-items:start}
.player-column{display:flex;flex-direction:column;width:240px;gap:8px}.player-item{width:100%;position:relative}
.overflow-clip{overflow:clip}.player-card{position:relative;isolation:isolate;min-height:130px;background:#252b38;padding:12px;border-radius:12px}
.font-display{font-size:24px}.font-number{font-size:32px}.font-number.overflow-hidden{overflow:hidden;font-size:48px}
.stage{display:grid;flex:1;min-width:0;gap:8px}.board-slot{width:100%;min-width:0}.board-frame{position:relative;width:100%;aspect-ratio:1;overflow:hidden}
[role=img][aria-label=Dartboard]{position:relative;width:100%;height:100%;overflow:hidden;border-radius:50%}
[aria-label=Dartboard]>svg,[aria-label=Dartboard]>img{display:block;width:100%;height:100%}
.bg-surface-surface{display:flex}.bg-surface-surface>div{flex:1}.turn-rows{display:flex}.controls{display:flex;gap:8px}button{font-size:18px}
.matrix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.matrix>div{min-height:36px}
`;
function player(index, active = false) {
  return `<div class="player-item"><div class="rounded"><div class="player-card overflow-clip ${active ? "bg-raspberry-slush-diagonal" : "bg-black-80"}" data-player="${index}">
    <div class="checkout-rail"><span class="text-checkout-suggestion">D18</span></div>
    <div class="body"><div class="content"><div class="name-region"><div class="name-container"><div class="name-row"><div class="nameplate"><span class="font-display">PLAYER ${index + 1}</span></div></div></div></div>
    <div class="score-region"><strong class="font-number overflow-hidden">${501 - index * 40}</strong><div>0</div></div>
    <div class="average">Leg 50 / Match 49</div><div class="last-score">60<div><svg><path d="M0 0"/></svg></div></div></div></div></div></div></div>`;
}
function fixture({ cricket = false, live = false, nested = false, realBoard = false } = {}) {
  const headers = `<div></div><div class="bg-raspberry-slush-diagonal"><span class="font-display">PLAYER 1</span><strong class="font-number">120</strong><div>MPR: 2.6</div></div><div><span class="font-display">PLAYER 2</span><strong class="font-number">100</strong><div>MPR: 2.1</div></div>`;
  const rows = [20, 19, 18, 17, 16, 15, "B"].map((n) => `<div>${n}</div><div>|</div><div>X</div>`).join("");
  const board = live ? `<img alt="Board camera" src="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#ccc"/><path d="M0 0L400 400M400 0L0 400" stroke="#222" stroke-width="12"/></svg>')}">` : realBoard ? nativeBoardSvg : `<svg viewBox="0 0 1000 1000"><g><circle cx="500" cy="500" r="490" fill="#274a3a"/>${Array.from({ length: 20 }, (_, i) => `<text x="${500 + Math.cos(i) * 450}" y="${500 + Math.sin(i) * 450}">${i + 1}</text>`).join("")}<circle cx="500" cy="500" r="10" fill="red"/></g></svg>`;
  return `<style>${nativeCss}</style><main><div class="flex-wrap"><div class="rounded-full">${cricket ? "Cricket" : "501"}</div><div class="rounded-full">First to 1 Leg</div>${cricket ? "" : '<div class="rounded-full">SI-DO</div>'}</div>
    <div class="match-root">${cricket ? `<section class="table-panel"><div class="grid h-full matrix">${headers}${rows}</div></section>` : `<div class="player-column">${nested ? '<div class="extra-wrapper">' : ""}${player(0, true)}${player(1)}${nested ? "</div>" : ""}</div>`}
    <div class="stage"><div class="turn-slot"><div class="bg-surface-surface"><div class="turn-rows"><div class="font-number">T20</div><div class="font-number">20</div><div class="font-number">D18</div></div><div class="font-number">116</div></div></div>
    <div class="board-slot"><div class="board-frame"><div role="img" aria-label="Dartboard">${board}</div></div></div><div class="controls"><button>Undo</button><button>Next</button></div></div>
    ${cricket ? "" : `<div class="player-column">${player(2)}</div>`}</div></main>`;
}
async function open(options = {}, viewport = { width: 1536, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.route("**/*", (route) => {
    const url = route.request().url();
    const prefix = `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/${THEME_ASSET_RELEASE_TAG}/src/assets/theme-presets/`;
    const file = url.startsWith(prefix) ? url.slice(prefix.length) : "";
    if (Object.values(THEME_PRESET_ASSET_FILES).includes(file)) return route.fulfill({ body: readFileSync(path.join(root, "src/assets/theme-presets", file)) });
    return url.startsWith("https://xconfig.test/") ? route.fulfill({ contentType: "text/html", body: fixture(options) }) : route.abort();
  });
  await page.goto("https://xconfig.test/matches/qa");
  await page.addScriptTag({ content: code });
  await page.evaluate(() => {
    window.settings = {};
    window.renderCalls = 0;
    const images = new Map();
    ADXQuality.configureThemePresetAssets({ gmGetValue: (key) => images.get(key), gmSetValue: (key, value) => images.set(key, value),
      gmRequest: (request) => { fetch(request.url).then(async (response) => request.onload({ status: response.status, response: await response.arrayBuffer() })).catch(request.onerror); } });
    window.refreshes = new Set();
    const observers = new Map();
    const listeners = new Map();
    window.context = { documentRef: document, windowRef: window,
      config: { getFeatureConfig: (key) => window.settings[key] || {} },
      gameState: { getSnapshot: () => ({ variant: "X01" }), subscribe: (fn) => { window.refreshes.add(fn); return () => window.refreshes.delete(fn); } },
      domGuards: { ensureStyle: (id, text) => { window.renderCalls++; let style = document.getElementById(id); if (!style) { style = document.createElement("style"); style.id = id; document.head.append(style); } if (style.textContent !== text) style.textContent = text; return style; }, removeNodeById: (id) => document.getElementById(id)?.remove() },
      domain: { x01Rules: ADXQuality.x01Rules },
      turnLifecycle: { ensureCurrent: () => ({ phase: "ready", generation: 0 }), register: () => () => {} },
      registries: { observers: { registerMutationObserver({ key, target, callback, observeOptions }) { const observer = new MutationObserver(callback); observer.observe(target, observeOptions); observers.set(key, observer); return observer; }, disconnect(key) { observers.get(key)?.disconnect(); observers.delete(key); } },
        listeners: { register(entry) { if (!entry.target) return; entry.target.addEventListener(entry.type, entry.handler); listeners.set(entry.key, entry); }, remove(key) { const entry = listeners.get(key); entry?.target.removeEventListener(entry.type, entry.handler); listeners.delete(key); } } },
      helpers: { createRafScheduler: (fn) => { let id = null; return { schedule() { if (id === null) id = requestAnimationFrame(() => { id = null; fn(); }); }, cancel() { if (id !== null) cancelAnimationFrame(id); id = null; } }; } },
    };
    window.profiles = ADXQuality.createScreenProfileController(window.context);
  });
  return page;
}
const rects = () => {
  const rect = (node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
  return { root: rect(document.querySelector(".match-root")), board: rect(document.querySelector(".stage")), players: [...document.querySelectorAll(".player-item")].map(rect) };
};

async function mountNativeCombination(page, presetKey = "cyberpunk", screenProfile = "desktop") {
  await page.evaluate(async ({ presetKey, screenProfile }) => {
    const patch = ADXQuality.createThemeGlobalTemplatePresetPatch(presetKey);
    Object.assign(window.settings, {
      "themes.globalBackground": patch.features.themes.globalBackground,
      "themes.globalTypography": { ...patch.features.themes.globalTypography, glowMode: "steady", glowIntensity: 50 },
      "themes.gameLayout": { enabled: true, screenProfile, boardShare: 55, textScale: 100 },
      boardSurround: { enabled: true, design: ADXQuality.COMMUNITY_SURROUNDS[0].key, sizePercent: 143 },
      botBoardStyle: { enabled: true, scope: "all-match-boards", design: "target-tor" },
      dartMarkerReplacer: { enabled: true, design: "autodarts", animateDarts: false, hideOriginalMarkers: true, enableShadow: false },
    });
    await Promise.all([window.settings["themes.globalBackground"].backgroundAssetKey, ADXQuality.COMMUNITY_SURROUNDS[0].assetKey].filter(Boolean).map(ADXQuality.ensureThemePresetAsset));
    const nativeSvg = document.querySelector('[aria-label="Dartboard"]>svg');
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hit.id = "qa-native-hit";
    for (const [key, value] of Object.entries({ cx: "500", cy: "500", r: "5", filter: "url(#shadow-2dp)" })) hit.setAttribute(key, value);
    nativeSvg.append(hit);
    window.nativeBefore = { svg: nativeSvg, group: nativeSvg.querySelector("g"), viewBox: nativeSvg.getAttribute("viewBox"), transform: nativeSvg.querySelector("g").getAttribute("transform") };
    window.stops = [ADXQuality.mountThemeGlobalBackground, ADXQuality.mountThemeGlobalTypography, ADXQuality.mountThemeGameLayout, ADXQuality.mountBoardSurround, ADXQuality.mountBotBoardStyle, ADXQuality.mountDartMarkerReplacer].map((mount) => mount(window.context));
  }, { presetKey, screenProfile });
  await page.waitForFunction(() => document.querySelector(".ad-ext-dart-image") && document.querySelector("#ad-ext-bot-board-style-image") && document.querySelector("#ad-xconfig-board-surround"));
}

const nativeCombinationResult = (onlyAlignment = false) => {
  const hit = document.getElementById("qa-native-hit");
  const tip = new DOMPoint(Number(hit.getAttribute("cx")), Number(hit.getAttribute("cy"))).matrixTransform(hit.getScreenCTM());
  const dart = document.querySelector(".ad-ext-dart-rotate-group");
  const rotation = dart.getAttribute("transform").match(/-?[\d.]+/g).map(Number);
  const drawn = new DOMPoint(rotation[1], rotation[2]).matrixTransform(dart.getScreenCTM());
  const tipError = Math.hypot(tip.x - drawn.x, tip.y - drawn.y);
  if (onlyAlignment) return tipError < 1;
  const before = window.nativeBefore;
  const score = document.querySelector(".score-region>strong");
  const background = getComputedStyle(document.body).backgroundImage;
  return { tipError, geometry: { native: { x: tip.x, y: tip.y }, drawn: { x: drawn.x, y: drawn.y } }, svgSame: document.querySelector('[aria-label="Dartboard"]>svg') === before.svg,
    viewBox: before.svg.getAttribute("viewBox"), groupTransform: before.group.getAttribute("transform"), previousViewBox: before.viewBox, previousTransform: before.transform,
    scoreVisible: score.getBoundingClientRect().width > 0 && score.getBoundingClientRect().height > 0, scoreColor: getComputedStyle(score).color,
    localBackground: /data:image\//.test(background), glow: Boolean(document.querySelector(".ad-xconfig-player-glow")),
    boardImage: document.querySelector("#ad-ext-bot-board-style-image")?.getAttribute("href"), surroundImage: document.querySelector("#ad-xconfig-board-surround")?.src };
};

test("all existing xConfig templates combine with profiles, surround, glow, board artwork and dart images", async () => {
  const page = await open({ realBoard: true });
  try {
    await mountNativeCombination(page);
    const presets = await page.evaluate(() => ADXQuality.THEME_GLOBAL_TEMPLATE_PRESETS.filter((preset) => !preset.source).map((preset) => ({ key: preset.key, scoreColor: preset.scoreColor, wallpaper: Boolean(preset.backgroundAssetKey) })));
    for (const preset of presets) {
      for (const screenProfile of ["desktop", "tv", "portrait"]) {
        await page.evaluate(async ({ key, screenProfile }) => {
          const patch = ADXQuality.createThemeGlobalTemplatePresetPatch(key);
          if (patch.features.themes.globalBackground.backgroundAssetKey) await ADXQuality.ensureThemePresetAsset(patch.features.themes.globalBackground.backgroundAssetKey);
          window.settings["themes.globalBackground"] = patch.features.themes.globalBackground;
          window.settings["themes.globalTypography"] = { ...patch.features.themes.globalTypography, glowMode: "steady", glowIntensity: 50 };
          window.settings["themes.gameLayout"].screenProfile = screenProfile;
          window.refreshes.forEach((refresh) => refresh());
        }, { key: preset.key, screenProfile });
        await page.waitForFunction((profile) => document.querySelector(".match-root").getAttribute("data-adx-screen-profile") === profile, screenProfile);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.waitForFunction(nativeCombinationResult, true, { timeout: 3000 }).catch(async (error) => {
          const result = await page.evaluate(nativeCombinationResult);
          console.log(JSON.stringify({ preset: preset.key, screenProfile, tipError: result.tipError, geometry: result.geometry }));
          throw error;
        });
        const result = await page.evaluate(nativeCombinationResult);
        const context = `${preset.key}/${screenProfile}: ${JSON.stringify(result, (key, value) => key.endsWith("Image") ? String(value).slice(0, 30) : value)}`;
        assert.ok(result.tipError < 1, context);
        assert.ok(result.svgSame && result.scoreVisible && result.glow, context);
        assert.equal(result.localBackground, preset.wallpaper, context);
        assert.equal(result.viewBox, result.previousViewBox, context);
        assert.equal(result.groupTransform, result.previousTransform, context);
        assert.match(result.boardImage, /^data:image\//, context);
        assert.match(result.surroundImage, /^data:image\//, context);
        const rgb = preset.scoreColor.match(/\w\w/g).map((value) => parseInt(value, 16)).join(", ");
        assert.equal(result.scoreColor, `rgb(${rgb})`, context);
      }
    }
    console.log(`Existing template combinations: ${presets.length} templates × 3 profiles`);
    await page.waitForTimeout(300);
    const renders = await page.evaluate(() => window.renderCalls);
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate((before) => window.renderCalls - before <= 4, renders), "unchanged presentation must settle without continuous observer rerenders");
    await page.evaluate(() => window.stops.reverse().forEach((stop) => stop()));
    assert.equal(await page.locator("[data-adx-decoration],.ad-ext-dart-image,#ad-ext-bot-board-style-image,[data-adx-screen-profile]").count(), 0);
  } finally { await page.close(); }
});

test("every existing board artwork retains native geometry and dart alignment with a surround", async () => {
  const page = await open({ realBoard: true });
  try {
    await mountNativeCombination(page);
    const designs = await page.evaluate(() => ADXQuality.BOARD_STYLE_DESIGNS.map((entry) => entry.value));
    for (const design of designs) {
      await page.evaluate((design) => { window.settings.botBoardStyle.design = design; window.refreshes.forEach((refresh) => refresh()); }, design);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const result = await page.evaluate(nativeCombinationResult);
      assert.ok(result.tipError < 1 && result.svgSame, `${design}: ${result.tipError}`);
      assert.equal(result.groupTransform, result.previousTransform, design);
      const source = await page.locator("#ad-ext-bot-board-style-image").getAttribute("href");
      assert.ok(await page.evaluate(async (src) => { const image = new Image(); image.src = src; await image.decode(); return image.naturalWidth > 0; }, source), design);
    }
    console.log(`Existing board artwork combinations: ${designs.length}`);
    await page.screenshot({ path: path.join(artifacts, "native-design-combination.png"), fullPage: true });
  } finally { await page.close(); }
});

for (const scenario of [
  { preset: "cyberpunk", profile: "desktop", width: 1536, height: 900 },
  { preset: "broadcast", profile: "tv", width: 1920, height: 1080 },
  { preset: "spider-man", profile: "portrait", width: 400, height: 700 },
]) {
  test(`native ${scenario.preset}/${scenario.profile} survives real zoom, state changes, resize and teardown`, async () => {
    const page = await open({ realBoard: true }, { width: scenario.width, height: scenario.height });
    try {
      await mountNativeCombination(page, scenario.preset, scenario.profile);
      await page.evaluate(() => {
        window.originalDart = document.querySelector(".ad-ext-dart-image");
        window.settings["themes.globalTypography"].remainingScoreSize = "large";
        document.querySelector(".score-region>strong").textContent = "40";
        document.querySelector(".text-checkout-suggestion").textContent = "D20";
        const snapshot = { variant: "X01", variantNormalized: "x01", activeScore: 40, activePlayerIndex: 0, outMode: "Double Out", match: { variant: "X01", player: 0, players: [{ id: "qa-player", name: "PLAYER 1", score: 40 }], turns: [] } };
        Object.assign(window.context.gameState, {
          isX01Variant: () => true, getActiveScore: () => 40, getOutMode: () => "Double Out", getActiveThrows: () => [],
          getActiveTurn: () => ({ id: "qa-turn", playerId: "qa-player", throws: [] }), getSnapshot: () => snapshot,
        });
        window.settings.tvBoardZoom = { enabled: true, zoomLevel: 1.75, zoomSpeed: "schnell", checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", t20SetupZoomEnabled: false };
        window.stops.push(ADXQuality.mountTvBoardZoom(window.context));
        window.refreshes.forEach((refresh) => refresh());
      });
      await page.waitForFunction(() => document.querySelector(".ad-ext-tv-board-zoom"));
      await page.waitForTimeout(250);
      assert.ok((await page.evaluate(nativeCombinationResult)).tipError < 1, "zoomed dart tip must follow native hit");
      await page.evaluate(() => { window.settings["themes.gameLayout"].boardShare = 70; window.refreshes.forEach((refresh) => refresh()); });
      await page.waitForTimeout(300);
      assert.ok((await page.evaluate(nativeCombinationResult)).tipError < 1, "board share change must reposition existing dart");
      await page.evaluate(() => { const active = document.querySelector(".bg-raspberry-slush-diagonal"); active.classList.add("ad-ext-x01-bust-active-player-highlight"); });
      await page.waitForFunction(() => !document.querySelector(".ad-xconfig-player-glow"));
      await page.evaluate(() => { const active = document.querySelector(".bg-raspberry-slush-diagonal"); active.classList.remove("ad-ext-x01-bust-active-player-highlight"); active.setAttribute("data-winner", "true"); });
      assert.equal(await page.locator(".ad-xconfig-player-glow").count(), 0);
      await page.evaluate(() => {
        const oldActive = document.querySelector(".bg-raspberry-slush-diagonal"); oldActive.removeAttribute("data-winner"); oldActive.classList.remove("bg-raspberry-slush-diagonal");
        document.querySelectorAll(".player-card")[1].classList.add("bg-raspberry-slush-diagonal");
        window.settings.boardSurround.enabled = false; window.refreshes.forEach((refresh) => refresh());
      });
      await page.waitForFunction(() => document.querySelectorAll(".ad-xconfig-player-glow").length === 1 && !document.getElementById("ad-xconfig-board-surround"));
      await page.waitForTimeout(300);
      assert.ok((await page.evaluate(nativeCombinationResult)).tipError < 1, "surround removal must reposition existing dart");
      assert.equal(await page.evaluate(() => document.querySelector(".ad-ext-dart-image") === window.originalDart), true, "existing dart must not be recreated");
      await page.evaluate(() => window.stops.reverse().forEach((stop) => stop()));
      assert.equal(await page.locator("[data-adx-decoration],.ad-ext-dart-image,#ad-ext-bot-board-style-image,.ad-ext-tv-board-zoom,[data-adx-screen-profile]").count(), 0);
    } finally { await page.close(); }
  });
}

test("existing templates preserve Cricket cells and active header glow under the shared layout", async () => {
  const page = await open({ cricket: true, realBoard: true });
  try {
    await mountNativeCombination(page);
    await page.evaluate(() => {
      window.settings.cricketLayout = { enabled: true };
      window.stops.push(ADXQuality.mountCricketLayout(window.context));
      const cell = document.querySelector(".matrix").children[4];
      cell.id = "qa-colored-target";
      cell.style.backgroundColor = "rgb(12, 160, 70)";
    });
    for (const key of ["cyberpunk", "broadcast", "spider-man"]) {
      for (const profile of ["desktop", "portrait"]) {
        await page.evaluate(({ key, profile }) => {
          const patch = ADXQuality.createThemeGlobalTemplatePresetPatch(key);
          window.settings["themes.globalBackground"] = patch.features.themes.globalBackground;
          window.settings["themes.globalTypography"] = { ...patch.features.themes.globalTypography, glowMode: "steady", glowIntensity: 50 };
          Object.assign(window.settings["themes.gameLayout"], { screenProfile: profile, showAverages: false });
          window.refreshes.forEach((refresh) => refresh());
        }, { key, profile });
        await page.waitForFunction((profile) => document.querySelector(".match-root").getAttribute("data-adx-screen-profile") === profile, profile);
        const result = await page.locator(".matrix").evaluate((grid) => ({ cells: grid.children.length, text: grid.textContent,
          glowInHeader: Boolean(grid.children[1].querySelector(".ad-xconfig-player-glow")),
          targetColor: getComputedStyle(document.getElementById("qa-colored-target")).backgroundColor,
          scoresVisible: [...grid.querySelectorAll("strong")].every((node) => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0),
          nativeCellGlow: Boolean(document.getElementById("qa-colored-target").querySelector(".ad-xconfig-player-glow")) }));
        assert.equal(result.cells, 24, `${key}/${profile}`);
        assert.ok(result.text.includes("120") && result.text.includes("100") && result.scoresVisible && result.glowInHeader, `${key}/${profile}: ${JSON.stringify(result)}`);
        assert.equal(result.targetColor, "rgb(12, 160, 70)");
        assert.equal(result.nativeCellGlow, false);
      }
    }
    await page.evaluate(() => window.stops.reverse().forEach((stop) => stop()));
    assert.equal(await page.locator("[data-adx-decoration],[data-ad-cricket-layout]").count(), 0);
  } finally { await page.close(); }
});

test("existing explicit score sizes still obey the screen text scale and TV profile", async () => {
  const page = await open();
  try {
    for (const remainingScoreSize of ["auto", "small", "standard", "large", "very-large"]) {
      const sizes = await page.evaluate(async (remainingScoreSize) => {
        const style = document.getElementById("qa-typography") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "qa-typography" }));
        style.textContent = ADXQuality.buildThemeGlobalTypographyStyleText({ fontPreset: "system", remainingScoreSize });
        const read = async (screenProfile, textScale) => {
          window.profiles.update({ screenProfile, textScale });
          await new Promise(requestAnimationFrame);
          return parseFloat(getComputedStyle(document.querySelector(".score-region>strong")).fontSize);
        };
        return { base: await read("desktop", 100), enlarged: await read("desktop", 150), tv: await read("tv", 100) };
      }, remainingScoreSize);
      assert.ok(Math.abs(sizes.enlarged / sizes.base - 1.5) < .03, `${remainingScoreSize}: ${JSON.stringify(sizes)}`);
      assert.ok(Math.abs(sizes.tv / sizes.base - 1.25) < .03, `${remainingScoreSize}: ${JSON.stringify(sizes)}`);
    }
  } finally { await page.close(); }
});

test("real CSS grid keeps desktop and portrait players disjoint from the board", async () => {
  const page = await open();
  try {
    for (const profile of ["desktop", "tv", "portrait"]) {
      await page.evaluate((screenProfile) => window.profiles.update({ screenProfile, boardShare: 55 }), profile);
      const geometry = await page.evaluate(rects);
      const scores = await page.locator(".score-region>strong").evaluateAll((nodes) => nodes.map((node) => { const rect = node.getBoundingClientRect(); return { width: rect.width, height: rect.height, text: node.textContent, fontSize: parseFloat(getComputedStyle(node).fontSize) }; }));
      assert.ok(scores.every((score) => score.width > 0 && score.height > 0 && score.fontSize > 0 && /^\d+$/.test(score.text)), JSON.stringify(scores));
      assert.ok(geometry.players.every((p) => p.width > 100 && p.height > 0));
      if (profile === "portrait") assert.ok(geometry.board.y >= Math.max(...geometry.players.map((p) => p.bottom)), JSON.stringify(geometry));
      else assert.ok(geometry.players.every((p) => p.right <= geometry.board.x + 1), JSON.stringify(geometry));
      await page.screenshot({ path: path.join(artifacts, `${profile}.png`), fullPage: true });
    }
  } finally { await page.close(); }
});

test("nested native player wrappers cannot collapse multiple player items into one row", async () => {
  const page = await open({ nested: true });
  try {
    const before = await page.evaluate(rects);
    await page.evaluate(() => window.profiles.update({ screenProfile: "desktop" }));
    const geometry = await page.evaluate(rects);
    assert.deepEqual(geometry, before, "ambiguous nested groups retain native placement");
    assert.ok(geometry.players[1].y >= geometry.players[0].bottom, JSON.stringify(geometry));
    assert.equal(await page.locator(".match-root").getAttribute("data-adx-screen-profile"), null);
  } finally { await page.close(); }
});

test("automatic profiles follow real viewport resize and keep controls reachable in small windows", async () => {
  const page = await open({}, { width: 400, height: 700 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.evaluate(() => {
      window.settings["themes.gameLayout"] = { enabled: true, screenProfile: "auto", boardShare: 55, textScale: 100 };
      window.stopLayout = ADXQuality.mountThemeGameLayout(window.context);
      document.querySelector(".controls button:last-child").onclick = () => { window.controlUsed = true; };
    });
    await page.waitForFunction(() => document.querySelector(".match-root").getAttribute("data-adx-screen-profile") === "portrait");
    assert.equal(await page.locator(".match-root").evaluate((node) => node.scrollWidth <= node.clientWidth + 1), true);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    assert.equal(await page.evaluate(() => window.controlUsed), true);
    await page.setViewportSize({ width: 1536, height: 900 });
    await page.waitForFunction(() => document.querySelector(".match-root").getAttribute("data-adx-screen-profile") === "desktop");
    await page.setViewportSize({ width: 800, height: 1000 });
    await page.waitForFunction(() => document.querySelector(".match-root").getAttribute("data-adx-screen-profile") === "portrait");
    await page.evaluate(() => window.stopLayout());
    assert.equal(await page.locator("[data-adx-screen-profile],#ad-xconfig-screen-profile-style").count(), 0);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test("Cricket columns and scores remain readable in desktop and portrait", async () => {
  const page = await open({ cricket: true });
  try {
    for (const profile of ["desktop", "portrait"]) {
      await page.evaluate((screenProfile) => window.profiles.update({ screenProfile, showAverages: false }), profile);
      const result = await page.evaluate(() => ({ profile: document.querySelector(".match-root").getAttribute("data-adx-screen-profile"), cells: document.querySelector(".matrix").children.length, text: document.querySelector(".matrix").textContent, hiddenMpr: [...document.querySelectorAll('[data-adx-stat="average"]')].every((node) => getComputedStyle(node).display === "none") }));
      assert.equal(result.profile, profile);
      assert.equal(result.cells, 24);
      assert.ok(result.text.includes("120"));
      assert.equal(result.hiddenMpr, true);
    }
  } finally { await page.close(); }
});

test("surround fits its frame at every offered size and stays still during zoom", async () => {
  const page = await open();
  try {
    for (const sizePercent of [110, 143, 170]) {
      await page.evaluate((sizePercent) => { window.stopSurround?.(); window.settings.boardSurround = { enabled: true, design: ADXQuality.COMMUNITY_SURROUNDS[0].key, sizePercent }; window.stopSurround = ADXQuality.mountBoardSurround(window.context); }, sizePercent);
      await page.waitForFunction(() => document.getElementById("ad-xconfig-board-surround")?.offsetWidth > 0);
      const result = await page.evaluate(() => {
        const layer = document.getElementById("ad-xconfig-board-surround"); const r = layer.getBoundingClientRect(); const f = layer.parentElement.getBoundingClientRect();
        const board = document.querySelector('[aria-label="Dartboard"]');
        const interaction = board.parentElement;
        const aligned = Math.abs(interaction.offsetWidth - board.offsetWidth) <= 1 && Math.abs(interaction.offsetHeight - board.offsetHeight) <= 1 && board.offsetLeft === 0 && board.offsetTop === 0;
        board.style.transform = "scale(1.75)";
        const z = layer.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, frame: { left: f.left, right: f.right, top: f.top, bottom: f.bottom }, stationary: r.x === z.x && r.width === z.width, aligned };
      });
      assert.ok(result.left >= result.frame.left - 1 && result.right <= result.frame.right + 1 && result.top >= result.frame.top - 1 && result.bottom <= result.frame.bottom + 1, `${sizePercent}: ${JSON.stringify(result)}`);
      assert.equal(result.stationary, true);
      assert.equal(result.aligned, true, "native coordinate wrapper and board must retain identical geometry");
    }
    await page.evaluate(() => { document.querySelector('[aria-label="Dartboard"]').style.removeProperty("transform"); });
    await page.screenshot({ path: path.join(artifacts, "surround.png"), fullPage: true });
  } finally { await page.close(); }
});

test("surround teardown preserves padding longhands and their original priority", async () => {
  const page = await open();
  try {
    await page.evaluate(() => {
      document.querySelector(".board-slot").style.setProperty("padding-top", "8px", "important");
      window.settings.boardSurround = { enabled: true, design: ADXQuality.COMMUNITY_SURROUNDS[0].key, sizePercent: 143 };
      window.stopSurround = ADXQuality.mountBoardSurround(window.context);
    });
    await page.waitForFunction(() => document.getElementById("ad-xconfig-board-surround"));
    await page.evaluate(() => window.stopSurround());
    assert.deepEqual(await page.locator(".board-slot").evaluate((node) => ({ top: node.style.getPropertyValue("padding-top"), priority: node.style.getPropertyPriority("padding-top"), right: node.style.getPropertyValue("padding-right") })), { top: "8px", priority: "important", right: "" });
  } finally { await page.close(); }
});

test("live image and surround rehydrate after native board replacement through real observers", async () => {
  const page = await open({ live: true });
  try {
    await page.evaluate(() => {
      window.settings.liveBoardEnhancement = { enabled: true, intensity: 60 };
      window.settings.boardSurround = { enabled: true, design: ADXQuality.COMMUNITY_SURROUNDS[0].key, sizePercent: 143 };
      window.stopLive = ADXQuality.mountLiveBoardEnhancement(window.context);
      window.stopSurround = ADXQuality.mountBoardSurround(window.context);
    });
    await page.waitForFunction(() => document.querySelector('[aria-label="Dartboard"] img').style.filter.includes("ad-xconfig-live-image-filter"));
    await page.evaluate(() => {
      const old = document.querySelector('[aria-label="Dartboard"]'); const replacement = old.cloneNode(true);
      replacement.querySelector("img").style.removeProperty("filter"); old.replaceWith(replacement);
    });
    await page.waitForFunction(() => document.querySelector('[aria-label="Dartboard"] img').style.filter.includes("ad-xconfig-live-image-filter") && document.querySelectorAll("#ad-xconfig-board-surround").length === 1);
    await page.evaluate(() => { window.stopLive(); window.stopSurround(); });
    assert.equal(await page.locator("[data-adx-decoration]").count(), 0);
  } finally { await page.close(); }
});

test("live SVG filtering is supported, composes original CSS filters and cleans up", async () => {
  const page = await open({ live: true });
  try {
    await page.evaluate(() => { const img = document.querySelector('[aria-label="Dartboard"] img'); img.style.filter = "brightness(0.8)"; window.settings.liveBoardEnhancement = { enabled: true, intensity: 60 }; window.stopLive = ADXQuality.mountLiveBoardEnhancement(window.context); });
    await page.waitForFunction(() => document.querySelector("feConvolveMatrix"));
    const filter = await page.locator('[aria-label="Dartboard"] img').evaluate((node) => getComputedStyle(node).filter);
    assert.match(filter, /brightness\(0.8\)/);
    assert.match(filter, /ad-xconfig-live-image-filter/);
    await page.screenshot({ path: path.join(artifacts, "live-filter.png") });
    await page.evaluate(() => window.stopLive());
    assert.equal(await page.locator('[aria-label="Dartboard"] img').evaluate((node) => node.style.filter), "brightness(0.8)");
    assert.equal(await page.locator("feConvolveMatrix").count(), 0);
  } finally { await page.close(); }
});

test("glow has a real animation, supports reduced motion and preserves native animation", async () => {
  const page = await open();
  try {
    await page.evaluate(() => {
      const card = document.querySelector(".bg-raspberry-slush-diagonal"); card.style.animation = "native-pulse 3s infinite";
      const style = document.createElement("style"); style.textContent = ADXQuality.buildPlayerGlowStyle({ glowMode: "pulse", glowIntensity: 40 }); document.head.append(style);
      window.glow = ADXQuality.createPlayerGlowController(document); window.glow.update(true);
    });
    assert.equal(await page.locator(".ad-xconfig-player-glow").evaluate((node) => getComputedStyle(node).animationName), "adx-player-glow");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".ad-xconfig-player-glow").evaluate((node) => getComputedStyle(node).animationName), "none");
    assert.match(await page.locator(".bg-raspberry-slush-diagonal").evaluate((node) => node.style.animation), /native-pulse/);
    await page.evaluate(() => window.glow.clear());
    assert.equal(await page.locator(".ad-xconfig-player-glow").count(), 0);
  } finally { await page.close(); }
});
