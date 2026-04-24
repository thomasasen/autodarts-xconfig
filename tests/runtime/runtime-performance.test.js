import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createEventBus } from "../../src/core/event-bus.js";
import { createGameStateStore } from "../../src/core/game-state-store.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import {
  initializeCheckoutBoardTargets,
  resolveCheckoutBoardMutationReaction,
} from "../../src/features/checkout-board-targets/index.js";
import { renderCheckoutTargets } from "../../src/features/checkout-board-targets/logic.js";
import { initializeCricketHighlighter } from "../../src/features/cricket-highlighter/index.js";
import { initializeCricketGridFx } from "../../src/features/cricket-grid-fx/index.js";
import { initializeTripleDoubleBullHits } from "../../src/features/triple-double-bull-hits/index.js";
import {
  buildStyleText,
  EFFECT_CLASSES,
  OUTLINE_CLASS,
  OVERLAY_ID as CHECKOUT_OVERLAY_ID,
  TARGET_CLASS,
  TARGET_FAMILY_ATTRIBUTE,
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
import { ELECTRIC_FILTER_DEFS_NODE_ID } from "../../src/shared/electric-border-engine.js";
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

function assertApprox(actual, expected, epsilon = 0.000001) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
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
      addedNodes: [documentRef.suggestionElement],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, 2);

  cleanup();
});

test("checkout-board-targets classifies semantic and board mutations without promoting unrelated UI churn", () => {
  const documentRef = new FakeDocument();
  const board = appendBoardFixture(documentRef);

  const unrelatedNode = documentRef.createElement("div");
  unrelatedNode.classList.add("ad-ext-x01-score-progress__fill");
  documentRef.main.appendChild(unrelatedNode);

  assert.deepEqual(
    resolveCheckoutBoardMutationReaction(
      [
        {
          type: "attributes",
          target: unrelatedNode,
          attributeName: "class",
          addedNodes: [],
          removedNodes: [],
        },
      ],
      { board }
    ),
    {
      shouldSchedule: false,
      shouldInvalidateBoardCache: false,
    }
  );

  assert.deepEqual(
    resolveCheckoutBoardMutationReaction(
      [
        {
          type: "attributes",
          target: documentRef.throwRow,
          attributeName: "class",
          addedNodes: [],
          removedNodes: [],
        },
      ],
      { board }
    ),
    {
      shouldSchedule: true,
      shouldInvalidateBoardCache: false,
    }
  );

  const replacementBoard = appendBoardFixture(documentRef);
  assert.deepEqual(
    resolveCheckoutBoardMutationReaction(
      [
        {
          type: "childList",
          target: documentRef.main,
          addedNodes: [replacementBoard.svg],
          removedNodes: [board.svg],
        },
      ],
      { board }
    ),
    {
      shouldSchedule: true,
      shouldInvalidateBoardCache: true,
    }
  );
});

test("checkout-board-targets ignores unrelated score-progress class churn", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const observerRegistry = createObserverRegistry();
  const scheduleCounter = { count: 0 };

  documentRef.suggestionElement.textContent = "D20";
  appendBoardFixture(documentRef);

  const noisyProgressNode = documentRef.createElement("div");
  noisyProgressNode.classList.add("ad-ext-x01-score-progress__fill");
  documentRef.main.appendChild(noisyProgressNode);

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
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  try {
    const observer = observerRegistry.get("checkout-board-targets:dom-observer");
    assert.ok(observer);
    assert.equal(scheduleCounter.count, 1);

    noisyProgressNode.classList.add("ad-ext-x01-score-progress__fill--effect-off");
    observer.callback([
      {
        type: "attributes",
        target: noisyProgressNode,
        attributeName: "class",
        addedNodes: [],
        removedNodes: [],
      },
    ]);

    assert.equal(scheduleCounter.count, 1);
  } finally {
    cleanup();
  }
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
    visualPreset: "focus",
    singleRing: "both",
    colorTheme: "violet",
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

test("checkout-board-targets reuses identical overlay nodes across rerenders so the pulse can continue", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "170");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const focusConfig = resolveBoardTargetVisualConfig({
    visualPreset: "focus",
    singleRing: "both",
    colorTheme: "violet",
  });
  const signalConfig = resolveBoardTargetVisualConfig({
    visualPreset: "signal",
    singleRing: "both",
    colorTheme: "amber",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 170,
    },
    checkoutTargets: [{ ring: "T", value: 20 }],
    visualConfig: focusConfig,
  });

  const overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);
  assert.equal(overlay.children.length, 2);

  const firstShapeNode = overlay.children[0];
  const firstOutlineNode = overlay.children[1];

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 170,
    },
    checkoutTargets: [{ ring: "T", value: 20 }],
    visualConfig: signalConfig,
  });

  assert.equal(overlay.children.length, 2);
  assert.equal(overlay.children[0], firstShapeNode);
  assert.equal(overlay.children[1], firstOutlineNode);
  assert.equal(firstShapeNode.classList.contains("ad-ext-checkout-target--signal"), true);
  assert.match(firstShapeNode.style.getPropertyValue("--ad-ext-target-color"), /245, 158, 11/);
  assert.equal(firstShapeNode.dataset.targetRing, "T");
  assert.equal(firstShapeNode.dataset.targetValue, "20");
});

