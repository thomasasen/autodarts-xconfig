import test from "node:test";
import assert from "node:assert/strict";

import {
  collectTurnThrowRows,
  collectTurnThrowTextNodes,
  createTurnSurfaceObserveOptions,
  findTurnContainer,
  getTurnSurfaceSnapshot,
  hasRelevantTurnSurfaceMutation,
  readTurnScoreToken,
} from "../../src/features/shared/turn-surface-adapter.js";
import { FakeDocument } from "./fake-dom.js";

function appendThrowRow(documentRef, text = "") {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-turn-throw");
  const textNode = documentRef.createElement("p");
  textNode.classList.add("chakra-text");
  textNode.textContent = String(text || "");
  row.appendChild(textNode);
  return {
    row,
    textNode,
  };
}

function appendTurnScoreCard(documentRef) {
  const card = documentRef.createElement("div");
  card.classList.add("score");
  card.appendChild(documentRef.createElement("img"));
  return card;
}

function appendStructuredThrowRow(documentRef, scoreText, segmentText) {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-turn-throw");
  row.appendChild(documentRef.createElement("img"));

  const textNode = documentRef.createElement("p");
  textNode.classList.add("chakra-text");
  textNode.textContent = `${scoreText}${segmentText}`;

  const wrapper = documentRef.createElement("div");
  const scoreNode = documentRef.createElement("div");
  scoreNode.textContent = String(scoreText || "");
  const segmentNode = documentRef.createElement("div");
  segmentNode.textContent = String(segmentText || "");

  wrapper.appendChild(scoreNode);
  wrapper.appendChild(segmentNode);
  textNode.appendChild(wrapper);
  row.appendChild(textNode);
  row.textContent = `${scoreText}${segmentText}`;

  return {
    row,
    textNode,
  };
}

test("collectTurnThrowRows prefers direct rows inside #ad-ext-turn", () => {
  const documentRef = new FakeDocument();
  const directRow = documentRef.throwRow;

  const nestedWrapper = documentRef.createElement("div");
  const nested = appendThrowRow(documentRef, "T20");
  nestedWrapper.appendChild(nested.row);
  documentRef.turnContainer.appendChild(nestedWrapper);

  const external = appendThrowRow(documentRef, "D20");
  documentRef.main.appendChild(external.row);

  assert.equal(findTurnContainer(documentRef), documentRef.turnContainer);
  assert.deepEqual(collectTurnThrowRows(documentRef), [directRow]);
});

test("readTurnScoreToken and collectTurnThrowTextNodes use scoped turn-surface fallbacks safely", () => {
  const documentRef = new FakeDocument();
  documentRef.turnScoreElement.textContent = "  140  ";

  const extraRow = appendThrowRow(documentRef, "S25");
  documentRef.turnContainer.appendChild(extraRow.row);

  const nodes = collectTurnThrowTextNodes(documentRef, [
    ".ad-ext-turn-throw p.chakra-text",
    ".ad-ext-turn-throw p",
    ".ad-ext-turn-throw",
  ]);

  assert.equal(readTurnScoreToken(documentRef), "140");
  assert.ok(nodes.includes(documentRef.throwTextElement));
  assert.ok(nodes.includes(extraRow.textNode));
  assert.equal(nodes.filter((node) => node === documentRef.throwTextElement).length, 1);
});

test("getTurnSurfaceSnapshot keeps row source, rows and turn points token aligned", () => {
  const documentRef = new FakeDocument();
  documentRef.turnScoreElement.textContent = "  140  ";

  const snapshotWithContainer = getTurnSurfaceSnapshot(documentRef);
  assert.equal(snapshotWithContainer.turnContainer, documentRef.turnContainer);
  assert.deepEqual(snapshotWithContainer.throwRows, [documentRef.throwRow]);
  assert.equal(snapshotWithContainer.turnScoreToken, "140");
  assert.equal(snapshotWithContainer.rowSource, "turn-container");

  documentRef.turnContainer.remove();
  const fallbackRow = appendThrowRow(documentRef, "T20");
  documentRef.main.appendChild(fallbackRow.row);
  documentRef.turnScoreElement.textContent = "  100  ";

  const fallbackSnapshot = getTurnSurfaceSnapshot(documentRef);
  assert.equal(fallbackSnapshot.turnContainer, null);
  assert.deepEqual(fallbackSnapshot.throwRows, [fallbackRow.row]);
  assert.equal(fallbackSnapshot.turnScoreToken, "100");
  assert.equal(fallbackSnapshot.rowSource, "document-fallback");
});

