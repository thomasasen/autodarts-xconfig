import test from "node:test";
import assert from "node:assert/strict";

import {
  SHAKE_DURATION_MS,
  clearBustActivePlayerHighlightState,
  createBustActivePlayerHighlightState,
  ensureBustGlassCrackAudio,
  playBustGlassCrackSound,
  runBustActivePlayerHighlightPreview,
  syncBustActivePlayerHighlight,
  tryUnlockBustGlassCrackAudio,
} from "../../src/features/x01-bust-active-player-highlight/logic.js";
import {
  BUST_ACTIVE_CLASS,
  BUST_CRACK_CLASS,
  BUST_CRACK_OVERLAY_CLASS,
  BUST_SHAKE_CLASS,
  DEMO_CRACK_SETTINGS,
  buildStyleText,
} from "../../src/features/x01-bust-active-player-highlight/style.js";
import { mountX01BustActivePlayerHighlight } from "../../src/features/x01-bust-active-player-highlight/index.js";
import { FakeDocument } from "./fake-dom.js";

function createManualTimerWindow(documentRef, computedStyle = {}) {
  const timers = [];
  const audioInstances = [];
  let nextHandle = 1;
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.preload = "";
      this.volume = 1;
      this.currentTime = 0;
      this.playCount = 0;
      audioInstances.push(this);
    }

    play() {
      this.playCount += 1;
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
    }
  }
  const windowRef = {
    document: documentRef,
    Audio: FakeAudio,
    getComputedStyle: (node) => node.__computedStyle || computedStyle,
    setTimeout(callback, ms) {
      const handle = nextHandle;
      nextHandle += 1;
      timers.push({
        handle,
        callback,
        ms,
        cleared: false,
      });
      return handle;
    },
    clearTimeout(handle) {
      const timer = timers.find((entry) => entry.handle === handle);
      if (timer) {
        timer.cleared = true;
      }
    },
  };

  return {
    windowRef,
    timers,
    audioInstances,
    runTimer(index = 0) {
      const timer = timers[index];
      if (timer && !timer.cleared) {
        timer.callback();
      }
    },
  };
}

function appendPlayerDisplay(documentRef) {
  const root = documentRef.createElement("div");
  root.id = "ad-ext-player-display";

  const activeCard = documentRef.createElement("div");
  activeCard.classList.add("ad-ext-player", "ad-ext-player-active");
  const activeSurface = documentRef.createElement("div");
  activeSurface.classList.add("chakra-stack");
  const activeScore = documentRef.createElement("p");
  activeScore.classList.add("ad-ext-player-score");
  activeScore.textContent = "121";
  activeSurface.appendChild(activeScore);
  activeCard.appendChild(activeSurface);

  const inactiveCard = documentRef.createElement("div");
  inactiveCard.classList.add("ad-ext-player", "ad-ext-player-inactive");
  const inactiveSurface = documentRef.createElement("div");
  inactiveSurface.classList.add("chakra-stack");
  const inactiveScore = documentRef.createElement("p");
  inactiveScore.classList.add("ad-ext-player-score");
  inactiveScore.textContent = "121";
  inactiveSurface.appendChild(inactiveScore);
  inactiveCard.appendChild(inactiveSurface);

  root.appendChild(activeCard);
  root.appendChild(inactiveCard);
  documentRef.main.appendChild(root);

  return {
    root,
    activeCard,
    activeSurface,
    inactiveCard,
    inactiveSurface,
  };
}

function setTurnScore(documentRef, text) {
  documentRef.turnScoreElement.remove();
  documentRef.turnScoreElement.textContent = text;
  documentRef.turnContainer.insertBefore(documentRef.turnScoreElement, documentRef.throwRow);
}

function setupBustDocument(options = {}) {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = options.variantText || "X01";
  setTurnScore(documentRef, options.turnScoreText || "BUST");
  const players = appendPlayerDisplay(documentRef);
  documentRef.throwRow.__computedStyle = options.throwComputedStyle || {
    background:
      "rgba(255, 0, 0, 0.15) none repeat scroll 0% 0% / auto padding-box border-box",
    backgroundColor: "rgba(255, 0, 0, 0.15)",
    border: "0.8px solid rgb(207, 52, 52)",
    boxShadow: "none",
  };

  return {
    documentRef,
    ...players,
  };
}

