/* global URL, process, window, document */
import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";

let bundle;
let matchHtml;

test.beforeAll(async () => {
  const [match, board, result] = await Promise.all([
    readFile(new URL("../tests/fixtures/autodarts/x01-match-modern.html", import.meta.url), "utf8"),
    readFile(new URL("../tests/fixtures/autodarts/dartboard-modern.html", import.meta.url), "utf8"),
    build({ stdin: { contents: `
      import { buildShellContent } from "./src/features/xconfig-ui/shell-view.js";
      import { styleText } from "./src/features/xconfig-ui/shell-style.js";
      import { featureCatalog } from "./src/shared/feature-catalog.js";
      import { getFeatureConfigSpec } from "./src/config/feature-config-spec.js";
      import { PRESENTATION_GROUPS } from "./src/features/xconfig-ui/presentation-groups.js";
      import { createDomGuards } from "./src/core/dom-guards.js";
      import { createObserverRegistry } from "./src/core/observer-registry.js";
      import { createListenerRegistry } from "./src/core/listener-registry.js";
      import { createRafScheduler } from "./src/shared/raf-scheduler.js";
      import * as x01Rules from "./src/domain/x01-rules.js";
      import * as variantRules from "./src/domain/variant-rules.js";
      import { readModernMatchSurface, findModernTurnSurface } from "./src/features/shared/x01-match-surface.js";
      import { initializeDartboardMarkerHighlight } from "./src/features/dartboard-marker-highlight/index.js";
      import { initializeDartMarkerReplacer } from "./src/features/dart-marker-replacer/index.js";
      import { mountCheckoutScoreHighlight } from "./src/features/checkout-score-highlight/index.js";
      import { mountX01RemainingScoreBar } from "./src/features/x01-remaining-score-bar/index.js";
      import { mountTurnDartDisplay } from "./src/features/turn-dart-display/index.js";
      import { initializeSpecialHitHighlights } from "./src/features/special-hit-highlights/index.js";
      import { initializeTurnScoreCounter } from "./src/features/turn-score-counter/index.js";
      window.groupQA = { buildShellContent, styleText, featureCatalog, getFeatureConfigSpec, PRESENTATION_GROUPS,
        createDomGuards, createObserverRegistry, createListenerRegistry, createRafScheduler, x01Rules, variantRules,
        readModernMatchSurface, findModernTurnSurface, initializeDartboardMarkerHighlight, initializeDartMarkerReplacer,
        mountCheckoutScoreHighlight, mountX01RemainingScoreBar, mountTurnDartDisplay,
        initializeSpecialHitHighlights, initializeTurnScoreCounter };
    `, resolveDir: process.cwd() }, bundle: true, write: false, format: "iife", platform: "browser",
      target: "chrome111", loader: USERSCRIPT_ASSET_LOADERS }),
  ]);
  const boardContent = board.match(/<main>([\s\S]*?)<\/main>/u)?.[1] || "";
  matchHtml = match.replace("</main>", `${boardContent}</main>`);
  bundle = result.outputFiles[0].text;
});

