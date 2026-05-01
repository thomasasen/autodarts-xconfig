import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import {
  getActiveBoardInputMode,
  isCoordinateBoardInputModeActive,
  isLiveBoardInputModeActive,
} from "../../src/shared/board-input-mode.js";
import {
  clearDartMarkerDartsState,
  createDartMarkerDartsState,
  updateDartMarkerDarts,
} from "../../src/features/dart-marker-darts/logic.js";
import { initializeDartMarkerDarts } from "../../src/features/dart-marker-darts/index.js";
import {
  DART_CLASS,
  DART_CONTAINER_CLASS,
  DART_ROTATE_CLASS,
  DART_SHADOW_CLASS,
  OVERLAY_ID,
  resolveDartMarkerDartsConfig,
} from "../../src/features/dart-marker-darts/style.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const VISUAL_CONFIG = Object.freeze({
  designKey: "autodarts",
  animateDarts: false,
  sizePercent: 100,
  sizeMultiplier: 1,
  hideOriginalMarkers: false,
  enableShadow: true,
  enableShadowBlur: true,
  enableWobble: true,
  enableFlightBlur: true,
  flightSpeed: "standard",
  flightDurationMs: 320,
});

const ANIMATED_VISUAL_CONFIG = Object.freeze({
  ...VISUAL_CONFIG,
  animateDarts: true,
});

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("dart-marker-darts resolves size settings twenty percent larger with legacy migration", () => {
  assert.equal(resolveDartMarkerDartsConfig({ sizePercent: 108 }).sizeMultiplier, 1.08);
  assert.equal(resolveDartMarkerDartsConfig({ sizePercent: 120 }).sizeMultiplier, 1.2);
  assert.equal(resolveDartMarkerDartsConfig({ sizePercent: 138 }).sizeMultiplier, 1.38);
  assert.equal(resolveDartMarkerDartsConfig({ sizePercent: 100 }).sizePercent, 120);
  assert.equal(resolveDartMarkerDartsConfig({ sizePercent: 115 }).sizePercent, 138);
  assert.equal(resolveDartMarkerDartsConfig({ sizePercent: 999 }).sizePercent, 120);
});

async function waitForCondition(predicate, options = {}) {
  const timeoutMs = Math.max(0, Number(options.timeoutMs) || 100);
  const intervalMs = Math.max(1, Number(options.intervalMs) || 5);
  const startTime = Date.now();

  while (Date.now() - startTime <= timeoutMs) {
    if (predicate()) {
      return true;
    }
    await wait(intervalMs);
  }

  return Boolean(predicate());
}

function approxEqual(actual, expected, epsilon = 0.01) {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= epsilon, `${actual} ~= ${expected}`);
}

function createSvgPointFactory() {
  return {
    x: 0,
    y: 0,
    matrixTransform(matrix = {}) {
      const a = Number(matrix.a ?? 1);
      const b = Number(matrix.b ?? 0);
      const c = Number(matrix.c ?? 0);
      const d = Number(matrix.d ?? 1);
      const e = Number(matrix.e ?? 0);
      const f = Number(matrix.f ?? 0);
      return {
        x: this.x * a + this.y * c + e,
        y: this.x * b + this.y * d + f,
      };
    },
  };
}

function createMarker(documentRef, parentNode, spec = {}) {
  const marker = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", String(spec.cx ?? 0));
  marker.setAttribute("cy", String(spec.cy ?? 0));
  marker.setAttribute("r", String(spec.r ?? 5));
  marker.setAttribute("filter", "url(#shadow-2dp)");
  marker.setAttribute("data-hit", "1");
  marker.__rect = {
    width: Number(spec.rectWidth ?? 0),
    height: Number(spec.rectHeight ?? 0),
    left: Number(spec.rectLeft ?? 0),
    top: Number(spec.rectTop ?? 0),
  };
  marker.getScreenCTM = () =>
    (typeof spec.getMatrix === "function" ? spec.getMatrix() : spec.matrix || null);
  parentNode.appendChild(marker);
  return marker;
}

