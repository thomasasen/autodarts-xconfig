import test from "node:test";
import assert from "node:assert/strict";

import { createXConfigEffectPreviewController } from "../../src/features/xconfig-ui/effect-preview-controller.js";
import { createTurnScoreCounterPreviewAdapter } from "../../src/features/xconfig-ui/turn-score-preview-adapter.js";
import { createAvgTrendArrowPreviewAdapter } from "../../src/features/xconfig-ui/avg-trend-preview-adapter.js";
import { createDartboardMarkerHighlightPreviewAdapter } from "../../src/features/xconfig-ui/dartboard-marker-highlight-preview-adapter.js";
import { AVG_TREND_PREVIEW_ATTRIBUTE } from "../../src/features/xconfig-ui/avg-trend-preview-contract.js";
import { DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE } from "../../src/features/xconfig-ui/dartboard-marker-highlight-preview-contract.js";
import { TURN_SCORE_PREVIEW_SCORE_CLASS } from "../../src/features/xconfig-ui/turn-score-preview-contract.js";
import {
  BASE_CLASS as DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS,
  EFFECT_CLASSES as DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES,
} from "../../src/features/dartboard-marker-highlight/style.js";
import { collectScoreNodes } from "../../src/features/turn-score-counter/logic.js";
import { FakeDocument, FakeEvent, createFakeWindow } from "./fake-dom.js";

function createPreviewOption(documentRef, attributes = {}) {
  const optionNode = documentRef.createElement("button");
  optionNode.className = "ad-xconfig-option-item ad-xconfig-option-item--effect-preview";
  Object.entries(attributes).forEach(([name, value]) => {
    optionNode.setAttribute(name, value);
  });
  const previewNode = documentRef.createElement("span");
  previewNode.setAttribute("data-adxconfig-turn-score-preview", "true");
  const scoreNode = documentRef.createElement("span");
  scoreNode.className = TURN_SCORE_PREVIEW_SCORE_CLASS;
  scoreNode.textContent = "501";
  scoreNode.setAttribute("data-adxconfig-turn-score-preview-score", "true");
  previewNode.appendChild(scoreNode);
  optionNode.appendChild(previewNode);
  return optionNode;
}

function createControllerHarness() {
  const documentRef = new FakeDocument();
  const panelHost = documentRef.createElement("section");
  panelHost.id = "ad-xconfig-panel-host";
  documentRef.body.appendChild(panelHost);
  return { documentRef, panelHost };
}

function createAvgTrendPreviewOption(documentRef, attributes = {}) {
  const optionNode = documentRef.createElement("button");
  optionNode.className = "ad-xconfig-option-item ad-xconfig-option-item--effect-preview";
  Object.entries(attributes).forEach(([name, value]) => {
    optionNode.setAttribute(name, value);
  });
  const previewNode = documentRef.createElement("span");
  previewNode.setAttribute("data-adxconfig-avg-trend-preview-host", "true");
  const arrowNode = documentRef.createElement("span");
  arrowNode.className = "ad-ext-avg-trend-arrow ad-ext-avg-trend-visible ad-ext-avg-trend-up";
  arrowNode.setAttribute(AVG_TREND_PREVIEW_ATTRIBUTE, "true");
  previewNode.appendChild(arrowNode);
  optionNode.appendChild(previewNode);
  return { optionNode, arrowNode };
}

function createDartboardMarkerHighlightPreviewOption(documentRef, attributes = {}) {
  const optionNode = documentRef.createElement("button");
  optionNode.className = "ad-xconfig-option-item ad-xconfig-option-item--effect-preview";
  Object.entries(attributes).forEach(([name, value]) => {
    optionNode.setAttribute(name, value);
  });
  const marker = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute(DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE, "true");
  optionNode.appendChild(marker);
  return { optionNode, marker };
}

