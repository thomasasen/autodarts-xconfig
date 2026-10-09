import test from "node:test";
import assert from "node:assert/strict";
import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { buildCricketRenderState } from "../../src/features/cricket-surface/pipeline.js";
import {
  CRICKET_SURFACE_OVERLAY_ATTRIBUTE,
  readModernCricketGrid,
} from "../../src/features/cricket-surface/modern-grid.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import { initializeCricketTargetHighlighter } from "../../src/features/cricket-target-highlighter/index.js";
import { OVERLAY_ID, PRESENTATION_PATTERN_IDS, resolveCricketVisualConfig } from "../../src/features/cricket-target-highlighter/style.js";
import { renderCricketHighlights } from "../../src/features/cricket-target-highlighter/logic.js";
import {
  clearCricketGridStatusEffectsState,
  createCricketGridStatusEffectsState,
  updateCricketGridStatusEffects,
} from "../../src/features/cricket-grid-status-effects/logic.js";
import { initializeCricketGridStatusEffects } from "../../src/features/cricket-grid-status-effects/index.js";
import {
  BADGE_CLASS,
  CELL_CLASS,
  LABEL_CLASS,
  LABEL_STATE_CLASS,
  MODERN_ROOT_CLASS,
  NATIVE_LABEL_CLASS,
  ROOT_CLASS,
  STYLE_ID,
  SYNTHETIC_BADGE_ATTRIBUTE,
  WIPE_CLASS,
  HIDDEN_LABEL_ATTRIBUTE,
  buildStyleText,
  resolveCricketGridStatusEffectsConfig,
} from "../../src/features/cricket-grid-status-effects/style.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { buildFeatureSettingPatch } from "../../src/features/xconfig-ui/path-utils.js";
import { getFeatureConfigSpec } from "../../src/config/feature-config-spec.js";

test("board patterns distinguish scoring from pressure and color-only mode removes pattern fills", () => {
  const host = fixture(3);
  appendBoardFixture(host.documentRef);
  host.cells.get("20")[0].dataset.marks = "3";
  host.cells.get("19")[1].dataset.marks = "3";
  const renderState = host.read();
  const visualConfig = resolveCricketVisualConfig({ colorTheme: "blue-orange", statusStyle: "pattern" });
  assert.deepEqual(visualConfig.theme.scoring, { r: 56, g: 189, b: 248 });
  assert.deepEqual(visualConfig.theme.pressure, { r: 251, g: 146, b: 60 });
  assert.equal(renderCricketHighlights({ documentRef: host.documentRef, visualConfig, renderState }), true);
  assert.equal(host.documentRef.getElementById(PRESENTATION_PATTERN_IDS.scoring).getAttribute("patternTransform"), "rotate(135)");
  assert.equal(host.documentRef.getElementById(PRESENTATION_PATTERN_IDS.pressure).getAttribute("patternTransform"), "rotate(45)");
  renderCricketHighlights({ documentRef: host.documentRef, visualConfig: resolveCricketVisualConfig({ statusStyle: "color" }), renderState });
  assert.ok(host.documentRef.getElementById(OVERLAY_ID).querySelectorAll(".is-scoring").every((shape) => !String(shape.style.fill || "").startsWith("url(")));
});

test("calm table settings preserve scoring semantics and marks while disabling unwanted effects", () => {
  for (const tactics of [false, true]) {
    const host = fixture(4, tactics);
    host.cells.get("20")[0].dataset.marks = "3";
    host.cells.get("19")[1].dataset.marks = "3";
    host.cells.get("18").forEach((cell) => { cell.dataset.marks = "3"; });
    const patch = buildFeatureSettingPatch("cricketGridStatusEffects", "displayProfile", "calm");
    const spec = getFeatureConfigSpec("cricketGridStatusEffects");
    const normalized = spec.normalizeConfig({ ...patch.features.cricketGridStatusEffects, colorTheme: "blue-orange" });
    assert.equal(normalized.displayProfile, "calm");
    assert.equal(normalized.rowWave, false);
    assert.equal(normalized.roundTransitionWipe, false);
    assert.equal(normalized.feedback, "impulse");
    const visualConfig = resolveCricketGridStatusEffectsConfig(normalized);
    assert.equal(visualConfig.theme.scoring, "56, 189, 248");
    const state = createCricketGridStatusEffectsState(host.windowRef);
    const renderState = host.read();
    updateCricketGridStatusEffects({ documentRef: host.documentRef, windowRef: host.windowRef, state, visualConfig, renderState, cricketRules });
    assert.equal(host.root.getAttribute("data-ad-crfx-scoring-style"), "edge");
    assert.equal(host.root.getAttribute("data-ad-crfx-pressure-style"), "edge");
    assert.equal(renderState.stateMap.get("20").boardPresentation, "scoring");
    assert.equal(renderState.stateMap.get("19").boardPresentation, "pressure");
    assert.equal(renderState.stateMap.get("18").boardPresentation, "dead");
    assert.equal(host.cells.get("20")[0].dataset.marks, "3");
    clearCricketGridStatusEffectsState(state);
    assert.equal(host.root.getAttribute("data-ad-crfx-scoring-style"), null);
  }
});

