import test from "node:test";
import assert from "node:assert/strict";

import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  canUseCheckoutFinishSegmentNow,
  collectVisibleCheckoutRoute,
  collectVisibleCheckoutRouteEntries,
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

function appendCheckoutMarkedSuggestion(documentRef, text, left, top) {
  return appendSuggestion(documentRef, `CHECKOUT ${text}`, left, top);
}

function createHostCheckoutSuggestionCard(documentRef, scoreText, segmentText, left, top) {
  const node = documentRef.createElement("div");
  const imageNode = documentRef.createElement("img");
  const textNode = documentRef.createElement("p");
  const scoreNode = documentRef.createElement("div");
  const segmentNode = documentRef.createElement("div");

  node.classList.add("suggestion");
  node.__rect = {
    left,
    top,
    width: 356,
    height: 125,
  };
  node.textContent = `${scoreText}${segmentText}`;
  node.innerText = `${scoreText}\n${segmentText}`;

  textNode.classList.add("chakra-text");
  textNode.textContent = `${scoreText}${segmentText}`;
  textNode.innerText = `${scoreText}\n${segmentText}`;
  scoreNode.textContent = String(scoreText || "");
  segmentNode.textContent = String(segmentText || "");
  textNode.appendChild(scoreNode);
  textNode.appendChild(segmentNode);

  node.appendChild(imageNode);
  node.appendChild(textNode);
  return node;
}

function createHostThrowRow(documentRef, scoreText, segmentText, left, top) {
  const rowNode = documentRef.createElement("div");
  const imageNode = documentRef.createElement("img");
  const textNode = documentRef.createElement("p");
  const scoreNode = documentRef.createElement("div");
  const segmentNode = documentRef.createElement("div");

  rowNode.classList.add("ad-ext-turn-throw");
  rowNode.__rect = {
    left,
    top,
    width: 356,
    height: 125,
  };
  rowNode.textContent = `${scoreText}${segmentText}`;
  rowNode.innerText = `${scoreText}\n${segmentText}`;

  textNode.classList.add("chakra-text");
  textNode.textContent = `${scoreText}${segmentText}`;
  textNode.innerText = `${scoreText}\n${segmentText}`;
  scoreNode.textContent = String(scoreText || "");
  segmentNode.textContent = String(segmentText || "");
  textNode.appendChild(scoreNode);
  textNode.appendChild(segmentNode);

  rowNode.appendChild(imageNode);
  rowNode.appendChild(textNode);
  return rowNode;
}

function installHostCheckoutTurnSurface(documentRef, route = [], options = {}) {
  documentRef.suggestionElement.remove();
  documentRef.turnPointsElement.remove();
  documentRef.turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  const pointsText = documentRef.createElement("p");
  const throwRows = Array.isArray(options.throwRows) ? options.throwRows : [];
  const previewSlots = Number.isFinite(options.previewSlots) ? Math.max(0, Number(options.previewSlots)) : 1;
  let left = 129;

  pointsFrame.classList.add("css-rrf7rv");
  pointsFrame.__rect = { left, top: 264, width: 240, height: 125 };
  pointsText.classList.add("ad-ext-turn-points");
  pointsText.textContent = String(options.pointsText ?? "0");
  pointsFrame.appendChild(pointsText);
  documentRef.turnContainer.appendChild(pointsFrame);
  left += 248;

  throwRows.forEach(({ scoreText, segmentText }) => {
    const throwRowNode = createHostThrowRow(
      documentRef,
      scoreText,
      segmentText,
      left,
      264
    );
    documentRef.turnContainer.appendChild(throwRowNode);
    left += 365;
  });

  route.forEach(({ scoreText, segmentText }) => {
    const cardNode = createHostCheckoutSuggestionCard(
      documentRef,
      scoreText,
      segmentText,
      left,
      264
    );
    documentRef.turnContainer.appendChild(cardNode);
    left += 365;
  });

  for (let index = 0; index < previewSlots; index += 1) {
    const previewSlot = documentRef.createElement("div");
    const previewImage = documentRef.createElement("img");
    previewSlot.classList.add("score");
    previewSlot.__rect = { left, top: 264, width: 356, height: 125 };
    previewSlot.appendChild(previewImage);
    documentRef.turnContainer.appendChild(previewSlot);
    left += 365;
  }
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

test("x01 checkout route returns an empty route when the base surface has no suggestion nodes", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.remove();
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, []);
  assert.equal(getFirstCheckoutRouteSegment(route), "");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "");
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

