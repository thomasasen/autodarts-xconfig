import test from "node:test";
import assert from "node:assert/strict";

import {
  EFFECT_ATTRIBUTE,
  WIDTH_PROPERTY,
  createScoreProgressState,
  resolveStartScore,
  syncScoreProgress,
} from "../../src/features/x01-score-progress/logic.js";
import { mountX01ScoreProgress } from "../../src/features/x01-score-progress/index.js";
import {
  ACTIVE_CLASS,
  FILL_CLASS,
  HOST_SELECTOR,
  INACTIVE_CLASS,
  STACK_ATTRIBUTE,
  TRACK_CLASS,
  TRAIL_CLASS,
  buildStyleText,
} from "../../src/features/x01-score-progress/style.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function createNestedScorePlayerCard(documentRef, score, { active = false } = {}) {
  const player = createPlayerCard(documentRef, score, { active });
  const scoreWrapper = documentRef.createElement("div");
  scoreWrapper.classList.add("chakra-stack", "css-xsngok");
  player.stackNode.removeChild(player.scoreNode);
  scoreWrapper.appendChild(player.scoreNode);
  player.stackNode.appendChild(scoreWrapper);

  return {
    ...player,
    scoreWrapper,
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

test("resolveStartScore resolves from variant strip sibling text on match routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const startBadge = documentRef.createElement("span");
  startBadge.textContent = "501";
  documentRef.suggestionElement.before(startBadge);

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-variant-strip",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, 501);
});

test("resolveStartScore accepts 170 from the snapshot variant when it is the actual X01 base", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-170",
            variant: "X01 170",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, 170);
});

test("resolveStartScore accepts 121 from an active base control on match routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const selectedButton = documentRef.createElement("button");
  selectedButton.setAttribute("aria-pressed", "true");
  selectedButton.textContent = "Best of 5 / 121";
  documentRef.main.appendChild(selectedButton);

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-121",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, 121);
});

