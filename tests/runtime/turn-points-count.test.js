import test from "node:test";
import assert from "node:assert/strict";

import {
  stopAnimation,
  updateTurnPoints,
} from "../../src/features/turn-points-count/logic.js";
import { initializeTurnPointsCount } from "../../src/features/turn-points-count/index.js";
import {
  SCORE_FRAME_CLASS,
  SCORE_FLASH_SEQUENCE_ATTRIBUTE,
  SCORE_FLASH_CLASS,
  SCORE_FRAME_SEQUENCE_ATTRIBUTE,
  SCORE_SELECTOR,
  STYLE_ID,
  buildStyleText,
} from "../../src/features/turn-points-count/style.js";
import { FakeDocument, createFakeTimerHarness, createFakeWindow } from "./fake-dom.js";

function createState() {
  return {
    lastValueByNode: new Map(),
    renderedValueByNode: new Map(),
    targetValueByNode: new Map(),
    activeRafByNode: new Map(),
    activeAnimeByNode: new Map(),
    flashFrameByScoreNode: new Map(),
    flashRafByNode: new Map(),
    flashTimeoutByNode: new Map(),
  };
}

function createTurnPointsFrame(documentRef) {
  const scoreNode = documentRef.turnPointsElement;
  const currentParent = scoreNode.parentNode;
  const frameNode = documentRef.createElement("div");
  frameNode.classList.add("ad-ext-turn-points-row");

  if (currentParent) {
    scoreNode.before(frameNode);
    scoreNode.remove();
  }
  frameNode.appendChild(scoreNode);

  return {
    scoreNode,
    frameNode,
  };
}

function createAnimeStub() {
  const calls = [];
  const instances = [];

  const anime = (params = {}) => {
    calls.push(params);
    const instance = {
      paused: false,
      pause() {
        this.paused = true;
      },
    };
    instances.push(instance);
    return instance;
  };

  anime.calls = calls;
  anime.instances = instances;
  return anime;
}

function createObserverRegistryProbe() {
  const state = {
    registration: null,
    disconnects: [],
  };

  return {
    state,
    registry: {
      registerMutationObserver(options = {}) {
        state.registration = options;
        return {};
      },
      disconnect(key) {
        state.disconnects.push(String(key || ""));
        return true;
      },
    },
  };
}

function createListenerRegistryProbe() {
  const state = {
    registrations: [],
    removals: [],
  };

  return {
    state,
    registry: {
      register(options = {}) {
        state.registrations.push(options);
      },
      remove(key) {
        state.removals.push(String(key || ""));
      },
    },
  };
}

function createImmediateSchedulerFactory(scheduleCounter) {
  return function createImmediateScheduler(callback) {
    let cancelled = false;

    return {
      schedule() {
        if (cancelled) {
          return;
        }
        scheduleCounter.count += 1;
        callback();
      },
      cancel() {
        cancelled = true;
        scheduleCounter.cancelled = true;
      },
      isScheduled() {
        return false;
      },
    };
  };
}

function createMountHarness(options = {}) {
  const documentRef = options.documentRef || new FakeDocument();
  const windowRef = options.windowRef || createFakeWindow({ documentRef });
  const animeRef = options.animeRef || createAnimeStub();
  windowRef.anime = animeRef;
  const observerProbe = createObserverRegistryProbe();
  const listenerProbe = createListenerRegistryProbe();
  const scheduleCounter = {
    count: 0,
    cancelled: false,
  };
  let unsubscribeCount = 0;
  let gameStateListener = null;

  const cleanup = initializeTurnPointsCount({
    documentRef,
    windowRef,
    registries: {
      observers: observerProbe.registry,
      listeners: listenerProbe.registry,
    },
    gameState: {
      subscribe(listener) {
        gameStateListener = listener;
        return () => {
          unsubscribeCount += 1;
        };
      },
    },
    config: {
      getFeatureConfig() {
        return {
          durationMs: 416,
          flashOnChange: true,
          flashMode: "on-change",
        };
      },
    },
    helpers: {
      createRafScheduler: createImmediateSchedulerFactory(scheduleCounter),
    },
  });

  return {
    animeRef,
    cleanup,
    documentRef,
    gameStateListener,
    listenerProbe,
    observerProbe,
    scheduleCounter,
    windowRef,
    get unsubscribeCount() {
      return unsubscribeCount;
    },
  };
}

function moveTurnPointsIntoTurnContainer(documentRef) {
  documentRef.turnContainer.appendChild(documentRef.turnPointsElement);
  return createTurnPointsFrame(documentRef);
}

