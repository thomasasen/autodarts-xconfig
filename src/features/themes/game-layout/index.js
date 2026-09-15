import { createFeatureMountHarness } from "../../shared/feature-mount-harness.js";
import { isThemeGameContextActive } from "../shared/theme-utils.js";
import {
  GAME_LAYOUT_PADDING,
  GAME_LAYOUT_NAME_MIN_FONT_SIZE,
  GAME_LAYOUT_PLAYER_GAP,
  GAME_LAYOUT_TURN_HEIGHT,
  GAME_LAYOUT_TURN_PLAYER_GAP,
  calculateBoardFocusLayout,
  calculateClearRailRange,
  calculateFittedFontSize,
  moveBoardFocusWindow,
} from "./logic.js";
import { resolveModernX01GameLayoutSurface } from "./surface.js";
import { STYLE_ID, buildThemeGameLayoutStyleText } from "./style.js";

const FEATURE_KEY = "theme-game-layout";
const CONFIG_KEY = "themes.gameLayout";
const MANAGED_ATTRIBUTES = Object.freeze([
  "data-ad-ext-game-layout-root",
  "data-ad-ext-game-layout-overflow",
  "data-ad-ext-game-layout-stage",
  "data-ad-ext-game-layout-turn-slot",
  "data-ad-ext-game-layout-variant",
  "data-ad-ext-game-layout-board-slot",
  "data-ad-ext-game-layout-board-frame",
  "data-ad-ext-game-layout-controls-slot",
  "data-ad-ext-game-layout-control-bar",
  "data-ad-ext-game-layout-controls-visible",
  "data-ad-ext-game-layout-player-column",
  "data-ad-ext-game-layout-player-item",
  "data-ad-ext-game-layout-active",
  "data-ad-ext-game-layout-player-card",
  "data-ad-ext-game-layout-player-body",
  "data-ad-ext-game-layout-player-content",
  "data-ad-ext-game-layout-name-region",
  "data-ad-ext-game-layout-name-container",
  "data-ad-ext-game-layout-name-plate",
  "data-ad-ext-game-layout-score-region",
  "data-ad-ext-game-layout-score-value",
  "data-ad-ext-game-layout-legs",
  "data-ad-ext-game-layout-stat-region",
  "data-ad-ext-game-layout-checkout-rail",
  "data-ad-ext-game-layout-visible",
]);
const MANAGED_PROPERTIES = Object.freeze([
  "--ad-game-layout-rail-width",
  "--ad-game-layout-board-size",
  "--ad-game-layout-player-height",
  "--ad-game-layout-thumb-height",
  "--ad-game-layout-thumb-offset",
  "--ad-game-layout-name-font-size",
  "--ad-game-layout-variant-left",
  "--ad-game-layout-variant-width",
]);

function setMarker(node, name, value = "true") {
  node?.setAttribute?.(name, value);
}

function clearNode(node) {
  MANAGED_ATTRIBUTES.forEach((name) => node?.removeAttribute?.(name));
  node?.style?.removeProperty?.("--ad-game-layout-player-y");
  node?.style?.removeProperty?.("--ad-game-layout-card-height");
  node?.style?.removeProperty?.("--ad-game-layout-score-span");
  MANAGED_PROPERTIES.forEach((name) => node?.style?.removeProperty?.(name));
}

function readPositiveDimension(primary, fallback) {
  const value = Number(primary);
  if (Number.isFinite(value) && value > 0) return value;
  const fallbackValue = Number(fallback);
  return Number.isFinite(fallbackValue) && fallbackValue > 0 ? fallbackValue : 0;
}

function readInnerHeight(node, windowRef) {
  if (!node) return 0;
  const style = windowRef?.getComputedStyle?.(node) || {};
  const padding = (Number.parseFloat(style.paddingTop) || 0) +
    (Number.parseFloat(style.paddingBottom) || 0);
  const height = readPositiveDimension(node.clientHeight, node.getBoundingClientRect?.().height);
  return Math.max(0, height - padding);
}

