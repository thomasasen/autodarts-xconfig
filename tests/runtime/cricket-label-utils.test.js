import test from "node:test";
import assert from "node:assert/strict";

import {
  getClassTokens,
  normalizeCricketLabelNode,
  normalizeCricketLabelValue,
} from "../../src/features/cricket-surface/label-utils.js";
import {
  resolveBadgeNode,
  resolveLabelCell,
} from "../../src/features/cricket-surface/label-layout.js";
import { collectLabelNodes as collectLabelNodesFromDiscovery } from "../../src/features/cricket-surface/grid-discovery.js";
import { FakeDocument } from "./fake-dom.js";

test("cricket label utils normalize node text and label attributes consistently", () => {
  const cricketRules = {
    normalizeCricketLabel(value) {
      return String(value || "").trim().toUpperCase();
    },
  };

  const node = {
    textContent: " target 18 ",
    getAttribute(name) {
      if (name === "data-row-label") {
        return "Bull";
      }
      return null;
    },
  };

  assert.equal(normalizeCricketLabelValue(cricketRules, "  20 "), "20");
  assert.equal(normalizeCricketLabelNode(cricketRules, node), "BULL");
});

test("cricket label utils read class tokens from array-like and string-backed nodes", () => {
  assert.deepEqual(
    getClassTokens({
      classList: {
        toArray() {
          return [" alpha ", "", "beta"];
        },
      },
    }),
    ["alpha", "beta"]
  );

  assert.deepEqual(
    getClassTokens({
      className: " gamma   delta ",
      getAttribute(name) {
        return name === "class" ? "gamma delta" : null;
      },
    }),
    ["gamma", "delta"]
  );
});

test("cricket label layout resolves merged label cells through the shared helper", () => {
  const documentRef = new FakeDocument();
  const cricketRules = {
    normalizeCricketLabel(value) {
      return String(value || "").trim().toUpperCase();
    },
  };

  const rowNode = documentRef.createElement("div");
  const labelCell = documentRef.createElement("div");
  const playerCell = documentRef.createElement("div");
  labelCell.setAttribute("class", "grid-cell");
  playerCell.setAttribute("class", "grid-cell");
  rowNode.appendChild(labelCell);
  rowNode.appendChild(playerCell);

  const labelNode = documentRef.createElement("span");
  labelNode.setAttribute("data-row-label", "20");
  labelNode.textContent = "20";
  labelCell.appendChild(labelNode);
  documentRef.body.appendChild(rowNode);

  assert.equal(
    resolveLabelCell({
      labelNode,
      cricketRules,
      targetSet: new Set(["20"]),
    }),
    labelCell
  );
});

test("cricket label layout resolves decoratable badge nodes through the shared helper", () => {
  const documentRef = new FakeDocument();
  const cricketRules = {
    normalizeCricketLabel(value) {
      return String(value || "").trim().toUpperCase();
    },
  };

  const labelCell = documentRef.createElement("div");
  labelCell.getBoundingClientRect = () => ({
    width: 120,
    height: 48,
  });

  const labelNode = documentRef.createElement("span");
  labelNode.textContent = "20";
  labelCell.appendChild(labelNode);

  const badgeNode = documentRef.createElement("span");
  badgeNode.setAttribute("class", "ad-ext-crfx-badge");
  badgeNode.textContent = "20";
  badgeNode.getBoundingClientRect = () => ({
    width: 40,
    height: 18,
  });
  labelCell.appendChild(badgeNode);
  documentRef.body.appendChild(labelCell);

  assert.equal(
    resolveBadgeNode({
      labelNode,
      labelCell,
      cricketRules,
      label: "20",
    }),
    badgeNode
  );
});

test("cricket grid discovery drops nested wrapper labels and skips turn preview rows", () => {
  const documentRef = new FakeDocument();
  const cricketRules = {
    normalizeCricketLabel(value) {
      return String(value || "").trim().toUpperCase();
    },
  };

  const gridRoot = documentRef.createElement("div");

  const nestedWrapper = documentRef.createElement("div");
  const outerLabel = documentRef.createElement("div");
  outerLabel.setAttribute("data-row-label", "20");
  outerLabel.textContent = "20";
  const innerLabel = documentRef.createElement("span");
  innerLabel.setAttribute("data-row-label", "20");
  innerLabel.textContent = "20";
  outerLabel.appendChild(innerLabel);
  nestedWrapper.appendChild(outerLabel);
  gridRoot.appendChild(nestedWrapper);

  const previewRoot = documentRef.createElement("div");
  previewRoot.id = "ad-ext-turn";
  const previewLabel = documentRef.createElement("div");
  previewLabel.setAttribute("data-row-label", "19");
  previewLabel.textContent = "19";
  previewRoot.appendChild(previewLabel);
  gridRoot.appendChild(previewRoot);

  const visibleRow = documentRef.createElement("div");
  const visibleLabel = documentRef.createElement("div");
  visibleLabel.setAttribute("data-row-label", "18");
  visibleLabel.textContent = "18";
  visibleRow.appendChild(visibleLabel);
  gridRoot.appendChild(visibleRow);
  documentRef.body.appendChild(gridRoot);

  const labels = collectLabelNodesFromDiscovery(
    gridRoot,
    cricketRules,
    new Set(["20", "19", "18"]),
    ["[data-row-label]"],
    null,
    {
      skipNode(node) {
        return Boolean(node.closest?.("#ad-ext-turn"));
      },
    }
  );

  assert.deepEqual(
    labels.map((entry) => entry.label).sort(),
    ["18", "20"]
  );
  assert.equal(labels.find((entry) => entry.label === "20")?.node, innerLabel);
});