test("checkout-board-targets surface-only mode keeps the S20 fill animated but removes stroke and outline", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "170");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const outlinedConfig = resolveBoardTargetVisualConfig({
    visualPreset: "focus",
    segmentStyle: "surface-outline",
    singleRing: "both",
    colorTheme: "violet",
  });
  const surfaceOnlyConfig = resolveBoardTargetVisualConfig({
    visualPreset: "signal",
    segmentStyle: "surface-only",
    singleRing: "both",
    colorTheme: "amber",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 170,
    },
    checkoutTargets: [{ ring: "S", value: 20 }],
    visualConfig: outlinedConfig,
  });

  const overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);
  assert.equal(overlay.children.length, 4);

  const firstShapeNode = overlay.children[0];

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 170,
    },
    checkoutTargets: [{ ring: "S", value: 20 }],
    visualConfig: surfaceOnlyConfig,
  });

  assert.equal(overlay.children.length, 2);
  assert.equal(overlay.children[0], firstShapeNode);
  assert.equal(overlay.querySelector(`.${OUTLINE_CLASS}`), null);
  assert.equal(firstShapeNode.classList.contains(EFFECT_CLASSES.signal), true);
  assert.equal(firstShapeNode.style.getPropertyValue("stroke"), "none");
  assert.equal(firstShapeNode.style.getPropertyValue("stroke-width"), "0");
  assert.match(firstShapeNode.style.getPropertyValue("--ad-ext-target-color"), /245, 158, 11/);
  assert.equal(firstShapeNode.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.968");
  assert.equal(firstShapeNode.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.088");
});

test("checkout-board-targets always uses both single rings while Segmentstil still controls outlines", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const combinations = [
    {
      singleRing: "inner",
      segmentStyle: "surface-outline",
      expectedShapeCount: 2,
      expectedOutlineCount: 2,
    },
    {
      singleRing: "outer",
      segmentStyle: "surface-outline",
      expectedShapeCount: 2,
      expectedOutlineCount: 2,
    },
    {
      singleRing: "both",
      segmentStyle: "surface-outline",
      expectedShapeCount: 2,
      expectedOutlineCount: 2,
    },
    {
      singleRing: "both",
      segmentStyle: "surface-only",
      expectedShapeCount: 2,
      expectedOutlineCount: 0,
    },
  ];

  const distinctShapePathsByCombo = new Map();

  combinations.forEach((combination) => {
    const visualConfig = resolveBoardTargetVisualConfig({
      visualPreset: "focus",
      singleRing: combination.singleRing,
      segmentStyle: combination.segmentStyle,
      colorTheme: "cyan",
    });

    renderCheckoutTargets({
      board: {
        svg,
        group,
        radius: 500,
      },
      checkoutTargets: [{ ring: "S", value: 10 }],
      visualConfig,
    });

    const overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
    assert.ok(overlay);

    const shapeNodes = Array.from(overlay.querySelectorAll(`.${TARGET_CLASS}`));
    const outlineNodes = Array.from(overlay.querySelectorAll(`.${OUTLINE_CLASS}`));
    const distinctShapePaths = new Set(shapeNodes.map((node) => node.getAttribute("d") || ""));

    assert.equal(shapeNodes.length, combination.expectedShapeCount);
    assert.equal(outlineNodes.length, combination.expectedOutlineCount);
    assert.equal(distinctShapePaths.size, combination.expectedShapeCount);

    distinctShapePathsByCombo.set(
      `${combination.singleRing}:${combination.segmentStyle}`,
      distinctShapePaths
    );
  });

  const innerPaths = distinctShapePathsByCombo.get("inner:surface-outline");
  const outerPaths = distinctShapePathsByCombo.get("outer:surface-outline");
  const bothOutlinedPaths = distinctShapePathsByCombo.get("both:surface-outline");
  const bothSurfaceOnlyPaths = distinctShapePathsByCombo.get("both:surface-only");

  assert.ok(innerPaths);
  assert.ok(outerPaths);
  assert.ok(bothOutlinedPaths);
  assert.ok(bothSurfaceOnlyPaths);
  assert.deepEqual(
    Array.from(innerPaths).sort((left, right) => left.localeCompare(right)),
    Array.from(bothOutlinedPaths).sort((left, right) => left.localeCompare(right))
  );
  assert.deepEqual(
    Array.from(outerPaths).sort((left, right) => left.localeCompare(right)),
    Array.from(bothOutlinedPaths).sort((left, right) => left.localeCompare(right))
  );
  assert.deepEqual(
    Array.from(bothSurfaceOnlyPaths).sort((left, right) => left.localeCompare(right)),
    Array.from(bothOutlinedPaths).sort((left, right) => left.localeCompare(right))
  );
});

