import { SINGLE_BULL_SOUND_ASSET } from "#feature-assets";
import { THROW_TEXT_SELECTORS } from "./style.js";

const SIGNAL_COOLDOWN_MS = 250;
const PROCESSED_THROW_KEY_LIMIT = 400;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function collectThrowTextNodes(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const result = [];
  const seen = new Set();

  THROW_TEXT_SELECTORS.forEach((selector) => {
    try {
      Array.from(documentRef.querySelectorAll(selector)).forEach((node) => {
        if (!node || seen.has(node)) {
          return;
        }
        seen.add(node);
        result.push(node);
      });
    } catch (_) {
      // fail-soft selector parsing
    }
  });

  return result;
}

function buildThrowKey(activeTurn, throwEntry, throwIndex) {
  const turnId = String(
    activeTurn?.id ||
      [
        Number.isFinite(activeTurn?.round) ? activeTurn.round : -1,
        Number.isFinite(activeTurn?.turn) ? activeTurn.turn : -1,
        String(activeTurn?.playerId || ""),
      ].join(":")
  );
  const throwId = String(
    throwEntry?.id || throwEntry?.createdAt || throwEntry?.timestamp || throwIndex
  );
  return `${turnId}:${throwId}:${throwIndex}`;
}

function rememberProcessedThrow(state, throwKey) {
  if (!throwKey || state.processedThrowKeys.has(throwKey)) {
    return false;
  }

  state.processedThrowKeys.add(throwKey);
  if (state.processedThrowKeys.size > PROCESSED_THROW_KEY_LIMIT) {
    const oldest = state.processedThrowKeys.values().next().value;
    if (oldest) {
      state.processedThrowKeys.delete(oldest);
    }
  }

  return true;
}

function safePlayAudio(state, config) {
  const audio = state.audio;
  if (!audio) {
    return false;
  }

  const now = Date.now();
  if (now - state.lastSignalPlayedAt < SIGNAL_COOLDOWN_MS) {
    return false;
  }
  state.lastSignalPlayedAt = now;

  audio.volume = config.volume;

  try {
    audio.currentTime = 0;
  } catch (_) {
    // fail-soft reset
  }

  const playResult = audio.play();
  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => {
      // fail-soft when autoplay blocks playback
    });
  }

  return true;
}

function createAudio(windowRef, config) {
  if (!windowRef || typeof windowRef.Audio !== "function") {
    return null;
  }

  try {
    const audio = new windowRef.Audio(SINGLE_BULL_SOUND_ASSET);
    audio.preload = "auto";
    audio.volume = config.volume;
    return audio;
  } catch (_) {
    return null;
  }
}

function unlockAudio(state) {
  const audio = state.audio;
  if (!audio || state.audioUnlocked) {
    return;
  }

  try {
    audio.volume = 0.01;
    const playResult = audio.play();
    if (playResult && typeof playResult.then === "function") {
      playResult
        .then(() => {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch (_) {
            // fail-soft reset
          }
          state.audioUnlocked = true;
        })
        .catch(() => {
          // keep locked
        });
      return;
    }

    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (_) {
      // fail-soft reset
    }
    state.audioUnlocked = true;
  } catch (_) {
    // fail-soft unlock
  }
}

function scanDomRows(options = {}) {
  const documentRef = options.documentRef;
  const x01Rules = options.x01Rules;
  const state = options.state;
  const config = options.config;

  if (!documentRef || !x01Rules || !state || !config) {
    return;
  }

  const throwNodes = collectThrowTextNodes(documentRef);
  const throwNodeSet = new Set(throwNodes);

  state.lastTextByNode.forEach((_value, node) => {
    if (!throwNodeSet.has(node)) {
      state.lastTextByNode.delete(node);
      state.lastPlayedAtByNode.delete(node);
    }
  });

  throwNodes.forEach((node) => {
    const normalizedText = normalizeText(node.textContent);
    if (!normalizedText) {
      return;
    }

    const previousText = state.lastTextByNode.get(node) || "";
    if (previousText === normalizedText) {
      return;
    }

    state.lastTextByNode.set(node, normalizedText);

    if (typeof x01Rules.isSingleBullHitText !== "function" || !x01Rules.isSingleBullHitText(normalizedText)) {
      return;
    }

    const now = Date.now();
    const lastPlayedAt = state.lastPlayedAtByNode.get(node) || 0;
    if (now - lastPlayedAt < config.cooldownMs) {
      return;
    }

    if (safePlayAudio(state, config)) {
      state.lastPlayedAtByNode.set(node, now);
    }
  });
}

function scanGameStateThrows(options = {}) {
  const gameState = options.gameState;
  const x01Rules = options.x01Rules;
  const state = options.state;
  const config = options.config;

  if (!gameState || !x01Rules || !state || !config) {
    return;
  }

  if (typeof x01Rules.isSingleBullThrowEntry !== "function") {
    return;
  }

  const activeTurn =
    typeof gameState.getActiveTurn === "function"
      ? gameState.getActiveTurn()
      : null;
  const throws =
    typeof gameState.getActiveThrows === "function"
      ? gameState.getActiveThrows()
      : [];

  if (!Array.isArray(throws) || !throws.length) {
    return;
  }

  throws.forEach((throwEntry, throwIndex) => {
    if (!x01Rules.isSingleBullThrowEntry(throwEntry)) {
      return;
    }

    const throwKey = buildThrowKey(activeTurn, throwEntry, throwIndex);
    if (!rememberProcessedThrow(state, throwKey)) {
      return;
    }

    safePlayAudio(state, config);
  });
}

export function createSingleBullSoundState(windowRef, config) {
  return {
    windowRef,
    audio: createAudio(windowRef, config),
    audioUnlocked: false,
    lastSignalPlayedAt: 0,
    lastTextByNode: new Map(),
    lastPlayedAtByNode: new Map(),
    processedThrowKeys: new Set(),
    pollIntervalHandle: 0,
  };
}

export function clearSingleBullSoundState(state) {
  if (!state) {
    return;
  }

  if (state.pollIntervalHandle) {
    const clearIntervalRef =
      state.windowRef && typeof state.windowRef.clearInterval === "function"
        ? state.windowRef.clearInterval.bind(state.windowRef)
        : clearInterval;
    clearIntervalRef(state.pollIntervalHandle);
    state.pollIntervalHandle = 0;
  }

  if (state.audio) {
    try {
      state.audio.pause();
      state.audio.src = "";
    } catch (_) {
      // fail-soft audio cleanup
    }
  }

  state.processedThrowKeys.clear();
}

export function updateSingleBullSound(options = {}) {
  scanDomRows(options);
  scanGameStateThrows(options);
}

export function installSingleBullSoundPolling(state, callback, pollIntervalMs) {
  if (!state || typeof callback !== "function") {
    return;
  }

  if (state.pollIntervalHandle) {
    const clearIntervalRef =
      state.windowRef && typeof state.windowRef.clearInterval === "function"
        ? state.windowRef.clearInterval.bind(state.windowRef)
        : clearInterval;
    clearIntervalRef(state.pollIntervalHandle);
    state.pollIntervalHandle = 0;
  }

  const intervalMs = Number(pollIntervalMs);
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    return;
  }

  const setIntervalRef =
    state.windowRef && typeof state.windowRef.setInterval === "function"
      ? state.windowRef.setInterval.bind(state.windowRef)
      : setInterval;
  state.pollIntervalHandle = setIntervalRef(callback, intervalMs);
}

export function tryUnlockSingleBullAudio(state) {
  unlockAudio(state);
}
