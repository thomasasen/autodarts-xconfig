import test from "node:test";
import assert from "node:assert/strict";

import {
  clearBustActivePlayerHighlightState,
  createBustActivePlayerHighlightState,
  dismissBustSurfaceHighlightForEvent,
  ensureBustGlassCrackAudio,
  playBustGlassCrackSound,
  runBustActivePlayerHighlightPreview,
  syncBustActivePlayerHighlight,
  tryUnlockBustGlassCrackAudio,
} from "../../src/features/x01-bust-active-player-highlight/logic.js";
import {
  BUST_ACTIVE_CLASS,
  BUST_CRACK_CLASS,
  BUST_CRACK_OVERLAY_CLASS,
  BUST_IMPACT_HOLE_CLASS,
  BUST_IMPACT_SURFACE_CLASS,
  BUST_SURFACE_CLASS,
  DEMO_CRACK_SETTINGS,
  NATIVE_BUST_EFFECT_HIDDEN_CLASS,
  buildStyleText,
} from "../../src/features/x01-bust-active-player-highlight/style.js";
import { mountX01BustActivePlayerHighlight } from "../../src/features/x01-bust-active-player-highlight/index.js";
import { FakeDocument } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

function createManualTimerWindow(documentRef, computedStyle = {}) {
  const timers = [];
  const audioInstances = [];
  let nextHandle = 1;
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.preload = "";
      this.volume = 1;
      this.currentTime = 0;
      this.playCount = 0;
      audioInstances.push(this);
    }

    play() {
      this.playCount += 1;
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
    }
  }
  const windowRef = {
    document: documentRef,
    Audio: FakeAudio,
    getComputedStyle: (node) => node.__computedStyle || computedStyle,
    setTimeout(callback, ms) {
      const handle = nextHandle;
      nextHandle += 1;
      timers.push({
        handle,
        callback,
        ms,
        cleared: false,
      });
      return handle;
    },
    clearTimeout(handle) {
      const timer = timers.find((entry) => entry.handle === handle);
      if (timer) {
        timer.cleared = true;
      }
    },
  };

  return {
    windowRef,
    timers,
    audioInstances,
    runTimer(index = 0) {
      const timer = timers[index];
      if (timer && !timer.cleared) {
        timer.callback();
      }
    },
  };
}

function appendPlayerDisplay(documentRef) {
  const root = documentRef.createElement("div");
  root.id = "ad-ext-player-display";

  const activeCard = documentRef.createElement("div");
  activeCard.classList.add("ad-ext-player", "ad-ext-player-active");
  const activeSurface = documentRef.createElement("div");
  activeSurface.classList.add("chakra-stack");
  const activeScore = documentRef.createElement("p");
  activeScore.classList.add("ad-ext-player-score");
  activeScore.textContent = "121";
  activeSurface.appendChild(activeScore);
  activeCard.appendChild(activeSurface);

  const inactiveCard = documentRef.createElement("div");
  inactiveCard.classList.add("ad-ext-player", "ad-ext-player-inactive");
  const inactiveSurface = documentRef.createElement("div");
  inactiveSurface.classList.add("chakra-stack");
  const inactiveScore = documentRef.createElement("p");
  inactiveScore.classList.add("ad-ext-player-score");
  inactiveScore.textContent = "121";
  inactiveSurface.appendChild(inactiveScore);
  inactiveCard.appendChild(inactiveSurface);

  root.appendChild(activeCard);
  root.appendChild(inactiveCard);
  documentRef.main.appendChild(root);

  return {
    root,
    activeCard,
    activeSurface,
    inactiveCard,
    inactiveSurface,
  };
}

function setTurnScore(documentRef, text) {
  documentRef.turnScoreElement.remove();
  documentRef.turnScoreElement.textContent = text;
  documentRef.turnContainer.insertBefore(documentRef.turnScoreElement, documentRef.throwRow);
}

function setupBustDocument(options = {}) {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = options.variantText || "X01";
  setTurnScore(documentRef, options.turnScoreText || "BUST");
  const players = appendPlayerDisplay(documentRef);
  documentRef.throwRow.__computedStyle = options.throwComputedStyle || {
    background:
      "rgba(255, 0, 0, 0.15) none repeat scroll 0% 0% / auto padding-box border-box",
    backgroundColor: "rgba(255, 0, 0, 0.15)",
    border: "0.8px solid rgb(207, 52, 52)",
    boxShadow: "none",
  };

  return {
    documentRef,
    ...players,
  };
}

function appendNativeBustEffectLayer(fixture, options = {}) {
  const host = fixture.node(
    fixture.card,
    "div",
    options.className || "absolute inset-0 pointer-events-none"
  );
  host.setAttribute("aria-hidden", "true");
  const svg = fixture.documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", options.viewBox || "0 0 1000 1000");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  const clipPath = fixture.documentRef.createElementNS(
    "http://www.w3.org/2000/svg",
    "clipPath"
  );
  clipPath.id = options.clipPathId || "__lottie_element_7";
  svg.appendChild(clipPath);
  host.appendChild(svg);
  return host;
}

