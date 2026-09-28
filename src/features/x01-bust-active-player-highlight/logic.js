import {
  BUST_ACTIVE_CLASS,
  BUST_CARD_STYLE_PROPERTIES,
  BUST_IMPACT_SURFACE_CLASS,
  BUST_SURFACE_CLASS,
  FALLBACK_BUST_CARD_VISUALS,
  NATIVE_BUST_EFFECT_HIDDEN_CLASS,
} from "./style.js";
import { X01_BUST_GLASS_CRACK_SOUND_ASSET } from "#feature-assets";
import { getX01PlayerSurfaceSnapshot } from "../shared/x01-player-surface-adapter.js";
import { readModernMatchSurface } from "../shared/x01-match-surface.js";
import { resolveBoardRenderSurface } from "../../shared/dartboard-svg.js";
import { collectBoardMarkers } from "../../shared/dartboard-markers.js";
import { isX01VariantText } from "../../domain/variant-rules.js";
import { removeBustCracks, renderBustCracks, updateBustCrackOrigin } from "./cracks.js";

export const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";
export const ACTIVE_PLAYER_SELECTOR =
  "#ad-ext-player-display .ad-ext-player.ad-ext-player-active, #ad-ext-player-display .ad-ext-player-active, .ad-ext-player.ad-ext-player-active, .ad-ext-player-active";
