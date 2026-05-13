import { SINGLE_BULL_SOUND_ASSET } from "#feature-assets";
import { THROW_TEXT_SELECTORS } from "./style.js";
import {
  collectTurnThrowRows,
  collectTurnThrowTextNodes,
} from "../shared/turn-surface-adapter.js";

const SIGNAL_COOLDOWN_MS = 250;
const PROCESSED_THROW_KEY_LIMIT = 400;

function normalizeText(value) {
  return String(value || "").replaceAll(/\s+/g, " ").trim();
}

function collectThrowTextNodes(documentRef) {
  return collectTurnThrowTextNodes(documentRef, THROW_TEXT_SELECTORS);
}

function buildTurnId(activeTurn) {
  const turnId = String(
    activeTurn?.id ||
      [
        Number.isFinite(activeTurn?.round) ? activeTurn.round : -1,
        Number.isFinite(activeTurn?.turn) ? activeTurn.turn : -1,
        String(activeTurn?.playerId || ""),
      ].join(":")
  );
  return turnId;
}

function buildThrowKeys(activeTurn, throwEntry, throwIndex) {
  const normalizedThrowIndex =
    Number.isFinite(Number(throwIndex)) && Number(throwIndex) >= 0
      ? Number(throwIndex)
      : -1;
  const turnId = buildTurnId(activeTurn);
  const keys = [`${turnId}:index:${normalizedThrowIndex}`];

  const throwIdentifier = throwEntry?.id || throwEntry?.createdAt || throwEntry?.timestamp;
  const normalizedThrowIdentifier = String(throwIdentifier || "").trim();
  if (normalizedThrowIdentifier) {
    keys.push(`${turnId}:id:${normalizedThrowIdentifier}`);
  }

  return keys;
}

function syncProcessedThrowScope(state, activeTurn) {
  const turnId = buildTurnId(activeTurn);
  if (state.lastProcessedTurnId === turnId) {
    return;
  }

  state.lastProcessedTurnId = turnId;
  state.processedThrowKeys.clear();
}

function normalizeThrowKeys(throwKeys) {
  return (Array.isArray(throwKeys) ? throwKeys : [throwKeys])
    .map((key) => String(key || "").trim())
    .filter(Boolean);
}

function hasProcessedThrow(state, throwKeys) {
  const normalizedKeys = normalizeThrowKeys(throwKeys);
  if (!normalizedKeys.length) {
    return false;
  }

  return normalizedKeys.some((throwKey) => state.processedThrowKeys.has(throwKey));
}

function rememberProcessedThrow(state, throwKeys) {
  const normalizedKeys = normalizeThrowKeys(throwKeys);
  if (!normalizedKeys.length) {
    return;
  }
  normalizedKeys.forEach((throwKey) => {
    state.processedThrowKeys.add(throwKey);
    while (state.processedThrowKeys.size > PROCESSED_THROW_KEY_LIMIT) {
      const oldest = state.processedThrowKeys.values().next().value;
      if (!oldest) {
        break;
      }
      state.processedThrowKeys.delete(oldest);
    }
  });
}

function forgetProcessedThrow(state, throwKeys) {
  normalizeThrowKeys(throwKeys).forEach((throwKey) => {
    state.processedThrowKeys.delete(throwKey);
  });
}

function safePlayAudio(state, config, options = {}) {
  const audio = state.audio;
  if (!audio) {
    return {
      played: false,
      reason: "no-audio",
    };
  }

  const now = Date.now();
  if (now - state.lastSignalPlayedAt < SIGNAL_COOLDOWN_MS) {
    return {
      played: false,
      reason: "signal-cooldown",
    };
  }
  const previousSignalPlayedAt = state.lastSignalPlayedAt;
  state.lastSignalPlayedAt = now;

  audio.volume = config.volume;

  try {
    audio.currentTime = 0;
  } catch (_) {
    // fail-soft reset
  }

  const handlePlaybackFailure =
    typeof options.onPlaybackFailure === "function"
      ? options.onPlaybackFailure
      : () => {};

  let playResult = null;
  try {
    playResult = audio.play();
  } catch (_) {
    state.lastSignalPlayedAt = previousSignalPlayedAt;
    handlePlaybackFailure();
    return {
      played: false,
      reason: "play-error",
    };
  }

  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => {
      if (state.lastSignalPlayedAt === now) {
        state.lastSignalPlayedAt = previousSignalPlayedAt;
      }
      handlePlaybackFailure();
    });
  }

  return {
    played: true,
    reason: "played",
  };
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

