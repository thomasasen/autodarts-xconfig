import test from "node:test";
import assert from "node:assert/strict";

import {
  SHAKE_DURATION_MS,
  clearBustActivePlayerHighlightState,
  createBustActivePlayerHighlightState,
  syncBustActivePlayerHighlight,
} from "../../src/features/x01-bust-active-player-highlight/logic.js";
import {
  BUST_ACTIVE_CLASS,
  BUST_SHAKE_CLASS,
  buildStyleText,
} from "../../src/features/x01-bust-active-player-highlight/style.js";
import { FakeDocument } from "./fake-dom.js";

function createManualTimerWindow(documentRef, computedStyle = {}) {
  const timers = [];
  let nextHandle = 1;
  const windowRef = {
    document: documentRef,
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
  documentRef.throwRow.__computedStyle = {
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

  syncBustActivePlayerHighlight({ documentRef, windowRef: timerWindow.windowRef }, state);
  clearBustActivePlayerHighlightState(state, timerWindow.windowRef);

  assert.equal(activeCard.classList.contains(BUST_ACTIVE_CLASS), false);
  assert.equal(activeCard.classList.contains(BUST_SHAKE_CLASS), false);
  assert.equal(timerWindow.timers[0].cleared, true);
});
