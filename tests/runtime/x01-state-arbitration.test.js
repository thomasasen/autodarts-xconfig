import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { mountCheckoutScoreHighlight } from "../../src/features/checkout-score-highlight/index.js";
import { resolveCheckoutScoreTruth } from "../../src/features/checkout-score-highlight/logic.js";
import { HIGHLIGHT_CLASS } from "../../src/features/checkout-score-highlight/style.js";
import {
  initializeCheckoutTargetHighlights,
  resolveCheckoutBoardMutationReaction,
  resolveCheckoutTargetTruth,
} from "../../src/features/checkout-target-highlights/index.js";
import { OVERLAY_ID } from "../../src/features/checkout-target-highlights/style.js";
import { initializeTvBoardZoom } from "../../src/features/tv-board-zoom/index.js";
import { resolveTvBoardZoomTruth } from "../../src/features/tv-board-zoom/logic.js";
import { ZOOM_CLASS } from "../../src/features/tv-board-zoom/style.js";
import { resolveX01CheckoutContext } from "../../src/features/x01-checkout-context.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { createFakeTimerHarness } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

function toThrow(segment) {
  const parsed = x01Rules.parseSegment(segment);
  return {
    segment: { name: x01Rules.normalizeSegmentName(segment) },
    score: parsed?.score || 0,
  };
}