test("xConfig effect preview controller keeps only one adapter run active", () => {
  const { documentRef, panelHost } = createControllerHarness();
  const firstOption = createPreviewOption(documentRef, {
    "data-preview-effect": "demo-first",
    "data-feature-key": "feature-a",
  });
  const secondOption = createPreviewOption(documentRef, {
    "data-preview-effect": "demo-second",
    "data-feature-key": "feature-a",
  });
  panelHost.appendChild(firstOption);
  panelHost.appendChild(secondOption);

  const starts = [];
  const cleanups = [];
  const controller = createXConfigEffectPreviewController({
    panelHostId: "ad-xconfig-panel-host",
    getFeatures: () => [{ featureKey: "feature-a", config: {} }],
    adapters: [
      {
        prefix: "demo-",
        start(context) {
          starts.push(context.previewEffect);
          return () => cleanups.push(context.previewEffect);
        },
      },
    ],
  });

  controller.handlePreviewStartEvent(new FakeEvent("pointerover", { target: firstOption }));
  controller.handlePreviewStartEvent(new FakeEvent("pointerover", { target: secondOption }));

  assert.deepEqual(starts, ["demo-first", "demo-second"]);
  assert.deepEqual(cleanups, ["demo-first"]);

  controller.handlePreviewEndEvent(new FakeEvent("pointerout", { target: secondOption }));
  assert.deepEqual(cleanups, ["demo-first", "demo-second"]);
});

test("xConfig effect preview controller does not restart the same option", () => {
  const { documentRef, panelHost } = createControllerHarness();
  const optionNode = createPreviewOption(documentRef, {
    "data-preview-effect": "demo-first",
    "data-feature-key": "feature-a",
  });
  panelHost.appendChild(optionNode);

  const starts = [];
  const cleanups = [];
  const controller = createXConfigEffectPreviewController({
    panelHostId: "ad-xconfig-panel-host",
    getFeatures: () => [{ featureKey: "feature-a", config: {} }],
    adapters: [
      {
        prefix: "demo-",
        start(context) {
          starts.push(context.previewEffect);
          return () => cleanups.push(context.previewEffect);
        },
      },
    ],
  });

  controller.handlePreviewStartEvent(new FakeEvent("pointerover", { target: optionNode }));
  controller.handlePreviewStartEvent(new FakeEvent("focusin", { target: optionNode }));

  assert.deepEqual(starts, ["demo-first"]);
  assert.deepEqual(cleanups, []);

  controller.handlePreviewEndEvent(new FakeEvent("focusout", { target: optionNode }));
  assert.deepEqual(cleanups, ["demo-first"]);
});

test("turn points preview adapter gates odometer until the real plugin is loaded", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const optionNode = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-score-counter-odometer",
    "data-feature-key": "turn-score-counter",
    "data-setting-key": "countEffect",
    "data-setting-value": "odometer",
  });
  documentRef.body.appendChild(optionNode);
  let resolveOdometer = null;
  const odometerPromise = new Promise((resolve) => {
    resolveOdometer = resolve;
  });
  const adapter = createTurnScoreCounterPreviewAdapter({
    windowRef,
    getOdometer: () => null,
    ensureOdometerLoaded: () => odometerPromise,
    animateScore: () => {
      throw new Error("odometer preview must wait for odometer");
    },
    stopAnimation: () => {},
  });

  const cleanup = adapter.start({
    optionNode,
    feature: { featureKey: "turn-score-counter", config: {} },
    settingKey: "countEffect",
    settingValue: "odometer",
  });

  assert.equal(
    optionNode.querySelector("[data-adxconfig-turn-score-preview-score='true']").textContent,
    "501"
  );

  cleanup();
  resolveOdometer(function OdometerStub() {});
  await Promise.resolve();
  assert.equal(Boolean(optionNode.querySelector(".odometer-numbers")), false);
});

