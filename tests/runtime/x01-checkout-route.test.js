import test from "node:test";
import assert from "node:assert/strict";

import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  collectVisibleCheckoutRoute,
  getCheckoutFinishSegmentFromRoute,
  getFirstCheckoutRouteSegment,
  getSingleSuggestionSegmentFromRoute,
  mapRouteSegmentsToBoardTargets,
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
