import assert from "node:assert/strict";
import test from "node:test";
import { applyZoom, resetZoom, hasHealthyZoomSurface } from "../../src/features/tv-board-zoom/logic.js";
import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "../../src/features/tv-board-zoom/style.js";
import { resolveBoardRenderSurface } from "../../src/shared/dartboard-svg.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";
import { acquireToolsAnimationLayerController, isToolsAnimationActive,
  TOOLS_ANIMATION_ACTIVE_ATTRIBUTE } from "../../src/features/shared/tools-animation-layer-controller.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { createFakeTimerHarness } from "./fake-dom.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { initializeTvBoardZoom } from "../../src/features/tv-board-zoom/index.js";
import { initializeDartMarkerReplacer } from "../../src/features/dart-marker-replacer/index.js";
import { mountX01BustActivePlayerHighlight } from "../../src/features/x01-bust-active-player-highlight/index.js";
import { buildStyleText as dartCss } from "../../src/features/dart-marker-replacer/style.js";
import {
  buildStyleText as bustCss,
  BUST_ACTIVE_CLASS,
  BUST_BOARD_SURFACE_CLASS,
  BUST_CRACK_OVERLAY_CLASS,
  BUST_SURFACE_CLASS,
} from "../../src/features/x01-bust-active-player-highlight/style.js";

// Layer audit: native art, markers and checkout/Cricket overlays share the board
// SVGs; Special Hit decorations stay in their score/card stacking contexts.
// Replacement darts/shadows use a fixed body SVG (49), below the native winner.
// BUST board/screen pseudo-elements and cracks use isolated high layers; impact
// raises the last replacement dart. Tools owns its fixed Shadow-DOM GIF wrapper.
// GIF priority suppresses independent darts and board-only BUST decoration;
// player-card and screen effects remain visible without intercepting GIF input.

function createAnimationFixture() {
  const fixture = createModernX01Fixture();
  fixture.windowRef.getComputedStyle = (node) => ({
    display: node.style?.display || "",
    visibility: node.style?.visibility || "",
    opacity: node.style?.opacity || "1",
  });
  return fixture;
}

const speed = { zoomInMs: 180, zoomOutMs: 220, easingIn: "ease", easingOut: "ease" };

function addToolsGif(f, src = "https://example.test/finish.gif", prepare = null) {
  const host = f.documentRef.createElement("autodarts-tools-animations");
  const root = f.documentRef.createElement("div");
  host.shadowRoot = root;
  const wrapper = f.documentRef.createElement("div");
  wrapper.classList.add("fixed");
  const media = f.documentRef.createElement("img");
  media.setAttribute("src", src);
  wrapper.appendChild(media);
  root.appendChild(wrapper);
  prepare?.({ host, root, wrapper, media });
  f.documentRef.main.appendChild(host);
  return { host, root, wrapper, media };
}

function addLegacyToolsGif(f, root, src = "https://example.test/legacy.gif", prepare = null) {
  const wrapper = f.documentRef.createElement("div");
  wrapper.classList.add("fixed");
  const media = f.documentRef.createElement("img");
  media.id = "gif-animation";
  media.setAttribute("src", src);
  wrapper.appendChild(media);
  root.appendChild(wrapper);
  const gif = { root, wrapper, media };
  prepare?.(gif);
  return gif;
}

const TOOLS_PRESENTATION_PROPERTIES = Object.freeze([
  "transform",
  "transition",
  "transform-origin",
  "will-change",
  "width",
  "height",
  "max-width",
  "max-height",
  "position",
  "inset",
  "top",
  "right",
  "bottom",
  "left",
  "object-fit",
  "opacity",
  "z-index",
  "overflow",
  "overflow-x",
  "overflow-y",
  "clip",
  "clip-path",
  "backface-visibility",
]);

function snapshotToolsPresentation(gif) {
  return Object.fromEntries(Object.entries(gif).map(([key, node]) => [key, {
    className: node.className,
    src: node.getAttribute?.("src"),
    animationCount: node.__animations?.length || 0,
    rect: { ...node.getBoundingClientRect() },
    styles: Object.fromEntries(TOOLS_PRESENTATION_PROPERTIES.map((property) => [property, {
      value: node.style.getPropertyValue(property),
      priority: node.style.getPropertyPriority(property),
    }])),
  }]));
}

function snapshotToolsIdentity(gif) {
  return Object.fromEntries(Object.entries(gif).map(([key, node]) => [key, {
    node,
    parentNode: node.parentNode,
    src: node.getAttribute?.("src"),
    animationCount: node.__animations?.length || 0,
  }]));
}

function assertToolsIdentity(gif, snapshot) {
  Object.entries(gif).forEach(([key, node]) => {
    assert.equal(node, snapshot[key].node, `${key} identity`);
    assert.equal(node.parentNode, snapshot[key].parentNode, `${key} parent`);
    assert.equal(node.getAttribute?.("src"), snapshot[key].src, `${key} source`);
    assert.equal(node.__animations?.length || 0, snapshot[key].animationCount, `${key} animations`);
  });
}

function seedToolsPresentation(gif) {
  Object.entries(gif).forEach(([key, node], index) => {
    node.classList.add(`tools-${key}-seed`);
    node.__rect = { left: 100 + index, top: 200 + index, width: 300 + index, height: 400 + index };
    TOOLS_PRESENTATION_PROPERTIES.forEach((property, propertyIndex) => {
      const values = {
        transform: `translate(${index + 1}px, ${index + 2}px)`,
        transition: `opacity ${100 + index}ms linear`,
        "transform-origin": "50% 50%",
        "will-change": "opacity",
        width: `${300 + index}px`,
        height: `${400 + index}px`,
        "max-width": `${500 + index}px`,
        "max-height": `${600 + index}px`,
        position: "fixed",
        inset: `${index}px`,
        top: `${index + 1}px`,
        right: `${index + 2}px`,
        bottom: `${index + 3}px`,
        left: `${index + 4}px`,
        "object-fit": "contain",
        opacity: "0.85",
        "z-index": String(900 + index),
        overflow: "visible",
        "overflow-x": "visible",
        "overflow-y": "visible",
        clip: "auto",
        "clip-path": "none",
        "backface-visibility": "visible",
      };
      node.style.setProperty(property, values[property], propertyIndex % 2 ? "important" : "");
    });
  });
}

