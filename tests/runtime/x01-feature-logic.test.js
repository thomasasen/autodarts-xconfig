import test from "node:test";
import assert from "node:assert/strict";

import * as variantRules from "../../src/domain/variant-rules.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { computeShouldHighlight } from "../../src/features/checkout-score-pulse/logic.js";
import { computeZoomIntent } from "../../src/features/tv-board-zoom/logic.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function createX01GameState(overrides = {}) {
  const outMode = String(overrides.outMode || "");
  const activeScore = Number.isFinite(overrides.activeScore) ? overrides.activeScore : null;
  const activeThrows = Array.isArray(overrides.activeThrows) ? overrides.activeThrows : [];
  const activeTurn = overrides.activeTurn || {
    id: "turn-1",
    playerId: "player-1",
    throws: activeThrows,
  };

  return {
    isX01Variant: () => true,
    getActiveScore: () => activeScore,
    getOutMode: () => outMode,
    getActiveTurn: () => activeTurn,
    getActiveThrows: () => activeThrows,
  };
}

function createZoomState() {
  return {
    holdUntilTs: 0,
    activeIntent: null,
    lastTurnId: "",
    lastThrowCount: -1,
  };
}

test("checkout-score-pulse score logic respects the active out mode", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.suggestionElement.textContent = "";
  documentRef.activeScoreElement.textContent = "159";

  const doubleShouldHighlight = computeShouldHighlight({
    documentRef,
    gameState: createX01GameState({
      activeScore: 159,
      outMode: "Double Out",
    }),
    variantRules,
    x01Rules,
    triggerSource: "score-only",
  });

  const masterShouldHighlight = computeShouldHighlight({
    documentRef,
    gameState: createX01GameState({
      activeScore: 159,
      outMode: "Master Out",
    }),
    variantRules,
    x01Rules,
    triggerSource: "score-only",
  });

  assert.equal(doubleShouldHighlight, false);
  assert.equal(masterShouldHighlight, true);
});

test("checkout-score-pulse interprets explicit suggestion finishes per out mode", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.suggestionElement.textContent = "T20";

  const doubleSuggestion = computeShouldHighlight({
    documentRef,
    gameState: createX01GameState({
      activeScore: 60,
      outMode: "Double Out",
    }),
    variantRules,
    x01Rules,
    triggerSource: "suggestion-only",
  });

  const masterSuggestion = computeShouldHighlight({
    documentRef,
    gameState: createX01GameState({
      activeScore: 60,
      outMode: "Master Out",
    }),
    variantRules,
    x01Rules,
    triggerSource: "suggestion-only",
  });

  assert.equal(doubleSuggestion, false);
  assert.equal(masterSuggestion, true);
});

test("checkout-score-pulse suggestion-first falls back to out-mode-aware score math", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.suggestionElement.textContent = "";
  documentRef.activeScoreElement.textContent = "20";

  const shouldHighlight = computeShouldHighlight({
    documentRef,
    gameState: createX01GameState({
      activeScore: 20,
      outMode: "Straight Out",
    }),
    variantRules,
    x01Rules,
    triggerSource: "suggestion-first",
  });

  assert.equal(shouldHighlight, true);
});

test("tv-board-zoom uses out-mode-aware one-dart checkout targets", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const doubleIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 60,
      outMode: "Double Out",
      activeThrows: [],
    }),
    x01Rules,
    state: createZoomState(),
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 1000,
  });

  const masterIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 60,
      outMode: "Master Out",
      activeThrows: [],
    }),
    x01Rules,
    state: createZoomState(),
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 1000,
  });

  assert.equal(doubleIntent, null);
  assert.deepEqual(masterIntent, {
    reason: "checkout",
    segment: "T20",
  });
});

test("tv-board-zoom keeps the third-dart T20 guard aligned with bust rules", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const activeThrows = [
    { segment: { name: "T20" } },
    { segment: { name: "T20" } },
  ];

  const doubleIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 61,
      outMode: "Double Out",
      activeThrows,
    }),
    x01Rules,
    state: createZoomState(),
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 2000,
  });

  const straightIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 61,
      outMode: "Straight Out",
      activeThrows,
    }),
    x01Rules,
    state: createZoomState(),
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 2000,
  });

  assert.equal(doubleIntent, null);
  assert.deepEqual(straightIntent, {
    reason: "t20-setup",
    segment: "T20",
  });
});
