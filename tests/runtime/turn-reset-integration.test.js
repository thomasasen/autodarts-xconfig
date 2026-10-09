import test from "node:test";
import assert from "node:assert/strict";
import { createBootstrap } from "../../src/core/bootstrap.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import { OVERLAY_ID } from "../../src/features/checkout-target-highlights/style.js";
import { HIGHLIGHT_CLASS } from "../../src/features/checkout-score-highlight/style.js";
import { ZOOM_CLASS } from "../../src/features/tv-board-zoom/style.js";
import * as cricketRules from "../../src/domain/cricket-rules.js";
import { MODERN_ROOT_CLASS, OPEN_ACTIVE_CLASS } from "../../src/features/cricket-grid-status-effects/style.js";
import { createFakeTimerHarness } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

const featureKeys = new Set([
  "tv-board-zoom", "checkout-target-highlights", "checkout-score-highlight", "checkout-suggestion-styles",
  "turn-score-counter", "x01-remaining-score-bar", "dart-marker-replacer", "dartboard-marker-highlight",
  "special-hit-highlights", "single-bull-hit-sound", "x01-bust-active-player-highlight", "turn-dart-display",
  "take-out-darts-alert", "bot-board-style", "avg-trend-arrow",
  "cricket-target-highlighter", "cricket-grid-status-effects",
]);

function fixture(options = {}) {
  const f = createModernX01Fixture({ base: 301, score: 40, throws: [], route: ["D20"] });
  const cards = [f.card];
  for (let index = 1; index < 3; index += 1) {
    const card = f.card.cloneNode(true);
    card.querySelector('[role="button"]').textContent = `Player ${index + 1}`;
    f.documentRef.main.appendChild(card);
    cards.push(card);
  }
  function showPlayer(index, score = 40, throws = [], route = ["D20"]) {
    cards.forEach((card, i) => {
      card.classList.toggle("bg-raspberry-slush-diagonal", i === index);
      card.classList.toggle("bg-black-80", i !== index);
      card.querySelector(".size-2").classList.toggle("invisible", i !== index);
      card.querySelector(".font-number").textContent = String(score);
      card.querySelector(".text-checkout-suggestion").textContent = route.join(" ");
    });
    f.setVisit(throws, route);
    f.total.textContent = String(throws.length ? 25 : 0);
  }
  showPlayer(0);
  const timers = createFakeTimerHarness({ now: 10000 });
  timers.installOnWindow(f.windowRef);
  timers.installGlobals();
  const plays = [];
  f.windowRef.Audio = class {
    constructor(src) { this.src = src; }
    play() { plays.push(this.src); return Promise.resolve(); }
    pause() {}
  };
  f.windowRef.localStorage.setItem("selectedBoard", "board-123");
  const definitions = defaultFeatureDefinitions.filter((definition) => featureKeys.has(definition.featureKey))
    .map((definition) => definition.featureKey === "tv-board-zoom" && options.dropZoomRender ? {
      ...definition,
      initialize(context) {
        return definition.initialize({ ...context, helpers: { ...context.helpers,
          createRafScheduler: (callback) => context.helpers.createRafScheduler(() => {
            if (!options.dropZoomRender()) callback();
          }),
        } });
      },
    } : definition);
  const runtime = createBootstrap({
    windowRef: f.windowRef,
    documentRef: f.documentRef,
    featureDefinitions: definitions,
    config: {
      featureToggles: Object.fromEntries(definitions.map((definition) => [definition.configKey, true])),
      features: {
        ...Object.fromEntries(definitions.map((definition) => [definition.configKey, { enabled: true }])),
        tvBoardZoom: { enabled: true, checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", zoomLevel: 2.75 },
        checkoutScoreHighlight: { enabled: true, triggerSource: "score-only" },
      },
    },
  });
  function setState(index, visit, throws = [], score = 40, extra = {}) {
    runtime.context.gameState.applyMatch({
      id: "modern-match", variant: "X01", currentGameId: "leg-1", player: index,
      players: cards.map((_card, i) => ({ id: `player-${i}` })),
      gameScores: [score, score, score], settings: { outMode: "Double Out" },
      turns: [{ id: `visit-${visit}`, playerId: `player-${index}`, score,
        throws: throws.map((name) => ({ segment: { name }, score: ({ S4: 4, "25": 25 })[name] || 0 })) }],
      ...extra,
    });
  }
  setState(0, 0);
  runtime.start();
  timers.advance(200);
  function close() { runtime.stop(); timers.restoreGlobals(); }
  return { ...f, runtime, cards, timers, plays, showPlayer, setState, close };
}

function assertCheckout(f, player) {
  assert.equal(f.runtime.context.turnLifecycle.getSnapshot().phase, "ready");
  assert.equal(f.cards[player].querySelector(".font-number").classList.contains(HIGHLIGHT_CLASS), true);
  assert.ok(f.documentRef.getElementById(OVERLAY_ID));
  assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
}

function notifyDom(f) {
  f.documentRef.flushMutations([{ type: "characterData", target: f.total }]);
}

function assertDoubleTarget(f, double) {
  const overlay = f.documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);
  // The outline shares its segment with the filled target.
  assert.deepEqual([...new Set(Array.from(overlay.children, (node) =>
    `${node.dataset.targetRing}:${node.dataset.targetValue}`))], [`D:${double}`]);
}