function setupModernBustDocument(options = {}) {
  const fixture = createModernX01Fixture({
    base: 121,
    score: 121,
    throws: ["S20"],
    route: [],
  });
  fixture.total.textContent = "BUST";
  fixture.card.classList.remove("bg-raspberry-slush-diagonal");
  fixture.card.classList.add("bg-grey-slush-diagonal");
  const nativeEffect = options.withNativeEffect === false
    ? null
    : appendNativeBustEffectLayer(fixture, options.nativeEffectOptions);
  return { ...fixture, nativeEffect };
}

function appendRenderedDartTip(documentRef, initialScreenTip = { x: 0, y: 0 }) {
  const overlay = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.id = "ad-ext-dart-image-overlay";
  const flight = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  flight.classList.add("ad-ext-dart-flight-group");
  const rotate = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  rotate.classList.add("ad-ext-dart-rotate-group");
  rotate.setAttribute("transform", "rotate(-20 200 300)");
  const pose = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  pose.classList.add("ad-ext-dart-pose-group");
  rotate.appendChild(pose);
  flight.appendChild(rotate);
  overlay.appendChild(flight);
  documentRef.body.appendChild(overlay);

  let matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  overlay.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform(transform) {
      return {
        x: transform.a * this.x + transform.c * this.y + transform.e,
        y: transform.b * this.x + transform.d * this.y + transform.f,
      };
    },
  });
  pose.getScreenCTM = () => matrix;
  const setScreenTip = (screenTip) => {
    matrix = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: Number(screenTip.x) - 200,
      f: Number(screenTip.y) - 300,
    };
  };
  setScreenTip(initialScreenTip);
  return { overlay, flight, pose, setScreenTip };
}

test("x01 bust highlight owns the modern player card and suppresses only the native Bust Lottie", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();

  const result = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      crackCount: 2,
      soundEnabled: false,
    },
    state
  );

  assert.equal(result.isBust, true);
  assert.equal(result.activeNode, fixture.card);
  assert.equal(fixture.card.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(fixture.nativeEffect.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), true);
  assert.equal(fixture.card.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 2);
});

test("x01 bust highlight can target only the board while keeping the player card unchanged", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();

  const result = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "board",
      crackCount: 2,
      soundEnabled: false,
    },
    state
  );

  assert.equal(result.activeNode, fixture.board);
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), true);
  assert.equal(fixture.card.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(fixture.board.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 2);
  assert.equal(fixture.nativeEffect.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), true);
});

test("x01 bust highlight can cover the complete match surface without styling the player card", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();

  const result = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "screen",
      crackCount: 1,
      soundEnabled: false,
    },
    state
  );

  assert.equal(result.activeNode, fixture.documentRef.main);
  assert.equal(fixture.documentRef.main.classList.contains(BUST_SURFACE_CLASS), true);
  assert.equal(fixture.card.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(fixture.documentRef.main.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
});

test("x01 bust impact target starts every screen crack at the Bust dart coordinates", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();
  const coords = { x: -0.035260654388264506, y: 0.598930369086444 };

  const result = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "impact",
      crackCount: 2,
      gameState: {
        getActiveThrows: () => [{ segment: { name: "T20" }, coords }],
      },
    },
    state
  );

  const cracks = fixture.documentRef.main.querySelectorAll(`.${BUST_CRACK_CLASS}`);
  const expectedX = 718 + 549 * (0.5 + coords.x * (17 / 45));
  const expectedY = 136 + 549 * (0.5 - coords.y * (17 / 45));
  assert.equal(result.activeNode, fixture.documentRef.main);
  assert.equal(fixture.documentRef.main.classList.contains(BUST_IMPACT_SURFACE_CLASS), true);
  assert.equal(cracks.length, 2);
  cracks.forEach((crack) => {
    assert.equal(crack.getAttribute("data-crack-x"), expectedX.toFixed(2));
    assert.equal(crack.getAttribute("data-crack-y"), expectedY.toFixed(2));
    assert.equal(crack.getAttribute("data-crack-origin-source"), "throw-coords");
  });
  const impactHole = fixture.documentRef.main.querySelector(`.${BUST_IMPACT_HOLE_CLASS}`);
  assert.equal(impactHole.getAttribute("cx"), expectedX.toFixed(2));
  assert.equal(impactHole.getAttribute("cy"), expectedY.toFixed(2));
  assert.equal(impactHole.getAttribute("data-impact-origin-source"), "throw-coords");
});

