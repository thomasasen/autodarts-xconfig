import test from "node:test";
import assert from "node:assert/strict";

import { buildGridRowSnapshot } from "../../src/features/cricket-surface/row-repair.js";
import { FakeDocument } from "./fake-dom.js";

function createCricketRules() {
  return {
    normalizeCricketLabel(value) {
      return String(value || "").trim().toUpperCase();
    },
    parseCricketMarkValue(value) {
      const rawValue = String(value || "").trim().toUpperCase();
      if (/^(?:X|XX|XXX)$/.test(rawValue)) {
        return rawValue.length;
      }
      const numeric = Number.parseInt(rawValue, 10);
      return Number.isFinite(numeric) ? numeric : null;
    },
    clampMarks(value) {
      return Math.max(0, Math.min(3, Number(value) || 0));
    },
    createEmptyMarksByLabel(targetOrder, fillValue = 0) {
      return Object.fromEntries(
        (Array.isArray(targetOrder) ? targetOrder : []).map((label) => [label, [fillValue]])
      );
    },
  };
}

function createRowMeta(documentRef, label, { labelMarks = "", playerCells = [], badgeText = "" } = {}) {
  const rowNode = documentRef.createElement("div");
  const labelCell = documentRef.createElement("div");
  const labelNode = documentRef.createElement("span");
  labelNode.setAttribute("data-row-label", label);
  labelNode.textContent = label;
  labelCell.appendChild(labelNode);
  if (labelMarks) {
    labelCell.setAttribute("data-marks", labelMarks);
  }
  rowNode.appendChild(labelCell);

  const normalizedPlayerCells = playerCells.map((cell) => {
    rowNode.appendChild(cell);
    return cell;
  });

  const badgeNode = documentRef.createElement("span");
  badgeNode.textContent = badgeText || label;
  labelCell.appendChild(badgeNode);
  documentRef.body.appendChild(rowNode);

  return {
    badgeNode,
    label,
    labelCell,
    labelNode,
    playerCells: normalizedPlayerCells,
    playerCellsByIndex: [],
    rowNode,
  };
}

test("cricket row repair includes label cells as mark sources for shortfall repair", () => {
  const documentRef = new FakeDocument();
  const cricketRules = createCricketRules();
  const playerCell = documentRef.createElement("div");
  playerCell.setAttribute("data-marks", "1");

  const rowMeta = createRowMeta(documentRef, "20", {
    labelMarks: "2",
    playerCells: [playerCell],
  });

  const snapshot = buildGridRowSnapshot({
    cricketRules,
    targetOrder: ["20"],
    targetSet: new Set(["20"]),
    gridLabels: [{ label: "20", node: rowMeta.labelNode }],
    expectedPlayerCount: 2,
    collectPlayerCellsForLabel() {
      return [playerCell];
    },
    resolveLabelCell() {
      return rowMeta.labelCell;
    },
    resolveBadgeNode() {
      return rowMeta.badgeNode;
    },
    getRowNode() {
      return rowMeta.rowNode;
    },
  });

  assert.deepEqual(snapshot.marksByLabel["20"], [2, 1]);
  assert.deepEqual(snapshot.labelCellMarkSourceLabels, ["20"]);
  assert.deepEqual(snapshot.shortfallRepairLabels, ["20"]);
});

test("cricket row repair honors explicit player indexes and stable-row recovery", () => {
  const documentRef = new FakeDocument();
  const cricketRules = createCricketRules();
  const secondPlayerCell = documentRef.createElement("div");
  secondPlayerCell.setAttribute("data-marks", "2");
  secondPlayerCell.setAttribute("data-player-index", "1");
  const firstPlayerCell = documentRef.createElement("div");
  firstPlayerCell.setAttribute("data-marks", "1");
  firstPlayerCell.setAttribute("data-player-index", "0");

  const rowMeta = createRowMeta(documentRef, "19", {
    playerCells: [secondPlayerCell, firstPlayerCell],
  });
  const recoveredMeta = createRowMeta(documentRef, "18", {
    playerCells: [documentRef.createElement("div")],
  });
  recoveredMeta.playerCells[0].setAttribute("data-marks", "3");

  const snapshot = buildGridRowSnapshot({
    cachedStableRows: new Map([["18", recoveredMeta]]),
    cricketRules,
    targetOrder: ["19", "18"],
    targetSet: new Set(["19", "18"]),
    gridLabels: [{ label: "19", node: rowMeta.labelNode }],
    expectedPlayerCount: 2,
    collectPlayerCellsForLabel(labelNode, label) {
      if (label === "19") {
        return [secondPlayerCell, firstPlayerCell];
      }
      return [];
    },
    resolveLabelCell(labelNode, label) {
      return label === "19" ? rowMeta.labelCell : recoveredMeta.labelCell;
    },
    resolveBadgeNode(labelNode, labelCell, label) {
      return label === "19" ? rowMeta.badgeNode : recoveredMeta.badgeNode;
    },
    getRowNode(labelNode) {
      return labelNode === rowMeta.labelNode ? rowMeta.rowNode : recoveredMeta.rowNode;
    },
  });

  assert.equal(snapshot.hasIndexedPlayerColumns, true);
  assert.deepEqual(snapshot.marksByLabel["19"], [1, 2]);
  assert.equal(snapshot.rowMetaByLabel.get("19")?.playerCellsByIndex[0], firstPlayerCell);
  assert.equal(snapshot.rowMetaByLabel.get("19")?.playerCellsByIndex[1], secondPlayerCell);
  assert.deepEqual(snapshot.recoveredStableLabels, ["18"]);
  assert.deepEqual(snapshot.marksByLabel["18"], [0, 3]);
});
