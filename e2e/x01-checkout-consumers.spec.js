/* global CSS, MutationObserver, URL, document, localStorage, navigator, process, requestAnimationFrame, setTimeout, window */
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";
import { openMatchRuntime, setVisit, expectCheckout, stopMatchRuntime, readZoomTransform,
  settleMatch, expectNoCheckout, deliverMatchFrame } from "./helpers/match-runtime.js";

let bundle;
let fixtureHtml;

test.beforeAll(async () => {
  const [matchHtml, boardHtml, result] = await Promise.all([
    readFile(new URL("../tests/fixtures/autodarts/x01-match-modern.html", import.meta.url), "utf8"),
    readFile(new URL("../tests/fixtures/autodarts/dartboard-modern.html", import.meta.url), "utf8"),
    build({
      stdin: {
        contents: `
          import { createDomGuards } from "./src/core/dom-guards.js";
          import { createListenerRegistry } from "./src/core/listener-registry.js";
          import { createObserverRegistry } from "./src/core/observer-registry.js";
          import * as x01Rules from "./src/domain/x01-rules.js";
          import { initializeCheckoutTargetHighlights } from "./src/features/checkout-target-highlights/index.js";
          import { initializeTvBoardZoom } from "./src/features/tv-board-zoom/index.js";
          import { createTurnLifecycle } from "./src/features/shared/turn-lifecycle.js";
          import { createRafScheduler } from "./src/shared/raf-scheduler.js";
          window.checkoutConsumers = {
            createDomGuards,
            createListenerRegistry,
            createObserverRegistry,
            createRafScheduler,
            createTurnLifecycle,
            initializeCheckoutTargetHighlights,
            initializeTvBoardZoom,
            x01Rules,
          };
        `,
        resolveDir: process.cwd(),
      },
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      target: "chrome111",
      loader: USERSCRIPT_ASSET_LOADERS,
    }),
  ]);

  const board = /<div role="img" aria-label="Dartboard"[\s\S]*?<\/div>\s*<\/main>/u
    .exec(boardHtml)?.[0]
    ?.replace(/\s*<\/main>\s*$/u, "") || "";
  fixtureHtml = matchHtml.replace("</main>", `${board}</main>`);
  bundle = result.outputFiles[0].text;
});