test("x01 bust impact follows the rendered last dart tip instead of moving the dart to the hole", () => {
  const fixture = setupModernBustDocument();
  const marker = fixture.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", "10");
  marker.setAttribute("cy", "20");
  marker.setAttribute("r", "5");
  marker.setAttribute("filter", "url(#marker-shadow)");
  marker.__rect = { left: 900, top: 300, width: 10, height: 10 };
  fixture.layers[3].appendChild(marker);
  appendRenderedDartTip(fixture.documentRef, { x: 333, y: 444 });
  const state = createBustActivePlayerHighlightState();

  syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      boardSurface: { svg: fixture.layers[0], group: fixture.layers[0], zoomTarget: fixture.board },
      effectTarget: "impact",
      crackCount: 1,
      gameState: { getActiveThrows: () => [{ coords: { x: -0.8, y: -0.8 } }] },
    },
    state
  );

  const crack = fixture.documentRef.main.querySelector(`.${BUST_CRACK_CLASS}`);
  const impactHole = fixture.documentRef.main.querySelector(`.${BUST_IMPACT_HOLE_CLASS}`);
  assert.equal(crack.getAttribute("data-crack-x"), "333.00");
  assert.equal(crack.getAttribute("data-crack-y"), "444.00");
  assert.equal(crack.getAttribute("data-crack-origin-source"), "rendered-dart-tip");
  assert.equal(impactHole.getAttribute("cx"), "333.00");
  assert.equal(impactHole.getAttribute("cy"), "444.00");
});

test("x01 bust impact target prefers the rendered last marker over coordinate projection", () => {
  const fixture = setupModernBustDocument();
  const marker = fixture.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", "10");
  marker.setAttribute("cy", "20");
  marker.setAttribute("r", "5");
  marker.setAttribute("filter", "url(#marker-shadow)");
  marker.__rect = { left: 900, top: 300, width: 10, height: 10 };
  fixture.layers[3].appendChild(marker);
  const state = createBustActivePlayerHighlightState();

  syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      boardSurface: { svg: fixture.layers[0], group: fixture.layers[0], zoomTarget: fixture.board },
      effectTarget: "impact",
      crackCount: 1,
      gameState: { getActiveThrows: () => [{ coords: { x: -0.8, y: -0.8 } }] },
    },
    state
  );

  const crack = fixture.documentRef.main.querySelector(`.${BUST_CRACK_CLASS}`);
  const impactHole = fixture.documentRef.main.querySelector(`.${BUST_IMPACT_HOLE_CLASS}`);
  assert.equal(crack.getAttribute("data-crack-x"), "905.00");
  assert.equal(crack.getAttribute("data-crack-y"), "305.00");
  assert.equal(crack.getAttribute("data-crack-origin-source"), "board-marker");
  assert.equal(impactHole.getAttribute("cx"), "905.00");
  assert.equal(impactHole.getAttribute("cy"), "305.00");

  marker.__rect = { left: 740, top: 520, width: 10, height: 10 };
  syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      boardSurface: { svg: fixture.layers[0], group: fixture.layers[0], zoomTarget: fixture.board },
      effectTarget: "impact",
      crackCount: 1,
      gameState: { getActiveThrows: () => [{ coords: { x: -0.8, y: -0.8 } }] },
    },
    state
  );
  assert.equal(fixture.documentRef.main.querySelector(`.${BUST_CRACK_CLASS}`), crack);
  assert.equal(crack.getAttribute("data-crack-x"), "745.00");
  assert.equal(crack.getAttribute("data-crack-y"), "525.00");
  assert.equal(impactHole.getAttribute("cx"), "745.00");
  assert.equal(impactHole.getAttribute("cy"), "525.00");

  clearBustActivePlayerHighlightState(state);
  assert.equal(fixture.documentRef.main.classList.contains(BUST_IMPACT_SURFACE_CLASS), false);
});

