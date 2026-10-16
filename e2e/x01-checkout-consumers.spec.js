/* global CSS, MutationObserver, URL, document, localStorage, navigator, process, requestAnimationFrame, setTimeout, window */
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";

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
