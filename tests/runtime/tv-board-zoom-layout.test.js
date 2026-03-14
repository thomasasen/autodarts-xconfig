import test from "node:test";
import assert from "node:assert/strict";

import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  applyZoom,
  buildZoomTransform,
  resetZoom,
  resolveZoomTarget,
  resolveSegmentPoint,
} from "../../src/features/tv-board-zoom/logic.js";
import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "../../src/features/tv-board-zoom/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function createZoomState() {
  return {
    zoomedElement: null,
    zoomHost: null,
    activeIntent: null,
    holdUntilTs: 0,
    lastTurnId: "",
    lastThrowCount: -1,
    lastAppliedSignature: "",
    releaseTimeoutId: 0,
    targetStyleSnapshot: null,
    hostStyleSnapshot: null,
  };
}

function parseTransform(transform) {
  const match = String(transform || "").match(
    /translate\(([-+]?\d*\.?\d+)px,\s*([-+]?\d*\.?\d+)px\)\s+scale\(([-+]?\d*\.?\d+)\)/
  );
  if (!match) {
    return null;
  }
  return {
    tx: Number(match[1]),
    ty: Number(match[2]),
    scale: Number(match[3]),
  };
}

function createZoomFixture() {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const offsetParent = documentRef.createElement("div");
  offsetParent.__rect = { left: 0, top: 0, width: 1920, height: 1080 };
  documentRef.main.appendChild(offsetParent);

  const hostNode = documentRef.createElement("div");
  hostNode.classList.add("ad-ext-theme-board-viewport");
  hostNode.__rect = { left: 980, top: 40, width: 520, height: 900 };

  const targetNode = documentRef.createElement("div");
  targetNode.classList.add("showAnimations");
  targetNode.__rect = { left: 860, top: 10, width: 820, height: 1060 };
  targetNode.offsetLeft = 860;
  targetNode.offsetTop = 10;
  targetNode.offsetWidth = 820;
  targetNode.offsetHeight = 1060;
  targetNode.offsetParent = offsetParent;

  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");
  boardSvg.__rect = { left: 980, top: 120, width: 520, height: 520 };
  const outerCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerCircle.setAttribute("r", "380");
  boardSvg.appendChild(outerCircle);

  targetNode.appendChild(boardSvg);
  hostNode.appendChild(targetNode);
  offsetParent.appendChild(hostNode);

  return {
    documentRef,
    windowRef,
    hostNode,
    targetNode,
    boardSvg,
  };
}

test("tv-board-zoom keeps .showAnimations as primary zoom target when present", () => {
  const documentRef = new FakeDocument();
  const showAnimations = documentRef.createElement("div");
  showAnimations.classList.add("showAnimations");
  const stableCanvas = documentRef.createElement("div");
  stableCanvas.classList.add("ad-ext-theme-board-canvas");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  stableCanvas.appendChild(boardSvg);
  showAnimations.appendChild(stableCanvas);
  documentRef.main.appendChild(showAnimations);

  assert.equal(resolveZoomTarget(boardSvg), showAnimations);
});

test("tv-board-zoom falls back to stable board-canvas hook when .showAnimations is missing", () => {
  const documentRef = new FakeDocument();
  const stableCanvas = documentRef.createElement("div");
  stableCanvas.classList.add("ad-ext-theme-board-canvas");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  stableCanvas.appendChild(boardSvg);
  documentRef.main.appendChild(stableCanvas);

  assert.equal(resolveZoomTarget(boardSvg), stableCanvas);
});

test("tv-board-zoom keeps fail-soft parent fallback when no zoom-target selectors match", () => {
  const documentRef = new FakeDocument();
  const parent = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  parent.appendChild(boardSvg);

  assert.equal(resolveZoomTarget(boardSvg), parent);
  assert.equal(resolveZoomTarget(null), null);
});

