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
  clearDartMarkerReplacerState,
  createDartMarkerReplacerState,
  updateDartMarkerReplacer,
} from "../../src/features/dart-marker-replacer/logic.js";
import { initializeDartMarkerReplacer } from "../../src/features/dart-marker-replacer/index.js";
import { runDartMarkerReplacerPreview } from "../../src/features/dart-marker-replacer/preview.js";
import {
  DART_CLASS,
  DART_CONTAINER_CLASS,
  DART_POSE_CLASS,
  DART_ROTATE_CLASS,
  DART_SHADOW_CLASS,
  OVERLAY_ID,
  resolveDartMarkerReplacerConfig,
} from "../../src/features/dart-marker-replacer/style.js";
import {
  DART_IMPACT_SHADOW_DURATION_MS,
  DART_IMPACT_WOBBLE_DURATION_MS,
  createDartImpactWobbleKeyframes,
} from "../../src/features/dart-marker-replacer/impact.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const VISUAL_CONFIG = Object.freeze({
  designKey: "autodarts",
  animateDarts: false,
  sizePercent: 100,
  sizeMultiplier: 1,
  hideOriginalMarkers: false,
  impactStyle: "classic",
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

function installAppendSupport(documentRef) {
  const attachAppend = (node) => {
    if (node && typeof node.append !== "function") {
      node.append = function append(...children) {
        children.forEach((child) => this.appendChild(child));
      };
    }
    return node;
  };
  const originalCreateElement = documentRef.createElement.bind(documentRef);
  const originalCreateElementNS = documentRef.createElementNS.bind(documentRef);
  documentRef.createElement = (...args) => attachAppend(originalCreateElement(...args));
  documentRef.createElementNS = (...args) => attachAppend(originalCreateElementNS(...args));
  attachAppend(documentRef.body);
}