function installBoardFixture(documentRef, markerSpecs = [], options = {}) {
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.__rect = options.svgRect || { left: 100, top: 50, width: 600, height: 600 };
  svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
  svg.createSVGPoint = () => createSvgPointFactory();

  const boardGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  boardGroup.__rect = options.groupRect || svg.__rect;
  const outerCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerCircle.setAttribute("cx", "0");
  outerCircle.setAttribute("cy", "0");
  outerCircle.setAttribute("r", "450");
  boardGroup.appendChild(outerCircle);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardGroup.appendChild(labelNode);
  }
  svg.appendChild(boardGroup);

  const markers = markerSpecs.map((spec) => createMarker(documentRef, boardGroup, spec));
  const viewportNode = options.viewportClasses
    ? documentRef.createElement("div")
    : null;
  if (viewportNode) {
    options.viewportClasses.forEach((className) => viewportNode.classList.add(className));
    if (options.viewportRect) {
      viewportNode.__rect = options.viewportRect;
    }
    viewportNode.appendChild(svg);
    documentRef.main.appendChild(viewportNode);
  } else {
    documentRef.main.appendChild(svg);
  }

  return {
    svg,
    boardGroup,
    markers,
    viewportNode,
  };
}

function getDartImages(documentRef) {
  return Array.from(documentRef.querySelectorAll(`image.${DART_CLASS}`));
}

function getShadowImages(documentRef) {
  return Array.from(documentRef.querySelectorAll(`image.${DART_SHADOW_CLASS}`));
}

function getFlightGroups(documentRef) {
  return Array.from(documentRef.querySelectorAll(`g.${DART_CONTAINER_CLASS}`));
}

function getRotateGroups(documentRef) {
  return Array.from(documentRef.querySelectorAll(`g.${DART_ROTATE_CLASS}`));
}

function createSingleFeatureRuntimeConfig() {
  return {
    featureToggles: {
      dartMarkerDarts: true,
    },
    features: {
      dartMarkerDarts: {
        enabled: true,
        design: "autodarts",
        animateDarts: true,
        sizePercent: 100,
        hideOriginalMarkers: false,
        enableShadowBlur: true,
        enableFlightBlur: true,
        flightSpeed: "standard",
      },
    },
  };
}

function setModeButtonActive(button, contract = "aria-pressed", isActive = false) {
  [
    "aria-pressed",
    "aria-selected",
    "aria-checked",
    "data-active",
    "data-selected",
    "data-checked",
    "data-pressed",
    "data-state",
  ].forEach((attributeName) => button.removeAttribute(attributeName));

  if (!isActive) {
    return button;
  }

  if (contract === "data-state") {
    button.setAttribute("data-state", "checked");
    return button;
  }

  if (contract === "data-active-empty") {
    button.setAttribute("data-active", "");
    return button;
  }

  button.setAttribute(contract, "true");
  return button;
}

function installKeyboardModeToggle(documentRef, activeMode = "segments", contract = "aria-pressed") {
  const group = documentRef.createElement("div");
  group.setAttribute("role", contract === "aria-selected" ? "tablist" : "radiogroup");

  const labelsByMode = {
    segments: "Segmentmodus",
    coords: "Koordinatenmodus",
    live: "Live-Modus",
  };

  const buttonsByMode = {};
  Object.entries(labelsByMode).forEach(([modeKey, label]) => {
    const button = documentRef.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-label", label);
    setModeButtonActive(button, contract, modeKey === activeMode);
    group.appendChild(button);
    buttonsByMode[modeKey] = button;
  });

  documentRef.main.appendChild(group);
  return buttonsByMode;
}