function fitPlayerName(player, windowRef) {
  const nameNode = player.nameNode;
  const nameRegion = player.nameRegion;
  if (!nameNode || !nameRegion) return;

  nameRegion.style?.removeProperty?.("--ad-game-layout-name-font-size");
  const computedStyle = windowRef?.getComputedStyle?.(nameNode) || {};
  const preferredFontSize = Number.parseFloat(computedStyle.fontSize);
  const nameRect = nameNode.getBoundingClientRect?.() || {};
  const availableWidth = readPositiveDimension(nameNode.clientWidth, nameRect.width);
  const contentWidth = readPositiveDimension(nameNode.scrollWidth, nameRect.width);
  const contentHeight = readPositiveDimension(nameNode.scrollHeight, nameRect.height);
  const heightContainers = [];
  for (let node = nameNode.parentElement; node; node = node.parentElement) {
    const height = readInnerHeight(node, windowRef);
    if (height) heightContainers.push(height);
    if (node === nameRegion) break;
  }
  const availableHeight = heightContainers.length
    ? Math.min(...heightContainers)
    : readPositiveDimension(nameNode.clientHeight, nameRect.height);
  const fittedFontSize = calculateFittedFontSize({
    preferredFontSize,
    minimumFontSize: GAME_LAYOUT_NAME_MIN_FONT_SIZE,
    availableWidth,
    availableHeight,
    contentWidth,
    contentHeight,
  });
  if (fittedFontSize > 0 && fittedFontSize < preferredFontSize) {
    nameRegion.style?.setProperty?.(
      "--ad-game-layout-name-font-size",
      `${fittedFontSize}px`
    );
  }
}

function avoidHeaderCollisions(surface, metrics, documentRef) {
  const variantNode = surface.variantNode;
  const variantRect = variantNode?.getBoundingClientRect?.();
  if (!variantNode || !variantRect?.width || !variantRect?.height) return;

  const obstacles = Array.from(documentRef?.querySelectorAll?.("button") || [])
    .filter((node) => !variantNode.contains?.(node))
    .map((node) => node.getBoundingClientRect?.())
    .filter((rect) => rect?.width > 0 && rect?.height > 0);
  const range = calculateClearRailRange({
    railLeft: variantRect.left,
    railWidth: metrics.railWidth,
    railTop: variantRect.top,
    railBottom: variantRect.bottom,
    obstacles,
    gap: 12,
  });
  const leftOffset = range.left - variantRect.left;
  variantNode.style?.setProperty?.(
    "--ad-game-layout-variant-left",
    `${GAME_LAYOUT_PADDING + leftOffset}px`
  );
  variantNode.style?.setProperty?.("--ad-game-layout-variant-width", `${range.width}px`);
}

function selfCorrectSurface(surface, metrics, documentRef, windowRef) {
  surface.players.forEach((player) => fitPlayerName(player, windowRef));
  avoidHeaderCollisions(surface, metrics, documentRef);
}

function alignScoreToStatus(player) {
  for (let pass = 0; pass < 2; pass += 1) {
    const dartRect = player.dartIconNode?.getBoundingClientRect?.();
    const legsRect = player.legsNode?.getBoundingClientRect?.();
    const scoreSpan = Number(legsRect?.bottom) - Number(dartRect?.top);
    if (!Number.isFinite(scoreSpan) || scoreSpan <= 0) return;
    player.scoreValueNode.style?.setProperty?.("--ad-game-layout-score-span", `${scoreSpan}px`);
  }
}

function createAppliedState() {
  return {
    nodes: new Set(),
    inertStates: new Map(),
    root: null,
    wheelHandler: null,
  };
}

function rememberNode(state, node) {
  if (node) state.nodes.add(node);
  return node;
}

function setItemInert(state, item, inert) {
  if (!state.inertStates.has(item)) {
    state.inertStates.set(item, {
      present: item.getAttribute?.("inert") !== null,
      value: item.getAttribute?.("inert"),
    });
  }
  if (inert) item.setAttribute?.("inert", "");
  else item.removeAttribute?.("inert");
}

function clearAppliedState(state, preservedControlBar = null) {
  if (state.root && state.wheelHandler) {
    state.root.removeEventListener?.("wheel", state.wheelHandler);
  }
  state.inertStates.forEach((original, item) => {
    if (original.present) item.setAttribute?.("inert", original.value || "");
    else item.removeAttribute?.("inert");
  });
  state.nodes.forEach((node) => {
    if (node !== preservedControlBar) clearNode(node);
  });
  state.nodes.clear();
  state.inertStates.clear();
  state.root = null;
  state.wheelHandler = null;
}

