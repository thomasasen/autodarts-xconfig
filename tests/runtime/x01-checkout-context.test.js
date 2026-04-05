import test from "node:test";
import assert from "node:assert/strict";

import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  resolveX01ActiveScoreState,
  resolveX01CheckoutContext,
} from "../../src/features/x01-checkout-context.js";
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

function appendSuggestion(documentRef, text, left = 300, top = 10) {
  const node = documentRef.createElement("div");
  node.classList.add("suggestion");
  node.textContent = text;
  node.__rect = {
    left,
    top,
    width: 180,
    height: 48,
  };
  documentRef.main.appendChild(node);
  return node;
}

test("x01 checkout context reports matching DOM and game-state scores as a shared truth", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "40";

  const resolved = resolveX01ActiveScoreState({
    documentRef,
    windowRef: createFakeWindow({ documentRef }),
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
    }),
  });

  assert.deepEqual(resolved, {
    activeScore: 40,
    domScore: 40,
    gameStateScore: 40,
    scoreSource: "game-state+dom",
    scoreAgreement: "match",
  });
});

test("x01 checkout context prefers the visible DOM score when the game-state lags", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "121";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  appendSuggestion(documentRef, "25", 520, 16);
  appendSuggestion(documentRef, "D18", 720, 16);

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 36,
      outMode: "Double Out",
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 121);
  assert.equal(resolved.domScore, 121);
  assert.equal(resolved.gameStateScore, 36);
  assert.equal(resolved.scoreSource, "dom-preferred");
  assert.equal(resolved.scoreAgreement, "mismatch");
  assert.deepEqual(resolved.routeSegments, ["T20", "S25", "D18"]);
  assert.equal(resolved.checkoutSurface.selectionSource, "validated-visible-route");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["T20", "S25", "D18"]);
});

test("x01 checkout context falls back to DOM-only score truth when no game-state score exists", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "32";

  const resolved = resolveX01ActiveScoreState({
    documentRef,
    windowRef: createFakeWindow({ documentRef }),
    gameState: null,
  });

  assert.deepEqual(resolved, {
    activeScore: 32,
    domScore: 32,
    gameStateScore: Number.NaN,
    scoreSource: "dom",
    scoreAgreement: "dom-only",
  });
  assert.equal(Number.isNaN(resolved.gameStateScore), true);
});

test("x01 checkout context falls back to game-state score truth when no DOM score is available", () => {
  const documentRef = new FakeDocument();
  documentRef.activePlayerRow.removeChild(documentRef.activeScoreElement);

  const resolved = resolveX01ActiveScoreState({
    documentRef,
    windowRef: createFakeWindow({ documentRef }),
    gameState: createX01GameState({
      activeScore: 50,
      outMode: "Double Out",
    }),
  });

  assert.equal(resolved.activeScore, 50);
  assert.equal(Number.isNaN(resolved.domScore), true);
  assert.equal(resolved.gameStateScore, 50);
  assert.equal(resolved.scoreSource, "game-state");
  assert.equal(resolved.scoreAgreement, "game-state-only");
});

test("x01 checkout context keeps score-route fallback coherent for stale visible routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "36";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  appendSuggestion(documentRef, "25", 520, 16);
  appendSuggestion(documentRef, "D18", 720, 16);

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 36,
      outMode: "Double Out",
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 36);
  assert.equal(resolved.checkoutSurface.selectionSource, "score-route");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D18"]);
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, true);
});
