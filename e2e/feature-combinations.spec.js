import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";
import { openMatchRuntime, expectCheckout, stopMatchRuntime } from "./helpers/match-runtime.js";

let bundle;

test.beforeAll(async () => {
  const result = await build({ stdin: { contents: `
    import * as highlight from "./src/features/dartboard-marker-highlight/logic.js";
    import { resolveDartboardMarkerHighlightConfig } from "./src/features/dartboard-marker-highlight/style.js";
    import * as replacer from "./src/features/dart-marker-replacer/logic.js";
    import { resolveDartMarkerReplacerConfig } from "./src/features/dart-marker-replacer/style.js";
    import * as board from "./src/shared/dartboard-svg.js";
    import * as tools from "./src/features/shared/tools-animation-layer-controller.js";
    import { applyZoom, resetZoom } from "./src/features/tv-board-zoom/logic.js";
    import { resolveZoomSpeedConfig, buildStyleText } from "./src/features/tv-board-zoom/style.js";
    import { createGameStateStore } from "./src/core/game-state-store.js";
    import { createEventBus } from "./src/core/event-bus.js";
    import * as takeout from "./src/features/take-out-darts-alert/logic.js";
    import { readModernMatchSurface } from "./src/features/shared/x01-match-surface.js";
    import * as x01Rules from "./src/domain/x01-rules.js";
    window.combinations = { highlight, replacer, board, tools, applyZoom, resetZoom, resolveZoomSpeedConfig,
      buildStyleText, createGameStateStore, createEventBus, takeout, readModernMatchSurface, x01Rules,
      resolveDartboardMarkerHighlightConfig, resolveDartMarkerReplacerConfig };
  `, resolveDir: process.cwd() }, bundle: true, write: false, format: "iife",
    platform: "browser", target: "chrome100", loader: USERSCRIPT_ASSET_LOADERS });
  bundle = result.outputFiles[0].text;
});

async function openBoard(page) {
  await page.setContent(await readFile(new URL("../tests/fixtures/autodarts/dartboard-modern.html", import.meta.url), "utf8"));
  await page.addStyleTag({ content: '[role="img"][aria-label="Dartboard"]{position:relative;width:500px;height:500px} svg{width:500px;height:500px}' });
  await page.addScriptTag({ content: bundle });
}

for (const firstToStart of [0, 1]) {
  for (const firstToStop of [0, 1]) {
    test(`native marker consumers retain coordinates and cleanup ownership: start ${firstToStart}, stop ${firstToStop}`, async ({ page }) => {
      await openBoard(page);
      const result = await page.evaluate(([start, stop]) => {
        const api = window.combinations;
        const board = api.board.findBoardSvgGroup(document);
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        marker.setAttribute("cx", "420"); marker.setAttribute("cy", "320"); marker.setAttribute("r", "5");
        marker.setAttribute("filter", "url(#shadow-2dp)");
        marker.style.opacity = "0.6"; marker.style.fill = "pink";
        board.svg.appendChild(marker);
        const high = api.highlight.createDartboardMarkerHighlightState();
        const replacement = api.replacer.createDartMarkerReplacerState(window);
        const update = [
          () => api.highlight.updateDartboardMarkerHighlight({ documentRef: document, state: high, visualConfig: api.resolveDartboardMarkerHighlightConfig({ opacityPercent: 85 }) }),
          () => api.replacer.updateDartMarkerReplacer({ documentRef: document, state: replacement, visualConfig: api.resolveDartMarkerReplacerConfig({ animateDarts: false, hideOriginalMarkers: true }) }),
        ];
        const cleanup = [() => api.highlight.clearDartboardMarkerHighlight(high), () => api.replacer.clearDartMarkerReplacerState(replacement)];
        const matrix = marker.getScreenCTM();
        const before = [matrix.a, matrix.d, matrix.e, matrix.f];
        update[start](); update[1 - start]();
        const hidden = marker.style.opacity;
        const rendered = replacement.entriesByMarker.has(marker);
        cleanup[stop]();
        const remainingOpacity = marker.style.opacity;
        cleanup[1 - stop]();
        const after = marker.getScreenCTM();
        return { hidden, rendered, remainingOpacity, restored: marker.style.opacity, fill: marker.style.fill,
          radius: marker.getAttribute("r"), coordinates: [after.a, after.d, after.e, after.f], before,
          overlays: document.querySelectorAll("#ad-ext-dart-image-overlay").length };
      }, [firstToStart, firstToStop]);
      expect(result.rendered).toBe(true);
      expect(result.hidden).toBe("0");
      expect(result.remainingOpacity).toBe(firstToStop === 0 ? "0" : "0.85");
      expect(result.restored).toBe("0.6");
      expect(result.fill).toBe("pink");
      expect(result.radius).toBe("5");
      expect(result.coordinates).toEqual(result.before);
      expect(result.overlays).toBe(0);
    });
  }
}

