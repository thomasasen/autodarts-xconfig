import {
  BUST_ACTIVE_CLASS,
  BUST_CARD_STYLE_PROPERTIES,
  BUST_SHAKE_CLASS,
  FALLBACK_BUST_CARD_VISUALS,
} from "./style.js";
import { X01_BUST_GLASS_CRACK_SOUND_ASSET } from "#feature-assets";
import { getX01PlayerSurfaceSnapshot } from "../shared/x01-player-surface-adapter.js";
import { isX01VariantText } from "../../domain/variant-rules.js";
import { removeBustCracks, renderBustCracks } from "./cracks.js";

export const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";
export const ACTIVE_PLAYER_SELECTOR =
  "#ad-ext-player-display .ad-ext-player.ad-ext-player-active, #ad-ext-player-display .ad-ext-player-active, .ad-ext-player.ad-ext-player-active, .ad-ext-player-active";
export const SHAKE_DURATION_MS = 3000;
const BUST_SOUND_VOLUME = 0.9;
const BUST_AUDIO_FALLBACK_SOURCE = "html-audio";
const BUST_AUDIO_WEB_SOURCE = "web-audio";
const BUST_INLINE_STYLE_PROPERTIES = Object.freeze([
  "background",
  "background-color",
  "border",
  "border-color",
  "border-style",
  "border-width",
  "box-shadow",
]);

function normalizeText(value) {
  return String(value || "")
    .replaceAll("\u00a0", " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function queryOne(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelector !== "function") {
    return null;
  }

  try {
    return rootNode.querySelector(selector);
  } catch (_) {
    return null;
  }
}

function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function readVariantText(documentRef) {
  const variantElement =
    documentRef && typeof documentRef.getElementById === "function"
      ? documentRef.getElementById("ad-ext-game-variant")
      : null;
  return normalizeText(variantElement?.textContent || "");
}

export function isX01BustFeatureActive(context = {}) {
  const gameState = context.gameState || null;
  if (gameState && typeof gameState.isX01Variant === "function") {
    return gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
  }

  return isX01VariantText(readVariantText(context.documentRef), {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function hasVisibleBustTurnScore(documentRef) {
  return queryAll(documentRef, TURN_POINTS_SELECTOR).some((node) => {
    return normalizeText(node?.textContent || "").toUpperCase() === "BUST";
  });
}

export function findActiveX01PlayerCard(documentRef) {
  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);
  const activePlayer = Array.isArray(snapshot.players)
    ? snapshot.players.find((player) => player?.isActive === true)
    : null;
  if (activePlayer?.node) {
    return activePlayer.node;
  }

  return queryOne(documentRef, ACTIVE_PLAYER_SELECTOR);
}

export function resolveBustCardVisuals() {
  return {
    ...FALLBACK_BUST_CARD_VISUALS,
    borderColor: "rgb(207, 52, 52)",
    borderStyle: "solid",
    borderWidth: "0.8px",
  };
}

function setStylePropertyIfChanged(node, propertyName, value) {
  const normalizedValue = String(value || "").trim();
  if (!node?.style || !propertyName || !normalizedValue) {
    return;
  }
  if (node.style.getPropertyValue?.(propertyName) !== normalizedValue) {
    node.style.setProperty(propertyName, normalizedValue);
  }
}

function setImportantStyleProperty(node, propertyName, value) {
  const normalizedValue = String(value || "").trim();
  if (!node?.style || !propertyName || !normalizedValue) {
    return;
  }
  if (
    node.style.getPropertyValue?.(propertyName) !== normalizedValue ||
    node.style.getPropertyPriority?.(propertyName) !== "important"
  ) {
    node.style.setProperty(propertyName, normalizedValue, "important");
  }
}

function applyBustInlineVisuals(node, visuals = {}) {
  setImportantStyleProperty(node, "border", visuals.border || FALLBACK_BUST_CARD_VISUALS.border);
  setImportantStyleProperty(node, "border-color", visuals.borderColor || "rgb(207, 52, 52)");
  setImportantStyleProperty(node, "border-style", visuals.borderStyle || "solid");
  setImportantStyleProperty(node, "border-width", visuals.borderWidth || "0.8px");
  setImportantStyleProperty(
    node,
    "box-shadow",
    visuals.boxShadow || FALLBACK_BUST_CARD_VISUALS.boxShadow
  );
}

function findBustFillNode(node) {
  return node?.querySelector?.(":scope > .chakra-stack") || node;
}

function clearBustInlineVisuals(node) {
  if (!node?.style) {
    return;
  }
  BUST_INLINE_STYLE_PROPERTIES.forEach((propertyName) => {
    if (node.style.getPropertyValue?.(propertyName)) {
      node.style.removeProperty(propertyName);
    }
  });
}

function applyBustFillVisuals(node, visuals = {}) {
  const fillNode = findBustFillNode(node);
  if (fillNode !== node) {
    ["background", "background-color"].forEach((propertyName) => {
      if (node?.style?.getPropertyValue?.(propertyName)) {
        node.style.removeProperty(propertyName);
      }
    });
  }
  setImportantStyleProperty(
    fillNode,
    "background",
    visuals.background || FALLBACK_BUST_CARD_VISUALS.background
  );
  setImportantStyleProperty(
    fillNode,
    "background-color",
    visuals.backgroundColor || FALLBACK_BUST_CARD_VISUALS.backgroundColor
  );
}

function applyBustCardVisuals(node, visuals = {}) {
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-background",
    visuals.background || FALLBACK_BUST_CARD_VISUALS.background
  );
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-background-color",
    visuals.backgroundColor || FALLBACK_BUST_CARD_VISUALS.backgroundColor
  );
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-border",
    visuals.border || FALLBACK_BUST_CARD_VISUALS.border
  );
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-box-shadow",
    visuals.boxShadow || FALLBACK_BUST_CARD_VISUALS.boxShadow
  );
  applyBustInlineVisuals(node, visuals);
  applyBustFillVisuals(node, visuals);
}