test("turn points preview adapter uses the odometer renderer directly", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const optionNode = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-score-counter-odometer",
    "data-feature-key": "turn-score-counter",
    "data-setting-key": "countEffect",
    "data-setting-value": "odometer",
  });
  documentRef.body.appendChild(optionNode);

  let renderedNode = null;
  class OdometerStub {
    render(node) {
      renderedNode = node;
      if (!node.querySelector(".odometer-numbers")) {
        const odometerRoot = documentRef.createElement("div");
        odometerRoot.className = "odometer-numbers";
        node.textContent = "";
        node.appendChild(odometerRoot);
      }
    }
  }

  const adapter = createTurnScoreCounterPreviewAdapter({
    windowRef,
    getOdometer: () => OdometerStub,
    ensureOdometerLoaded: () => Promise.resolve(OdometerStub),
    animateScore: () => {
      throw new Error("odometer preview should not use CountUp fallback");
    },
    stopAnimation: (node, state) => {
      const handle = state.activeRafByNode.get(node);
      if (handle) {
        windowRef.cancelAnimationFrame(handle);
      }
      state.activeRafByNode.delete(node);
    },
  });

  const cleanup = adapter.start({
    optionNode,
    feature: { featureKey: "turn-score-counter", config: {} },
    settingKey: "countEffect",
    settingValue: "odometer",
  });

  assert.notEqual(renderedNode, null);
  assert.equal(Boolean(optionNode.querySelector(".odometer-numbers")), true);

  cleanup();
  const currentScoreNode = optionNode.querySelector("[data-adxconfig-turn-score-preview-score='true']");
  assert.notEqual(currentScoreNode, renderedNode);
  assert.equal(currentScoreNode.textContent, "501");
  assert.equal(Boolean(optionNode.querySelector(".odometer-numbers")), false);

  renderedNode.textContent = "54098102";
  assert.equal(currentScoreNode.textContent, "501");
});

test("turn points preview score nodes are isolated from runtime score collection", () => {
  const documentRef = new FakeDocument();
  const optionNode = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-score-counter-odometer",
  });
  documentRef.body.appendChild(optionNode);

  const runtimeScore = documentRef.createElement("span");
  runtimeScore.className = "ad-ext-turn-points";
  runtimeScore.textContent = "501";
  documentRef.body.appendChild(runtimeScore);

  const previewScore = optionNode.querySelector("[data-adxconfig-turn-score-preview-score='true']");
  const collectedScoreNodes = collectScoreNodes(documentRef);
  assert.equal(previewScore.classList.contains("ad-ext-turn-points"), false);
  assert.equal(collectedScoreNodes.includes(previewScore), false);
  assert.equal(collectedScoreNodes.includes(runtimeScore), true);
});

test("turn points preview adapter separates count previews from flash previews", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = [];
  windowRef.setTimeout = (callback, delayMs) => {
    const handle = { callback, delayMs };
    timers.push(handle);
    return handle;
  };
  windowRef.clearTimeout = (handle) => {
    const index = timers.indexOf(handle);
    if (index >= 0) {
      timers.splice(index, 1);
    }
  };
  const animateCalls = [];
  const adapter = createTurnScoreCounterPreviewAdapter({
    windowRef,
    animateScore: (_node, options) => animateCalls.push(options),
    stopAnimation: () => {},
  });

  const countOption = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-score-counter-countup",
    "data-setting-key": "countEffect",
    "data-setting-value": "countup",
  });
  const flashOption = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-score-counter-flash-permanent",
    "data-setting-key": "flashMode",
    "data-setting-value": "permanent",
  });
  documentRef.body.appendChild(countOption);
  documentRef.body.appendChild(flashOption);

  adapter.start({
    optionNode: countOption,
    feature: { featureKey: "turn-score-counter", config: {} },
    settingKey: "countEffect",
    settingValue: "countup",
  });
  assert.equal(animateCalls.length, 1);
  assert.equal(animateCalls[0].fromValue, 501);
  assert.equal(animateCalls[0].toValue, 441);
  assert.equal(animateCalls[0].flashEnabled, false);

  adapter.start({
    optionNode: flashOption,
    feature: { featureKey: "turn-score-counter", config: {} },
    settingKey: "flashMode",
    settingValue: "permanent",
  });
  assert.equal(timers.length, 3);
  timers[0].callback();
  assert.equal(animateCalls.at(-1).flashEnabled, true);
  assert.equal(animateCalls.at(-1).flashMode, "permanent");
});

