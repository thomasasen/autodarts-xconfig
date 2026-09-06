import test from "node:test";
import assert from "node:assert/strict";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { readModernMatchSurface, readModernThrows } from "../../src/features/shared/x01-match-surface.js";
import { collectVisibleCheckoutRoute } from "../../src/features/x01-checkout-route.js";
import { resolveX01CheckoutContext } from "../../src/features/x01-checkout-context.js";
import { computeZoomIntent } from "../../src/features/tv-board-zoom/logic.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

const emptyGameState = {
  isX01Variant: () => false, getActiveTurn: () => null, getActiveThrows: () => [],
  getActiveScore: () => null, getOutMode: () => "", getSnapshot: () => null,
};

function intent(fixture, featureConfig = {}, state = {}, gameState = emptyGameState) {
  return computeZoomIntent({ ...fixture, gameState, x01Rules, state,
    featureConfig: { checkoutZoomEnabled: true, t20SetupZoomEnabled: true, ...featureConfig } });
}

test("native D18 surface separates two thrown darts from duplicate finish displays before hydration", () => {
  const f = createModernX01Fixture();
  const surface = readModernMatchSurface(f.documentRef, f.windowRef);
  assert.equal(surface.variant, "X01");
  assert.equal(surface.outMode, "Double Out");
  assert.equal(surface.activeScore, 36);
  assert.deepEqual(readModernThrows(surface, x01Rules).map((entry) => entry.segment.name), ["T20", "S25"]);
  assert.deepEqual(collectVisibleCheckoutRoute(f.documentRef, f.windowRef, x01Rules), ["D18"]);
  const context = resolveX01CheckoutContext({ ...f, x01Rules, gameState: emptyGameState, dartsRemaining: 1 });
  assert.equal(context.activeScore, 36);
  assert.equal(context.checkoutSurface.canUseAuthoritativeFinishNow, true);
  assert.deepEqual(intent(f), { reason: "checkout", segment: "D18" });
});

test("native route preserves repeated targets in one route and ignores the player-card copy", () => {
  const f = createModernX01Fixture({ score: 170, throws: [], route: ["T20", "T20", "BULL"] });
  assert.deepEqual(collectVisibleCheckoutRoute(f.documentRef, f.windowRef, x01Rules), ["T20", "T20", "BULL"]);
  assert.equal(intent(f, { checkoutZoomTarget: "route-first" }).segment, "T20");
  assert.equal(intent(f), null);
});

for (const [score, segment] of [[10, "D5"], [22, "D11"], [50, "BULL"]]) {
  test(`native direct finish ${score} targets ${segment}`, () => {
    assert.equal(intent(createModernX01Fixture({ score, throws: [], route: [segment] })).segment, segment);
  });
}

test("native 50 with S10 D20 route does not produce a premature Bull finish", () => {
  const f = createModernX01Fixture({ score: 50, throws: [], route: ["S10", "D20"] });
  assert.equal(intent(f), null);
  assert.equal(intent(f, { checkoutZoomTarget: "route-first" }).segment, "S10");
});

for (const base of [121, 170]) {
  test(`native X01 base ${base} is recognized without the legacy variant anchor`, () => {
    const f = createModernX01Fixture({ base });
    assert.equal(intent(f).segment, "D18");
  });
}

test("native two T20 throws retain the third-dart setup and respect its switch", () => {
  const f = createModernX01Fixture({ score: 181, throws: ["T20", "T20"], route: [] });
  assert.deepEqual(intent(f), { reason: "t20-setup", segment: "T20" });
  assert.equal(intent(f, { t20SetupZoomEnabled: false }), null);
});

test("native ambiguity, hidden player and Bust cannot select a random or stale finish", () => {
  const f = createModernX01Fixture();
  f.marker.hidden = true;
  assert.ok(Number.isNaN(readModernMatchSurface(f.documentRef, f.windowRef).activeScore));
  assert.equal(intent(f), null);
  f.marker.hidden = false;
  f.total.textContent = "BUST";
  assert.equal(intent(f), null);
  f.total.textContent = "85";
  f.variant.textContent = "Bull-off";
  assert.equal(intent(f), null);
});

test("native current match ignores a snapshot from a different match", () => {
  const f = createModernX01Fixture();
  const stale = { ...emptyGameState, isX01Variant: () => true, getActiveScore: () => 50,
    getActiveTurn: () => ({ id: "old-turn", throws: [] }),
    getSnapshot: () => ({ match: { id: "previous-match" } }) };
  assert.equal(intent(f, {}, {}, stale).segment, "D18");
});

test("native rest score wins over detached-era anchors and hidden suggestions do not enter the route", () => {
  const f = createModernX01Fixture();
  f.node(f.documentRef.main, "p", "ad-ext-player-score", "50");
  f.rows[2].row.hidden = true;
  const context = resolveX01CheckoutContext({ ...f, x01Rules, dartsRemaining: 1 });
  assert.equal(context.activeScore, 36);
  assert.deepEqual(context.routeSegments, []);
  assert.equal(context.checkoutSurface.authoritativeFinishSegment, "D18");
});
