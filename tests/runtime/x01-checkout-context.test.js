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
  const hasSnapshot = Object.hasOwn(overrides, "snapshot");
  const snapshot = hasSnapshot ? overrides.snapshot : null;
  const activeTurn = overrides.activeTurn || {
    id: "turn-1",
    playerId: "player-1",
    throws: activeThrows,
  };

  const gameState = {
    isX01Variant: () => true,
    getActiveScore: () => activeScore,
    getOutMode: () => outMode,
    getActiveTurn: () => activeTurn,
    getActiveThrows: () => activeThrows,
  };

  if (hasSnapshot) {
    gameState.getSnapshot = () => snapshot;
  }

  return gameState;
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

function createHostCheckoutSuggestionCard(documentRef, scoreText, segmentText, left, top) {
  const node = documentRef.createElement("div");
  const imageNode = documentRef.createElement("img");
  const textNode = documentRef.createElement("p");
  const scoreNode = documentRef.createElement("div");
  const segmentNode = documentRef.createElement("div");

  node.classList.add("suggestion");
  node.textContent = `${scoreText}${segmentText}`;
  node.innerText = `${scoreText}\n${segmentText}`;
  node.__rect = {
    left,
    top,
    width: 356,
    height: 125,
  };

  textNode.classList.add("chakra-text");
  textNode.textContent = `${scoreText}${segmentText}`;
  textNode.innerText = `${scoreText}\n${segmentText}`;
  scoreNode.textContent = String(scoreText || "");
  segmentNode.textContent = String(segmentText || "");
  textNode.appendChild(scoreNode);
  textNode.appendChild(segmentNode);

  node.appendChild(imageNode);
  node.appendChild(textNode);
  return node;
}

function createHostThrowRow(documentRef, scoreText, segmentText, left, top) {
  const rowNode = documentRef.createElement("div");
  const imageNode = documentRef.createElement("img");
  const textNode = documentRef.createElement("p");
  const scoreNode = documentRef.createElement("div");
  const segmentNode = documentRef.createElement("div");

  rowNode.classList.add("ad-ext-turn-throw");
  rowNode.textContent = `${scoreText}${segmentText}`;
  rowNode.innerText = `${scoreText}\n${segmentText}`;
  rowNode.__rect = {
    left,
    top,
    width: 356,
    height: 125,
  };

  textNode.classList.add("chakra-text");
  textNode.textContent = `${scoreText}${segmentText}`;
  textNode.innerText = `${scoreText}\n${segmentText}`;
  scoreNode.textContent = String(scoreText || "");
  segmentNode.textContent = String(segmentText || "");
  textNode.appendChild(scoreNode);
  textNode.appendChild(segmentNode);

  rowNode.appendChild(imageNode);
  rowNode.appendChild(textNode);
  return rowNode;
}

