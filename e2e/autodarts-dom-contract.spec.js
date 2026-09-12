// @ts-check
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { build } from "esbuild";

const repositoryRoot = process.cwd();
const fixtureRoot = path.join(repositoryRoot, "tests", "fixtures", "autodarts");
const browserStyle = `
  html, body, main { display: block; width: 1200px; min-height: 800px; }
  main * { min-width: 1px; min-height: 1px; }
  svg, [role="img"][aria-label="Dartboard"] { display: block; width: 500px; height: 500px; }
  [hidden], [aria-hidden="true"], .hidden { display: none !important; }
  .invisible { visibility: hidden !important; }
`;

let contractBundle = "";

test.beforeAll(async () => {
  const bundleResult = await build({
    stdin: {
      contents: `
        import * as x01Rules from "./src/domain/x01-rules.js";
        import {
          readModernMatchSurface,
          readModernThrows,
        } from "./src/features/shared/x01-match-surface.js";
        import {
          createX01PlayerSurfaceObserverController,
          getX01PlayerSurfaceSnapshot,
        } from "./src/features/shared/x01-player-surface-adapter.js";
        import { readModernCricketGrid } from "./src/features/cricket-surface/modern-grid.js";
        import {
          findBoardSvgGroup,
          findBoardSvgRoot,
        } from "./src/shared/dartboard-svg.js";
        import { createObserverRegistry } from "./src/core/observer-registry.js";

        globalThis.__autodartsDomContract = {
          x01Rules,
          readModernMatchSurface,
          readModernThrows,
          createX01PlayerSurfaceObserverController,
          getX01PlayerSurfaceSnapshot,
          readModernCricketGrid,
          findBoardSvgGroup,
          findBoardSvgRoot,
          createObserverRegistry,
        };
      `,
      resolveDir: repositoryRoot,
      sourcefile: "autodarts-dom-contract-entry.js",
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome100"],
    write: false,
  });
  contractBundle = bundleResult.outputFiles[0].text;
});

async function openFixture(page, filename) {
  const html = await readFile(path.join(fixtureRoot, filename), "utf8");
  await page.setContent(html);
  await page.addStyleTag({ content: browserStyle });
  await page.addScriptTag({ content: contractBundle });
}

test("live-derived X01 fixture preserves the supported match-surface contract", async ({ page }) => {
  await openFixture(page, "x01-match-modern.html");
  const result = await page.evaluate(() => {
    const api = globalThis.__autodartsDomContract;
    const surface = api.readModernMatchSurface(document, window);
    return {
      variant: surface.variant,
      startScore: surface.startScore,
      outMode: surface.outMode,
      playerCount: surface.players.length,
      activePlayerCount: surface.players.filter((player) => player.active).length,
      activeScore: surface.activeScore,
      scoreComesFromPlayerCard: surface.playerCard?.contains(surface.scoreNode) === true,
      turnRowCount: surface.throwRows?.length,
      turnScoreToken: surface.turnScoreToken,
      recordedThrows: api.readModernThrows(surface, api.x01Rules)
        ?.map((entry) => entry.segment.name),
    };
  });

  expect(result).toEqual({
    variant: "X01",
    startScore: 121,
    outMode: "Double Out",
    playerCount: 1,
    activePlayerCount: 1,
    activeScore: 121,
    scoreComesFromPlayerCard: true,
    turnRowCount: 3,
    turnScoreToken: "0",
    recordedThrows: [],
  });
});

test("live-derived X01 fixture fails safe for ambiguous active players", async ({ page }) => {
  await openFixture(page, "x01-match-modern.html");
  const result = await page.evaluate(() => {
    const api = globalThis.__autodartsDomContract;
    const card = document.querySelector("main .overflow-clip");
    card.after(card.cloneNode(true));
    const surface = api.readModernMatchSurface(document, window);
    return {
      playerCount: surface.players.length,
      activePlayerCount: surface.players.filter((player) => player.active).length,
      hasSelectedCard: Boolean(surface.playerCard),
      activeScoreIsNaN: Number.isNaN(surface.activeScore),
    };
  });

  expect(result).toEqual({
    playerCount: 2,
    activePlayerCount: 2,
    hasSelectedCard: false,
    activeScoreIsNaN: true,
  });
});

test("live-derived X01 fixture keeps BUST on the native turn-total surface", async ({ page }) => {
  await openFixture(page, "x01-match-modern.html");
  const result = await page.evaluate(() => {
    const api = globalThis.__autodartsDomContract;
    const initial = api.readModernMatchSurface(document, window);
    initial.turnScoreNode.textContent = "BUST";
    const bust = api.readModernMatchSurface(document, window);
    return {
      sameTurnNode: bust.turnScoreNode === initial.turnScoreNode,
      turnScoreToken: bust.turnScoreToken,
      playerStillUnambiguous: bust.players.filter((player) => player.active).length === 1,
    };
  });

  expect(result).toEqual({
    sameTurnNode: true,
    turnScoreToken: "BUST",
    playerStillUnambiguous: true,
  });
});

test("modern player adapter rebinds after React replaces the fixture main surface", async ({ page }) => {
  await openFixture(page, "x01-match-modern.html");
  const result = await page.evaluate(async () => {
    const api = globalThis.__autodartsDomContract;
    const registry = api.createObserverRegistry();
    const changes = [];
    const cleanup = api.createX01PlayerSurfaceObserverController({
      documentRef: document,
      windowRef: window,
      observerRegistry: registry,
      MutationObserverRef: MutationObserver,
      includeModern: true,
      keyPrefix: "fixture-contract",
      onSurfaceChange(next, previous) {
        changes.push({ next, previous });
      },
    });
    const previousMain = document.querySelector("main");
    const nextMain = previousMain.cloneNode(true);
    previousMain.replaceWith(nextMain);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const snapshot = api.getX01PlayerSurfaceSnapshot(document, {
      includeModern: true,
      windowRef: window,
    });
    const summary = {
      changeCount: changes.length,
      reboundFromPrevious: changes.at(-1)?.previous === previousMain,
      reboundToNext: changes.at(-1)?.next === nextMain,
      snapshotUsesNext: snapshot.playerDisplayRoot === nextMain,
    };
    cleanup();
    return summary;
  });

  expect(result).toEqual({
    changeCount: 1,
    reboundFromPrevious: true,
    reboundToNext: true,
    snapshotUsesNext: true,
  });
});

test("live-derived Cricket fixture maps the flat host grid and excludes xConfig lookalikes", async ({ page }) => {
  await openFixture(page, "cricket-modern.html");
  const result = await page.evaluate(() => {
    const api = globalThis.__autodartsDomContract;
    const hostGrid = document.querySelector("main .grid");
    const first = api.readModernCricketGrid(document);

    const panel = document.createElement("section");
    panel.id = "ad-xconfig-panel-host";
    panel.append(hostGrid.cloneNode(true));
    hostGrid.before(panel);
    const withPanel = api.readModernCricketGrid(document);

    hostGrid.remove();
    panel.remove();
    const lookalike = document.createElement("div");
    lookalike.className = "grid";
    lookalike.innerHTML = "<div></div><div><span class='font-display'>PLAYER</span></div><div>20</div>";
    document.querySelector("main").append(lookalike);

    return {
      labels: first?.labels.map((entry) => entry.label),
      playerCount: first?.headers.length,
      playerCellsPerRow: first?.labels.map((entry) => first.cellsByLabel.get(entry.label).length),
      localPlayerIndex: first?.activePlayerIndex,
      ownPanelWasSkipped: withPanel?.root === hostGrid,
      invalidLookalikeRejected: api.readModernCricketGrid(document) === null,
    };
  });

  expect(result).toEqual({
    labels: ["20", "19", "18", "17", "16", "15", "BULL"],
    playerCount: 3,
    playerCellsPerRow: [3, 3, 3, 3, 3, 3, 3],
    localPlayerIndex: 0,
    ownPanelWasSkipped: true,
    invalidLookalikeRejected: true,
  });
});

test("live-derived Tactics fixture maps the column-major host grid", async ({ page }) => {
  await openFixture(page, "tactics-modern.html");
  const result = await page.evaluate(() => {
    const grid = globalThis.__autodartsDomContract.readModernCricketGrid(document);
    return {
      labels: grid?.labels.map((entry) => entry.label),
      playerCount: grid?.headers.length,
      playerCellsPerRow: grid?.labels.map((entry) => grid.cellsByLabel.get(entry.label).length),
      localPlayerIndex: grid?.activePlayerIndex,
      directChildCount: grid?.root.children.length,
    };
  });

  expect(result).toEqual({
    labels: ["20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "BULL"],
    playerCount: 3,
    playerCellsPerRow: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    localPlayerIndex: 0,
    directChildCount: 52,
  });
});

test("live-derived dartboard fixture wins over a decorative SVG without class coupling", async ({ page }) => {
  await openFixture(page, "dartboard-modern.html");
  const result = await page.evaluate(() => {
    const api = globalThis.__autodartsDomContract;
    const main = document.querySelector("main");
    const boardHost = main.querySelector('[role="img"][aria-label="Dartboard"]');
    const boardSvg = boardHost.querySelector("svg");
    boardHost.removeAttribute("class");
    boardSvg.removeAttribute("class");

    const decorative = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    decorative.setAttribute("viewBox", "0 0 1000 1000");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "900");
    group.append(circle);
    decorative.append(group);
    main.prepend(decorative);

    const snapshot = api.findBoardSvgGroup(document);
    return {
      selectedNativeSvg: snapshot?.svg === boardSvg,
      selectedNativeGroup: snapshot?.group === boardSvg.querySelector("g"),
      radius: snapshot?.radius,
      pathCount: snapshot?.group.querySelectorAll("path").length,
      sharedRootMatches: api.findBoardSvgRoot(document) === boardSvg,
    };
  });

  expect(result).toEqual({
    selectedNativeSvg: true,
    selectedNativeGroup: true,
    radius: 500,
    pathCount: 23,
    sharedRootMatches: true,
  });
});

test("Autodarts HTML fixtures contain no volatile URLs, IDs, or extension markup", async () => {
  const fixtureNames = (await readdir(fixtureRoot)).filter((name) => name.endsWith(".html"));
  expect(fixtureNames.sort()).toEqual([
    "cricket-modern.html",
    "dartboard-modern.html",
    "tactics-modern.html",
    "x01-match-modern.html",
  ]);

  for (const fixtureName of fixtureNames) {
    const html = await readFile(path.join(fixtureRoot, fixtureName), "utf8");
    expect(html, `${fixtureName} contains a URL`).not.toMatch(/https?:\/\//i);
    expect(html, `${fixtureName} contains a UUID`).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27,}/i);
    expect(html, `${fixtureName} contains volatile attributes`).not.toMatch(
      /\b(?:src|href|id|data-[\w-]+)=/i
    );
    expect(html, `${fixtureName} contains extension markup`).not.toMatch(/ad-ext-|adxconfig/i);
  }
});