test("old table configurations retain their switches and choosing feedback off changes only feedback", () => {
  const spec = getFeatureConfigSpec("cricketGridStatusEffects");
  const old = spec.normalizeConfig({ rowWave: false, hitSpark: false, deltaChips: true, colorTheme: "high-contrast" });
  assert.equal(old.rowWave, false);
  assert.equal(old.hitSpark, false);
  assert.equal(old.deltaChips, true);
  assert.equal(old.statusStyle, "legacy");
  assert.equal(old.feedback, "custom");
  const next = spec.normalizeConfig({ ...old, ...buildFeatureSettingPatch("cricketGridStatusEffects", "feedback", "off").features.cricketGridStatusEffects });
  assert.equal(next.hitSpark, false);
  assert.equal(next.deltaChips, false);
  assert.equal(next.rowWave, old.rowWave);
  assert.equal(next.colorTheme, old.colorTheme);
  assert.equal(resolveCricketGridStatusEffectsConfig({ scoringStyle: "off", pressureStyle: "off" }).scoringStripe, false);
  assert.equal(resolveCricketGridStatusEffectsConfig({ scoringStyle: "off", pressureStyle: "off" }).pressureEdge, false);
});

test("advanced table switches can re-enable effects after the main presentation was turned off", () => {
  const spec = getFeatureConfigSpec("cricketGridStatusEffects");
  const off = spec.normalizeConfig({
    ...buildFeatureSettingPatch("cricketGridStatusEffects", "scoringStyle", "off").features.cricketGridStatusEffects,
    ...buildFeatureSettingPatch("cricketGridStatusEffects", "pressureStyle", "off").features.cricketGridStatusEffects,
    rowWave: false,
  });
  for (const key of ["scoringStripe", "pressureEdge", "pressureOverlay"]) {
    const next = spec.normalizeConfig({ ...off, ...buildFeatureSettingPatch("cricketGridStatusEffects", key, true).features.cricketGridStatusEffects });
    assert.equal(resolveCricketGridStatusEffectsConfig(next)[key], true, key);
    assert.equal(next.rowWave, false);
    assert.equal(next[key === "scoringStripe" ? "scoringStyle" : "pressureStyle"], "legacy");
  }
});

test("new settings override old Cricket aliases without resetting unrelated saved values", () => {
  const boardSpec = getFeatureConfigSpec("cricketTargetHighlighter");
  const learning = buildFeatureSettingPatch("cricketTargetHighlighter", "displayProfile", "learning");
  const board = boardSpec.normalizeConfig({ showOpenTargets: false, dimIrrelevantBoardTargets: false, colorTheme: "blue-orange", ...learning.features.cricketTargetHighlighter });
  assert.equal(board.showOpenObjectives, true);
  assert.equal(board.irrelevantBoardDimStyle, "smoke");
  assert.equal(board.displayProfile, "learning");
  assert.equal(board.colorTheme, "blue-orange");
  const gridSpec = getFeatureConfigSpec("cricketGridStatusEffects");
  const edge = buildFeatureSettingPatch("cricketGridStatusEffects", "pressureStyle", "edge");
  const grid = gridSpec.normalizeConfig({ threatEdge: false, opponentPressureOverlay: true, rowWave: false, ...edge.features.cricketGridStatusEffects });
  assert.equal(grid.pressureEdge, true);
  assert.equal(grid.pressureOverlay, false);
  assert.equal(grid.rowWave, false);
});

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
  const labelNodes = new Map();
  labels.forEach((label) => {
    labelNodes.set(label, add(root, "font-body", label === "BULL" ? "B" : label));
    cells.set(label, Array.from({ length: playerCount }, () => {
      const cell = add(root, "flex justify-center items-center border-b border-r");
      add(cell, "size-8");
      return cell;
    }));
  });
  const cache = {};
  const read = () => buildCricketRenderState({ documentRef, windowRef, cricketRules, variantRules, cache,
    gameState: { isCricketVariant: () => false, getActivePlayerIndex: () => 0 } });
  return { documentRef, windowRef, root, cells, labelNodes, markers, read, cache };
}

