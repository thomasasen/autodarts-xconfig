import test from "node:test";
import assert from "node:assert/strict";
import * as x01Rules from "../../src/domain/x01-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { getFeatureConfigSpec } from "../../src/config/feature-config-spec.js";
import { initializeDartboardMarkerHighlight } from "../../src/features/dartboard-marker-highlight/index.js";
import { initializeDartMarkerReplacer } from "../../src/features/dart-marker-replacer/index.js";
import { mountCheckoutScoreHighlight } from "../../src/features/checkout-score-highlight/index.js";
import { mountX01RemainingScoreBar } from "../../src/features/x01-remaining-score-bar/index.js";
import { mountTurnDartDisplay } from "../../src/features/turn-dart-display/index.js";
import { initializeSpecialHitHighlights } from "../../src/features/special-hit-highlights/index.js";
import { initializeTurnScoreCounter } from "../../src/features/turn-score-counter/index.js";
import { initializeCheckoutSuggestionStyles } from "../../src/features/checkout-suggestion-styles/index.js";
import { BASE_CLASS as MARKER_CLASS } from "../../src/features/dartboard-marker-highlight/style.js";
import { OVERLAY_ID } from "../../src/features/dart-marker-replacer/style.js";
import { HIGHLIGHT_CLASS } from "../../src/features/checkout-score-highlight/style.js";
import { HOST_SELECTOR } from "../../src/features/x01-remaining-score-bar/style.js";
import { HIT_BASE_CLASS } from "../../src/features/special-hit-highlights/style.js";
import { MODERN_TURN_DART_ROW_CLASS } from "../../src/features/turn-dart-display/style.js";
import { LAYOUT_CLASS, BASE_CLASS as SUGGESTION_CLASS } from "../../src/features/checkout-suggestion-styles/style.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

function fixture(options = {}) {
  const f = createModernX01Fixture({ base: 501, score: 36, ...options });
  const marker = f.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  for (const [key, value] of Object.entries({ cx: 420, cy: 320, r: 5, filter: "url(#shadow-2dp)" })) marker.setAttribute(key, value);
  marker.__rect = { left: 940, top: 300, width: 6, height: 6 };
  marker.style.opacity = "0.6";
  f.layers[3].appendChild(marker);
  const pending = new Set();
  const subscriptions = new Set();
  const configs = {
    dartMarkerReplacer: { animateDarts: false, hideOriginalMarkers: true },
    checkoutScoreHighlight: { effect: "grow-only", triggerSource: "suggestion-only" },
    turnDartDisplay: { turnDartStyle: "solid" },
    turnScoreCounter: { flashOnChange: false, countEffect: "step-count" },
  };
  const context = {
    ...f, domGuards: createDomGuards({ documentRef: f.documentRef }),
    domain: { x01Rules, variantRules },
    registries: { observers: createObserverRegistry(), listeners: createListenerRegistry() },
    config: { getFeatureConfig(key) { return getFeatureConfigSpec(key)?.normalizeConfig({ enabled: true, ...configs[key] }) || {}; } },
    gameState: {
      isX01Variant: () => true, getOutMode: () => "Double Out", getActiveThrows: () => [], getActivePlayerIndex: () => 0,
      subscribe(handler) { subscriptions.add(handler); return () => subscriptions.delete(handler); },
    },
    helpers: { createRafScheduler(callback) { return { schedule() { pending.add(callback); }, cancel() { pending.delete(callback); } }; } },
  };
  return { ...f, marker, context, subscriptions,
    emit() { [...subscriptions].forEach((handler) => handler({})); },
    flush() {
      for (let iteration = 0; pending.size && iteration < 10; iteration += 1) {
        const batch = [...pending]; pending.clear(); batch.forEach((callback) => callback());
      }
      assert.equal(pending.size, 0, "surface updates must settle");
    } };
}

test("all Board marker combinations retain native appearance and release only their own representation", () => {
  for (let flags = 0; flags < 4; flags += 1) {
    const f = fixture();
    const cleanups = [
      flags & 1 ? initializeDartboardMarkerHighlight(f.context) : () => {},
      flags & 2 ? initializeDartMarkerReplacer(f.context) : () => {},
    ];
    try {
      f.flush();
      assert.equal(f.marker.classList.contains(MARKER_CLASS), Boolean(flags & 1));
      assert.equal(Boolean(f.documentRef.getElementById(OVERLAY_ID)), Boolean(flags & 2));
      assert.equal(f.subscriptions.size, flags ? 1 : 0);
      if (flags & 2) assert.equal(f.marker.style.opacity, "0");
      cleanups[1](); f.flush();
      assert.equal(f.marker.classList.contains(MARKER_CLASS), Boolean(flags & 1));
      assert.equal(f.marker.style.opacity, flags & 1 ? "0.85" : "0.6");
    } finally { cleanups.forEach((cleanup) => cleanup()); }
    assert.equal(f.marker.style.opacity, "0.6");
    assert.equal(f.marker.getAttribute("r"), "5");
    assert.equal(f.subscriptions.size, 0);
  }
});