function assertDirectCheckout(f, player, score, double, generation) {
  assertCheckout(f, player);
  assert.equal(f.cards[player].querySelector(".font-number").textContent, String(score));
  f.cards.forEach((card, index) => {
    assert.equal(card.querySelector(".font-number").classList.contains(HIGHLIGHT_CLASS), index === player);
  });
  assertDoubleTarget(f, double);
  assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
}

function assertSuspended(f, generation) {
  const snapshot = f.runtime.context.turnLifecycle.getSnapshot();
  assert.equal(snapshot.phase, "pending");
  assert.equal(snapshot.generation, generation);
  assert.equal(f.documentRef.getElementById(OVERLAY_ID), null);
  assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
  f.cards.forEach((card) => {
    assert.equal(card.querySelector(".font-number").classList.contains(HIGHLIGHT_CLASS), false);
  });
}

function replaceBoard(f) {
  const oldBoard = f.board;
  const replacement = oldBoard.cloneNode(true);
  replacement.classList.remove(ZOOM_CLASS);
  replacement.style.transform = "";
  replacement.__rect = { ...oldBoard.__rect };
  replacement.offsetWidth = replacement.offsetHeight = 549;
  replacement.offsetParent = f.host;
  oldBoard.remove();
  f.host.appendChild(replacement);
  f.board = replacement;
  f.documentRef.flushMutations([{ type: "childList", target: f.host,
    removedNodes: [oldBoard], addedNodes: [replacement] }]);
  return oldBoard;
}

