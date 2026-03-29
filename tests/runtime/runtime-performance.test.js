import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createEventBus } from "../../src/core/event-bus.js";
import { createGameStateStore } from "../../src/core/game-state-store.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { initializeCheckoutBoardTargets } from "../../src/features/checkout-board-targets/index.js";
import { renderCheckoutTargets } from "../../src/features/checkout-board-targets/logic.js";
import { initializeCricketHighlighter } from "../../src/features/cricket-highlighter/index.js";
import { initializeCricketGridFx } from "../../src/features/cricket-grid-fx/index.js";
import { initializeTripleDoubleBullHits } from "../../src/features/triple-double-bull-hits/index.js";
import {
  OVERLAY_ID as CHECKOUT_OVERLAY_ID,
  resolveBoardTargetVisualConfig,
} from "../../src/features/checkout-board-targets/style.js";
import {
  OVERLAY_ID as CRICKET_OVERLAY_ID,
  STYLE_ID as CRICKET_STYLE_ID,
} from "../../src/features/cricket-highlighter/style.js";
import {
  PRESSURE_CLASS,
  SCORE_CLASS,
  THREAT_CLASS,
} from "../../src/features/cricket-grid-fx/style.js";
import { initializeRemoveDartsNotification } from "../../src/features/remove-darts-notification/index.js";
import { initializeTurnPointsCount } from "../../src/features/turn-points-count/index.js";
import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  FakeDocument,
  FakeMessageEvent,
  FakeWebSocket,
  createFakeWindow,
} from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createCountingSchedulerFactory(counterRef) {
  return () => ({
    schedule() {
      counterRef.count += 1;
    },
    cancel() {},
    isScheduled() {
      return false;
    },
  });
}

function createImmediateSchedulerFactory(counterRef) {
  return (callback) => ({
    schedule() {
      counterRef.count += 1;
      callback();
    },
    cancel() {},
    isScheduled() {
      return false;
    },
  });
}

function appendBoardFixture(documentRef) {
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");

  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }

  documentRef.main.appendChild(svg);
  return { svg, group };
}

test("checkout-board-targets ignores self-managed overlay mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const observerRegistry = createObserverRegistry();
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards,
    registries: {
      observers: observerRegistry,
    },
    gameState: {
      isX01Variant: () => true,
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules: {
        parseCheckoutTargetsFromSuggestion: () => [],
      },
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    helpers: {
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  assert.equal(scheduleCounter.count, 1);

  const observer = observerRegistry.get("checkout-board-targets:dom-observer");
  assert.ok(observer);

  const managedOverlay = documentRef.createElement("div");
  managedOverlay.id = CHECKOUT_OVERLAY_ID;

  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [managedOverlay],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, 1);

  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, 2);

  cleanup();
});

test("checkout-board-targets render helper draws every provided target once", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "170");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const visualConfig = resolveBoardTargetVisualConfig({
    effect: "pulse",
    singleRing: "both",
    colorTheme: "violet",
    outlineIntensity: "standard",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 170,
    },
    checkoutTargets: [
      { ring: "T", value: 20 },
      { ring: "D", value: 10 },
    ],
    visualConfig,
  });

  const overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);
  assert.equal(overlay.children.length, 4);
});