test("turn-points-count keeps flash frame for a short afterglow after score animation completes", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

  try {
    updateTurnPoints({
      documentRef,
      state,
      durationMs: 416,
      flashAfterglowMs: 500,
      animeRef,
      windowRef,
    });
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);

    scoreNode.textContent = "45";
    updateTurnPoints({
      documentRef,
      state,
      durationMs: 416,
      flashAfterglowMs: 500,
      animeRef,
      windowRef,
    });

    assert.equal(animeRef.calls.length, 1);
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);
    assert.equal(state.targetValueByNode.get(scoreNode), 45);

    animeRef.calls[0].complete();
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);
    assert.equal(state.activeAnimeByNode.has(scoreNode), false);
    assert.equal(state.targetValueByNode.has(scoreNode), false);
    assert.equal(state.lastValueByNode.get(scoreNode), 45);

    timers.advance(560);
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
  } finally {
    timers.restoreGlobals();
  }
});

test("turn-points-count does not flash when the displayed value does not change", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

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
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
});

test("stopAnimation clears any pending flash state immediately", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

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
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

  stopAnimation(scoreNode, state, windowRef);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
  assert.equal(state.activeAnimeByNode.has(scoreNode), false);
  assert.equal(state.targetValueByNode.has(scoreNode), false);
});

test("turn-points-count removes frame flash classes when a score node is detached", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });
  scoreNode.textContent = "45";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

  scoreNode.remove();
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
  assert.equal(state.lastValueByNode.has(scoreNode), false);
});

test("turn-points-count can disable the flash effect without disabling score animation", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    flashEnabled: false,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "45";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    flashEnabled: false,
    animeRef,
    windowRef,
  });

  assert.equal(animeRef.calls.length, 1);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
});

test("turn-points-count supports a permanent frame mode while keeping score flash scoped to value changes", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

  try {
    updateTurnPoints({
      documentRef,
      state,
      durationMs: 416,
      flashMode: "permanent",
      flashAfterglowMs: 500,
      animeRef,
      windowRef,
    });

    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

    scoreNode.textContent = "45";
    updateTurnPoints({
      documentRef,
      state,
      durationMs: 416,
      flashMode: "permanent",
      flashAfterglowMs: 500,
      animeRef,
      windowRef,
    });

    assert.equal(animeRef.calls.length, 1);
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

    animeRef.calls[0].complete();
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

    timers.advance(560);
    assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

    stopAnimation(scoreNode, state, windowRef);
    assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
  } finally {
    timers.restoreGlobals();
  }
});

test("turn-points-count restarts score flash through sequence attributes without layout reads", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, frameNode } = createTurnPointsFrame(documentRef);

  scoreNode.getBoundingClientRect = () => {
    throw new Error("score layout read not expected");
  };
  frameNode.getBoundingClientRect = () => {
    throw new Error("frame layout read not expected");
  };

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "45";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(scoreNode.getAttribute(SCORE_FLASH_SEQUENCE_ATTRIBUTE), "1");
  assert.equal(frameNode.getAttribute(SCORE_FRAME_SEQUENCE_ATTRIBUTE), "1");
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

  animeRef.calls[0].complete();
  assert.equal(scoreNode.getAttribute(SCORE_FLASH_SEQUENCE_ATTRIBUTE), null);
  assert.equal(frameNode.getAttribute(SCORE_FRAME_SEQUENCE_ATTRIBUTE), null);
  scoreNode.textContent = "60";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(scoreNode.getAttribute(SCORE_FLASH_SEQUENCE_ATTRIBUTE), "1");
  assert.equal(frameNode.getAttribute(SCORE_FRAME_SEQUENCE_ATTRIBUTE), "1");
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);
});

test("turn-points-count observes the discovered turn surface when present", () => {
  const harness = createMountHarness();

  assert.equal(
    harness.observerProbe.state.registration?.target,
    harness.documentRef.turnContainer
  );

  harness.cleanup();
});

test("turn-points-count falls back to the document root when turn surface is absent", () => {
  const documentRef = new FakeDocument();
  documentRef.turnContainer.remove();
  const harness = createMountHarness({ documentRef });

  assert.equal(
    harness.observerProbe.state.registration?.target,
    documentRef.documentElement
  );

  harness.cleanup();
});

test("turn-points-count does not schedule for unrelated document mutations when scoped", () => {
  const harness = createMountHarness();
  const callback = harness.observerProbe.state.registration?.callback;
  const initialScheduleCount = harness.scheduleCounter.count;
  const unrelatedNode = harness.documentRef.createElement("div");
  harness.documentRef.body.appendChild(unrelatedNode);

  callback([
    {
      type: "childList",
      target: harness.documentRef.body,
      addedNodes: [unrelatedNode],
      removedNodes: [],
    },
  ]);

  assert.equal(harness.observerProbe.state.registration?.target, harness.documentRef.turnContainer);
  assert.equal(harness.scheduleCounter.count, initialScheduleCount);

  harness.cleanup();
});