function clearBustCardVisuals(node) {
  if (!node?.style) {
    return;
  }
  BUST_CARD_STYLE_PROPERTIES.forEach((propertyName) => {
    if (node.style.getPropertyValue?.(propertyName)) {
      node.style.removeProperty(propertyName);
    }
  });
  clearBustInlineVisuals(node);
  const fillNode = findBustFillNode(node);
  if (fillNode !== node) {
    clearBustInlineVisuals(fillNode);
  }
}

function getTimerApi(windowRef = null) {
  return {
    setTimeout:
      windowRef && typeof windowRef.setTimeout === "function"
        ? windowRef.setTimeout.bind(windowRef)
        : setTimeout,
    clearTimeout:
      windowRef && typeof windowRef.clearTimeout === "function"
        ? windowRef.clearTimeout.bind(windowRef)
        : clearTimeout,
  };
}

function createBustSoundAudio(windowRef = null) {
  if (!windowRef || typeof windowRef.Audio !== "function") {
    return null;
  }

  try {
    const audio = new windowRef.Audio(X01_BUST_GLASS_CRACK_SOUND_ASSET);
    audio.preload = "auto";
    audio.volume = BUST_SOUND_VOLUME;
    return audio;
  } catch (_) {
    return null;
  }
}

function resolveAudioContextConstructor(windowRef = null) {
  return windowRef?.AudioContext || windowRef?.webkitAudioContext || null;
}

function createBustAudioState(windowRef = null) {
  const AudioContextRef = resolveAudioContextConstructor(windowRef);
  if (typeof AudioContextRef === "function") {
    try {
      const context = new AudioContextRef();
      return {
        sourceType: BUST_AUDIO_WEB_SOURCE,
        context,
        buffer: null,
        loadPromise: null,
        fetchRef:
          typeof windowRef.fetch === "function"
            ? windowRef.fetch.bind(windowRef)
            : typeof fetch === "function"
              ? fetch
              : null,
      };
    } catch (_) {
      // fall back to HTMLAudio
    }
  }

  const audio = createBustSoundAudio(windowRef);
  return audio
    ? {
        sourceType: BUST_AUDIO_FALLBACK_SOURCE,
        audio,
      }
    : null;
}