function markSurface(state, surface, metrics) {
  const mark = (node, attribute, value = "true") => {
    rememberNode(state, node);
    setMarker(node, attribute, value);
  };
  mark(surface.root, "data-ad-ext-game-layout-root");
  setMarker(surface.root, "data-ad-ext-game-layout-overflow", String(metrics.overflow));
  surface.root.style?.setProperty?.("--ad-game-layout-rail-width", `${metrics.railWidth}px`);
  surface.root.style?.setProperty?.("--ad-game-layout-board-size", `${metrics.boardSize}px`);
  surface.root.style?.setProperty?.("--ad-game-layout-player-height", `${metrics.playerHeight}px`);
  surface.root.style?.setProperty?.("--ad-game-layout-thumb-height", `${metrics.scrollThumbHeight}px`);
  surface.root.style?.setProperty?.("--ad-game-layout-thumb-offset", `${metrics.scrollThumbOffset}px`);
  mark(surface.stage, "data-ad-ext-game-layout-stage");
  mark(surface.variantNode, "data-ad-ext-game-layout-variant");
  surface.variantNode.style?.setProperty?.("--ad-game-layout-rail-width", `${metrics.railWidth}px`);
  mark(surface.turnSlot, "data-ad-ext-game-layout-turn-slot");
  mark(surface.boardSlot, "data-ad-ext-game-layout-board-slot");
  mark(surface.boardFrame, "data-ad-ext-game-layout-board-frame");
  mark(surface.controlsSlot, "data-ad-ext-game-layout-controls-slot");
  mark(surface.controlBar, "data-ad-ext-game-layout-control-bar");
  surface.playerColumns.forEach((column) => mark(column, "data-ad-ext-game-layout-player-column"));

  let nextPlayerY = GAME_LAYOUT_PADDING + GAME_LAYOUT_TURN_HEIGHT + GAME_LAYOUT_TURN_PLAYER_GAP;
  surface.players.forEach((player, index) => {
    const visible = index >= metrics.firstVisibleIndex &&
      index < metrics.firstVisibleIndex + metrics.visiblePlayerCount;
    const isActive = surface.activeIndex < 0 || player.active;
    const cardHeight = isActive ? metrics.playerHeight : metrics.inactivePlayerHeight;
    const playerY = nextPlayerY;
    if (visible) nextPlayerY += cardHeight + GAME_LAYOUT_PLAYER_GAP;
    mark(player.item, "data-ad-ext-game-layout-player-item");
    mark(
      player.item,
      "data-ad-ext-game-layout-active",
      String(isActive)
    );
    setMarker(player.item, "data-ad-ext-game-layout-visible", String(visible));
    player.item.style?.setProperty?.("--ad-game-layout-player-y", `${playerY}px`);
    player.item.style?.setProperty?.("--ad-game-layout-card-height", `${cardHeight}px`);
    setItemInert(state, player.item, !visible);
    mark(player.cardNode, "data-ad-ext-game-layout-player-card");
    mark(player.body, "data-ad-ext-game-layout-player-body");
    mark(player.content, "data-ad-ext-game-layout-player-content");
    mark(player.nameRegion, "data-ad-ext-game-layout-name-region");
    mark(player.nameContainerNode, "data-ad-ext-game-layout-name-container");
    mark(player.namePlateNode, "data-ad-ext-game-layout-name-plate");
    mark(player.scoreRegion, "data-ad-ext-game-layout-score-region");
    mark(player.scoreValueNode, "data-ad-ext-game-layout-score-value");
    mark(player.legsNode, "data-ad-ext-game-layout-legs");
    player.checkoutRail && mark(player.checkoutRail, "data-ad-ext-game-layout-checkout-rail");
    player.statRegions.forEach((node, statIndex) =>
      mark(node, "data-ad-ext-game-layout-stat-region", String(statIndex))
    );
    alignScoreToStatus(player);
  });
}

function readResponsiveLayoutSize(surface, windowRef) {
  const rootRect = surface?.root?.getBoundingClientRect?.();
  const rootHeight = Math.max(0, Number(rootRect?.height) || 0);
  const visualViewportHeight = Math.max(0, Number(windowRef?.visualViewport?.height) || 0);
  const windowHeight = Math.max(0, Number(windowRef?.innerHeight) || 0);
  return {
    width: rootRect?.width,
    height: Math.max(rootHeight, visualViewportHeight || windowHeight),
  };
}