test("all X01 score combinations keep finish truth separate from the progress bar and clean up independently", () => {
  for (let flags = 0; flags < 4; flags += 1) {
    const f = fixture({ throws: [], route: ["D18"] });
    const cleanups = [
      flags & 1 ? mountCheckoutScoreHighlight(f.context) : () => {},
      flags & 2 ? mountX01RemainingScoreBar(f.context) : () => {},
    ];
    try {
      f.flush();
      assert.equal(f.score.classList.contains(HIGHLIGHT_CLASS), Boolean(flags & 1));
      assert.equal(Boolean(f.card.querySelector(HOST_SELECTOR)), Boolean(flags & 2));
      assert.equal(f.subscriptions.size, flags ? 1 : 0);
      if (flags & 1) {
        f.score.textContent = "169"; f.setVisit([], []);
        f.emit(); f.flush();
        assert.equal(f.score.classList.contains(HIGHLIGHT_CLASS), false);
        assert.equal(Boolean(f.card.querySelector(HOST_SELECTOR)), Boolean(flags & 2));
      }
      cleanups[0](); f.flush();
      assert.equal(Boolean(f.card.querySelector(HOST_SELECTOR)), Boolean(flags & 2));
    } finally { cleanups.forEach((cleanup) => cleanup()); }
    assert.equal(f.card.querySelector(HOST_SELECTOR), null);
    assert.equal(f.subscriptions.size, 0);
  }
});

test("all eight turn display combinations preserve checkout hints, actual hit feedback and the original total", () => {
  for (let flags = 0; flags < 8; flags += 1) {
    const f = fixture();
    const cleanups = [
      flags & 1 ? mountTurnDartDisplay(f.context) : () => {},
      flags & 2 ? initializeSpecialHitHighlights(f.context) : () => {},
      flags & 4 ? initializeTurnScoreCounter(f.context) : () => {},
    ];
    try {
      f.flush();
      assert.equal(f.rows[0].row.classList.contains(MODERN_TURN_DART_ROW_CLASS), Boolean(flags & 1));
      assert.equal(f.rows[0].row.classList.contains(HIT_BASE_CLASS), Boolean(flags & 2));
      assert.equal(f.rows[2].row.classList.contains(HIT_BASE_CLASS), false, "D18 is a suggestion until thrown");
      assert.equal(f.total.classList.contains("ad-ext-turn-points"), Boolean(flags & 4));
      assert.equal(f.total.textContent, "85");
      assert.equal(f.subscriptions.size, flags ? 1 : 0);
      cleanups[1](); f.flush();
      assert.equal(f.rows[0].row.classList.contains(MODERN_TURN_DART_ROW_CLASS), Boolean(flags & 1));
      assert.equal(f.total.classList.contains("ad-ext-turn-points"), Boolean(flags & 4));
    } finally { cleanups.forEach((cleanup) => cleanup()); }
    assert.equal(f.total.textContent, "85");
    assert.equal(f.total.classList.contains("ad-ext-turn-points"), false);
    assert.equal(f.subscriptions.size, 0);
  }
});

test("checkout styling shares the turn surface without changing the other turn display switches", () => {
  const f = fixture();
  const cleanupDarts = mountTurnDartDisplay(f.context);
  const cleanupCheckout = initializeCheckoutSuggestionStyles(f.context);
  try {
    f.flush();
    assert.equal(f.subscriptions.size, 1);
    assert.equal(f.turn.classList.contains(LAYOUT_CLASS), true);
    assert.equal(f.rows[2].row.classList.contains(SUGGESTION_CLASS), true);
    cleanupCheckout(); f.flush();
    assert.equal(f.turn.classList.contains(LAYOUT_CLASS), false);
    assert.equal(f.rows[0].row.classList.contains(MODERN_TURN_DART_ROW_CLASS), true);
    assert.equal(f.subscriptions.size, 1);
  } finally { cleanupCheckout(); cleanupDarts(); }
});