test("getTurnSurfaceSnapshot keeps the X01 base surface stable before any throw rows exist", () => {
  const documentRef = new FakeDocument();
  documentRef.turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  documentRef.turnScoreElement.textContent = "  0  ";
  pointsFrame.appendChild(documentRef.turnScoreElement);
  documentRef.turnContainer.appendChild(pointsFrame);
  documentRef.turnContainer.appendChild(appendTurnScoreCard(documentRef));
  documentRef.turnContainer.appendChild(appendTurnScoreCard(documentRef));
  documentRef.turnContainer.appendChild(appendTurnScoreCard(documentRef));

  const snapshot = getTurnSurfaceSnapshot(documentRef);

  assert.equal(findTurnContainer(documentRef), documentRef.turnContainer);
  assert.deepEqual(collectTurnThrowRows(documentRef), []);
  assert.equal(readTurnScoreToken(documentRef), "0");
  assert.equal(snapshot.turnContainer, documentRef.turnContainer);
  assert.deepEqual(snapshot.throwRows, []);
  assert.equal(snapshot.turnScoreToken, "0");
  assert.equal(snapshot.rowSource, "turn-container");
});

test("getTurnSurfaceSnapshot keeps a live X01 partial turn aligned with direct throw rows and one preview slot", () => {
  const documentRef = new FakeDocument();
  documentRef.turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  documentRef.turnScoreElement.textContent = "  79  ";
  pointsFrame.appendChild(documentRef.turnScoreElement);

  const firstThrow = appendStructuredThrowRow(documentRef, "19", "S19");
  const secondThrow = appendStructuredThrowRow(documentRef, "60", "T20");
  const remainingPreview = appendTurnScoreCard(documentRef);

  documentRef.turnContainer.appendChild(pointsFrame);
  documentRef.turnContainer.appendChild(firstThrow.row);
  documentRef.turnContainer.appendChild(secondThrow.row);
  documentRef.turnContainer.appendChild(remainingPreview);

  const snapshot = getTurnSurfaceSnapshot(documentRef);
  const nodes = collectTurnThrowTextNodes(documentRef, [
    ".ad-ext-turn-throw p.chakra-text",
    ".ad-ext-turn-throw p",
    ".ad-ext-turn-throw",
  ]);

  assert.deepEqual(collectTurnThrowRows(documentRef), [firstThrow.row, secondThrow.row]);
  assert.equal(readTurnScoreToken(documentRef), "79");
  assert.deepEqual(snapshot.throwRows, [firstThrow.row, secondThrow.row]);
  assert.equal(snapshot.turnScoreToken, "79");
  assert.equal(snapshot.rowSource, "turn-container");
  assert.ok(nodes.includes(firstThrow.textNode));
  assert.ok(nodes.includes(secondThrow.textNode));
  assert.equal(nodes.includes(remainingPreview), false);
});

test("getTurnSurfaceSnapshot keeps scoreless darts-zoom rows aligned when enhanced scoring display is disabled", () => {
  const documentRef = new FakeDocument();
  documentRef.turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  documentRef.turnScoreElement.textContent = "  36  ";
  pointsFrame.appendChild(documentRef.turnScoreElement);

  const firstThrow = appendStructuredThrowRow(documentRef, "", "S16");
  const secondThrow = appendStructuredThrowRow(documentRef, "", "S20");

  documentRef.turnContainer.appendChild(pointsFrame);
  documentRef.turnContainer.appendChild(firstThrow.row);
  documentRef.turnContainer.appendChild(secondThrow.row);

  const snapshot = getTurnSurfaceSnapshot(documentRef);
  const nodes = collectTurnThrowTextNodes(documentRef, [
    ".ad-ext-turn-throw p.chakra-text",
    ".ad-ext-turn-throw p",
    ".ad-ext-turn-throw",
  ]);

  assert.deepEqual(collectTurnThrowRows(documentRef), [firstThrow.row, secondThrow.row]);
  assert.equal(readTurnScoreToken(documentRef), "36");
  assert.deepEqual(snapshot.throwRows, [firstThrow.row, secondThrow.row]);
  assert.equal(snapshot.turnScoreToken, "36");
  assert.equal(snapshot.rowSource, "turn-container");
  assert.ok(nodes.includes(firstThrow.textNode));
  assert.ok(nodes.includes(secondThrow.textNode));
});

