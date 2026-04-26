import test from "node:test";
import assert from "node:assert/strict";

import {
  collectScoreNodes,
  isNodeWithinActiveScoreAnimation,
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
    activeCountUpByNode: new Map(),
    flashFrameByScoreNode: new Map(),
    flashRafByNode: new Map(),
    flashTimeoutByNode: new Map(),
    scoreNodeCache: [],
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
    wrapperNode: frameNode,
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

function createCountUpClassStub() {
  const instances = [];

  class CountUpStub {
    constructor(target, endVal, options = {}) {
      this.target = target;
      this.endVal = endVal;
      this.options = options;
      this.error = "";
      this.destroyed = false;
      this.paused = true;
      instances.push(this);
    }

    start(callback) {
      this.paused = false;
      this.callback = callback;
    }

    onDestroy() {
      this.destroyed = true;
      this.paused = true;
    }
  }

  CountUpStub.instances = instances;
  return CountUpStub;
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
          countEffect: "steps",
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

    timers.advance(432);
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

    timers.advance(432);
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
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
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

  timers.advance(432);
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

test("turn-points-count rewinds the browser-updated score before counting to the new value", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode } = createTurnPointsFrame(documentRef);

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "120";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(animeRef.calls.length, 1);
  assert.equal(animeRef.calls[0].value, 120);
  assert.equal(animeRef.calls[0].easing, "linear");
  assert.equal("round" in animeRef.calls[0], false);
  assert.equal(scoreNode.textContent, "60");
  assert.equal(state.renderedValueByNode.get(scoreNode), 60);
  assert.equal(state.targetValueByNode.get(scoreNode), 120);
});

test("turn-points-count uses CountUp with outCubic timing when the smooth style is selected", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const CountUpStub = createCountUpClassStub();
  const { scoreNode } = createTurnPointsFrame(documentRef);
  scoreNode.textContent = "0";

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 3000,
    countEffect: "countup",
    countUpRef: CountUpStub,
    windowRef,
  });

  scoreNode.textContent = "60";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 3000,
    countEffect: "countup",
    countUpRef: CountUpStub,
    windowRef,
  });

  const countUpInstance = CountUpStub.instances[0];
  assert.ok(countUpInstance);
  assert.equal(countUpInstance.target, scoreNode);
  assert.equal(countUpInstance.endVal, 60);
  assert.equal(countUpInstance.options.startVal, 0);
  assert.equal(countUpInstance.options.duration, 3);
  assert.equal(countUpInstance.options.useGrouping, false);
  assert.equal(countUpInstance.options.useEasing, true);
  assert.equal(countUpInstance.options.formattingFn(31.4), "31");
  assert.equal(state.renderedValueByNode.get(scoreNode), 31);
  assert.equal(Math.round(countUpInstance.options.easingFn(500, 0, 60, 1000)), 53);

  countUpInstance.callback();
  assert.equal(countUpInstance.destroyed, true);
  assert.equal(scoreNode.textContent, "60");
  assert.equal(state.lastValueByNode.get(scoreNode), 60);
  assert.equal(state.activeCountUpByNode.has(scoreNode), false);
});

test("turn-points-count wires the odometer plugin only for the odometer count style", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const CountUpStub = createCountUpClassStub();
  const odometerOptions = [];
  class OdometerStub {
    constructor(options = {}) {
      this.options = options;
      odometerOptions.push(options);
    }
  }
  const { scoreNode } = createTurnPointsFrame(documentRef);
  scoreNode.textContent = "0";

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 5000,
    countEffect: "odometer",
    countUpRef: CountUpStub,
    odometerPluginRef: OdometerStub,
    windowRef,
  });

  scoreNode.textContent = "60";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 5000,
    countEffect: "odometer",
    countUpRef: CountUpStub,
    odometerPluginRef: OdometerStub,
    windowRef,
  });

  assert.equal(odometerOptions.length, 1);
  assert.deepEqual(odometerOptions[0], {
    duration: 5,
    lastDigitDelay: 0,
  });
  assert.ok(CountUpStub.instances[0].options.plugin instanceof OdometerStub);
});

