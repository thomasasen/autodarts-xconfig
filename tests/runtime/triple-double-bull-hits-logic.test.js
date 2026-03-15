import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyThrowText,
  collectThrowRows,
  clearHitDecoration,
  updateHitDecorations,
} from "../../src/features/triple-double-bull-hits/logic.js";
import {
  HIT_BASE_CLASS,
  HIT_IDLE_LOOP_CLASS,
  HIT_KIND_CLASS,
  HIT_SCORE_CLASS,
  HIT_SEGMENT_CLASS,
  HIT_THEME_CLASS,
} from "../../src/features/triple-double-bull-hits/style.js";
import { FakeDocument } from "./fake-dom.js";

function createAnimeStub() {
  const calls = [];
  const removes = [];

  function anime(params = {}) {
    calls.push({ type: "single", params });
    return {
      pause() {
        calls.push({ type: "single-pause", params });
      },
    };
  }

  anime.remove = (targets) => {
    removes.push([].concat(targets || []).filter(Boolean));
  };

  anime.timeline = (options = {}) => {
    const steps = [];
    const instance = {
      add(step, offset = 0) {
        steps.push({ step, offset });
        return instance;
      },
      play() {
        calls.push({ type: "timeline-play", options, steps: steps.slice() });
        return instance;
      },
      pause() {
        calls.push({ type: "timeline-pause", options, steps: steps.slice() });
      },
    };
    calls.push({ type: "timeline-create", options });
    return instance;
  };

  anime._calls = calls;
  anime._removes = removes;
  return anime;
}

function appendThrowRow(documentRef, scoreText, segmentText) {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-turn-throw");

  const textNode = documentRef.createElement("p");
  textNode.classList.add("chakra-text");
  const wrapper = documentRef.createElement("div");
  const scoreNode = documentRef.createElement("div");
  const segmentNode = documentRef.createElement("div");

  scoreNode.textContent = String(scoreText || "");
  segmentNode.textContent = String(segmentText || "");
  wrapper.appendChild(scoreNode);
  wrapper.appendChild(segmentNode);
  textNode.appendChild(wrapper);
  row.appendChild(textNode);
  documentRef.turnContainer.appendChild(row);

  return {
    row,
    textNode,
    scoreNode,
    segmentNode,
  };
}

test("classifyThrowText resolves mixed throw text by containment priority", () => {
  const triple = classifyThrowText("60 T20");
  assert.equal(triple?.kind, "triple");
  assert.equal(triple?.segment, "T20");

  const double = classifyThrowText("36 D18");
  assert.equal(double?.kind, "double");
  assert.equal(double?.segment, "D18");

  const outerBull = classifyThrowText("25 S25");
  assert.equal(outerBull?.kind, "bullOuter");
  assert.equal(outerBull?.segment, "S25");

  const innerBull = classifyThrowText("50 BULL");
  assert.equal(innerBull?.kind, "bullInner");
  assert.equal(innerBull?.segment, "BULL");

  assert.equal(classifyThrowText("alpha beta gamma"), null);
});

test("collectThrowRows scopes to #ad-ext-turn and prefers direct throw rows", () => {
  const documentRef = new FakeDocument();
  const directRow = documentRef.throwRow;

  const nestedWrapper = documentRef.createElement("div");
  const nestedRow = documentRef.createElement("div");
  nestedRow.classList.add("ad-ext-turn-throw");
  nestedRow.textContent = "T20";
  nestedWrapper.appendChild(nestedRow);
  documentRef.turnContainer.appendChild(nestedWrapper);

  const externalRow = documentRef.createElement("div");
  externalRow.classList.add("ad-ext-turn-throw");
  externalRow.textContent = "D20";
  documentRef.main.appendChild(externalRow);

  const rows = collectThrowRows(documentRef);
  assert.deepEqual(rows, [directRow]);
});

test("updateHitDecorations decorates rows, differentiates bulls, and assigns text roles", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const roleStateByRow = new Map();
  const animeRef = createAnimeStub();

  documentRef.throwTextElement.textContent = "18 S18";
  documentRef.throwRow.textContent = "18 S18";

  const triple = appendThrowRow(documentRef, "60", "T20");
  const double = appendThrowRow(documentRef, "36", "D18");
  const outerBull = appendThrowRow(documentRef, "25", "S25");
  const innerBull = appendThrowRow(documentRef, "50", "BULL");

  const stats = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "champagne-night",
      animationStyle: "charge-release",
    },
    debugRows: true,
  });

  assert.equal(triple.row.classList.contains(HIT_KIND_CLASS.triple), true);
  assert.equal(double.row.classList.contains(HIT_KIND_CLASS.double), true);
  assert.equal(outerBull.row.classList.contains(HIT_KIND_CLASS.bullOuter), true);
  assert.equal(innerBull.row.classList.contains(HIT_KIND_CLASS.bullInner), true);
  assert.equal(triple.row.classList.contains(HIT_THEME_CLASS["champagne-night"]), true);
  assert.equal(double.row.classList.contains(HIT_THEME_CLASS["champagne-night"]), true);
  assert.equal(outerBull.row.classList.contains(HIT_THEME_CLASS["champagne-night"]), true);
  assert.equal(innerBull.row.classList.contains(HIT_THEME_CLASS["champagne-night"]), true);
  assert.equal(triple.scoreNode.classList.contains(HIT_SCORE_CLASS), true);
  assert.equal(triple.segmentNode.classList.contains(HIT_SEGMENT_CLASS), true);
  assert.equal(innerBull.scoreNode.classList.contains(HIT_SCORE_CLASS), true);
  assert.equal(innerBull.segmentNode.classList.contains(HIT_SEGMENT_CLASS), true);
  assert.equal(stats.rowCount, 5);
  assert.equal(stats.decoratedCount, 4);
  assert.equal(stats.burstCount, 4);
  assert.equal(stats.idleLoopCount, 4);
  assert.equal(stats.kindCounts.triple, 1);
  assert.equal(stats.kindCounts.double, 1);
  assert.equal(stats.kindCounts.bullOuter, 1);
  assert.equal(stats.kindCounts.bullInner, 1);
  assert.equal(Array.isArray(stats.rows), true);
  assert.equal(stats.rows.some((entry) => entry.scoreRole && entry.segmentRole), true);
});