test("checkout-board-targets selects next, finish or all route segments from visible checkout suggestions", () => {
  function createBoardDocument() {
    const documentRef = new FakeDocument();
    documentRef.suggestionElement.textContent = "BULL";
    documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
    const secondSuggestion = documentRef.createElement("div");
    secondSuggestion.classList.add("suggestion");
    secondSuggestion.textContent = "D8";
    secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
    documentRef.main.appendChild(secondSuggestion);
    appendBoardFixture(documentRef);
    return { documentRef, secondSuggestion };
  }

  function mountWithMode(targetSelectionMode) {
    const { documentRef } = createBoardDocument();
    const windowRef = createFakeWindow({ documentRef });
    const cleanup = initializeCheckoutBoardTargets({
      documentRef,
      windowRef,
      domGuards: createDomGuards({ documentRef }),
      registries: {
        observers: createObserverRegistry(),
      },
      gameState: {
        isX01Variant: () => true,
        getOutMode: () => "Double Out",
        subscribe() {
          return () => {};
        },
      },
      domain: {
        x01Rules,
        variantRules: {
          isX01VariantText: () => true,
        },
      },
      config: {
        getFeatureConfig() {
          return {
            effect: "pulse",
            singleRing: "both",
            targetSelectionMode,
            colorTheme: "violet",
            outlineIntensity: "standard",
          };
        },
      },
      helpers: {
        createRafScheduler(callback) {
          return {
            schedule() {
              callback();
            },
            cancel() {},
            isScheduled() {
              return false;
            },
          };
        },
      },
    });

    const overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    return { cleanup, overlay };
  }

  const nextSelection = mountWithMode("next");
  try {
    assert.equal(nextSelection.overlay.children.length, 2);
    assert.equal(String(nextSelection.overlay.children[0]?.tagName || ""), "CIRCLE");
  } finally {
    nextSelection.cleanup();
  }

  const finishSelection = mountWithMode("finish");
  try {
    assert.equal(finishSelection.overlay.children.length, 2);
    assert.equal(String(finishSelection.overlay.children[0]?.tagName || ""), "PATH");
  } finally {
    finishSelection.cleanup();
  }

  const allSelection = mountWithMode("all");
  try {
    assert.equal(allSelection.overlay.children.length, 4);
  } finally {
    allSelection.cleanup();
  }
});

