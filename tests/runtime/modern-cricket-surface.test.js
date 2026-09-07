import test from "node:test";
import assert from "node:assert/strict";
import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { buildCricketRenderState } from "../../src/features/cricket-surface/pipeline.js";
import { readModernCricketGrid } from "../../src/features/cricket-surface/modern-grid.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import { initializeCricketTargetHighlighter } from "../../src/features/cricket-target-highlighter/index.js";
import { OVERLAY_ID } from "../../src/features/cricket-target-highlighter/style.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";

function fixture(playerCount = 3, tactics = false) {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const root = documentRef.createElement("div");
  root.className = "grid h-full";
  documentRef.main.appendChild(root);
  const add = (parent, className = "", text = "") => {
    const node = documentRef.createElement("div");
    node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  };
  add(root);
  const markers = Array.from({ length: playerCount }, (_, index) => {
    const header = add(root, `relative isolate overflow-hidden${index ? "" : " bg-raspberry-slush-diagonal"}`);
    add(header, "font-display", `Player ${index}`);
    add(header, `size-2 rounded-full bg-mono-white${index ? " invisible" : ""}`);
    return header;
  });
  const labels = tactics ? cricketRules.TACTICS_TARGET_ORDER : cricketRules.CRICKET_TARGET_ORDER;
  const cells = new Map();
  labels.forEach((label) => {
    add(root, "font-body", label === "BULL" ? "B" : label);
    cells.set(label, Array.from({ length: playerCount }, () => {
      const cell = add(root, "flex justify-center items-center border-b border-r");
      add(cell, "size-8");
      return cell;
    }));
  });
  const cache = {};
  const read = () => buildCricketRenderState({ documentRef, windowRef, cricketRules, variantRules, cache,
    gameState: { isCricketVariant: () => false, getActivePlayerIndex: () => 0 } });
  return { documentRef, windowRef, root, cells, markers, read, cache };
}

test("modern Cricket discovers all native rows including B without legacy variant or player anchors", () => {
  for (const playerCount of [2, 3, 4]) {
    const host = fixture(playerCount);
    const state = host.read();
    assert.equal(state.surfaceStatus, "missing-board");
    assert.deepEqual(state.targetOrder, cricketRules.CRICKET_TARGET_ORDER);
    assert.deepEqual(state.marksByLabel.BULL, Array(playerCount).fill(0));
    assert.equal(state.gridSnapshot.rows.length, 7);
    assert.equal(state.gridSnapshot.rowMap.get("20").playerCells.length, playerCount);
  }
});

test("modern Cricket runtime renders an overlay and observes native image and active-card changes", () => {
  const host = fixture();
  const { documentRef, windowRef } = host;
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const ring = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("r", "500");
  group.appendChild(ring);
  for (let value = 1; value <= 20; value += 1) {
    const label = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    label.textContent = String(value);
    group.appendChild(label);
  }
  documentRef.main.appendChild(svg);
  const observers = createObserverRegistry();
  const cleanup = initializeCricketTargetHighlighter({
    documentRef, windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers, listeners: createListenerRegistry() },
    domain: { cricketRules, variantRules },
    gameState: { isCricketVariant: () => false, subscribe: () => () => {} },
    helpers: { createRafScheduler: (callback) => ({ schedule: callback, cancel() {}, isScheduled: () => false }) },
  });
  try {
    const overlay = documentRef.getElementById(OVERLAY_ID);
    assert.ok(overlay?.children.length);
    const observer = observers.get("cricket-target-highlighter:dom-observer");
    assert.ok(observer.observeCalls[0].options.attributeFilter.includes("src"));
    const icon = documentRef.createElement("img");
    host.cells.get("20")[0].appendChild(icon);
    icon.setAttribute("src", `data:image/svg+xml,${encodeURIComponent("<svg viewBox='0 0 140 140'><circle/><line/><line/></svg>")}`);
    observer.callback([{ type: "attributes", attributeName: "src", target: icon }]);
    const scoring = overlay.querySelectorAll(".is-scoring").length;
    assert.ok(scoring > 0);
    host.markers[0].classList.remove("bg-raspberry-slush-diagonal");
    host.markers[1].classList.add("bg-raspberry-slush-diagonal");
    observer.callback([{ type: "attributes", attributeName: "class", target: host.markers[1] }]);
    assert.equal(documentRef.getElementById(OVERLAY_ID).querySelectorAll(".is-scoring").length, 0);
    assert.ok(documentRef.getElementById(OVERLAY_ID).querySelectorAll(".is-pressure").length > 0);
  } finally {
    cleanup();
  }
  assert.equal(documentRef.getElementById(OVERLAY_ID), null);
});