test("resolveStartScore ignores checkout-like texts even when they contain valid X01 base numbers", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const startBadge = documentRef.createElement("span");
  startBadge.textContent = "Checkout 170";
  documentRef.suggestionElement.before(startBadge);

  const selectedButton = documentRef.createElement("button");
  selectedButton.setAttribute("aria-pressed", "true");
  selectedButton.textContent = "Finish 121";
  documentRef.main.appendChild(selectedButton);

  const startScore = resolveStartScore(
    {
      documentRef,
      windowRef,
      gameState: {
        getSnapshot: () => ({
          match: {
            id: "match-checkout-text",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(startScore, null);
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
      featureConfig: {
        colorTheme: "danger-endgame",
        barSize: "extrabreit",
        effect: "glass-charge",
      },
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
  assert.equal(activePlayer.stackNode.getAttribute(STACK_ATTRIBUTE), "true");
  assert.equal(activeHost.classList.contains(ACTIVE_CLASS), true);
  assert.equal(activeHost.classList.contains("ad-ext-x01-score-progress--size-extrabreit"), true);
  assert.equal(activeHost.getAttribute("data-ad-ext-x01-score-progress-color-theme"), "danger-endgame");
  assert.equal(activeHost.getAttribute("data-ad-ext-x01-score-progress-effect"), "glass-charge");
  assert.equal(activeHost.style.getPropertyValue(WIDTH_PROPERTY), "33.93%");
  const activeFill = activeHost.querySelector(`.${FILL_CLASS}`);
  assert.ok(activeFill);
  assert.equal(
    activeFill.classList.contains("ad-ext-x01-score-progress__fill--effect-glass-charge"),
    true
  );

  const inactiveHost = inactivePlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(inactiveHost);
  assert.equal(inactivePlayer.stackNode.children[1], inactiveHost);
  assert.equal(inactivePlayer.stackNode.getAttribute(STACK_ATTRIBUTE), "true");
  assert.equal(inactiveHost.classList.contains(INACTIVE_CLASS), true);
  assert.equal(inactiveHost.classList.contains("ad-ext-x01-score-progress--size-extrabreit"), false);
  assert.equal(
    inactiveHost.getAttribute("data-ad-ext-x01-score-progress-color-theme"),
    "danger-endgame"
  );
  assert.equal(inactiveHost.getAttribute("data-ad-ext-x01-score-progress-effect"), "glass-charge");
  assert.equal(inactiveHost.style.getPropertyValue(WIDTH_PROPERTY), "50.10%");
  const inactiveFill = inactiveHost.querySelector(`.${FILL_CLASS}`);
  assert.ok(inactiveFill);
  assert.equal(
    inactiveFill.classList.contains("ad-ext-x01-score-progress__fill--effect-glass-charge"),
    false
  );
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
      featureConfig: {},
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
  assert.equal(activePlayer.stackNode.getAttribute(STACK_ATTRIBUTE), "true");

  windowRef.history.pushState({}, "", "/lobbies");
  documentRef.variantElement.textContent = "Cricket";

  const cleared = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {},
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
  assert.equal(activePlayer.stackNode.getAttribute(STACK_ATTRIBUTE), null);
});

test("syncScoreProgress exposes debug reason when start score cannot be resolved", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "X01";

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        debug: true,
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-x01-no-start",
          match: {
            id: "match-x01-no-start",
            variant: "X01",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(result.startScore, null);
  assert.equal(result.renderedCards, 0);
  assert.equal(result.debug.reason, "missing-start-score");
  assert.equal(result.debug.startScoreSource, "unresolved");
  assert.equal(result.debug.cardCount, 0);
  assert.equal(result.debug.hostCountAfterCleanup, 0);
});

test("syncScoreProgress includes sampled card diagnostics in debug mode", () => {
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
      featureConfig: {
        colorTheme: "checkout-focus",
        barSize: "standard",
        effect: "pulse-core",
        debug: true,
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-501-debug",
          match: {
            id: "match-501-debug",
            variant: "X01 501",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.equal(result.debug.reason, "rendered");
  assert.equal(result.debug.startScore, 501);
  assert.equal(result.debug.startScoreSource, "snapshot-variant");
  assert.equal(result.debug.cardCount, 2);
  assert.equal(result.debug.renderedCards, 2);
  assert.equal(result.debug.sampledCards.length, 2);
  assert.equal(result.debug.sampledCards[0].hostWidth, "33.93%");
  assert.equal(result.debug.sampledCards[1].hostWidth, "50.10%");
});

test("mountX01ScoreProgress emits detailed debug warning payloads", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/debug-case",
  });
  documentRef.variantElement.textContent = "X01";

  const logs = [];
  const warnings = [];
  const cleanup = mountX01ScoreProgress({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: {
        registerMutationObserver() {},
        disconnect() {},
      },
    },
    gameState: {
      getSnapshot: () => ({
        match: {
          id: "debug-match",
          variant: "X01",
        },
      }),
      subscribe: () => () => {},
    },
    config: {
      getFeatureConfig: () => ({
        colorTheme: "checkout-focus",
        barSize: "standard",
        effect: "pulse-core",
        debug: true,
      }),
    },
    featureDebug: {
      enabled: true,
      log: (...args) => logs.push(args),
      warn: (...args) => warnings.push(args),
    },
  });

  await wait(5);
  cleanup();

  assert.equal(Array.isArray(logs), true);
  assert.equal(warnings.length > 0, true);
  assert.match(String(warnings[0][0] || ""), /reason="missing-start-score"/);
  assert.match(String(warnings[0][0] || ""), /payload=\{.*"reason":"missing-start-score"/s);
  assert.equal(warnings[0][1]?.reason, "missing-start-score");
  assert.equal(Array.isArray(warnings[0][1]?.sampledCards), true);
});

test("mountX01ScoreProgress ignores self-managed bar churn but reacts to player-display changes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);
  const player = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(player.cardNode);

  const observerState = { callback: null };
  const scheduleCounter = { count: 0 };
  const cleanup = mountX01ScoreProgress({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: {
        registerMutationObserver(options) {
          observerState.callback = options.callback;
        },
        disconnect() {},
      },
    },
    gameState: {
      getSnapshot: () => ({
        match: {
          id: "match-progress-observer",
          variant: "X01 501",
        },
      }),
      subscribe: () => () => {},
    },
    config: {
      getFeatureConfig: () => ({
        colorTheme: "checkout-focus",
        barSize: "standard",
        effect: "pulse-core",
      }),
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  assert.equal(typeof observerState.callback, "function");
  const hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  const initialCount = scheduleCounter.count;

  observerState.callback([
    {
      type: "childList",
      target: hostNode,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount);

  observerState.callback([
    {
      type: "attributes",
      target: player.cardNode,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount + 1);

  cleanup();
});

test("mountX01ScoreProgress scopes generic mutation targets to X01 areas", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);
  const player = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(player.cardNode);

  const turn = documentRef.createElement("div");
  turn.id = "ad-ext-turn";
  const turnPoints = documentRef.createElement("p");
  turnPoints.classList.add("ad-ext-turn-points");
  turnPoints.textContent = "60";
  turn.appendChild(turnPoints);
  documentRef.main.appendChild(turn);

  const outsideButton = documentRef.createElement("button");
  const outsideSpan = documentRef.createElement("span");
  const outsideParagraph = documentRef.createElement("p");
  documentRef.main.appendChild(outsideButton);
  documentRef.main.appendChild(outsideSpan);
  documentRef.main.appendChild(outsideParagraph);

  const observerState = { callback: null };
  const scheduleCounter = { count: 0 };
  const cleanup = mountX01ScoreProgress({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: {
        registerMutationObserver(options) {
          observerState.callback = options.callback;
        },
        disconnect() {},
      },
    },
    gameState: {
      getSnapshot: () => ({
        match: {
          id: "match-progress-observer-scope",
          variant: "X01 501",
        },
      }),
      subscribe: () => () => {},
    },
    config: {
      getFeatureConfig: () => ({
        colorTheme: "checkout-focus",
        barSize: "standard",
        effect: "pulse-core",
      }),
    },
    helpers: {
      createRafScheduler() {
        return {
          schedule() {
            scheduleCounter.count += 1;
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  assert.equal(typeof observerState.callback, "function");
  const initialCount = scheduleCounter.count;

  observerState.callback([
    {
      type: "attributes",
      target: outsideButton,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
    {
      type: "attributes",
      target: outsideSpan,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
    {
      type: "attributes",
      target: outsideParagraph,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount);

  observerState.callback([
    {
      type: "attributes",
      target: player.scoreNode,
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount + 1);

  observerState.callback([
    {
      type: "characterData",
      target: {
        nodeType: 3,
        nodeName: "#text",
        parentElement: player.scoreNode,
        parentNode: player.scoreNode,
      },
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount + 2);

  observerState.callback([
    {
      type: "characterData",
      target: {
        nodeType: 3,
        nodeName: "#text",
        parentNode: turnPoints,
      },
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount + 3);

  const subtree = documentRef.createElement("section");
  const nestedPlayerDisplay = documentRef.createElement("div");
  nestedPlayerDisplay.id = "ad-ext-player-display";
  subtree.appendChild(nestedPlayerDisplay);

  observerState.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [subtree],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, initialCount + 4);

  cleanup();
});

test("syncScoreProgress keeps inactive styling untouched by active-only settings", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const inactivePlayer = createPlayerCard(documentRef, 251);
  playerDisplay.appendChild(inactivePlayer.cardNode);

  syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        colorTheme: "ember-rush",
        barSize: "extrabreit",
        effect: "signal-sweep",
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-inactive-only",
          match: {
            id: "match-inactive-only",
            variant: "501",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  const inactiveHost = inactivePlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(inactiveHost);
  assert.equal(inactiveHost.classList.contains(INACTIVE_CLASS), true);
  assert.equal(inactiveHost.classList.contains("ad-ext-x01-score-progress--size-extrabreit"), false);
  assert.equal(
    inactiveHost.style.getPropertyValue("--ad-ext-x01-score-progress-fill-bg-active"),
    ""
  );
  const inactiveFill = inactiveHost.querySelector(`.${FILL_CLASS}`);
  assert.ok(inactiveFill);
  assert.equal(
    inactiveFill.classList.contains("ad-ext-x01-score-progress__fill--effect-signal-sweep"),
    false
  );
});

test("syncScoreProgress keeps same-name online players in separate score identities", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const firstPlayer = createPlayerCard(documentRef, 501);
  const secondPlayer = createPlayerCard(documentRef, 301);
  [firstPlayer, secondPlayer].forEach((player) => {
    const nameNode = documentRef.createElement("span");
    nameNode.classList.add("ad-ext-player-name");
    nameNode.textContent = "ONLINE PLAYER";
    const profileBadge = documentRef.createElement("span");
    profileBadge.classList.add("chakra-badge", "css-n2903v");
    profileBadge.textContent = "35+";
    player.stackNode.appendChild(nameNode);
    player.stackNode.appendChild(profileBadge);
    playerDisplay.appendChild(player.cardNode);
  });

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        debug: true,
      },
      gameState: {
        getSnapshot: () => ({
          topic: "same-name-online",
          match: {
            id: "same-name-online",
            variant: "501",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  assert.deepEqual(
    result.debug.sampledCards.map((card) => card.cardIdentity),
    ["name-slot:0:ONLINE PLAYER", "name-slot:1:ONLINE PLAYER"]
  );
});

test("syncScoreProgress inserts host after nested online score wrapper", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "301";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const player = createNestedScorePlayerCard(documentRef, 301, { active: true });
  const identityNode = documentRef.createElement("div");
  identityNode.classList.add("chakra-stack", "css-37hv00");
  const nameNode = documentRef.createElement("span");
  nameNode.classList.add("ad-ext-player-name");
  nameNode.textContent = "ONLINE PLAYER";
  const profileBadge = documentRef.createElement("span");
  profileBadge.classList.add("chakra-badge", "css-n2903v");
  profileBadge.textContent = "35+";
  identityNode.appendChild(nameNode);
  identityNode.appendChild(profileBadge);
  player.stackNode.appendChild(identityNode);
  playerDisplay.appendChild(player.cardNode);

  const result = syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        debug: true,
      },
      gameState: {
        getSnapshot: () => ({
          topic: "nested-online-score",
          match: {
            id: "nested-online-score",
            variant: "301",
          },
        }),
      },
    },
    createScoreProgressState()
  );

  const hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  assert.equal(hostNode.parentNode, player.stackNode);
  assert.equal(hostNode.previousElementSibling, player.scoreWrapper);
  assert.equal(player.stackNode.getAttribute(STACK_ATTRIBUTE), "true");
  assert.equal(result.renderedCards, 1);
  assert.equal(result.debug.sampledCards[0].scoreContainer, "div.chakra-stack.css-xsngok");
  assert.equal(result.debug.sampledCards[0].hostPrevious, "div.chakra-stack.css-xsngok");
});

test("syncScoreProgress removes active-only size and effects when a card becomes inactive", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const player = createPlayerCard(documentRef, 251, { active: true });
  playerDisplay.appendChild(player.cardNode);
  const state = createScoreProgressState();

  syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        colorTheme: "ember-rush",
        barSize: "extrabreit",
        effect: "signal-sweep",
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-active-pass",
          match: {
            id: "match-active-pass",
            variant: "501",
          },
        }),
      },
    },
    state
  );

  let hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  assert.equal(hostNode.classList.contains("ad-ext-x01-score-progress--size-extrabreit"), true);
  let fillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  assert.ok(fillNode);
  assert.equal(
    fillNode.classList.contains("ad-ext-x01-score-progress__fill--effect-signal-sweep"),
    true
  );

  player.cardNode.classList.remove("ad-ext-player-active");
  syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        colorTheme: "ember-rush",
        barSize: "extrabreit",
        effect: "signal-sweep",
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-inactive-pass",
          match: {
            id: "match-inactive-pass",
            variant: "501",
          },
        }),
      },
    },
    state
  );

  hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  assert.equal(hostNode.classList.contains(INACTIVE_CLASS), true);
  assert.equal(hostNode.classList.contains("ad-ext-x01-score-progress--size-extrabreit"), false);
  assert.equal(
    hostNode.style.getPropertyValue("--ad-ext-x01-score-progress-fill-bg-active"),
    ""
  );
  fillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  assert.ok(fillNode);
  assert.equal(
    fillNode.classList.contains("ad-ext-x01-score-progress__fill--effect-signal-sweep"),
    false
  );
});

test("syncScoreProgress falls back to gameState active player index when active DOM class is missing", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const firstPlayer = createPlayerCard(documentRef, 301);
  const secondPlayer = createPlayerCard(documentRef, 251);
  firstPlayer.cardNode.classList.remove("ad-ext-player-active");
  secondPlayer.cardNode.classList.remove("ad-ext-player-active");
  playerDisplay.appendChild(firstPlayer.cardNode);
  playerDisplay.appendChild(secondPlayer.cardNode);

  syncScoreProgress(
    {
      documentRef,
      windowRef,
      featureConfig: {
        colorTheme: "checkout-focus",
        barSize: "extrabreit",
        effect: "glass-charge",
      },
      gameState: {
        getSnapshot: () => ({
          topic: "match-active-index-fallback",
          match: {
            id: "match-active-index-fallback",
            variant: "501",
          },
        }),
        getActivePlayerIndex: () => 1,
      },
    },
    createScoreProgressState()
  );

  const firstHost = firstPlayer.cardNode.querySelector(HOST_SELECTOR);
  const secondHost = secondPlayer.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(firstHost);
  assert.ok(secondHost);
  assert.equal(firstHost.classList.contains(INACTIVE_CLASS), true);
  assert.equal(secondHost.classList.contains(ACTIVE_CLASS), true);
  assert.equal(secondHost.classList.contains("ad-ext-x01-score-progress--size-extrabreit"), true);
});

test("syncScoreProgress triggers score-change animation when score updates", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const player = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(player.cardNode);
  const state = createScoreProgressState();

  const runSync = () =>
    syncScoreProgress(
      {
        documentRef,
        windowRef,
        featureConfig: {
          colorTheme: "checkout-focus",
          barSize: "standard",
          effect: "pulse-core",
        },
        gameState: {
          getSnapshot: () => ({
            topic: "match-effect-trigger",
            match: {
              id: "match-effect-trigger",
              variant: "501",
            },
          }),
        },
      },
      state
    );

  runSync();
  player.scoreNode.textContent = "251";
  runSync();

  const hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  const fillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  assert.ok(fillNode);
  assert.equal(fillNode.getAttribute(EFFECT_ATTRIBUTE), "pulse-core");
  assert.equal(
    fillNode.classList.contains("ad-ext-x01-score-progress__fill--effect-pulse-core"),
    true
  );
  assert.equal(String(fillNode.getAttribute("data-ad-ext-x01-score-progress-effect-token") || ""), "1");
  assert.ok(fillNode.__lastAnimation);
});

test("syncScoreProgress maps retired electric-surge effect values to signal-sweep", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);
  const state = createScoreProgressState();

  const runSync = () =>
    syncScoreProgress(
      {
        documentRef,
        windowRef,
        featureConfig: {
          colorTheme: "checkout-focus",
          barSize: "standard",
          effect: "electric-surge",
        },
        gameState: {
          getSnapshot: () => ({
            topic: "match-electric-legacy",
            match: {
              id: "match-electric-legacy",
              variant: "501",
            },
          }),
        },
      },
      state
    );

  const firstCard = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(firstCard.cardNode);
  runSync();
  firstCard.scoreNode.textContent = "251";
  runSync();

  const hostNode = firstCard.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  assert.equal(hostNode.getAttribute(EFFECT_ATTRIBUTE), "signal-sweep");
  const fillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  assert.ok(fillNode);
  assert.equal(fillNode.getAttribute(EFFECT_ATTRIBUTE), "signal-sweep");
  assert.equal(
    fillNode.classList.contains("ad-ext-x01-score-progress__fill--effect-signal-sweep"),
    true
  );
  assert.equal(
    fillNode.classList.contains("ad-ext-x01-score-progress__fill--effect-electric-surge"),
    false
  );
  assert.equal(String(fillNode.getAttribute("data-ad-ext-x01-score-progress-effect-token") || ""), "1");
});

test("syncScoreProgress animates the ghost trail on active score changes only", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const player = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(player.cardNode);
  const state = createScoreProgressState();

  const runSync = () =>
    syncScoreProgress(
      {
        documentRef,
        windowRef,
        featureConfig: {
          colorTheme: "checkout-focus",
          barSize: "standard",
          effect: "ghost-trail",
        },
        gameState: {
          getSnapshot: () => ({
            topic: "match-ghost-trail",
            match: {
              id: "match-ghost-trail",
              variant: "501",
            },
          }),
        },
      },
      state
    );

  runSync();
  player.scoreNode.textContent = "201";
  runSync();

  const hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  const fillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  const trailNode = hostNode.querySelector(`.${TRAIL_CLASS}`);
  assert.ok(fillNode);
  assert.ok(trailNode);
  assert.equal(fillNode.getAttribute(EFFECT_ATTRIBUTE), "ghost-trail");
  assert.equal(
    fillNode.classList.contains("ad-ext-x01-score-progress__fill--effect-ghost-trail"),
    true
  );
  assert.equal(String(fillNode.getAttribute("data-ad-ext-x01-score-progress-effect-token") || ""), "1");
  assert.equal(trailNode.style.getPropertyValue("--ad-ext-x01-score-progress-trail-width"), "60.08%");
  assert.equal(trailNode.style.getPropertyValue("opacity"), "0.76");
  assert.ok(trailNode.__lastAnimation);
});

test("syncScoreProgress keeps running ghost-trail animation on passive re-sync", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const player = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(player.cardNode);
  const state = createScoreProgressState();

  const runSync = () =>
    syncScoreProgress(
      {
        documentRef,
        windowRef,
        featureConfig: {
          colorTheme: "checkout-focus",
          barSize: "standard",
          effect: "ghost-trail",
        },
        gameState: {
          getSnapshot: () => ({
            topic: "match-ghost-trail-resync",
            match: {
              id: "match-ghost-trail-resync",
              variant: "501",
            },
          }),
        },
      },
      state
    );

  runSync();
  player.scoreNode.textContent = "201";
  runSync();

  const hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);
  const trailNode = hostNode.querySelector(`.${TRAIL_CLASS}`);
  assert.ok(trailNode);
  const runningAnimation = trailNode.__lastAnimation;
  assert.ok(runningAnimation);
  assert.equal(runningAnimation.playState, "running");

  runSync();

  assert.equal(trailNode.__lastAnimation, runningAnimation);
  assert.equal(runningAnimation.playState, "running");
});

test("syncScoreProgress keeps intact progress nodes stable on passive re-sync and rebuilds only after structure damage", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/demo",
  });
  documentRef.variantElement.textContent = "501";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplay);

  const player = createPlayerCard(documentRef, 301, { active: true });
  playerDisplay.appendChild(player.cardNode);
  const state = createScoreProgressState();

  const runSync = () =>
    syncScoreProgress(
      {
        documentRef,
        windowRef,
        featureConfig: {
          colorTheme: "checkout-focus",
          barSize: "standard",
          effect: "ghost-trail",
        },
        gameState: {
          getSnapshot: () => ({
            topic: "match-ghost-trail-stability",
            match: {
              id: "match-ghost-trail-stability",
              variant: "501",
            },
          }),
        },
      },
      state
    );

  runSync();
  player.scoreNode.textContent = "201";
  runSync();

  const hostNode = player.cardNode.querySelector(HOST_SELECTOR);
  assert.ok(hostNode);

  const stableTrackNode = hostNode.querySelector(`.${TRACK_CLASS}`);
  const stableFillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  const stableTrailNode = hostNode.querySelector(`.${TRAIL_CLASS}`);
  const stableAnimation = stableTrailNode?.__lastAnimation;
  assert.ok(stableTrackNode);
  assert.ok(stableFillNode);
  assert.ok(stableTrailNode);
  assert.ok(stableAnimation);

  runSync();

  assert.equal(hostNode.querySelector(`.${TRACK_CLASS}`), stableTrackNode);
  assert.equal(hostNode.querySelector(`.${FILL_CLASS}`), stableFillNode);
  assert.equal(hostNode.querySelector(`.${TRAIL_CLASS}`), stableTrailNode);
  assert.equal(stableTrailNode.__lastAnimation, stableAnimation);
  assert.equal(stableAnimation.playState, "running");

  stableTrailNode.remove();
  runSync();

  const repairedTrackNode = hostNode.querySelector(`.${TRACK_CLASS}`);
  const repairedFillNode = hostNode.querySelector(`.${FILL_CLASS}`);
  const repairedTrailNode = hostNode.querySelector(`.${TRAIL_CLASS}`);
  assert.ok(repairedTrackNode);
  assert.ok(repairedFillNode);
  assert.ok(repairedTrailNode);
  assert.notEqual(repairedTrackNode, stableTrackNode);
  assert.notEqual(repairedFillNode, stableFillNode);
  assert.notEqual(repairedTrailNode, stableTrailNode);
  assert.equal(hostNode.children.length, 1);
  assert.equal(hostNode.children[0], repairedTrackNode);
  assert.equal(repairedTrackNode.children[0], repairedTrailNode);
  assert.equal(repairedTrackNode.children[1], repairedFillNode);
});