test("Chromium observers keep checkout targets and TV zoom aligned through darts two and three", async ({ page }) => {
  await page.route("http://xconfig.test/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: fixtureHtml });
  });
  await page.goto("http://xconfig.test/matches/modern-match");
  await page.addStyleTag({ content: `
    main, main * { min-width: 1px; min-height: 1px; }
    [role="img"][aria-label="Dartboard"] { position: relative; width: 500px; height: 500px; }
    [role="img"][aria-label="Dartboard"] > svg { position: absolute; inset: 0; width: 500px; height: 500px; }
  ` });
  await page.addScriptTag({ content: bundle });

  const result = await page.evaluate(async () => {
    const api = window.checkoutConsumers;
    const main = document.querySelector("main");
    const semanticHost = document.createElement("div");
    semanticHost.className = "semantic-host";
    let semanticWrapper = document.createElement("section");
    semanticWrapper.className = "semantic-wrapper";
    const scoreCard = main.querySelector(".overflow-clip");
    const initialTurnSurface = Array.from(main.querySelectorAll(".bg-surface-surface"))
      .find((node) => node.children.length === 2);
    scoreCard.before(semanticHost);
    semanticWrapper.append(scoreCard, initialTurnSurface);
    semanticHost.appendChild(semanticWrapper);

    const subscribers = new Set();
    const state = {
      boardId: "hardware-board",
      score: 121,
      throws: [],
      route: ["T20", "S25", "D18"],
    };
    const toThrow = (segment) => ({
      segment: { name: segment },
      score: api.x01Rules.parseSegment(segment)?.score || 0,
    });
    const gameState = {
      isX01Variant: () => true,
      getVariant: () => "X01",
      getActiveScore: () => state.score,
      getOutMode: () => "Double Out",
      getActiveThrows: () => state.throws.map(toThrow),
      getActiveTurn: () => ({ id: "turn-1", playerId: "player-1", throws: state.throws.map(toThrow) }),
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({
        topic: "modern-match.state",
        match: {
          id: "modern-match",
          currentGameId: "game-1",
          variant: "X01",
          player: 0,
          players: [{ id: "player-1", boardId: state.boardId }],
          settings: { outMode: "Double Out" },
        },
        activePlayerIndex: 0,
      }),
      subscribe(listener) {
        subscribers.add(listener);
        return () => subscribers.delete(listener);
      },
    };
    const registries = {
      observers: api.createObserverRegistry(),
      listeners: api.createListenerRegistry(),
    };
    const debugEvents = [];
    const context = {
      documentRef: document,
      windowRef: window,
      gameState,
      domain: { x01Rules: api.x01Rules },
      x01Rules: api.x01Rules,
      domGuards: api.createDomGuards({ documentRef: document }),
      registries,
      helpers: {
        createRafScheduler: (callback) => api.createRafScheduler(callback, { windowRef: window }),
      },
      config: {
        getFeatureConfig(key) {
          return key === "tvBoardZoom"
            ? {
                zoomLevel: 1.75,
                zoomSpeed: "schnell",
                zoomStyle: "standard",
                checkoutZoomEnabled: true,
                checkoutZoomTarget: "route-first",
                t20SetupZoomEnabled: true,
              }
            : { targetSelectionMode: "next" };
        },
      },
      featureDebug: {
        enabled: true,
        log: (_summary, payload) => debugEvents.push(payload),
        warn: (_summary, payload) => debugEvents.push(payload),
      },
    };
    context.turnLifecycle = api.createTurnLifecycle(context);
    context.turnLifecycle.start();

    const cleanupTargets = api.initializeCheckoutTargetHighlights(context);
    const cleanupZoom = api.initializeTvBoardZoom(context);
    const mutationTypes = new Set();
    const mutationProbe = new MutationObserver((records) => {
      records.forEach((record) => mutationTypes.add(record.type));
    });
    mutationProbe.observe(document.querySelector("main"), {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    const waitForRender = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    };
    const getTurn = (rootNode = document) => {
      const surface = Array.from(rootNode.querySelectorAll(".bg-surface-surface"))
        .find((node) => node.children.length === 2);
      return {
        rows: Array.from(surface.children[0].children),
        total: surface.children[1],
      };
    };
    const setRow = (row, value, suggestion) => {
      row.classList.toggle("text-checkout-suggestion", suggestion);
      const span = document.createElement("span");
      span.textContent = value;
      row.replaceChildren(span);
    };
    const writeDomVisit = (rootNode, score, throws, route, scoreMutation) => {
      const scoreNode = rootNode.querySelector(".overflow-clip .font-number.overflow-hidden");
      if (scoreMutation === "characterData") {
        scoreNode.firstChild.data = String(score);
      } else {
        scoreNode.replaceChildren(document.createTextNode(String(score)));
      }
      const { rows, total } = getTurn(rootNode);
      const values = [...throws, ...route];
      rows.forEach((row, index) => setRow(row, values[index] || "", index >= throws.length));
      total.replaceChildren(document.createTextNode(String(121 - score)));
    };
    const setVisit = (score, throws, route, scoreMutation) => {
      state.score = score;
      state.throws = throws;
      state.route = route;
      subscribers.forEach((listener) => listener());
      writeDomVisit(document, score, throws, route, scoreMutation);
    };
    const replaceSemanticWrapper = (score, throws, route) => {
      state.score = score;
      state.throws = throws;
      state.route = route;
      const replacement = semanticWrapper.cloneNode(true);
      writeDomVisit(replacement, score, throws, route, "childList");
      semanticHost.replaceChildren(replacement);
      semanticWrapper = replacement;
    };
    const snapshot = () => {
      const overlay = document.getElementById("ad-ext-checkout-targets");
      const firstTarget = overlay?.children?.[0] || null;
      const board = document.querySelector('[role="img"][aria-label="Dartboard"]');
      const transformedLayer = Array.from(board.querySelectorAll("svg"))
        .find((node) => node.style.transform);
      const targetStyle = firstTarget ? window.getComputedStyle(firstTarget) : null;
      return {
        target: firstTarget
          ? `${firstTarget.dataset.targetRing}:${firstTarget.dataset.targetValue || ""}`
          : "",
        zoomed: Boolean(document.querySelector(".ad-ext-tv-board-zoom")),
        zoomNode: document.querySelector(".ad-ext-tv-board-zoom")?.getAttribute("class") || "",
        transform: transformedLayer?.style.transform || "",
        targetConnected: firstTarget?.isConnected === true,
        targetGeometry: firstTarget?.getAttribute("d") || firstTarget?.getAttribute("r") || "",
        targetOpacity: Number.parseFloat(targetStyle?.opacity || "0"),
        debug: debugEvents.filter((event) =>
          ["apply", "apply-missing-transform", "reset"].includes(event?.status)
        ).at(-1) || null,
      };
    };

    try {
      await waitForRender();
      const dartOne = snapshot();
      setVisit(61, ["T20"], ["S25", "D18"], "characterData");
      await waitForRender();
      const dartTwo = snapshot();
      setVisit(36, ["T20", "S25"], ["D18"], "childList");
      await waitForRender();
      const dartThree = snapshot();
      state.boardId = "";
      localStorage.removeItem("selectedBoard");
      subscribers.forEach((listener) => listener());
      await waitForRender();
      const missingBoardIdentity = snapshot();
      localStorage.setItem("selectedBoard", "hardware-board");
      subscribers.forEach((listener) => listener());
      await waitForRender();
      const restoredBoardIdentity = snapshot();
      replaceSemanticWrapper(40, ["T20", "T7"], ["D20"]);
      await waitForRender();
      const wrapperReplacement = snapshot();
      return {
        dartOne,
        dartTwo,
        dartThree,
        missingBoardIdentity,
        restoredBoardIdentity,
        wrapperReplacement,
        mutationTypes: Array.from(mutationTypes).sort(),
        browser: navigator.userAgent,
        platform: navigator.platform,
        capabilities: {
          mutationObserver: typeof MutationObserver === "function",
          resizeObserver: typeof ResizeObserver === "function",
          requestAnimationFrame: typeof requestAnimationFrame === "function",
          cssTransform: CSS.supports("transform", "scale(1.75)"),
        },
      };
    } finally {
      mutationProbe.disconnect();
      cleanupZoom();
      cleanupTargets();
      context.turnLifecycle.stop();
    }
  });

  expect(result.dartOne.target).toBe("T:20");
  expect(result.dartTwo.target).toBe("SB:");
  expect(result.dartThree.target).toBe("D:18");
  for (const dart of [result.dartOne, result.dartTwo, result.dartThree]) {
    expect(dart.zoomed).toBe(true);
    expect(dart.transform).toContain("scale(1.75)");
    expect(dart.debug?.status).toBe("apply");
    expect(dart.targetConnected).toBe(true);
    expect(dart.targetGeometry).not.toBe("");
    expect(dart.targetOpacity).toBeGreaterThan(0);
  }
  expect(result.missingBoardIdentity.zoomed).toBe(false);
  expect(result.missingBoardIdentity.transform).toBe("");
  expect(result.missingBoardIdentity.debug).toMatchObject({
    status: "reset",
    reason: "virtual-board-input",
  });
  expect(result.restoredBoardIdentity.zoomed).toBe(true);
  expect(result.restoredBoardIdentity.transform).toContain("scale(1.75)");
  expect(result.restoredBoardIdentity.debug?.status).toBe("apply");
  expect(result.wrapperReplacement.target).toBe("D:20");
  expect(result.wrapperReplacement.targetConnected).toBe(true);
  expect(result.wrapperReplacement.targetGeometry).not.toBe("");
  expect(result.wrapperReplacement.targetOpacity).toBeGreaterThan(0);
  expect(result.wrapperReplacement.zoomed).toBe(true);
  expect(result.wrapperReplacement.transform).toContain("scale(1.75)");
  expect(result.wrapperReplacement.debug).toMatchObject({ status: "apply", segment: "D20" });
  expect(result.mutationTypes).toEqual(expect.arrayContaining(["attributes", "characterData", "childList"]));
  expect(result.capabilities).toEqual({
    mutationObserver: true,
    resizeObserver: true,
    requestAnimationFrame: true,
    cssTransform: true,
  });
});