test("checkout-board-targets next mode prefers the current one-dart checkout over stale route-first steps", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "50";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "BULL";
  secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
  documentRef.main.appendChild(secondSuggestion);
  appendBoardFixture(documentRef);

  const logs = [];
  const warnings = [];
  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef: createFakeWindow({ documentRef }),
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      getActiveScore: () => 50,
      getOutMode: () => "Double Out",
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        logs.push(args);
      },
      warn(...args) {
        warnings.push(args);
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  try {
    assert.equal(warnings.length, 0);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][1]?.status, "render");
    assert.equal(logs[0][1]?.activeScore, 50);
    assert.equal(logs[0][1]?.selectionSource, "route-current-checkout");
    assert.deepEqual(logs[0][1]?.routeSegments, ["T20", "BULL"]);
    assert.deepEqual(logs[0][1]?.selectedSegments, ["BULL"]);
    assert.deepEqual(logs[0][1]?.targets, [{ ring: "DB", value: null }]);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets next mode falls back to the active score checkout when route suggestions disappear", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "50";
  documentRef.suggestionElement.textContent = "";
  appendBoardFixture(documentRef);

  const logs = [];
  const warnings = [];
  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef: createFakeWindow({ documentRef }),
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      getActiveScore: () => 50,
      getOutMode: () => "Double Out",
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        logs.push(args);
      },
      warn(...args) {
        warnings.push(args);
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  try {
    assert.equal(warnings.length, 0);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][1]?.status, "render");
    assert.equal(logs[0][1]?.selectionSource, "score-checkout");
    assert.deepEqual(logs[0][1]?.routeSegments, []);
    assert.deepEqual(logs[0][1]?.selectedSegments, ["BULL"]);
    assert.deepEqual(logs[0][1]?.targets, [{ ring: "DB", value: null }]);
    const overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    assert.equal(overlay.children.length > 0, true);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets emits debug snapshots for render and no-route states", () => {
  const renderDocument = new FakeDocument();
  renderDocument.suggestionElement.textContent = "D20";
  appendBoardFixture(renderDocument);
  const renderLogs = [];
  const renderWarnings = [];

  const renderCleanup = initializeCheckoutBoardTargets({
    documentRef: renderDocument,
    windowRef: createFakeWindow({ documentRef: renderDocument }),
    domGuards: createDomGuards({ documentRef: renderDocument }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      getOutMode: () => "Double Out",
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
          outlineIntensity: "standard",
          debug: true,
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        renderLogs.push(args);
      },
      warn(...args) {
        renderWarnings.push(args);
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  renderCleanup();

  assert.equal(renderLogs.length, 1);
  assert.equal(renderWarnings.length, 0);
  assert.match(String(renderLogs[0][0] || ""), /status="render"/);
  assert.equal(renderLogs[0][1]?.status, "render");
  assert.deepEqual(renderLogs[0][1]?.routeSegments, ["D20"]);
  assert.deepEqual(renderLogs[0][1]?.targets, [{ ring: "D", value: 20 }]);
  assert.equal(renderLogs[0][1]?.board?.found, true);

  const noRouteDocument = new FakeDocument();
  noRouteDocument.suggestionElement.textContent = "";
  appendBoardFixture(noRouteDocument);
  const noRouteLogs = [];
  const noRouteWarnings = [];

  const noRouteCleanup = initializeCheckoutBoardTargets({
    documentRef: noRouteDocument,
    windowRef: createFakeWindow({ documentRef: noRouteDocument }),
    domGuards: createDomGuards({ documentRef: noRouteDocument }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      getOutMode: () => "Double Out",
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
          outlineIntensity: "standard",
          debug: true,
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        noRouteLogs.push(args);
      },
      warn(...args) {
        noRouteWarnings.push(args);
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  noRouteCleanup();

  assert.equal(noRouteLogs.length, 0);
  assert.equal(noRouteWarnings.length, 1);
  assert.match(String(noRouteWarnings[0][0] || ""), /status="no-route"/);
  assert.equal(noRouteWarnings[0][1]?.status, "no-route");
  assert.deepEqual(noRouteWarnings[0][1]?.routeSegments, []);
  assert.deepEqual(noRouteWarnings[0][1]?.targets, []);
});

test("checkout-board-targets still renders when the suggestion node text exists but its rect collapses", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "D20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 0, height: 0 };
  appendBoardFixture(documentRef);
  const windowRef = createFakeWindow({ documentRef });

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  try {
    const overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    assert.equal(overlay.children.length, 2);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets rerenders after board replacement even when suggestion text stays unchanged", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const observerRegistry = createObserverRegistry();

  function createBoard() {
    const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
    const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
    boardCircle.setAttribute("r", "170");
    group.appendChild(boardCircle);

    for (const value of [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]) {
      const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
      labelNode.textContent = String(value);
      group.appendChild(labelNode);
    }

    svg.appendChild(group);
    return { svg, group };
  }

  const firstBoard = createBoard();
  documentRef.main.appendChild(firstBoard.svg);
  documentRef.suggestionElement.textContent = "D20";

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards,
    registries: {
      observers: observerRegistry,
    },
    gameState: {
      isX01Variant: () => true,
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  assert.ok(firstBoard.group.querySelector(`#${CHECKOUT_OVERLAY_ID}`));

  const secondBoard = createBoard();
  documentRef.main.removeChild(firstBoard.svg);
  documentRef.main.appendChild(secondBoard.svg);

  const observer = observerRegistry.get("checkout-board-targets:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [secondBoard.svg],
      removedNodes: [firstBoard.svg],
    },
  ]);

  const secondOverlay = secondBoard.group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(secondOverlay);
  assert.equal(secondOverlay.children.length > 0, true);

  cleanup();
});

test("checkout-board-targets rerenders onto a replaced board when suggestion and variant stay unchanged", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.suggestionElement.textContent = "D20";
  const firstBoard = appendBoardFixture(documentRef);
  const scheduleCounter = { count: 0 };
  const observerRegistry = createObserverRegistry();

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: observerRegistry,
    },
    gameState: {
      isX01Variant: () => true,
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          singleRing: "both",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    helpers: {
      createRafScheduler: createImmediateSchedulerFactory(scheduleCounter),
    },
  });

  try {
    assert.equal(scheduleCounter.count, 1);
    assert.ok(firstBoard.group.querySelector(`#${CHECKOUT_OVERLAY_ID}`));

    firstBoard.svg.remove();
    const secondBoard = appendBoardFixture(documentRef);
    const observer = observerRegistry.get("checkout-board-targets:dom-observer");
    assert.ok(observer);

    observer.callback([
      {
        type: "childList",
        target: documentRef.main,
        addedNodes: [secondBoard.svg],
        removedNodes: [firstBoard.svg],
      },
    ]);

    assert.equal(scheduleCounter.count, 2);
    assert.ok(secondBoard.group.querySelector(`#${CHECKOUT_OVERLAY_ID}`));
  } finally {
    cleanup();
  }
});