function createMutableGameState(options = {}) {
  const subscribers = new Set();
  const state = {
    matchId: String(options.matchId ?? "modern-match"),
    gameId: String(options.gameId ?? "game-1"),
    variant: String(options.variant || "X01"),
    score: Number(options.score ?? 60),
    outMode: String(options.outMode || "Double Out"),
    throws: (options.throws || []).map(toThrow),
    turnId: String(options.turnId || "turn-1"),
    playerIndex: Number(options.playerIndex ?? 0),
    playerId: String(options.playerId || "player-1"),
    includeMatchId: options.includeMatchId !== false,
  };
  const api = {
    isX01Variant: () => state.variant === "X01",
    getVariant: () => state.variant,
    getActiveScore: () => state.score,
    getOutMode: () => state.outMode,
    getActiveThrows: () => state.throws,
    getActiveTurn: () => ({
      id: state.turnId,
      playerId: state.playerId,
      throws: state.throws,
    }),
    getActivePlayerIndex: () => state.playerIndex,
    getSnapshot: () => ({
      match: {
        ...(state.includeMatchId ? { id: state.matchId } : {}),
        currentGameId: state.gameId,
        variant: state.variant,
        player: state.playerIndex,
        players: [{ id: state.playerId }, { id: "player-2" }],
        settings: { outMode: state.outMode },
      },
      topic: state.includeMatchId ? `${state.matchId}.state` : "",
      activePlayerIndex: state.playerIndex,
    }),
    subscribe(listener) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
  return {
    state,
    api,
    notify() {
      subscribers.forEach((listener) => listener());
    },
  };
}

function setOutMode(fixture, outMode) {
  const code = {
    "Straight Out": "SI-SO",
    "Double Out": "SI-DO",
    "Master Out": "SI-MO",
  }[outMode];
  fixture.header.children[2].textContent = code;
}

function createScenario(options = {}) {
  const fixture = createModernX01Fixture({
    base: options.base || 301,
    score: options.score ?? 60,
    throws: options.throws || [],
    route: options.route || ["T20"],
  });
  const game = createMutableGameState({
    score: options.score ?? 60,
    throws: options.throws || [],
    outMode: options.outMode || "Master Out",
    matchId: options.matchId,
    includeMatchId: options.includeMatchId,
  });
  setOutMode(fixture, game.state.outMode);
  return { ...fixture, gameState: game.api, game, state: game.state, x01Rules };
}

function semanticTruth(truth) {
  return {
    active: truth.active,
    actionable: truth.actionable,
    activeScore: Number.isFinite(truth.activeScore) ? truth.activeScore : null,
    outMode: truth.outMode,
    dartsRemaining: Number.isFinite(truth.dartsRemaining) ? truth.dartsRemaining : null,
    coherence: truth.coherence,
    matchId: truth.matchId,
  };
}

test("checkout targets observe native score, turn and header changes including text nodes", () => {
  const scenario = createScenario();
  const mutations = [
    { type: "characterData", target: { nodeType: 3, parentNode: scenario.score } },
    { type: "characterData", target: { nodeType: 3, parentNode: scenario.total } },
    { type: "characterData", target: { nodeType: 3, parentNode: scenario.variant } },
    { type: "attributes", target: scenario.card, attributeName: "class" },
    { type: "attributes", target: scenario.rows[0].row, attributeName: "class" },
    { type: "childList", target: scenario.score, addedNodes: [], removedNodes: [] },
    { type: "childList", target: scenario.slots, addedNodes: [], removedNodes: [] },
  ];
  for (const mutation of mutations) {
    assert.deepEqual(resolveCheckoutBoardMutationReaction([mutation]), {
      shouldSchedule: true,
      shouldInvalidateBoardCache: false,
    }, `${mutation.type} on native match surface`);
  }
  const unrelated = scenario.node(scenario.documentRef.main, "div", "", "unrelated");
  assert.equal(resolveCheckoutBoardMutationReaction([
    { type: "characterData", target: { nodeType: 3, parentNode: unrelated } },
  ]).shouldSchedule, false);
});

for (const mutationType of ["characterData", "childList", "attributes"]) {
  test(`checkout targets recover for darts two and three when native ${mutationType} updates complete a partial render`, () => {
    const scenario = createScenario({
      score: 121, throws: [], route: ["T20", "S25", "D18"], outMode: "Double Out",
    });
    const observers = createObserverRegistry();
    const cleanup = initializeCheckoutTargetHighlights({
      ...scenario,
      domGuards: createDomGuards({ documentRef: scenario.documentRef }),
      registries: { observers },
      domain: { x01Rules },
      config: { getFeatureConfig: () => ({ targetSelectionMode: "next" }) },
      helpers: { createRafScheduler: (callback) => ({ schedule: callback, cancel() {} }) },
    });
    function assertTarget(ring, value) {
      const overlay = scenario.documentRef.getElementById(OVERLAY_ID);
      assert.ok(overlay?.children.length, "checkout overlay is visible");
      assert.equal(overlay.children[0].dataset.targetRing, ring);
      assert.equal(overlay.children[0].dataset.targetValue, value === undefined ? undefined : String(value));
    }
    function updateVisit(score, throws, route) {
      scenario.score.textContent = String(score);
      scenario.setVisit(throws, route);
      const target = mutationType === "characterData"
        ? { nodeType: 3, parentNode: scenario.score }
        : mutationType === "attributes" ? scenario.rows[0].row : scenario.slots;
      observers.get("checkout-target-highlights:dom-observer").callback([
        { type: mutationType, target, attributeName: mutationType === "attributes" ? "class" : undefined },
      ]);
    }
    function startPartialVisit(score, throws, route) {
      scenario.state.score = score;
      scenario.state.throws = throws.map(toThrow);
      // The throw slots arrive before the DOM score. Both sources have changed,
      // so the shared resolver must temporarily suppress ambiguous targets.
      scenario.setVisit(throws, route);
      scenario.game.notify();
      assert.equal(scenario.documentRef.getElementById(OVERLAY_ID), null);
    }
    try {
      assertTarget("T", 20);
      startPartialVisit(61, ["T20"], ["S25", "D18"]);
      // Score catch-up has no additional game-state notification.
      updateVisit(61, ["T20"], ["S25", "D18"]);
      assertTarget("SB");
      startPartialVisit(36, ["T20", "S25"], ["D18"]);
      updateVisit(36, ["T20", "S25"], ["D18"]);
      assertTarget("D", 18);
    } finally {
      cleanup();
    }
  });
}

test("P0 state-first DOM-lag never reactivates the old multi-dart route", () => {
  const scenario = createScenario({
    score: 100,
    throws: [],
    route: ["T20", "D20"],
    outMode: "Double Out",
  });
  assert.equal(resolveX01CheckoutContext(scenario).coherence, "coherent");

  scenario.state.score = 40;
  scenario.state.throws = [toThrow("T20")];
  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "state-preferred");
  assert.equal(resolved.activeScore, 40);
  assert.equal(resolved.dartsRemaining, 2);
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D20"]);
  assert.notDeepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["T20", "D20"]);
});