test("x01 bust highlight styles and shakes only the active player on bust entry", () => {
  const { documentRef, activeCard, activeSurface, inactiveCard, inactiveSurface } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const { windowRef, timers } = createManualTimerWindow(documentRef);

  const result = syncBustActivePlayerHighlight({ documentRef, windowRef }, state);

  assert.equal(result.isBust, true);
  assert.equal(result.shook, true);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), true);
  assert.equal(inactiveCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, SHAKE_DURATION_MS);
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-background-color"),
    "rgba(255, 0, 0, 0.15)"
  );
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-border"),
    "0.8px solid rgb(207, 52, 52)"
  );
  assert.equal(activeCard.style.getPropertyValue("background-color"), "");
  assert.equal(activeSurface.style.getPropertyValue("background-color"), "rgba(255, 0, 0, 0.15)");
  assert.equal(activeSurface.style.getPropertyPriority("background-color"), "important");
  assert.equal(inactiveSurface.style.getPropertyValue("background-color"), "");
  assert.equal(activeCard.style.getPropertyValue("border"), "0.8px solid rgb(207, 52, 52)");
  assert.equal(activeCard.style.getPropertyPriority("border"), "important");
  assert.equal(activeCard.style.getPropertyValue("border-color"), "rgb(207, 52, 52)");
  assert.equal(activeCard.style.getPropertyPriority("border-color"), "important");
  assert.equal(activeCard.style.getPropertyValue("border-width"), "0.8px");
  assert.equal(activeCard.style.getPropertyPriority("border-width"), "important");
  assert.equal(activeCard.style.getPropertyValue("border-style"), "solid");
  assert.equal(activeCard.style.getPropertyPriority("border-style"), "important");
  assert.equal(activeCard.style.getPropertyValue("box-shadow"), "none");
  assert.equal(activeCard.style.getPropertyPriority("box-shadow"), "important");
});

test("x01 bust highlight keeps copied hit visuals when current hit tiles use another theme", () => {
  const { documentRef, activeCard, activeSurface } = setupBustDocument({
    throwComputedStyle: {
      background:
        "rgba(0, 0, 0, 0) linear-gradient(165deg, rgba(8, 12, 12, 0.98) 0%, rgba(11, 19, 12, 0.96) 48%, rgba(6, 11, 8, 0.99) 100%) repeat scroll 0% 0% / auto padding-box border-box",
      backgroundColor: "rgba(0, 0, 0, 0)",
      border: "0.8px solid rgba(255, 255, 255, 0.14)",
      borderColor: "rgba(255, 255, 255, 0.14)",
      borderStyle: "solid",
      borderWidth: "0.8px",
      boxShadow:
        "rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.28) 0px -8px 18px 0px inset",
    },
  });
  const state = createBustActivePlayerHighlightState();
  const { windowRef } = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef }, state);

  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-background-color"),
    "rgba(255, 0, 0, 0.15)"
  );
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-border"),
    "0.8px solid rgb(207, 52, 52)"
  );
  assert.equal(activeSurface.style.getPropertyValue("background-color"), "rgba(255, 0, 0, 0.15)");
  assert.equal(activeCard.style.getPropertyValue("border-color"), "rgb(207, 52, 52)");
  assert.equal(activeCard.style.getPropertyValue("box-shadow"), "none");
});

test("x01 bust highlight plays the glass crack sound only on bust entry when enabled", () => {
  const { documentRef } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: false }, state);
  assert.equal(audioInstances.length, 0);

  setTurnScore(documentRef, "60");
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);
  setTurnScore(documentRef, "BUST");
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);

  assert.equal(audioInstances.length, 1);
  assert.match(audioInstances[0].src, /glasscrack\.mp3$/);
  assert.equal(audioInstances[0].volume, 0.9);
  assert.equal(audioInstances[0].currentTime, 0);
  assert.equal(audioInstances[0].playCount, 1);
});

test("x01 bust highlight can disable shake while keeping persistent bust styling", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef, crackCount: 1, shakeEnabled: false },
    state
  );

  assert.equal(result.isBust, true);
  assert.equal(result.shook, true);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
  assert.equal(timerWindow.timers.length, 0);
});

test("x01 bust sound can be unlocked before a later bust entry", async () => {
  const { documentRef } = setupBustDocument({ turnScoreText: "60" });
  const state = createBustActivePlayerHighlightState();
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);

  ensureBustGlassCrackAudio(state, windowRef);
  assert.equal(audioInstances.length, 1);
  tryUnlockBustGlassCrackAudio(state);
  await Promise.resolve();

  assert.equal(state.audioUnlocked, true);
  assert.equal(audioInstances[0].playCount, 1);
  assert.equal(audioInstances[0].volume, 0.9);

  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);
  setTurnScore(documentRef, "BUST");
  syncBustActivePlayerHighlight({ documentRef, windowRef, soundEnabled: true }, state);

  assert.equal(audioInstances.length, 1);
  assert.equal(audioInstances[0].playCount, 2);
});