test("dart-marker-darts keeps separate darts for markers with identical cx/cy/r", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [
    {
      cx: 20,
      cy: -40,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
    {
      cx: 20,
      cy: -40,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 440, f: 350 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  assert.equal(state.entriesByMarker.size, 2);
  assert.equal(getFlightGroups(documentRef).length, 2);
  assert.equal(getDartImages(documentRef).length, 2);

  clearDartMarkerDartsState(state);
});

test("coordinate input mode detection recognizes multiple active-state contracts", () => {
  const documentRef = new FakeDocument();
  const buttons = installKeyboardModeToggle(documentRef, "coords", "aria-pressed");

  assert.equal(getActiveBoardInputMode(documentRef), "coords");
  assert.equal(isCoordinateBoardInputModeActive(documentRef), true);
  assert.equal(isLiveBoardInputModeActive(documentRef), false);

  setModeButtonActive(buttons.coords, "aria-pressed", false);
  setModeButtonActive(buttons.live, "aria-selected", true);
  assert.equal(getActiveBoardInputMode(documentRef), "live");
  assert.equal(isLiveBoardInputModeActive(documentRef), true);

  setModeButtonActive(buttons.live, "aria-selected", false);
  setModeButtonActive(buttons.segments, "data-state", true);
  assert.equal(getActiveBoardInputMode(documentRef), "segments");
  assert.equal(isLiveBoardInputModeActive(documentRef), false);

  setModeButtonActive(buttons.segments, "data-state", false);
  setModeButtonActive(buttons.coords, "data-active-empty", true);
  assert.equal(getActiveBoardInputMode(documentRef), "coords");
  assert.equal(isCoordinateBoardInputModeActive(documentRef), true);
  assert.equal(isLiveBoardInputModeActive(documentRef), false);
});

test("dart-marker-darts separates flight container, rotation group, and image node", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 360, f: 280 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);
  assert.equal(entry.container.parentNode?.id, "ad-ext-dart-image-overlay-scene");
  assert.equal(entry.rotateGroup.parentNode, entry.container);
  assert.equal(entry.imageNode.parentNode, entry.rotateGroup);
  assert.equal(entry.shadowNode.parentNode, entry.rotateGroup);
  assert.equal(getFlightGroups(documentRef).length, 1);
  assert.equal(getRotateGroups(documentRef).length, 1);
  assert.equal(getShadowImages(documentRef).length, 1);
  assert.match(String(entry.rotateGroup.getAttribute("transform") || ""), /^rotate\(/);
  assert.equal(entry.imageNode.getAttribute("transform"), null);
  assert.equal(entry.container.__animations.length, 1);
  assert.equal(entry.imageNode.__animations.length, 1);
  assert.equal(entry.shadowNode.__animations.length, 1);

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts supports configurable shadow, shadow blur, wobble, and flight blur effects", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 360, f: 280 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...ANIMATED_VISUAL_CONFIG,
      enableShadowBlur: false,
      enableWobble: false,
      enableFlightBlur: false,
    },
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);
  assert.notEqual(entry.shadowNode.style.display, "none");
  assert.equal(Boolean(documentRef.querySelector("feGaussianBlur")), false);
  assert.equal(entry.shadowNode.__animations.length, 1);
  assert.equal(entry.imageNode.__animations.length, 0);
  assert.equal(
    Object.hasOwn(entry.container.__animations[0]?.keyframes?.[0] || {}, "filter"),
    false
  );

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts reuses entry geometry when board and marker layout are unchanged", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 360, f: 280 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);

  const mutationCounter = { image: 0, shadow: 0, rotate: 0 };
  const originalImageSetAttribute = entry.imageNode.setAttribute.bind(entry.imageNode);
  const originalShadowSetAttribute = entry.shadowNode.setAttribute.bind(entry.shadowNode);
  const originalRotateSetAttribute = entry.rotateGroup.setAttribute.bind(entry.rotateGroup);

  entry.imageNode.setAttribute = (...args) => {
    mutationCounter.image += 1;
    return originalImageSetAttribute(...args);
  };
  entry.shadowNode.setAttribute = (...args) => {
    mutationCounter.shadow += 1;
    return originalShadowSetAttribute(...args);
  };
  entry.rotateGroup.setAttribute = (...args) => {
    mutationCounter.rotate += 1;
    return originalRotateSetAttribute(...args);
  };

  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    updateMode: {
      requiresBoardRescan: false,
      requiresMarkerRescan: false,
    },
  });

  assert.deepEqual(mutationCounter, { image: 0, shadow: 0, rotate: 0 });

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts positions darts in screen space from the computed overlay layout and SVG matrix fallback", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const overlay = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.id = OVERLAY_ID;
  overlay.getBoundingClientRect = () => ({
    left: 12,
    top: 34,
    width: 980,
    height: 980,
    right: 992,
    bottom: 1014,
  });
  documentRef.body.appendChild(overlay);

  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      getMatrix: () => ({ a: 2, b: 0, c: 0, d: 2, e: 300, f: 200 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);
  approxEqual(entry.center.x, 407.2);
  approxEqual(entry.center.y, 377.2);
  assert.ok(Number.isFinite(Number.parseFloat(entry.imageNode.getAttribute("x"))));
  assert.ok(Number.isFinite(Number.parseFloat(entry.imageNode.getAttribute("y"))));

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts clips overlay to board viewport boundaries", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(
    documentRef,
    [
      {
        cx: 10,
        cy: 20,
        r: 5,
        getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 540, f: 320 }),
      },
    ],
    {
      svgRect: { left: 250, top: 60, width: 500, height: 500 },
      viewportClasses: ["ad-ext-theme-board-viewport", "ad-ext-tv-board-zoom-host"],
      viewportRect: { left: 280, top: 90, width: 420, height: 420 },
    }
  );

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const overlay = documentRef.getElementById(OVERLAY_ID);
  const clipPath = String(overlay?.style?.clipPath || "");
  assert.match(
    clipPath,
    /^inset\(([\d.]+)px ([\d.]+)px ([\d.]+)px ([\d.]+)px\)$/
  );

  const values = clipPath
    .replace(/^inset\(/, "")
    .replace(/\)$/, "")
    .split(" ")
    .map((token) => Number.parseFloat(token.replace("px", "")));
  assert.equal(values.length, 4);
  values.forEach((value) => assert.ok(value > 0));
  assert.equal(overlay.style.webkitClipPath, clipPath);

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts clears stale overlay clipping when viewport host is not available", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { viewportNode } = installBoardFixture(
    documentRef,
    [
      {
        cx: 10,
        cy: 20,
        r: 5,
        getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 540, f: 320 }),
      },
    ],
    {
      svgRect: { left: 250, top: 60, width: 500, height: 500 },
      viewportClasses: ["ad-ext-theme-board-viewport"],
      viewportRect: { left: 280, top: 90, width: 420, height: 420 },
    }
  );

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.match(String(overlay?.style?.clipPath || ""), /^inset\(/);

  viewportNode?.classList?.remove?.("ad-ext-theme-board-viewport");
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  assert.equal(String(overlay?.style?.clipPath || ""), "");
  assert.equal(String(overlay?.style?.webkitClipPath || ""), "");

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts schedules retry when marker position is unresolved", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      getMatrix: () => null,
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  let scheduleCount = 0;
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    scheduleUpdate: () => {
      scheduleCount += 1;
    },
  });

  assert.ok(state.retryTimer);
  assert.equal(scheduleCount, 0);

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts cleanup restores marker opacity, removes overlay artifacts, and cancels active flights", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...ANIMATED_VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  const entry = state.entriesByMarker.get(markers[0]);
  const animation = entry.flightAnimation;
  assert.equal(markers[0].style.opacity, "0");
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), true);

  clearDartMarkerDartsState(state, { reason: "test-cleanup" });

  assert.equal(markers[0].style.opacity, "");
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), false);
  assert.equal(state.entriesByMarker.size, 0);
  assert.equal(state.markerOpacityByMarker.size, 0);
  assert.equal(animation.playState, "idle");
});

