import test from "node:test";
import assert from "node:assert/strict";

import { createXConfigEffectPreviewController } from "../../src/features/xconfig-ui/effect-preview-controller.js";
import { createTurnPointsCountPreviewAdapter } from "../../src/features/xconfig-ui/turn-points-preview-adapter.js";
import { TURN_POINTS_PREVIEW_SCORE_CLASS } from "../../src/features/xconfig-ui/turn-points-preview-contract.js";
import { collectScoreNodes } from "../../src/features/turn-points-count/logic.js";
import { FakeDocument, FakeEvent, createFakeWindow } from "./fake-dom.js";

function createPreviewOption(documentRef, attributes = {}) {
  const optionNode = documentRef.createElement("button");
  optionNode.className = "ad-xconfig-option-item ad-xconfig-option-item--effect-preview";
  Object.entries(attributes).forEach(([name, value]) => {
    optionNode.setAttribute(name, value);
  });
  const previewNode = documentRef.createElement("span");
  previewNode.setAttribute("data-adxconfig-turn-points-preview", "true");
  const scoreNode = documentRef.createElement("span");
  scoreNode.className = TURN_POINTS_PREVIEW_SCORE_CLASS;
  scoreNode.textContent = "501";
  scoreNode.setAttribute("data-adxconfig-turn-points-preview-score", "true");
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
    "data-preview-effect": "turn-points-count-odometer",
    "data-feature-key": "turn-points-count",
    "data-setting-key": "countEffect",
    "data-setting-value": "odometer",
  });
  documentRef.body.appendChild(optionNode);
  let resolveOdometer = null;
  const odometerPromise = new Promise((resolve) => {
    resolveOdometer = resolve;
  });
  const adapter = createTurnPointsCountPreviewAdapter({
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
    feature: { featureKey: "turn-points-count", config: {} },
    settingKey: "countEffect",
    settingValue: "odometer",
  });

  assert.equal(
    optionNode.querySelector("[data-adxconfig-turn-points-preview-score='true']").textContent,
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
    "data-preview-effect": "turn-points-count-odometer",
    "data-feature-key": "turn-points-count",
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

  const adapter = createTurnPointsCountPreviewAdapter({
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
    feature: { featureKey: "turn-points-count", config: {} },
    settingKey: "countEffect",
    settingValue: "odometer",
  });

  assert.notEqual(renderedNode, null);
  assert.equal(Boolean(optionNode.querySelector(".odometer-numbers")), true);

  cleanup();
  const currentScoreNode = optionNode.querySelector("[data-adxconfig-turn-points-preview-score='true']");
  assert.notEqual(currentScoreNode, renderedNode);
  assert.equal(currentScoreNode.textContent, "501");
  assert.equal(Boolean(optionNode.querySelector(".odometer-numbers")), false);

  renderedNode.textContent = "54098102";
  assert.equal(currentScoreNode.textContent, "501");
});

test("turn points preview score nodes are isolated from runtime score collection", () => {
  const documentRef = new FakeDocument();
  const optionNode = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-points-count-odometer",
  });
  documentRef.body.appendChild(optionNode);

  const runtimeScore = documentRef.createElement("span");
  runtimeScore.className = "ad-ext-turn-points";
  runtimeScore.textContent = "501";
  documentRef.body.appendChild(runtimeScore);

  const previewScore = optionNode.querySelector("[data-adxconfig-turn-points-preview-score='true']");
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
  const adapter = createTurnPointsCountPreviewAdapter({
    windowRef,
    animateScore: (_node, options) => animateCalls.push(options),
    stopAnimation: () => {},
  });

  const countOption = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-points-count-countup",
    "data-setting-key": "countEffect",
    "data-setting-value": "countup",
  });
  const flashOption = createPreviewOption(documentRef, {
    "data-preview-effect": "turn-points-count-flash-permanent",
    "data-setting-key": "flashMode",
    "data-setting-value": "permanent",
  });
  documentRef.body.appendChild(countOption);
  documentRef.body.appendChild(flashOption);

  adapter.start({
    optionNode: countOption,
    feature: { featureKey: "turn-points-count", config: {} },
    settingKey: "countEffect",
    settingValue: "countup",
  });
  assert.equal(animateCalls.length, 1);
  assert.equal(animateCalls[0].fromValue, 501);
  assert.equal(animateCalls[0].toValue, 441);
  assert.equal(animateCalls[0].flashEnabled, false);

  adapter.start({
    optionNode: flashOption,
    feature: { featureKey: "turn-points-count", config: {} },
    settingKey: "flashMode",
    settingValue: "permanent",
  });
  assert.equal(timers.length, 3);
  timers[0].callback();
  assert.equal(animateCalls.at(-1).flashEnabled, true);
  assert.equal(animateCalls.at(-1).flashMode, "permanent");
});
