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

test("tv-board-zoom falls back to score checkout when suggestion is invalid or conflicting", () => {
  const conflictDocument = new FakeDocument();
  conflictDocument.suggestionElement.textContent = "D10";
  const conflictWindow = createFakeWindow({ documentRef: conflictDocument });

  const conflictIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
      activeThrows: [],
    }),
    x01Rules,
    state: createZoomState(),
    documentRef: conflictDocument,
    windowRef: conflictWindow,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 3000,
  });

  const invalidDocument = new FakeDocument();
  invalidDocument.suggestionElement.textContent = "ABC";
  const invalidWindow = createFakeWindow({ documentRef: invalidDocument });

  const invalidIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
      activeThrows: [],
    }),
    x01Rules,
    state: createZoomState(),
    documentRef: invalidDocument,
    windowRef: invalidWindow,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 3000,
  });

  assert.deepEqual(conflictIntent, {
    reason: "checkout",
    segment: "D20",
  });
  assert.deepEqual(invalidIntent, {
    reason: "checkout",
    segment: "D20",
  });
});

test("tv-board-zoom applies smart setup suggestion through the full turn", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "T19";
  const windowRef = createFakeWindow({ documentRef });
  const state = createZoomState();

  const firstIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 121,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-setup",
        playerId: "player-1",
        throws: [],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 4000,
  });

  const secondIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 102,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S19" } }],
      activeTurn: {
        id: "turn-setup",
        playerId: "player-1",
        throws: [{ segment: { name: "S19" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 4100,
  });

  const thirdIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 83,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S19" } }, { segment: { name: "S19" } }],
      activeTurn: {
        id: "turn-setup",
        playerId: "player-1",
        throws: [{ segment: { name: "S19" } }, { segment: { name: "S19" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 4200,
  });

  assert.deepEqual(firstIntent, { reason: "smart-setup", segment: "T19" });
  assert.deepEqual(secondIntent, { reason: "smart-setup", segment: "T19" });
  assert.deepEqual(thirdIntent, { reason: "smart-setup", segment: "T19" });
});

test("tv-board-zoom uses T20 fallback only above 170 when no suggestion is present", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  const windowRef = createFakeWindow({ documentRef });

  const highIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 171,
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
    nowTs: 5000,
  });

  const standardIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 170,
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
    nowTs: 5000,
  });

  assert.deepEqual(highIntent, { reason: "t20-setup", segment: "T20" });
  assert.equal(standardIntent, null);
});

test("tv-board-zoom keeps the long hold after the third dart stable", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  const windowRef = createFakeWindow({ documentRef });
  const state = createZoomState();

  const secondDartIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 61,
      outMode: "Straight Out",
      activeThrows: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-hold",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 6000,
  });

  const immediateThirdDartIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 1,
      outMode: "Straight Out",
      activeThrows: [
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
        { segment: { name: "S1" } },
      ],
      activeTurn: {
        id: "turn-hold",
        playerId: "player-1",
        throws: [
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
          { segment: { name: "S1" } },
        ],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 6050,
  });

  const heldIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 1,
      outMode: "Straight Out",
      activeThrows: [
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
        { segment: { name: "S1" } },
      ],
      activeTurn: {
        id: "turn-hold",
        playerId: "player-1",
        throws: [
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
          { segment: { name: "S1" } },
        ],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 7300,
  });

  const releasedIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 1,
      outMode: "Straight Out",
      activeThrows: [
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
        { segment: { name: "S1" } },
      ],
      activeTurn: {
        id: "turn-hold",
        playerId: "player-1",
        throws: [
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
          { segment: { name: "S1" } },
        ],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 7400,
  });

  assert.deepEqual(secondDartIntent, { reason: "t20-setup", segment: "T20" });
  assert.deepEqual(immediateThirdDartIntent, { reason: "t20-setup", segment: "T20" });
  assert.deepEqual(heldIntent, { reason: "t20-setup", segment: "T20" });
  assert.equal(releasedIntent, null);
});
