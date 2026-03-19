import test from "node:test";
import assert from "node:assert/strict";

import {
  WIDTH_PROPERTY,
  createScoreProgressState,
  resolveStartScore,
  syncScoreProgress,
} from "../../src/features/x01-score-progress/logic.js";
import {
  ACTIVE_CLASS,
  HOST_SELECTOR,
  INACTIVE_CLASS,
} from "../../src/features/x01-score-progress/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function createPlayerCard(documentRef, score, { active = false } = {}) {
  const cardNode = documentRef.createElement("div");
  cardNode.classList.add("ad-ext-player");
  if (active) {
    cardNode.classList.add("ad-ext-player-active");
  }

  const stackNode = documentRef.createElement("div");
  stackNode.classList.add("chakra-stack");

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreNode.textContent = String(score);

  stackNode.appendChild(scoreNode);
  cardNode.appendChild(stackNode);

  return {
    cardNode,
    scoreNode,
    stackNode,
  };
}

test("resolveStartScore falls back to selected DOM controls on match routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const selectedButton = documentRef.createElement("button");
  selectedButton.setAttribute("aria-pressed", "true");
  selectedButton.textContent = "Best of 5 / 701";
  documentRef.main.appendChild(selectedButton);

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-701",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, 701);
});

test("syncScoreProgress renders active and inactive bars from the X01 start score", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const activePlayer = createPlayerCard(documentRef, 170, { active: true });
  const inactivePlayer = createPlayerCard(documentRef, 251);
  playerDisplay.appendChild(activePlayer.cardNode);
  playerDisplay.appendChild(inactivePlayer.cardNode);

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: { designPreset: "glass" },
      gameState: {
        getSnapshot: () => ({
          topic: "match-501",
          match: {
            id: "match-501",
            variant: "X01 501",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(result.startScore, 501);
  assert.equal(result.renderedCards, 2);
  assert.equal(playerDisplay.querySelectorAll(HOST_SELECTOR).length, 2);

  const activeHost = activePlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(activeHost);
  assert.equal(activePlayer.stackNode.children[1], activeHost);
  assert.equal(activeHost.classList.contains(ACTIVE_CLASS), true);
  assert.equal(activeHost.classList.contains("ad-ext-x01-score-progress--preset-glass"), true);
  assert.equal(activeHost.style.getPropertyValue(WIDTH_PROPERTY), "33.93%");

  const inactiveHost = inactivePlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(inactiveHost);
  assert.equal(inactivePlayer.stackNode.children[1], inactiveHost);
  assert.equal(inactiveHost.classList.contains(INACTIVE_CLASS), true);
  assert.equal(inactiveHost.classList.contains("ad-ext-x01-score-progress--preset-glass"), true);
  assert.equal(inactiveHost.style.getPropertyValue(WIDTH_PROPERTY), "50.10%");
});

test("syncScoreProgress clears stale bars outside X01 match contexts", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const activePlayer = createPlayerCard(documentRef, 170, { active: true });
  playerDisplay.appendChild(activePlayer.cardNode);

  const state = createScoreProgressState();

  syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: { designPreset: "signal" },
      gameState: {
        getSnapshot: () => ({
          topic: "match-501",
          match: {
            id: "match-501",
            variant: "501",
          },
        }),
      },
    },
    state
  );

  assert.equal(playerDisplay.querySelectorAll(HOST_SELECTOR).length, 1);

  windowRef.history.pushState({}, "", "/lobbies");
  documentRef.variantElement.textContent = "Cricket";

  const cleared = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: { designPreset: "signal" },
      gameState: {
        getSnapshot: () => ({
          topic: "match-cricket",
          match: {
            id: "match-cricket",
            variant: "Cricket",
          },
        }),
      },
    },
    state
  );

  assert.equal(cleared.startScore, null);
  assert.equal(cleared.renderedCards, 0);
  assert.equal(playerDisplay.querySelectorAll(HOST_SELECTOR).length, 0);
});
