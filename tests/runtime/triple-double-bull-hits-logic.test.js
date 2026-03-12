import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyThrowText,
  collectThrowRows,
  clearHitDecoration,
  updateHitDecorations,
} from "../../src/features/triple-double-bull-hits/logic.js";
import { HIT_BASE_CLASS, HIT_KIND_CLASS } from "../../src/features/triple-double-bull-hits/style.js";
import { FakeDocument } from "./fake-dom.js";

test("classifyThrowText resolves mixed throw text by containment priority", () => {
  const triple = classifyThrowText("60 T20");
  assert.equal(triple?.kind, "triple");
  assert.equal(triple?.segment, "T20");

  const double = classifyThrowText("36 D18");
  assert.equal(double?.kind, "double");
  assert.equal(double?.segment, "D18");

  const outerBull = classifyThrowText("25 S25");
  assert.equal(outerBull?.kind, "bullOuter");
  assert.equal(outerBull?.segment, "S25");

  const innerBull = classifyThrowText("50 BULL");
  assert.equal(innerBull?.kind, "bullInner");
  assert.equal(innerBull?.segment, "BULL");

  assert.equal(classifyThrowText("alpha beta gamma"), null);
});

test("updateHitDecorations decorates rows and differentiates single bull vs bullseye", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();

  const tripleRow = documentRef.throwRow;
  const tripleNode = documentRef.throwTextElement;
  tripleNode.textContent = "60 T20";
  tripleRow.textContent = "60 T20";

  const doubleRow = documentRef.createElement("div");
  doubleRow.classList.add("ad-ext-turn-throw");
  const doubleNode = documentRef.createElement("p");
  doubleNode.classList.add("chakra-text");
  doubleNode.textContent = "36 D18";
  doubleRow.textContent = "36 D18";
  doubleRow.appendChild(doubleNode);
  documentRef.turnContainer.appendChild(doubleRow);

  const outerBullRow = documentRef.createElement("div");
  outerBullRow.classList.add("ad-ext-turn-throw");
  const outerBullNode = documentRef.createElement("p");
  outerBullNode.classList.add("chakra-text");
  outerBullNode.textContent = "25 S25";
  outerBullRow.textContent = "25 S25";
  outerBullRow.appendChild(outerBullNode);
  documentRef.turnContainer.appendChild(outerBullRow);

  const innerBullRow = documentRef.createElement("div");
  innerBullRow.classList.add("ad-ext-turn-throw");
  const innerBullNode = documentRef.createElement("p");
  innerBullNode.classList.add("chakra-text");
  innerBullNode.textContent = "50 BULL";
  innerBullRow.textContent = "50 BULL";
  innerBullRow.appendChild(innerBullNode);
  documentRef.turnContainer.appendChild(innerBullRow);

  const stats = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "volt-lime",
      animationStyle: "neon-pulse",
    },
    debugRows: true,
  });

  assert.equal(tripleRow.classList.contains(HIT_KIND_CLASS.triple), true);
  assert.equal(doubleRow.classList.contains(HIT_KIND_CLASS.double), true);
  assert.equal(outerBullRow.classList.contains(HIT_KIND_CLASS.bullOuter), true);
  assert.equal(innerBullRow.classList.contains(HIT_KIND_CLASS.bullInner), true);
  assert.equal(stats.rowCount, 4);
  assert.equal(stats.decoratedCount, 4);
  assert.equal(stats.replayedCount, 4);
  assert.equal(stats.removedCount, 0);
  assert.equal(stats.rowSource, "turn-container");
  assert.equal(stats.kindCounts.triple, 1);
  assert.equal(stats.kindCounts.double, 1);
  assert.equal(stats.kindCounts.bullOuter, 1);
  assert.equal(stats.kindCounts.bullInner, 1);
  assert.equal(Array.isArray(stats.rows), true);
  assert.equal(stats.rows.length, 4);
});

