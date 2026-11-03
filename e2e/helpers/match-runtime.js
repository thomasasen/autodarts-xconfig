import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { expect } from "@playwright/test";
import { USERSCRIPT_ASSET_LOADERS } from "../../scripts/userscript-build-config.mjs";

let fixturePromise;
const browserErrors = new WeakMap();

function getFixtures() {
  fixturePromise ||= Promise.all([
    readFile(new URL("../../tests/fixtures/autodarts/x01-match-modern.html", import.meta.url), "utf8"),
    readFile(new URL("../../tests/fixtures/autodarts/cricket-modern.html", import.meta.url), "utf8"),
    readFile(new URL("../../tests/fixtures/autodarts/dartboard-modern.html", import.meta.url), "utf8"),
    build({
      stdin: { contents: `
        import { createBootstrap } from "./src/core/bootstrap.js";
        import { defaultFeatureDefinitions } from "./src/features/feature-registry.js";
        import { readModernMatchSurface, findModernTurnSurface } from "./src/features/shared/x01-match-surface.js";
        import { readModernCricketGrid } from "./src/features/cricket-surface/modern-grid.js";
        window.matchRecovery = { createBootstrap, defaultFeatureDefinitions,
          readModernMatchSurface, findModernTurnSurface, readModernCricketGrid };
      `, resolveDir: process.cwd() },
      bundle: true, write: false, format: "iife", platform: "browser",
      target: "chrome111", loader: USERSCRIPT_ASSET_LOADERS,
    }),
  ]).then(([x01, cricket, board, result]) => ({
    x01, cricket,
    board: board.match(/<main>([\s\S]*?)<\/main>/u)[1],
    bundle: result.outputFiles[0].text,
  }));
  return fixturePromise;
}

// Reuse the sanitized Autodarts fixtures and production bootstrap/config API.
// Only host updates are simulated; native Chromium observers drive the effects.
export async function openMatchRuntime(page) {
  const errors = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  const fixtures = await getFixtures();
  await page.route("http://xconfig.test/**", (route) => route.fulfill({
    contentType: "text/html", body: fixtures.x01.replace("</main>", `${fixtures.board}</main>`),
  }));
  await page.goto("http://xconfig.test/matches/modern-match");
  await page.addStyleTag({ content: `
    main, main * { min-width:1px; min-height:1px }
    .hidden { display:none } .invisible { visibility:hidden }
    [role="img"][aria-label="Dartboard"] { position:relative; width:500px; height:500px; overflow:hidden }
    [role="img"][aria-label="Dartboard"] > svg { position:absolute; inset:0; width:500px; height:500px }
    main > .grid { display:grid; grid-template-columns:repeat(4, 100px) }
  ` });
  await page.addScriptTag({ content: fixtures.bundle });
  await page.evaluate(({ x01, cricket, board }) => {
    const api = window.matchRecovery;
    const content = (html) => new DOMParser().parseFromString(html, "text/html").querySelector("main").innerHTML;
    api.hosts = { X01: content(x01), Cricket: content(cricket) };
    api.boardHtml = board;
    api.visit = { matchId: "modern-match", gameId: "x01-game", variant: "X01",
      player: 0, scores: [40, 32], throws: [], route: ["D20"], total: "0", turn: 1 };
    api.writeHost = () => {
      if (api.visit.variant !== "X01") return;
      const { player, scores, throws, route, total } = api.visit;
      const surface = api.readModernMatchSurface(document, window);
      surface.players.forEach((entry, index) => {
        entry.cardNode.classList.toggle("bg-raspberry-slush-diagonal", index === player);
        entry.cardNode.classList.toggle("bg-black-80", index !== player);
        const indicator = entry.cardNode.querySelector(".size-2.rounded-full");
        indicator?.classList.toggle("invisible", index !== player);
        entry.scoreNode.textContent = String(scores[index]);
        entry.cardNode.querySelectorAll(".hidden .text-checkout-suggestion").forEach((node) => node.textContent = "");
      });
      const turn = api.findModernTurnSurface(document, window);
      turn.throwRows.forEach((row, index) => {
        row.classList.toggle("text-checkout-suggestion", index >= throws.length);
        row.classList.toggle("cursor-pointer", index < throws.length);
        const label = document.createElement("span");
        label.textContent = [...throws.map((dart) => dart.segment.name), ...route][index] || "";
        row.replaceChildren(label);
      });
      turn.turnScoreNode.textContent = total;
    };
    api.buildMatch = () => {
      const { matchId, gameId, variant, player, scores, throws, turn } = api.visit;
      return {
        id: matchId, currentGameId: variant === "X01" ? gameId : "cricket-game",
        variant, player, players: [{ id: "player-a", boardId: "hardware-board" }, { id: "player-b", boardId: "hardware-board" },
          ...(variant === "Cricket" ? [{ id: "player-c", boardId: "hardware-board" }] : [])],
        gameScores: variant === "Cricket" ? [...scores, 0] : scores, settings: { outMode: "Double Out", mode: "standard" },
        turns: [{ id: `turn-${turn}`, playerId: player === 0 ? "player-a" : "player-b", throws }],
      };
    };
    api.publish = () => api.runtime.context.gameState.applyMatch(api.buildMatch());
    api.replaceHost = (variant) => {
      document.querySelector("main").innerHTML = api.hosts[variant] + api.boardHtml;
      if (variant === "X01") {
        const card = document.querySelector("main .overflow-clip");
        const second = card.cloneNode(true);
        second.querySelector(".font-display").textContent = "PLAYER 2";
        card.after(second);
      }
      const badge = document.createElement("div");
      badge.id = "ad-ext-game-variant";
      badge.textContent = variant;
      document.querySelector("main").prepend(badge);
      api.writeHost();
    };
    api.replaceHost("X01");
    const enabled = new Set(["checkout-score-highlight", "checkout-target-highlights", "tv-board-zoom",
      "cricket-target-highlighter", "cricket-grid-status-effects"]);
    api.runtime = api.createBootstrap({ windowRef: window, documentRef: document,
      featureDefinitions: api.defaultFeatureDefinitions.filter((entry) => enabled.has(entry.featureKey)),
      config: { featureToggles: { checkoutScoreHighlight: true, checkoutTargetHighlights: true,
        tvBoardZoom: true, cricketTargetHighlighter: true, cricketGridStatusEffects: true }, features: {
        checkoutScoreHighlight: { enabled: true, effect: "grow-only", triggerSource: "score-only" },
        checkoutTargetHighlights: { enabled: true, targetSelectionMode: "next" },
        tvBoardZoom: { enabled: true, zoomLevel: 1.75, zoomSpeed: "schnell", zoomStyle: "standard",
          checkoutZoomEnabled: true, checkoutZoomTarget: "route-first", t20SetupZoomEnabled: false },
        cricketTargetHighlighter: { enabled: true, showOpenObjectives: true, showDeadObjectives: true },
        cricketGridStatusEffects: { enabled: true },
      } },
    });
    api.runtime.start();
    api.publish();
  }, { x01: fixtures.x01, cricket: fixtures.cricket, board: fixtures.board });
}