test("x01 checkout route prefers checkout-marked suggestions and keeps DBULL semantics", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "39 T13";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };
  appendCheckoutMarkedSuggestion(documentRef, "50 DBULL", 500, 10);
  appendCheckoutMarkedSuggestion(documentRef, "32 D16", 700, 10);
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["BULL", "D16"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "BULL");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D16");
  assert.deepEqual(mapRouteSegmentsToBoardTargets(route, x01Rules), [
    { ring: "DB" },
    { ring: "D", value: 16 },
  ]);
});

test("x01 checkout route derives CHECKOUT priority and segments from one suggestion analysis", () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "39T13";
  documentRef.suggestionElement.__rect = { left: 300, top: 10, width: 180, height: 48 };

  const markedSuggestion = documentRef.createElement("div");
  markedSuggestion.classList.add("suggestion");
  markedSuggestion.textContent = "50DBULLCHECKOUT";
  markedSuggestion.__rect = { left: 500, top: 10, width: 180, height: 48 };

  const scoreNode = documentRef.createElement("div");
  scoreNode.textContent = "50";
  const segmentNode = documentRef.createElement("div");
  segmentNode.textContent = "DBULL";
  const markerNode = documentRef.createElement("div");
  markerNode.textContent = "CHECKOUT";
  markedSuggestion.appendChild(scoreNode);
  markedSuggestion.appendChild(segmentNode);
  markedSuggestion.appendChild(markerNode);
  documentRef.main.appendChild(markedSuggestion);

  const originalQuerySelectorAll = markedSuggestion.querySelectorAll.bind(markedSuggestion);
  const originalGetBoundingClientRect = markedSuggestion.getBoundingClientRect.bind(markedSuggestion);
  let leafScanCount = 0;
  let rectReadCount = 0;
  let styleReadCount = 0;

  markedSuggestion.querySelectorAll = (selector) => {
    if (selector === "*") {
      leafScanCount += 1;
    }
    return originalQuerySelectorAll(selector);
  };
  markedSuggestion.getBoundingClientRect = () => {
    rectReadCount += 1;
    return originalGetBoundingClientRect();
  };

  const windowRef = createFakeWindow({ documentRef });
  const originalGetComputedStyle = windowRef.getComputedStyle.bind(windowRef);
  windowRef.getComputedStyle = (node) => {
    if (node === markedSuggestion) {
      styleReadCount += 1;
    }
    return originalGetComputedStyle(node);
  };

  const entries = collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules);

  assert.deepEqual(entries.map((entry) => entry.segments).flat(), ["BULL"]);
  assert.equal(entries[0]?.isCheckoutMarked, true);
  assert.equal(leafScanCount, 1);
  assert.equal(rectReadCount, 1);
  assert.equal(styleReadCount, 1);
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

test("x01 checkout route exposes when a finish segment is actually current", () => {
  assert.equal(
    canUseCheckoutFinishSegmentNow({
      routeSegments: ["T20", "D18"],
      activeScore: 96,
      outMode: "Double Out",
      x01Rules,
    }),
    false
  );
  assert.equal(
    canUseCheckoutFinishSegmentNow({
      routeSegments: ["D18"],
      activeScore: 36,
      outMode: "Double Out",
      x01Rules,
    }),
    true
  );
  assert.equal(
    canUseCheckoutFinishSegmentNow({
      routeSegments: ["BULL"],
      activeScore: 50,
      outMode: "Double Out",
      x01Rules,
    }),
    true
  );
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

test("x01 checkout route parses host checkout cards inside #ad-ext-turn with points and preview siblings", () => {
  const documentRef = new FakeDocument();
  installHostCheckoutTurnSurface(documentRef, [
    { scoreText: "16", segmentText: "S16" },
    { scoreText: "40", segmentText: "D20" },
  ]);
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["S16", "D20"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "S16");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D20");
});

test("x01 checkout route isolates a direct D20 finish card from surrounding throw and preview rows", () => {
  const documentRef = new FakeDocument();
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "40", segmentText: "D20" }],
    {
      pointsText: "16",
      throwRows: [{ scoreText: "16", segmentText: "S16" }],
      previewSlots: 1,
    }
  );
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["D20"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "D20");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D20");
  assert.equal(getSingleSuggestionSegmentFromRoute(route), "D20");
});