export async function playSingleBullSoundPreview(options = {}) {
  const windowRef =
    options.windowRef ||
    (globalThis.window !== undefined ? globalThis.window : null);
  const config = options.config;
  const audio = createAudio(windowRef, config);

  if (!audio) {
    throw new Error("Single Bull Sound audio is not available.");
  }

  audio.volume = Number.isFinite(Number(config?.volume)) ? Number(config.volume) : 0.9;
  try {
    audio.currentTime = 0;
  } catch (_) {
    // fail-soft reset
  }

  try {
    const playResult = audio.play();
    if (playResult && typeof playResult.then === "function") {
      await playResult;
    }
  } catch (error) {
    throw new Error("Single Bull Sound preview playback failed.", { cause: error });
  }

  return {
    ok: true,
    volume: audio.volume,
  };
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
  const gameState = options.gameState;
  const state = options.state;
  const config = options.config;

  if (!documentRef || !x01Rules || !state || !config) {
    return;
  }

  const activeTurn =
    gameState && typeof gameState.getActiveTurn === "function"
      ? gameState.getActiveTurn()
      : null;
  syncProcessedThrowScope(state, activeTurn);
  const rowIndexByNode = new Map();
  collectTurnThrowRows(documentRef).forEach((rowNode, rowIndex) => {
    rowIndexByNode.set(rowNode, rowIndex);
  });

  const throwNodes = collectThrowTextNodes(documentRef);
  const throwNodeSet = new Set(throwNodes);

  state.lastTextByNode.forEach((_value, node) => {
    if (!throwNodeSet.has(node)) {
      state.lastTextByNode.delete(node);
      state.lastPlayedAtByNode.delete(node);
    }
  });

  throwNodes.forEach((node, fallbackThrowIndex) => {
    const normalizedText = normalizeText(node.textContent);
    if (!normalizedText) {
      state.lastTextByNode.delete(node);
      state.lastPlayedAtByNode.delete(node);
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

    const throwRow =
      typeof node.closest === "function"
        ? node.closest(".ad-ext-turn-throw")
        : null;
    const throwIndex = rowIndexByNode.has(throwRow)
      ? rowIndexByNode.get(throwRow)
      : fallbackThrowIndex;
    const throwKeys = buildThrowKeys(activeTurn, null, throwIndex);
    if (hasProcessedThrow(state, throwKeys)) {
      return;
    }

    const audioResult = safePlayAudio(state, config, {
      onPlaybackFailure() {
        forgetProcessedThrow(state, throwKeys);
        state.lastTextByNode.delete(node);
        state.lastPlayedAtByNode.delete(node);
      },
    });
    if (audioResult.played) {
      state.lastPlayedAtByNode.set(node, now);
      rememberProcessedThrow(state, throwKeys);
      return;
    }

    if (audioResult.reason === "signal-cooldown") {
      state.lastTextByNode.delete(node);
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
  syncProcessedThrowScope(state, activeTurn);
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

    const throwKeys = buildThrowKeys(activeTurn, throwEntry, throwIndex);
    if (hasProcessedThrow(state, throwKeys)) {
      return;
    }

    const audioResult = safePlayAudio(state, config, {
      onPlaybackFailure() {
        forgetProcessedThrow(state, throwKeys);
      },
    });
    if (audioResult.played) {
      rememberProcessedThrow(state, throwKeys);
    }
  });
}

export function createSingleBullSoundState(windowRef, config) {
  return {
    windowRef,
    audio: createAudio(windowRef, config),
    audioUnlocked: false,
    lastProcessedTurnId: "",
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

  state.lastProcessedTurnId = "";
  state.lastTextByNode.clear();
  state.lastPlayedAtByNode.clear();
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