test("checkout-board-targets keeps focus targets readable across single, outer and bull families", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const visualConfig = resolveBoardTargetVisualConfig({
    visualPreset: "focus",
    singleRing: "both",
    colorTheme: "amber",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "S", value: 20 }],
    visualConfig,
  });

  let overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  let singleNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='single']`));
  let singleShape = singleNodes.find((node) => !node.classList.contains("ad-ext-checkout-target-outline"));
  let singleOutline = singleNodes.find((node) =>
    node.classList.contains("ad-ext-checkout-target-outline")
  );

  assert.ok(singleShape);
  assert.ok(singleOutline);
  assertApprox(
    Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-stroke-width")),
    3.15
  );
  assertApprox(
    Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-outline-width")),
    5.1
  );
  assertApprox(
    Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")),
    0.56
  );
  assert.equal(singleShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.988");
  assert.equal(singleShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.046");
  assert.match(singleShape.style.getPropertyValue("--ad-ext-target-filter"), /drop-shadow/);
  assertApprox(
    Number.parseFloat(singleOutline.style.getPropertyValue("--ad-ext-target-outline-width")),
    5.1
  );
  assertApprox(
    Number.parseFloat(singleOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity")),
    0.46
  );

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "D", value: 18 }],
    visualConfig,
  });

  overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  let outerNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='outer']`));
  let outerShape = outerNodes.find((node) => !node.classList.contains("ad-ext-checkout-target-outline"));
  let outerOutline = outerNodes.find((node) => node.classList.contains("ad-ext-checkout-target-outline"));

  assert.ok(outerShape);
  assert.ok(outerOutline);
  assertApprox(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-stroke-width")),
    3.8
  );
  assertApprox(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.3
  );
  assertApprox(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")),
    0.64
  );
  assert.equal(outerShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.985");
  assert.equal(outerShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.068");
  assert.match(
    outerShape.style.getPropertyValue("--ad-ext-target-filter"),
    /drop-shadow/
  );
  assertApprox(
    Number.parseFloat(outerOutline.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.3
  );
  assertApprox(
    Number.parseFloat(outerOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity")),
    0.52
  );

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "SB", value: 25 }],
    visualConfig,
  });

  overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  const bullNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='bull']`));
  const bullShape = bullNodes.find((node) => !node.classList.contains("ad-ext-checkout-target-outline"));
  const bullOutline = bullNodes.find((node) => node.classList.contains("ad-ext-checkout-target-outline"));

  assert.ok(bullShape);
  assert.ok(bullOutline);
  assertApprox(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-stroke-width")),
    4
  );
  assertApprox(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.7
  );
  assertApprox(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")),
    0.76
  );
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.983");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.082");
  assert.match(
    bullShape.style.getPropertyValue("--ad-ext-target-filter"),
    /drop-shadow/
  );
  assertApprox(
    Number.parseFloat(bullOutline.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.7
  );
  assertApprox(
    Number.parseFloat(bullOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity")),
    0.62
  );
  assert.ok(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")) >
      Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity"))
  );
  assert.ok(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-outline-width")) >
      Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-outline-width"))
  );
  assert.ok(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-outline-width")) >
      Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-outline-width"))
  );
});

test("checkout-board-targets keeps outline clones isolated from target effect classes", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const visualConfig = resolveBoardTargetVisualConfig({
    visualPreset: "focus",
    singleRing: "both",
    colorTheme: "amber",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "SB", value: 25 }],
    visualConfig,
  });

  const overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  const bullNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='bull']`));
  const bullShape = bullNodes.find((node) => !node.classList.contains(OUTLINE_CLASS));
  const bullOutline = bullNodes.find((node) => node.classList.contains(OUTLINE_CLASS));

  assert.ok(bullShape);
  assert.ok(bullOutline);
  assert.equal(bullShape.classList.contains(TARGET_CLASS), true);
  assert.equal(bullShape.classList.contains(EFFECT_CLASSES.focus), true);
  assert.equal(bullOutline.classList.contains(OUTLINE_CLASS), true);
  assert.equal(bullOutline.classList.contains(TARGET_CLASS), false);
  assert.equal(bullOutline.classList.contains(EFFECT_CLASSES.focus), false);
  assertApprox(
    Number.parseFloat(bullOutline.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.7
  );
});