test("x01 bust sound unlock ignores xConfig panel clicks so preview playback keeps user activation", async () => {
  const { documentRef } = setupBustDocument({ turnScoreText: "60" });
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);
  const listenerEntries = [];
  const panel = documentRef.createElement("div");
  panel.id = "ad-xconfig-panel-host";
  const panelButton = documentRef.createElement("button");
  panel.appendChild(panelButton);
  documentRef.main.appendChild(panel);

  const cleanup = mountX01BustActivePlayerHighlight({
    documentRef,
    windowRef,
    config: {
      getFeatureConfig: () => ({ crackCount: 1, soundEnabled: true }),
    },
    domGuards: {
      ensureStyle: () => {},
      removeNodeById: () => {},
    },
    helpers: {
      createRafScheduler: (callback) => ({
        schedule: callback,
        cancel: () => {},
      }),
    },
    registries: {
      listeners: {
        register: (entry) => listenerEntries.push(entry),
        remove: () => {},
      },
    },
  });
  await Promise.resolve();

  const pointerEntry = listenerEntries.find((entry) => entry.type === "pointerdown");
  assert.ok(pointerEntry);
  assert.equal(audioInstances.length, 1);
  const initialPlayCount = audioInstances[0].playCount;

  pointerEntry.handler({ target: panelButton });
  await Promise.resolve();
  assert.equal(audioInstances[0].playCount, initialPlayCount);

  cleanup();
});

test("x01 bust preview applies visuals, cracks, shake and optional sound", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const { windowRef, audioInstances } = createManualTimerWindow(documentRef);

  const cleanup = runBustActivePlayerHighlightPreview({
    documentRef,
    windowRef,
    targetNode: activeCard,
    crackCount: 1,
    soundEnabled: true,
  });

  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), true);
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);
  assert.equal(audioInstances.length, 1);
  assert.match(audioInstances[0].src, /glasscrack\.mp3$/);

  cleanup();
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
});

test("x01 bust preview can disable shake while keeping visuals and cracks", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const { windowRef } = createManualTimerWindow(documentRef);

  const cleanup = runBustActivePlayerHighlightPreview({
    documentRef,
    windowRef,
    targetNode: activeCard,
    crackCount: 1,
    shakeEnabled: false,
  });

  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_CLASS}`).length, 1);

  cleanup();
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
});

test("x01 bust sound uses Web Audio buffer playback when AudioContext is available", async () => {
  const { documentRef } = setupBustDocument();
  const startedSources = [];
  class FakeAudioContext {
    constructor() {
      this.state = "suspended";
      this.destination = {};
    }

    resume() {
      this.state = "running";
      return Promise.resolve();
    }

    decodeAudioData(arrayBuffer) {
      assert.equal(arrayBuffer.byteLength, 4);
      return Promise.resolve({ duration: 1.2 });
    }

    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: (time) => startedSources.push(time),
      };
    }

    createGain() {
      return {
        gain: { value: 0 },
        connect: () => {},
      };
    }
  }
  const windowRef = {
    document: documentRef,
    AudioContext: FakeAudioContext,
    fetch: () =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer),
      }),
  };
  const state = createBustActivePlayerHighlightState();

  const result = playBustGlassCrackSound({ windowRef, state, soundEnabled: true });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(result.played, true);
  assert.equal(result.reason, "scheduled");
  assert.equal(state.audioState.sourceType, "web-audio");
  assert.deepEqual(startedSources, [0]);
});

test("x01 bust highlight immediately renders configured cracks at random card positions", () => {
  const { documentRef, activeCard } = setupBustDocument();
  activeCard.__rect = { width: 640, height: 180 };
  const state = createBustActivePlayerHighlightState();
  const { windowRef } = createManualTimerWindow(documentRef);
  let randomState = 17;
  const random = () => {
    randomState = (randomState * 73 + 41) % 997;
    return randomState / 997;
  };

  syncBustActivePlayerHighlight(
    { documentRef, windowRef, crackCount: 2, random },
    state
  );

  const overlay = activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`);
  const cracks = overlay?.querySelectorAll?.(`.${BUST_CRACK_CLASS}`) || [];
  assert.ok(overlay);
  assert.equal(overlay.getAttribute("viewBox"), "0 0 640 180");
  assert.equal(cracks.length, 2);
  assert.notEqual(cracks[0].getAttribute("data-crack-x"), cracks[1].getAttribute("data-crack-x"));
  assert.equal(cracks[0].querySelectorAll("path").length, 6);
  assert.ok(
    cracks[0].querySelector(".ad-ext-x01-bust-crack-main").getAttribute("d").split("M ").length >
      100
  );
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-splinters").getAttribute("d"));
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-web").getAttribute("d"));
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-noise").getAttribute("d"));
  assert.ok(cracks[0].querySelector(".ad-ext-x01-bust-crack-shards").getAttribute("d"));
  assert.equal(activeCard.querySelectorAll(`.${BUST_CRACK_OVERLAY_CLASS}`).length, 1);
});