export function mountThemeGameLayout(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards || null;
  const config = context.config || null;
  const appliedState = createAppliedState();
  let firstVisibleIndex = 0;
  let lastMetrics = null;
  let controlBar = null;
  let controlsTimer = null;
  const timerHost = windowRef?.setTimeout ? windowRef : globalThis;
  const resetControls = () => {
    if (controlsTimer !== null) timerHost.clearTimeout(controlsTimer);
    controlsTimer = null;
    controlBar = null;
  };
  const revealControls = () => {
    if (!controlBar) return;
    if (controlsTimer !== null) timerHost.clearTimeout(controlsTimer);
    setMarker(controlBar, "data-ad-ext-game-layout-controls-visible");
    controlsTimer = timerHost.setTimeout(() => {
      controlsTimer = null;
      controlBar?.removeAttribute?.("data-ad-ext-game-layout-controls-visible");
    }, 5000);
  };

  if (!documentRef || !domGuards) return () => {};

  const harness = createFeatureMountHarness(context, {
    isSupported: () => true,
    update: () => {
      const featureConfig = config?.getFeatureConfig?.(CONFIG_KEY);
      if (!featureConfig?.enabled || !isThemeGameContextActive({ documentRef, windowRef })) {
        clearAppliedState(appliedState);
        resetControls();
        domGuards.removeNodeById(STYLE_ID);
        lastMetrics = null;
        return;
      }

      const surface = resolveModernX01GameLayoutSurface(documentRef, windowRef);
      const layoutSize = readResponsiveLayoutSize(surface, windowRef);
      const metrics = calculateBoardFocusLayout({
        width: layoutSize.width,
        height: layoutSize.height,
        playerCount: surface?.players?.length,
        activeIndex: surface?.activeIndex,
        firstVisibleIndex,
      });
      if (!surface || !metrics.supported) {
        clearAppliedState(appliedState);
        resetControls();
        domGuards.removeNodeById(STYLE_ID);
        lastMetrics = null;
        return;
      }

      firstVisibleIndex = metrics.firstVisibleIndex;
      lastMetrics = metrics;
      // Preserve opacity markers so frequent updates do not restart the fade.
      clearAppliedState(appliedState, surface.controlBar);
      domGuards.ensureStyle(STYLE_ID, buildThemeGameLayoutStyleText());
      markSurface(appliedState, surface, metrics);
      controlBar = surface.controlBar;
      if (controlsTimer !== null) setMarker(controlBar, "data-ad-ext-game-layout-controls-visible");
      selfCorrectSurface(surface, metrics, documentRef, windowRef);
      appliedState.root = surface.root;
      appliedState.wheelHandler = (event) => {
        if (!lastMetrics?.overflow || !Number(event?.deltaY)) return;
        const rect = surface.root.getBoundingClientRect?.();
        const localX = Number(event?.clientX) - Number(rect?.left || 0);
        const localY = Number(event?.clientY) - Number(rect?.top || 0);
        const isInsidePlayerRail =
          localX >= GAME_LAYOUT_PADDING &&
          localX <= GAME_LAYOUT_PADDING + lastMetrics.railWidth &&
          localY >= GAME_LAYOUT_PADDING + GAME_LAYOUT_TURN_HEIGHT + GAME_LAYOUT_TURN_PLAYER_GAP &&
          localY <= GAME_LAYOUT_PADDING + GAME_LAYOUT_TURN_HEIGHT +
            GAME_LAYOUT_TURN_PLAYER_GAP + lastMetrics.playerViewportHeight;
        if (!isInsidePlayerRail) return;
        const nextIndex = moveBoardFocusWindow(
          firstVisibleIndex,
          event.deltaY,
          lastMetrics.playerCount,
          lastMetrics.visiblePlayerCount
        );
        if (nextIndex === firstVisibleIndex) return;
        event.preventDefault?.();
        firstVisibleIndex = nextIndex;
        harness.schedule();
      };
      surface.root.addEventListener?.("wheel", appliedState.wheelHandler, { passive: false });
      context.featureDebug?.log?.("Board-Fokus aktiv.", {
        players: metrics.playerCount,
        visiblePlayers: metrics.visiblePlayerCount,
        boardSize: Math.round(metrics.boardSize),
      });
    },
  });
  if (!harness) return () => {};

  harness.registerObserver({
    key: `${FEATURE_KEY}:dom-observer`,
    callback: () => harness.schedule(),
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "aria-hidden"],
    },
  });
  harness.registerListeners([
    { key: `${FEATURE_KEY}:mousemove`, target: documentRef, type: "mousemove", handler: revealControls },
    { key: `${FEATURE_KEY}:resize`, target: windowRef, type: "resize", handler: () => harness.schedule() },
    { key: `${FEATURE_KEY}:visual-viewport-resize`, target: windowRef?.visualViewport, type: "resize", handler: () => harness.schedule() },
    { key: `${FEATURE_KEY}:fonts-loaded`, target: documentRef.fonts, type: "loadingdone", handler: () => harness.schedule() },
    { key: `${FEATURE_KEY}:popstate`, target: windowRef, type: "popstate", handler: () => harness.schedule() },
    { key: `${FEATURE_KEY}:hashchange`, target: windowRef, type: "hashchange", handler: () => harness.schedule() },
  ]);
  harness.subscribeToGameState();
  harness.schedule();
  return harness.createCleanup(() => {
    resetControls();
    clearAppliedState(appliedState);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const initializeThemeGameLayout = mountThemeGameLayout;
export const initialize = mountThemeGameLayout;
export const mount = mountThemeGameLayout;