for (const first of ["state", "dom"]) {
  test(`${first}-first same-count correction and undo keep checkout consumers aligned without a new visit`, () => {
    const f = fixture();
    try {
      const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
      const initialTransform = f.board.style.transform;
      f.showPlayer(0, 40, ["MISS"]);
      f.setState(0, 0, ["MISS"]);
      f.timers.advance(25);
      assertDirectCheckout(f, 0, 40, 20, generation);
      f.windowRef.dispatchEvent({ type: "pointerdown", target: f.rows[0].label });
      f.timers.advance(300);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
      const oldBoard = replaceBoard(f);
      f.timers.advance(12000);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false, "board replacement must respect correction pause");
      assert.equal(f.windowRef.__adXConfig.inspect().watchdog.features["tv-board-zoom"].attempts, 0);
      f.plays.length = 0;

      for (const [score, throws, route, double] of [[36, ["S4"], ["D18"], 18], [40, [], ["D20"], 20]]) {
        const updates = {
          state: () => f.setState(0, 0, throws, score),
          dom: () => { f.showPlayer(0, score, throws, route); notifyDom(f); },
        };
        updates[first]();
        f.timers.advance(25);
        assertDoubleTarget(f, double);
        assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
        assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
        const leadingTransform = f.board.style.transform;
        if (double === 18) assert.notEqual(leadingTransform, initialTransform);
        else assert.equal(leadingTransform, initialTransform);
        updates[first]();
        f.timers.advance(25);
        assertDoubleTarget(f, double);
        assert.equal(f.board.style.transform, leadingTransform);
        updates[first === "state" ? "dom" : "state"]();
        f.timers.advance(25);
        assertDirectCheckout(f, 0, score, double, generation);
        assert.equal(f.board.style.transform, leadingTransform);
        f.timers.advance(2000);
        assertDirectCheckout(f, 0, score, double, generation);
        assert.equal(oldBoard.classList.contains(ZOOM_CLASS), false);
      }
      assert.equal(f.plays.length, 0);
    } finally { f.close(); }
  });

  test(`${first}-first confirmed player undo recovers after duplicate old updates and board replacement`, () => {
    const f = fixture();
    try {
      const generation = f.runtime.context.turnLifecycle.getSnapshot().generation + 1;
      const forward = {
        state: () => f.setState(1, 1),
        dom: () => { f.showPlayer(1); notifyDom(f); },
      };
      forward[first]();
      f.timers.advance(25);
      assertSuspended(f, generation);
      forward[first]();
      f.timers.advance(25);
      assertSuspended(f, generation);
      if (first === "state") { f.showPlayer(0); notifyDom(f); }
      else f.setState(0, 0);
      f.timers.advance(25);
      assertSuspended(f, generation);
      forward[first === "state" ? "dom" : "state"]();
      f.timers.advance(25);
      assertDirectCheckout(f, 1, 40, 20, generation);
      f.plays.length = 0;
      const updates = {
        state: () => f.setState(0, 0),
        dom: () => { f.showPlayer(0); notifyDom(f); },
      };
      updates[first]();
      f.timers.advance(25);
      assertSuspended(f, generation);
      const oldBoard = replaceBoard(f);
      f.timers.advance(25);
      assertSuspended(f, generation);
      updates[first]();
      f.timers.advance(12000);
      assertSuspended(f, generation);
      assert.equal(oldBoard.classList.contains(ZOOM_CLASS), false);
      assert.ok(Object.values(f.windowRef.__adXConfig.inspect().watchdog.features)
        .every((entry) => entry.attempts === 0), "the watchdog must not repair ambiguous identity");
      updates[first === "state" ? "dom" : "state"]();
      f.timers.advance(25);
      assertDirectCheckout(f, 0, 40, 20, generation + 1);
      updates.state();
      updates.dom();
      f.timers.advance(2000);
      assertDirectCheckout(f, 0, 40, 20, generation + 1);
      assert.equal(oldBoard.classList.contains(ZOOM_CLASS), false);
      assert.equal(f.plays.length, 0);
    } finally { f.close(); }
  });
}

for (const count of [1, 2]) {
  test(`dart-${count} BUST followed by same-player recovery and undo never preserves an obsolete hold`, () => {
    const f = fixture();
    try {
      const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
      const throws = Array(count).fill("MISS");
      f.showPlayer(0, 40, throws, []);
      f.total.textContent = "BUST";
      notifyDom(f);
      f.setState(0, 0, throws);
      f.timers.advance(25);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
      assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
      f.timers.advance(2000);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
      f.showPlayer(0);
      notifyDom(f);
      f.setState(0, 1);
      f.timers.advance(25);
      assertDirectCheckout(f, 0, 40, 20, generation + 1);
      f.showPlayer(0, 40, ["MISS"]);
      notifyDom(f);
      f.setState(0, 1, ["MISS"]);
      f.timers.advance(25);
      f.windowRef.dispatchEvent({ type: "pointerdown", target: f.rows[0].label });
      f.timers.advance(300);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
      f.showPlayer(0);
      notifyDom(f);
      f.setState(0, 1);
      f.timers.advance(25);
      assertDirectCheckout(f, 0, 40, 20, generation + 1);
    } finally { f.close(); }
  });
}

