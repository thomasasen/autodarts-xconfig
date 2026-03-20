import test from "node:test";
import assert from "node:assert/strict";

import { stopAnimation, updateTurnPoints } from "../../src/features/turn-points-count/logic.js";
import {
  SCORE_FLASH_CLASS,
  SCORE_SELECTOR,
  STYLE_ID,
  buildStyleText,
} from "../../src/features/turn-points-count/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function createState() {
  return {
    lastValueByNode: new Map(),
    renderedValueByNode: new Map(),
    targetValueByNode: new Map(),
    activeRafByNode: new Map(),
    activeAnimeByNode: new Map(),
    flashTimeoutByNode: new Map(),
  };
}

function createAnimeStub() {
  const calls = [];

  const anime = (params = {}) => {
    calls.push(params);
    return {
      pause() {},
    };
  };

  anime.calls = calls;
  return anime;
}

test("turn-points-count flashes only while a score-change animation is active", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const scoreNode = documentRef.turnPointsElement;

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);

  scoreNode.textContent = "45";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(animeRef.calls.length, 1);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(state.targetValueByNode.get(scoreNode), 45);

  animeRef.calls[0].complete();
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
  assert.equal(state.activeAnimeByNode.has(scoreNode), false);
  assert.equal(state.targetValueByNode.has(scoreNode), false);
  assert.equal(state.lastValueByNode.get(scoreNode), 45);
});

test("turn-points-count does not flash when the displayed value does not change", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const scoreNode = documentRef.turnPointsElement;

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(animeRef.calls.length, 0);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
});

test("stopAnimation clears any pending flash state immediately", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const scoreNode = documentRef.turnPointsElement;

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });
  scoreNode.textContent = "30";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(state.flashTimeoutByNode.has(scoreNode), true);

  stopAnimation(scoreNode, state, windowRef);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
  assert.equal(state.flashTimeoutByNode.has(scoreNode), false);
});

test("turn-points-count style exports the scoped flash animation contract", () => {
  const css = buildStyleText();

  assert.equal(STYLE_ID, "ad-ext-turn-points-count-style");
  assert.match(css, new RegExp(`${SCORE_SELECTOR.replace(".", "\\.")}\\.${SCORE_FLASH_CLASS}`));
  assert.equal(css.includes("@keyframes ad-ext-turn-points-count-flash"), true);
});