test("x01 checkout route isolates a visible setup-only S3 card after S16 and S5 throw rows", () => {
  const documentRef = new FakeDocument();
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "3", segmentText: "S3" }],
    {
      pointsText: "21",
      throwRows: [
        { scoreText: "16", segmentText: "S16" },
        { scoreText: "5", segmentText: "S5" },
      ],
      previewSlots: 0,
    }
  );
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["S3"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "S3");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "");
  assert.equal(getSingleSuggestionSegmentFromRoute(route), "S3");
});

test("x01 checkout route isolates a direct D10 finish card after S16 and S20 throw rows", () => {
  const documentRef = new FakeDocument();
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "20", segmentText: "D10" }],
    {
      pointsText: "36",
      throwRows: [
        { scoreText: "16", segmentText: "S16" },
        { scoreText: "20", segmentText: "S20" },
      ],
      previewSlots: 0,
    }
  );
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["D10"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "D10");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D10");
  assert.equal(getSingleSuggestionSegmentFromRoute(route), "D10");
});

test("x01 checkout route reads scoreless D10 host cards when enhanced scoring display is disabled", () => {
  const documentRef = new FakeDocument();
  installHostCheckoutTurnSurface(
    documentRef,
    [{ scoreText: "", segmentText: "D10" }],
    {
      pointsText: "36",
      throwRows: [
        { scoreText: "", segmentText: "S16" },
        { scoreText: "", segmentText: "S20" },
      ],
      previewSlots: 0,
    }
  );
  const windowRef = createFakeWindow({ documentRef });

  const route = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
  assert.deepEqual(route, ["D10"]);
  assert.equal(getFirstCheckoutRouteSegment(route), "D10");
  assert.equal(getCheckoutFinishSegmentFromRoute(route, "Double Out", x01Rules), "D10");
  assert.equal(getSingleSuggestionSegmentFromRoute(route), "D10");
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
    authoritativeFinishSegment: "D18",
    canUseAuthoritativeFinishNow: false,
    singleVisibleSegment: "",
    surfaceKind: "visible-explicit-checkout",
  });
});

test("x01 checkout route resolves semantic snapshot for a direct visible D20 checkout", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["D20"],
    activeScore: 40,
    outMode: "Double Out",
    dartsRemaining: 2,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["D20"],
    authoritativeRouteSegments: ["D20"],
    selectionSource: "validated-visible-route",
    visibleSegmentsUsed: 1,
    firstVisibleSegment: "D20",
    visibleFinishSegment: "D20",
    authoritativeFinishSegment: "D20",
    canUseAuthoritativeFinishNow: true,
    singleVisibleSegment: "D20",
    surfaceKind: "visible-explicit-checkout",
  });
});

test("x01 checkout route resolves semantic snapshot for a direct visible S3 setup after the checkout was lost", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["S3"],
    activeScore: 35,
    outMode: "Double Out",
    dartsRemaining: 1,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["S3"],
    authoritativeRouteSegments: ["S3"],
    selectionSource: "visible-setup-segment",
    visibleSegmentsUsed: 1,
    firstVisibleSegment: "S3",
    visibleFinishSegment: "",
    authoritativeFinishSegment: "",
    canUseAuthoritativeFinishNow: false,
    singleVisibleSegment: "S3",
    surfaceKind: "visible-setup-only",
  });
});

test("x01 checkout route resolves semantic snapshot for a direct visible D10 checkout after S20 keeps checkout alive", () => {
  const resolved = resolveCheckoutSurfaceSemantics({
    routeSegments: ["D10"],
    activeScore: 20,
    outMode: "Double Out",
    dartsRemaining: 1,
    x01Rules,
  });

  assert.deepEqual(resolved, {
    visibleRouteSegments: ["D10"],
    authoritativeRouteSegments: ["D10"],
    selectionSource: "validated-visible-route",
    visibleSegmentsUsed: 1,
    firstVisibleSegment: "D10",
    visibleFinishSegment: "D10",
    authoritativeFinishSegment: "D10",
    canUseAuthoritativeFinishNow: true,
    singleVisibleSegment: "D10",
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
    authoritativeFinishSegment: "D18",
    canUseAuthoritativeFinishNow: false,
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
    authoritativeFinishSegment: "BULL",
    canUseAuthoritativeFinishNow: true,
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
    authoritativeFinishSegment: "",
    canUseAuthoritativeFinishNow: false,
    singleVisibleSegment: "",
    surfaceKind: "visible-setup-only",
  });
});
