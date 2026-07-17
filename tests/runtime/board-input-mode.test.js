import test from "node:test";
import assert from "node:assert/strict";

import {
  BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
  collectBoardInputModeControls,
  getActiveBoardInputMode,
  getBoardInputModeKey,
  isBoardInputModeControlAvailable,
} from "../../src/shared/board-input-mode.js";
import { FakeDocument } from "./fake-dom.js";

function createControl(documentRef, options = {}) {
  const node = documentRef.createElement(options.tagName || "button");
  if (options.role) {
    node.setAttribute("role", options.role);
  }
  if (options.type) {
    node.setAttribute("type", options.type);
    node.type = options.type;
  }
  if (options.label) {
    node.setAttribute("aria-label", options.label);
  }
  if (options.text) {
    node.textContent = options.text;
  }
  if (options.activeAttribute) {
    node.setAttribute(options.activeAttribute, options.activeValue ?? "true");
  }
  documentRef.main.appendChild(node);
  return node;
}

test("board input mode semantics cover host buttons, tabs, radios, switches and checkboxes", () => {
  const documentRef = new FakeDocument();
  const cases = [
    { tagName: "button", label: "Live Mode", expected: "live" },
    { tagName: "div", role: "tab", label: "Live-Modus", expected: "live" },
    { tagName: "div", role: "radio", label: "Live Board", expected: "live" },
    { tagName: "input", type: "radio", label: "Live Mode", expected: "live" },
    { tagName: "div", role: "switch", label: "Virtual Board", expected: "virtual" },
    { tagName: "input", type: "checkbox", label: "Segmentmodus", expected: "segments" },
  ];

  cases.forEach((fixture) => {
    const node = createControl(documentRef, fixture);
    assert.equal(getBoardInputModeKey(node), fixture.expected);
    assert.equal(isBoardInputModeControlAvailable(node), true);
  });
  assert.equal(collectBoardInputModeControls(documentRef).length, cases.length);
});

test("board input mode labels resolve aria-labelledby and active host state", () => {
  const documentRef = new FakeDocument();
  const labelNode = documentRef.createElement("span");
  labelNode.id = "live-mode-label";
  labelNode.textContent = "Live-Modus";
  documentRef.main.appendChild(labelNode);

  const tabNode = createControl(documentRef, {
    tagName: "div",
    role: "tab",
    activeAttribute: "aria-selected",
  });
  tabNode.setAttribute("aria-labelledby", labelNode.id);

  assert.equal(getBoardInputModeKey(tabNode), "live");
  assert.equal(getActiveBoardInputMode(documentRef), "live");
});

test("hidden and disabled board modes stay semantic but are not available host actions", () => {
  const documentRef = new FakeDocument();
  const hiddenNode = createControl(documentRef, { role: "radio", label: "Live Mode" });
  hiddenNode.hidden = true;
  hiddenNode.setAttribute("hidden", "");
  const disabledNode = createControl(documentRef, { role: "switch", label: "Live Board" });
  disabledNode.disabled = true;
  disabledNode.setAttribute("aria-disabled", "true");
  const unrelatedNode = createControl(documentRef, { role: "button", label: "Open settings" });
  const dataDisabledNode = createControl(documentRef, { role: "button", label: "Live mode" });
  dataDisabledNode.setAttribute("data-disabled", "true");
  const unavailableStateNode = createControl(documentRef, { role: "button", label: "Coords mode" });
  unavailableStateNode.setAttribute("data-state", "unavailable");

  assert.equal(getBoardInputModeKey(hiddenNode), "live");
  assert.equal(getBoardInputModeKey(disabledNode), "live");
  assert.equal(isBoardInputModeControlAvailable(hiddenNode), false);
  assert.equal(isBoardInputModeControlAvailable(disabledNode), false);
  assert.equal(isBoardInputModeControlAvailable(dataDisabledNode), false);
  assert.equal(isBoardInputModeControlAvailable(unavailableStateNode), false);
  assert.equal(getBoardInputModeKey(unrelatedNode), "");
  assert.deepEqual(collectBoardInputModeControls(documentRef, { availableOnly: true }), []);
});

test("board input observer attributes include host availability, state and labels", () => {
  [
    "checked",
    "selected",
    "hidden",
    "disabled",
    "aria-checked",
    "aria-selected",
    "aria-pressed",
    "aria-hidden",
    "aria-disabled",
    "aria-labelledby",
    "data-active",
    "data-disabled",
    "data-hidden",
    "data-state",
    "data-status",
  ].forEach((attributeName) => {
    assert.equal(BOARD_INPUT_MODE_ATTRIBUTE_FILTER.includes(attributeName), true);
  });
});