test("x01 bust impact tracks the rendered dart tip while board zoom is moving", () => {
  const fixture = setupModernBustDocument();
  fixture.board.classList.add("ad-ext-tv-board-zoom");
  const marker = fixture.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", "10");
  marker.setAttribute("cy", "20");
  marker.setAttribute("r", "5");
  marker.setAttribute("filter", "url(#marker-shadow)");
  marker.__rect = { left: 900, top: 300, width: 10, height: 10 };
  fixture.layers[3].appendChild(marker);
  const renderedDart = appendRenderedDartTip(fixture.documentRef, { x: 805, y: 265 });

  let nextFrameId = 1;
  const pendingFrames = new Map();
  const listenerEntries = [];
  fixture.windowRef.requestAnimationFrame = (callback) => {
    const frameId = nextFrameId;
    nextFrameId += 1;
    pendingFrames.set(frameId, callback);
    return frameId;
  };
  fixture.windowRef.cancelAnimationFrame = (frameId) => pendingFrames.delete(frameId);

  const cleanup = mountX01BustActivePlayerHighlight({
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    boardSurface: { svg: fixture.layers[0], group: fixture.layers[0], zoomTarget: fixture.board },
    config: {
      getFeatureConfig: () => ({
        effectTarget: "impact",
        crackCount: 1,
        soundEnabled: false,
      }),
    },
    domGuards: {
      ensureStyle: () => {},
      removeNodeById: () => {},
    },
    helpers: {
      createRafScheduler: (callback) => ({
        schedule: callback,
        cancel: () => {},
      }),
    },
    registries: {
      listeners: {
        register: (entry) => listenerEntries.push(entry),
        remove: () => {},
      },
    },
  });

  const crack = fixture.documentRef.main.querySelector(`.${BUST_CRACK_CLASS}`);
  const impactHole = fixture.documentRef.main.querySelector(`.${BUST_IMPACT_HOLE_CLASS}`);
  const crackOverlay = fixture.documentRef.main.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
  assert.equal(crack.getAttribute("data-crack-x"), "805.00");
  assert.equal(crack.getAttribute("data-crack-y"), "265.00");
  assert.equal(pendingFrames.size, 1);

  fixture.documentRef.main.__rect = { left: 0, top: 0, width: 1536, height: 808 };
  renderedDart.setScreenTip({ x: 745, y: 525 });
  const [frameId, frameCallback] = pendingFrames.entries().next().value;
  pendingFrames.delete(frameId);
  frameCallback();

  assert.equal(fixture.documentRef.main.querySelector(`.${BUST_CRACK_CLASS}`), crack);
  assert.equal(crack.getAttribute("data-crack-x"), "745.00");
  assert.equal(crack.getAttribute("data-crack-y"), "525.00");
  assert.equal(impactHole.getAttribute("cx"), "745.00");
  assert.equal(impactHole.getAttribute("cy"), "525.00");
  assert.equal(crackOverlay.getAttribute("viewBox"), "0 0 1536 808");

  const transitionRun = listenerEntries.find((entry) => entry.type === "transitionrun");
  const transitionEnd = listenerEntries.find((entry) => entry.type === "transitionend");
  assert.ok(transitionRun);
  assert.ok(transitionEnd);
  transitionRun.handler({ propertyName: "transform", target: fixture.board });
  renderedDart.setScreenTip({ x: 685, y: 565 });
  const [nextPendingFrameId, nextFrameCallback] = pendingFrames.entries().next().value;
  pendingFrames.delete(nextPendingFrameId);
  nextFrameCallback();
  assert.equal(crack.getAttribute("data-crack-x"), "685.00");
  assert.equal(crack.getAttribute("data-crack-y"), "565.00");

  transitionEnd.handler({ propertyName: "transform", target: fixture.board });
  assert.equal(pendingFrames.size, 0);

  cleanup();
  assert.equal(pendingFrames.size, 0);
});

test("x01 bust impact target falls back to board center when no dart coordinates exist", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();

  syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "impact",
      crackCount: 1,
      gameState: { getActiveThrows: () => [{ segment: { name: "BUST" } }] },
    },
    state
  );

  const crack = fixture.documentRef.main.querySelector(`.${BUST_CRACK_CLASS}`);
  assert.equal(crack.getAttribute("data-crack-x"), (718 + 549 / 2).toFixed(2));
  assert.equal(crack.getAttribute("data-crack-y"), (136 + 549 / 2).toFixed(2));
  assert.equal(crack.getAttribute("data-crack-origin-source"), "board-center");
  assert.ok(fixture.documentRef.main.querySelector(`.${BUST_IMPACT_HOLE_CLASS}`));
});

test("x01 bust board target rehydrates after replacement without replaying the entry sound", () => {
  const fixture = setupModernBustDocument();
  const replacementBoard = fixture.documentRef.createElement("div");
  replacementBoard.__rect = { width: 500, height: 500 };
  fixture.documentRef.main.appendChild(replacementBoard);
  const state = createBustActivePlayerHighlightState();
  const { windowRef, audioInstances } = createManualTimerWindow(fixture.documentRef);

  syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef,
      boardSurface: { zoomTarget: fixture.board },
      effectTarget: "board",
      crackCount: 1,
      soundEnabled: true,
    },
    state
  );
  const result = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef,
      boardSurface: { zoomTarget: replacementBoard },
      effectTarget: "board",
      crackCount: 1,
      soundEnabled: true,
    },
    state
  );

  assert.equal(result.enteredBust, false);
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), false);
  assert.equal(replacementBoard.classList.contains(BUST_SURFACE_CLASS), true);
  assert.equal(replacementBoard.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
  assert.equal(audioInstances.length, 1);
  assert.equal(audioInstances[0].playCount, 1);
});

test("x01 bust board overlay dismisses on click until the next Bust", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();
  let prevented = 0;
  let stopped = 0;

  syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "board",
      crackCount: 1,
    },
    state
  );
  const dismissed = dismissBustSurfaceHighlightForEvent(state, {
    target: fixture.layers[0],
    preventDefault: () => { prevented += 1; },
    stopPropagation: () => { stopped += 1; },
  });

  assert.equal(dismissed, true);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), false);
  assert.equal(fixture.board.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  assert.equal(fixture.nativeEffect.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), true);

  const passiveResult = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "board",
      crackCount: 1,
    },
    state
  );
  assert.equal(passiveResult.dismissed, true);
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), false);

  fixture.total.textContent = "20";
  syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, effectTarget: "board" },
    state
  );
  fixture.total.textContent = "BUST";
  const nextBust = syncBustActivePlayerHighlight(
    {
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      effectTarget: "board",
      crackCount: 1,
    },
    state
  );
  assert.equal(nextBust.enteredBust, true);
  assert.equal(nextBust.dismissed, false);
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), true);
});