test("clearHitDecoration removes all triple/double/bull classes from row", () => {
  const documentRef = new FakeDocument();
  const rowNode = documentRef.throwRow;
  rowNode.classList.add(HIT_KIND_CLASS.triple, HIT_KIND_CLASS.double, HIT_KIND_CLASS.bullOuter);

  clearHitDecoration(rowNode, new Map([[rowNode, "triple|T20|volt-lime|neon-pulse"]]));

  assert.equal(rowNode.classList.contains(HIT_KIND_CLASS.triple), false);
  assert.equal(rowNode.classList.contains(HIT_KIND_CLASS.double), false);
  assert.equal(rowNode.classList.contains(HIT_KIND_CLASS.bullOuter), false);
  assert.equal(rowNode.classList.contains(HIT_KIND_CLASS.bullInner), false);
});

test("collectThrowRows scopes to #ad-ext-turn and prefers direct throw rows", () => {
  const documentRef = new FakeDocument();
  const directRow = documentRef.throwRow;

  const nestedWrapper = documentRef.createElement("div");
  const nestedRow = documentRef.createElement("div");
  nestedRow.classList.add("ad-ext-turn-throw");
  nestedRow.textContent = "T20";
  nestedWrapper.appendChild(nestedRow);
  documentRef.turnContainer.appendChild(nestedWrapper);

  const externalRow = documentRef.createElement("div");
  externalRow.classList.add("ad-ext-turn-throw");
  externalRow.textContent = "D20";
  documentRef.main.appendChild(externalRow);

  const rows = collectThrowRows(documentRef);
  assert.deepEqual(rows, [directRow]);
});

test("updateHitDecorations replays a repeated hit when turn points token changes", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const rowNode = documentRef.throwRow;
  const textNode = documentRef.throwTextElement;

  textNode.textContent = "40 D20";
  rowNode.textContent = "40 D20";
  documentRef.turnPointsElement.textContent = "40";

  const first = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "champagne-night",
      animationStyle: "impact-pop",
    },
  });
  const firstSignature = rowNode.getAttribute("data-ad-ext-hit-signature");

  assert.equal(first.decoratedCount, 1);
  assert.equal(first.replayedCount, 1);
  assert.equal(typeof firstSignature, "string");
  assert.equal(firstSignature.includes("tp:40"), true);

  documentRef.turnPointsElement.textContent = "80";
  const second = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "champagne-night",
      animationStyle: "impact-pop",
    },
  });
  const secondSignature = rowNode.getAttribute("data-ad-ext-hit-signature");

  assert.equal(second.decoratedCount, 1);
  assert.equal(second.replayedCount, 1);
  assert.equal(secondSignature.includes("tp:80"), true);
  assert.notEqual(secondSignature, firstSignature);
});

test("updateHitDecorations prefers scoped turn points token over global fallback token", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();

  documentRef.throwTextElement.textContent = "36 D18";
  documentRef.throwRow.textContent = "36 D18";
  documentRef.turnPointsElement.textContent = "999";

  const scopedTurnPoints = documentRef.createElement("p");
  scopedTurnPoints.classList.add("ad-ext-turn-points");
  scopedTurnPoints.textContent = "36";
  documentRef.turnContainer.appendChild(scopedTurnPoints);

  updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "volt-lime",
      animationStyle: "neon-pulse",
    },
  });

  const signature = documentRef.throwRow.getAttribute("data-ad-ext-hit-signature");
  assert.equal(typeof signature, "string");
  assert.equal(signature.includes("tp:36"), true);
  assert.equal(signature.includes("tp:999"), false);
});

test("updateHitDecorations counts removals only when a row actually had hit decoration", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();

  documentRef.throwTextElement.textContent = "18 S18";
  documentRef.throwRow.textContent = "18 S18";

  const first = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
  });
  assert.equal(first.removedCount, 0);
  assert.equal(documentRef.throwRow.classList.contains(HIT_BASE_CLASS), false);

  documentRef.throwTextElement.textContent = "36 D18";
  documentRef.throwRow.textContent = "36 D18";
  updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
  });
  assert.equal(documentRef.throwRow.classList.contains(HIT_BASE_CLASS), true);

  documentRef.throwTextElement.textContent = "18 S18";
  documentRef.throwRow.textContent = "18 S18";
  const third = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
  });
  assert.equal(third.removedCount, 1);
  assert.equal(documentRef.throwRow.classList.contains(HIT_BASE_CLASS), false);
});