test("P0 DOM-first state-lag keeps a direct one-dart finish", () => {
  const scenario = createScenario({
    score: 60,
    throws: [],
    route: ["S20", "D20"],
    outMode: "Double Out",
  });
  assert.equal(resolveX01CheckoutContext(scenario).coherence, "coherent");

  scenario.score.textContent = "40";
  scenario.setVisit(["S20"], ["D20"]);
  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "dom-preferred");
  assert.equal(resolved.activeScore, 40);
  assert.equal(resolved.dartsRemaining, 2);
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D20"]);
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, true);
});

test("P0 foreign match state is quarantined atomically", () => {
  const scenario = createScenario({
    score: 60,
    throws: [],
    route: ["T20"],
    outMode: "Master Out",
  });
  scenario.state.matchId = "previous-match";
  scenario.state.gameId = "old-game";
  scenario.state.score = 40;
  scenario.state.outMode = "Double Out";
  scenario.state.throws = [toThrow("S1"), toThrow("S1")];
  scenario.state.turnId = "old-turn";
  scenario.state.playerIndex = 1;
  scenario.state.playerId = "player-2";

  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "dom-preferred");
  assert.equal(resolved.gameStateUsable, false);
  assert.equal(resolved.activeScore, 60);
  assert.equal(resolved.outMode, "Master Out");
  assert.equal(resolved.throwCount, 0);
  assert.equal(resolved.dartsRemaining, 3);
  assert.equal(resolved.activePlayerIndex, 0);
  assert.equal(resolved.activeTurnId.startsWith("dom:modern-match:"), true);
  assert.equal(resolved.diagnostics.foreignMatchState, true);
});

test("P0 explicit Cricket DOM deactivates stale X01 state immediately", () => {
  const scenario = createScenario({ score: 40, route: ["D20"], outMode: "Double Out" });
  assert.equal(resolveX01CheckoutContext(scenario).actionable, true);

  scenario.variant.textContent = "Cricket";
  scenario.header.children[2].textContent = "Cricket";
  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.active, false);
  assert.equal(resolved.actionable, false);
  assert.equal(resolved.source, "dom-non-x01");
  assert.equal(resolved.checkoutSurface.authoritativeRouteSegments.length, 0);
  assert.equal(resolved.diagnostics.reason, "explicit-visible-non-x01");
});