test("modern grid repairs persistent cell classes without replaying effects for two to four players", () => {
  for (const tactics of [false, true]) {
    for (const playerCount of [2, 3, 4]) {
      const host = fixture(playerCount, tactics);
      host.cells.get("20")[0].dataset.marks = "3";
      host.cells.get("19")[playerCount - 1].dataset.marks = "3";
      host.cells.get("BULL")[0].dataset.marks = "3";
      const renderState = host.read();
      const state = createCricketGridStatusEffectsState(host.windowRef);
      const visualConfig = resolveCricketGridStatusEffectsConfig({ rowWave: true,
        badgeBeacon: true, deltaChips: true, hitSpark: true });
      const debugStats = {};
      const update = () => updateCricketGridStatusEffects({ documentRef: host.documentRef,
        cricketRules, renderState, state, visualConfig, turnToken: "same-visit", debugStats });
      try {
        update();
        const cell = host.cells.get("20")[0];
        const transients = [...state.transientNodes];
        const timers = [...state.timeoutHandles];
        cell.classList.remove(CELL_CLASS);
        update();
        assert.equal(cell.classList.contains(CELL_CLASS), true);
        assert.equal(cell.dataset.marks, "3");
        assert.equal(debugStats.status, "ok");
        assert.equal(debugStats.rowWaveDeltaCount, 0);
        assert.equal(debugStats.rowWaveTacticalCount, 0);
        assert.deepEqual([...state.transientNodes], transients);
        assert.deepEqual([...state.timeoutHandles], timers);
        assert.equal(host.root.querySelectorAll(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`).length, 0);
        assert.equal(host.labelNodes.get("BULL").textContent, "B");
      } finally {
        clearCricketGridStatusEffectsState(state);
      }
    }
  }
});

function appendBoardFixture(documentRef) {
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
  return svg;
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
  appendBoardFixture(documentRef);
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

test("modern Cricket grid effects preserve native target labels without replacement badges", () => {
  const host = fixture();
  host.cells.get("20")[0].dataset.marks = "3";
  const renderState = host.read();
  const visualConfig = resolveCricketGridStatusEffectsConfig({
    rowWave: false,
    markProgress: false,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
  });
  const state = createCricketGridStatusEffectsState(host.windowRef);

  assert.equal(renderState.gridSnapshot.modern, true);
  updateCricketGridStatusEffects({
    documentRef: host.documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "modern:0",
  });

  assert.equal(host.root.classList.contains(ROOT_CLASS), true);
  assert.equal(host.root.classList.contains(MODERN_ROOT_CLASS), true);
  assert.equal(host.root.querySelectorAll(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`).length, 0);
  assert.equal(host.root.querySelectorAll(`[${HIDDEN_LABEL_ATTRIBUTE}="true"]`).length, 0);
  cricketRules.CRICKET_TARGET_ORDER.forEach((label) => {
    const labelNode = host.labelNodes.get(label);
    assert.equal(labelNode.textContent, label === "BULL" ? "B" : label);
    assert.equal(labelNode.classList.contains(LABEL_CLASS), true);
    assert.equal(labelNode.classList.contains(NATIVE_LABEL_CLASS), true);
    assert.equal(labelNode.classList.contains(BADGE_CLASS), false);
    assert.equal(labelNode.classList.contains(CELL_CLASS), false);
  });
  assert.equal(host.labelNodes.get("20").classList.contains(LABEL_STATE_CLASS.scoring), true);

  const styleText = buildStyleText();
  const nativeLabelRule = styleText.match(
    new RegExp(`\\.${ROOT_CLASS}\\.${MODERN_ROOT_CLASS} \\.${LABEL_CLASS}\\.${NATIVE_LABEL_CLASS} \\{([^}]*)\\}`)
  )?.[1] || "";
  assert.doesNotMatch(nativeLabelRule, /background|color|filter|opacity|transform/);
  assert.match(
    styleText,
    new RegExp(`\\.${ROOT_CLASS}\\.${MODERN_ROOT_CLASS} \\.${CELL_CLASS}::before`)
  );

  clearCricketGridStatusEffectsState(state);
  assert.equal(host.labelNodes.get("20").classList.contains(NATIVE_LABEL_CLASS), false);
});

test("modern Cricket keeps transient root overlays out of native grid discovery", () => {
  const host = fixture();
  const renderState = host.read();
  const visualConfig = resolveCricketGridStatusEffectsConfig({
    rowWave: false,
    markProgress: false,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: true,
  });
  const state = createCricketGridStatusEffectsState(host.windowRef);

  updateCricketGridStatusEffects({
    documentRef: host.documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
    roundTransitionToken: "fallback:0",
  });
  updateCricketGridStatusEffects({
    documentRef: host.documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "fallback:0:1",
    roundTransitionToken: "fallback:0",
  });

  assert.equal(host.root.querySelector(`.${WIPE_CLASS}`), null);

  updateCricketGridStatusEffects({
    documentRef: host.documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "fallback:1:0",
    roundTransitionToken: "fallback:1",
  });

  const wipe = host.root.querySelector(`.${WIPE_CLASS}`);
  assert.ok(wipe);
  assert.equal(wipe.getAttribute(CRICKET_SURFACE_OVERLAY_ATTRIBUTE), "true");
  assert.equal(host.root.children.length, 33);

  const duringWipe = host.read();
  assert.equal(duringWipe.gridSnapshot.modern, true);
  assert.equal(duringWipe.gridSnapshot.rows.length, 7);

  updateCricketGridStatusEffects({
    documentRef: host.documentRef,
    cricketRules,
    renderState: duringWipe,
    state,
    visualConfig,
    turnToken: "fallback:1:0",
    roundTransitionToken: "fallback:1",
  });
  assert.equal(host.root.classList.contains(MODERN_ROOT_CLASS), true);
  assert.equal(host.labelNodes.get("20").classList.contains(NATIVE_LABEL_CLASS), true);
  assert.equal(host.labelNodes.get("20").classList.contains(BADGE_CLASS), false);

  clearCricketGridStatusEffectsState(state);
});

test("modern Cricket grid effects stay mounted while the dartboard surface is unavailable", () => {
  const host = fixture();
  const board = appendBoardFixture(host.documentRef);
  const observers = createObserverRegistry();
  const cleanup = initializeCricketGridStatusEffects({
    documentRef: host.documentRef,
    windowRef: host.windowRef,
    domGuards: createDomGuards({ documentRef: host.documentRef }),
    registries: { observers, listeners: createListenerRegistry() },
    domain: { cricketRules, variantRules },
    gameState: {
      isCricketVariant: () => false,
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      subscribe: () => () => {},
    },
    config: {
      getFeatureConfig() {
        return {
          rowWave: false,
          badgeBeacon: true,
          markProgress: false,
          pressureEdge: true,
          scoringStripe: true,
          deadRowMuted: true,
          deltaChips: false,
          hitSpark: false,
          roundTransitionWipe: false,
          pressureOverlay: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule: callback,
          cancel() {},
          isScheduled: () => false,
        };
      },
    },
  });

  assert.equal(Boolean(host.documentRef.getElementById(STYLE_ID)), true);
  assert.equal(host.root.classList.contains(ROOT_CLASS), true);
  assert.equal(host.root.classList.contains(MODERN_ROOT_CLASS), true);
  assert.equal(host.labelNodes.get("20").classList.contains(NATIVE_LABEL_CLASS), true);
  assert.equal(host.root.querySelectorAll(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`).length, 0);

  const observer = observers.get("cricket-grid-status-effects:dom-observer");
  assert.ok(observer);
  board.remove();
  observer.callback([{
    type: "childList",
    target: host.documentRef.main,
    addedNodes: [],
    removedNodes: [board],
  }]);

  assert.equal(host.root.classList.contains(ROOT_CLASS), true);
  assert.equal(host.root.classList.contains(MODERN_ROOT_CLASS), true);
  assert.equal(host.labelNodes.get("20").classList.contains(NATIVE_LABEL_CLASS), true);
  assert.equal(host.root.querySelectorAll(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`).length, 0);

  cleanup();
  assert.equal(host.documentRef.getElementById(STYLE_ID), null);
  assert.equal(host.root.classList.contains(ROOT_CLASS), false);
  assert.equal(host.root.classList.contains(MODERN_ROOT_CLASS), false);
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
