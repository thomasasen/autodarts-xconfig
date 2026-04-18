import test from "node:test";
import assert from "node:assert/strict";

import {
  applyHighlightState,
  clearHighlightState,
  getAllScoreNodes,
  getScoreNodes,
} from "../../src/features/checkout-score-pulse/logic.js";
import { HIGHLIGHT_CLASS } from "../../src/features/checkout-score-pulse/style.js";
import { FakeDocument } from "./fake-dom.js";

function appendPlayerRow(documentRef, scoreText, { active = false } = {}) {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-player");
  if (active) {
    row.classList.add("ad-ext-player-active");
  }

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreNode.textContent = String(scoreText || "");
  row.appendChild(scoreNode);
  documentRef.main.appendChild(row);

  return { row, scoreNode };
}

test("checkout-score-pulse resolves hydration gaps to the active player index", () => {
  const documentRef = new FakeDocument();
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.activePlayerRow.remove();

  const first = appendPlayerRow(documentRef, "170");
  const second = appendPlayerRow(documentRef, "40");
  const third = appendPlayerRow(documentRef, "32");

  const resolved = getScoreNodes(documentRef, {
    getActivePlayerIndex: () => 1,
  });

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0], second.scoreNode);

  const allScoreNodes = getAllScoreNodes(documentRef);
  assert.equal(allScoreNodes.length, 3);
  assert.equal(allScoreNodes[0], first.scoreNode);
  assert.equal(allScoreNodes[1], second.scoreNode);
  assert.equal(allScoreNodes[2], third.scoreNode);
});

test("checkout-score-pulse returns no score nodes when a hydration gap cannot be mapped safely", () => {
  const documentRef = new FakeDocument();
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.activePlayerRow.remove();

  const first = appendPlayerRow(documentRef, "170");
  const second = appendPlayerRow(documentRef, "40");

  applyHighlightState([first.scoreNode], {
    shouldHighlight: true,
    effect: "pulse",
  });

  const resolved = getScoreNodes(documentRef, {
    getActivePlayerIndex: () => 5,
  });

  assert.equal(resolved.length, 0);
  clearHighlightState(getAllScoreNodes(documentRef));
  assert.equal(first.scoreNode.classList.contains(HIGHLIGHT_CLASS), false);
  assert.equal(second.scoreNode.classList.contains(HIGHLIGHT_CLASS), false);
});

test("checkout-score-pulse keeps the single-score fallback when only one score node exists", () => {
  const documentRef = new FakeDocument();

  const onlyScoreNodes = getAllScoreNodes(documentRef);
  assert.equal(onlyScoreNodes.length, 1);

  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  const resolved = getScoreNodes(documentRef, {
    getActivePlayerIndex: () => null,
  });

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0], documentRef.activeScoreElement);
});