test("updateHitDecorations applies configured color theme and defaults invalid values to kind-signal", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const roleStateByRow = new Map();

  documentRef.throwTextElement.textContent = "60 T20";
  documentRef.throwRow.textContent = "60 T20";

  updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    roleStateByRow,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
  });

  assert.equal(documentRef.throwRow.classList.contains(HIT_THEME_CLASS["ember-rush"]), true);
  assert.equal(documentRef.throwRow.classList.contains(HIT_THEME_CLASS["kind-signal"]), false);
  assert.equal(documentRef.throwRow.getAttribute("data-ad-ext-hit-theme"), "ember-rush");

  updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    roleStateByRow,
    featureConfig: {
      colorTheme: "invalid-theme",
      animationStyle: "impact-pop",
    },
  });

  assert.equal(documentRef.throwRow.classList.contains(HIT_THEME_CLASS["kind-signal"]), true);
  assert.equal(documentRef.throwRow.classList.contains(HIT_THEME_CLASS["ember-rush"]), false);
  assert.equal(documentRef.throwRow.getAttribute("data-ad-ext-hit-theme"), "kind-signal");
});

test("updateHitDecorations bursts only the newly changed slot and keeps prior rows stable", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const burstKeyBySlot = new Map();
  const activeAnimeByRow = new Map();
  const roleStateByRow = new Map();
  const animeRef = createAnimeStub();

  documentRef.throwTextElement.textContent = "60 T20";
  documentRef.throwRow.textContent = "60 T20";

  const row2 = appendThrowRow(documentRef, "", "");
  const row3 = appendThrowRow(documentRef, "", "");

  const first = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
    debugRows: true,
  });

  assert.equal(first.burstCount, 1);
  assert.equal(animeRef._calls.filter((entry) => entry.type === "timeline-play").length, 1);

  row2.scoreNode.textContent = "22";
  row2.segmentNode.textContent = "D11";

  const second = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
    debugRows: true,
  });

  assert.equal(second.burstCount, 1);
  assert.equal(second.rows[0].burst, false);
  assert.equal(second.rows[1].burst, true);
  assert.equal(documentRef.throwRow.classList.contains(HIT_KIND_CLASS.triple), true);
  assert.equal(row2.row.classList.contains(HIT_KIND_CLASS.double), true);
  assert.equal(animeRef._calls.filter((entry) => entry.type === "timeline-play").length, 2);

  row3.scoreNode.textContent = "18";
  row3.segmentNode.textContent = "S18";
  const third = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ember-rush",
      animationStyle: "impact-pop",
    },
    debugRows: true,
  });

  assert.equal(third.burstCount, 0);
  assert.equal(third.rows[0].burst, false);
  assert.equal(third.rows[1].burst, false);
  assert.equal(animeRef._calls.filter((entry) => entry.type === "timeline-play").length, 2);
});

test("same-slot changes re-burst only that slot and a cleared slot can burst again", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const burstKeyBySlot = new Map();
  const activeAnimeByRow = new Map();
  const roleStateByRow = new Map();
  const animeRef = createAnimeStub();

  documentRef.throwTextElement.textContent = "18 S18";
  documentRef.throwRow.textContent = "18 S18";

  const first = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ice-circuit",
      animationStyle: "card-slam",
    },
  });
  assert.equal(first.burstCount, 0);

  documentRef.throwTextElement.textContent = "60 T20";
  documentRef.throwRow.textContent = "60 T20";
  const second = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ice-circuit",
      animationStyle: "card-slam",
    },
  });
  assert.equal(second.burstCount, 1);

  documentRef.throwTextElement.textContent = "40 D20";
  documentRef.throwRow.textContent = "40 D20";
  const third = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ice-circuit",
      animationStyle: "card-slam",
    },
  });
  assert.equal(third.burstCount, 1);
  assert.equal(documentRef.throwRow.classList.contains(HIT_KIND_CLASS.double), true);

  documentRef.throwTextElement.textContent = "18 S18";
  documentRef.throwRow.textContent = "18 S18";
  const cleared = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ice-circuit",
      animationStyle: "card-slam",
    },
  });
  assert.equal(cleared.removedCount, 1);
  assert.equal(burstKeyBySlot.has(0), false);

  documentRef.throwTextElement.textContent = "60 T20";
  documentRef.throwRow.textContent = "60 T20";
  const fourth = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "ice-circuit",
      animationStyle: "card-slam",
    },
  });
  assert.equal(fourth.burstCount, 1);
});