test("x01 bust cracks retain the demo geometry and rendering settings", () => {
  assert.deepEqual(DEMO_CRACK_SETTINGS, {
    rays: 20,
    initialRadius: 5,
    radiusStart: 15,
    densityPercent: 50,
    curvaturePercent: 30,
    ringConnectionPercent: 60,
    diagonalConnectionPercent: 30,
    refractWidth: 3,
    refractShift: 6,
    reflectAlpha: 0.3,
    fractureSize: 33,
    fractureAlpha: 0.4,
    mainlineOffset: 0.03,
    mainlineStrength: 0.14,
    mainlineHighlight: 0.2,
    mainlineAlpha: 65,
    noiseFrequency: 0.4,
    noiseAlpha: 1,
  });
});

test("x01 bust highlight disables cracks when configured with zero", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef, crackCount: 0 },
    state
  );

  assert.equal(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);
});

test("x01 bust highlight CSS overrides active card visuals and shakes quickly for three seconds", () => {
  const css = buildStyleText();

  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-x01-bust-active-player-highlight,[\s\S]*\.ad-ext-player\.ad-ext-player-active\.ad-ext-x01-bust-active-player-highlight/
  );
  assert.match(
    css,
    /#ad-ext-player-display \.ad-ext-player\.ad-ext-x01-bust-active-player-highlight > \.chakra-stack[\s\S]*background: var\(--ad-ext-x01-bust-active-player-background/
  );
  assert.match(
    css,
    /\.ad-ext-x01-bust-active-player-highlight\.ad-ext-x01-bust-active-player-highlight--shake \{[^}]*animation: ad-ext-x01-bust-active-player-shake 150ms linear 20;/
  );
});

test("x01 bust shake stops after three seconds while the red bust styling remains", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  timerWindow.runTimer();

  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), true);

  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef },
    state
  );

  assert.equal(result.shook, false);
  assert.equal(timerWindow.timers.length, 1);
});

test("x01 bust highlight clears styling and shake state when bust disappears", () => {
  const { documentRef, activeCard, activeSurface } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  documentRef.turnScoreElement.textContent = "40";
  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef },
    state
  );

  assert.equal(result.isBust, false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(
    activeCard.style.getPropertyValue("--ad-ext-x01-bust-active-player-background-color"),
    ""
  );
  assert.equal(activeCard.style.getPropertyValue("background-color"), "");
  assert.equal(activeSurface.style.getPropertyValue("background-color"), "");
  assert.equal(activeCard.style.getPropertyValue("border"), "");
  assert.equal(activeCard.style.getPropertyValue("border-color"), "");
  assert.equal(activeCard.style.getPropertyValue("border-width"), "");
  assert.equal(activeCard.style.getPropertyValue("border-style"), "");
  assert.equal(activeCard.style.getPropertyValue("box-shadow"), "");
  assert.equal(timerWindow.timers[0].cleared, true);
});

test("x01 bust highlight ignores non-X01 variants even when BUST is visible", () => {
  const { documentRef, activeCard } = setupBustDocument({ variantText: "Cricket" });
  const state = createBustActivePlayerHighlightState();
  const { windowRef, timers } = createManualTimerWindow(documentRef);

  const result = syncBustActivePlayerHighlight({ documentRef, windowRef }, state);

  assert.equal(result.isBust, false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(timers.length, 0);
});

test("x01 bust highlight moves persistent styling to a new active player without retriggering shake", () => {
  const { documentRef, activeCard, inactiveCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  activeCard.classList.remove("ad-ext-player-active");
  activeCard.classList.add("ad-ext-player-inactive");
  inactiveCard.classList.remove("ad-ext-player-inactive");
  inactiveCard.classList.add("ad-ext-player-active");

  const result = syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef },
    state
  );

  assert.equal(result.shook, false);
  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(inactiveCard.classList.contains(BUST_ACTIVE_CLASS), true);
  assert.equal(inactiveCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(timerWindow.timers.length, 1);
});

test("x01 bust highlight cleanup removes classes and pending timers", () => {
  const { documentRef, activeCard } = setupBustDocument();
  const state = createBustActivePlayerHighlightState();
  const timerWindow = createManualTimerWindow(documentRef);

  syncBustActivePlayerHighlight(
    { documentRef, windowRef: timerWindow.windowRef, crackCount: 2 },
    state
  );
  assert.ok(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`));
  clearBustActivePlayerHighlightState(state, timerWindow.windowRef);

  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(activeCard.querySelector(`.${BUST_CRACK_OVERLAY_CLASS}`), null);
  assert.equal(timerWindow.timers[0].cleared, true);
});