test("native zoom leaves the Tools measurement anchor unchanged and transforms every board layer", () => {
  const f = createAnimationFixture();
  const state = {};
  const rect = f.board.getBoundingClientRect();
  try {
    applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    assert.equal(f.board.style.transform || "", "");
    assert.deepEqual(f.board.getBoundingClientRect(), rect);
    for (const layer of f.layers) assert.match(layer.style.transform, /scale\(2\.750*\)/);
  } finally { resetZoom(speed, state, true); }
  for (const layer of f.layers) assert.equal(layer.style.transform || "", "");
});

test("native zoom retains aligned camera media while leaving legacy GIF siblings untransformed", () => {
  const f = createAnimationFixture();
  const cameraFrame = f.node(f.board, "div");
  const camera = f.node(cameraFrame, "img");
  camera.setAttribute("src", "blob:https://play.autodarts.io/camera");
  camera.__rect = { ...f.board.__rect };
  const legacyGif = f.node(f.board, "img");
  legacyGif.id = "gif-animation";
  legacyGif.setAttribute("src", "blob:https://play.autodarts.io/gif");
  const state = {};
  try {
    for (const level of [1.35, 1.75, 2.15]) {
      for (const intent of [{ reason: "t20-setup", segment: "T20" },
        { reason: "checkout", segment: "D5" }, { reason: "checkout", segment: "BULL" }]) {
        applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, level, speed, intent, state);
        assert.equal(camera.style.transform, f.layers[0].style.transform);
        assert.match(camera.style.transform, new RegExp(`scale\\(${level.toFixed(4)}\\)`));
        assert.equal(legacyGif.style.transform || "", "");
        assert.equal(f.board.style.transform || "", "");
      }
    }
  } finally { resetZoom(speed, state, true); }
  assert.equal(camera.style.transform || "", "");
});

test("passive resync during partial and complete native zoom transitions cannot change the focus", () => {
  const f = createAnimationFixture();
  const state = {};
  const original = f.layers.map((layer) => ({ ...layer.__rect }));
  try {
    const data = applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    const transform = f.layers[0].style.transform;
    for (const progress of [0.25, 0.75, 1]) {
      f.layers.forEach((layer, index) => { layer.__rect = { left: original[index].left + data.tx * progress,
        top: original[index].top + data.ty * progress, width: original[index].width * (1 + 1.75 * progress),
        height: original[index].height * (1 + 1.75 * progress) }; });
      applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
        speed, { reason: "checkout", segment: "D18" }, state);
      assert.equal(f.layers[0].style.transform, transform);
      assert.equal(resolveBoardRenderSurface(f.documentRef).zoomTarget, f.board);
    }
    f.layers[2].style.transform = "";
    assert.equal(hasHealthyZoomSurface(state), false);
    f.layers[2].__rect = original[2];
    applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    assert.equal(hasHealthyZoomSurface(state), true);
    assert.equal(f.layers[2].style.transform, transform);
  } finally { resetZoom(speed, state, true); }
});

test("native delayed reset retains clipping through the transition and preserves foreign layer styles", () => {
  const f = createAnimationFixture();
  const timers = createFakeTimerHarness();
  timers.installGlobals();
  const state = {};
  try {
    applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    resetZoom(speed, state);
    assert.equal(f.host.style.overflow, "hidden");
    f.layers[2].style.setProperty("transform", "rotate(2deg)", "important");
    timers.advance(1000);
    assert.equal(f.host.style.overflow || "", "");
    assert.equal(f.layers[2].style.transform, "rotate(2deg)");
    assert.equal(f.layers[2].style.getPropertyPriority("transform"), "important");
  } finally { resetZoom(speed, state, true); timers.restoreGlobals(); }
});

test("a collapsed auxiliary SVG cannot prevent visible board layers from zooming", () => {
  const f = createAnimationFixture();
  f.layers[2].__rect = { left: 0, top: 0, width: 0, height: 0 };
  const state = {};
  try {
    const data = applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    assert.ok(data);
    assert.match(f.layers[0].style.transform, /scale/);
    assert.equal(f.layers[2].style.transform || "", "");
    assert.equal(hasHealthyZoomSurface(state), true);
    f.layers[2].__rect = { ...f.board.__rect };
    applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    assert.equal(f.layers[2].style.transform, f.layers[0].style.transform);
  } finally { resetZoom(speed, state, true); }
});

test("an unsupported nested board shape never falls back to zooming a Tools measurement frame", () => {
  const f = createAnimationFixture();
  f.layers[1].appendChild(f.layers[0]);
  const state = {};
  try {
    applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    assert.equal(f.board.style.transform || "", "");
    assert.equal(hasHealthyZoomSurface(state), false);
  } finally { resetZoom(speed, state, true); }
});

test("the older aspect-square Tools measurement frame remains stable during zoom", () => {
  const f = createAnimationFixture();
  f.board.removeAttribute("role");
  f.board.removeAttribute("aria-label");
  f.board.classList.add("aspect-square");
  const state = {};
  try {
    applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
      speed, { reason: "checkout", segment: "D18" }, state);
    assert.equal(f.board.style.transform || "", "");
    assert.match(f.layers[0].style.transform, /scale/);
  } finally { resetZoom(speed, state, true); }
});

test("a frame gaining the Tools measurement hook drops its old container transform before zooming layers", () => {
  const f = createAnimationFixture();
  f.board.removeAttribute("role");
  f.board.removeAttribute("aria-label");
  const nodes = { targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] };
  const intent = { reason: "checkout", segment: "D18" };
  const state = {};
  try {
    applyZoom(nodes, 2.75, speed, intent, state);
    assert.match(f.board.style.transform, /scale/);
    f.board.classList.add("aspect-square");
    applyZoom(nodes, 2.75, speed, intent, state);
    assert.equal(f.board.style.transform || "", "");
    assert.match(f.layers[0].style.transform, /scale/);
  } finally { resetZoom(speed, state, true); }
});

