import test from "node:test";
import assert from "node:assert/strict";
import { createTurnLifecycle, createTurnScopedScheduler } from "../../src/features/shared/turn-lifecycle.js";

function candidate(player = 0, turn = "turn-1", source = "game-state") {
  return {
    source, matchId: "match-1", gameBoundaryToken: source === "dom" ? "match-1" : "game-1",
    variant: "X01", activePlayerIndex: player, activePlayerId: `${source}:${player}`,
    activeTurnId: turn, activeScore: 40, throwCount: 0,
  };
}

function fixture() {
  const candidates = { state: candidate(), dom: candidate(0, "dom:40", "dom") };
  const truth = { active: true, actionable: true, source: "game-state" };
  const lifecycle = createTurnLifecycle({}, { readCandidates: () => candidates, resolveTruth: () => truth });
  lifecycle.refresh();
  return { lifecycle, candidates, truth };
}

test("one generation per state-first switch, with all resets before scheduling", () => {
  const { lifecycle, candidates } = fixture();
  const calls = [];
  lifecycle.register({ reset: () => calls.push("reset-a"), schedule: () => calls.push("schedule-a") });
  lifecycle.register({ reset: () => calls.push("reset-b"), schedule: () => calls.push("schedule-b") });
  candidates.state = candidate(1, "turn-2");
  assert.equal(lifecycle.refresh().generation, 2);
  assert.equal(lifecycle.getSnapshot().phase, "pending");
  assert.deepEqual(calls, ["reset-a", "reset-b", "schedule-a", "schedule-b"]);
  lifecycle.refresh();
  candidates.dom = candidate(1, "dom:40", "dom");
  assert.equal(lifecycle.refresh().generation, 2);
  assert.equal(lifecycle.getSnapshot().phase, "ready");
  assert.equal(calls.filter((call) => call.startsWith("reset")).length, 2);
});

test("DOM-first switches adopt a late state turn ID without a second reset", () => {
  const { lifecycle, candidates, truth } = fixture();
  truth.source = "dom";
  candidates.dom = candidate(1, "dom:40", "dom");
  assert.equal(lifecycle.refresh().generation, 2);
  lifecycle.refresh();
  candidates.state = candidate(1, "turn-2");
  assert.equal(lifecycle.refresh().generation, 2);
  candidates.state = candidate(1, "turn-3");
  assert.equal(lifecycle.refresh().generation, 3, "same-player visits have real turn identities");
});

test("a previous finished turn for the next player cannot create two generations", () => {
  const { lifecycle, candidates } = fixture();
  candidates.state = { ...candidate(1, "old-visit"), activeTurn: { finishedAt: "2026-10-08T10:00:00Z" } };
  candidates.dom = candidate(1, "dom:40", "dom");
  assert.equal(lifecycle.refresh().generation, 2);
  candidates.state = candidate(1, "new-visit");
  assert.equal(lifecycle.refresh().generation, 2);
  candidates.state = candidate(1, "next-visit");
  assert.equal(lifecycle.refresh().generation, 3);
});

test("a late preceding-player DOM sample cannot roll back a confirmed state-first switch", () => {
  const { lifecycle, candidates } = fixture();
  candidates.state = candidate(1, "turn-2");
  assert.equal(lifecycle.refresh().generation, 2);
  candidates.dom = candidate(0, "dom:old-score", "dom");
  assert.equal(lifecycle.refresh().generation, 2);
  assert.equal(lifecycle.getSnapshot().activePlayerIndex, 1);
  candidates.dom = candidate(1, "dom:40", "dom");
  assert.equal(lifecycle.refresh().phase, "ready");
  assert.equal(lifecycle.getSnapshot().generation, 2);
});

test("a late old state after convergence waits for DOM confirmation, including Undo", () => {
  const { lifecycle, candidates } = fixture();
  candidates.state = candidate(1, "turn-2");
  candidates.dom = candidate(1, "dom:40", "dom");
  assert.equal(lifecycle.refresh().generation, 2);
  candidates.state = candidate(0, "turn-1");
  assert.equal(lifecycle.refresh().generation, 2);
  assert.equal(lifecycle.getSnapshot().phase, "pending");
  assert.equal(lifecycle.getSnapshot().activePlayerIndex, 1);
  candidates.dom = candidate(0, "dom:40", "dom");
  assert.equal(lifecycle.refresh().generation, 3, "confirmed Undo is allowed to return to the old player");
  assert.equal(lifecycle.getSnapshot().activePlayerIndex, 0);
});