test("checkout-board-targets softens and staggers follow-up targets in multi-target routes", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const visualConfig = resolveBoardTargetVisualConfig({
    visualPreset: "focus",
    singleRing: "both",
    colorTheme: "violet",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [
      { ring: "T", value: 20 },
      { ring: "D", value: 10 },
      { ring: "SB", value: 25 },
    ],
    visualConfig,
  });

  const overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  const targetShapes = Array.from(overlay.querySelectorAll(`.${TARGET_CLASS}`));
  const primaryOuter = targetShapes.find(
    (node) =>
      node.dataset.targetRing === "T" &&
      node.dataset.targetValue === "20"
  );
  const secondaryOuter = targetShapes.find(
    (node) =>
      node.dataset.targetRing === "D" &&
      node.dataset.targetValue === "10"
  );
  const tertiaryBull = targetShapes.find(
    (node) =>
      node.dataset.targetRing === "SB" &&
      node.dataset.targetValue === "25"
  );

  assert.ok(primaryOuter);
  assert.ok(secondaryOuter);
  assert.ok(tertiaryBull);
  assert.equal(primaryOuter.style.getPropertyValue("--ad-ext-target-animation-delay"), "0ms");
  assert.equal(secondaryOuter.style.getPropertyValue("--ad-ext-target-animation-delay"), "120ms");
  assert.equal(tertiaryBull.style.getPropertyValue("--ad-ext-target-animation-delay"), "240ms");
  assert.ok(
    Number.parseFloat(secondaryOuter.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")) <
      Number.parseFloat(primaryOuter.style.getPropertyValue("--ad-ext-target-pulse-min-opacity"))
  );
  assert.ok(
    Number.parseFloat(secondaryOuter.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")) <
      Number.parseFloat(primaryOuter.style.getPropertyValue("--ad-ext-target-pulse-min-opacity"))
  );
  assert.ok(
    Number.parseFloat(tertiaryBull.style.getPropertyValue("--ad-ext-target-outline-width")) <
      Number.parseFloat(primaryOuter.style.getPropertyValue("--ad-ext-target-outline-width"))
  );
});

test("checkout-board-targets applies dedicated steady and signal profiles outside focus mode", () => {
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  group.appendChild(boardCircle);
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const steadyConfig = resolveBoardTargetVisualConfig({
    visualPreset: "steady",
    singleRing: "both",
    colorTheme: "amber",
  });
  const signalConfig = resolveBoardTargetVisualConfig({
    visualPreset: "signal",
    singleRing: "both",
    colorTheme: "cyan",
  });

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "SB", value: 25 }],
    visualConfig: steadyConfig,
  });

  let overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  let bullNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='bull']`));
  let bullShape = bullNodes.find((node) => !node.classList.contains(OUTLINE_CLASS));
  let bullOutline = bullNodes.find((node) => node.classList.contains(OUTLINE_CLASS));

  assert.ok(bullShape);
  assert.ok(bullOutline);
  assert.equal(bullShape.classList.contains(EFFECT_CLASSES.steady), true);
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-stroke-width"), "3px");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-outline-width"), "4.85px");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity"), "0.6799999999999999");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.998");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.022");
  assert.match(bullShape.style.getPropertyValue("--ad-ext-target-filter"), /drop-shadow/);
  assert.equal(bullOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity"), "0.48");

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "S", value: 20 }],
    visualConfig: signalConfig,
  });

  overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  let singleNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='single']`));
  let singleShape = singleNodes.find((node) => !node.classList.contains(OUTLINE_CLASS));
  let singleOutline = singleNodes.find((node) => node.classList.contains(OUTLINE_CLASS));

  assert.ok(singleShape);
  assert.ok(singleOutline);
  assert.equal(singleShape.classList.contains(EFFECT_CLASSES.signal), true);
  assertApprox(
    Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-stroke-width")),
    3.15
  );
  assertApprox(
    Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-outline-width")),
    5.3
  );
  assertApprox(
    Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")),
    0.16
  );
  assert.equal(singleShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.968");
  assert.equal(singleShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.088");
  assert.match(singleShape.style.getPropertyValue("--ad-ext-target-filter"), /drop-shadow/);
  assertApprox(
    Number.parseFloat(singleOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity")),
    0.22
  );

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "D", value: 18 }],
    visualConfig: signalConfig,
  });

  overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  const outerNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='outer']`));
  const outerShape = outerNodes.find((node) => !node.classList.contains(OUTLINE_CLASS));
  const outerOutline = outerNodes.find((node) => node.classList.contains(OUTLINE_CLASS));

  assert.ok(outerShape);
  assert.ok(outerOutline);
  assert.equal(outerShape.classList.contains(EFFECT_CLASSES.signal), true);
  assertApprox(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-stroke-width")),
    3.65
  );
  assertApprox(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.3
  );
  assertApprox(
    Number.parseFloat(outerShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")),
    0.24
  );
  assert.equal(outerShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.964");
  assert.equal(outerShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.11");
  assert.match(outerShape.style.getPropertyValue("--ad-ext-target-filter"), /drop-shadow/);
  assertApprox(
    Number.parseFloat(outerOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity")),
    0.26
  );

  renderCheckoutTargets({
    board: {
      svg,
      group,
      radius: 500,
    },
    checkoutTargets: [{ ring: "SB", value: 25 }],
    visualConfig: signalConfig,
  });

  overlay = group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
  assert.ok(overlay);

  bullNodes = Array.from(overlay.querySelectorAll(`[${TARGET_FAMILY_ATTRIBUTE}='bull']`));
  bullShape = bullNodes.find((node) => !node.classList.contains(OUTLINE_CLASS));
  bullOutline = bullNodes.find((node) => node.classList.contains(OUTLINE_CLASS));

  assert.ok(bullShape);
  assert.ok(bullOutline);
  assert.equal(bullShape.classList.contains(EFFECT_CLASSES.signal), true);
  assertApprox(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-stroke-width")),
    3.85
  );
  assertApprox(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-outline-width")),
    6.8
  );
  assertApprox(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")),
    0.3
  );
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-scale"), "0.958");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-max-scale"), "1.124");
  assert.equal(bullShape.style.getPropertyValue("--ad-ext-target-pulse-max-opacity"), "1");
  assert.match(bullShape.style.getPropertyValue("--ad-ext-target-filter"), /drop-shadow/);
  assertApprox(
    Number.parseFloat(bullOutline.style.getPropertyValue("--ad-ext-target-outline-pulse-min-opacity")),
    0.32
  );
  assert.ok(
    Number.parseFloat(bullShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity")) >
      Number.parseFloat(singleShape.style.getPropertyValue("--ad-ext-target-pulse-min-opacity"))
  );
});

test("checkout-board-targets style text animates scale and keeps signal close to the native board blink", () => {
  const css = buildStyleText();

  assert.match(
    css,
    new RegExp(
      String.raw`\.${EFFECT_CLASSES.signal}\s*\{[^}]*animation:\s*ad-ext-checkout-signal\s+var\(--ad-ext-target-duration\)\s+ease-in-out\s+infinite;`,
      "s"
    )
  );
  assert.equal(css.includes("steps(1, end)"), false);
  assert.match(
    css,
    /@keyframes ad-ext-checkout-focus\s*\{[\s\S]*transform:\s*scale\(var\(--ad-ext-target-pulse-max-scale,\s*1\)\);/s
  );
  assert.match(
    css,
    /@keyframes ad-ext-checkout-signal\s*\{[\s\S]*0%,\s*100%\s*\{[\s\S]*50%\s*\{/s
  );
  assert.match(
    css,
    new RegExp(
      String.raw`\.${TARGET_CLASS}\s*\{[^}]*will-change:\s*opacity,\s*filter,\s*transform;`,
      "s"
    )
  );
});

test("checkout-board-targets selects next, finish or all segments from the authoritative route", () => {
  function createBoardDocument() {
    const documentRef = new FakeDocument();
    documentRef.activeScoreElement.textContent = "96";
    documentRef.suggestionElement.textContent = "T20";
    documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
    const secondSuggestion = documentRef.createElement("div");
    secondSuggestion.classList.add("suggestion");
    secondSuggestion.textContent = "D18";
    secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
    documentRef.main.appendChild(secondSuggestion);
    appendBoardFixture(documentRef);
    return { documentRef };
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
    assert.equal(String(nextSelection.overlay.children[0]?.tagName || ""), "PATH");
    assert.equal(nextSelection.overlay.children[0]?.dataset?.targetRing, "T");
    assert.equal(nextSelection.overlay.children[0]?.dataset?.targetValue, "20");
  } finally {
    nextSelection.cleanup();
  }

  const finishSelection = mountWithMode("finish");
  try {
    assert.equal(finishSelection.overlay.children.length, 0);
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

test("checkout-board-targets finish mode falls back to the current one-dart checkout when a visible multi-step route is stale", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "36";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "25";
  secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
  documentRef.main.appendChild(secondSuggestion);
  const thirdSuggestion = documentRef.createElement("div");
  thirdSuggestion.classList.add("suggestion");
  thirdSuggestion.textContent = "D18";
  thirdSuggestion.__rect = { left: 720, top: 16, width: 180, height: 48 };
  documentRef.main.appendChild(thirdSuggestion);
  appendBoardFixture(documentRef);

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef: createFakeWindow({ documentRef }),
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      getActiveScore: () => 36,
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
          targetSelectionMode: "finish",
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
    assert.equal(overlay.children[0]?.dataset?.targetRing, "D");
    assert.equal(overlay.children[0]?.dataset?.targetValue, "18");
  } finally {
    cleanup();
  }
});

test("checkout-board-targets next mode overrides an implausible route-first step with the direct checkout", () => {
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
    assert.equal(logs[0][1]?.scoreSource, "game-state+dom");
    assert.equal(logs[0][1]?.scoreAgreement, "match");
    assert.equal(logs[0][1]?.selectionSource, "score-route");
    assert.deepEqual(logs[0][1]?.routeSegments, ["T20", "BULL"]);
    assert.deepEqual(logs[0][1]?.selectedSegments, ["BULL"]);
    assert.deepEqual(logs[0][1]?.targets, [{ ring: "DB", value: null }]);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets finish mode stays empty for a valid visible S10,D20 route at 50", () => {
  const documentRef = new FakeDocument();
  const events = [];
  documentRef.activeScoreElement.textContent = "50";
  documentRef.suggestionElement.textContent = "S10";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "D20";
  secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
  documentRef.main.appendChild(secondSuggestion);
  appendBoardFixture(documentRef);

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
          targetSelectionMode: "finish",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        events.push(args);
      },
      warn(...args) {
        events.push(args);
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
    assert.equal(events.length, 1);
    assert.equal(events[0][1]?.status, "no-selected-segments");
    assert.equal(events[0][1]?.selectionSource, "validated-visible-route");
    assert.deepEqual(events[0][1]?.routeSegments, ["S10", "D20"]);
    assert.deepEqual(events[0][1]?.selectedSegments, []);
    const overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    assert.equal(overlay.children.length, 0);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets next mode keeps the visible route-first target when the game state score lags behind the DOM", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "61";
  documentRef.suggestionElement.textContent = "25";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "D18";
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
      getActiveScore: () => 36,
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
          colorTheme: "amber",
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
    assert.equal(logs[0][1]?.activeScore, 61);
    assert.equal(logs[0][1]?.domScore, 61);
    assert.equal(logs[0][1]?.gameStateScore, 36);
    assert.equal(logs[0][1]?.scoreSource, "dom-preferred");
    assert.equal(logs[0][1]?.scoreAgreement, "mismatch");
    assert.equal(logs[0][1]?.selectionSource, "validated-visible-route");
    assert.deepEqual(logs[0][1]?.routeSegments, ["S25", "D18"]);
    assert.deepEqual(logs[0][1]?.selectedSegments, ["S25"]);
    assert.deepEqual(logs[0][1]?.targets, [{ ring: "SB", value: null }]);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets ignores a direct finish from a stale previous match snapshot", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "121";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  appendBoardFixture(documentRef);

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef: createFakeWindow({
      documentRef,
      href: "https://play.autodarts.io/matches/current-match",
    }),
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
    },
    gameState: {
      isX01Variant: () => true,
      getActiveScore: () => 16,
      getActiveThrows: () => [],
      getOutMode: () => "Double Out",
      getSnapshot: () => ({
        topic: "old-match.state",
        match: { id: "old-match" },
      }),
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
          colorTheme: "amber",
          outlineIntensity: "standard",
        };
      },
    },
    helpers: {
      createRafScheduler: createImmediateSchedulerFactory({ count: 0 }),
    },
  });

  try {
    const overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    const targetNode = Array.from(overlay.children).find((node) =>
      node.classList?.contains?.(TARGET_CLASS)
    );

    assert.ok(targetNode);
    assert.equal(targetNode.getAttribute("data-target-ring"), "T");
    assert.equal(targetNode.getAttribute("data-target-value"), "20");
  } finally {
    cleanup();
  }
});

test("checkout-board-targets next mode keeps the visible setup target when no finish route remains", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "102";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "S10";
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
      getActiveScore: () => 102,
      getOutMode: () => "Double Out",
      getActiveThrows: () => [{ segment: { name: "S19" } }],
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
          visualPreset: "steady",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
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
    assert.equal(logs[0][1]?.selectionSource, "visible-setup-segment");
    assert.deepEqual(logs[0][1]?.routeSegments, ["T20", "S10"]);
    assert.deepEqual(logs[0][1]?.selectedSegments, ["T20"]);
    assert.deepEqual(logs[0][1]?.targets, [{ ring: "T", value: 20 }]);
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
    assert.equal(logs[0][1]?.selectionSource, "score-route");
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

test("checkout-board-targets next mode renders direct double finishes when no suggestion route is visible", () => {
  const cases = [
    { activeScore: 10, segment: "D", value: "5" },
    { activeScore: 22, segment: "D", value: "11" },
  ];

  cases.forEach(({ activeScore, segment, value }) => {
    const documentRef = new FakeDocument();
    documentRef.activeScoreElement.textContent = String(activeScore);
    documentRef.suggestionElement.textContent = "";
    appendBoardFixture(documentRef);

    const cleanup = initializeCheckoutBoardTargets({
      documentRef,
      windowRef: createFakeWindow({ documentRef }),
      domGuards: createDomGuards({ documentRef }),
      registries: {
        observers: createObserverRegistry(),
      },
      gameState: {
        isX01Variant: () => true,
        getActiveScore: () => activeScore,
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
            visualPreset: "focus",
            segmentStyle: "surface-outline",
            targetSelectionMode: "next",
            colorTheme: "amber",
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
      assert.ok(overlay, `missing overlay for score ${activeScore}`);
      assert.equal(overlay.children.length >= 2, true, `missing target nodes for score ${activeScore}`);
      assert.equal(
        overlay.children[0]?.dataset.targetRing,
        segment,
        `unexpected ring for score ${activeScore}`
      );
      assert.equal(
        overlay.children[0]?.dataset.targetValue,
        value,
        `unexpected value for score ${activeScore}`
      );
    } finally {
      cleanup();
    }
  });
});

test("checkout-board-targets keeps the last drawable target during a transient no-route gap", async () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "181";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "D18";
  secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
  documentRef.main.appendChild(secondSuggestion);
  appendBoardFixture(documentRef);
  const windowRef = createFakeWindow({ documentRef });
  const observerRegistry = createObserverRegistry();
  const logs = [];
  const warnings = [];

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: observerRegistry,
    },
    gameState: {
      isX01Variant: () => true,
      getActiveScore: () => 181,
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
    const observer = observerRegistry.get("checkout-board-targets:dom-observer");
    assert.ok(observer);

    let overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    assert.equal(overlay.children.length, 2);

    documentRef.suggestionElement.textContent = "";
    secondSuggestion.textContent = "";
    observer.callback([
      {
        type: "characterData",
        target: documentRef.suggestionElement,
        addedNodes: [],
        removedNodes: [],
      },
      {
        type: "characterData",
        target: secondSuggestion,
        addedNodes: [],
        removedNodes: [],
      },
    ]);

    overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    assert.equal(overlay.children.length, 2);
    assert.equal(logs.at(-1)?.[1]?.status, "render-retained");
    assert.equal(logs.at(-1)?.[1]?.selectionSource, "retained-last-targets");
    assert.deepEqual(logs.at(-1)?.[1]?.routeSegments, []);
    assert.deepEqual(logs.at(-1)?.[1]?.selectedSegments, ["T20"]);
    assert.equal(warnings.length, 0);

    await wait(1700);

    overlay = documentRef.getElementById(CHECKOUT_OVERLAY_ID);
    assert.ok(overlay);
    assert.equal(overlay.children.length, 0);
    assert.equal(warnings.at(-1)?.[1]?.status, "no-route");
  } finally {
    cleanup();
  }
});

test("checkout-board-targets reapplies retained targets onto a replaced board during a transient no-route gap", () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "96";
  documentRef.suggestionElement.textContent = "T20";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const secondSuggestion = documentRef.createElement("div");
  secondSuggestion.classList.add("suggestion");
  secondSuggestion.textContent = "D18";
  secondSuggestion.__rect = { left: 520, top: 16, width: 180, height: 48 };
  documentRef.main.appendChild(secondSuggestion);
  const windowRef = createFakeWindow({ documentRef });
  const observerRegistry = createObserverRegistry();
  const firstBoard = appendBoardFixture(documentRef);

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: observerRegistry,
    },
    gameState: {
      isX01Variant: () => true,
      getActiveScore: () => 96,
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
    const observer = observerRegistry.get("checkout-board-targets:dom-observer");
    assert.ok(observer);
    assert.ok(firstBoard.group.querySelector(`#${CHECKOUT_OVERLAY_ID}`));

    documentRef.suggestionElement.textContent = "";
    secondSuggestion.textContent = "";
    const secondBoard = appendBoardFixture(documentRef);
    firstBoard.svg.remove();
    observer.callback([
      {
        type: "childList",
        target: documentRef.main,
        addedNodes: [secondBoard.svg],
        removedNodes: [firstBoard.svg],
      },
    ]);

    const replacementOverlay = secondBoard.group.querySelector(`#${CHECKOUT_OVERLAY_ID}`);
    assert.ok(replacementOverlay);
    assert.equal(replacementOverlay.children.length, 2);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets emits debug snapshots for render and no-route states", () => {
  const renderDocument = new FakeDocument();
  renderDocument.activeScoreElement.textContent = "40";
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
  noRouteDocument.activeScoreElement.textContent = "181";
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
  firstBoard.svg.remove();
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