test("restoring the shared GIF priority flag cannot replay effects or leave the overlay uncovered", () => {
  const f = createAnimationFixture();
  addToolsGif(f);
  const states = [];
  const controller = acquire(f, (active) => states.push(active));
  try {
    f.documentRef.documentElement.removeAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE);
    f.documentRef.flushMutations([{ type: "attributes", target: f.documentRef.documentElement,
      attributeName: TOOLS_ANIMATION_ACTIVE_ATTRIBUTE }]);
    assert.equal(f.documentRef.documentElement.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE), "true");
    assert.deepEqual(states, [true]);
  } finally { controller.release(); }
});

test("zoom apply and reset leave Tools board and full-page geometry and fit untouched", () => {
  const presentations = ["https://example.test/finish.gif", "blob:https://play.autodarts.io/upload"].flatMap((src) =>
    ["contain", "cover"].flatMap((fit) => [false, true].map((fullPage) => ({ src, fit, fullPage }))));
  for (const { src, fit, fullPage } of presentations) {
    const f = createAnimationFixture();
    const gif = addToolsGif(f, src);
    gif.wrapper.style.setProperty("width", "77vw", "important");
    gif.wrapper.style.setProperty("inset", fullPage ? "0" : "auto");
    gif.wrapper.classList.toggle("backdrop-blur", fullPage);
    gif.media.style.setProperty("object-fit", fit);
    const state = {};
    try {
      applyZoom({ targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] }, 2.75,
        speed, { reason: "checkout", segment: "D18" }, state);
      assert.equal(gif.wrapper.style.width, "77vw");
      assert.equal(gif.media.style.objectFit, fit);
      assert.equal(gif.wrapper.style.getPropertyValue("inset"), fullPage ? "0" : "auto");
      assert.equal(gif.root.querySelector("style"), null);
    } finally { resetZoom(speed, state, true); }
    assert.equal(gif.wrapper.style.width, "77vw");
    assert.equal(gif.media.style.objectFit, fit);
  }
});

function acquire(f, onChange) {
  return acquireToolsAnimationLayerController({ ...f, onChange });
}

function notify(f) {
  f.documentRef.flushMutations([{ type: "childList", target: f.documentRef.main,
    addedNodes: [], removedNodes: [] }]);
}

test("empty and late Tools hosts do not suppress darts until an animation wrapper arrives", () => {
  const f = createAnimationFixture();
  const controller = acquire(f);
  try {
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    const gif = addToolsGif(f, "blob:https://play.autodarts.io/upload");
    gif.wrapper.remove();
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    gif.root.appendChild(gif.wrapper);
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    assert.equal(f.documentRef.documentElement.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE), "true");
    gif.host.remove();
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false);
  } finally { controller.release(); }
});

for (const source of ["https://example.test/finish.gif", "https://example.test/media?id=42", "blob:https://play.autodarts.io/upload"]) {
  test(`Tools animation lifecycle keeps priority through transparent fades and source changes: ${source}`, () => {
    const f = createAnimationFixture();
    const gif = addToolsGif(f, source);
    gif.wrapper.style.setProperty("width", "77vw", "important");
    gif.media.style.setProperty("object-fit", "cover");
    gif.media.style.setProperty("opacity", "0");
    const controller = acquire(f);
    try {
      assert.equal(isToolsAnimationActive(f.documentRef), true, "fade-in/loading keeps priority");
      gif.media.style.opacity = "1";
      notify(f);
      gif.media.style.opacity = "0";
      notify(f);
      assert.equal(isToolsAnimationActive(f.documentRef), true, "fade-out keeps priority until wrapper removal");
      gif.media.setAttribute("src", "blob:https://play.autodarts.io/next");
      notify(f);
      assert.equal(isToolsAnimationActive(f.documentRef), true);
      gif.wrapper.remove();
      notify(f);
      assert.equal(isToolsAnimationActive(f.documentRef), false);
      assert.equal(gif.wrapper.style.width, "77vw");
      assert.equal(gif.wrapper.style.getPropertyPriority("width"), "important");
      assert.equal(gif.media.style.objectFit, "cover");
      assert.equal(gif.root.querySelector("style"), null);
    } finally { controller.release(); }
  });
}

test("hidden, failed and unrelated media do not retain GIF priority", () => {
  const f = createAnimationFixture();
  f.node(f.documentRef.main, "img").setAttribute("src", "https://example.test/avatar.gif");
  const controller = acquire(f);
  try {
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    const gif = addToolsGif(f);
    gif.wrapper.style.display = "none";
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    gif.wrapper.style.display = "";
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    gif.media.dispatchEvent({ type: "error", bubbles: true, target: gif.media });
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    gif.media.setAttribute("src", "blob:https://play.autodarts.io/replacement");
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    gif.host.hidden = true;
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    gif.host.hidden = false;
    gif.wrapper.style.opacity = "0";
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false, "a transparent wrapper is no visible animation");
  } finally { controller.release(); }
});

test("legacy board GIFs are detected without treating arbitrary document GIFs as animations", () => {
  const f = createAnimationFixture();
  const legacy = f.node(f.host, "div", "showAnimations");
  const media = f.node(legacy, "img");
  media.id = "gif-animation";
  media.setAttribute("src", "blob:https://play.autodarts.io/legacy");
  const controller = acquire(f);
  try {
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    media.hidden = true;
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    media.hidden = false;
    media.style.opacity = "0";
    media.dispatchEvent({ type: "transitionend", bubbles: true, target: media });
    assert.equal(isToolsAnimationActive(f.documentRef), false);
  } finally { controller.release(); }
});

