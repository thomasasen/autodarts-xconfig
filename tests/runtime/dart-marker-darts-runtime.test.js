import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import {
  clearDartMarkerDartsState,
  createDartMarkerDartsState,
  updateDartMarkerDarts,
} from "../../src/features/dart-marker-darts/logic.js";
import { initializeDartMarkerDarts } from "../../src/features/dart-marker-darts/index.js";
import { OVERLAY_ID } from "../../src/features/dart-marker-darts/style.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const VISUAL_CONFIG = Object.freeze({
  designKey: "autodarts",
  animateDarts: false,
  sizePercent: 100,
  sizeMultiplier: 1,
  hideOriginalMarkers: false,
  flightSpeed: "standard",
  flightDurationMs: 320,
});

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  marker.getScreenCTM = () => (typeof spec.getMatrix === "function" ? spec.getMatrix() : spec.matrix || null);
  parentNode.appendChild(marker);
  return marker;
}

function installBoardFixture(documentRef, markerSpecs = []) {
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.__rect = { left: 100, top: 50, width: 600, height: 600 };
  svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
  svg.createSVGPoint = () => createSvgPointFactory();

  const boardGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const outerCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerCircle.setAttribute("cx", "0");
  outerCircle.setAttribute("cy", "0");
  outerCircle.setAttribute("r", "450");
  boardGroup.appendChild(outerCircle);
  svg.appendChild(boardGroup);

  const markers = markerSpecs.map((spec) => createMarker(documentRef, boardGroup, spec));
  documentRef.main.appendChild(svg);

  return {
    svg,
    boardGroup,
    markers,
  };
}

function getDartImages(documentRef) {
  return Array.from(documentRef.querySelectorAll("image.ad-ext-dart-image"));
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
        flightSpeed: "standard",
      },
    },
  };
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
  assert.equal(getDartImages(documentRef).length, 2);

  clearDartMarkerDartsState(state);
});

test("dart-marker-darts positions darts in screen space using SVG matrix fallback", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  installBoardFixture(documentRef, [
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

  const imageNode = getDartImages(documentRef)[0];
  assert.ok(imageNode);

  const x = Number.parseFloat(imageNode.getAttribute("x"));
  const y = Number.parseFloat(imageNode.getAttribute("y"));
  const transform = String(imageNode.getAttribute("transform") || "");

  assert.ok(Number.isFinite(x));
  assert.ok(Number.isFinite(y));
  assert.ok(transform.startsWith("rotate("));

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

test("dart-marker-darts cleanup restores marker opacity and removes overlay artifacts", () => {
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
      ...VISUAL_CONFIG,
      hideOriginalMarkers: true,
    },
  });

  assert.equal(markers[0].style.opacity, "0");
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), true);

  clearDartMarkerDartsState(state, { reason: "test-cleanup" });

  assert.equal(markers[0].style.opacity, "");
  assert.equal(Boolean(documentRef.getElementById(OVERLAY_ID)), false);
  assert.equal(state.entriesByMarker.size, 0);
  assert.equal(state.markerOpacityByMarker.size, 0);
});

test("dart-marker-darts reacts to scroll/resize/mutation triggers without drift", async () => {
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
  await wait(15);

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

test("dart-marker-darts debug logging is gated and deduplicated", () => {
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
    visualConfig: VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    featureDebug,
  });
  updateDartMarkerDarts({
    documentRef,
    state,
    visualConfig: VISUAL_CONFIG,
    featureDebug,
  });

  const markerScanLogs = logs.filter((entry) => entry[0] === "marker-scan");
  assert.equal(markerScanLogs.length, 2);
  assert.equal(warns.length, 0);

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