test("getTurnSurfaceSnapshot keeps bottom-left darts-zoom rows aligned with three direct scoreless throws", () => {
  const documentRef = new FakeDocument();
  documentRef.turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  documentRef.turnScoreElement.textContent = "  26  ";
  pointsFrame.appendChild(documentRef.turnScoreElement);

  const firstThrow = appendStructuredThrowRow(documentRef, "", "S5");
  const secondThrow = appendStructuredThrowRow(documentRef, "", "S19");
  const thirdThrow = appendStructuredThrowRow(documentRef, "", "S2");

  documentRef.turnContainer.appendChild(pointsFrame);
  documentRef.turnContainer.appendChild(firstThrow.row);
  documentRef.turnContainer.appendChild(secondThrow.row);
  documentRef.turnContainer.appendChild(thirdThrow.row);

  const snapshot = getTurnSurfaceSnapshot(documentRef);
  const nodes = collectTurnThrowTextNodes(documentRef, [
    ".ad-ext-turn-throw p.chakra-text",
    ".ad-ext-turn-throw p",
    ".ad-ext-turn-throw",
  ]);

  assert.deepEqual(collectTurnThrowRows(documentRef), [
    firstThrow.row,
    secondThrow.row,
    thirdThrow.row,
  ]);
  assert.equal(readTurnScoreToken(documentRef), "26");
  assert.deepEqual(snapshot.throwRows, [firstThrow.row, secondThrow.row, thirdThrow.row]);
  assert.equal(snapshot.turnScoreToken, "26");
  assert.equal(snapshot.rowSource, "turn-container");
  assert.ok(nodes.includes(firstThrow.textNode));
  assert.ok(nodes.includes(secondThrow.textNode));
  assert.ok(nodes.includes(thirdThrow.textNode));
});

test("createTurnSurfaceObserveOptions watches throw-surface attribute changes with a stable default filter", () => {
  const observeOptions = createTurnSurfaceObserveOptions({
    attributeFilter: ["data-score", "class"],
  });

  assert.equal(observeOptions.childList, true);
  assert.equal(observeOptions.subtree, true);
  assert.equal(observeOptions.characterData, true);
  assert.equal(observeOptions.attributes, true);
  assert.equal(Array.isArray(observeOptions.attributeFilter), true);
  assert.equal(observeOptions.attributeFilter.includes("class"), true);
  assert.equal(observeOptions.attributeFilter.includes("style"), true);
  assert.equal(observeOptions.attributeFilter.includes("data-score"), true);
  assert.equal(
    observeOptions.attributeFilter.filter((value) => value === "class").length,
    1
  );
});

test("turn-surface mutation filter ignores unrelated game DOM churn", () => {
  const documentRef = new FakeDocument();
  const unrelatedNode = documentRef.createElement("div");
  documentRef.sidebar.appendChild(unrelatedNode);

  assert.equal(
    hasRelevantTurnSurfaceMutation([
      {
        target: documentRef.sidebar,
        addedNodes: [unrelatedNode],
        removedNodes: [],
      },
    ]),
    false
  );
});

test("turn-surface mutation filter accepts turn rows, scores, suggestions, and root replacement", () => {
  const documentRef = new FakeDocument();
  const suggestionNode = documentRef.createElement("span");
  suggestionNode.classList.add("suggestion");
  const suggestionWrapper = documentRef.createElement("div");
  suggestionWrapper.appendChild(suggestionNode);

  assert.equal(
    hasRelevantTurnSurfaceMutation([{ target: documentRef.throwRow }]),
    true
  );
  assert.equal(
    hasRelevantTurnSurfaceMutation([{ target: documentRef.turnScoreElement }]),
    true
  );
  assert.equal(
    hasRelevantTurnSurfaceMutation(
      [{ target: documentRef.main, addedNodes: [suggestionWrapper] }],
      { extraSelectors: [".suggestion"] }
    ),
    true
  );

  const removedTurnRoot = documentRef.turnContainer;
  removedTurnRoot.remove();
  assert.equal(
    hasRelevantTurnSurfaceMutation([
      { target: documentRef.main, addedNodes: [], removedNodes: [removedTurnRoot] },
    ]),
    true
  );
});

test("turn-surface mutation filter suppresses feature-managed mutations", () => {
  const documentRef = new FakeDocument();
  documentRef.throwRow.classList.add("feature-managed");

  assert.equal(
    hasRelevantTurnSurfaceMutation(
      [{ target: documentRef.throwRow, addedNodes: [], removedNodes: [] }],
      {
        isManagedNode(node) {
          return node?.classList?.contains("feature-managed") === true;
        },
      }
    ),
    false
  );
});