test("dart-marker-replacer resolves size settings twenty percent larger with legacy migration", () => {
  assert.equal(resolveDartMarkerReplacerConfig({ sizePercent: 108 }).sizeMultiplier, 1.08);
  assert.equal(resolveDartMarkerReplacerConfig({ sizePercent: 120 }).sizeMultiplier, 1.2);
  assert.equal(resolveDartMarkerReplacerConfig({ sizePercent: 138 }).sizeMultiplier, 1.38);
  assert.equal(resolveDartMarkerReplacerConfig({ sizePercent: 100 }).sizePercent, 120);
  assert.equal(resolveDartMarkerReplacerConfig({ sizePercent: 115 }).sizePercent, 138);
  assert.equal(resolveDartMarkerReplacerConfig({ sizePercent: 999 }).sizePercent, 120);
  assert.equal(resolveDartMarkerReplacerConfig({ impactStyle: "natural" }).impactStyle, "natural");
  assert.equal(resolveDartMarkerReplacerConfig({ impactStyle: "invalid" }).impactStyle, "classic");
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
      dartMarkerReplacer: true,
    },
    features: {
      dartMarkerReplacer: {
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

test("dart-marker-replacer keeps separate darts for markers with identical cx/cy/r", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  assert.equal(state.entriesByMarker.size, 2);
  assert.equal(getFlightGroups(documentRef).length, 2);
  assert.equal(getDartImages(documentRef).length, 2);

  clearDartMarkerReplacerState(state);
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

test("dart-marker-replacer separates flight, rotation, pose, and image layers", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);
  assert.equal(entry.container.parentNode?.id, "ad-ext-dart-image-overlay-scene");
  assert.equal(entry.rotateGroup.parentNode, entry.container);
  assert.equal(entry.poseGroup.parentNode, entry.rotateGroup);
  assert.equal(entry.imageNode.parentNode, entry.poseGroup);
  assert.equal(entry.shadowNode.parentNode, entry.poseGroup);
  assert.equal(entry.poseGroup.classList.contains(DART_POSE_CLASS), true);
  assert.equal(entry.poseGroup.getAttribute("transform"), null);
  assert.equal(getFlightGroups(documentRef).length, 1);
  assert.equal(getRotateGroups(documentRef).length, 1);
  assert.equal(getShadowImages(documentRef).length, 1);
  assert.match(String(entry.rotateGroup.getAttribute("transform") || ""), /^rotate\(/);
  assert.equal(entry.imageNode.getAttribute("transform"), null);
  assert.equal(entry.container.__animations.length, 1);
  assert.equal(entry.imageNode.__animations.length, 1);
  assert.equal(entry.shadowNode.__animations.length, 1);

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer supports configurable shadow, shadow blur, wobble, and flight blur effects", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
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

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer uses shared stronger impact wobble and shadow timing in runtime and preview", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  const runtimeWobble = entry.imageNode.__animations[0];
  const runtimeShadow = entry.shadowNode.__animations[0];
  assert.deepEqual(runtimeWobble.keyframes, createDartImpactWobbleKeyframes());
  assert.equal(runtimeWobble.options.duration, DART_IMPACT_WOBBLE_DURATION_MS);
  assert.equal(runtimeWobble.options.delay, ANIMATED_VISUAL_CONFIG.flightDurationMs);
  assert.match(runtimeWobble.keyframes[1].transform, /rotate\(-7\.5deg\)/);
  assert.match(runtimeWobble.keyframes[1].transform, /scaleX\(0\.982\)/);
  assert.match(runtimeWobble.keyframes[1].transform, /translateX\(-0\.8px\)/);
  assert.equal(runtimeShadow.options.duration, DART_IMPACT_SHADOW_DURATION_MS);
  assert.equal(runtimeShadow.keyframes.length, 4);
  assert.ok(runtimeShadow.keyframes[1].opacity > runtimeShadow.keyframes[0].opacity);

  clearDartMarkerReplacerState(state);

  installAppendSupport(documentRef);
  const targetNode = documentRef.createElement("div");
  documentRef.body.appendChild(targetNode);
  runDartMarkerReplacerPreview({
    documentRef,
    windowRef,
    targetNode,
    featureConfig: ANIMATED_VISUAL_CONFIG,
  });

  const previewWobble = targetNode.querySelector(`image.${DART_CLASS}`)?.__animations[0];
  const previewShadow = targetNode.querySelector(`image.${DART_SHADOW_CLASS}`)?.__animations[0];
  assert.deepEqual(previewWobble.keyframes, createDartImpactWobbleKeyframes());
  assert.equal(previewWobble.options.duration, DART_IMPACT_WOBBLE_DURATION_MS);
  assert.equal(previewWobble.options.delay, ANIMATED_VISUAL_CONFIG.flightDurationMs);
  assert.equal(previewShadow.options.duration, DART_IMPACT_SHADOW_DURATION_MS);
});

test("dart-marker-replacer reuses entry geometry when board and marker layout are unchanged", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
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

  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    updateMode: {
      requiresBoardRescan: false,
      requiresMarkerRescan: false,
    },
  });

  assert.deepEqual(mutationCounter, { image: 0, shadow: 0, rotate: 0 });

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer skips marker geometry on unchanged rect-based reposition updates", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      rectLeft: 358,
      rectTop: 278,
      rectWidth: 4,
      rectHeight: 4,
      getMatrix: () => {
        throw new Error("rect-based marker should not need matrix fallback");
      },
    },
  ]);

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);
  assert.equal(entry.lastScreenPointSource, "rect");

  let markerRectReads = 0;
  const originalMarkerRect = markers[0].getBoundingClientRect.bind(markers[0]);
  markers[0].getBoundingClientRect = () => {
    markerRectReads += 1;
    return originalMarkerRect();
  };

  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    updateMode: {
      requiresBoardRescan: false,
      requiresMarkerRescan: false,
    },
  });

  assert.equal(markerRectReads, 0);
  assert.equal(state.entriesByMarker.size, 1);

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer does not skip reposition updates for matrix-resolved markers", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const dynamicMatrix = { a: 1, b: 0, c: 0, d: 1, e: 360, f: 280 };
  const { markers } = installBoardFixture(documentRef, [
    {
      cx: 10,
      cy: 20,
      r: 5,
      getMatrix: () => dynamicMatrix,
    },
  ]);

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  assert.ok(entry);
  assert.equal(entry.lastScreenPointSource, "matrix");
  const initialX = entry.center.x;

  dynamicMatrix.e += 24;
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    updateMode: {
      requiresBoardRescan: false,
      requiresMarkerRescan: false,
    },
  });

  assert.notEqual(state.entriesByMarker.get(markers[0]).center.x, initialX);

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer positions darts in screen space from the computed overlay layout and SVG matrix fallback", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
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

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer clips overlay to board viewport boundaries", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
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

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer clears stale overlay clipping when viewport host is not available", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.match(String(overlay?.style?.clipPath || ""), /^inset\(/);

  viewportNode?.classList?.remove?.("ad-ext-theme-board-viewport");
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
  });

  assert.equal(String(overlay?.style?.clipPath || ""), "");
  assert.equal(String(overlay?.style?.webkitClipPath || ""), "");

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer schedules retry when marker position is unresolved", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  let scheduleCount = 0;
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    scheduleUpdate: () => {
      scheduleCount += 1;
    },
  });

  assert.ok(state.retryTimer);
  assert.equal(scheduleCount, 0);

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer cleanup restores marker opacity, removes overlay artifacts, and cancels active flights", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
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

  clearDartMarkerReplacerState(state, { reason: "test-cleanup" });

  assert.equal(markers[0].style.opacity, "");
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), false);
  assert.equal(state.entriesByMarker.size, 0);
  assert.equal(state.markerOpacityByMarker.size, 0);
  assert.equal(animation.playState, "idle");
});

