import test from "node:test";
import assert from "node:assert/strict";

import * as variantRules from "../../src/domain/variant-rules.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { computeShouldHighlight } from "../../src/features/checkout-score-pulse/logic.js";
import { computeZoomIntent, markManualZoomPause } from "../../src/features/tv-board-zoom/logic.js";
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
    stickyUntilTurnChange: false,
    stickyUntilLegEnd: false,
    manualPause: false,
    manualPauseThrowCount: -1,
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

test("tv-board-zoom does not force T20 setup zoom after only one dart", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "T20";
  const windowRef = createFakeWindow({ documentRef });

  const earlyIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 241,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-early-t20",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }],
      },
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

  assert.equal(earlyIntent, null);
});

test("tv-board-zoom allows T20 setup only for 2xT20 with sensible third dart", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "T20";
  const windowRef = createFakeWindow({ documentRef });

  const setupIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 121,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-double-t20",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
      },
    }),
    x01Rules,
    state: createZoomState(),
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 5100,
  });

  assert.deepEqual(setupIntent, { reason: "t20-setup", segment: "T20" });
});

test("tv-board-zoom does not use T20 setup when first two darts are mixed", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "T20";
  const windowRef = createFakeWindow({ documentRef });

  const mixedIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 161,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }, { segment: { name: "S20" } }],
      activeTurn: {
        id: "turn-mixed-t20",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }, { segment: { name: "S20" } }],
      },
    }),
    x01Rules,
    state: createZoomState(),
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 5150,
  });

  assert.equal(mixedIntent, null);
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

test("tv-board-zoom keeps T20 setup zoom after T20,T20,T20 until player change", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  const windowRef = createFakeWindow({ documentRef });
  const state = createZoomState();

  const secondDartIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 121,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-triple-t20",
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
    nowTs: 8100,
  });

  const thirdDartIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 61,
      outMode: "Double Out",
      activeThrows: [
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
      ],
      activeTurn: {
        id: "turn-triple-t20",
        playerId: "player-1",
        throws: [
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
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
    nowTs: 8200,
  });

  const stickyIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 61,
      outMode: "Double Out",
      activeThrows: [
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
        { segment: { name: "T20" } },
      ],
      activeTurn: {
        id: "turn-triple-t20",
        playerId: "player-1",
        throws: [
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
          { segment: { name: "T20" } },
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
    nowTs: 9800,
  });

  const nextPlayerIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 301,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-next-player",
        playerId: "player-2",
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
    nowTs: 9900,
  });

  assert.deepEqual(secondDartIntent, { reason: "t20-setup", segment: "T20" });
  assert.deepEqual(thirdDartIntent, { reason: "t20-setup", segment: "T20" });
  assert.deepEqual(stickyIntent, { reason: "t20-setup", segment: "T20" });
  assert.equal(nextPlayerIntent, null);
});

test("tv-board-zoom keeps checkout zoom after hit until leg end", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  const windowRef = createFakeWindow({ documentRef });
  const state = createZoomState();

  const preCheckoutIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-checkout",
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
    nowTs: 10000,
  });

  const checkoutHitIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 0,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "D20" } }],
      activeTurn: {
        id: "turn-checkout",
        playerId: "player-1",
        throws: [{ segment: { name: "D20" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 10100,
  });

  const legEndPendingIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 0,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-checkout-after-hit",
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
    nowTs: 10600,
  });

  const newLegIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 301,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-new-leg",
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
    nowTs: 11200,
  });

  assert.deepEqual(preCheckoutIntent, { reason: "checkout", segment: "D20" });
  assert.deepEqual(checkoutHitIntent, { reason: "checkout", segment: "D20" });
  assert.deepEqual(legEndPendingIntent, { reason: "checkout", segment: "D20" });
  assert.equal(newLegIntent, null);
});

test("tv-board-zoom pauses auto zoom after manual correction until throw count progresses", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  const windowRef = createFakeWindow({ documentRef });
  const state = createZoomState();

  const checkoutIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-manual-pause",
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
    nowTs: 12000,
  });

  markManualZoomPause(state, 0);

  const pausedIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
      activeThrows: [],
      activeTurn: {
        id: "turn-manual-pause",
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
    nowTs: 12100,
  });

  const resumedIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 20,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S20" } }],
      activeTurn: {
        id: "turn-manual-pause",
        playerId: "player-1",
        throws: [{ segment: { name: "S20" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 12200,
  });

  assert.deepEqual(checkoutIntent, { reason: "checkout", segment: "D20" });
  assert.equal(pausedIntent, null);
  assert.deepEqual(resumedIntent, { reason: "checkout", segment: "D10" });
});

test("tv-board-zoom zooms out on throw correction and stays paused until new throw progress", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  const windowRef = createFakeWindow({ documentRef });
  const state = createZoomState();

  const setupIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 121,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-correction",
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
    nowTs: 13000,
  });

  const correctionIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 181,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-correction",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 13100,
  });

  const pausedAfterCorrectionIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 181,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }],
      activeTurn: {
        id: "turn-correction",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 13200,
  });

  const resumedAfterProgressIntent = computeZoomIntent({
    gameState: createX01GameState({
      activeScore: 20,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "T20" } }, { segment: { name: "S20" } }],
      activeTurn: {
        id: "turn-correction",
        playerId: "player-1",
        throws: [{ segment: { name: "T20" } }, { segment: { name: "S20" } }],
      },
    }),
    x01Rules,
    state,
    documentRef,
    windowRef,
    featureConfig: {
      checkoutZoomEnabled: true,
    },
    nowTs: 13300,
  });

  assert.deepEqual(setupIntent, { reason: "t20-setup", segment: "T20" });
  assert.equal(correctionIntent, null);
  assert.equal(pausedAfterCorrectionIntent, null);
  assert.deepEqual(resumedAfterProgressIntent, { reason: "checkout", segment: "D10" });
});