test("tv-board-zoom builds a clamped transform that stays within the board viewport", () => {
  const { documentRef, windowRef, hostNode, targetNode, boardSvg } = createZoomFixture();
  const zoomLevel = 2.75;
  const transformData = buildZoomTransform({
    targetNode,
    hostNode,
    boardSvg,
    zoomLevel,
    intent: {
      reason: "checkout",
      segment: "D20",
    },
    x01Rules,
    windowRef,
    documentRef,
  });

  assert.ok(transformData);
  assert.ok(String(transformData.transform).includes("translate("));
  assert.ok(String(transformData.transform).includes("scale("));

  const parsed = parseTransform(transformData.transform);
  assert.ok(parsed);

  const hostRect = hostNode.getBoundingClientRect();
  const transformedLeft = targetNode.offsetLeft + parsed.tx;
  const transformedTop = targetNode.offsetTop + parsed.ty;
  const transformedRight = transformedLeft + zoomLevel * targetNode.offsetWidth;
  const transformedBottom = transformedTop + zoomLevel * targetNode.offsetHeight;

  assert.ok(transformedLeft <= hostRect.left + 0.01);
  assert.ok(transformedTop <= hostRect.top + 0.01);
  assert.ok(transformedRight >= hostRect.right - 0.01);
  assert.ok(transformedBottom >= hostRect.bottom - 0.01);
});

test("tv-board-zoom uses a corner-biased anchor for double checkout D18", () => {
  const { documentRef, windowRef, hostNode, targetNode, boardSvg } = createZoomFixture();
  const checkoutTransform = buildZoomTransform({
    targetNode,
    hostNode,
    boardSvg,
    zoomLevel: 2.75,
    intent: {
      reason: "checkout",
      segment: "D18",
    },
    x01Rules,
    windowRef,
    documentRef,
  });
  const neutralTransform = buildZoomTransform({
    targetNode,
    hostNode,
    boardSvg,
    zoomLevel: 2.75,
    intent: {
      reason: "smart-setup",
      segment: "D18",
    },
    x01Rules,
    windowRef,
    documentRef,
  });

  assert.ok(checkoutTransform);
  assert.ok(neutralTransform);
  assert.ok(checkoutTransform.anchor);
  assert.ok(neutralTransform.anchor);
  assert.ok(checkoutTransform.anchor.x > neutralTransform.anchor.x);
  assert.ok(checkoutTransform.anchor.y < neutralTransform.anchor.y);
  assert.ok(checkoutTransform.anchor.x >= 0.7);
  assert.ok(checkoutTransform.anchor.y <= 0.3);
  assert.ok(checkoutTransform.anchor.x - neutralTransform.anchor.x >= 0.18);
  assert.ok(neutralTransform.anchor.y - checkoutTransform.anchor.y >= 0.2);
});

test("tv-board-zoom applies directional corner-bias across multiple checkout doubles", () => {
  const { documentRef, windowRef, hostNode, targetNode, boardSvg } = createZoomFixture();
  const doubles = Array.from({ length: 20 }, (_, index) => `D${index + 1}`);

  doubles.forEach((segment) => {
    const checkoutTransform = buildZoomTransform({
      targetNode,
      hostNode,
      boardSvg,
      zoomLevel: 2.75,
      intent: {
        reason: "checkout",
        segment,
      },
      x01Rules,
      windowRef,
      documentRef,
    });
    const neutralTransform = buildZoomTransform({
      targetNode,
      hostNode,
      boardSvg,
      zoomLevel: 2.75,
      intent: {
        reason: "smart-setup",
        segment,
      },
      x01Rules,
      windowRef,
      documentRef,
    });
    const segmentPoint = resolveSegmentPoint(segment, boardSvg, x01Rules);

    assert.ok(checkoutTransform, `missing checkout transform for ${segment}`);
    assert.ok(neutralTransform, `missing neutral transform for ${segment}`);
    assert.ok(segmentPoint, `missing segment point for ${segment}`);

    const centerX = segmentPoint.viewBox.x + segmentPoint.viewBox.width / 2;
    const centerY = segmentPoint.viewBox.y + segmentPoint.viewBox.height / 2;
    const dx = segmentPoint.x - centerX;
    const dy = segmentPoint.y - centerY;
    const epsilon = 0.001;

    if (Math.abs(dx) > epsilon) {
      if (dx > 0) {
        assert.ok(checkoutTransform.anchor.x > neutralTransform.anchor.x, `${segment} should push right`);
      } else {
        assert.ok(checkoutTransform.anchor.x < neutralTransform.anchor.x, `${segment} should push left`);
      }
    }
    if (Math.abs(dy) > epsilon) {
      if (dy > 0) {
        assert.ok(checkoutTransform.anchor.y > neutralTransform.anchor.y, `${segment} should push down`);
      } else {
        assert.ok(checkoutTransform.anchor.y < neutralTransform.anchor.y, `${segment} should push up`);
      }
    }

    assert.ok(checkoutTransform.anchor.x >= 0.2 && checkoutTransform.anchor.x <= 0.86);
    assert.ok(checkoutTransform.anchor.y >= 0.2 && checkoutTransform.anchor.y <= 0.86);
  });
});

