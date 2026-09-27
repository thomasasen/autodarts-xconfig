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
        import {
          buildThemeGlobalTypographyStyleText,
        } from "./src/features/themes/global-typography/style.js";
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
          buildThemeGlobalTypographyStyleText,
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

test("remaining score profiles target every player card without scaling adjacent content", async ({ page }) => {
  await openFixture(page, "x01-match-modern.html");
  const result = await page.evaluate(() => {
    const api = globalThis.__autodartsDomContract;
    const main = document.querySelector("main");
    const firstCard = main.querySelector(".overflow-clip");
    const secondCard = firstCard.cloneNode(true);
    secondCard.classList.remove("bg-raspberry-slush-diagonal");
    secondCard.classList.add("bg-black-80");
    secondCard.querySelector('[role="button"]')?.removeAttribute("role");
    firstCard.after(secondCard);

    const thirdCard = secondCard.cloneNode(true);
    const fourthCard = secondCard.cloneNode(true);
    secondCard.after(thirdCard, fourthCard);
    const cards = Array.from(main.querySelectorAll(".overflow-clip"));
    const scores = cards.map((card) => card.querySelector(".font-number.overflow-hidden"));
    cards.forEach((card) => {
      card.style.display = "block";
      card.style.width = "180px";
      card.style.height = "160px";
    });
    scores.forEach((score) => {
      score.style.display = "block";
      score.style.width = "100%";
      score.style.fontSize = "72px";
      score.style.lineHeight = "1";
      score.style.textAlign = "center";
    });
    const name = firstCard.querySelector(".font-display");
    const checkout = firstCard.querySelector(".text-checkout-suggestion");
    const turnTotal = main.querySelector(".bg-surface-surface > .font-number");
    name.style.fontSize = "18px";
    checkout.style.fontSize = "20px";
    turnTotal.style.fontSize = "40px";

    const styleNode = document.createElement("style");
    document.head.append(styleNode);
    const applyProfile = (remainingScoreSize) => {
      styleNode.textContent = api.buildThemeGlobalTypographyStyleText({
        fontPreset: "system",
        applyTo: ["scores"],
        remainingScoreSize,
      });
    };
    const fontSize = (node) => Number.parseFloat(getComputedStyle(node).fontSize);
    const nativeSizes = {
      score: fontSize(scores[0]),
      name: fontSize(name),
      checkout: fontSize(checkout),
      turnTotal: fontSize(turnTotal),
    };

    applyProfile("standard");
    const standardScoreSizes = scores.map(fontSize);
    applyProfile("very-large");
    const veryLargeScoreSizes = scores.map(fontSize);
    const adjacentSizes = {
      name: fontSize(name),
      checkout: fontSize(checkout),
      turnTotal: fontSize(turnTotal),
    };

    const scoreTokens = ["1", "40", "101", "170", "501"];
    const fontFamilies = [
      '"Segoe UI", sans-serif',
      '"Aldrich", "Segoe UI", sans-serif',
      '"Arial Black", Impact, sans-serif',
    ];
    const overflowCases = [];
    for (const fontFamily of fontFamilies) {
      for (const scoreToken of scoreTokens) {
        scores[0].textContent = scoreToken;
        scores[0].style.setProperty("font-family", fontFamily, "important");
        overflowCases.push({
          fontFamily,
          scoreToken,
          fits: scores[0].scrollWidth <= firstCard.clientWidth,
        });
      }
    }

    const beforeSwitch = api.readModernMatchSurface(document, window);
    firstCard.classList.remove("bg-raspberry-slush-diagonal");
    firstCard.classList.add("bg-black-80");
    secondCard.classList.remove("bg-black-80");
    secondCard.classList.add("bg-grey-slush-diagonal");
    const afterSwitch = api.readModernMatchSurface(document, window);

    applyProfile("auto");
    const restoredScoreSize = fontSize(scores[1]);
    return {
      playerCount: beforeSwitch.players.length,
      activeBefore: beforeSwitch.players.findIndex((player) => player.active),
      activeAfter: afterSwitch.players.findIndex((player) => player.active),
      standardScoreSizes,
      veryLargeScoreSizes,
      nativeSizes,
      adjacentSizes,
      allOverflowCasesFit: overflowCases.every((entry) => entry.fits),
      restoredScoreSize,
    };
  });

  expect(result.playerCount).toBe(4);
  expect(result.activeBefore).toBe(0);
  expect(result.activeAfter).toBe(1);
  expect(new Set(result.standardScoreSizes).size).toBe(1);
  expect(new Set(result.veryLargeScoreSizes).size).toBe(1);
  expect(result.veryLargeScoreSizes[0]).toBeGreaterThan(result.standardScoreSizes[0]);
  expect(result.adjacentSizes).toEqual({
    name: result.nativeSizes.name,
    checkout: result.nativeSizes.checkout,
    turnTotal: result.nativeSizes.turnTotal,
  });
  expect(result.allOverflowCasesFit).toBe(true);
  expect(result.restoredScoreSize).toBe(result.nativeSizes.score);
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