test("hiding a legacy animation container or its ancestor releases GIF priority", () => {
  const f = createAnimationFixture();
  const legacy = f.node(f.host, "div", "showAnimations");
  const media = f.node(legacy, "img");
  media.id = "gif-animation";
  media.setAttribute("src", "blob:https://play.autodarts.io/legacy");
  const controller = acquire(f);
  try {
    for (const node of [legacy, f.host]) {
      for (const property of ["display", "opacity"]) {
        node.style[property] = property === "display" ? "none" : "0";
        notify(f);
        assert.equal(isToolsAnimationActive(f.documentRef), false, `${property} on the container ancestry`);
        node.style[property] = "";
        notify(f);
        assert.equal(isToolsAnimationActive(f.documentRef), true);
      }
    }
  } finally { controller.release(); }
});

test("unrelated GIF images inside a legacy board are not treated as Tools animations", () => {
  const f = createAnimationFixture();
  const legacy = f.node(f.host, "div", "showAnimations");
  f.node(legacy, "img").setAttribute("src", "https://example.test/avatar.gif");
  const controller = acquire(f);
  try { assert.equal(isToolsAnimationActive(f.documentRef), false); }
  finally { controller.release(); }
});

test("legacy fade-out keeps GIF priority until computed opacity reaches zero", () => {
  const f = createAnimationFixture();
  const legacy = f.node(f.host, "div", "showAnimations");
  const media = f.node(legacy, "img");
  media.id = "gif-animation";
  media.setAttribute("src", "https://example.test/animation.gif");
  let opacity = "1";
  f.windowRef.getComputedStyle = (node) => ({ opacity: node === media ? opacity : "1" });
  const controller = acquire(f);
  try {
    media.style.opacity = "0";
    opacity = "0.5";
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    opacity = "0";
    media.dispatchEvent({ type: "transitionend", target: media, bubbles: true });
    assert.equal(isToolsAnimationActive(f.documentRef), false);
  } finally { controller.release(); }
});

test("an image that failed before controller mount cannot leave darts permanently suppressed", () => {
  const f = createAnimationFixture();
  const gif = addToolsGif(f);
  gif.media.complete = true;
  gif.media.naturalWidth = 0;
  const controller = acquire(f);
  try {
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    gif.media.complete = false;
    gif.media.setAttribute("src", "blob:https://play.autodarts.io/retry");
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), true, "a new loading GIF reserves priority");
  } finally { controller.release(); }
});

test("late subscribers receive the current GIF state without notifying existing consumers again", () => {
  const f = createAnimationFixture();
  addToolsGif(f);
  const firstStates = [];
  const first = acquire(f, (active) => firstStates.push(active));
  const secondStates = [];
  const second = acquire(f, (active) => secondStates.push(active));
  try {
    assert.deepEqual(firstStates, [true]);
    assert.deepEqual(secondStates, [true]);
  } finally { second.release(); first.release(); }
});

test("dart animation attribute updates do not trigger global GIF scans", () => {
  const f = createAnimationFixture();
  addToolsGif(f);
  const dart = f.node(f.documentRef.body, "svg");
  const controller = acquire(f);
  const documentObserver = f.documentRef.__mutationObservers.find((observer) =>
    observer.observeCalls.some(({ target }) => target === f.documentRef.documentElement));
  const query = f.documentRef.querySelectorAll.bind(f.documentRef);
  let scans = 0;
  f.documentRef.querySelectorAll = (selector) => { scans += 1; return query(selector); };
  try {
    for (let frame = 0; frame < 60; frame += 1) {
      dart.style.transform = `translate(${frame}px)`;
      // Real observers do not deliver light-DOM changes to a ShadowRoot observer.
      documentObserver.callback([{ type: "attributes", attributeName: "style", target: dart }]);
    }
    assert.equal(scans, 0);
    assert.equal(isToolsAnimationActive(f.documentRef), true);
  } finally { controller.release(); }
});

test("all consumers share one controller and stale shadow roots are disconnected", () => {
  const f = createAnimationFixture();
  const firstGif = addToolsGif(f);
  const secondGif = addToolsGif(f);
  const consumers = [acquire(f), acquire(f), acquire(f)];
  const liveObservers = () => f.documentRef.__mutationObservers.filter((observer) => !observer.disconnected);
  try {
    assert.equal(liveObservers().length, 3, "one document observer plus two shadow roots");
    firstGif.host.remove();
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), true, "second GIF still owns priority");
    assert.equal(liveObservers().length, 2);
    const replacement = f.documentRef.createElement("div");
    secondGif.host.shadowRoot = replacement;
    notify(f);
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    assert.equal(liveObservers().length, 2);
    replacement.appendChild(secondGif.wrapper);
    notify(f);
    consumers[0].release();
    consumers[1].release();
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    assert.equal(liveObservers().length, 2);
  } finally { consumers.forEach((controller) => controller.release()); }
  assert.equal(liveObservers().length, 0);
  assert.equal(f.documentRef.documentElement.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE), null);
  const remount = acquire(f);
  assert.equal(isToolsAnimationActive(f.documentRef), true);
  remount.release();
});

test("a shadow root attached after its host hydrates is discovered and its pending timer is cleaned", () => {
  const f = createAnimationFixture();
  const timers = createFakeTimerHarness();
  timers.installOnWindow(f.windowRef);
  const gif = addToolsGif(f);
  gif.host.shadowRoot = null;
  const controller = acquire(f);
  try {
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    gif.host.shadowRoot = gif.root;
    timers.advance(250);
    assert.equal(isToolsAnimationActive(f.documentRef), true);
  } finally { controller.release(); }
  timers.advance(1000);
  assert.equal(isToolsAnimationActive(f.documentRef), false);
});