test("loop-capable presets keep idle loops on marked rows without re-bursting older rows", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const burstKeyBySlot = new Map();
  const activeAnimeByRow = new Map();
  const roleStateByRow = new Map();
  const animeRef = createAnimeStub();

  documentRef.throwTextElement.textContent = "60 T20";
  documentRef.throwRow.textContent = "60 T20";
  const row2 = appendThrowRow(documentRef, "", "");

  const first = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "champagne-night",
      animationStyle: "charge-release",
    },
    debugRows: true,
  });

  assert.equal(first.burstCount, 1);
  assert.equal(first.idleLoopCount, 1);
  assert.equal(documentRef.throwRow.classList.contains(HIT_IDLE_LOOP_CLASS), true);

  row2.scoreNode.textContent = "22";
  row2.segmentNode.textContent = "D11";
  const second = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "champagne-night",
      animationStyle: "charge-release",
    },
    debugRows: true,
  });

  assert.equal(second.burstCount, 1);
  assert.equal(second.idleLoopCount, 2);
  assert.equal(second.rows[0].burst, false);
  assert.equal(second.rows[1].burst, true);
  assert.equal(documentRef.throwRow.classList.contains(HIT_IDLE_LOOP_CLASS), true);
  assert.equal(row2.row.classList.contains(HIT_IDLE_LOOP_CLASS), true);
});

test("flip-edge and card-slam timelines keep the promised 360 degree spins", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const burstKeyBySlot = new Map();
  const activeAnimeByRow = new Map();
  const roleStateByRow = new Map();
  const animeRef = createAnimeStub();

  documentRef.throwTextElement.textContent = "60 T20";
  documentRef.throwRow.textContent = "60 T20";

  updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "volt-lime",
      animationStyle: "flip-edge",
    },
  });

  const flipPlay = animeRef._calls.findLast((entry) => entry.type === "timeline-play");
  const flipRowStep = flipPlay?.steps.find((entry) => entry.step?.targets === documentRef.throwRow);
  assert.equal(
    flipRowStep?.step?.keyframes?.some((frame) => frame.rotateY === 360),
    true
  );

  documentRef.throwTextElement.textContent = "40 D20";
  documentRef.throwRow.textContent = "40 D20";

  updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "crimson-steel",
      animationStyle: "card-slam",
    },
  });

  const cardPlay = animeRef._calls.findLast((entry) => entry.type === "timeline-play");
  const cardRowStep = cardPlay?.steps.find((entry) => entry.step?.targets === documentRef.throwRow);
  assert.equal(
    cardRowStep?.step?.keyframes?.some((frame) => frame.rotateX === -360),
    true
  );
});

test("clearHitDecoration removes row classes, text roles, and active anime state", () => {
  const documentRef = new FakeDocument();
  const trackedRows = new Set();
  const signatureByRow = new Map();
  const burstKeyBySlot = new Map();
  const activeAnimeByRow = new Map();
  const roleStateByRow = new Map();
  const animeRef = createAnimeStub();

  const decorated = appendThrowRow(documentRef, "50", "BULL");
  const stats = updateHitDecorations({
    documentRef,
    trackedRows,
    signatureByRow,
    burstKeyBySlot,
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
    featureConfig: {
      colorTheme: "volt-lime",
      animationStyle: "alternate-flick",
    },
  });

  assert.equal(stats.burstCount >= 1, true);
  assert.equal(decorated.row.classList.contains(HIT_BASE_CLASS), true);
  assert.equal(decorated.scoreNode.classList.contains(HIT_SCORE_CLASS), true);
  assert.equal(activeAnimeByRow.has(decorated.row), true);

  const wasCleared = clearHitDecoration(decorated.row, signatureByRow, {
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
  });

  assert.equal(wasCleared, true);
  assert.equal(decorated.row.classList.contains(HIT_BASE_CLASS), false);
  assert.equal(decorated.row.classList.contains(HIT_IDLE_LOOP_CLASS), false);
  assert.equal(decorated.scoreNode.classList.contains(HIT_SCORE_CLASS), false);
  assert.equal(decorated.segmentNode.classList.contains(HIT_SEGMENT_CLASS), false);
  assert.equal(activeAnimeByRow.has(decorated.row), false);
  assert.equal(roleStateByRow.has(decorated.row), false);
  assert.equal(signatureByRow.has(decorated.row), false);
  assert.equal(animeRef._calls.some((entry) => entry.type === "timeline-pause"), true);
  assert.equal(animeRef._removes.length >= 1, true);
});