for (const width of [1280, 390]) {
  test(`grouped settings keep all controls accessible without horizontal overflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/*", (route) => route.abort());
    await page.setContent('<!doctype html><html lang="de"><body><section id="ad-xconfig-panel-host"></section></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      const api = window.groupQA;
      const style = document.createElement("style"); style.textContent = api.styleText; document.head.appendChild(style);
      api.features = api.featureCatalog.map((feature) => ({ ...feature, enabled: false, mounted: false,
        config: api.getFeatureConfigSpec(feature.configKey)?.normalizeConfig() || {} }));
      api.render = (key = "") => document.getElementById("ad-xconfig-panel-host").replaceChildren(
        api.buildShellContent(document, { activeSettingsFeatureKey: key, updateStatus: {}, settingsTransfer: {} }, api.features));
      document.getElementById("ad-xconfig-panel-host").style.display = "block";
      api.render();
    });
    await expect(page.locator(".ad-xconfig-card")).toHaveCount(19);
    await expect(page.locator("[data-adxconfig-section='all-modes'] .ad-xconfig-card")).toHaveCount(8);
    await expect(page.locator("[data-adxconfig-section='x01'] .ad-xconfig-card")).toHaveCount(5);
    await page.screenshot({ path: testInfo.outputPath(`groups-${width}.png`), fullPage: true });
    const groups = await page.evaluate(() => window.groupQA.PRESENTATION_GROUPS);
    for (const group of groups) {
      const card = page.locator(`.ad-xconfig-card[data-feature-key='${group.key}']`);
      await expect(card.getByRole("switch")).toHaveCount(group.members.length);
      for (const [, label] of group.members) {
        const toggle = card.getByRole("switch", { name: `${label} aktivieren`, exact: true });
        await expect(toggle).toBeVisible();
        await toggle.check();
        await expect(toggle).toBeChecked();
        await toggle.uncheck();
      }
      await card.screenshot({ path: testInfo.outputPath(`${group.key}-card-${width}.png`), animations: "disabled" });
      await page.evaluate((key) => window.groupQA.render(key), group.key);
      const modal = page.locator(".ad-xconfig-modal");
      await expect(modal).toBeVisible();
      const geometry = await modal.evaluate((node) => ({ width: node.clientWidth, content: node.scrollWidth,
        overflow: [...node.querySelectorAll("*")].filter((child) => child.getBoundingClientRect().right > node.getBoundingClientRect().right)
          .slice(0, 8).map((child) => ({ className: child.className, text: child.textContent.slice(0, 70), width: child.getBoundingClientRect().width })) }));
      expect(geometry.content, JSON.stringify(geometry.overflow)).toBeLessThanOrEqual(geometry.width + 2);
      const ids = await modal.locator("input[id], [data-adxconfig-setting][id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const [key] of group.members) {
        await expect(modal.locator(`[data-feature-key='${key}'][data-setting-key='debug']`)).toHaveCount(1);
      }
      await modal.screenshot({ path: testInfo.outputPath(`${group.key}-${width}.png`), animations: "disabled" });
      await page.evaluate(() => window.groupQA.render());
    }
  });
}

test("native Chromium mutations update all grouped effects and independent cleanup preserves the remaining effects", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("http://xconfig.test/**", (route) => route.fulfill({ contentType: "text/html", body: matchHtml }));
  await page.goto("http://xconfig.test/matches/modern-match");
  await page.addStyleTag({ content: `
    main{width:900px} main>div{min-height:24px} .font-number{font-size:28px}
    [role="img"][aria-label="Dartboard"]{position:relative;width:500px;height:500px}
    [role="img"][aria-label="Dartboard"]>svg{position:absolute;inset:0;width:500px;height:500px}
  ` });
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => {
    const api = window.groupQA;
    const surface = api.readModernMatchSurface(document, window);
    surface.players[0].scoreNode.textContent = "36";
    const turn = api.findModernTurnSurface(document, window);
    ["T20", "25", "D18"].forEach((text, index) => {
      const row = turn.throwRows[index];
      const label = [...row.children].find((child) => child.getAttribute("aria-hidden") !== "true") || document.createElement("span");
      label.textContent = text;
      row.replaceChildren(label);
      row.classList.toggle("text-checkout-suggestion", index === 2);
      row.classList.toggle("cursor-pointer", index !== 2);
    });
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    for (const [key, value] of Object.entries({ cx: 420, cy: 320, r: 5, filter: "url(#shadow-2dp)", id: "qa-hit-marker" })) marker.setAttribute(key, value);
    marker.style.opacity = "0.6";
    document.querySelector('[role="img"][aria-label="Dartboard"] svg').appendChild(marker);
    const subscribers = new Set();
    const configs = {
      dartMarkerReplacer: { animateDarts: false, hideOriginalMarkers: true },
      checkoutScoreHighlight: { effect: "grow-only", triggerSource: "score-only" },
      turnDartDisplay: { turnDartStyle: "solid" }, turnScoreCounter: { flashOnChange: false },
    };
    const context = { documentRef: document, windowRef: window, domGuards: api.createDomGuards({ documentRef: document }),
      registries: { observers: api.createObserverRegistry(), listeners: api.createListenerRegistry() },
      domain: { x01Rules: api.x01Rules, variantRules: api.variantRules },
      helpers: { createRafScheduler: api.createRafScheduler },
      config: { getFeatureConfig: (key) => api.getFeatureConfigSpec(key)?.normalizeConfig({ enabled: true, ...configs[key] }) || {} },
      gameState: { isX01Variant: () => true, getOutMode: () => "Double Out", getActiveThrows: () => [], getActivePlayerIndex: () => 0,
        subscribe(handler) { subscribers.add(handler); return () => subscribers.delete(handler); } },
    };
    api.context = context; api.subscribers = subscribers;
    api.cleanups = [api.initializeDartboardMarkerHighlight(context), api.initializeDartMarkerReplacer(context),
      api.mountCheckoutScoreHighlight(context), api.mountX01RemainingScoreBar(context), api.mountTurnDartDisplay(context),
      api.initializeSpecialHitHighlights(context), api.initializeTurnScoreCounter(context)];
  });
  try {
    await expect(page.locator(".ad-ext-checkout-possible")).toHaveCount(1);
    await expect(page.locator("[data-ad-ext-x01-remaining-score-bar='true']")).toHaveCount(1);
    await expect(page.locator(".ad-ext-hit-highlight--triple")).toHaveCount(1);
    await expect(page.locator(".ad-ext-turn-dart-row--modern")).toHaveCount(3);
    await expect(page.locator("#qa-hit-marker")).toHaveCSS("opacity", "0");
    expect(await page.evaluate(() => window.groupQA.subscribers.size)).toBe(3);
    await page.evaluate(() => {
      const api = window.groupQA;
      const old = api.findModernTurnSurface(document, window).throwRows[0];
      const next = old.cloneNode(true);
      [...next.classList].filter((name) => name.startsWith("ad-ext-")).forEach((name) => next.classList.remove(name));
      old.replaceWith(next);
      api.readModernMatchSurface(document, window).players[0].scoreNode.textContent = "169";
    });
    await expect(page.locator(".ad-ext-checkout-possible")).toHaveCount(0);
    await expect(page.locator(".ad-ext-hit-highlight--triple")).toHaveCount(1);
    await expect(page.locator(".ad-ext-turn-dart-row--modern")).toHaveCount(3);
    await page.evaluate(() => window.groupQA.cleanups[1]());
    await expect.poll(() => page.locator("#qa-hit-marker").evaluate((node) => node.style.opacity)).toBe("0.85");
    await expect(page.locator("#qa-hit-marker")).toBeVisible();
    await page.evaluate(() => window.groupQA.cleanups[2]());
    await expect(page.locator("[data-ad-ext-x01-remaining-score-bar='true']")).toHaveCount(1);
  } finally {
    await page.evaluate(() => window.groupQA.cleanups.forEach((cleanup) => cleanup()));
  }
  await expect(page.locator("#qa-hit-marker")).toHaveCSS("opacity", "0.6");
  expect(await page.evaluate(() => ({ subscribers: window.groupQA.subscribers.size,
    observers: window.groupQA.context.registries.observers.size(), listeners: window.groupQA.context.registries.listeners.size() })))
    .toEqual({ subscribers: 0, observers: 0, listeners: 0 });
  expect(errors).toEqual([]);
});