test("Tools board copies never become the original board during native replacement", async ({ page }) => {
  await openBoard(page);
  const result = await page.evaluate(() => {
    const api = window.combinations;
    const original = api.board.findBoardSvgGroup(document);
    const native = original.svg.closest('[role="img"][aria-label="Dartboard"]') || original.svg.parentElement;
    const replacement = native.cloneNode(true);
    const copy = native.cloneNode(true);
    const zoom = document.createElement("div"); zoom.id = "adt-zoom";
    const view = document.createElement("div"); view.className = "adt-zoom-view";
    view.appendChild(copy); zoom.appendChild(view); document.body.prepend(zoom);
    const initialIsNative = api.board.findBoardSvgGroup(document).svg === original.svg;
    native.remove();
    const gap = api.board.findBoardSvgGroup(document);
    document.querySelector("main").appendChild(replacement);
    const next = api.board.findBoardSvgGroup(document);
    return { initialIsNative, gapIsEmpty: !gap, replacementSelected: Boolean(next && replacement.contains(next.svg)) };
  });
  expect(result).toEqual({ initialIsNative: true, gapIsEmpty: true, replacementSelected: true });
});

test("actual transforms and Shadow DOM GIF loading, fades and errors preserve the Tools measurement frame", async ({ page }, testInfo) => {
  await openBoard(page);
  const result = await page.evaluate(async () => {
    const api = window.combinations;
    const surface = api.board.resolveBoardRenderSurface(document);
    const target = surface.zoomTarget;
    const host = surface.zoomHost || target.parentElement;
    const anchorBefore = target.getBoundingClientRect().toJSON();
    const style = document.createElement("style"); style.textContent = api.buildStyleText(); document.head.appendChild(style);
    const toolsHost = document.createElement("autodarts-tools-animations");
    const shadow = toolsHost.attachShadow({ mode: "open" });
    const wrapper = document.createElement("div"); wrapper.className = "fixed";
    wrapper.style.cssText = "position:fixed;inset:0;opacity:1";
    const media = document.createElement("img");
    media.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    wrapper.appendChild(media); shadow.appendChild(wrapper); document.body.appendChild(toolsHost);
    const controller = api.tools.acquireToolsAnimationLayerController({ documentRef: document, windowRef: window });
    const activeOnLoad = api.tools.isToolsAnimationActive(document);
    const state = {};
    const speed = api.resolveZoomSpeedConfig("mittel");
    api.applyZoom({ targetNode: target, hostNode: host, boardSvg: surface.svg }, 1.75, speed,
      { reason: "checkout", segment: "D20" }, state, { documentRef: document, windowRef: window, x01Rules: api.x01Rules });
    await new Promise((resolve) => setTimeout(resolve, 240));
    const layer = target.querySelector("svg");
    const scale = new DOMMatrixReadOnly(getComputedStyle(layer).transform).a;
    wrapper.style.transition = "opacity 80ms linear";
    wrapper.style.opacity = "0";
    await new Promise((resolve) => setTimeout(resolve, 20));
    const activeDuringFade = api.tools.isToolsAnimationActive(document);
    await new Promise((resolve) => setTimeout(resolve, 160));
    const inactiveAfterFade = !api.tools.isToolsAnimationActive(document);
    wrapper.style.transition = "none"; wrapper.style.opacity = "1";
    media.dispatchEvent(new Event("error"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    const inactiveAfterError = !api.tools.isToolsAnimationActive(document);
    const anchorAfter = target.getBoundingClientRect().toJSON();
    api.resetZoom(speed, state, true); controller.release(); toolsHost.remove();
    return { activeOnLoad, activeDuringFade, inactiveAfterFade, inactiveAfterError, scale, anchorBefore, anchorAfter,
      restored: layer.style.transform, flag: document.documentElement.getAttribute(api.tools.TOOLS_ANIMATION_ACTIVE_ATTRIBUTE) };
  });
  expect(result.activeOnLoad).toBe(true);
  expect(result.activeDuringFade).toBe(true);
  expect(result.inactiveAfterFade).toBe(true);
  expect(result.inactiveAfterError).toBe(true);
  expect(result.scale).toBeCloseTo(1.75, 3);
  expect(result.anchorAfter).toEqual(result.anchorBefore);
  expect(result.restored).toBe("");
  expect(result.flag).toBeNull();
  await testInfo.attach("transform-and-shadow-lifecycle", { body: JSON.stringify(result), contentType: "application/json" });
});

for (const order of ["tools-first", "xconfig-first"]) {
  test(`WebSocket ${order} observes the same team-checkout frame delivered to Autodarts`, async ({ page }, testInfo) => {
    // Confirmed pre-existing conflict: an inner getter cannot observe its outer
    // wrapper's returned rewrite without calling Tools again. Keep this precise
    // expected failure visible; an eventual fix must remove it (unexpected pass).
    test.fail(order === "xconfig-first", "Known Tools frame rewrite conflict; production interception unchanged");
    await page.setContent("<!doctype html><main></main>");
    await page.addScriptTag({ content: bundle });
    const result = await page.evaluate(async (installOrder) => {
      const api = window.combinations;
      const native = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
      let toolsCalls = 0;
      // Model the pinned Tools wrapper's delivered-frame rewrite, without importing its rules.
      function installTools() {
        const previous = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
        Object.defineProperty(MessageEvent.prototype, "data", { ...previous, get() {
          toolsCalls += 1;
          const raw = previous.get.call(this);
          const frame = JSON.parse(raw);
          frame.data.gameScores = [toolsCalls, 60];
          frame.data.turns[0].busted = true;
          frame.data.turns[0].turnBusted = true;
          return JSON.stringify(frame);
        } });
      }
      const store = api.createGameStateStore({ windowRef: window, documentRef: document, eventBus: api.createEventBus() });
      if (installOrder === "tools-first") installTools();
      store.start();
      if (installOrder === "xconfig-first") installTools();
      const target = Object.create(WebSocket.prototype);
      const event = new MessageEvent("message", { data: JSON.stringify({ channel: "autodarts.matches", topic: "team-match.state", data: {
        id: "team-match", variant: "X01", player: 0, players: [{ id: "p1" }, { id: "p2" }], gameScores: [0, 60],
        turns: [{ id: "turn-1", playerId: "p1", throws: [{ segment: { name: "D20" }, score: 40 }] }],
      } }) });
      Object.defineProperty(event, "currentTarget", { value: target });
      const delivered = JSON.parse(event.data);
      await Promise.resolve();
      const score = store.getActiveScore();
      store.stop();
      Object.defineProperty(MessageEvent.prototype, "data", native);
      return { deliveredScore: delivered.data.gameScores[0], observedScore: score, toolsCalls };
    }, order);
    await testInfo.attach("delivered-versus-observed-frame", { body: JSON.stringify(result), contentType: "application/json" });
    expect(result.observedScore).toBe(result.deliveredScore);
    expect(result.toolsCalls).toBe(1);
  });
}

test("two takeout surfaces and rapid equal-score player changes retain one overlay and the correct player", async ({ page }) => {
  await page.setContent(await readFile(new URL("../tests/fixtures/autodarts/x01-match-modern.html", import.meta.url), "utf8"));
  await page.addStyleTag({ content: "main *{min-width:1px;min-height:1px}.invisible{visibility:hidden}" });
  await page.addScriptTag({ content: bundle });
  const result = await page.evaluate(() => {
    const api = window.combinations;
    const firstSurface = api.readModernMatchSurface(document, window);
    const cards = Array.from(document.querySelectorAll("main .overflow-clip")).filter((node) => node.querySelector(".font-number"));
    const state = api.takeout.createTakeOutDartsAlertState();
    const notices = ["adt-remove", "adt-takeout"].map((kind) => {
      const node = document.createElement("div");
      if (kind === "adt-remove") node.className = kind;
      else { node.id = kind; node.dataset.open = "true"; }
      node.textContent = "Remove Darts"; document.body.appendChild(node); return node;
    });
    let valid = Boolean(firstSurface);
    for (let cycle = 0; cycle < 20; cycle++) {
      cards.forEach((card, index) => {
        const active = index === cycle % cards.length;
        card.classList.toggle("bg-raspberry-slush-diagonal", active);
        card.classList.toggle("bg-black-80", !active);
        card.querySelector(".size-2")?.classList.toggle("invisible", !active);
        card.querySelector(".font-number").textContent = "40";
      });
      api.takeout.updateTakeOutDartsAlert({ documentRef: document, state });
      const current = api.readModernMatchSurface(document, window);
      valid &&= current.playerCard === cards[cycle % cards.length];
    }
    const overlays = document.querySelectorAll(".ad-ext-takeout-overlay").length;
    const tracked = state.trackedNotices.size;
    notices.forEach((notice) => notice.remove());
    api.takeout.clearTakeOutDartsAlertState(state);
    return { valid, overlays, tracked, remaining: document.querySelectorAll(".ad-ext-takeout-overlay").length };
  });
  expect(result).toEqual({ valid: true, overlays: 1, tracked: 2, remaining: 0 });
});

test.describe("shared match surfaces recover in Chromium", () => {
  test.beforeEach(async ({ page }) => openMatchRuntime(page));
  test.afterEach(async ({ page }) => stopMatchRuntime(page));

  async function enterCricket(page) {
    await page.evaluate(() => {
      const api = window.matchRecovery;
      api.visit.variant = "Cricket";
      api.visit.throws = [];
      api.replaceHost("Cricket");
      // Keep the live-derived three-player grid. All three must close target 20
      // before it becomes dead; the third player is already closed here.
      const cells = api.readModernCricketGrid(document).cellsByLabel.get("20");
      [3, 2, 3].forEach((marks, index) => { cells[index].dataset.marks = String(marks); });
      api.publish();
    });
    await expect(page.locator(".ad-ext-crfx-modern-root")).toHaveCount(1);
    await expect(page.locator('#ad-ext-cricket-targets [data-target-label="20"][data-target-presentation="scoring"]')).not.toHaveCount(0);
  }

  // Browser contribution: the two mounted consumers must rebind to the same new
  // host through native observer delivery, not an explicit renderer invocation.
  test("Cricket grid replacement preserves scoring and a later close updates board and cells", async ({ page }) => {
    await enterCricket(page);
    await page.evaluate(() => {
      const api = window.matchRecovery;
      const grid = api.readModernCricketGrid(document).root;
      const replacement = grid.cloneNode(true);
      for (const node of [replacement, ...replacement.querySelectorAll("*")]) {
        node.className = [...node.classList].filter((name) => !name.startsWith("ad-ext-")).join(" ");
      }
      grid.replaceWith(replacement);
    });
    await expect(page.locator(".ad-ext-crfx-modern-root")).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => {
      const cells = window.matchRecovery.readModernCricketGrid(document).cellsByLabel.get("20");
      return [cells[0].classList.contains("ad-ext-crfx-score"), cells[1].classList.contains("ad-ext-crfx-pressure")];
    })).toEqual([true, true]);
    await page.evaluate(() => {
      window.matchRecovery.readModernCricketGrid(document).cellsByLabel.get("20")[1].dataset.marks = "3";
    });
    await expect.poll(() => page.evaluate(() => window.matchRecovery.readModernCricketGrid(document)
      .cellsByLabel.get("20").every((cell) => cell.classList.contains("ad-ext-crfx-dead")))).toBe(true);
    const targets = page.locator('#ad-ext-cricket-targets [data-target-label="20"]');
    await expect(targets).not.toHaveCount(0);
    await expect(page.locator('#ad-ext-cricket-targets [data-target-label="20"]:not([data-target-presentation="dead"])')).toHaveCount(0);
    await expect(page.locator("#ad-ext-cricket-targets")).toHaveCount(1);
  });

  test("Cricket undo reopens a dead target on the board and in every player column", async ({ page }) => {
    await enterCricket(page);
    await page.evaluate(() => {
      window.matchRecovery.readModernCricketGrid(document).cellsByLabel.get("20")[1].dataset.marks = "3";
    });
    await expect.poll(() => page.evaluate(() => window.matchRecovery.readModernCricketGrid(document)
      .cellsByLabel.get("20").every((cell) => cell.classList.contains("ad-ext-crfx-dead")))).toBe(true);
    await expect(page.locator('#ad-ext-cricket-targets [data-target-label="20"]:not([data-target-presentation="dead"])')).toHaveCount(0);
    await expect(page.locator('#ad-ext-cricket-targets [data-target-label="20"][data-target-presentation="dead"]')).not.toHaveCount(0);
    await page.evaluate(() => {
      window.matchRecovery.readModernCricketGrid(document).cellsByLabel.get("20")[1].dataset.marks = "2";
    });
    await expect.poll(() => page.evaluate(() => {
      const cells = window.matchRecovery.readModernCricketGrid(document).cellsByLabel.get("20");
      return {
        scoring: [cells[0].classList.contains("ad-ext-crfx-score"), cells[2].classList.contains("ad-ext-crfx-score")],
        pressure: cells[1].classList.contains("ad-ext-crfx-pressure"),
        staleDead: cells.some((cell) => cell.classList.contains("ad-ext-crfx-dead")),
      };
    })).toEqual({ scoring: [true, true], pressure: true, staleDead: false });
    await expect(page.locator('#ad-ext-cricket-targets [data-target-label="20"][data-target-presentation="scoring"]')).not.toHaveCount(0);
    await expect(page.locator('#ad-ext-cricket-targets [data-target-label="20"]:not([data-target-presentation="scoring"])')).toHaveCount(0);
    await expect(page.locator("#ad-ext-cricket-targets")).toHaveCount(1);
  });

  test("X01 to Cricket to X01 replaces mode effects and preserves feature configuration", async ({ page }) => {
    await expectCheckout(page, expect, { target: 20, score: 40 });
    const before = await page.evaluate(() => window.matchRecovery.runtime.getSnapshot().features);
    await enterCricket(page);
    await expect(page.locator("#ad-ext-checkout-targets, .ad-ext-checkout-possible, .ad-ext-tv-board-zoom")).toHaveCount(0);
    await page.evaluate(() => {
      const api = window.matchRecovery;
      api.visit.variant = "X01";
      api.visit.turn += 1;
      api.replaceHost("X01");
      api.publish();
    });
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await expect(page.locator("#ad-ext-cricket-targets, .ad-ext-crfx-root")).toHaveCount(0);
    const after = await page.evaluate(() => window.matchRecovery.runtime.getSnapshot().features);
    expect(Object.fromEntries(Object.entries(after).map(([key, value]) => [key, value.config])))
      .toEqual(Object.fromEntries(Object.entries(before).map(([key, value]) => [key, value.config])));
  });
});