test("checkout-board-targets reacts to throw-surface attribute mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.suggestionElement.textContent = "D20";
  appendBoardFixture(documentRef);
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
    const observer = observerRegistry.get("checkout-board-targets:dom-observer");
    assert.ok(observer);

    const observeOptions = observer.observeCalls[0]?.options || {};
    assert.equal(observeOptions.attributes, true);
    assert.equal(Array.isArray(observeOptions.attributeFilter), true);
    assert.equal(observeOptions.attributeFilter.includes("class"), true);

    assert.equal(scheduleCounter.count, 1);
    documentRef.throwRow.classList.add("is-updating");
    observer.callback([
      {
        type: "attributes",
        target: documentRef.throwRow,
        attributeName: "class",
        addedNodes: [],
        removedNodes: [],
      },
    ]);

    assert.equal(scheduleCounter.count, 2);
  } finally {
    cleanup();
  }
});

test("checkout-board-targets skips X01 context resolution while a cricket variant is active", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";
  appendBoardFixture(documentRef);
  const scheduleCounter = { count: 0 };

  const originalQuerySelectorAll = documentRef.querySelectorAll.bind(documentRef);
  documentRef.querySelectorAll = (selector) => {
    const normalizedSelector = String(selector || "");
    if (normalizedSelector.includes("ad-ext-player-score")) {
      throw new Error("inactive checkout-board-targets should not resolve X01 score nodes");
    }
    return originalQuerySelectorAll(selector);
  };

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    gameState: {
      isX01Variant: () => false,
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules,
      variantRules,
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
    assert.equal(Boolean(documentRef.querySelector(`#${CHECKOUT_OVERLAY_ID}`)), false);
  } finally {
    cleanup();
    documentRef.querySelectorAll = originalQuerySelectorAll;
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
      cell.dataset.playerIndex = String(index);
      cell.dataset.marks = label === "20" && index === 0 ? "3" : "0";
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

  initialOverlay.remove();

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
      cell.dataset.playerIndex = String(index);
      cell.dataset.marks = label === "20" && index === 0 ? "3" : "0";
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

test("triple-double-bull-hits reacts to throw-surface attribute mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
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
    helpers: {
      createRafScheduler: createImmediateSchedulerFactory(scheduleCounter),
    },
  });

  try {
    const observer = observers.get("triple-double-bull-hits:dom-observer");
    assert.ok(observer);

    const observeOptions = observer.observeCalls[0]?.options || {};
    assert.equal(observeOptions.attributes, true);
    assert.equal(Array.isArray(observeOptions.attributeFilter), true);
    assert.equal(observeOptions.attributeFilter.includes("class"), true);

    assert.equal(scheduleCounter.count, 1);
    documentRef.throwRow.classList.add("is-updating");
    observer.callback([
      {
        type: "attributes",
        target: documentRef.throwRow,
        attributeName: "class",
        addedNodes: [],
        removedNodes: [],
      },
    ]);

    assert.equal(scheduleCounter.count, 2);
  } finally {
    cleanup();
  }
});