test("cricket-highlighter rebuilds overlay after external overlay removal with unchanged state", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }

  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let index = 0; index < 2; index += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      cell.setAttribute("data-marks", label === "20" && index === 0 ? "3" : "0");
      cell.textContent = label === "20" && index === 0 ? "3" : "0";
      row.appendChild(cell);
    }

    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const initialOverlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(initialOverlay), true);
  assert.equal((initialOverlay?.children?.length || 0) > 0, true);

  initialOverlay.parentNode?.removeChild(initialOverlay);

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: group,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [initialOverlay],
    },
  ]);

  const restoredOverlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(restoredOverlay), true);
  assert.equal((restoredOverlay?.children?.length || 0) > 0, true);
  assert.equal(scheduleCounter.count >= 2, true);

  cleanup();
});

test("cricket-highlighter repairs stale style contract at mount and logs once", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }
  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);
    for (let index = 0; index < 2; index += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      cell.setAttribute("data-marks", label === "20" && index === 0 ? "3" : "0");
      cell.textContent = label === "20" && index === 0 ? "3" : "0";
      row.appendChild(cell);
    }
    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const baseDomGuards = createDomGuards({ documentRef });
  const staleStyleCss = `
.ad-ext-cricket-target {
  fill: var(--ad-ext-cricket-fill, transparent);
}
.ad-ext-cricket-target.is-open {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-open-fill);
}
`;
  let styleEnsureCalls = 0;
  const domGuards = {
    ...baseDomGuards,
    ensureStyle(styleId, cssText, localOptions = {}) {
      if (styleId !== CRICKET_STYLE_ID) {
        return baseDomGuards.ensureStyle(styleId, cssText, localOptions);
      }
      styleEnsureCalls += 1;
      if (styleEnsureCalls === 1) {
        return baseDomGuards.ensureStyle(styleId, staleStyleCss, localOptions);
      }
      return baseDomGuards.ensureStyle(styleId, cssText, localOptions);
    },
  };

  const warnings = [];
  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards,
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
          debug: true,
        };
      },
    },
    featureDebug: {
      enabled: true,
      log() {},
      warn(message) {
        warnings.push(String(message || ""));
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const styleNode = documentRef.getElementById(CRICKET_STYLE_ID);
  assert.ok(styleNode);
  assert.match(String(styleNode?.textContent || ""), /\.ad-ext-cricket-target\.is-open\s*\{/);
  assert.match(String(styleNode?.textContent || ""), /\.ad-ext-cricket-target\.is-dead\s*\{/);
  assert.match(String(styleNode?.textContent || ""), /\.ad-ext-cricket-target\.is-inactive\s*\{/);
  assert.match(String(styleNode?.textContent || ""), /\.ad-ext-cricket-target\.is-scoring\s*\{/);
  assert.match(String(styleNode?.textContent || ""), /\.ad-ext-cricket-target\.is-pressure\s*\{/);
  assert.equal(styleEnsureCalls >= 2, true);
  assert.equal(warnings.filter((entry) => entry.includes("warn style-contract")).length, 1);

  cleanup();
});

test("triple-double-bull-hits emits deduplicated debug state with row diagnostics", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.__adXConfig = { apiVersion: "test-runtime" };
  windowRef.anime = Object.assign(
    () => ({
      pause() {},
    }),
    {
      remove() {},
      timeline() {
        return {
          add() {
            return this;
          },
          play() {
            return this;
          },
          pause() {},
        };
      },
    }
  );
  documentRef.throwTextElement.textContent = "36 D18";
  documentRef.throwRow.textContent = "36 D18";
  documentRef.turnPointsElement.textContent = "36";

  const logs = [];
  const warnings = [];
  const scheduleCounter = { count: 0 };
  const observers = createObserverRegistry();

  const cleanup = initializeTripleDoubleBullHits({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners: createListenerRegistry(),
    },
    gameState: {
      subscribe() {
        return () => {};
      },
    },
    config: {
      getFeatureConfig() {
        return {
          colorTheme: "champagne-night",
          animationStyle: "impact-pop",
          debug: true,
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(message) {
        logs.push(String(message || ""));
      },
      warn(message) {
        warnings.push(String(message || ""));
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const observer = observers.get("triple-double-bull-hits:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);

  assert.equal(scheduleCounter.count >= 3, true);
  assert.equal(logs.some((entry) => entry.includes('runtime apiVersion="test-runtime"')), true);
  assert.equal(logs.filter((entry) => entry.includes("state apiVersion=")).length, 2);
  assert.equal(logs.some((entry) => entry.includes('renderer="css+anime"')), true);
  assert.equal(logs.some((entry) => entry.includes("bursts=1")), true);
  assert.equal(logs.some((entry) => entry.includes('rowsDebug="#0:double:D18:b1:i0:')), true);
  assert.equal(warnings.length, 0);

  cleanup();
});

test("cricket-highlighter rerenders on throw updates even when board state stays the same", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }
  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);
    for (let index = 0; index < 2; index += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      const marks = label === "20" && index === 0 ? "3" : "0";
      cell.setAttribute("data-marks", marks);
      cell.textContent = marks;
      row.appendChild(cell);
    }
    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  let activePlayerIndex = 0;
  let activeThrows = [];
  let onStateChange = () => {};
  const fixedTurn = {
    id: "turn-live",
    playerId: "a",
    round: 1,
    turn: 1,
    createdAt: "2026-03-11T21:00:00.000Z",
  };
  const logs = [];

  const setDomActivePlayer = (index) => {
    documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
    documentRef.winnerNode.classList.remove("ad-ext-player-active");
    if (index === 0) {
      documentRef.activePlayerRow.classList.add("ad-ext-player-active");
    } else {
      documentRef.winnerNode.classList.add("ad-ext-player-active");
    }
  };

  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => activePlayerIndex,
      getActiveThrows: () => activeThrows,
      getActiveTurn: () => fixedTurn,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe(handler) {
        onStateChange = typeof handler === "function" ? handler : () => {};
        return () => {
          onStateChange = () => {};
        };
      },
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showOpenTargets: true,
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(message) {
        logs.push(String(message || ""));
      },
      warn() {},
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const readPresentation = (label) => {
    const overlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
    const shapes = Array.from(overlay?.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shapes[0]?.dataset?.targetPresentation || "");
  };

  assert.equal(readPresentation("20"), "scoring");
  const logsAfterInit = logs.length;

  activePlayerIndex = 1;
  setDomActivePlayer(1);
  onStateChange();
  assert.equal(readPresentation("20"), "pressure");
  const logsAfterPlayerSwitch = logs.length;
  assert.equal(logsAfterPlayerSwitch > logsAfterInit, true);

  // S5 changes active throw count but not any cricket objective state.
  activeThrows = [{ segment: { name: "S5" } }];
  onStateChange();
  assert.equal(readPresentation("20"), "pressure");
  assert.equal(logs.length > logsAfterPlayerSwitch, true);

  cleanup();
});

test("cricket-highlighter reacts to attribute-only hydration updates for marks and active-player class", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }
  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);
    for (let index = 0; index < 2; index += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      let marks = "0";
      if (label === "18") {
        marks = "3";
      }
      cell.setAttribute("data-marks", marks);
      cell.textContent = marks;
      row.appendChild(cell);
    }
    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const getRow = (label) => {
    return Array.from(table.children || []).find((candidate) => {
      const text = String(candidate?.children?.[0]?.textContent || "").trim().toUpperCase();
      const normalized = label === "BULL" ? "BULL" : String(label).toUpperCase();
      return text === normalized;
    }) || null;
  };
  const row18 = getRow("18");
  const row18Player0 = row18?.children?.[1] || null;
  assert.ok(row18Player0);

  const readPresentation = (label) => {
    const overlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
    const shapes = Array.from(overlay?.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shapes[0]?.dataset?.targetPresentation || "");
  };

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.winnerNode.classList.add("ad-ext-player-active");
  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      // Deliberately stale index: class-mutation observer must correct perspective.
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showOpenTargets: true,
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  const observeOptions = observer.observeCalls?.[0]?.options || {};
  assert.equal(observeOptions.attributes, true);
  assert.equal(Array.isArray(observeOptions.attributeFilter), true);
  assert.equal(observeOptions.attributeFilter.includes("data-marks"), true);
  assert.equal(observeOptions.attributeFilter.includes("class"), true);

  assert.equal(readPresentation("18"), "dead");

  row18Player0?.setAttribute?.("data-marks", "2");
  row18Player0.textContent = "2";
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.winnerNode.classList.add("ad-ext-player-active");

  observer.callback([
    {
      type: "attributes",
      target: row18Player0,
      attributeName: "data-marks",
      addedNodes: [],
      removedNodes: [],
    },
    {
      type: "attributes",
      target: documentRef.winnerNode,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
  ]);

  assert.notEqual(readPresentation("18"), "dead");
  assert.equal(scheduleCounter.count >= 2, true);

  cleanup();
});

test("cricket-highlighter emits missing-grid warning only once for unchanged status", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const observers = createObserverRegistry();
  const warnings = [];
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners: createListenerRegistry(),
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log() {},
      warn(message) {
        warnings.push(String(message || ""));
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);

  assert.equal(scheduleCounter.count >= 3, true);
  assert.equal(warnings.filter((entry) => entry.includes("warn kein Grid")).length, 1);

  cleanup();
});

test("cricket-grid-fx rerenders after grid DOM replacement even when transition signature is unchanged", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const targetOrder = ["20", "19", "18", "17", "16", "15", "BULL"];
  const createGridTable = () => {
    const table = documentRef.createElement("table");
    table.id = "grid";

    targetOrder.forEach((label) => {
      const row = documentRef.createElement("tr");

      const labelCell = documentRef.createElement("td");
      labelCell.classList.add("label-cell");
      labelCell.textContent = label === "BULL" ? "Bull" : label;
      row.appendChild(labelCell);

      for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
        const cell = documentRef.createElement("td");
        cell.classList.add("player-cell");
        cell.setAttribute("data-player-index", String(playerIndex));
        const marks = label === "20" && playerIndex === 0 ? 3 : 0;
        cell.setAttribute("data-marks", String(marks));
        row.appendChild(cell);
      }

      table.appendChild(row);
    });

    return table;
  };

  const getOwnerCellForLabel = (table, label) => {
    const row = Array.from(table.children || []).find((candidate) => {
      const cellText = String(candidate?.children?.[0]?.textContent || "")
        .trim()
        .toUpperCase();
      const normalized = label === "BULL" ? "BULL" : String(label);
      return cellText === normalized;
    });
    return row?.children?.[1] || null;
  };

  const initialGrid = createGridTable();
  documentRef.main.appendChild(initialGrid);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCricketGridFx({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          rowWave: true,
          badgeBeacon: true,
          markProgress: true,
          pressureEdge: true,
          scoringStripe: true,
          deadRowMuted: true,
          deltaChips: true,
          hitSpark: true,
          roundTransitionWipe: true,
          pressureOverlay: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const initialOwner20 = getOwnerCellForLabel(initialGrid, "20");
  assert.equal(Boolean(initialOwner20?.classList?.contains(SCORE_CLASS)), true);

  const replacementGrid = createGridTable();
  documentRef.main.removeChild(initialGrid);
  documentRef.main.appendChild(replacementGrid);

  const observer = observers.get("cricket-grid-fx:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [replacementGrid],
      removedNodes: [initialGrid],
    },
  ]);

  const replacementOwner20 = getOwnerCellForLabel(replacementGrid, "20");
  assert.equal(Boolean(replacementOwner20?.classList?.contains(SCORE_CLASS)), true);
  assert.equal(scheduleCounter.count >= 2, true);

  cleanup();
});

test("cricket-grid-fx reacts to attribute-only mark updates and ignores self class churn", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(playerIndex));
      let marks = "0";
      if (label === "18") {
        marks = "3";
      }
      cell.setAttribute("data-marks", marks);
      cell.textContent = marks;
      row.appendChild(cell);
    }

    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const getRow = (label) => {
    return Array.from(table.children || []).find((candidate) => {
      const text = String(candidate?.children?.[0]?.textContent || "").trim().toUpperCase();
      const normalized = label === "BULL" ? "BULL" : String(label).toUpperCase();
      return text === normalized;
    }) || null;
  };
  const row18 = getRow("18");
  const row18Player0 = row18?.children?.[1] || null;
  const row18Player1 = row18?.children?.[2] || null;
  assert.ok(row18Player0);
  assert.ok(row18Player1);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCricketGridFx({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          rowWave: true,
          badgeBeacon: true,
          markProgress: true,
          pressureEdge: true,
          scoringStripe: true,
          deadRowMuted: true,
          deltaChips: true,
          hitSpark: true,
          roundTransitionWipe: true,
          pressureOverlay: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const observer = observers.get("cricket-grid-fx:dom-observer");
  assert.ok(observer);
  const observeOptions = observer.observeCalls?.[0]?.options || {};
  assert.equal(observeOptions.attributes, true);
  assert.equal(Array.isArray(observeOptions.attributeFilter), true);
  assert.equal(observeOptions.attributeFilter.includes("data-marks"), true);
  assert.equal(observeOptions.attributeFilter.includes("class"), true);

  const countAfterInit = scheduleCounter.count;
  observer.callback([
    {
      type: "attributes",
      target: row18Player0,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, countAfterInit);

  row18Player0?.setAttribute?.("data-marks", "2");
  row18Player0.textContent = "2";
  observer.callback([
    {
      type: "attributes",
      target: row18Player0,
      attributeName: "data-marks",
      addedNodes: [],
      removedNodes: [],
    },
  ]);

  assert.equal(Boolean(row18Player0?.classList?.contains(PRESSURE_CLASS)), true);
  assert.equal(Boolean(row18Player0?.classList?.contains(THREAT_CLASS)), true);
  assert.equal(Boolean(row18Player1?.classList?.contains(SCORE_CLASS)), true);
  assert.equal(scheduleCounter.count >= countAfterInit + 1, true);

  cleanup();
});

test("cricket-grid-fx schedules for alt-attribute mutations on mark icons inside the grid", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", label === "18" ? "3" : "0");
      cell.appendChild(icon);
      row.appendChild(cell);
    }

    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };
  const cleanup = initializeCricketGridFx({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          rowWave: true,
          badgeBeacon: true,
          markProgress: true,
          pressureEdge: true,
          scoringStripe: true,
          deadRowMuted: true,
          deltaChips: true,
          hitSpark: true,
          roundTransitionWipe: true,
          pressureOverlay: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const observer = observers.get("cricket-grid-fx:dom-observer");
  assert.ok(observer);

  const row18Icon = Array.from(table.querySelectorAll("tr")).find((row) => {
    return String(row?.children?.[0]?.textContent || "").trim() === "18";
  })?.children?.[1]?.querySelector?.("img");
  assert.ok(row18Icon);

  const countAfterInit = scheduleCounter.count;
  row18Icon?.setAttribute?.("alt", "2");
  observer.callback([
    {
      type: "attributes",
      target: row18Icon,
      attributeName: "alt",
      addedNodes: [],
      removedNodes: [],
    },
  ]);

  assert.equal(scheduleCounter.count >= countAfterInit + 1, true);
  cleanup();
});

test("cricket-highlighter schedules for alt-attribute mutations on mark icons inside the grid", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }
  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", label === "18" ? "3" : "0");
      cell.appendChild(icon);
      row.appendChild(cell);
    }

    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const readPresentation = (label) => {
    const overlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
    const shapes = Array.from(overlay?.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shapes[0]?.dataset?.targetPresentation || "");
  };

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };
  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 1,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showOpenTargets: true,
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  assert.equal(readPresentation("18"), "dead");

  const row18OwnerIcon = Array.from(table.querySelectorAll("tr")).find((row) => {
    return String(row?.children?.[0]?.textContent || "").trim() === "18";
  })?.children?.[1]?.querySelector?.("img");
  assert.ok(row18OwnerIcon);

  const countAfterInit = scheduleCounter.count;
  row18OwnerIcon?.setAttribute?.("alt", "2");
  observer.callback([
    {
      type: "attributes",
      target: row18OwnerIcon,
      attributeName: "alt",
      addedNodes: [],
      removedNodes: [],
    },
  ]);

  assert.notEqual(readPresentation("18"), "dead");
  assert.equal(scheduleCounter.count >= countAfterInit + 1, true);
  cleanup();
});

