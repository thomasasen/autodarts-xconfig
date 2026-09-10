import test from "node:test";
import assert from "node:assert/strict";

import {
  getAverageNodes,
  updateAvgTrendArrows,
} from "../../src/features/avg-trend-arrow/logic.js";
import {
  ARROW_CLASS,
  DOWN_CLASS,
  UP_CLASS,
} from "../../src/features/avg-trend-arrow/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function appendModernPlayerCard(documentRef, averageText = "50.0") {
  const cardNode = documentRef.createElement("div");
  cardNode.classList.add("overflow-clip");

  const playerButton = documentRef.createElement("button");
  playerButton.setAttribute("role", "button");
  playerButton.textContent = "Player One";
  cardNode.appendChild(playerButton);

  const averageRow = documentRef.createElement("div");
  averageRow.classList.add("flex", "gap-1");
  const labelNode = documentRef.createElement("span");
  labelNode.textContent = "Leg";
  const valueNode = documentRef.createElement("span");
  valueNode.textContent = averageText;
  averageRow.appendChild(labelNode);
  averageRow.appendChild(valueNode);
  cardNode.appendChild(averageRow);
  documentRef.main.appendChild(cardNode);

  return { cardNode, averageRow, valueNode };
}

function createTrendState() {
  return {
    lastValueByNode: new WeakMap(),
    arrowByAverageNode: new WeakMap(),
    timeoutByArrow: new Map(),
    arrowNodes: new Set(),
  };
}

function update(documentRef, windowRef, state) {
  updateAvgTrendArrows({
    documentRef,
    windowRef,
    ...state,
    durationMs: 220,
  });
}

function clearTrendTimeouts(state) {
  state.timeoutByArrow.forEach((timeout) => clearTimeout(timeout));
  state.timeoutByArrow.clear();
}

test("avg-trend-arrow anchors to the modern Leg average and survives value replacement", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const fixture = appendModernPlayerCard(documentRef);
  const state = createTrendState();

  assert.deepEqual(getAverageNodes(documentRef, windowRef), [fixture.valueNode]);
  update(documentRef, windowRef, state);
  assert.equal(state.arrowNodes.size, 0);

  fixture.valueNode.textContent = "55.0";
  update(documentRef, windowRef, state);

  const upArrow = fixture.valueNode.querySelector(`.${ARROW_CLASS}`);
  assert.ok(upArrow);
  assert.equal(upArrow.parentElement, fixture.valueNode);
  assert.equal(upArrow.classList.contains(UP_CLASS), true);

  fixture.valueNode.remove();
  const replacementValue = documentRef.createElement("span");
  replacementValue.textContent = "49.0";
  fixture.averageRow.appendChild(replacementValue);
  update(documentRef, windowRef, state);

  const downArrow = replacementValue.querySelector(`.${ARROW_CLASS}`);
  assert.ok(downArrow);
  assert.equal(downArrow.classList.contains(DOWN_CLASS), true);
  assert.equal(state.arrowNodes.has(upArrow), false);
  assert.equal(state.arrowNodes.has(downArrow), true);

  clearTrendTimeouts(state);
});

test("avg-trend-arrow keeps the legacy average selector as fallback", () => {
  const documentRef = new FakeDocument();
  const legacyAverage = documentRef.createElement("p");
  legacyAverage.classList.add("css-1j0bqop");
  legacyAverage.textContent = "52.5 / 51.0";
  documentRef.main.appendChild(legacyAverage);

  assert.deepEqual(getAverageNodes(documentRef), [legacyAverage]);
});