test("tv-board-zoom applies host clipping and restores it on immediate cleanup", () => {
  const { documentRef, windowRef, hostNode, targetNode, boardSvg } = createZoomFixture();
  const state = createZoomState();
  const speedConfig = {
    zoomInMs: 180,
    zoomOutMs: 220,
    easingIn: "ease-in",
    easingOut: "ease-out",
  };

  hostNode.style.setProperty("overflow", "visible");
  hostNode.style.setProperty("overflow-x", "auto");
  hostNode.style.setProperty("overflow-y", "scroll");
  targetNode.style.transform = "rotate(1deg)";

  applyZoom(
    targetNode,
    hostNode,
    boardSvg,
    2.75,
    speedConfig,
    { reason: "smart-setup", segment: "T20" },
    state,
    { x01Rules, windowRef, documentRef }
  );

  assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
  assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
  assert.equal(hostNode.style.getPropertyValue("overflow"), "hidden");
  assert.equal(hostNode.style.getPropertyValue("overflow-x"), "hidden");
  assert.equal(hostNode.style.getPropertyValue("overflow-y"), "hidden");
  assert.ok(String(targetNode.style.transform).includes("translate("));

  resetZoom(speedConfig, state, true);

  assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
  assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
  assert.equal(hostNode.style.getPropertyValue("overflow"), "visible");
  assert.equal(hostNode.style.getPropertyValue("overflow-x"), "auto");
  assert.equal(hostNode.style.getPropertyValue("overflow-y"), "scroll");
  assert.equal(targetNode.style.transform, "rotate(1deg)");
});

test("tv-board-zoom keeps transform idempotent across repeated apply calls", () => {
  const { documentRef, windowRef, hostNode, targetNode, boardSvg } = createZoomFixture();
  const state = createZoomState();
  const speedConfig = {
    zoomInMs: 180,
    zoomOutMs: 220,
    easingIn: "ease-in",
    easingOut: "ease-out",
  };

  // Simulate browser behavior where computed transform reflects already-applied inline transform.
  windowRef.getComputedStyle = (node) => {
    return {
      display: "",
      visibility: "",
      opacity: "1",
      transform: String(node?.style?.transform || "none"),
    };
  };

  applyZoom(
    targetNode,
    hostNode,
    boardSvg,
    2.75,
    speedConfig,
    { reason: "t20-setup", segment: "T20" },
    state,
    { x01Rules, windowRef, documentRef }
  );
  const firstTransform = String(targetNode.style.transform || "");

  applyZoom(
    targetNode,
    hostNode,
    boardSvg,
    2.75,
    speedConfig,
    { reason: "t20-setup", segment: "T20" },
    state,
    { x01Rules, windowRef, documentRef }
  );
  const secondTransform = String(targetNode.style.transform || "");

  assert.equal(secondTransform, firstTransform);
  assert.equal((secondTransform.match(/scale\(/g) || []).length, 1);
});

test("tv-board-zoom delayed reset clears zoom classes and restores host overflow", async () => {
  const { documentRef, windowRef, hostNode, targetNode, boardSvg } = createZoomFixture();
  const state = createZoomState();
  const speedConfig = {
    zoomInMs: 120,
    zoomOutMs: 1,
    easingIn: "ease-in",
    easingOut: "ease-out",
  };

  hostNode.style.setProperty("overflow", "visible");

  applyZoom(
    targetNode,
    hostNode,
    boardSvg,
    2.75,
    speedConfig,
    { reason: "checkout", segment: "D20" },
    state,
    { x01Rules, windowRef, documentRef }
  );
  assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
  assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);

  resetZoom(speedConfig, state);
  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.equal(state.zoomedElement, null);
  assert.equal(state.zoomHost, null);
  assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
  assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
  assert.equal(hostNode.style.getPropertyValue("overflow"), "visible");
});