test("turn-points-count detects self-generated nested odometer mutations as active score animation", () => {
  const documentRef = new FakeDocument();
  const state = createState();
  const { scoreNode } = createTurnPointsFrame(documentRef);
  const odometerRoot = documentRef.createElement("div");
  const digitColumn = documentRef.createElement("span");
  const digitNode = documentRef.createElement("span");

  odometerRoot.classList.add("odometer-numbers");
  digitNode.textContent = "6";
  scoreNode.appendChild(odometerRoot);
  odometerRoot.appendChild(digitColumn);
  digitColumn.appendChild(digitNode);
  state.activeCountUpByNode.set(scoreNode, { onDestroy() {} });

  assert.equal(isNodeWithinActiveScoreAnimation(digitNode, state), true);
});

test("turn-points-count skips duplicate DOM writes while the rounded score value is unchanged", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode } = createTurnPointsFrame(documentRef);
  let scoreText = scoreNode.textContent;
  let writeCount = 0;

  Object.defineProperty(scoreNode, "textContent", {
    configurable: true,
    get() {
      return scoreText;
    },
    set(value) {
      writeCount += 1;
      scoreText = String(value);
    },
  });

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 1000,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "61";
  writeCount = 0;
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 1000,
    animeRef,
    windowRef,
  });

  assert.equal(writeCount, 1);
  assert.equal(scoreNode.textContent, "60");

  timers.advance(480);
  assert.equal(writeCount, 1);
  assert.equal(scoreNode.textContent, "60");

  timers.advance(64);
  assert.equal(writeCount, 2);
  assert.equal(scoreNode.textContent, "61");
});

test("turn-points-count renders every score step for a T20-sized change", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  const state = createState();
  const { scoreNode } = createTurnPointsFrame(documentRef);
  const writtenValues = [];
  let scoreText = "0";

  Object.defineProperty(scoreNode, "textContent", {
    configurable: true,
    get() {
      return scoreText;
    },
    set(value) {
      scoreText = String(value);
      writtenValues.push(scoreText);
    },
  });

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 1000,
    windowRef,
  });

  scoreNode.textContent = "60";
  writtenValues.length = 0;
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 1000,
    windowRef,
  });
  timers.advance(1100);

  const uniqueValues = new Set(writtenValues);
  assert.equal(scoreNode.textContent, "60");
  assert.equal(state.lastValueByNode.get(scoreNode), 60);
  assert.deepEqual(
    writtenValues,
    Array.from({ length: 61 }, (_value, index) => String(index))
  );
  assert.equal(uniqueValues.size, 61);
  assert.ok(uniqueValues.has("30"), "expected the midpoint to be rendered");
  assert.ok(uniqueValues.has("60"), "expected the final value to be rendered");
});

test("turn-points-count ignores early anime completion while the raf count is still running", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode } = createTurnPointsFrame(documentRef);
  const writtenValues = [];
  let scoreText = "0";

  Object.defineProperty(scoreNode, "textContent", {
    configurable: true,
    get() {
      return scoreText;
    },
    set(value) {
      scoreText = String(value);
      writtenValues.push(scoreText);
    },
  });

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 1000,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "60";
  writtenValues.length = 0;
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 1000,
    animeRef,
    windowRef,
  });
  timers.advance(160);

  assert.equal(scoreNode.textContent, "10");
  animeRef.calls[0].complete();
  assert.equal(scoreNode.textContent, "10");
  assert.equal(state.targetValueByNode.get(scoreNode), 60);
  assert.equal(state.activeRafByNode.has(scoreNode), true);

  timers.advance(1000);
  assert.deepEqual(
    writtenValues,
    Array.from({ length: 61 }, (_value, index) => String(index))
  );
  assert.equal(state.lastValueByNode.get(scoreNode), 60);
});

test("turn-points-count stretches too-short requested durations when needed to keep every score step visible", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode } = createTurnPointsFrame(documentRef);
  const writtenValues = [];
  let scoreText = "0";

  Object.defineProperty(scoreNode, "textContent", {
    configurable: true,
    get() {
      return scoreText;
    },
    set(value) {
      scoreText = String(value);
      writtenValues.push(scoreText);
    },
  });

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 650,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "60";
  writtenValues.length = 0;
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 650,
    animeRef,
    windowRef,
  });
  timers.advance(960);

  assert.equal(animeRef.calls[0].duration, 960);
  assert.deepEqual(
    writtenValues,
    Array.from({ length: 61 }, (_value, index) => String(index))
  );
});