test("score changes, dart count decreases and synthetic DOM IDs cannot invent a visit", () => {
  const { lifecycle, candidates } = fixture();
  candidates.state.activeScore = 20;
  candidates.state.throwCount = 3;
  candidates.dom.activeTurnId = "dom:20";
  assert.equal(lifecycle.refresh().generation, 1);
  candidates.state.throwCount = 0;
  assert.equal(lifecycle.refresh().generation, 1);
});

test("match, leg and variant changes each invalidate the generation", () => {
  const { lifecycle, candidates } = fixture();
  candidates.state.gameBoundaryToken = "game-2";
  assert.equal(lifecycle.refresh().generation, 2);
  candidates.state.matchId = candidates.dom.matchId = "match-2";
  assert.equal(lifecycle.refresh().generation, 3);
  candidates.state.variant = candidates.dom.variant = "Cricket";
  assert.equal(lifecycle.refresh().generation, 4);
});

test("ambiguous identities block new work and one broken reset cannot stop others", () => {
  const { lifecycle, candidates, truth } = fixture();
  let resets = 0;
  lifecycle.register({ reset() { throw new Error("feature failure"); } });
  lifecycle.register({ reset() { resets += 1; } });
  candidates.state = candidate(1, "turn-2");
  candidates.dom = candidate(2, "dom:40", "dom");
  truth.actionable = false;
  assert.equal(lifecycle.refresh().phase, "pending");
  assert.equal(resets, 0);
  candidates.dom = candidate(1, "dom:40", "dom");
  truth.actionable = true;
  assert.equal(lifecycle.refresh().generation, 2);
  assert.equal(resets, 1);
});

test("1000 three-player zero-score visits keep exactly one reset per visit and release subscribers", () => {
  const { lifecycle, candidates } = fixture();
  let resets = 0;
  const release = lifecycle.register({ reset() { resets += 1; } });
  for (let visit = 1; visit <= 1000; visit += 1) {
    candidates.state = candidate(visit % 3, `turn-${visit + 1}`);
    candidates.dom = candidate(visit % 3, "dom:40", "dom");
    assert.equal(lifecycle.refresh().generation, visit + 1);
    lifecycle.refresh();
  }
  assert.equal(resets, 1000);
  release();
  candidates.state = candidate(0, "final");
  candidates.dom = candidate(0, "dom:40", "dom");
  lifecycle.refresh();
  assert.equal(resets, 1000);
});

test("turn-scoped rendering checks readiness and unregisters on cleanup", () => {
  const { lifecycle, candidates } = fixture();
  let callback;
  let renders = 0;
  let resets = 0;
  const scheduler = createTurnScopedScheduler({ turnLifecycle: lifecycle }, () => { renders += 1; }, {
    resetTurn() { resets += 1; },
  }, (fn) => { callback = fn; return { schedule() {}, cancel() {} }; });
  callback();
  candidates.state = candidate(1, "turn-2");
  callback();
  assert.equal(renders, 1);
  assert.equal(resets, 1);
  candidates.dom = candidate(1, "dom:40", "dom");
  callback();
  assert.equal(renders, 2);
  scheduler.cancel();
  candidates.state = candidate(0, "turn-3");
  candidates.dom = candidate(0, "dom:40", "dom");
  callback();
  lifecycle.refresh();
  assert.equal(renders, 2);
  assert.equal(resets, 1);
});

test("consumers share one observation until a state or DOM notification invalidates it", () => {
  let reads = 0;
  let notify;
  let mutate;
  const lifecycle = createTurnLifecycle({
    gameState: { subscribe(listener) { notify = listener; return () => {}; } },
    windowRef: { requestAnimationFrame: () => 1, cancelAnimationFrame() {} },
    registries: { observers: {
      registerMutationObserver(options) { mutate = options.callback; }, disconnect() {},
    } },
  }, {
    readCandidates() { reads += 1; return { state: candidate(), dom: candidate(0, "dom:40", "dom") }; },
    resolveTruth: () => ({ active: true, actionable: true }),
  });
  lifecycle.start();
  lifecycle.ensureCurrent();
  lifecycle.ensureCurrent();
  assert.equal(reads, 1);
  notify();
  lifecycle.ensureCurrent();
  lifecycle.ensureCurrent();
  assert.equal(reads, 2);
  mutate();
  lifecycle.ensureCurrent();
  assert.equal(reads, 3);
  lifecycle.stop();
});