export async function setVisit(page, patch, { publish = true, writeHost = true } = {}) {
  await page.evaluate(({ patch, publish, writeHost }) => {
    const api = window.matchRecovery;
    Object.assign(api.visit, patch);
    if (writeHost) api.writeHost();
    if (publish) api.publish();
  }, { patch, publish, writeHost });
}

export async function expectCheckout(page, expect, { target, score, player = 0 }) {
  await expect(page.locator("#ad-ext-checkout-targets")).toHaveCount(1);
  await expect(page.locator("#ad-ext-checkout-targets .ad-ext-checkout-target")).toHaveCount(1);
  const shape = page.locator(`#ad-ext-checkout-targets .ad-ext-checkout-target[data-target-ring="D"][data-target-value="${target}"]`);
  await expect(shape).toHaveCount(1);
  await expect(shape).toBeVisible();
  await expect(page.locator(".ad-ext-checkout-possible")).toHaveCount(1);
  await expect(page.locator(".ad-ext-checkout-possible")).toHaveText(String(score));
  await expect.poll(() => page.evaluate((index) => {
    const api = window.matchRecovery;
    return api.readModernMatchSurface(document, window).players[index].scoreNode.classList.contains("ad-ext-checkout-possible");
  }, player)).toBe(true);
  await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('[aria-label="Dartboard"] svg')]
    .some((node) => node.style.transform.includes("scale(1.75)")))).toBe(true);
}

export async function stopMatchRuntime(page) {
  const resources = await page.evaluate(() => {
    const runtime = window.matchRecovery?.runtime;
    if (!runtime) return null;
    runtime.stop();
    return {
      observers: runtime.context.registries.observers.size(),
      listeners: runtime.context.registries.listeners.size(),
      failures: Object.values(runtime.getSnapshot().features).filter((feature) => feature.failure),
    };
  });
  if (resources) expect(resources).toEqual({ observers: 0, listeners: 0, failures: [] });
  expect(browserErrors.get(page) || []).toEqual([]);
}

export async function readZoomTransform(page) {
  return page.evaluate(() => [...document.querySelectorAll('[aria-label="Dartboard"] svg')]
    .map((node) => node.style.transform).filter(Boolean));
}

// Allow native observer delivery and its scheduled RAF render to finish. This
// is a scheduling barrier, not a timed animation or performance expectation.
export async function settleMatch(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function expectNoCheckout(page) {
  await expect(page.locator("#ad-ext-checkout-targets .ad-ext-checkout-target, .ad-ext-checkout-possible, .ad-ext-tv-board-zoom")).toHaveCount(0);
  await expect.poll(() => readZoomTransform(page)).toEqual([]);
}

export async function deliverMatchFrame(page, match) {
  await page.evaluate((snapshot) => {
    const event = new MessageEvent("message", { data: JSON.stringify({
      channel: "autodarts.matches", topic: `${snapshot.id}.state`, data: snapshot,
    }) });
    Object.defineProperty(event, "currentTarget", { value: Object.create(WebSocket.prototype) });
    // Reading the native getter delivers the frame through the production
    // interception, exactly as in the existing Tools/WebSocket combination test.
    JSON.parse(event.data);
  }, match);
}