function startFeatures({ bustTarget = "impact", enabled = [true, true, true], order = [0, 1, 2], animateDarts = true, manual = false, hardware = false, initialGif = false, prepareInitialGif = null, initialLegacyRootParent = "", initialLegacyGif = false, prepareInitialLegacyRoot = null, prepareInitialLegacyGif = null, initialBust = false } = {}) {
  const f = createAnimationFixture();
  const timers = createFakeTimerHarness();
  timers.installOnWindow(f.windowRef);
  timers.installGlobals();
  if (manual) {
    const viewport = f.node(f.documentRef.main, "div");
    viewport.__rect = { ...f.host.__rect };
    viewport.appendChild(f.host);
    f.host.style.touchAction = "none";
  }
  const legacyRootParent = initialLegacyRootParent === "board"
    ? f.board
    : initialLegacyRootParent === "host" ? f.host : null;
  const initialLegacyRoot = legacyRootParent
    ? f.node(legacyRootParent, "div", "showAnimations")
    : null;
  if (initialLegacyRoot) {
    prepareInitialLegacyRoot?.({ root: initialLegacyRoot });
  }
  const initialLegacyToolsGif = initialLegacyRoot && initialLegacyGif
    ? addLegacyToolsGif(f, initialLegacyRoot, undefined, prepareInitialLegacyGif)
    : null;
  let soundCount = 0;
  f.windowRef.Audio = class {
    play() { if (this.volume > 0.1) soundCount += 1; return Promise.resolve(); }
    pause() {}
  };
  const marker = f.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", "420");
  marker.setAttribute("cy", "320");
  marker.setAttribute("r", "5");
  marker.setAttribute("data-hit", "1");
  marker.setAttribute("filter", "url(#shadow-2dp)");
  marker.__rect = { left: 940, top: 300, width: 6, height: 6 };
  f.layers[3].appendChild(marker);
  const context = { ...f, domGuards: createDomGuards(f),
    registries: { observers: createObserverRegistry(), listeners: createListenerRegistry() },
    gameState: { isX01Variant: () => true, getSnapshot: () => hardware ? {
      activePlayerIndex: 0,
      match: { player: 0, players: [{ boardId: "board-123" }] },
    } : null, subscribe: () => () => {} },
    domain: { x01Rules }, config: { getFeatureConfig(key) {
      if (key === "x01BustActivePlayerHighlight") return { effectTarget: bustTarget, crackCount: 2, soundEnabled: true };
      if (key === "dartMarkerReplacer") return { animateDarts, enableShadow: true };
      return { checkoutZoomEnabled: true, zoomLevel: 1.75, zoomSpeed: "mittel" };
    } }, helpers: { createRafScheduler: (callback, options = {}) => createRafScheduler(callback, { ...options, windowRef: f.windowRef }) } };
  const mounts = [initializeTvBoardZoom, initializeDartMarkerReplacer, mountX01BustActivePlayerHighlight];
  const initialToolsGif = initialGif ? addToolsGif(f, undefined, prepareInitialGif) : null;
  if (initialBust) f.total.textContent = "BUST";
  const cleanup = [];
  order.forEach((index) => { if (enabled[index]) cleanup.push(mounts[index](context)); });
  function tick() {
    f.documentRef.flushMutations([{ type: "childList", target: f.documentRef.main, addedNodes: [], removedNodes: [] },
      { type: "childList", target: f.layers[3], addedNodes: [], removedNodes: [] }]);
    timers.advance(25);
  }
  timers.advance(25);
  return { ...f, timers, tick, initialToolsGif, initialLegacyRoot, initialLegacyToolsGif,
    get soundCount() { return soundCount; },
    stop() { cleanup.reverse().forEach((release) => release()); timers.restoreGlobals(); } };
}

function assertBustTargetClasses(fixture, target) {
  const targetNode = target === "player-card"
    ? fixture.card
    : target === "board" ? fixture.board : fixture.documentRef.main;
  assert.equal(
    targetNode.classList.contains(BUST_ACTIVE_CLASS),
    target === "player-card",
    `${target} player-card class`
  );
  assert.equal(
    targetNode.classList.contains(BUST_SURFACE_CLASS),
    target !== "player-card",
    `${target} surface class`
  );
  assert.equal(
    targetNode.classList.contains(BUST_BOARD_SURFACE_CLASS),
    target === "board",
    `${target} board-only class`
  );
}

for (const target of ["player-card", "board", "screen", "impact"]) {
  for (const zoom of [false, true]) {
    test(`GIF priority preserves ${target} BUST state and dart identity, zoom=${zoom}`, () => {
      const f = startFeatures({ bustTarget: target, enabled: [zoom, true, true] });
      try {
        const dart = f.documentRef.querySelector(".ad-ext-dart-flight-group");
        assert.ok(dart, "real dart feature has rendered its marker");
        f.total.textContent = "BUST";
        f.tick();
        const cracks = f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
        assert.ok(cracks);
        const sounds = f.soundCount;
        assert.equal(sounds, 1);
        const gif = addToolsGif(f, "blob:https://play.autodarts.io/upload");
        f.tick();
        assert.equal(isToolsAnimationActive(f.documentRef), true);
        assert.equal(f.documentRef.querySelector(".ad-ext-dart-flight-group"), dart);
        assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), cracks);
        assertBustTargetClasses(f, target);
        gif.wrapper.remove();
        f.tick();
        assert.equal(isToolsAnimationActive(f.documentRef), false);
        assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), cracks);
        assert.equal(f.soundCount, sounds);
        assertBustTargetClasses(f, target);
        f.total.textContent = "85";
        f.tick();
        assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
      } finally { f.stop(); }
    });
  }
}

for (const order of [[0, 1, 2], [0, 2, 1], [2, 1, 0], [2, 0, 1], [1, 0, 2], [1, 2, 0]]) {
  for (let mask = 1; mask < 8; mask += 1) {
    test(`feature combination ${mask} shares GIF priority in mount order ${order}`, () => {
      const f = startFeatures({ enabled: [Boolean(mask & 1), Boolean(mask & 2), Boolean(mask & 4)], order });
      try {
        const gif = addToolsGif(f);
        f.tick();
        assert.equal(isToolsAnimationActive(f.documentRef), true);
        gif.host.remove();
        f.tick();
        assert.equal(isToolsAnimationActive(f.documentRef), false);
      } finally { f.stop(); }
      assert.equal(f.documentRef.documentElement.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE), null);
    });
  }
}