test("score-progress style reserves a dedicated player-card row for the bar", () => {
  const css = buildStyleText();

  assert.match(
    css,
    /\[data-ad-ext-x01-score-progress='true'\]\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-row:\s*3;[^}]*align-self:\s*start;[^}]*flex:\s*0\s+0\s+100%;/s
  );
});

test("score-progress style enforces stack layout that keeps the bar below score rows", () => {
  const css = buildStyleText();

  assert.match(
    css,
    /\.chakra-stack\[data-ad-ext-x01-score-progress-stack='true'\]\{[^}]*grid-template-columns:1fr auto[^}]*grid-template-rows:max-content max-content auto[^}]*align-content:start/s
  );
  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-player-active > \.chakra-stack\[data-ad-ext-x01-score-progress-stack='true'\],\s*#ad-ext-player-display \.ad-ext-player\.ad-ext-player-winner > \.chakra-stack\[data-ad-ext-x01-score-progress-stack='true'\]\{[^}]*align-content:center/s
  );
  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-player-inactive > \.chakra-stack\[data-ad-ext-x01-score-progress-stack='true'\]\{[^}]*grid-template-rows:max-content max-content max-content[^}]*min-height:79px[^}]*height:auto[^}]*padding-top:6px[^}]*padding-bottom:4px/s
  );
  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-player-inactive > \.chakra-stack\[data-ad-ext-x01-score-progress-stack='true'\] > \.ad-ext-player-score\{[^}]*line-height:1[^}]*align-self:center/s
  );
  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-player-inactive > \.chakra-stack\[data-ad-ext-x01-score-progress-stack='true'\] > \[data-ad-ext-x01-score-progress='true'\]\{[^}]*margin-top:1px/s
  );
});