test("P0 X01 to Cricket clears score, target overlay and zoom with stale X01 state", () => {
  const cases = [
    {
      name: "score",
      mount: mountCheckoutScoreHighlight,
      assertActive: (scenario) => scenario.score.classList.contains(HIGHLIGHT_CLASS),
      assertInactive: (scenario) => !scenario.score.classList.contains(HIGHLIGHT_CLASS),
    },
    {
      name: "targets",
      mount: initializeCheckoutTargetHighlights,
      assertActive: (scenario) => Boolean(scenario.documentRef.getElementById(OVERLAY_ID)),
      assertInactive: (scenario) => !scenario.documentRef.getElementById(OVERLAY_ID),
    },
    {
      name: "zoom",
      mount: initializeTvBoardZoom,
      prepare: (scenario) => scenario.windowRef.localStorage.setItem("selectedBoard", "board-123"),
      assertActive: (scenario) => scenario.board.classList.contains(ZOOM_CLASS),
      assertInactive: (scenario) => !scenario.board.classList.contains(ZOOM_CLASS),
    },
  ];

  cases.forEach(({ name, mount, prepare, assertActive, assertInactive }) => {
    const scenario = createScenario({ score: 40, route: ["D20"], outMode: "Double Out" });
    prepare?.(scenario);
    const timers = createFakeTimerHarness();
    timers.installOnWindow(scenario.windowRef);
    timers.installGlobals();
    const context = {
      ...scenario,
      domGuards: createDomGuards({ documentRef: scenario.documentRef }),
      registries: {
        observers: createObserverRegistry(),
        listeners: createListenerRegistry(),
      },
      domain: { x01Rules },
      config: {
        getFeatureConfig(key) {
          if (key === "checkoutScoreHighlight") {
            return { effect: "grow-only", triggerSource: "suggestion-first" };
          }
          if (key === "checkoutTargetHighlights") {
            return { targetSelectionMode: "next" };
          }
          return { checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", zoomLevel: 2.75 };
        },
      },
      helpers: { createRafScheduler },
    };
    const cleanup = mount(context);
    try {
      timers.advance(25);
      assert.equal(assertActive(scenario), true, `${name} active`);
      scenario.variant.textContent = "Cricket";
      scenario.header.children[2].textContent = "Cricket";
      scenario.game.notify();
      timers.advance(25);
      assert.equal(assertInactive(scenario), true, `${name} inactive`);
    } finally {
      cleanup();
      timers.restoreGlobals();
    }
  });
});

test("P0 consumers resolve identical atomic X01 semantics", () => {
  const cases = [
    { name: "normal coherent", options: { score: 60, route: ["T20"] } },
    {
      name: "DOM leads",
      options: { score: 60, throws: [], route: ["S20", "D20"], outMode: "Double Out" },
      mutate(scenario) {
        resolveX01CheckoutContext(scenario);
        scenario.score.textContent = "40";
        scenario.setVisit(["S20"], ["D20"]);
      },
    },
    {
      name: "state leads",
      options: { score: 100, throws: [], route: ["T20", "D20"], outMode: "Double Out" },
      mutate(scenario) {
        resolveX01CheckoutContext(scenario);
        scenario.state.score = 40;
        scenario.state.throws = [toThrow("T20")];
      },
    },
    {
      name: "foreign match",
      options: { score: 60, route: ["T20"] },
      mutate(scenario) {
        scenario.state.matchId = "foreign-match";
      },
    },
    {
      name: "explicit non-X01 DOM",
      options: { score: 40, route: ["D20"], outMode: "Double Out" },
      mutate(scenario) {
        scenario.variant.textContent = "Tactics";
        scenario.header.children[2].textContent = "Tactics";
      },
    },
    {
      name: "missing match ID",
      options: { score: 60, route: ["T20"], includeMatchId: false },
      mutate(scenario) {
        scenario.windowRef.location.pathname = "/matches";
      },
    },
    { name: "direct one-dart route", options: { score: 40, route: ["D20"], outMode: "Double Out" } },
    { name: "multi-dart route", options: { score: 100, route: ["T20", "D20"], outMode: "Double Out" } },
    { name: "Double Out", options: { score: 40, route: ["D20"], outMode: "Double Out" } },
    { name: "Master Out", options: { score: 60, route: ["T20"], outMode: "Master Out" } },
    { name: "Straight Out", options: { score: 20, route: ["S20"], outMode: "Straight Out" } },
  ];

  cases.forEach(({ name, options, mutate }) => {
    const scenario = createScenario(options);
    mutate?.(scenario);
    const scoreTruth = resolveCheckoutScoreTruth(scenario);
    const targetTruth = resolveCheckoutTargetTruth(scenario);
    const zoomTruth = resolveTvBoardZoomTruth(scenario);
    assert.deepEqual(semanticTruth(targetTruth), semanticTruth(scoreTruth), `${name}: target`);
    assert.deepEqual(semanticTruth(zoomTruth), semanticTruth(scoreTruth), `${name}: zoom`);
  });
});

for (const [fromMode, toMode] of [
  ["Double Out", "Master Out"],
  ["Master Out", "Double Out"],
  ["Straight Out", "Double Out"],
]) {
  test(`P1 match boundary ${fromMode} to ${toMode} does not retain prior semantics`, () => {
    const scenario = createScenario({ score: 40, route: ["D20"], outMode: fromMode });
    assert.equal(resolveX01CheckoutContext(scenario).outMode, fromMode);

    scenario.windowRef.location.pathname = "/matches/new-match";
    scenario.score.textContent = toMode === "Master Out" ? "60" : "40";
    scenario.setVisit([], [toMode === "Master Out" ? "T20" : "D20"]);
    setOutMode(scenario, toMode);
    const resolved = resolveX01CheckoutContext(scenario);

    assert.equal(resolved.coherence, "dom-preferred");
    assert.equal(resolved.matchId, "new-match");
    assert.equal(resolved.outMode, toMode);
    assert.equal(resolved.throwCount, 0);
    assert.equal(resolved.diagnostics.foreignMatchState, true);
  });
}

test("P1 target retention is cancelled at a match boundary", () => {
  const scenario = createScenario({ score: 40, route: ["D20"], outMode: "Double Out" });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(scenario.windowRef);
  timers.installGlobals();
  const cleanup = initializeCheckoutTargetHighlights({
    ...scenario,
    domGuards: createDomGuards({ documentRef: scenario.documentRef }),
    registries: { observers: createObserverRegistry() },
    domain: { x01Rules },
    config: { getFeatureConfig: () => ({ targetSelectionMode: "next" }) },
    helpers: { createRafScheduler },
  });

  try {
    timers.advance(25);
    assert.ok(scenario.documentRef.getElementById(OVERLAY_ID)?.children.length > 0);

    scenario.setVisit([], []);
    scenario.game.notify();
    timers.advance(25);
    assert.ok(scenario.documentRef.getElementById(OVERLAY_ID)?.children.length > 0);

    scenario.windowRef.location.pathname = "/matches/new-match";
    scenario.score.textContent = "200";
    scenario.game.notify();
    timers.advance(25);
    assert.equal(scenario.documentRef.getElementById(OVERLAY_ID)?.children.length || 0, 0);

    timers.advance(1600);
    assert.equal(scenario.documentRef.getElementById(OVERLAY_ID)?.children.length || 0, 0);
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("ambiguous first observation fails safe instead of trusting route shape", () => {
  const scenario = createScenario({ score: 100, throws: [], route: ["T20", "D20"], outMode: "Double Out" });
  scenario.state.score = 40;
  scenario.state.throws = [toThrow("T20")];

  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "conflict");
  assert.equal(resolved.actionable, false);
  assert.equal(Number.isNaN(resolved.activeScore), true);
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, []);
});

test("P1 correction during DOM lag follows the changed state snapshot", () => {
  const scenario = createScenario({
    score: 40,
    throws: ["S20"],
    route: ["D20"],
    outMode: "Double Out",
  });
  assert.equal(resolveX01CheckoutContext(scenario).coherence, "coherent");

  scenario.state.score = 20;
  scenario.state.throws = [toThrow("D20")];
  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "state-preferred");
  assert.equal(resolved.activeScore, 20);
  assert.equal(resolved.throwCount, 1);
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D10"]);
});

test("P1 undo during DOM lag follows the rolled-back state snapshot", () => {
  const scenario = createScenario({
    score: 40,
    throws: ["T20"],
    route: ["D20"],
    outMode: "Double Out",
  });
  assert.equal(resolveX01CheckoutContext(scenario).coherence, "coherent");

  scenario.state.score = 100;
  scenario.state.throws = [];
  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "state-preferred");
  assert.equal(resolved.activeScore, 100);
  assert.equal(resolved.throwCount, 0);
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["T20", "D20"]);
});

test("race 10 equal scores cannot hide foreign out-mode turn and player state", () => {
  const scenario = createScenario({ score: 60, route: ["T20"], outMode: "Master Out" });
  scenario.state.matchId = "old-match";
  scenario.state.score = 60;
  scenario.state.outMode = "Double Out";
  scenario.state.throws = [toThrow("S1"), toThrow("S1")];
  scenario.state.turnId = "old-turn";
  scenario.state.playerIndex = 1;
  scenario.state.playerId = "player-2";

  const resolved = resolveX01CheckoutContext(scenario);

  assert.equal(resolved.coherence, "dom-preferred");
  assert.equal(resolved.activeScore, 60);
  assert.equal(resolved.outMode, "Master Out");
  assert.equal(resolved.throwCount, 0);
  assert.equal(resolved.activePlayerIndex, 0);
  assert.equal(resolved.diagnostics.foreignMatchState, true);
});