test("x01 bust player-card effect stays persistent when clicked", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();
  let prevented = false;

  syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );
  const dismissed = dismissBustSurfaceHighlightForEvent(state, {
    target: fixture.card,
    preventDefault: () => { prevented = true; },
  });

  assert.equal(dismissed, false);
  assert.equal(prevented, false);
  assert.equal(fixture.card.classList.contains(BUST_ACTIVE_CLASS), true);
});

test("x01 bust board mode registers a click-to-dismiss listener", () => {
  const fixture = setupModernBustDocument();
  const listenerEntries = [];
  const cleanup = mountX01BustActivePlayerHighlight({
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    config: {
      getFeatureConfig: () => ({
        effectTarget: "board",
        crackCount: 1,
        soundEnabled: false,
      }),
    },
    domGuards: {
      ensureStyle: () => {},
      removeNodeById: () => {},
    },
    helpers: {
      createRafScheduler: (callback) => ({
        schedule: callback,
        cancel: () => {},
      }),
    },
    registries: {
      listeners: {
        register: (entry) => listenerEntries.push(entry),
        remove: () => {},
      },
    },
  });

  const clickEntry = listenerEntries.find((entry) => entry.type === "click");
  assert.ok(clickEntry);
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), true);
  clickEntry.handler({
    target: fixture.board,
    preventDefault: () => {},
    stopPropagation: () => {},
  });
  assert.equal(fixture.board.classList.contains(BUST_SURFACE_CLASS), false);

  cleanup();
});

test("x01 bust highlight suppresses a native Lottie inserted after Bust entry without replaying the effect", () => {
  const fixture = setupModernBustDocument({ withNativeEffect: false });
  const state = createBustActivePlayerHighlightState();

  const first = syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );
  const nativeEffect = appendNativeBustEffectLayer(fixture);
  const second = syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );

  assert.equal(first.enteredBust, true);
  assert.equal(second.enteredBust, false);
  assert.equal(nativeEffect.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), true);
  assert.equal(fixture.card.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
});

test("x01 bust highlight leaves similar non-Lottie overlays untouched", () => {
  const fixture = setupModernBustDocument({ withNativeEffect: false });
  const lookalike = appendNativeBustEffectLayer(fixture, {
    clipPathId: "custom-overlay-clip",
  });
  const state = createBustActivePlayerHighlightState();

  syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );

  assert.equal(lookalike.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), false);
});

test("x01 bust highlight restores the native Lottie and card state when Bust ends", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();

  syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );
  fixture.total.textContent = "20";
  const result = syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );

  assert.equal(result.isBust, false);
  assert.equal(fixture.nativeEffect.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), false);
  assert.equal(fixture.card.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(fixture.card.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
});

test("x01 bust highlight restores the native Lottie when the feature is disabled", () => {
  const fixture = setupModernBustDocument();
  const state = createBustActivePlayerHighlightState();

  syncBustActivePlayerHighlight(
    { documentRef: fixture.documentRef, windowRef: fixture.windowRef, crackCount: 1 },
    state
  );
  clearBustActivePlayerHighlightState(state);

  assert.equal(fixture.nativeEffect.classList.contains(NATIVE_BUST_EFFECT_HIDDEN_CLASS), false);
  assert.equal(fixture.card.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(fixture.card.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
});

test("x01 bust highlight styles only the active player on bust entry", () => {
  const { documentRef, activeCard, activeSurface, inactiveCard, inactiveSurface } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const { windowRef, timers } = createManualTimerWindow(documentRef);

  const result = syncBustActivePlayerHighlight({ documentRef, windowRef }, state);

  assert.equal(result.isBust, true);
  assert.equal(result.enteredBust, true);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(inactiveCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(timers.length, 0);
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-background-color"),
    "rgb(31, 13, 19)"
  );
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-border"),
    "2px solid rgb(217, 31, 62)"
  );
  assert.equal(activeCard.style.getPropertyValue("background-color"), "");
  assert.equal(activeSurface.style.getPropertyValue("background-color"), "rgb(31, 13, 19)");
  assert.equal(activeSurface.style.getPropertyPriority("background-color"), "important");
  assert.equal(inactiveSurface.style.getPropertyValue("background-color"), "");
  assert.equal(activeCard.style.getPropertyValue("border"), "2px solid rgb(217, 31, 62)");
  assert.equal(activeCard.style.getPropertyPriority("border"), "important");
  assert.equal(activeCard.style.getPropertyValue("border-color"), "rgb(217, 31, 62)");
  assert.equal(activeCard.style.getPropertyPriority("border-color"), "important");
  assert.equal(activeCard.style.getPropertyValue("border-width"), "2px");
  assert.equal(activeCard.style.getPropertyPriority("border-width"), "important");
  assert.equal(activeCard.style.getPropertyValue("border-style"), "solid");
  assert.equal(activeCard.style.getPropertyPriority("border-style"), "important");
  assert.match(activeCard.style.getPropertyValue("box-shadow"), /rgba\(217, 31, 62/);
  assert.equal(activeCard.style.getPropertyPriority("box-shadow"), "important");
});

test("x01 bust highlight keeps its dedicated visuals when hit tiles use another theme", () => {
  const { documentRef, activeCard, activeSurface } = setupBustDocument({
    throwComputedStyle: {
      background:
        "rgba(0, 0, 0, 0) linear-gradient(165deg, rgba(8, 12, 12, 0.98) 0%, rgba(11, 19, 12, 0.96) 48%, rgba(6, 11, 8, 0.99) 100%) repeat scroll 0% 0% / auto padding-box border-box",
      backgroundColor: "rgba(0, 0, 0, 0)",
      border: "0.8px solid rgba(255, 255, 255, 0.14)",
      borderColor: "rgba(255, 255, 255, 0.14)",
      borderStyle: "solid",
      borderWidth: "0.8px",
      boxShadow:
        "rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.28) 0px -8px 18px 0px inset",
    },
  });
  const state = createBustActivePlayerHighlightState();
  const { windowRef } = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef }, state);

  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-background-color"),
    "rgb(31, 13, 19)"
  );
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-border"),
    "2px solid rgb(217, 31, 62)"
  );
  assert.equal(activeSurface.style.getPropertyValue("background-color"), "rgb(31, 13, 19)");
  assert.equal(activeCard.style.getPropertyValue("border-color"), "rgb(217, 31, 62)");
  assert.match(activeCard.style.getPropertyValue("box-shadow"), /rgba\(217, 31, 62/);
});

