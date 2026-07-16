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
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch (_) {
      // Fall through to the plain-data clone used by websocket payloads.
    }
  }

  const clones = new WeakMap();
  function clonePlainData(entry) {
    if (entry === null || typeof entry !== "object") {
      return entry;
    }
    if (clones.has(entry)) {
      return clones.get(entry);
    }

    const clone = Array.isArray(entry) ? [] : {};
    clones.set(entry, clone);
    Object.keys(entry).forEach((key) => {
      clone[key] = clonePlainData(entry[key]);
    });
    return clone;
  }

  return clonePlainData(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }

  seen.add(value);
  Object.values(value).forEach((entry) => deepFreeze(entry, seen));
  return Object.freeze(value);
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
    options.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const documentRef =
    options.documentRef ||
    windowRef?.document ||
    null;

  const subscribers = new Set();
  const state = {
    match: null,
    updatedAt: 0,
    source: "none",
    topic: "",
    payloadKind: "",
    lastMessageRawData: "",
    lastMessageTopic: "",
    lastMessageSignature: "",
  };

  let started = false;
  let interceptionInstalled = false;
  let originalDataDescriptor = null;
  let stateRevision = 0;
  let stateDerivedCache = null;
  let variantDerivedCache = null;
  let snapshotCache = null;

  function invalidateDerivedCache() {
    stateRevision += 1;
    stateDerivedCache = null;
    variantDerivedCache = null;
    snapshotCache = null;
  }

  function readVariantFromDom() {
    if (!documentRef || typeof documentRef.getElementById !== "function") {
      return "";
    }

    const variantElement = documentRef.getElementById("ad-ext-game-variant");
    return String(variantElement?.textContent || "").trim();
  }

  function resolveVariant(domVariantText) {
    return state.match?.variant ? String(state.match.variant) : domVariantText;
  }

  function resolveCricketGameMode(domVariantText, includeHiddenCricket) {
    const candidates = [
      state.match?.settings?.gameMode,
      state.match?.gameMode,
      domVariantText,
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

    const fallbackVariant = normalizeVariant(resolveVariant(domVariantText));
    if (fallbackVariant === "cricket" || fallbackVariant.startsWith("cricket ")) {
      return "Cricket";
    }

    return "";
  }

  function resolveActivePlayerIndex() {
    const activeIndex = state.match?.player;
    return Number.isFinite(activeIndex) ? activeIndex : null;
  }

  function resolveActivePlayerId(activeIndex) {
    const players = state.match?.players;
    if (!Array.isArray(players) || !Number.isFinite(activeIndex)) {
      return null;
    }

    const playerId = players[activeIndex]?.id;
    return playerId ? String(playerId) : null;
  }

  function resolveActiveTurn(activePlayerId) {
    const turns = state.match?.turns;
    if (!Array.isArray(turns) || !turns.length) {
      return null;
    }

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

  function resolveActiveScore(activeIndex, activeTurn) {
    const gameScores = state.match?.gameScores;

    if (Array.isArray(gameScores) && Number.isFinite(activeIndex)) {
      const gameScore = gameScores[activeIndex];
      if (Number.isFinite(gameScore)) {
        return gameScore;
      }
    }

    return Number.isFinite(activeTurn?.score) ? activeTurn.score : null;
  }

  function resolveOutMode() {
    const outMode = state.match?.settings?.outMode;
    return outMode ? String(outMode) : "";
  }

  function resolveCricketMode() {
    const cricketMode = state.match?.settings?.mode;
    return cricketMode ? String(cricketMode) : "";
  }

  function resolveCricketScoringMode() {
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

  function getStateDerivedState() {
    if (stateDerivedCache?.revision === stateRevision) {
      return stateDerivedCache;
    }

    const activePlayerIndex = resolveActivePlayerIndex();
    const activePlayerId = resolveActivePlayerId(activePlayerIndex);
    const activeTurn = resolveActiveTurn(activePlayerId);
    const activeThrows = Array.isArray(activeTurn?.throws) ? activeTurn.throws : [];
    const cricketScoringMode = resolveCricketScoringMode();

    stateDerivedCache = Object.freeze({
      revision: stateRevision,
      activePlayerIndex,
      activePlayerId,
      activeTurn,
      activeThrows,
      activeScore: resolveActiveScore(activePlayerIndex, activeTurn),
      outMode: resolveOutMode(),
      cricketMode: resolveCricketMode(),
      cricketScoringMode,
      cricketScoringModeNormalized: classifyCricketScoringMode(cricketScoringMode),
    });
    return stateDerivedCache;
  }

  function getVariantDerivedState() {
    const domVariantText = readVariantFromDom();
    if (
      variantDerivedCache?.revision === stateRevision &&
      variantDerivedCache.domVariantText === domVariantText
    ) {
      return variantDerivedCache;
    }

    const variant = resolveVariant(domVariantText);
    const cricketGameMode = resolveCricketGameMode(domVariantText, false);
    const cricketGameModeIncludingHidden = resolveCricketGameMode(domVariantText, true);

    variantDerivedCache = Object.freeze({
      revision: stateRevision,
      domVariantText,
      variant,
      variantNormalized: normalizeVariant(variant),
      cricketGameMode,
      cricketGameModeNormalized: classifyCricketGameMode(cricketGameMode),
      cricketGameModeIncludingHidden,
      cricketGameModeIncludingHiddenNormalized: classifyCricketGameMode(
        cricketGameModeIncludingHidden
      ),
    });
    snapshotCache = null;
    return variantDerivedCache;
  }

  function getVariant() {
    return getVariantDerivedState().variant;
  }

  function getVariantNormalized() {
    return getVariantDerivedState().variantNormalized;
  }

  function getCricketGameMode(options = {}) {
    const derived = getVariantDerivedState();
    return options.includeHiddenCricket
      ? derived.cricketGameModeIncludingHidden
      : derived.cricketGameMode;
  }

  function getCricketGameModeNormalized(options = {}) {
    const derived = getVariantDerivedState();
    return options.includeHiddenCricket
      ? derived.cricketGameModeIncludingHiddenNormalized
      : derived.cricketGameModeNormalized;
  }

  function isX01Variant(options = {}) {
    return isX01VariantText(getVariantDerivedState().variant, options);
  }

  function isCricketVariant(options = {}) {
    const derived = getVariantDerivedState();
    const domMode = classifyCricketGameMode(derived.domVariantText);
    if (domMode === "hidden-cricket" && !options.includeHiddenCricket) {
      return false;
    }

    const mode = options.includeHiddenCricket
      ? derived.cricketGameModeIncludingHiddenNormalized
      : derived.cricketGameModeNormalized;
    if (mode === "cricket" || mode === "tactics") {
      return true;
    }
    if (mode === "hidden-cricket") {
      return Boolean(options.includeHiddenCricket);
    }
    return isCricketVariantText(derived.variant, options);
  }

  function getActivePlayerIndex() {
    return getStateDerivedState().activePlayerIndex;
  }

  function getActiveTurn() {
    return getStateDerivedState().activeTurn;
  }

  function getActiveThrows() {
    return getStateDerivedState().activeThrows;
  }

  function getActiveScore() {
    return getStateDerivedState().activeScore;
  }

  function getOutMode() {
    return getStateDerivedState().outMode;
  }

  function getCricketMode() {
    return getStateDerivedState().cricketMode;
  }

  function getCricketScoringMode() {
    return getStateDerivedState().cricketScoringMode;
  }

  function getCricketScoringModeNormalized() {
    return getStateDerivedState().cricketScoringModeNormalized;
  }

  function getSnapshot() {
    const stateDerived = getStateDerivedState();
    const variantDerived = getVariantDerivedState();
    if (
      snapshotCache &&
      snapshotCache.revision === stateDerived.revision &&
      snapshotCache.domVariantText === variantDerived.domVariantText
    ) {
      return snapshotCache.value;
    }

    const value = Object.freeze({
      running: started,
      interceptionInstalled,
      match: state.match,
      updatedAt: state.updatedAt,
      source: state.source,
      topic: state.topic,
      payloadKind: state.payloadKind,
      variant: variantDerived.variant,
      variantNormalized: variantDerived.variantNormalized,
      activePlayerIndex: stateDerived.activePlayerIndex,
      activeScore: stateDerived.activeScore,
      outMode: stateDerived.outMode,
      cricketMode: stateDerived.cricketMode,
      cricketScoringMode: stateDerived.cricketScoringMode,
      cricketScoringModeNormalized: stateDerived.cricketScoringModeNormalized,
      cricketGameMode: variantDerived.cricketGameMode,
      cricketGameModeNormalized: variantDerived.cricketGameModeNormalized,
    });
    snapshotCache = {
      revision: stateDerived.revision,
      domVariantText: variantDerived.domVariantText,
      value,
    };
    return value;
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

    const messageRawData = meta && typeof meta.rawData === "string" ? meta.rawData : "";
    const messageTopic = meta && typeof meta.topic === "string" ? meta.topic : "";
    const legacyMessageSignature =
      meta && typeof meta.messageSignature === "string" ? meta.messageSignature : "";
    if (
      (messageRawData &&
        messageRawData === state.lastMessageRawData &&
        messageTopic === state.lastMessageTopic) ||
      (legacyMessageSignature && legacyMessageSignature === state.lastMessageSignature)
    ) {
      return;
    }

    state.match = deepFreeze(safeClone(match));
    state.updatedAt = Date.now();
    state.source = String(source || "unknown");
    state.topic = messageTopic;
    state.payloadKind =
      meta && typeof meta.payloadKind === "string"
        ? String(meta.payloadKind)
        : classifyPayloadKind(match);
    state.lastMessageRawData = messageRawData;
    state.lastMessageTopic = messageTopic;
    state.lastMessageSignature = legacyMessageSignature;
    invalidateDerivedCache();

    notifyUpdate();
  }

  function processMessageData(rawData) {
    if (typeof rawData !== "string") {
      return;
    }
    if (rawData && rawData === state.lastMessageRawData) {
      return;
    }

    let parsed;
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
      applyMatch(parsed.data, "websocket-state-topic", {
        topic,
        payloadKind,
        rawData,
      });
      return;
    }

    if (!topic && fromStateShape) {
      applyMatch(parsed.data, "websocket-state-shape", {
        topic,
        payloadKind,
        rawData,
      });
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
    invalidateDerivedCache();

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
    state.lastMessageRawData = "";
    state.lastMessageTopic = "";
    state.lastMessageSignature = "";
    uninstallWebSocketInterception();
    invalidateDerivedCache();

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