for (const target of ["player-card", "board", "screen", "impact"]) {
  test(`mounting ${target} BUST into an already active GIF preserves priority and never replays the effect`, () => {
    const f = startFeatures({ bustTarget: target, initialGif: true, initialBust: true });
    try {
      assert.equal(isToolsAnimationActive(f.documentRef), true);
      const cracks = f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
      assert.ok(cracks);
      assertBustTargetClasses(f, target);
      const sounds = f.soundCount;
      f.documentRef.querySelector("autodarts-tools-animations").remove();
      f.tick();
      assert.ok(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`) === cracks);
      assert.equal(f.soundCount, sounds);
    } finally { f.stop(); }
  });
}

test("1000 GIF cycles retain dart/crack identity and release all observers, listeners and timers on shutdown", () => {
  const f = startFeatures({ bustTarget: "impact", initialBust: true });
  try {
    const dart = f.documentRef.querySelector(".ad-ext-dart-flight-group");
    const cracks = f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
    assert.ok(dart && cracks);
    const sounds = f.soundCount;
    f.timers.advance(1000);
    f.tick();
    const observers = () => f.documentRef.__mutationObservers.filter((observer) => !observer.disconnected).length;
    const baseline = observers();
    const timerCount = f.timers.pendingCount;
    for (let cycle = 0; cycle < 1000; cycle += 1) {
      const gif = addToolsGif(f, `blob:https://play.autodarts.io/${cycle}`);
      f.tick();
      assert.equal(isToolsAnimationActive(f.documentRef), true);
      assert.equal(observers(), baseline + 1);
      gif.host.remove();
      f.tick();
      assert.equal(isToolsAnimationActive(f.documentRef), false);
      assert.equal(observers(), baseline);
      assert.ok(f.documentRef.querySelector(".ad-ext-dart-flight-group") === dart);
      assert.ok(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`) === cracks);
      assert.ok(f.timers.pendingCount <= timerCount);
    }
    assert.equal(f.soundCount, sounds);
  } finally { f.stop(); }
  assert.equal(f.documentRef.__mutationObservers.filter((observer) => !observer.disconnected).length, 0);
  assert.equal(f.documentRef.documentElement.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE), null);
  assert.equal(f.timers.pendingCount, 0);
  assert.equal(f.windowRef.__eventTarget.listenerCount(), 0);
});

test("GIF before BUST renders the player card immediately and does not resurrect an obsolete effect", () => {
  const f = startFeatures({ bustTarget: "player-card" });
  try {
    f.card.style.setProperty("background", "blue", "important");
    const gif = addToolsGif(f);
    f.tick();
    f.total.textContent = "BUST";
    f.tick();
    assert.equal(f.card.classList.contains(BUST_ACTIVE_CLASS), true);
    assert.notEqual(f.card.style.getPropertyValue("background"), "blue");
    assert.equal(f.score.textContent, "36");
    assert.ok(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`));
    f.total.textContent = "85";
    f.tick();
    gif.wrapper.remove();
    f.tick();
    assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
    assert.equal(f.card.classList.contains(BUST_ACTIVE_CLASS), false);
    assert.equal(f.card.style.getPropertyValue("background"), "blue");
    assert.equal(f.soundCount, 1);
  } finally { f.stop(); }
});

test("closing a Tools GIF does not dismiss the visible screen BUST effect", () => {
  const f = startFeatures({ bustTarget: "screen" });
  try {
    f.total.textContent = "BUST";
    f.tick();
    const cracks = f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
    assert.ok(cracks);
    const gif = addToolsGif(f);
    f.tick();
    // Window capture runs before Tools closes its overlay; shadow events retarget to the host.
    f.windowRef.dispatchEvent({ type: "click", target: gif.host });
    gif.wrapper.remove();
    f.tick();
    assert.ok(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`) === cracks);
    assert.equal(f.soundCount, 1);
    f.windowRef.dispatchEvent({ type: "click", target: f.documentRef.main });
    assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  } finally { f.stop(); }
});

test("Tools host insertion disables manual pointer zoom and removing it restores the existing safe zoom", () => {
  const f = startFeatures({ enabled: [true, false, false], manual: true });
  try {
    assert.match(f.host.style.transform, /scale/);
    const gif = addToolsGif(f);
    gif.wrapper.remove();
    f.tick();
    assert.equal(f.host.style.transform || "", "");
    assert.equal(f.board.style.transform || "", "");
    f.layers.forEach((layer) => assert.equal(layer.style.transform || "", ""));
    gif.host.remove();
    f.tick();
    assert.match(f.host.style.transform, /scale/);
  } finally { f.stop(); }
});

test("pre-existing Tools GIF stays presentation-identical through hardware zoom targeting and zoom-out", () => {
  let initialPresentation = null;
  const f = startFeatures({
    enabled: [true, false, false],
    manual: true,
    hardware: true,
    initialGif: true,
    prepareInitialGif(gif) {
      seedToolsPresentation(gif);
      initialPresentation = snapshotToolsPresentation(gif);
    },
  });
  const gif = f.initialToolsGif;
  let expectedIdentity = snapshotToolsIdentity(gif);
  try {
    assert.deepEqual(snapshotToolsPresentation(gif), initialPresentation);
    assertToolsIdentity(gif, expectedIdentity);
    assert.equal(f.host.style.transform || "", "");
    const firstTransform = f.layers[0].style.transform;
    assert.match(firstTransform, /scale\(1\.750*\)/);
    f.layers.forEach((layer) => assert.equal(layer.style.transform, firstTransform));

    f.score.textContent = "4";
    f.setVisit([], ["D2"]);
    f.tick();
    const retargetedTransform = f.layers[0].style.transform;
    assert.match(retargetedTransform, /scale\(1\.750*\)/);
    assert.notEqual(retargetedTransform, firstTransform);
    assert.deepEqual(snapshotToolsPresentation(gif), initialPresentation);
    assertToolsIdentity(gif, expectedIdentity);

    const mediaAnimationCount = gif.media.__animations.length;
    gif.wrapper.remove();
    const endedPresentation = snapshotToolsPresentation(gif);
    expectedIdentity = snapshotToolsIdentity(gif);
    f.tick();
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    assert.equal(f.layers[0].style.transform, retargetedTransform);
    assert.deepEqual(snapshotToolsPresentation(gif), endedPresentation);
    assertToolsIdentity(gif, expectedIdentity);
    assert.equal(gif.media.__animations.length, mediaAnimationCount);

    gif.root.appendChild(gif.wrapper);
    const restartedPresentation = snapshotToolsPresentation(gif);
    expectedIdentity = snapshotToolsIdentity(gif);
    f.tick();
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    f.player.textContent = "Player 2";
    f.score.textContent = "301";
    f.total.textContent = "0";
    f.setVisit([], []);
    f.tick();
    assert.deepEqual(snapshotToolsPresentation(gif), restartedPresentation);
    assertToolsIdentity(gif, expectedIdentity);
    assert.equal(gif.media.__animations.length, mediaAnimationCount);
    f.timers.advance(500);
    f.layers.forEach((layer) => assert.equal(layer.style.transform || "", ""));
    assert.deepEqual(snapshotToolsPresentation(gif), restartedPresentation);
    assertToolsIdentity(gif, expectedIdentity);
  } finally { f.stop(); }
});

test("late Tools host mount swaps hardware zoom to inner layers and removal restores one clean wrapper zoom", () => {
  const f = startFeatures({ enabled: [true, false, false], manual: true, hardware: true });
  try {
    assert.match(f.host.style.transform, /scale\(1\.750*\)/);
    f.layers.forEach((layer) => assert.equal(layer.style.transform || "", ""));

    const gif = addToolsGif(f, undefined, seedToolsPresentation);
    const presentation = snapshotToolsPresentation(gif);
    let expectedIdentity = snapshotToolsIdentity(gif);
    f.tick();

    assert.equal(f.host.style.transform || "", "");
    assert.equal(f.host.classList.contains("ad-ext-tv-board-zoom"), false);
    const innerTransform = f.layers[0].style.transform;
    assert.match(innerTransform, /scale\(1\.750*\)/);
    f.layers.forEach((layer) => assert.equal(layer.style.transform, innerTransform));
    assert.deepEqual(snapshotToolsPresentation(gif), presentation);
    assertToolsIdentity(gif, expectedIdentity);

    gif.host.remove();
    const removedPresentation = snapshotToolsPresentation(gif);
    expectedIdentity = snapshotToolsIdentity(gif);
    f.tick();
    assert.match(f.host.style.transform, /scale\(1\.750*\)/);
    assert.equal(f.host.classList.contains("ad-ext-tv-board-zoom"), true);
    f.layers.forEach((layer) => assert.equal(layer.style.transform || "", ""));
    assert.deepEqual(snapshotToolsPresentation(gif), removedPresentation);
    assertToolsIdentity(gif, expectedIdentity);
  } finally { f.stop(); }
});

test("persistent legacy Tools root keeps one hardware zoom target before, during and after its GIF", () => {
  let initialRootPresentation = null;
  const f = startFeatures({
    enabled: [true, false, false],
    manual: true,
    hardware: true,
    initialLegacyRootParent: "host",
    prepareInitialLegacyRoot(gif) {
      seedToolsPresentation(gif);
      initialRootPresentation = snapshotToolsPresentation(gif);
    },
  });
  const root = f.initialLegacyRoot;
  try {
    const transform = f.layers[0].style.transform;
    const transitions = f.layers.map((layer) => layer.style.transition);
    assert.match(transform, /scale\(1\.750*\)/);
    f.layers.forEach((layer) => assert.equal(layer.style.transform, transform));
    assert.equal(f.host.style.transform || "", "");
    assert.equal(f.host.style.overflow || "", "");
    assert.equal(f.host.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(f.board.classList.contains(ZOOM_HOST_CLASS), true);
    assert.equal(f.board.style.overflow, "hidden");
    assert.deepEqual(snapshotToolsPresentation({ root }), initialRootPresentation);

    const gif = addLegacyToolsGif(f, root, undefined, (value) =>
      seedToolsPresentation({ wrapper: value.wrapper, media: value.media }));
    const activePresentation = snapshotToolsPresentation(gif);
    let expectedIdentity = snapshotToolsIdentity(gif);
    f.tick();
    assert.equal(isToolsAnimationActive(f.documentRef), true);
    assert.equal(f.layers[0].style.transform, transform);
    assert.deepEqual(f.layers.map((layer) => layer.style.transition), transitions);
    assert.deepEqual(snapshotToolsPresentation(gif), activePresentation);
    assertToolsIdentity(gif, expectedIdentity);

    gif.wrapper.remove();
    const endedPresentation = snapshotToolsPresentation(gif);
    expectedIdentity = snapshotToolsIdentity(gif);
    f.tick();
    assert.equal(isToolsAnimationActive(f.documentRef), false);
    assert.equal(f.layers[0].style.transform, transform);
    assert.deepEqual(f.layers.map((layer) => layer.style.transition), transitions);
    assert.deepEqual(snapshotToolsPresentation(gif), endedPresentation);
    assertToolsIdentity(gif, expectedIdentity);
    assert.equal(f.board.classList.contains(ZOOM_HOST_CLASS), true);
    assert.equal(root.classList.contains(ZOOM_CLASS), false);
    assert.equal(root.classList.contains(ZOOM_HOST_CLASS), false);
  } finally { f.stop(); }
});

test("unsafe legacy Tools nesting stays fail-closed without writing presentation styles", () => {
  let initialPresentation = null;
  const f = startFeatures({
    enabled: [true, false, false],
    manual: true,
    hardware: true,
    initialLegacyRootParent: "board",
    initialLegacyGif: true,
    prepareInitialLegacyRoot(gif) {
      seedToolsPresentation(gif);
    },
    prepareInitialLegacyGif(gif) {
      seedToolsPresentation({ wrapper: gif.wrapper, media: gif.media });
      initialPresentation = snapshotToolsPresentation(gif);
    },
  });
  const expectedIdentity = snapshotToolsIdentity(f.initialLegacyToolsGif);
  try {
    assert.equal(f.host.classList.contains(ZOOM_CLASS), false);
    assert.equal(f.host.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    assert.equal(f.board.classList.contains(ZOOM_HOST_CLASS), false);
    f.layers.forEach((layer) => assert.equal(layer.style.transform || "", ""));
    assert.deepEqual(snapshotToolsPresentation(f.initialLegacyToolsGif), initialPresentation);
    assertToolsIdentity(f.initialLegacyToolsGif, expectedIdentity);
  } finally { f.stop(); }
});

test("protected legacy root blocks an unsafe direct zoom binding before any style write", () => {
  const f = createAnimationFixture();
  const root = f.node(f.host, "div", "showAnimations");
  const state = {};
  try {
    const result = applyZoom(
      { targetNode: f.board, hostNode: f.host, boardSvg: f.layers[0] },
      2.75,
      speed,
      { reason: "checkout", segment: "D18" },
      state,
      { protectedAnimationRoots: [root] }
    );
    assert.equal(result, null);
    assert.equal(f.host.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(f.host.style.overflow || "", "");
    f.layers.forEach((layer) => assert.equal(layer.style.transform || "", ""));
  } finally { resetZoom(speed, state, true); }
});

for (const animateDarts of [true, false]) {
  test(`a new dart during GIF is reconciled without replaying existing flights, animate=${animateDarts}`, () => {
    const f = startFeatures({ enabled: [false, true, false], animateDarts });
    try {
      const first = f.documentRef.querySelector(".ad-ext-dart-flight-group");
      const animations = first.__animations?.length || 0;
      const gif = addToolsGif(f);
      const newMarker = f.layers[3].querySelector("circle").cloneNode(true);
      newMarker.setAttribute("cx", "650");
      newMarker.setAttribute("cy", "520");
      newMarker.__rect = { left: 1050, top: 450, width: 6, height: 6 };
      f.layers[3].appendChild(newMarker);
      f.tick();
      assert.equal(isToolsAnimationActive(f.documentRef), true);
      const darts = f.documentRef.querySelectorAll(".ad-ext-dart-flight-group");
      assert.equal(darts.length, 2);
      assert.equal(darts[0], first);
      assert.equal(first.__animations?.length || 0, animations);
      gif.host.remove();
      f.tick();
      assert.equal(f.documentRef.querySelectorAll(".ad-ext-dart-flight-group").length, 2);
      assert.equal(first.__animations?.length || 0, animations);
    } finally { f.stop(); }
  });
}

for (const count of [1, 2, 3]) {
  test(`simultaneous GIF and BUST on dart ${count} retains the current effect until the player changes`, () => {
    const f = startFeatures();
    try {
      f.setVisit(["T20", "T20", "D20"].slice(0, count), []);
      f.total.textContent = "BUST";
      const gif = addToolsGif(f);
      f.tick();
      const cracks = f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
      assert.ok(cracks);
      assert.equal(isToolsAnimationActive(f.documentRef), true);
      assert.equal(f.soundCount, 1);
      f.player.textContent = "Player 2";
      f.score.textContent = "301";
      f.total.textContent = "0";
      f.setVisit([], []);
      f.tick();
      assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
      gif.host.remove();
      f.tick();
      assert.equal(f.documentRef.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
      assert.equal(f.soundCount, 1);
    } finally { f.stop(); }
  });
}

test("GIF transitions keep BUST card visuals and preserve newer third-party inline styles", () => {
  const f = startFeatures({ bustTarget: "player-card" });
  try {
    f.card.style.setProperty("background", "blue", "important");
    f.card.style.setProperty("border", "1px solid green");
    f.total.textContent = "BUST";
    f.tick();
    const cracks = f.card.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
    const bustBackground = f.card.style.getPropertyValue("background");
    assert.notEqual(bustBackground, "blue");
    const gif = addToolsGif(f);
    f.tick();
    assert.equal(f.card.classList.contains(BUST_ACTIVE_CLASS), true);
    assert.equal(f.card.style.getPropertyValue("background"), bustBackground);
    assert.ok(f.card.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`) === cracks);
    f.card.style.setProperty("background", "purple");
    gif.host.remove();
    f.tick();
    assert.equal(f.card.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), cracks);
    f.card.style.setProperty("border", "3px solid yellow", "important");
    f.total.textContent = "0";
    f.tick();
    assert.equal(f.card.style.getPropertyValue("background"), "purple");
    assert.equal(f.card.style.getPropertyValue("border"), "3px solid yellow");
  } finally { f.stop(); }
});