function loadBustAudioBuffer(audioState) {
  if (!audioState || audioState.sourceType !== BUST_AUDIO_WEB_SOURCE) {
    return Promise.resolve(null);
  }
  if (audioState.buffer) {
    return Promise.resolve(audioState.buffer);
  }
  if (audioState.loadPromise) {
    return audioState.loadPromise;
  }
  if (typeof audioState.fetchRef !== "function") {
    return Promise.resolve(null);
  }

  audioState.loadPromise = Promise.resolve()
    .then(() => audioState.fetchRef(X01_BUST_GLASS_CRACK_SOUND_ASSET))
    .then((response) => {
      if (!response?.ok) {
        throw new Error("X01 bust glass crack sound asset could not be loaded.");
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => audioState.context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      audioState.buffer = buffer;
      return buffer;
    })
    .catch(() => null);

  return audioState.loadPromise;
}

function resumeBustAudioContext(audioState) {
  const context = audioState?.context || null;
  if (!context || typeof context.resume !== "function" || context.state === "running") {
    return Promise.resolve();
  }
  return Promise.resolve(context.resume()).catch(() => {});
}

function playBustAudioBuffer(audioState) {
  const context = audioState?.context || null;
  const buffer = audioState?.buffer || null;
  if (!context || !buffer) {
    return false;
  }

  try {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = BUST_SOUND_VOLUME;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    return true;
  } catch (_) {
    return false;
  }
}

export function ensureBustGlassCrackAudio(state, windowRef = null) {
  if (!state || state.audioState) {
    return state?.audioState || null;
  }

  state.audioState = createBustAudioState(windowRef);
  loadBustAudioBuffer(state.audioState);
  return state.audioState;
}

export function tryUnlockBustGlassCrackAudio(state) {
  const audioState = state?.audioState || null;
  if (!audioState || state.audioUnlocked) {
    return;
  }

  if (audioState.sourceType === BUST_AUDIO_WEB_SOURCE) {
    resumeBustAudioContext(audioState).then(() => {
      if (audioState.context?.state === "running") {
        state.audioUnlocked = true;
      }
    });
    loadBustAudioBuffer(audioState);
    return;
  }

  const audio = audioState.audio || null;
  if (!audio) {
    return;
  }

  try {
    audio.volume = 0.01;
    const playResult = audio.play();
    const markUnlocked = () => {
      audio.pause?.();
      try {
        audio.currentTime = 0;
      } catch (_) {
        // fail-soft reset
      }
      audio.volume = BUST_SOUND_VOLUME;
      state.audioUnlocked = true;
    };

    if (playResult && typeof playResult.then === "function") {
      playResult.then(markUnlocked).catch(() => {
        audio.volume = BUST_SOUND_VOLUME;
      });
      return;
    }
    markUnlocked();
  } catch (_) {
    try {
      audio.volume = BUST_SOUND_VOLUME;
    } catch (_) {
      // fail-soft reset
    }
  }
}

export function playBustGlassCrackSound(options = {}) {
  if (options.soundEnabled !== true) {
    return {
      played: false,
      reason: "disabled",
    };
  }

  const windowRef = options.windowRef || null;
  const audioState =
    options.audioState ||
    ensureBustGlassCrackAudio(options.state || null, windowRef) ||
    createBustAudioState(windowRef);
  if (!audioState) {
    return {
      played: false,
      reason: "no-audio",
    };
  }

  if (audioState.sourceType === BUST_AUDIO_WEB_SOURCE) {
    resumeBustAudioContext(audioState)
      .then(() => loadBustAudioBuffer(audioState))
      .then(() => playBustAudioBuffer(audioState));
    return {
      played: true,
      reason: "scheduled",
      audioState,
    };
  }

  const audio = audioState.audio || null;
  if (!audio) {
    return {
      played: false,
      reason: "no-audio",
    };
  }

  audio.volume = BUST_SOUND_VOLUME;
  try {
    audio.currentTime = 0;
  } catch (_) {
    // fail-soft reset
  }

  try {
    const playResult = audio.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  } catch (_) {
    return {
      played: false,
      reason: "play-error",
    };
  }

  return {
    played: true,
    reason: "played",
    audioState,
  };
}

function clearShakeTimeout(state, windowRef = null) {
  if (!state?.shakeTimeoutHandle) {
    return;
  }

  getTimerApi(windowRef).clearTimeout(state.shakeTimeoutHandle);
  state.shakeTimeoutHandle = null;
}

function clearNodeState(node) {
  if (!node?.classList) {
    return;
  }
  node.classList.remove(BUST_SHAKE_CLASS, BUST_ACTIVE_CLASS);
  removeBustCracks(node);
  clearBustCardVisuals(node);
}

export function createBustActivePlayerHighlightState() {
  return {
    wasBust: false,
    activeNode: null,
    shakeNode: null,
    shakeTimeoutHandle: null,
    audioState: null,
    audioUnlocked: false,
  };
}

export function triggerBustShake(node, state, windowRef = null) {
  if (!node?.classList || !state) {
    return;
  }

  clearShakeTimeout(state, windowRef);
  if (state.shakeNode && state.shakeNode !== node) {
    state.shakeNode.classList?.remove?.(BUST_SHAKE_CLASS);
  }

  node.classList.remove(BUST_SHAKE_CLASS);
  Number(node.offsetWidth || node.getBoundingClientRect?.().width || 0);
  node.classList.add(BUST_SHAKE_CLASS);
  state.shakeNode = node;

  const { setTimeout: setTimeoutRef } = getTimerApi(windowRef);
  state.shakeTimeoutHandle = setTimeoutRef(() => {
    node.classList?.remove?.(BUST_SHAKE_CLASS);
    if (state.shakeNode === node) {
      state.shakeNode = null;
    }
    state.shakeTimeoutHandle = null;
  }, SHAKE_DURATION_MS);
}

export function clearBustActivePlayerHighlightState(state, windowRef = null) {
  if (!state) {
    return;
  }

  clearShakeTimeout(state, windowRef);
  if (state.shakeNode) {
    state.shakeNode.classList?.remove?.(BUST_SHAKE_CLASS);
  }
  if (state.activeNode) {
    clearNodeState(state.activeNode);
  }
  state.wasBust = false;
  state.activeNode = null;
  state.shakeNode = null;
}

export function runBustActivePlayerHighlightPreview(options = {}) {
  const targetNode = options.targetNode || null;
  if (!targetNode?.classList) {
    return null;
  }

  const documentRef = options.documentRef || targetNode.ownerDocument || null;
  const windowRef = options.windowRef || null;
  const state = createBustActivePlayerHighlightState();

  clearNodeState(targetNode);
  targetNode.classList.add(BUST_ACTIVE_CLASS);
  applyBustCardVisuals(targetNode, FALLBACK_BUST_CARD_VISUALS);
  state.activeNode = targetNode;
  state.wasBust = true;
  if (options.shakeEnabled !== false) {
    triggerBustShake(targetNode, state, windowRef);
  }
  renderBustCracks(targetNode, options.crackCount, {
    documentRef,
    random: options.random,
  });
  const soundResult = playBustGlassCrackSound({
    windowRef,
    soundEnabled: options.soundEnabled === true,
    state,
  });
  state.audioState = soundResult.audioState || null;

  return () => clearBustActivePlayerHighlightState(state, windowRef);
}

export function syncBustActivePlayerHighlight(context = {}, state = createBustActivePlayerHighlightState()) {
  const documentRef = context.documentRef;
  const windowRef = context.windowRef || null;
  const isSupported = documentRef && isX01BustFeatureActive(context);
  const isBust = Boolean(isSupported && hasVisibleBustTurnScore(documentRef));

  if (!isBust) {
    clearBustActivePlayerHighlightState(state, windowRef);
    return {
      isBust: false,
      activeNode: null,
      shook: false,
    };
  }

  const activeNode = findActiveX01PlayerCard(documentRef);
  if (!activeNode?.classList) {
    clearBustActivePlayerHighlightState(state, windowRef);
    state.wasBust = true;
    return {
      isBust: true,
      activeNode: null,
      shook: false,
    };
  }

  if (state.activeNode && state.activeNode !== activeNode) {
    clearNodeState(state.activeNode);
  }

  const enteredBust = state.wasBust !== true;
  const visuals = resolveBustCardVisuals();
  activeNode.classList.add(BUST_ACTIVE_CLASS);
  applyBustCardVisuals(activeNode, visuals);
  state.activeNode = activeNode;
  state.wasBust = true;

  if (enteredBust) {
    if (context.shakeEnabled !== false) {
      triggerBustShake(activeNode, state, windowRef);
    }
    renderBustCracks(activeNode, context.crackCount, {
      documentRef,
      random: context.random,
    });
    const soundResult = playBustGlassCrackSound({
      windowRef,
      soundEnabled: context.soundEnabled === true,
      audioState: state.audioState,
      state,
    });
    state.audioState = soundResult.audioState || state.audioState;
  }

  return {
    isBust: true,
    activeNode,
    shook: enteredBust,
  };
}