function installHostCheckoutTurnSurface(documentRef, route = [], options = {}) {
  documentRef.suggestionElement.remove();
  documentRef.turnPointsElement.remove();
  documentRef.turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  const pointsText = documentRef.createElement("p");
  const throwRows = Array.isArray(options.throwRows) ? options.throwRows : [];
  const previewSlots = Number.isFinite(options.previewSlots) ? Math.max(0, Number(options.previewSlots)) : 1;
  let left = 129;

  pointsFrame.classList.add("css-rrf7rv");
  pointsFrame.__rect = { left, top: 264, width: 240, height: 125 };
  pointsText.classList.add("ad-ext-turn-points");
  pointsText.textContent = String(options.pointsText ?? "0");
  pointsFrame.appendChild(pointsText);
  documentRef.turnContainer.appendChild(pointsFrame);
  left += 248;

  throwRows.forEach(({ scoreText, segmentText }) => {
    const throwRowNode = createHostThrowRow(
      documentRef,
      scoreText,
      segmentText,
      left,
      264
    );
    documentRef.turnContainer.appendChild(throwRowNode);
    left += 365;
  });

  route.forEach(({ scoreText, segmentText }) => {
    const suggestionNode = createHostCheckoutSuggestionCard(
      documentRef,
      scoreText,
      segmentText,
      left,
      264
    );
    documentRef.turnContainer.appendChild(suggestionNode);
    left += 365;
  });

  for (let index = 0; index < previewSlots; index += 1) {
    const previewSlot = documentRef.createElement("div");
    const previewImage = documentRef.createElement("img");
    previewSlot.classList.add("score");
    previewSlot.__rect = { left, top: 264, width: 356, height: 125 };
    previewSlot.appendChild(previewImage);
    documentRef.turnContainer.appendChild(previewSlot);
    left += 365;
  }
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

test("x01 checkout context ignores stale game-state from another match route", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "121";
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/current-match",
  });

  const resolved = resolveX01ActiveScoreState({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 16,
      outMode: "Double Out",
      snapshot: {
        topic: "old-match.state",
        match: { id: "old-match" },
      },
    }),
  });

  assert.equal(resolved.activeScore, 121);
  assert.equal(resolved.domScore, 121);
  assert.equal(Number.isNaN(resolved.gameStateScore), true);
  assert.equal(resolved.scoreSource, "dom");
  assert.equal(resolved.scoreAgreement, "dom-only");
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
  documentRef.activeScoreElement.remove();

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

test("x01 checkout context keeps host checkout surface and score truth aligned for a visible route in #ad-ext-turn", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "56";
  installHostCheckoutTurnSurface(documentRef, [
    { scoreText: "16", segmentText: "S16" },
    { scoreText: "40", segmentText: "D20" },
  ]);

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 56,
      outMode: "Double Out",
      activeThrows: [],
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 56);
  assert.equal(resolved.domScore, 56);
  assert.equal(resolved.gameStateScore, 56);
  assert.equal(resolved.scoreSource, "game-state+dom");
  assert.equal(resolved.scoreAgreement, "match");
  assert.deepEqual(resolved.routeSegments, ["S16", "D20"]);
  assert.equal(resolved.checkoutSurface.selectionSource, "validated-visible-route");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["S16", "D20"]);
  assert.equal(resolved.checkoutSurface.surfaceKind, "visible-explicit-checkout");
  assert.equal(resolved.checkoutSurface.firstVisibleSegment, "S16");
  assert.equal(resolved.checkoutSurface.visibleFinishSegment, "D20");
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, false);
});

test("x01 checkout context keeps a direct D20 finish card authoritative beside prior throw rows", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "40";
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "40", segmentText: "D20" }],
    {
      pointsText: "16",
      throwRows: [{ scoreText: "16", segmentText: "S16" }],
      previewSlots: 1,
    }
  );

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 40,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S16" } }],
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 40);
  assert.equal(resolved.domScore, 40);
  assert.equal(resolved.gameStateScore, 40);
  assert.equal(resolved.scoreSource, "game-state+dom");
  assert.equal(resolved.scoreAgreement, "match");
  assert.deepEqual(resolved.routeSegments, ["D20"]);
  assert.equal(resolved.checkoutSurface.selectionSource, "validated-visible-route");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D20"]);
  assert.equal(resolved.checkoutSurface.surfaceKind, "visible-explicit-checkout");
  assert.equal(resolved.checkoutSurface.firstVisibleSegment, "D20");
  assert.equal(resolved.checkoutSurface.visibleFinishSegment, "D20");
  assert.equal(resolved.checkoutSurface.authoritativeFinishSegment, "D20");
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, true);
  assert.equal(resolved.checkoutSurface.singleVisibleSegment, "D20");
});