test.describe("checkout state recovery through native Chromium observers", () => {
  test.beforeEach(async ({ page }) => openMatchRuntime(page));
  test.afterEach(async ({ page }) => stopMatchRuntime(page));

  // Unlike rule tests, these assertions observe mounted consumers after DOM and
  // game-state updates, including real MutationObserver and RAF scheduling.
  test("undo restores D20 across targets, score highlight and checkout zoom", async ({ page }) => {
    await expectCheckout(page, expect, { target: 20, score: 40 });
    const initialZoom = await readZoomTransform(page);
    await setVisit(page, { scores: [20, 32], throws: [{ segment: { name: "S20" }, score: 20 }], route: ["D10"], total: "20" });
    await expectCheckout(page, expect, { target: 10, score: 20 });
    await expect.poll(() => readZoomTransform(page)).not.toEqual(initialZoom);
    await setVisit(page, { scores: [40, 32], throws: [], route: ["D20"], total: "0" });
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await expect.poll(() => readZoomTransform(page)).toEqual(initialZoom);
    await expect(page.locator('#ad-ext-checkout-targets [data-target-value="10"]')).toHaveCount(0);
  });

  test("first-dart Bust releases zoom and the next player owns the new D16 checkout", async ({ page }) => {
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await setVisit(page, { throws: [{ segment: { name: "T20" }, score: 60 }], route: [], total: "BUST" });
    await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('[aria-label="Dartboard"] svg')]
      .every((node) => !node.style.transform))).toBe(true);
    await setVisit(page, { player: 1, throws: [], route: ["D16"], total: "0", turn: 2 });
    await expectCheckout(page, expect, { target: 16, score: 32, player: 1 });
    await expect(page.locator('#ad-ext-checkout-targets [data-target-value="20"]')).toHaveCount(0);
    expect(await page.evaluate(() => window.matchRecovery.readModernMatchSurface(document, window)
      .players[0].scoreNode.textContent)).toBe("40");
  });

  test("unchanged checkout survives nested host replacement without a state notification", async ({ page }) => {
    await page.evaluate(() => {
      const main = document.querySelector("main");
      const host = document.createElement("section");
      host.id = "recovery-semantic-host";
      const wrapper = document.createElement("div");
      [...main.children].filter((node) => !node.matches('[aria-label="Dartboard"]')).forEach((node) => wrapper.append(node));
      host.append(wrapper);
      main.prepend(host);
    });
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await page.evaluate(() => {
      const wrapper = document.querySelector("#recovery-semantic-host > div");
      const replacement = wrapper.cloneNode(true);
      replacement.querySelectorAll(".ad-ext-checkout-possible").forEach((node) => {
        node.className = [...node.classList].filter((name) => !name.startsWith("ad-ext-")).join(" ");
      });
      wrapper.replaceWith(replacement);
    });
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await expect(page.locator("#recovery-semantic-host .ad-ext-checkout-possible")).toHaveCount(1);
    await setVisit(page, { scores: [20, 32], throws: [{ segment: { name: "S20" }, score: 20 }], route: ["D10"], total: "20" }, { publish: false });
    await expectCheckout(page, expect, { target: 10, score: 20 });
  });

  test("unchanged checkout binds to a new board after a missing-board gap", async ({ page }) => {
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await page.evaluate(() => document.querySelector('[aria-label="Dartboard"]').remove());
    await expect(page.locator("#ad-ext-checkout-targets")).toHaveCount(0);
    await page.evaluate(() => document.querySelector("main").insertAdjacentHTML("beforeend", window.matchRecovery.boardHtml));
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await expect(page.locator('[aria-label="Dartboard"] #ad-ext-checkout-targets')).toHaveCount(1);
  });

  test("configuration toggles restore one score highlight and zoom through three cycles", async ({ page }) => {
    for (let cycle = 0; cycle < 3; cycle++) {
      await expectCheckout(page, expect, { target: 20, score: 40 });
      for (const feature of ["checkout-score-highlight", "tv-board-zoom"]) {
        await page.evaluate((key) => window.matchRecovery.runtime.setFeatureEnabled(key, false), feature);
      }
      await setVisit(page, { scores: [20, 32], route: ["D10"] });
      await expect(page.locator('#ad-ext-checkout-targets .ad-ext-checkout-target[data-target-value="10"]')).toHaveCount(1);
      await expect(page.locator(".ad-ext-checkout-possible")).toHaveCount(0);
      await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(0);
      for (const feature of ["checkout-score-highlight", "tv-board-zoom"]) {
        await page.evaluate((key) => window.matchRecovery.runtime.setFeatureEnabled(key, true), feature);
      }
      await expectCheckout(page, expect, { target: 10, score: 20 });
      await setVisit(page, { scores: [40, 32], route: ["D20"] });
      await expectCheckout(page, expect, { target: 20, score: 40 });
    }
    const snapshot = await page.evaluate(() => window.matchRecovery.runtime.getSnapshot());
    expect(snapshot.features["tv-board-zoom"].config.zoomLevel).toBe(1.75);
    expect(snapshot.features["checkout-score-highlight"].config.effect).toBe("grow-only");
  });

  for (const order of ["score-first", "player-first"]) {
    test(`${order} host updates converge on the next player's checkout`, async ({ page }) => {
      await expectCheckout(page, expect, { target: 20, score: 40 });
      const first = order === "score-first" ? { scores: [40, 20], route: ["D10"] } : { player: 1, route: ["D16"] };
      await setVisit(page, first, { publish: false });
      // Separate rendering passes without assuming an atomic Autodarts update.
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await setVisit(page, { player: 1, scores: [40, 20], route: ["D10"], turn: 2 });
      await expectCheckout(page, expect, { target: 10, score: 20, player: 1 });
      await expect(page.locator('#ad-ext-checkout-targets [data-target-value="20"]')).toHaveCount(0);
    });
  }

  // These cases exercise lifecycle holds through real browser scheduling; rule
  // tests alone cannot prove that the mounted renderer releases a held transform.
  test("third-dart Bust holds the last checkout zoom until the next player", async ({ page }) => {
    const misses = [{ segment: { name: "MISS" }, score: 0 }, { segment: { name: "MISS" }, score: 0 }];
    await setVisit(page, { throws: misses });
    await settleMatch(page);
    await expectCheckout(page, expect, { target: 20, score: 40 });
    const heldZoom = await readZoomTransform(page);
    await setVisit(page, { throws: [...misses, { segment: { name: "T20" }, score: 60 }], route: [], total: "BUST" });
    await settleMatch(page);
    await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(1);
    expect(await readZoomTransform(page)).toEqual(heldZoom);
    await setVisit(page, { player: 1, scores: [40, 301], throws: [], route: [], total: "0", turn: 2 });
    await expectNoCheckout(page);
    await setVisit(page, { scores: [40, 32], route: ["D16"] });
    await expectCheckout(page, expect, { target: 16, score: 32, player: 1 });
    await expect.poll(() => readZoomTransform(page)).not.toEqual(heldZoom);
  });

  test("third-dart checkout holds zoom until a new leg clears the previous game", async ({ page }) => {
    const misses = [{ segment: { name: "MISS" }, score: 0 }, { segment: { name: "MISS" }, score: 0 }];
    await setVisit(page, { throws: misses });
    await settleMatch(page);
    await expectCheckout(page, expect, { target: 20, score: 40 });
    const heldZoom = await readZoomTransform(page);
    await setVisit(page, { scores: [0, 32], throws: [...misses, { segment: { name: "D20" }, score: 40 }], route: [], total: "WIN" });
    await settleMatch(page);
    await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(1);
    expect(await readZoomTransform(page)).toEqual(heldZoom);
    await setVisit(page, { gameId: "x01-next-leg", scores: [301, 301], throws: [], route: [], total: "0", turn: 1 });
    await expectNoCheckout(page);
    await setVisit(page, { scores: [32, 301], route: ["D16"] });
    await expectCheckout(page, expect, { target: 16, score: 32 });
    await expect(page.locator('#ad-ext-checkout-targets [data-target-value="20"]')).toHaveCount(0);
  });

  test("new match quarantines a late frame from the previous match and recovers", async ({ page }) => {
    await expectCheckout(page, expect, { target: 20, score: 40 });
    const previousMatch = await page.evaluate(() => window.matchRecovery.runtime.context.gameState.getSnapshot().match);
    await page.evaluate(() => {
      const api = window.matchRecovery;
      history.pushState({}, "", "/matches/next-match");
      Object.assign(api.visit, { matchId: "next-match", gameId: "next-game", scores: [301, 301], route: [] });
      api.replaceHost("X01");
      api.publish();
    });
    await expectNoCheckout(page);
    await deliverMatchFrame(page, previousMatch);
    expect(await page.evaluate(() => window.matchRecovery.runtime.context.gameState.getSnapshot().match.id)).toBe("modern-match");
    await settleMatch(page);
    await expectNoCheckout(page);
    await setVisit(page, { scores: [32, 301], route: ["D16"] });
    await expectCheckout(page, expect, { target: 16, score: 32 });
    expect(await page.evaluate(() => window.matchRecovery.runtime.context.gameState.getSnapshot().match.id)).toBe("next-match");
  });

  test("equal scores still move checkout ownership to the next player", async ({ page }) => {
    await setVisit(page, { scores: [40, 40] });
    await expectCheckout(page, expect, { target: 20, score: 40 });
    await setVisit(page, { player: 1, turn: 2 });
    await expectCheckout(page, expect, { target: 20, score: 40, player: 1 });
    await setVisit(page, { scores: [40, 20], throws: [{ segment: { name: "S20" }, score: 20 }], route: ["D10"], total: "20" });
    await expectCheckout(page, expect, { target: 10, score: 20, player: 1 });
    await expect(page.locator('#ad-ext-checkout-targets [data-target-value="20"]')).toHaveCount(0);
  });

  test("native correction click pauses zoom and a corrected dart resumes the new target", async ({ page }) => {
    await setVisit(page, { scores: [20, 32], throws: [{ segment: { name: "S20" }, score: 20 }], route: ["D10"], total: "20" });
    await expectCheckout(page, expect, { target: 10, score: 20 });
    const previousZoom = await readZoomTransform(page);
    await page.evaluate(() => {
      window.matchRecovery.findModernTurnSurface(document, window).throwRows[0].id = "recovery-correction-dart";
    });
    await page.locator("#recovery-correction-dart").click();
    await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(0);
    await expect.poll(() => readZoomTransform(page)).toEqual([]);
    await page.evaluate(() => window.matchRecovery.publish());
    await settleMatch(page);
    await expect(page.locator(".ad-ext-tv-board-zoom")).toHaveCount(0);
    // Correct the same dart: count remains one, segment and score change.
    await setVisit(page, { scores: [32, 32], throws: [{ segment: { name: "S8" }, score: 8 }], route: ["D16"], total: "8" });
    await expectCheckout(page, expect, { target: 16, score: 32 });
    await expect.poll(() => readZoomTransform(page)).not.toEqual(previousZoom);
  });

  for (const leadingSource of ["DOM", "state"]) {
    test(`${leadingSource}-first dart update reconciles delayed host and WebSocket data`, async ({ page }) => {
      await expectCheckout(page, expect, { target: 20, score: 40 });
      const previousMatch = await page.evaluate(() => window.matchRecovery.runtime.context.gameState.getSnapshot().match);
      const nextVisit = { scores: [20, 32], throws: [{ segment: { name: "S20" }, score: 20 }], route: ["D10"], total: "20" };
      const initialZoom = await readZoomTransform(page);
      await setVisit(page, nextVisit, { publish: false, writeHost: leadingSource === "DOM" });
      const nextMatch = await page.evaluate(() => window.matchRecovery.buildMatch());
      if (leadingSource === "state") await deliverMatchFrame(page, nextMatch);
      await expect(page.locator('#ad-ext-checkout-targets .ad-ext-checkout-target[data-target-value="10"]')).toHaveCount(1);
      await expect(page.locator('#ad-ext-checkout-targets [data-target-value="20"]')).toHaveCount(0);
      await expect.poll(() => readZoomTransform(page)).not.toEqual(initialZoom);
      if (leadingSource === "DOM") {
        // Re-deliver the old snapshot while the DOM already shows the new dart.
        await deliverMatchFrame(page, previousMatch);
        await settleMatch(page);
        await expectCheckout(page, expect, { target: 10, score: 20 });
        await deliverMatchFrame(page, nextMatch);
      } else {
        expect(await page.evaluate(() => window.matchRecovery.readModernMatchSurface(document, window).activeScore)).toBe(40);
        await page.evaluate(() => window.matchRecovery.writeHost());
      }
      await expectCheckout(page, expect, { target: 10, score: 20 });
      expect(await page.evaluate(() => window.matchRecovery.runtime.context.gameState.getActiveScore())).toBe(20);
    });
  }
});