for (const exit of ["disable", "stop"]) {
  test(`${exit} cancels queued correction work and watchdog recovery without reviving the zoom`, () => {
    const f = fixture();
    try {
      f.showPlayer(0, 40, ["MISS"]);
      f.setState(0, 0, ["MISS"]);
      f.timers.advance(25);
      f.windowRef.dispatchEvent({ type: "pointerdown", target: f.rows[0].label });
      f.showPlayer(0, 36, ["S4"], ["D18"]);
      notifyDom(f);
      f.setState(0, 0, ["S4"], 36);
      f.plays.length = 0;
      if (exit === "disable") f.runtime.setFeatureEnabled("tv-board-zoom", false);
      else f.runtime.stop();
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
      assert.equal(f.board.style.transform || "", "");
      f.timers.advance(20000);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
      assert.equal(f.board.style.transform || "", "");
      assert.equal(f.plays.length, 0);
      if (exit === "disable") {
        assert.equal(f.runtime.context.registries.observers.get("tv-board-zoom:dom-observer"), null);
      }
      f.runtime.stop();
      assert.equal(f.runtime.context.registries.observers.size(), 0);
      assert.equal(f.runtime.context.registries.listeners.size(), 0);
      assert.equal(f.timers.pendingCount, 0);
      f.timers.advance(20000);
      assert.equal(f.timers.pendingCount, 0);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    } finally { f.close(); }
  });
}

for (const boundary of ["player", "leg", "match", "variant"]) {
  test(`third-dart BUST hold releases at a ${boundary} boundary despite queued integrity work`, () => {
    const f = fixture();
    try {
      const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
      f.showPlayer(0, 40, ["MISS", "MISS"]);
      f.setState(0, 0, ["MISS", "MISS"]);
      f.timers.advance(25);
      f.showPlayer(0, 40, ["MISS", "MISS", "MISS"], []);
      f.total.textContent = "BUST";
      notifyDom(f);
      f.setState(0, 0, ["MISS", "MISS", "MISS"]);
      f.timers.advance(25);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
      assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
      f.plays.length = 0;
      const oldTransform = f.board.style.transform;
      // Queue structural and semantic work without letting its RAF run yet.
      f.board.style.transform = "";
      f.documentRef.flushMutations([{ type: "attributes", attributeName: "style", target: f.board }]);
      const player = boundary === "player" ? 1 : 0;
      f.showPlayer(player, 36, [], ["D18"]);
      if (boundary === "match") f.windowRef.location.pathname = "/matches/next-match";
      if (boundary === "variant") f.variant.textContent = "Bull-off";
      notifyDom(f);
      f.setState(player, 1, [], 36, {
        ...(boundary === "leg" ? { currentGameId: "leg-2" } : {}),
        ...(boundary === "match" ? { id: "next-match" } : {}),
        ...(boundary === "variant" ? { variant: "Bull-off" } : {}),
      });
      f.timers.advance(25);
      if (boundary === "variant") {
        assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
        assert.equal(f.documentRef.getElementById(OVERLAY_ID), null);
        f.cards.forEach((card) => assert.equal(card.querySelector(".font-number").classList.contains(HIGHLIGHT_CLASS), false));
      } else {
        assertDirectCheckout(f, player, 36, 18, generation + 1);
        assert.notEqual(f.board.style.transform, oldTransform);
      }
      f.timers.advance(12000);
      if (boundary === "variant") {
        assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
        assert.equal(f.documentRef.getElementById(OVERLAY_ID), null);
      } else assertDirectCheckout(f, player, 36, 18, generation + 1);
      assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation + 1);
      assert.equal(f.plays.length, 0);
    } finally { f.close(); }
  });
}

