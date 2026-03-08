import {
  classifyCricketGameMode,
  classifyCricketScoringMode,
  isCricketVariantText,
  isX01VariantText,
  normalizeVariant,
} from "../domain/variant-rules.js";

const CHANNEL_MATCHES = "autodarts.matches";
const TOPIC_STATE_SUFFIX = ".state";

function safeClone(value) {
  if (value === null || typeof value === "undefined") {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return value;
  }
}

function parseTimestamp(value) {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function selectNewestTurn(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return null;
  }

  return candidates.reduce((best, candidate) => {
    if (!best) {
      return candidate;
    }

    const candidateRound = Number.isFinite(candidate?.round) ? candidate.round : -1;
    const bestRound = Number.isFinite(best?.round) ? best.round : -1;
    if (candidateRound !== bestRound) {
      return candidateRound > bestRound ? candidate : best;
    }

    const candidateTurn = Number.isFinite(candidate?.turn) ? candidate.turn : -1;
    const bestTurn = Number.isFinite(best?.turn) ? best.turn : -1;
    if (candidateTurn !== bestTurn) {
      return candidateTurn > bestTurn ? candidate : best;
    }

    const candidateTs = parseTimestamp(candidate?.createdAt);
    const bestTs = parseTimestamp(best?.createdAt);
    return candidateTs >= bestTs ? candidate : best;
  }, null);
}

function classifyPayloadKind(payload) {
  if (!payload || typeof payload !== "object") {
    return "unknown";
  }

  if (Array.isArray(payload.players) && Array.isArray(payload.turns)) {
    return "match-state";
  }

  if (Array.isArray(payload.players)) {
    return "match-partial";
  }

  if (Array.isArray(payload.throws) || payload.event || payload.type) {
    return "event";
  }

  return "unknown";
}

function isLikelyMatchStatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (!Array.isArray(payload.players)) {
    return false;
  }

  return (
    Number.isFinite(payload.player) ||
    Array.isArray(payload.turns) ||
    Array.isArray(payload.gameScores) ||
    Boolean(payload.settings)
  );
}