test("dart-marker-darts stays active in coordinate mode and pauses completely while live input mode or bull-off is active", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
  ]);
  const buttons = installKeyboardModeToggle(documentRef, "segments", "aria-pressed");

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  assert.equal(state.entriesByMarker.size, 1);
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), true);
  assert.equal(markers[0].style.opacity, "0");

  setModeButtonActive(buttons.segments, "aria-pressed", false);
  setModeButtonActive(buttons.coords, "aria-selected", true);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  assert.equal(state.entriesByMarker.size, 1);
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), true);
  assert.equal(markers[0].style.opacity, "0");

  setModeButtonActive(buttons.coords, "aria-selected", false);
  setModeButtonActive(buttons.live, "data-state", true);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  assert.equal(state.entriesByMarker.size, 0);
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), false);
  assert.equal(markers[0].style.opacity, "");

  setModeButtonActive(buttons.live, "data-state", false);
  state.gameStateSnapshot = {
    variantNormalized: "bull-off",
    variant: "Bull-Off",
  };
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  assert.equal(state.entriesByMarker.size, 0);
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), false);
  assert.equal(markers[0].style.opacity, "");

  state.gameStateSnapshot = {
    variantNormalized: "x01",
    variant: "X01",
  };
  setModeButtonActive(buttons.segments, "aria-pressed", true);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: {
      ...VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  assert.equal(state.entriesByMarker.size, 1);
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), true);
  assert.equal(markers[0].style.opacity, "0");

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts reacts to scroll, resize, and mutation triggers without drift", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const dynamicMatrix = { a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 };
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => dynamicMatrix,
    },
  ]);

  const cleanup = initializeDartMarkerDarts({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    config: {
      getFeatureConfig() {
        return {
          design: "autodarts",
          animateDarts: false,
          sizePercent: 100,
          hideOriginalMarkers: false,
          enableShadowBlur: true,
          enableFlightBlur: true,
          flightSpeed: "standard",
          debug: false,
        };
      },
    },
    gameState: {
      subscribe() {
        return () => {};
      },
    },
    helpers: {
      createRafScheduler,
    },
  });

  await wait(15);
  const initialX = Number.parseFloat(getDartImages(documentRef)[0].getAttribute("x"));

  dynamicMatrix.e += 40;
  windowRef.dispatchEvent({ type: "scroll" });
  await wait(15);
  const afterScrollX = Number.parseFloat(getDartImages(documentRef)[0].getAttribute("x"));
  assert.notEqual(afterScrollX, initialX);

  markers[0].setAttribute("cx", "12");
  documentRef.flushMutations([{ target: markers[0], addedNodes: [], removedNodes: [] }]);
  await wait(15);
  const afterMutationX = Number.parseFloat(getDartImages(documentRef)[0].getAttribute("x"));
  assert.notEqual(afterMutationX, afterScrollX);

  windowRef.dispatchEvent({ type: "resize" });
  await wait(10);
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), true);

  cleanup();
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), false);
});