test("watchdog restores a deleted checkout overlay and a zoom whose integrity render was lost", () => {
  let dropNext = false;
  const f = fixture({ dropZoomRender: () => {
    const drop = dropNext;
    dropNext = false;
    return drop;
  } });
  try {
    assertCheckout(f, 0);
    const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
    const observers = f.runtime.context.registries.observers.size();
    const listeners = f.runtime.context.registries.listeners.size();
    f.plays.length = 0;
    f.documentRef.getElementById(OVERLAY_ID).remove();
    f.board.classList.remove(ZOOM_CLASS);
    f.board.style.transform = "";
    dropNext = true;
    // Deliberately no MutationObserver delivery: the periodic backstop must heal.
    f.timers.advance(12000);
    assertCheckout(f, 0);
    const diagnostics = f.windowRef.__adXConfig.inspect().watchdog;
    assert.equal(diagnostics.features["checkout-target-highlights"].attempts, 1);
    assert.equal(diagnostics.features["tv-board-zoom"].attempts, 1);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
    assert.equal(f.runtime.context.registries.observers.size(), observers);
    assert.equal(f.runtime.context.registries.listeners.size(), listeners);
    assert.equal(f.plays.length, 0);
    f.timers.advance(5000);
    assert.ok(f.windowRef.__adXConfig.inspect().watchdog.log.some((entry) => entry.action === "recovered"));
  } finally { f.close(); }
});

test("watchdog leaves healthy displays, non-checkout scores and hydrated hits untouched", () => {
  const f = fixture();
  try {
    f.showPlayer(1, 200, ["25"], []);
    f.setState(1, 1, ["25"], 200);
    f.timers.advance(50);
    f.plays.length = 0;
    f.timers.advance(20000);
    const diagnostics = f.windowRef.__adXConfig.inspect().watchdog;
    assert.equal(Object.keys(diagnostics.features).length, featureKeys.size);
    assert.ok(Object.values(diagnostics.features).every((entry) => entry.attempts === 0));
    assert.equal(f.plays.length, 0);
  } finally { f.close(); }
});

test("watchdog accepts a manual zoom pause without consuming the repair budget", () => {
  const f = fixture();
  try {
    f.showPlayer(0, 40, ["MISS"]);
    f.setState(0, 0, ["MISS"]);
    f.timers.advance(25);
    f.windowRef.dispatchEvent({ type: "pointerdown", target: f.rows[0].label });
    f.timers.advance(20000);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    assert.equal(f.windowRef.__adXConfig.inspect().watchdog.features["tv-board-zoom"].attempts, 0);
  } finally { f.close(); }
});

test("watchdog repairs a held third-dart BUST zoom without releasing its hold or replaying audio", () => {
  let dropNext = false;
  const f = fixture({ dropZoomRender: () => {
    const drop = dropNext;
    dropNext = false;
    return drop;
  } });
  try {
    f.showPlayer(0, 40, ["MISS", "MISS"]);
    f.setState(0, 0, ["MISS", "MISS"]);
    f.timers.advance(25);
    f.showPlayer(0, 40, ["MISS", "MISS", "MISS"], []);
    f.total.textContent = "BUST";
    f.setState(0, 0, ["MISS", "MISS", "MISS"]);
    f.timers.advance(25);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    f.plays.length = 0;
    f.board.classList.remove(ZOOM_CLASS);
    f.board.style.transform = "";
    dropNext = true;
    f.timers.advance(12000);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    assert.equal(f.windowRef.__adXConfig.inspect().watchdog.features["tv-board-zoom"].attempts, 1);
    assert.equal(f.plays.length, 0);
  } finally { f.close(); }
});

test("all turn consumers recover together after state-first and DOM-first equal-score switches", () => {
  const f = fixture();
  try {
    assertCheckout(f, 0);
    const start = f.runtime.context.turnLifecycle.getSnapshot().generation;
    f.setState(1, 1);
    f.timers.advance(25);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, start + 1);
    assert.equal(f.documentRef.getElementById(OVERLAY_ID), null);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    f.showPlayer(1);
    f.runtime.context.turnLifecycle.refresh();
    f.timers.advance(25);
    assertCheckout(f, 1);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, start + 1);

    f.showPlayer(2);
    f.runtime.context.turnLifecycle.refresh();
    f.timers.advance(25);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, start + 2);
    f.setState(2, 2);
    f.timers.advance(25);
    assertCheckout(f, 2);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, start + 2);
  } finally { f.close(); }
});