test("remove-darts-notification uses only the direct game-state subscription", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const scheduleCounter = { count: 0 };
  let eventBusRegistrations = 0;
  let gameStateListener = () => {};

  const cleanup = initializeRemoveDartsNotification({
    documentRef,
    windowRef,
    domGuards,
    registries: {
      observers: createObserverRegistry(),
    },
    eventBus: {
      on() {
        eventBusRegistrations += 1;
        return () => {};
      },
    },
    gameState: {
      subscribe(listener) {
        gameStateListener = listener;
        return () => {};
      },
    },
    config: {
      getFeatureConfig() {
        return {
          imageSize: "standard",
          pulseAnimation: true,
          pulseScale: 1.04,
        };
      },
    },
    helpers: {
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  assert.equal(scheduleCounter.count, 1);
  assert.equal(eventBusRegistrations, 0);

  gameStateListener();
  assert.equal(scheduleCounter.count, 2);

  cleanup();
});

test("turn-points-count ignores late anime loader resolution after cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.anime = () => ({ pause() {} });

  const scheduleCounter = { count: 0 };

  const cleanup = initializeTurnPointsCount({
    documentRef,
    windowRef,
    gameState: {
      subscribe() {
        return () => {};
      },
    },
    config: {
      getFeatureConfig() {
        return {
          durationMs: 416,
        };
      },
    },
    helpers: {
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  assert.equal(scheduleCounter.count, 1);

  cleanup();
  await wait(5);

  assert.equal(scheduleCounter.count, 1);
});

test("game state store suppresses identical consecutive websocket state payloads", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const eventBus = createEventBus();
  const store = createGameStateStore({ eventBus, windowRef, documentRef });

  let subscriberCalls = 0;
  let eventBusCalls = 0;

  store.subscribe(() => {
    subscriberCalls += 1;
  });
  eventBus.on("game-state:updated", () => {
    eventBusCalls += 1;
  });

  store.start();

  const payload = JSON.stringify({
    channel: "autodarts.matches",
    topic: "match-123.state",
    data: {
      variant: "X01",
      player: 0,
      players: [{ id: "player-1" }, { id: "player-2" }],
      gameScores: [170, 301],
      settings: {
        outMode: "Double Out",
      },
      turns: [],
    },
  });

  void new FakeMessageEvent(payload, new FakeWebSocket()).data;
  void new FakeMessageEvent(payload, new FakeWebSocket()).data;

  assert.equal(subscriberCalls, 1);
  assert.equal(eventBusCalls, 1);

  store.stop();
});
