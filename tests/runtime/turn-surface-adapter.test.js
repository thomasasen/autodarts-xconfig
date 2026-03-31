import test from "node:test";
import assert from "node:assert/strict";

import {
  collectTurnThrowRows,
  collectTurnThrowTextNodes,
  createTurnSurfaceObserveOptions,
  findTurnContainer,
  readTurnPointsToken,
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

test("readTurnPointsToken and collectTurnThrowTextNodes use scoped turn-surface fallbacks safely", () => {
  const documentRef = new FakeDocument();
  documentRef.turnPointsElement.textContent = "  140  ";

  const extraRow = appendThrowRow(documentRef, "S25");
  documentRef.turnContainer.appendChild(extraRow.row);

  const nodes = collectTurnThrowTextNodes(documentRef, [
    ".ad-ext-turn-throw p.chakra-text",
    ".ad-ext-turn-throw p",
    ".ad-ext-turn-throw",
  ]);

  assert.equal(readTurnPointsToken(documentRef), "140");
  assert.ok(nodes.includes(documentRef.throwTextElement));
  assert.ok(nodes.includes(extraRow.textNode));
  assert.equal(nodes.filter((node) => node === documentRef.throwTextElement).length, 1);
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