test("x01 bust highlight plays the glass crack sound only on bust entry when enabled", () => {
  const { documentRef } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: false }, state);
  assert.equal(audioInstances.length, 0);

  setTurnScore(documentRef, "60");
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);
  setTurnScore(documentRef, "BUST");
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);

  assert.equal(audioInstances.length, 1);
  assert.match(audioInstances[0].src, /glasscrack\.mp3$/);
  assert.equal(audioInstances[0].volume, 0.9);
  assert.equal(audioInstances[0].currentTime, 0);
  assert.equal(audioInstances[0].playCount, 1);
});

test("x01 bust highlight keeps persistent styling without moving the player card", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef, crackCount: 1 },
    state
  );

  assert.equal(result.isBust, true);
  assert.equal(result.enteredBust, true);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
  assert.equal(timerWindow.timers.length, 0);
});

test("x01 bust sound can be unlocked before a later bust entry", async () => {
  const { documentRef } = setupBustDocument({ turnScoreText: "60" });
  const state = createBustActivePlayerHighlightState();
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);

  ensureBustGlassCrackAudio(state, windowRef);
  assert.equal(audioInstances.length, 1);
  tryUnlockBustGlassCrackAudio(state);
  await Promise.resolve();

  assert.equal(state.audioUnlocked, true);
  assert.equal(audioInstances[0].playCount, 1);
  assert.equal(audioInstances[0].volume, 0.9);

  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);
  setTurnScore(documentRef, "BUST");
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);

  assert.equal(audioInstances.length, 1);
  assert.equal(audioInstances[0].playCount, 2);
});

test("x01 bust sound unlock ignores xConfig panel clicks so preview playback keeps user activation", async () => {
  const { documentRef } = setupBustDocument({ turnScoreText: "60" });
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);
  const listenerEntries = [];
  const panel = documentRef.createElement("div");
  panel.id = "ad-xconfig-panel-host";
  const panelButton = documentRef.createElement("button");
  panel.appendChild(panelButton);
  documentRef.main.appendChild(panel);

  const cleanup = mountX01BustActivePlayerHighlight({
    documentRef,
    windowRef,
    config: {
      getFeatureConfig: () => ({ crackCount: 1, soundEnabled: true }),
    },
    domGuards: {
      ensureStyle: () => {},
      removeNodeById: () => {},
    },
    helpers: {
      createRafScheduler: (callback) => ({
        schedule: callback,
        cancel: () => {},
      }),
    },
    registries: {
      listeners: {
        register: (entry) => listenerEntries.push(entry),
        remove: () => {},
      },
    },
  });
  await Promise.resolve();

  const pointerEntry = listenerEntries.find((entry) => entry.type === "pointerdown");
  assert.ok(pointerEntry);
  assert.equal(audioInstances.length, 1);
  const initialPlayCount = audioInstances[0].playCount;

  pointerEntry.handler({ target: panelButton });
  await Promise.resolve();
  assert.equal(audioInstances[0].playCount, initialPlayCount);

  cleanup();
});