test("GIF suppression targets darts and board-only BUST decoration while screen effects stay interactive-safe", () => {
  const attribute = `${TOOLS_ANIMATION_ACTIVE_ATTRIBUTE}="true"`;
  const css = bustCss();
  assert.ok(dartCss().includes(`html[${attribute}] #ad-ext-dart-image-overlay *`));
  assert.match(dartCss(), /visibility: hidden !important/);
  assert.ok(css.includes(`html[${attribute}] .${BUST_BOARD_SURFACE_CLASS}::before`));
  assert.ok(css.includes(
    `html[${attribute}] .${BUST_BOARD_SURFACE_CLASS} > .${BUST_CRACK_OVERLAY_CLASS} *`
  ));
  assert.match(css, /visibility: hidden !important;\s*pointer-events: none !important/);
  const nonBoardRuleStart = css.indexOf(
    `html[${attribute}] .${BUST_SURFACE_CLASS}:not(.${BUST_BOARD_SURFACE_CLASS})::before`
  );
  assert.notEqual(nonBoardRuleStart, -1);
  const nonBoardRule = css.slice(nonBoardRuleStart, css.indexOf("}", nonBoardRuleStart) + 1);
  assert.match(nonBoardRule, /pointer-events: none !important/);
  assert.doesNotMatch(nonBoardRule, /visibility:\s*hidden/);
});
