import test from "node:test";
import assert from "node:assert/strict";

import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  collectVisibleCheckoutRoute,
  getCheckoutFinishSegmentFromRoute,
  getFirstCheckoutRouteSegment,
  getSingleSuggestionSegmentFromRoute,
  mapRouteSegmentsToBoardTargets,
  resolveCheckoutSurfaceSemantics,
} from "../../src/features/x01-checkout-route.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function appendSuggestion(documentRef, text, left, top) {
  const node = documentRef.createElement("div");
  node.classList.add("suggestion");
  node.textContent = text;
  node.__rect = {
    left,
    top,
    width: 180,
    height: 48,
  };
  documentRef.main.appendChild(node);
  return node;
}

test("x01 checkout route collects visible suggestion nodes left-to-right and ignores invalid text", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "";
  documentRef.suggestionElement.__rect = { left: 600, top: 10, width: 180, height: 48 };
  const windowRef = createFakeWindow({ documentRef });

  appendSuggestion(documentRef, "ABC", 100, 10);
  appendSuggestion(documentRef, "D8", 500, 10);
  appendSuggestion(documentRef, "T16", 300, 10);

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["T16", "D8"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "T16");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D8");
  assert.equal(getSingleSuggestionSegmentFromRoute(route), "");
});

test("x01 checkout route keeps segment order from a single multi-step suggestion node", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "T16 D8";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["T16", "D8"]);
  assert.deepEqual(mapRouteSegmentsToBoardTargets(route, x01Rules), [
    { ring: "T", value: 16 },
    { ring: "D", value: 8 },
  ]);
});

test("x01 checkout route normalizes single-bull setup steps ahead of the visible finish field", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "25";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };
  appendSuggestion(documentRef, "D18", 500, 10);
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["S25", "D18"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "S25");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D18");
  assert.deepEqual(mapRouteSegmentsToBoardTargets(route, x01Rules), [
    { ring: "SB" },
    { ring: "D", value: 18 },
  ]);
});

test("x01 checkout route falls back to non-zero text suggestions when rect-based visibility collapses", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "D20";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 0, height: 0 };
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["D20"]);
  assert.deepEqual(mapRouteSegmentsToBoardTargets(route, x01Rules), [{ ring: "D", value: 20 }]);
});

test("x01 checkout route ignores explicitly hidden stale suggestions in collapsed fallback mode", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "D20";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 0, height: 0 };
  const hiddenSuggestion = appendSuggestion(documentRef, "T16 D8", 100, 10);
  const windowRef = createFakeWindow({ documentRef });
  windowRef.getComputedStyle = (node) => {
    if (node === hiddenSuggestion) {
      return {
        display: "none",
        visibility: "hidden",
        opacity: "0",
      };
    }

    return {
      display: "",
      visibility: "",
      opacity: "1",
    };
  };

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["D20"]);
});

test("x01 checkout route exposes single-segment suggestions for setup fallback only", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "T19";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["T19"]);
  assert.equal(getSingleSuggestionSegmentFromRoute(route), "T19");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "");
});

test("x01 checkout route reads styled suggestion cards when textContent collapses score and segment", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "60T20";
  documentRef.suggestionElement.innerText = "60\nT20";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };

  const secondSuggestion = appendSuggestion(documentRef, "14S14", 500, 10);
  secondSuggestion.innerText = "14\nS14";

  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["T20", "S14"]);
  assert.deepEqual(mapRouteSegmentsToBoardTargets(route, x01Rules), [
    { ring: "T", value: 20 },
    { ring: "S", value: 14 },
  ]);
});

test("x01 checkout route falls back to leaf text when wrapper text is collapsed", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "14S14";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };
  documentRef.suggestionElement.replaceChildren();

  const scoreNode = documentRef.createElement("div");
  scoreNode.textContent = "14";
  const segmentNode = documentRef.createElement("div");
  segmentNode.textContent = "S14";
  documentRef.suggestionElement.appendChild(scoreNode);
  documentRef.suggestionElement.appendChild(segmentNode);

  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["S14"]);
});

test("x01 checkout route resolves semantic snapshot for a valid explicit visible checkout route", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["25", "D18"],
    activeScore: 61,
    outMode: "Double Out",
    dartsRemaining: 2,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["S25", "D18"],
    authoritativeRouteSegments: ["S25", "D18"],
    selectionSource: "validated-visible-route",
    visibleSegmentsUsed: 2,
    firstVisibleSegment: "S25",
    visibleFinishSegment: "D18",
    singleVisibleSegment: "",
    surfaceKind: "visible-explicit-checkout",
  });
});

test("x01 checkout route resolves semantic snapshot for a visible prefix with fallback finish", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["T20"],
    activeScore: 96,
    outMode: "Double Out",
    dartsRemaining: 2,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["T20"],
    authoritativeRouteSegments: ["T20", "D18"],
    selectionSource: "validated-visible-route+fallback",
    visibleSegmentsUsed: 1,
    firstVisibleSegment: "T20",
    visibleFinishSegment: "",
    singleVisibleSegment: "T20",
    surfaceKind: "visible-prefix+fallback",
  });
});

test("x01 checkout route resolves semantic snapshot for score-route fallback on conflicting visible route", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["T20", "BULL"],
    activeScore: 50,
    outMode: "Double Out",
    dartsRemaining: 2,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["T20", "BULL"],
    authoritativeRouteSegments: ["BULL"],
    selectionSource: "score-route",
    visibleSegmentsUsed: 0,
    firstVisibleSegment: "T20",
    visibleFinishSegment: "BULL",
    singleVisibleSegment: "",
    surfaceKind: "score-route",
  });
});

test("x01 checkout route resolves semantic snapshot for visible setup-only fallback", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["T20", "S10"],
    activeScore: 102,
    outMode: "Double Out",
    dartsRemaining: 2,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["T20", "S10"],
    authoritativeRouteSegments: ["T20"],
    selectionSource: "visible-setup-segment",
    visibleSegmentsUsed: 1,
    firstVisibleSegment: "T20",
    visibleFinishSegment: "",
    singleVisibleSegment: "",
    surfaceKind: "visible-setup-only",
  });
});