test("x01 bust preview applies visuals, cracks and optional sound", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);

  const cleanup = runBustActivePlayerHighlightPreview({
    documentRef,
    windowRef,
    targetNode: activeCard,
    crackCount: 1,
    soundEnabled: true,
  });

  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
  assert.equal(audioInstances.length, 1);
  assert.match(audioInstances[0].src, /glasscrack\.mp3$/);

  cleanup();
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
});

test("x01 bust preview uses the surface overlay contract for board and screen targets", () => {
  const { documentRef } = setupBustDocument();
  const targetNode = documentRef.createElement("div");
  documentRef.body.appendChild(targetNode);

  const cleanup = runBustActivePlayerHighlightPreview({
    documentRef,
    targetNode,
    effectTarget: "board",
    crackCount: 1,
  });

  assert.equal(targetNode.classList.contains(BUST_SURFACE_CLASS), true);
  assert.equal(targetNode.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(targetNode.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
  assert.equal(targetNode.listenerCount(), 1);

  targetNode.click();
  assert.equal(targetNode.classList.contains(BUST_SURFACE_CLASS), false);
  assert.equal(targetNode.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);

  cleanup();
  assert.equal(targetNode.classList.contains(BUST_SURFACE_CLASS), false);
  assert.equal(targetNode.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  assert.equal(targetNode.listenerCount(), 0);
});

test("x01 bust impact preview uses one visible example impact for all cracks", () => {
  const { documentRef } = setupBustDocument();
  const targetNode = documentRef.createElement("div");
  targetNode.__rect = { width: 1000, height: 600 };
  documentRef.body.appendChild(targetNode);

  const cleanup = runBustActivePlayerHighlightPreview({
    documentRef,
    targetNode,
    effectTarget: "impact",
    crackCount: 2,
  });

  const cracks = targetNode.querySelectorAll(`.${BUST_CRACK_CLASS}`);
  assert.equal(cracks.length, 2);
  assert.equal(targetNode.classList.contains(BUST_IMPACT_SURFACE_CLASS), false);
  cracks.forEach((crack) => {
    assert.equal(crack.getAttribute("data-crack-x"), "720.00");
    assert.equal(crack.getAttribute("data-crack-y"), "204.00");
    assert.equal(crack.getAttribute("data-crack-origin-source"), "preview-impact");
  });
  assert.ok(targetNode.querySelector(`.${BUST_IMPACT_HOLE_CLASS}`));

  cleanup();
  assert.equal(targetNode.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
});

test("x01 bust sound uses Web Audio buffer playback when AudioContext is available", async () => {
  const { documentRef } = setupBustDocument();
  const startedSources = [];
  class FakeAudioContext {
    constructor() {
      this.state = "suspended";
      this.destination = {};
    }

    resume() {
      this.state = "running";
      return Promise.resolve();
    }

    decodeAudioData(arrayBuffer) {
      assert.equal(arrayBuffer.byteLength, 4);
      return Promise.resolve({ duration: 1.2 });
    }

    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: (time) => startedSources.push(time),
      };
    }

    createGain() {
      return {
        gain: { value: 0 },
        connect: () => {},
      };
    }
  }
  const windowRef = {
    document: documentRef,
    AudioContext: FakeAudioContext,
    fetch: () =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer),
      }),
  };
  const state = createBustActivePlayerHighlightState();

  const result = playBustGlassCrackSound({ windowRef, state, soundEnabled: true });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(result.played, true);
  assert.equal(result.reason, "scheduled");
  assert.equal(state.audioState.sourceType, "web-audio");
  assert.deepEqual(startedSources, [0]);
});