test("score-progress style defines clearly separated active size presets", () => {
  const css = buildStyleText();

  assert.match(
    css,
    /--ad-ext-x01-score-progress-margin-top-active:2em;/s
  );
  assert.match(
    css,
    /--ad-ext-x01-score-progress-margin-top-inactive:clamp\(\.16rem,\s*\.45vw,\s*\.32rem\);/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-score-progress='true'\]\.ad-ext-x01-score-progress--active\{[^}]*--ad-ext-x01-score-progress-margin-top:var\(--ad-ext-x01-score-progress-margin-top-active\);/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-score-progress='true'\]\.ad-ext-x01-score-progress--inactive\{[^}]*--ad-ext-x01-score-progress-margin-top:var\(--ad-ext-x01-score-progress-margin-top-inactive\);/s
  );
  assert.match(
    css,
    /--size-schmal\{[^}]*height-active:clamp\(\.3rem,\s*\.62vw,\s*\.46rem\);/s
  );
  assert.match(
    css,
    /--size-standard\{[^}]*height-active:clamp\(\.72rem,\s*1\.35vw,\s*1\.02rem\);/s
  );
  assert.match(
    css,
    /--size-breit\{[^}]*height-active:clamp\(1\.08rem,\s*1\.9vw,\s*1\.4rem\);/s
  );
  assert.match(
    css,
    /--size-extrabreit\{[^}]*height-active:clamp\(1\.48rem,\s*2\.52vw,\s*1\.92rem\);/s
  );
});

test("score-progress style no longer exposes selectable design presets", () => {
  const css = buildStyleText();

  assert.equal(css.includes("--preset-plain"), false);
  assert.equal(css.includes("--preset-stripes"), false);
  assert.equal(css.includes("--preset-liquid-glass"), false);
});

test("score-progress style does not ship electric-surge selectors anymore", () => {
  const css = buildStyleText();

  assert.equal(css.includes("electric-surge"), false);
  assert.equal(css.includes("ad-ext-x01-score-progress-electric-track"), false);
  assert.equal(css.includes("ad-ext-electric-displace"), false);
});

test("score-progress style does not force displacement filters on non-electric effects", () => {
  const css = buildStyleText();
  const pulseCoreBlock = css.match(
    /\.ad-ext-x01-score-progress__fill--effect-pulse-core\{[^}]+\}/s
  )?.[0] || "";
  const signalSweepBlock = css.match(
    /\.ad-ext-x01-score-progress__fill--effect-signal-sweep\{[^}]+\}/s
  )?.[0] || "";

  assert.equal(pulseCoreBlock.includes("filter:url(#ad-ext-electric-displace"), false);
  assert.equal(signalSweepBlock.includes("filter:url(#ad-ext-electric-displace"), false);
});