test("average trend arrow preview adapter animates and resets the real arrow node", () => {
  const documentRef = new FakeDocument();
  const { optionNode, arrowNode } = createAvgTrendPreviewOption(documentRef, {
    "data-preview-effect": "avg-trend-arrow-duration-500",
    "data-feature-key": "avg-trend-arrow",
    "data-setting-key": "durationMs",
    "data-setting-value": "500",
  });
  documentRef.body.appendChild(optionNode);

  const adapter = createAvgTrendArrowPreviewAdapter();
  const cleanup = adapter.start({
    optionNode,
    feature: { featureKey: "avg-trend-arrow", config: { durationMs: 320 } },
    settingKey: "durationMs",
    settingValue: "500",
  });

  assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-animate"), true);
  assert.equal(
    arrowNode.style.getPropertyValue("--ad-xconfig-avg-trend-preview-duration"),
    "500ms"
  );

  cleanup();
  assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-animate"), false);
  assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-visible"), true);
  assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-up"), true);
  assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-down"), false);
});

test("dart marker emphasis preview adapter applies and idles with the runtime marker contract", () => {
  const documentRef = new FakeDocument();
  const { optionNode, marker } = createDartboardMarkerHighlightPreviewOption(documentRef, {
    "data-preview-effect": "dartboard-marker-highlight-effect-glow",
    "data-feature-key": "dartboard-marker-highlight",
    "data-setting-key": "effect",
    "data-setting-value": "glow",
  });
  documentRef.body.appendChild(optionNode);

  const adapter = createDartboardMarkerHighlightPreviewAdapter();
  const cleanup = adapter.start({
    optionNode,
    feature: {
      featureKey: "dartboard-marker-highlight",
      config: {
        size: 9,
        color: "rgb(34, 197, 94)",
        effect: "size-pulse",
        opacityPercent: 65,
        outline: "schwarz",
      },
    },
    settingKey: "effect",
    settingValue: "soft-glow",
  });

  assert.equal(marker.getAttribute("r"), "9");
  assert.equal(marker.style.fill, "rgb(34, 197, 94)");
  assert.equal(marker.style.opacity, "0.65");
  assert.equal(marker.style.stroke, "rgb(0, 0, 0)");
  assert.equal(marker.style.strokeWidth, "1.5");
  assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS), true);
  assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["soft-glow"]), true);
  assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), false);

  cleanup();
  assert.equal(marker.getAttribute("r"), "9");
  assert.equal(marker.style.opacity, "0.65");
  assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS), true);
  assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["soft-glow"]), false);
  assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), false);
});

test("dart marker emphasis preview adapter maps size and visibility options", () => {
  const documentRef = new FakeDocument();
  const sizeOption = createDartboardMarkerHighlightPreviewOption(documentRef, {
    "data-preview-effect": "dartboard-marker-highlight-size-4",
    "data-setting-key": "size",
    "data-setting-value": "4",
  });
  const opacityOption = createDartboardMarkerHighlightPreviewOption(documentRef, {
    "data-preview-effect": "dartboard-marker-highlight-opacityPercent-100",
    "data-setting-key": "opacityPercent",
    "data-setting-value": "100",
  });
  documentRef.body.appendChild(sizeOption.optionNode);
  documentRef.body.appendChild(opacityOption.optionNode);

  const adapter = createDartboardMarkerHighlightPreviewAdapter();
  const feature = {
    featureKey: "dartboard-marker-highlight",
    config: {
      size: 6,
      color: "rgb(49, 130, 206)",
      effect: "size-pulse",
      opacityPercent: 85,
      outline: "weiss",
    },
  };
  const cleanupSize = adapter.start({
    optionNode: sizeOption.optionNode,
    feature,
    settingKey: "size",
    settingValue: "4",
  });
  assert.equal(sizeOption.marker.getAttribute("r"), "4");
  assert.equal(sizeOption.marker.style.opacity, "0.85");
  assert.equal(sizeOption.marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), true);
  cleanupSize();
  assert.equal(sizeOption.marker.getAttribute("r"), "4");
  assert.equal(sizeOption.marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), false);

  const cleanupOpacity = adapter.start({
    optionNode: opacityOption.optionNode,
    feature,
    settingKey: "opacityPercent",
    settingValue: "100",
  });
  assert.equal(opacityOption.marker.getAttribute("r"), "6");
  assert.equal(opacityOption.marker.style.opacity, "1");
  assert.equal(opacityOption.marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), true);
  cleanupOpacity();
  assert.equal(opacityOption.marker.style.opacity, "1");
  assert.equal(opacityOption.marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), false);
});