test("x01 bust highlight immediately renders configured cracks at random card positions", () => {
  const { documentRef, activeCard } = setupBustDocument();
  activeCard.__rect = { width: 640, height: 180 };
  const state = createBustActivePlayerHighlightState();
  const { windowRef } = createManualTimerWindow(documentRef);
  let randomState = 17;
  const random = () => {
    randomState = (randomState * 73 + 41) % 997;
    return randomState / 997;
  };

  syncBustActivePlayerHighlight(
    { documentRef, windowRef, crackCount: 2, random },
    state
  );

  const overlay = activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
  const cracks = overlay?.querySelectorAll?.(`.${BUST_CRACK_CLASS}`) || [];
  assert.ok(overlay);
  assert.equal(overlay.getAttribute("viewBox"), "0 0 640 180");
  assert.equal(cracks.length, 2);
  assert.notEqual(cracks[0].getAttribute("data-crack-x"), cracks[1].getAttribute("data-crack-x"));
  assert.equal(cracks[0].querySelectorAll("path").length, 6);
  assert.ok(
    cracks[0].querySelector(".ad-ext-x01-bust-crack-main").getAttribute("d").split("M ").length >
      100
  );
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-splinters").getAttribute("d"));
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-web").getAttribute("d"));
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-noise").getAttribute("d"));
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-shards").getAttribute("d"));
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_OVERLAY_CLASS}`).length, 1);
});

test("x01 bust cracks retain the demo geometry and rendering settings", () => {
  assert.deepEqual(DEMO_CRACK_SETTINGS, {
    rays: 20,
    initialRadius: 5,
    radiusStart: 15,
    densityPercent: 50,
    curvaturePercent: 30,
    ringConnectionPercent: 60,
    diagonalConnectionPercent: 30,
    refractWidth: 3,
    refractShift: 6,
    reflectAlpha: 0.3,
    fractureSize: 33,
    fractureAlpha: 0.4,
    mainlineOffset: 0.03,
    mainlineStrength: 0.14,
    mainlineHighlight: 0.2,
    mainlineAlpha: 65,
    noiseFrequency: 0.4,
    noiseAlpha: 1,
  });
});

test("x01 bust highlight disables cracks when configured with zero", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef, crackCount: 0 },
    state
  );

  assert.equal(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
});

test("x01 bust highlight CSS supports modern and legacy cards without motion", () => {
  const css = buildStyleText();

  assert.match(
    css,
    /\.ad-ext-x01-bust-active-player-highlight \{[\s\S]*border: var\(--ad-ext-x01-bust-active-player-border, 2px solid rgb\(217, 31, 62\)\)/
  );
  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-x01-bust-active-player-highlight > \.chakra-stack[\s\S]*background: var\(--ad-ext-x01-bust-active-player-background/
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.ad-ext-x01-bust-active-player-crack[\s\S]*animation: none;/
  );
  assert.match(css, /\.ad-ext-x01-bust-native-effect-hidden \{[\s\S]*display: none !important;/);
  assert.match(
    css,
    /\.ad-ext-x01-bust-surface-highlight::before \{[\s\S]*background: rgba\(217, 31, 62, 0\.2\)/
  );
  assert.match(
    css,
    /\.ad-ext-x01-bust-surface-highlight::before \{[\s\S]*pointer-events: auto;/
  );
  assert.match(
    css,
    /html:has\(\.ad-ext-x01-bust-impact-highlight\) #ad-ext-dart-image-overlay \{[\s\S]*z-index: 2147483002 !important;/
  );
  assert.match(
    css,
    /html:has\(\.ad-ext-x01-bust-impact-highlight\) #ad-ext-dart-image-overlay \{[\s\S]*clip-path: none !important;/
  );
  assert.match(
    css,
    /#ad-ext-dart-image-overlay \.ad-ext-dart-flight-group:not\(:last-of-type\) \{[\s\S]*visibility: hidden !important;/
  );
  assert.match(css, /\.ad-ext-x01-bust-impact-hole \{[\s\S]*fill: rgba\(5, 7, 12, 0\.96\)/);
  assert.doesNotMatch(css, /ad-ext-x01-bust-active-player-shake/);
});

test("x01 bust passive resync does not replay the entry effect", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);

  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef },
    state
  );

  assert.equal(result.enteredBust, false);
  assert.equal(timerWindow.timers.length, 0);
});

test("x01 bust highlight clears styling when bust disappears", () => {
  const { documentRef, activeCard, activeSurface } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  documentRef.turnScoreElement.textContent = "40";
  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef },
    state
  );

  assert.equal(result.isBust, false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-background-color"),
    ""
  );
  assert.equal(activeCard.style.getPropertyValue("background-color"), "");
  assert.equal(activeSurface.style.getPropertyValue("background-color"), "");
  assert.equal(activeCard.style.getPropertyValue("border"), "");
  assert.equal(activeCard.style.getPropertyValue("border-color"), "");
  assert.equal(activeCard.style.getPropertyValue("border-width"), "");
  assert.equal(activeCard.style.getPropertyValue("border-style"), "");
  assert.equal(activeCard.style.getPropertyValue("box-shadow"), "");
  assert.equal(timerWindow.timers.length, 0);
});

test("x01 bust highlight ignores non-X01 variants even when BUST is visible", () => {
  const { documentRef, activeCard } = setupBustDocument({ variantText: "Cricket" });
  const state = createBustActivePlayerHighlightState();
  const { windowRef, timers } = createManualTimerWindow(documentRef);

  const result = syncBustActivePlayerHighlight({ documentRef, windowRef }, state);

  assert.equal(result.isBust, false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(timers.length, 0);
});

test("x01 bust highlight moves persistent styling to a new active player without replaying entry", () => {
  const { documentRef, activeCard, inactiveCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  activeCard.classList.remove("ad-ext-player-active");
  activeCard.classList.add("ad-ext-player-inactive");
  inactiveCard.classList.remove("ad-ext-player-inactive");
  inactiveCard.classList.add("ad-ext-player-active");

  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef },
    state
  );

  assert.equal(result.enteredBust, false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(inactiveCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(timerWindow.timers.length, 0);
});

test("x01 bust highlight cleanup removes classes and overlays", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef, crackCount: 2 },
    state
  );
  assert.ok(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`));
  clearBustActivePlayerHighlightState(state);

  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  assert.equal(timerWindow.timers.length, 0);
});