test("triple-double-bull-hits only retains electric filter defs for explicit electric-arc runs", () => {
  const baseContext = () => {
    const documentRef = new FakeDocument();
    const windowRef = createFakeWindow({ documentRef });
    return {
      documentRef,
      windowRef,
      domGuards: createDomGuards({ documentRef }),
      registries: {
        observers: createObserverRegistry(),
        listeners: createListenerRegistry(),
      },
      gameState: {
        subscribe() {
          return () => {};
        },
      },
      helpers: {
        createRafScheduler: createCountingSchedulerFactory({ count: 0 }),
      },
    };
  };

  const impactContext = baseContext();
  const cleanupImpact = initializeTripleDoubleBullHits({
    ...impactContext,
    config: {
      getFeatureConfig() {
        return {
          colorTheme: "champagne-night",
          animationStyle: "impact-pop",
        };
      },
    },
  });

  assert.equal(Boolean(impactContext.documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID)), false);
  cleanupImpact();

  const electricContext = baseContext();
  const cleanupElectric = initializeTripleDoubleBullHits({
    ...electricContext,
    config: {
      getFeatureConfig() {
        return {
          colorTheme: "champagne-night",
          animationStyle: "electric-arc",
        };
      },
    },
  });

  assert.equal(Boolean(electricContext.documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID)), true);
  cleanupElectric();
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
      cell.dataset.playerIndex = String(index);
      const marks = label === "20" && index === 0 ? "3" : "0";
      cell.dataset.marks = marks;
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
    const shape = Array.from(overlay?.children || []).find((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shape?.dataset?.targetPresentation || "");
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
      cell.dataset.playerIndex = String(index);
      let marks = "0";
      if (label === "18") {
        marks = "3";
      }
      cell.dataset.marks = marks;
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
    const shape = Array.from(overlay?.children || []).find((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shape?.dataset?.targetPresentation || "");
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
  appendBoardFixture(documentRef);

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
        cell.dataset.playerIndex = String(playerIndex);
        const marks = label === "20" && playerIndex === 0 ? 3 : 0;
        cell.dataset.marks = String(marks);
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
  initialGrid.remove();
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
  appendBoardFixture(documentRef);

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
      cell.dataset.playerIndex = String(playerIndex);
      let marks = "0";
      if (label === "18") {
        marks = "3";
      }
      cell.dataset.marks = marks;
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
    const shape = Array.from(overlay?.children || []).find((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shape?.dataset?.targetPresentation || "");
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