test("x01 checkout context keeps a visible S3 setup card after S16 and S5 remove checkout availability", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "35";
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "3", segmentText: "S3" }],
    {
      pointsText: "21",
      throwRows: [
        { scoreText: "16", segmentText: "S16" },
        { scoreText: "5", segmentText: "S5" },
      ],
      previewSlots: 0,
    }
  );

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 35,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S16" } }, { segment: { name: "S5" } }],
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 35);
  assert.equal(resolved.domScore, 35);
  assert.equal(resolved.gameStateScore, 35);
  assert.equal(resolved.scoreSource, "game-state+dom");
  assert.equal(resolved.scoreAgreement, "match");
  assert.deepEqual(resolved.routeSegments, ["S3"]);
  assert.equal(resolved.checkoutSurface.selectionSource, "visible-setup-segment");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["S3"]);
  assert.equal(resolved.checkoutSurface.surfaceKind, "visible-setup-only");
  assert.equal(resolved.checkoutSurface.firstVisibleSegment, "S3");
  assert.equal(resolved.checkoutSurface.visibleFinishSegment, "");
  assert.equal(resolved.checkoutSurface.authoritativeFinishSegment, "");
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, false);
  assert.equal(resolved.checkoutSurface.singleVisibleSegment, "S3");
});

test("x01 checkout context keeps a visible D10 finish card after S16 and S20 keep checkout alive", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "20";
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "20", segmentText: "D10" }],
    {
      pointsText: "36",
      throwRows: [
        { scoreText: "16", segmentText: "S16" },
        { scoreText: "20", segmentText: "S20" },
      ],
      previewSlots: 0,
    }
  );

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 20,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S16" } }, { segment: { name: "S20" } }],
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 20);
  assert.equal(resolved.domScore, 20);
  assert.equal(resolved.gameStateScore, 20);
  assert.equal(resolved.scoreSource, "game-state+dom");
  assert.equal(resolved.scoreAgreement, "match");
  assert.deepEqual(resolved.routeSegments, ["D10"]);
  assert.equal(resolved.checkoutSurface.selectionSource, "validated-visible-route");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D10"]);
  assert.equal(resolved.checkoutSurface.surfaceKind, "visible-explicit-checkout");
  assert.equal(resolved.checkoutSurface.firstVisibleSegment, "D10");
  assert.equal(resolved.checkoutSurface.visibleFinishSegment, "D10");
  assert.equal(resolved.checkoutSurface.authoritativeFinishSegment, "D10");
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, true);
  assert.equal(resolved.checkoutSurface.singleVisibleSegment, "D10");
});

test("x01 checkout context keeps scoreless D10 host cards authoritative when enhanced scoring display is disabled", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.activeScoreElement.textContent = "20";
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "", segmentText: "D10" }],
    {
      pointsText: "36",
      throwRows: [
        { scoreText: "", segmentText: "S16" },
        { scoreText: "", segmentText: "S20" },
      ],
      previewSlots: 0,
    }
  );

  const resolved = resolveX01CheckoutContext({
    documentRef,
    windowRef,
    gameState: createX01GameState({
      activeScore: 20,
      outMode: "Double Out",
      activeThrows: [{ segment: { name: "S16" } }, { segment: { name: "S20" } }],
    }),
    x01Rules,
  });

  assert.equal(resolved.activeScore, 20);
  assert.equal(resolved.domScore, 20);
  assert.equal(resolved.gameStateScore, 20);
  assert.equal(resolved.scoreSource, "game-state+dom");
  assert.equal(resolved.scoreAgreement, "match");
  assert.deepEqual(resolved.routeSegments, ["D10"]);
  assert.equal(resolved.checkoutSurface.selectionSource, "validated-visible-route");
  assert.deepEqual(resolved.checkoutSurface.authoritativeRouteSegments, ["D10"]);
  assert.equal(resolved.checkoutSurface.surfaceKind, "visible-explicit-checkout");
  assert.equal(resolved.checkoutSurface.firstVisibleSegment, "D10");
  assert.equal(resolved.checkoutSurface.visibleFinishSegment, "D10");
  assert.equal(resolved.checkoutSurface.authoritativeFinishSegment, "D10");
  assert.equal(resolved.checkoutSurface.canUseAuthoritativeFinishNow, true);
  assert.equal(resolved.checkoutSurface.singleVisibleSegment, "D10");
});