export function createGameStateStore(options = {}) {
  const eventBus = options.eventBus || null;
  const windowRef =
    options.windowRef || (typeof window !== "undefined" ? window : null);
  const documentRef =
    options.documentRef ||
    (windowRef && windowRef.document ? windowRef.document : null);

  const subscribers = new Set();
  const state = {
    match: null,
    updatedAt: 0,
    source: "none",
    topic: "",
    payloadKind: "",
  };

  let started = false;
  let interceptionInstalled = false;
  let originalDataDescriptor = null;

  function readVariantFromDom() {
    if (!documentRef || typeof documentRef.getElementById !== "function") {
      return "";
    }

    const variantElement = documentRef.getElementById("ad-ext-game-variant");
    return String(variantElement?.textContent || "").trim();
  }

  function getVariant() {
    if (state.match?.variant) {
      return String(state.match.variant);
    }
    return readVariantFromDom();
  }

  function getVariantNormalized() {
    return normalizeVariant(getVariant());
  }

  function getCricketGameMode(options = {}) {
    const includeHiddenCricket = Boolean(options.includeHiddenCricket);

    const candidates = [
      state.match?.settings?.gameMode,
      state.match?.gameMode,
      readVariantFromDom(),
    ];

    for (const candidate of candidates) {
      const normalized = classifyCricketGameMode(candidate);
      if (!normalized) {
        continue;
      }
      if (normalized === "hidden-cricket" && !includeHiddenCricket) {
        continue;
      }

      return String(candidate || "").trim();
    }

    const fallbackVariant = getVariantNormalized();
    if (fallbackVariant === "cricket" || fallbackVariant.startsWith("cricket ")) {
      return "Cricket";
    }

    return "";
  }

  function getCricketGameModeNormalized(options = {}) {
    return classifyCricketGameMode(getCricketGameMode(options));
  }

  function isX01Variant(options = {}) {
    return isX01VariantText(getVariant(), options);
  }

  function isCricketVariant(options = {}) {
    const domMode = classifyCricketGameMode(readVariantFromDom());
    if (domMode === "hidden-cricket" && !options.includeHiddenCricket) {
      return false;
    }

    const mode = getCricketGameModeNormalized(options);
    if (mode === "cricket" || mode === "tactics") {
      return true;
    }

    if (mode === "hidden-cricket") {
      return Boolean(options.includeHiddenCricket);
    }

    return isCricketVariantText(getVariant(), options);
  }

  function getActivePlayerIndex() {
    const activeIndex = state.match?.player;
    return Number.isFinite(activeIndex) ? activeIndex : null;
  }

  function getActivePlayerId() {
    const activeIndex = getActivePlayerIndex();
    const players = state.match?.players;
    if (!Array.isArray(players) || !Number.isFinite(activeIndex)) {
      return null;
    }

    const playerId = players[activeIndex]?.id;
    return playerId ? String(playerId) : null;
  }

  function getActiveTurn() {
    const turns = state.match?.turns;
    if (!Array.isArray(turns) || !turns.length) {
      return null;
    }

    const activePlayerId = getActivePlayerId();
    const unfinishedTurns = turns.filter((turn) => {
      if (!turn || typeof turn !== "object") {
        return false;
      }
      return !String(turn.finishedAt || "").trim();
    });

    const unfinishedForActivePlayer = activePlayerId
      ? unfinishedTurns.filter((turn) => String(turn.playerId || "") === activePlayerId)
      : [];

    const unfinishedPick =
      selectNewestTurn(unfinishedForActivePlayer) || selectNewestTurn(unfinishedTurns);

    if (unfinishedPick) {
      return unfinishedPick;
    }

    const activeTurns = activePlayerId
      ? turns.filter((turn) => String(turn?.playerId || "") === activePlayerId)
      : [];

    return selectNewestTurn(activeTurns) || selectNewestTurn(turns) || turns[0] || null;
  }

  function getActiveThrows() {
    const activeTurn = getActiveTurn();
    return Array.isArray(activeTurn?.throws) ? activeTurn.throws : [];
  }

  function getActiveScore() {
    const activeIndex = getActivePlayerIndex();
    const gameScores = state.match?.gameScores;

    if (Array.isArray(gameScores) && Number.isFinite(activeIndex)) {
      const gameScore = gameScores[activeIndex];
      if (Number.isFinite(gameScore)) {
        return gameScore;
      }
    }

    const activeTurn = getActiveTurn();
    return Number.isFinite(activeTurn?.score) ? activeTurn.score : null;
  }

  function getOutMode() {
    const outMode = state.match?.settings?.outMode;
    return outMode ? String(outMode) : "";
  }

  function getCricketMode() {
    const cricketMode = state.match?.settings?.mode;
    return cricketMode ? String(cricketMode) : "";
  }

  function getCricketScoringMode() {
    const candidates = [
      state.match?.settings?.mode,
      state.match?.settings?.gameMode,
      state.match?.gameMode,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return String(candidate).trim();
      }
    }

    return "";
  }

  function getCricketScoringModeNormalized() {
    return classifyCricketScoringMode(getCricketScoringMode());
  }

  function getSnapshot() {
    return {
      running: started,
      interceptionInstalled,
      match: safeClone(state.match),
      updatedAt: state.updatedAt,
      source: state.source,
      topic: state.topic,
      payloadKind: state.payloadKind,
      variant: getVariant(),
      variantNormalized: getVariantNormalized(),
      activePlayerIndex: getActivePlayerIndex(),
      activeScore: getActiveScore(),
      outMode: getOutMode(),
      cricketMode: getCricketMode(),
      cricketScoringMode: getCricketScoringMode(),
      cricketScoringModeNormalized: getCricketScoringModeNormalized(),
      cricketGameMode: getCricketGameMode(),
      cricketGameModeNormalized: getCricketGameModeNormalized(),
    };
  }

  function notifyUpdate() {
    const snapshot = getSnapshot();

    subscribers.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (_) {
        // Fail-soft to keep the runtime stable.
      }
    });

    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit("game-state:updated", snapshot);
    }
  }

  function applyMatch(match, source = "websocket", meta = null) {
    if (!match || typeof match !== "object") {
      return;
    }

    state.match = match;
    state.updatedAt = Date.now();
    state.source = String(source || "unknown");
    state.topic =
      meta && typeof meta.topic === "string" ? String(meta.topic) : "";
    state.payloadKind =
      meta && typeof meta.payloadKind === "string"
        ? String(meta.payloadKind)
        : classifyPayloadKind(match);

    notifyUpdate();
  }

  function processMessageData(rawData) {
    if (typeof rawData !== "string") {
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawData);
    } catch (_) {
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (parsed.channel !== CHANNEL_MATCHES || !parsed.data || parsed.data.body) {
      return;
    }

    const topic = String(parsed.topic || "");
    const payloadKind = classifyPayloadKind(parsed.data);
    const fromStateTopic = topic.endsWith(TOPIC_STATE_SUFFIX);
    const fromStateShape = isLikelyMatchStatePayload(parsed.data);

    if (fromStateTopic && fromStateShape) {
      applyMatch(parsed.data, "websocket-state-topic", { topic, payloadKind });
      return;
    }

    if (!topic && fromStateShape) {
      applyMatch(parsed.data, "websocket-state-shape", { topic, payloadKind });
    }
  }

  function installWebSocketInterception() {
    if (interceptionInstalled) {
      return true;
    }

    if (!windowRef?.MessageEvent?.prototype) {
      return false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(
      windowRef.MessageEvent.prototype,
      "data"
    );

    if (!descriptor || typeof descriptor.get !== "function") {
      return false;
    }

    originalDataDescriptor = descriptor;
    const originalGetter = descriptor.get;

    const wrappedDescriptor = {
      ...descriptor,
      get() {
        const value = originalGetter.call(this);

        try {
          const websocketClass = windowRef.WebSocket;
          const currentTarget = this.currentTarget;
          const isWebSocketMessage = websocketClass
            ? currentTarget instanceof websocketClass
            : Boolean(currentTarget);

          if (isWebSocketMessage) {
            processMessageData(value);
          }
        } catch (_) {
          // Keep getter behavior untouched for host scripts.
        }

        return value;
      },
    };

    try {
      Object.defineProperty(windowRef.MessageEvent.prototype, "data", wrappedDescriptor);
      interceptionInstalled = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  function uninstallWebSocketInterception() {
    if (!interceptionInstalled || !windowRef?.MessageEvent?.prototype || !originalDataDescriptor) {
      return;
    }

    try {
      Object.defineProperty(windowRef.MessageEvent.prototype, "data", originalDataDescriptor);
    } catch (_) {
      // Fail-soft if runtime no longer allows restoring descriptor.
    }

    interceptionInstalled = false;
    originalDataDescriptor = null;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    subscribers.add(listener);

    return () => {
      subscribers.delete(listener);
    };
  }

  function start() {
    if (started) {
      return api;
    }

    started = true;
    installWebSocketInterception();

    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit("game-state:started", getSnapshot());
    }

    return api;
  }

  function stop() {
    if (!started) {
      return api;
    }

    started = false;
    uninstallWebSocketInterception();

    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit("game-state:stopped", getSnapshot());
    }

    return api;
  }

  function isRunning() {
    return started;
  }

  const api = {
    start,
    stop,
    isRunning,
    subscribe,
    getSnapshot,
    applyMatch,
    getVariant,
    getVariantNormalized,
    isX01Variant,
    isCricketVariant,
    getCricketGameMode,
    getCricketGameModeNormalized,
    getOutMode,
    getCricketMode,
    getCricketScoringMode,
    getCricketScoringModeNormalized,
    getActivePlayerIndex,
    getActiveTurn,
    getActiveThrows,
    getActiveScore,
  };

  return api;
}