test("dart-marker-replacer stays active in coordinate mode and pauses completely while live input mode or bull-off is active", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
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
  updateDartMarkerReplacer({
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
  updateDartMarkerReplacer({
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
  updateDartMarkerReplacer({
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
  updateDartMarkerReplacer({
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

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer reacts to scroll, resize, and mutation triggers without drift", async () => {
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

  const cleanup = initializeDartMarkerReplacer({
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

test("dart-marker-replacer ignores unrelated document churn outside the X01 board surface", async () => {
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
  const cleanup = initializeDartMarkerReplacer({
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
  const observer = observers.get("dart-marker-replacer:dom-observer");
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

test("dart-marker-replacer reacts to zoom styles and ignores its own pose mutations", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [{ cx: 0, cy: 0, r: 5 }]);
  const observers = createObserverRegistry();
  const scheduleCounter = { count: 0 };
  const cleanup = initializeDartMarkerReplacer({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers, listeners: createListenerRegistry() },
    config: { getFeatureConfig: () => ({ ...VISUAL_CONFIG, impactStyle: "natural" }) },
    gameState: { subscribe: () => () => {} },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() { scheduleCounter.count += 1; callback(); },
          cancel() {},
          isScheduled() { return false; },
        };
      },
    },
  });

  await wait(5);
  const observer = observers.get("dart-marker-replacer:dom-observer");
  const zoomTarget = documentRef.createElement("div");
  zoomTarget.classList.add("ad-ext-tv-board-zoom");
  documentRef.main.appendChild(zoomTarget);
  const beforeZoom = scheduleCounter.count;
  observer.callback([{ type: "attributes", attributeName: "style", target: zoomTarget }]);
  assert.equal(scheduleCounter.count, beforeZoom + 1);

  const poseGroup = documentRef.querySelector(`g.${DART_POSE_CLASS}`);
  const afterZoom = scheduleCounter.count;
  observer.callback([{ type: "attributes", attributeName: "transform", target: poseGroup }]);
  assert.equal(scheduleCounter.count, afterZoom);

  cleanup();
});

test("dart-marker-replacer ignores unchanged game-state snapshots for scheduling", () => {
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
  const cleanup = initializeDartMarkerReplacer({
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

test("dart-marker-replacer tracks the newest active turn when turns are not ordered newest-first", () => {
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
  const cleanup = initializeDartMarkerReplacer({
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
  const olderTurn = {
    playerId: "player-1",
    round: 1,
    turn: 1,
    createdAt: "2026-01-01T10:00:00.000Z",
    throws: [],
  };
  const newestTurn = {
    playerId: "player-1",
    round: 2,
    turn: 1,
    createdAt: "2026-01-01T10:01:00.000Z",
    throws: [],
  };
  const snapshot = {
    variantNormalized: "x01",
    outMode: "double",
    activePlayerIndex: 0,
    activeScore: 301,
    match: {
      players: [{ id: "player-1" }],
      turns: [olderTurn, newestTurn],
    },
  };

  gameStateListener(snapshot);
  assert.equal(scheduleCounter.count, baseCount + 1);

  gameStateListener({
    ...snapshot,
    match: {
      ...snapshot.match,
      turns: [
        olderTurn,
        {
          ...newestTurn,
          throws: [{ round: 2, turn: 1, points: 20, segment: "S20" }],
        },
      ],
    },
  });
  assert.equal(scheduleCounter.count, baseCount + 2);

  gameStateListener({
    ...snapshot,
    match: {
      ...snapshot.match,
      turns: [
        olderTurn,
        {
          ...newestTurn,
          throws: [{ round: 2, turn: 1, points: 20, segment: "S20" }],
        },
      ],
    },
  });
  assert.equal(scheduleCounter.count, baseCount + 2);

  cleanup();
});

test("dart-marker-replacer runtime remount keeps a single overlay instance", async () => {
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
      dartMarkerReplacer: {
        sizePercent: 115,
      },
    },
  });
  await wait(15);
  assert.equal(documentRef.querySelectorAll(`#${OVERLAY_ID}`).length, 1);

  runtime.stop();
  assert.equal(documentRef.querySelectorAll(`#${OVERLAY_ID}`).length, 0);
});

test("dart-marker-replacer does not create concurrent flight animations during repeated updates", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  const firstAnimation = entry.flightAnimation;
  assert.ok(firstAnimation);
  assert.equal(entry.container.__animations.length, 1);

  dynamicMatrix.e += 32;
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
  });

  const updatedEntry = state.entriesByMarker.get(markers[0]);
  assert.equal(updatedEntry.flightAnimation, firstAnimation);
  assert.equal(updatedEntry.container.__animations.length, 1);
  approxEqual(updatedEntry.lastTargetCenter.x, 392);

  clearDartMarkerReplacerState(state);
});

test("dart-marker-replacer debug logging is gated, deduplicated, and reports render mismatches", () => {
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

  const state = createDartMarkerReplacerState(windowRef);
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

  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });

  const entry = state.entriesByMarker.get(markers[0]);
  entry.flightAnimation?.finish?.();
  entry.settleUntil = 0;
  entry.poseGroup.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 60, f: 60 });

  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: ANIMATED_VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerReplacer({
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
  updateDartMarkerReplacer({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    featureDebug: disabledDebug,
  });

  clearDartMarkerReplacerState(state);
});