test("dart-marker-darts ignores unrelated document churn outside the X01 board surface", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
  ]);

  const observers = createObserverRegistry();
  const scheduleCounter = { count: 0 };
  const cleanup = initializeDartMarkerDarts({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners: createListenerRegistry(),
    },
    config: {
      getFeatureConfig() {
        return {
          design: "autodarts",
          animateDarts: false,
          sizePercent: 100,
          hideOriginalMarkers: false,
          enableShadowBlur: true,
          enableFlightBlur: true,
          flightSpeed: "standard",
          debug: false,
        };
      },
    },
    gameState: {
      subscribe() {
        return () => {};
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

  await wait(15);
  const observer = observers.get("dart-marker-darts:dom-observer");
  assert.ok(observer);
  const countAfterInit = scheduleCounter.count;

  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);

  assert.equal(scheduleCounter.count, countAfterInit);

  cleanup();
});

test("dart-marker-darts ignores unchanged game-state snapshots for scheduling", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
  ]);

  let gameStateListener = () => {};
  const scheduleCounter = { count: 0 };
  const cleanup = initializeDartMarkerDarts({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    config: {
      getFeatureConfig() {
        return {
          design: "autodarts",
          animateDarts: false,
          sizePercent: 100,
          hideOriginalMarkers: false,
          enableShadowBlur: true,
          enableFlightBlur: true,
          flightSpeed: "standard",
          debug: false,
        };
      },
    },
    gameState: {
      subscribe(listener) {
        gameStateListener = listener;
        return () => {};
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

  const baseCount = scheduleCounter.count;
  const snapshot = {
    variantNormalized: "x01",
    outMode: "double",
    activePlayerIndex: 0,
    activeScore: 301,
    match: {
      players: [{ id: "player-1" }],
      turns: [{ playerId: "player-1", throws: [] }],
    },
  };

  gameStateListener(snapshot);
  assert.equal(scheduleCounter.count, baseCount + 1);

  gameStateListener(snapshot);
  assert.equal(scheduleCounter.count, baseCount + 1);

  gameStateListener({
    ...snapshot,
    activeScore: 261,
  });
  assert.equal(scheduleCounter.count, baseCount + 2);

  cleanup();
});

test("dart-marker-darts runtime remount keeps a single overlay instance", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
  ]);

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureRuntimeConfig(),
  });

  runtime.start();
  runtime.start();
  await waitForCondition(
    () => documentRef.querySelectorAll(`#${OVERLAY_ID}`).length === 1,
    { timeoutMs: 120 }
  );

  assert.equal(documentRef.querySelectorAll(`#${OVERLAY_ID}`).length, 1);

  runtime.updateConfig({
    features: {
      dartMarkerDarts: {
        sizePercent: 115,
      },
    },
  });
  await wait(15);
  assert.equal(documentRef.querySelectorAll(`#${OVERLAY_ID}`).length, 1);

  runtime.stop();
  assert.equal(documentRef.querySelectorAll(`#${OVERLAY_ID}`).length, 0);
});