test("turn-points-count scopes the electric frame to the score container instead of the text node", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const state = createState();
  const animeRef = createAnimeStub();
  const { scoreNode, wrapperNode } = createTurnPointsFrame(documentRef);

  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  scoreNode.textContent = "120";
  updateTurnPoints({
    documentRef,
    state,
    durationMs: 416,
    animeRef,
    windowRef,
  });

  assert.equal(scoreNode.classList.contains(SCORE_FRAME_CLASS), false);
  assert.equal(wrapperNode.classList.contains(SCORE_FRAME_CLASS), true);
  assert.equal(scoreNode.getAttribute(SCORE_FRAME_SEQUENCE_ATTRIBUTE), null);
  assert.equal(wrapperNode.getAttribute(SCORE_FRAME_SEQUENCE_ATTRIBUTE), "1");
});

test("turn-points-count caches the discovered score node until it is detached", () => {
  const documentRef = new FakeDocument();
  const state = createState();
  const { scoreNode, wrapperNode } = createTurnPointsFrame(documentRef);
  const originalQuerySelectorAll = documentRef.querySelectorAll.bind(documentRef);
  let scoreQueryCount = 0;

  documentRef.querySelectorAll = (selector) => {
    if (selector === SCORE_SELECTOR) {
      scoreQueryCount += 1;
    }
    return originalQuerySelectorAll(selector);
  };

  assert.deepEqual(collectScoreNodes(documentRef, state), [scoreNode]);
  assert.equal(scoreQueryCount, 1);
  assert.deepEqual(collectScoreNodes(documentRef, state), [scoreNode]);
  assert.equal(scoreQueryCount, 1);

  const replacementNode = documentRef.createElement("p");
  replacementNode.classList.add("ad-ext-turn-points");
  replacementNode.textContent = "120";
  scoreNode.remove();
  wrapperNode.appendChild(replacementNode);

  assert.deepEqual(collectScoreNodes(documentRef, state), [replacementNode]);
  assert.equal(scoreQueryCount, 2);
});

test("turn-points-count observes the score container when it is present in the turn surface", () => {
  const documentRef = new FakeDocument();
  const { wrapperNode } = moveTurnPointsIntoTurnContainer(documentRef);
  const harness = createMountHarness({ documentRef });

  assert.equal(
    harness.observerProbe.state.registration?.target,
    wrapperNode
  );

  harness.cleanup();
});

test("turn-points-count observes the discovered turn surface when no score container is scoped", () => {
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
  const { scoreNode, wrapperNode } = moveTurnPointsIntoTurnContainer(documentRef);
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
      target: wrapperNode,
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
      target: wrapperNode,
    },
  ]);
  expectedScheduleCount += 1;
  assert.equal(harness.scheduleCounter.count, expectedScheduleCount);

  harness.cleanup();
});

test("turn-points-count ignores throw-row mutations once scoped to the score container", () => {
  const documentRef = new FakeDocument();
  moveTurnPointsIntoTurnContainer(documentRef);
  const harness = createMountHarness({ documentRef });
  const callback = harness.observerProbe.state.registration?.callback;
  const initialScheduleCount = harness.scheduleCounter.count;

  callback([
    {
      type: "attributes",
      attributeName: "class",
      target: documentRef.throwRow,
    },
  ]);

  assert.equal(harness.scheduleCounter.count, initialScheduleCount);

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
  assert.equal(css.includes("z-index:0;"), true);
  assert.equal(css.includes("z-index:-1;"), true);
  assert.equal(css.includes("inset:-7px;"), true);
  assert.equal(css.includes("inset:-12px;"), false);
  assert.equal(css.includes("ad-ext-turn-points-count-flash-a 390ms cubic-bezier(.16,.92,.24,1) both"), true);
  assert.equal(css.includes("ad-ext-turn-points-count-flash-b 390ms cubic-bezier(.16,.92,.24,1) both"), true);
  assert.equal(css.includes("ad-ext-turn-points-count-frame-electric-a 840ms steps(4,end) infinite"), true);
  assert.equal(css.includes("ad-ext-turn-points-count-frame-aura-b 840ms ease-out infinite"), true);
  assert.equal(css.includes("ad-ext-turn-points-electric-filter-strong"), true);
  assert.equal(css.includes(SCORE_FRAME_SEQUENCE_ATTRIBUTE), true);
  assert.equal(css.includes("@keyframes ad-ext-turn-points-count-flash-a"), true);
  assert.equal(css.includes("@keyframes ad-ext-turn-points-count-flash-b"), true);
});