test("turn-points-count schedules relevant turn text, child, and class mutations", () => {
  const documentRef = new FakeDocument();
  const { scoreNode } = moveTurnPointsIntoTurnContainer(documentRef);
  const harness = createMountHarness({ documentRef });
  const callback = harness.observerProbe.state.registration?.callback;
  const textNode = {
    nodeType: 3,
    parentNode: scoreNode,
  };
  const addedNode = documentRef.createElement("div");
  let expectedScheduleCount = harness.scheduleCounter.count;

  callback([
    {
      type: "characterData",
      target: textNode,
    },
  ]);
  expectedScheduleCount += 1;
  assert.equal(harness.scheduleCounter.count, expectedScheduleCount);

  callback([
    {
      type: "childList",
      target: documentRef.turnContainer,
      addedNodes: [addedNode],
      removedNodes: [],
    },
  ]);
  expectedScheduleCount += 1;
  assert.equal(harness.scheduleCounter.count, expectedScheduleCount);

  callback([
    {
      type: "attributes",
      attributeName: "class",
      target: documentRef.throwRow,
    },
  ]);
  expectedScheduleCount += 1;
  assert.equal(harness.scheduleCounter.count, expectedScheduleCount);

  harness.cleanup();
});

test("turn-points-count ignores self-generated animation mutations", () => {
  const documentRef = new FakeDocument();
  const { scoreNode, frameNode } = moveTurnPointsIntoTurnContainer(documentRef);
  const harness = createMountHarness({ documentRef });
  const callback = harness.observerProbe.state.registration?.callback;
  const textNode = {
    nodeType: 3,
    parentNode: scoreNode,
  };

  scoreNode.textContent = "45";
  callback([
    {
      type: "characterData",
      target: textNode,
    },
  ]);

  assert.equal(harness.animeRef.calls.length, 1);
  const scheduleCountAfterAnimation = harness.scheduleCounter.count;

  callback([
    {
      type: "characterData",
      target: textNode,
    },
  ]);
  callback([
    {
      type: "attributes",
      attributeName: "class",
      target: scoreNode,
    },
    {
      type: "attributes",
      attributeName: "class",
      target: frameNode,
    },
  ]);

  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);
  assert.equal(harness.scheduleCounter.count, scheduleCountAfterAnimation);

  harness.cleanup();
});

test("turn-points-count cleanup disconnects observer and stops active animations", () => {
  const documentRef = new FakeDocument();
  const { scoreNode, frameNode } = moveTurnPointsIntoTurnContainer(documentRef);
  const harness = createMountHarness({ documentRef });
  const callback = harness.observerProbe.state.registration?.callback;
  const textNode = {
    nodeType: 3,
    parentNode: scoreNode,
  };

  scoreNode.textContent = "45";
  callback([
    {
      type: "characterData",
      target: textNode,
    },
  ]);

  assert.equal(harness.animeRef.instances[0]?.paused, false);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), true);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), true);

  harness.cleanup();

  assert.deepEqual(harness.observerProbe.state.disconnects, ["turn-points-count:dom-observer"]);
  assert.equal(harness.listenerProbe.state.removals.includes("turn-points-count:document-visibility"), true);
  assert.equal(harness.unsubscribeCount, 1);
  assert.equal(harness.scheduleCounter.cancelled, true);
  assert.equal(harness.animeRef.instances[0]?.paused, true);
  assert.equal(scoreNode.classList.contains(SCORE_FLASH_CLASS), false);
  assert.equal(frameNode.classList.contains(SCORE_FRAME_CLASS), false);
});

test("turn-points-count style exports the scoped flash animation contract", () => {
  const css = buildStyleText();

  assert.equal(STYLE_ID, "ad-ext-turn-points-count-style");
  assert.match(
    css,
    new RegExp(
      `${SCORE_SELECTOR.replace(".", String.raw`\.`)}\\.${SCORE_FLASH_CLASS}\\[${SCORE_FLASH_SEQUENCE_ATTRIBUTE}="0"\\]`
    )
  );
  assert.equal(css.includes(`.${SCORE_FRAME_CLASS}{`), true);
  assert.equal(css.includes("ad-ext-turn-points-electric-filter-strong"), true);
  assert.equal(css.includes(SCORE_FRAME_SEQUENCE_ATTRIBUTE), true);
  assert.equal(css.includes("@keyframes ad-ext-turn-points-count-flash-a"), true);
  assert.equal(css.includes("@keyframes ad-ext-turn-points-count-flash-b"), true);
});