test("1000 live consumer switches leave timers, bindings and owned DOM bounded", () => {
  const f = fixture();
  try {
    assertCheckout(f, 0);
    const observers = f.runtime.context.registries.observers.size();
    const listeners = f.runtime.context.registries.listeners.size();
    const nodes = f.documentRef.querySelectorAll("*").length;
    const timers = f.timers.pendingCount;
    const checks = Object.fromEntries(Object.entries(f.windowRef.__adXConfig.inspect().watchdog.features)
      .map(([key, value]) => [key, value.checks]));
    const start = f.runtime.context.turnLifecycle.getSnapshot().generation;
    for (let visit = 1; visit <= 1000; visit += 1) {
      const player = visit % 3;
      f.showPlayer(player);
      f.setState(player, visit);
      f.timers.advance(25);
      assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, start + visit);
      assertCheckout(f, player);
      assert.equal(f.runtime.context.registries.observers.size(), observers);
      assert.equal(f.runtime.context.registries.listeners.size(), listeners);
      assert.ok(f.timers.pendingCount <= timers, "old timers must not accumulate");
      assert.ok(f.documentRef.querySelectorAll("*").length <= nodes, "old overlays must not accumulate");
    }
    const watchdog = f.windowRef.__adXConfig.inspect().watchdog;
    assert.deepEqual(Object.fromEntries(Object.entries(watchdog.features)
      .map(([key, value]) => [key, value.checks])), checks);
    assert.ok(Object.values(watchdog.features).every((entry) => entry.attempts === 0));
    assert.equal(watchdog.log.length, 0);
    f.runtime.stop();
    assert.equal(f.runtime.context.registries.observers.size(), 0);
    assert.equal(f.runtime.context.registries.listeners.size(), 0);
    assert.equal(f.timers.pendingCount, 0);
  } finally { f.close(); }
});

test("rehydrating a populated new visit does not replay Single Bull or hit bursts", () => {
  const f = fixture();
  try {
    // Ignore audio unlock probes performed when mounting.
    f.plays.length = 0;
    f.showPlayer(1, 40, ["25"]);
    f.setState(1, 1, ["25"]);
    f.timers.advance(25);
    assert.equal(f.plays.length, 0);
    assert.equal(f.rows[0].row.classList.contains("ad-ext-hit-animation-trigger"), false);
    f.showPlayer(1, 15, ["25", "25"], []);
    f.setState(1, 1, ["25", "25"], 15);
    f.timers.advance(25);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().phase, "ready");
    assert.ok(f.runtime.context.registries.observers.get("single-bull-hit-sound:dom-observer"));
    assert.equal(f.plays.length, 1, "a new hit after hydration must still play");
  } finally { f.close(); }
});

test("board replacement rebinds zoom and checkout without inventing an extra visit", () => {
  const f = fixture();
  try {
    assertCheckout(f, 0);
    const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
    const oldBoard = f.board;
    const replacement = oldBoard.cloneNode(true);
    replacement.classList.remove(ZOOM_CLASS);
    replacement.style.transform = "";
    replacement.__rect = { ...oldBoard.__rect };
    replacement.offsetWidth = replacement.offsetHeight = 549;
    replacement.offsetParent = f.host;
    oldBoard.remove();
    f.host.appendChild(replacement);
    f.documentRef.flushMutations([{ type: "childList", target: f.host,
      removedNodes: [oldBoard], addedNodes: [replacement] }]);
    f.timers.advance(25);
    f.board = replacement;
    assertCheckout(f, 0);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
  } finally { f.close(); }
});

