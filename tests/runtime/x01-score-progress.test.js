import test from "node:test";
import assert from "node:assert/strict";

import {
  WIDTH_PROPERTY,
  createScoreProgressState,
  resolveStartScore,
  syncScoreProgress,
} from "../../src/features/x01-score-progress/logic.js";
import { mountX01ScoreProgress } from "../../src/features/x01-score-progress/index.js";
import {
  ACTIVE_CLASS,
  HOST_SELECTOR,
  INACTIVE_CLASS,
  buildStyleText,
} from "../../src/features/x01-score-progress/style.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPlayerCard(documentRef, score, { active = false } = {}) {
  const cardNode = documentRef.createElement("div");
  cardNode.classList.add("ad-ext-player");
  if (active) {
    cardNode.classList.add("ad-ext-player-active");
  }

  const stackNode = documentRef.createElement("div");
  stackNode.classList.add("chakra-stack");

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreNode.textContent = String(score);

  stackNode.appendChild(scoreNode);
  cardNode.appendChild(stackNode);

  return {
    cardNode,
    scoreNode,
    stackNode,
  };
}

test("resolveStartScore falls back to selected DOM controls on match routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const selectedButton = documentRef.createElement("button");
  selectedButton.setAttribute("aria-pressed", "true");
  selectedButton.textContent = "Best of 5 / 701";
  documentRef.main.appendChild(selectedButton);

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-701",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, 701);
});

test("resolveStartScore resolves from variant strip sibling text on match routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const startBadge = documentRef.createElement("span");
  startBadge.textContent = "501";
  documentRef.main.insertBefore(startBadge, documentRef.suggestionElement);

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-variant-strip",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, 501);
});

test("syncScoreProgress renders active and inactive bars from the X01 start score", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const activePlayer = createPlayerCard(documentRef, 170, { active: true });
  const inactivePlayer = createPlayerCard(documentRef, 251);
  playerDisplay.appendChild(activePlayer.cardNode);
  playerDisplay.appendChild(inactivePlayer.cardNode);

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: { designPreset: "glass" },
      gameState: {
        getSnapshot: () => ({
          topic: "match-501",
          match: {
            id: "match-501",
            variant: "X01 501",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(result.startScore, 501);
  assert.equal(result.renderedCards, 2);
  assert.equal(playerDisplay.querySelectorAll(HOST_SELECTOR).length, 2);

  const activeHost = activePlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(activeHost);
  assert.equal(activePlayer.stackNode.children[1], activeHost);
  assert.equal(activeHost.classList.contains(ACTIVE_CLASS), true);
  assert.equal(activeHost.classList.contains("ad-ext-x01-score-progress--preset-glass"), true);
  assert.equal(activeHost.style.getPropertyValue(WIDTH_PROPERTY), "33.93%");

  const inactiveHost = inactivePlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(inactiveHost);
  assert.equal(inactivePlayer.stackNode.children[1], inactiveHost);
  assert.equal(inactiveHost.classList.contains(INACTIVE_CLASS), true);
  assert.equal(inactiveHost.classList.contains("ad-ext-x01-score-progress--preset-glass"), true);
  assert.equal(inactiveHost.style.getPropertyValue(WIDTH_PROPERTY), "50.10%");
});

test("syncScoreProgress clears stale bars outside X01 match contexts", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const activePlayer = createPlayerCard(documentRef, 170, { active: true });
  playerDisplay.appendChild(activePlayer.cardNode);

  const state = createScoreProgressState();

  syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: { designPreset: "signal" },
      gameState: {
        getSnapshot: () => ({
          topic: "match-501",
          match: {
            id: "match-501",
            variant: "501",
          },
        }),
      },
    },
    state
  );

  assert.equal(playerDisplay.querySelectorAll(HOST_SELECTOR).length, 1);

  windowRef.history.pushState({}, "", "/lobbies");
  documentRef.variantElement.textContent = "Cricket";

  const cleared = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: { designPreset: "signal" },
      gameState: {
        getSnapshot: () => ({
          topic: "match-cricket",
          match: {
            id: "match-cricket",
            variant: "Cricket",
          },
        }),
      },
    },
    state
  );

  assert.equal(cleared.startScore, null);
  assert.equal(cleared.renderedCards, 0);
  assert.equal(playerDisplay.querySelectorAll(HOST_SELECTOR).length, 0);
});

test("syncScoreProgress exposes debug reason when start score cannot be resolved", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        designPreset: "signal",
        debug: true,
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-x01-no-start",
          match: {
            id: "match-x01-no-start",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(result.startScore, null);
  assert.equal(result.renderedCards, 0);
  assert.equal(result.debug.reason, "missing-start-score");
  assert.equal(result.debug.startScoreSource, "unresolved");
  assert.equal(result.debug.cardCount, 0);
  assert.equal(result.debug.hostCountAfterCleanup, 0);
});

test("syncScoreProgress includes sampled card diagnostics in debug mode", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const activePlayer = createPlayerCard(documentRef, 170, { active: true });
  const inactivePlayer = createPlayerCard(documentRef, 251);
  playerDisplay.appendChild(activePlayer.cardNode);
  playerDisplay.appendChild(inactivePlayer.cardNode);

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        designPreset: "glass",
        debug: true,
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-501-debug",
          match: {
            id: "match-501-debug",
            variant: "X01 501",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(result.debug.reason, "rendered");
  assert.equal(result.debug.startScore, 501);
  assert.equal(result.debug.startScoreSource, "snapshot-variant");
  assert.equal(result.debug.cardCount, 2);
  assert.equal(result.debug.renderedCards, 2);
  assert.equal(result.debug.sampledCards.length, 2);
  assert.equal(result.debug.sampledCards[0].hostWidth, "33.93%");
  assert.equal(result.debug.sampledCards[1].hostWidth, "50.10%");
});

test("mountX01ScoreProgress emits detailed debug warning payloads", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/debug-case",
  });
  documentRef.variantElement.textContent = "X01";

  const logs = [];
  const warnings = [];
  const cleanup = mountX01ScoreProgress({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: {
        registerMutationObserver() {},
        disconnect() {},
      },
    },
    gameState: {
      getSnapshot: () => ({
        match: {
          id: "debug-match",
          variant: "X01",
        },
      }),
      subscribe: () => () => {},
    },
    config: {
      getFeatureConfig: () => ({
        designPreset: "signal",
        debug: true,
      }),
    },
    featureDebug: {
      enabled: true,
      log: (...args) => logs.push(args),
      warn: (...args) => warnings.push(args),
    },
  });

  await wait(5);
  cleanup();

  assert.equal(logs.length >= 0, true);
  assert.equal(warnings.length > 0, true);
  assert.match(String(warnings[0][0] || ""), /reason="missing-start-score"/);
  assert.match(String(warnings[0][0] || ""), /payload=\{.*"reason":"missing-start-score"/s);
  assert.equal(warnings[0][1]?.reason, "missing-start-score");
  assert.equal(Array.isArray(warnings[0][1]?.sampledCards), true);
});

test("score-progress style reserves a dedicated player-card row for the bar", () => {
  const css = buildStyleText();

  assert.match(
    css,
    /\[data-ad-ext-x01-score-progress='true'\]\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-row:\s*3;[^}]*flex:\s*0\s+0\s+100%;/s
  );
});