const BUST_SOUND_VOLUME = 0.9;
const BUST_AUDIO_FALLBACK_SOURCE = "html-audio";
const BUST_AUDIO_WEB_SOURCE = "web-audio";
const DART_IMAGE_OVERLAY_SELECTOR = "#ad-ext-dart-image-overlay";
const DART_FLIGHT_SELECTOR = ".ad-ext-dart-flight-group";
const DART_ROTATE_SELECTOR = ".ad-ext-dart-rotate-group";
const DART_POSE_SELECTOR = ".ad-ext-dart-pose-group";
export const BUST_EFFECT_TARGETS = Object.freeze({
  PLAYER_CARD: "player-card",
  BOARD: "board",
  SCREEN: "screen",
  IMPACT: "impact",
});
// Autodarts coordinates use the 170 mm scoring radius inside the 225 mm board radius.
const BUST_IMPACT_SCORING_RADIUS_RATIO = 17 / 45;
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

  const modernSurface = readModernMatchSurface(
    context.documentRef,
    context.windowRef || context.documentRef?.defaultView
  );
  if (modernSurface.turnContainer || modernSurface.playerCard) {
    return modernSurface.variant === "X01";
  }

  return isX01VariantText(readVariantText(context.documentRef), {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function hasVisibleBustTurnScore(documentRef, windowRef = documentRef?.defaultView) {
  const modernSurface = readModernMatchSurface(documentRef, windowRef);
  if (modernSurface.turnScoreNode) {
    return normalizeText(modernSurface.turnScoreToken).toUpperCase() === "BUST";
  }
  return queryAll(documentRef, TURN_POINTS_SELECTOR).some((node) => {
    return normalizeText(node?.textContent || "").toUpperCase() === "BUST";
  });
}

export function findActiveX01PlayerCard(documentRef, windowRef = documentRef?.defaultView) {
  const snapshot = getX01PlayerSurfaceSnapshot(documentRef, {
    includeModern: true,
    windowRef,
  });
  const activePlayer = Array.isArray(snapshot.players)
    ? snapshot.players.find((player) => player?.isActive === true)
    : null;
  if (activePlayer?.node) {
    return activePlayer.node;
  }

  return queryOne(documentRef, ACTIVE_PLAYER_SELECTOR);
}

export function normalizeBustEffectTarget(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Object.values(BUST_EFFECT_TARGETS).includes(normalized)
    ? normalized
    : BUST_EFFECT_TARGETS.PLAYER_CARD;
}

function findDirectChildContaining(parentNode, descendantNode) {
  if (!parentNode || !descendantNode || parentNode === descendantNode) {
    return null;
  }
  let current = descendantNode;
  while (current?.parentElement && current.parentElement !== parentNode) {
    current = current.parentElement;
  }
  return current?.parentElement === parentNode ? current : null;
}

function resolveBustBoardTarget(context = {}) {
  const boardSurface = context.boardSurface || resolveBoardRenderSurface(context.documentRef);
  return [boardSurface?.zoomTarget, boardSurface?.zoomHost, boardSurface?.svg?.parentElement]
    .find((node) => String(node?.tagName || "").toLowerCase() !== "svg" && node?.classList) || null;
}

function resolveBustScreenTarget(context, activePlayerNode) {
  const documentRef = context.documentRef;
  const mainNode = activePlayerNode?.closest?.("main") || queryOne(documentRef, "main");
  const playerBranch = findDirectChildContaining(mainNode, activePlayerNode);
  const boardBranch = findDirectChildContaining(mainNode, resolveBustBoardTarget(context));
  if (playerBranch && playerBranch === boardBranch) {
    return playerBranch;
  }
  if (!boardBranch && playerBranch) {
    return playerBranch;
  }
  return mainNode || playerBranch || null;
}

export function resolveBustEffectTargetNode(context = {}, activePlayerNode = null) {
  switch (normalizeBustEffectTarget(context.effectTarget)) {
    case BUST_EFFECT_TARGETS.BOARD:
      return resolveBustBoardTarget(context);
    case BUST_EFFECT_TARGETS.IMPACT:
    case BUST_EFFECT_TARGETS.SCREEN:
      return resolveBustScreenTarget(context, activePlayerNode);
    default:
      return activePlayerNode;
  }
}

function readLastBustThrowCoordinates(gameState) {
  const activeThrows = gameState?.getActiveThrows?.();
  const throws = Array.isArray(activeThrows) ? activeThrows : [];
  const coords = throws.at(-1)?.coords;
  const x = Number(coords?.x);
  const y = Number(coords?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function readNodeRect(node) {
  const rect = node?.getBoundingClientRect?.();
  if (!(Number(rect?.width) > 0) || !(Number(rect?.height) > 0)) {
    return null;
  }
  return {
    left: Number(rect.left) || 0,
    top: Number(rect.top) || 0,
    width: Number(rect.width),
    height: Number(rect.height),
  };
}

function resolveRenderedMarkerImpactOrigin(documentRef, boardSurface, targetRect) {
  const markers = collectBoardMarkers(documentRef, { board: boardSurface });
  const markerRect = readNodeRect(markers.at(-1));
  if (!markerRect) {
    return null;
  }
  return {
    x: markerRect.left - targetRect.left + markerRect.width / 2,
    y: markerRect.top - targetRect.top + markerRect.height / 2,
    source: "board-marker",
  };
}

function readDartTipPivot(flightNode) {
  const rotateTransform = queryOne(flightNode, DART_ROTATE_SELECTOR)?.getAttribute?.("transform");
  const match = String(rotateTransform || "").match(
    /rotate\(\s*[-+0-9.eE]+[\s,]+([-+0-9.eE]+)[\s,]+([-+0-9.eE]+)\s*\)/
  );
  const x = Number(match?.[1]);
  const y = Number(match?.[2]);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function resolveRenderedDartTipImpactOrigin(documentRef, targetRect) {
  const overlay = queryOne(documentRef, DART_IMAGE_OVERLAY_SELECTOR);
  const flightNode = queryAll(overlay, DART_FLIGHT_SELECTOR).at(-1) || null;
  const poseNode = queryOne(flightNode, DART_POSE_SELECTOR);
  const localTip = readDartTipPivot(flightNode);
  const matrix = poseNode?.getScreenCTM?.();
  if (!overlay?.createSVGPoint || !localTip || !matrix) {
    return null;
  }

  let screenPoint = null;
  try {
    const point = overlay.createSVGPoint();
    point.x = localTip.x;
    point.y = localTip.y;
    screenPoint = point.matrixTransform?.(matrix) || null;
  } catch (_) {
    return null;
  }
  if (!Number.isFinite(screenPoint?.x) || !Number.isFinite(screenPoint?.y)) {
    return null;
  }
  return {
    x: Number(screenPoint.x) - targetRect.left,
    y: Number(screenPoint.y) - targetRect.top,
    source: "rendered-dart-tip",
  };
}

function resolveBustImpactOrigin(context = {}, targetNode = null) {
  const targetRect = readNodeRect(targetNode);
  const boardSurface = context.boardSurface || resolveBoardRenderSurface(context.documentRef);
  const boardNode = resolveBustBoardTarget({ ...context, boardSurface });
  const boardRect = readNodeRect(boardNode);
  if (!targetRect) {
    return null;
  }

  const renderedDartTipOrigin = resolveRenderedDartTipImpactOrigin(
    context.documentRef,
    targetRect
  );
  if (renderedDartTipOrigin) {
    return renderedDartTipOrigin;
  }
  if (!boardRect) {
    return null;
  }

  const renderedMarkerOrigin = resolveRenderedMarkerImpactOrigin(
    context.documentRef,
    boardSurface,
    targetRect
  );
  if (renderedMarkerOrigin) {
    return renderedMarkerOrigin;
  }

  const coords = readLastBustThrowCoordinates(context.gameState);
  const normalizedX = coords?.x ?? 0;
  const normalizedY = coords?.y ?? 0;
  return {
    x:
      boardRect.left - targetRect.left +
      boardRect.width * (0.5 + normalizedX * BUST_IMPACT_SCORING_RADIUS_RATIO),
    y:
      boardRect.top - targetRect.top +
      boardRect.height * (0.5 - normalizedY * BUST_IMPACT_SCORING_RADIUS_RATIO),
    source: coords ? "throw-coords" : "board-center",
  };
}

export function refreshBustImpactOrigin(
  context = {},
  state = createBustActivePlayerHighlightState()
) {
  if (
    state.effectTarget !== BUST_EFFECT_TARGETS.IMPACT ||
    !state.activeNode?.classList ||
    state.dismissedForCurrentBust
  ) {
    return false;
  }

  const impactOrigin = resolveBustImpactOrigin(context, state.activeNode);
  return impactOrigin
    ? updateBustCrackOrigin(state.activeNode, impactOrigin)
    : false;
}

function isNativeBustEffectLayer(node) {
  if (
    !node?.classList?.contains?.("absolute") ||
    !node.classList.contains("inset-0") ||
    !node.classList.contains("pointer-events-none") ||
    node.getAttribute?.("aria-hidden") !== "true"
  ) {
    return false;
  }

  return queryAll(node, "svg").some((svg) => {
    if (
      svg.getAttribute?.("viewBox") !== "0 0 1000 1000" ||
      svg.getAttribute?.("preserveAspectRatio") !== "xMidYMid slice"
    ) {
      return false;
    }
    return queryAll(svg, "clipPath").some((clipPath) =>
      String(clipPath?.getAttribute?.("id") || "").startsWith("__lottie_element_")
    );
  });
}

export function findNativeBustEffectLayers(node) {
  return Array.from(node?.children || []).filter(isNativeBustEffectLayer);
}

function restoreNativeBustEffectLayers(state) {
  if (!(state?.nativeEffectNodes instanceof Set)) {
    return;
  }
  state.nativeEffectNodes.forEach((node) => {
    node?.classList?.remove?.(NATIVE_BUST_EFFECT_HIDDEN_CLASS);
  });
  state.nativeEffectNodes.clear();
}

function suppressNativeBustEffectLayers(node, state) {
  if (!(state?.nativeEffectNodes instanceof Set)) {
    return 0;
  }

  state.nativeEffectNodes.forEach((previousNode) => {
    if (!node?.contains?.(previousNode)) {
      previousNode?.classList?.remove?.(NATIVE_BUST_EFFECT_HIDDEN_CLASS);
      state.nativeEffectNodes.delete(previousNode);
    }
  });

  const nativeEffectNodes = findNativeBustEffectLayers(node);
  nativeEffectNodes.forEach((nativeEffectNode) => {
    nativeEffectNode.classList?.add?.(NATIVE_BUST_EFFECT_HIDDEN_CLASS);
    state.nativeEffectNodes.add(nativeEffectNode);
  });
  return nativeEffectNodes.length;
}

export function resolveBustCardVisuals() {
  return {
    ...FALLBACK_BUST_CARD_VISUALS,
    borderColor: "rgb(217, 31, 62)",
    borderStyle: "solid",
    borderWidth: "2px",
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
  setImportantStyleProperty(node, "border-color", visuals.borderColor || "rgb(217, 31, 62)");
  setImportantStyleProperty(node, "border-style", visuals.borderStyle || "solid");
  setImportantStyleProperty(node, "border-width", visuals.borderWidth || "2px");
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
        fetchRef: (function selectFetch() {
          if (typeof windowRef.fetch === "function") {
            return windowRef.fetch.bind(windowRef);
          }
          if (typeof fetch === "function") {
            return fetch;
          }
          return null;
        })(),
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
  if (audioState?.sourceType !== BUST_AUDIO_WEB_SOURCE) {
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

function clearNodeState(node, state = null) {
  if (!node?.classList) {
    return;
  }
  node.classList.remove(BUST_ACTIVE_CLASS);
  node.classList.remove(BUST_SURFACE_CLASS);
  node.classList.remove(BUST_IMPACT_SURFACE_CLASS);
  removeBustCracks(node);
  clearBustCardVisuals(node);
  findNativeBustEffectLayers(node).forEach((nativeEffectNode) => {
    nativeEffectNode.classList?.remove?.(NATIVE_BUST_EFFECT_HIDDEN_CLASS);
    state?.nativeEffectNodes?.delete?.(nativeEffectNode);
  });
}

function applyBustEffectVisuals(node, effectTarget, visuals = {}, options = {}) {
  if (effectTarget === BUST_EFFECT_TARGETS.PLAYER_CARD) {
    node.classList.add(BUST_ACTIVE_CLASS);
    applyBustCardVisuals(node, visuals);
    return;
  }
  node.classList.add(BUST_SURFACE_CLASS);
  node.classList.toggle(
    BUST_IMPACT_SURFACE_CLASS,
    effectTarget === BUST_EFFECT_TARGETS.IMPACT && options.raiseDartOverlay === true
  );
}

export function createBustActivePlayerHighlightState() {
  return {
    wasBust: false,
    activeNode: null,
    effectTarget: BUST_EFFECT_TARGETS.PLAYER_CARD,
    dismissedForCurrentBust: false,
    audioState: null,
    audioUnlocked: false,
    nativeEffectNodes: new Set(),
  };
}

export function clearBustActivePlayerHighlightState(state) {
  if (!state) {
    return;
  }

  if (state.activeNode) {
    clearNodeState(state.activeNode, state);
  }
  restoreNativeBustEffectLayers(state);
  state.wasBust = false;
  state.activeNode = null;
  state.effectTarget = BUST_EFFECT_TARGETS.PLAYER_CARD;
  state.dismissedForCurrentBust = false;
}

function eventHitsNode(event, node) {
  if (!event || !node) {
    return false;
  }
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  if (Array.isArray(path) && path.includes(node)) {
    return true;
  }
  const target = event.target || null;
  return target === node || Boolean(target && node.contains?.(target));
}

export function dismissBustSurfaceHighlightForEvent(state, event) {
  if (
    !state?.activeNode ||
    state.effectTarget === BUST_EFFECT_TARGETS.PLAYER_CARD ||
    !eventHitsNode(event, state.activeNode)
  ) {
    return false;
  }

  event.preventDefault?.();
  event.stopPropagation?.();
  clearNodeState(state.activeNode, state);
  state.activeNode = null;
  state.dismissedForCurrentBust = true;
  return true;
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
  const effectTarget = normalizeBustEffectTarget(options.effectTarget);
  state.effectTarget = effectTarget;
  applyBustEffectVisuals(targetNode, effectTarget, FALLBACK_BUST_CARD_VISUALS);
  state.activeNode = targetNode;
  state.wasBust = true;
  const targetRect = readNodeRect(targetNode);
  const previewImpactOrigin = effectTarget === BUST_EFFECT_TARGETS.IMPACT && targetRect
    ? {
        x: targetRect.width * 0.72,
        y: targetRect.height * 0.34,
        source: "preview-impact",
      }
    : null;
  renderBustCracks(targetNode, options.crackCount, {
    documentRef,
    random: options.random,
    origin: previewImpactOrigin,
  });
  const soundResult = playBustGlassCrackSound({
    windowRef,
    soundEnabled: options.soundEnabled === true,
    state,
  });
  state.audioState = soundResult.audioState || null;

  const dismissListenerOptions = { capture: true };
  const dismissClick = (event) => dismissBustSurfaceHighlightForEvent(state, event);
  if (
    effectTarget !== BUST_EFFECT_TARGETS.PLAYER_CARD &&
    typeof targetNode.addEventListener === "function"
  ) {
    targetNode.addEventListener("click", dismissClick, dismissListenerOptions);
  }

  return () => {
    targetNode.removeEventListener?.("click", dismissClick, dismissListenerOptions);
    clearBustActivePlayerHighlightState(state);
  };
}

export function syncBustActivePlayerHighlight(context = {}, state = createBustActivePlayerHighlightState()) {
  const documentRef = context.documentRef;
  const windowRef = context.windowRef || null;
  const isSupported = documentRef && isX01BustFeatureActive(context);
  const isBust = Boolean(isSupported && hasVisibleBustTurnScore(documentRef, windowRef));

  if (!isBust) {
    clearBustActivePlayerHighlightState(state);
    return {
      isBust: false,
      activeNode: null,
      enteredBust: false,
    };
  }

  const activePlayerNode = findActiveX01PlayerCard(documentRef, windowRef);
  const effectTarget = normalizeBustEffectTarget(context.effectTarget);
  state.effectTarget = effectTarget;
  if (activePlayerNode?.classList && state.dismissedForCurrentBust) {
    if (state.activeNode) {
      clearNodeState(state.activeNode, state);
      state.activeNode = null;
    }
    state.wasBust = true;
    return {
      isBust: true,
      activeNode: null,
      enteredBust: false,
      dismissed: true,
      suppressedNativeEffects: suppressNativeBustEffectLayers(activePlayerNode, state),
    };
  }
  const activeNode = resolveBustEffectTargetNode(
    { ...context, documentRef, effectTarget },
    activePlayerNode
  );
  if (!activePlayerNode?.classList || !activeNode?.classList) {
    clearBustActivePlayerHighlightState(state);
    state.wasBust = true;
    return {
      isBust: true,
      activeNode: null,
      enteredBust: false,
    };
  }

  const targetChanged = state.activeNode !== activeNode;
  if (targetChanged) {
    clearNodeState(state.activeNode, state);
  }

  const enteredBust = state.wasBust !== true;
  const visuals = resolveBustCardVisuals();
  applyBustEffectVisuals(activeNode, effectTarget, visuals, { raiseDartOverlay: true });
  state.activeNode = activeNode;
  state.wasBust = true;
  const suppressedNativeEffects = suppressNativeBustEffectLayers(activePlayerNode, state);

  if (enteredBust || targetChanged) {
    const impactOrigin = effectTarget === BUST_EFFECT_TARGETS.IMPACT
      ? resolveBustImpactOrigin(context, activeNode)
      : null;
    renderBustCracks(activeNode, context.crackCount, {
      documentRef,
      random: context.random,
      origin: impactOrigin,
    });
  } else if (effectTarget === BUST_EFFECT_TARGETS.IMPACT) {
    refreshBustImpactOrigin(context, state);
  }
  if (enteredBust) {
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
    enteredBust,
    suppressedNativeEffects,
    dismissed: false,
  };
}