test("modern Cricket follows the visible active player and recomputes scoring, pressure and dead targets", () => {
  const host = fixture();
  host.cells.get("20")[0].dataset.marks = "3";
  host.cells.get("19").forEach((cell) => { cell.dataset.marks = "3"; });
  host.cells.get("BULL")[2].dataset.marks = "3";
  let state = host.read();
  assert.equal(state.stateMap.get("20").boardPresentation, "scoring");
  assert.equal(state.stateMap.get("19").boardPresentation, "dead");
  assert.equal(state.stateMap.get("BULL").boardPresentation, "pressure");
  host.markers[0].classList.remove("bg-raspberry-slush-diagonal");
  host.markers[2].classList.add("bg-raspberry-slush-diagonal");
  state = host.read();
  assert.equal(state.activePlayerIndex, 2);
  assert.equal(state.stateMap.get("20").boardPresentation, "pressure");
  assert.equal(state.stateMap.get("BULL").boardPresentation, "scoring");
});

test("native SVG image marks are read without alt text and update when the image source changes", () => {
  const host = fixture();
  const source = (marks) => `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 140'>${marks === 3 ? "<circle cx='70' cy='70' r='62'/>" : ""}` +
    "<line x1='109.156' y2='109.156'/>" + (marks >= 2 ? "<line x2='109.156' y2='109.156'/>" : "") + "</svg>"
  )}`;
  const icons = [1, 2, 3].map((marks, index) => {
    const icon = host.documentRef.createElement("img");
    icon.setAttribute("src", source(marks));
    host.cells.get("20")[index].appendChild(icon);
    return icon;
  });
  assert.deepEqual(host.read().marksByLabel["20"], [1, 2, 3]);
  icons[0].setAttribute("src", source(3));
  assert.deepEqual(host.read().marksByLabel["20"], [3, 2, 3]);
  icons[0].setAttribute("src", "data:image/svg+xml,%invalid");
  assert.deepEqual(host.read().marksByLabel["20"], [0, 2, 3]);
});

test("modern Cricket replaces cached cells even when the grid root and semantic state stay unchanged", () => {
  const host = fixture();
  const before = host.read();
  const old = host.cells.get("20")[1];
  const replacement = host.documentRef.createElement("div");
  host.root.insertBefore(replacement, old);
  old.remove();
  const after = host.read();
  assert.equal(after.pipelineSignature, before.pipelineSignature);
  assert.equal(after.gridSnapshot.rowMap.get("20").playerCells[1], replacement);
  replacement.dataset.marks = "3";
  assert.equal(host.read().stateMap.get("20").boardPresentation, "pressure");
});

test("modern Cricket rejects incomplete and unrelated grids and supports the Tactics target order", () => {
  const host = fixture();
  host.cells.get("20")[1].remove();
  assert.equal(readModernCricketGrid(host.documentRef), null);
  const tactics = fixture(4, true).read();
  assert.equal(tactics.gameModeNormalized, "tactics");
  assert.deepEqual(tactics.targetOrder, cricketRules.TACTICS_TARGET_ORDER);
});