test("late previous-visit state suspends effects and resumes without replay or a rollback", () => {
  const f = fixture();
  try {
    f.showPlayer(1);
    f.setState(1, 1);
    f.timers.advance(25);
    assertCheckout(f, 1);
    const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
    f.plays.length = 0;
    f.setState(0, 0);
    f.timers.advance(2000);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().phase, "pending");
    assert.equal(f.documentRef.getElementById(OVERLAY_ID), null);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    assert.equal(f.plays.length, 0);
    f.setState(1, 1);
    f.timers.advance(25);
    assertCheckout(f, 1);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
    assert.equal(f.plays.length, 0);
  } finally { f.close(); }
});

test("BUST hold, correction and undo keep the visit until an actual player switch", () => {
  const f = fixture();
  try {
    const generation = f.runtime.context.turnLifecycle.getSnapshot().generation;
    f.showPlayer(0, 40, ["MISS", "MISS"]);
    f.setState(0, 0, ["MISS", "MISS"]);
    f.timers.advance(25);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    f.showPlayer(0, 40, ["MISS", "MISS", "MISS"], []);
    f.total.textContent = "BUST";
    f.setState(0, 0, ["MISS", "MISS", "MISS"]);
    f.timers.advance(25);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
    for (const throws of [["MISS", "MISS"], ["MISS"]]) {
      f.showPlayer(0, 40, throws);
      f.setState(0, 0, throws);
      f.timers.advance(25);
      assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation);
    }
    f.showPlayer(1);
    f.setState(1, 1);
    f.timers.advance(25);
    assert.equal(f.runtime.context.turnLifecycle.getSnapshot().generation, generation + 1);
    assertCheckout(f, 1);
  } finally { f.close(); }
});

for (const variant of ["Cricket", "Tactics"]) {
  test(`${variant} grid follows every player after the common automatic reset`, () => {
    const f = fixture();
    try {
      f.cards.forEach((card) => card.remove());
      f.variant.textContent = variant;
      f.header.children[2].textContent = variant;
      f.setVisit([], []);
      const root = f.node(f.documentRef.main, "div", "grid h-full");
      f.node(root, "div");
      const headers = Array.from({ length: 3 }, (_entry, player) => {
        const header = f.node(root, "div", "relative isolate overflow-hidden");
        f.node(header, "div", "font-display", `Player ${player}`);
        return header;
      });
      const order = variant === "Tactics" ? cricketRules.TACTICS_TARGET_ORDER : cricketRules.CRICKET_TARGET_ORDER;
      const cells = new Map(order.map((label) => {
        f.node(root, "div", "font-body", label === "BULL" ? "B" : label);
        return [label, Array.from({ length: 3 }, () => {
          const cell = f.node(root, "div", "flex justify-center items-center border-b border-r");
          f.node(cell, "div", "size-8");
          return cell;
        })];
      }));
      for (let visit = 0; visit < 6; visit += 1) {
        const active = visit % 3;
        headers.forEach((header, player) => header.classList.toggle("bg-raspberry-slush-diagonal", player === active));
        f.setState(active, visit + 1, [], 0, { variant, settings: { gameMode: variant, mode: "Standard" } });
        f.timers.advance(25);
        assert.equal(f.runtime.context.turnLifecycle.getSnapshot().phase, "ready");
        assert.equal(f.runtime.context.turnLifecycle.getSnapshot().activePlayerIndex, active);
        assert.equal(root.classList.contains(MODERN_ROOT_CLASS), true);
        for (const row of cells.values()) {
          row.forEach((cell, player) => assert.equal(cell.classList.contains(OPEN_ACTIVE_CLASS), player === active));
        }
        assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
        assert.equal(f.documentRef.getElementById(OVERLAY_ID), null);
      }
      f.runtime.setFeatureEnabled("cricket-target-highlighter", false);
      f.timers.advance(12000);
      const diagnostics = f.windowRef.__adXConfig.inspect().watchdog;
      assert.equal(diagnostics.features["cricket-grid-status-effects"].checks, 1);
      assert.equal(diagnostics.features["cricket-grid-status-effects"].attempts, 0);
      assert.equal(root.classList.contains(MODERN_ROOT_CLASS), true);
    } finally { f.close(); }
  });
}