test("dart-marker-darts does not create concurrent flight animations during repeated updates", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const dynamicMatrix = { a: 1, b: 0, c: 0, d: 1, e: 360, f: 260 };
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => dynamicMatrix,
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  const firstAnimation = entry.flightAnimation;
  assert.ok(firstAnimation);
  assert.equal(entry.container.__animations.length, 1);

  dynamicMatrix.e += 32;
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const updatedEntry = state.entriesByMarker.get(markers[0]);
  assert.equal(updatedEntry.flightAnimation, firstAnimation);
  assert.equal(updatedEntry.container.__animations.length, 1);
  approxEqual(updatedEntry.lastTargetCenter.x, 392);

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts debug logging is gated, deduplicated, and reports render mismatches", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 0,
      cy: 0,
      r: 5,
      getMatrix: () => ({ a: 1, b: 0, c: 0, d: 1, e: 400, f: 350 }),
    },
  ]);

  const state = createDartMarkerDartsState(windowRef);
  const logs = [];
  const warns = [];
  const featureDebug = {
    enabled: true,
    log(...args) {
      logs.push(args);
    },
    warn(...args) {
      warns.push(args);
    },
  };

  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  entry.flightAnimation?.finish?.();
  entry.settleUntil = 0;
  entry.rotateGroup.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 60, f: 60 });

  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });

  const markerScanLogs = logs.filter((event) => event[0] === "marker-scan");
  const flightStartLogs = logs.filter((event) => event[0] === "flight-start");
  const renderMismatchWarns = warns.filter((event) => event[0] === "render-mismatch");

  assert.equal(markerScanLogs.length >= 3, true);
  assert.equal(markerScanLogs.length <= 4, true);
  assert.equal(flightStartLogs.length, 1);
  assert.equal(renderMismatchWarns.length, 1);

  const disabledDebug = {
    enabled: false,
    log() {
      throw new Error("disabled debug should not log");
    },
    warn() {
      throw new Error("disabled debug should not warn");
    },
  };
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    featureDebug: disabledDebug,
  });

  clearDartMarkerDartsState(state);
});
