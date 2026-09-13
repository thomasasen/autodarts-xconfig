import { createFeatureMountHarness } from "../../shared/feature-mount-harness.js";
import { isThemeGameContextActive } from "../shared/theme-utils.js";
import {
  GAME_LAYOUT_PADDING,
  GAME_LAYOUT_PLAYER_GAP,
  GAME_LAYOUT_TURN_HEIGHT,
  calculateBoardFocusLayout,
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
  "data-ad-ext-game-layout-player-column",
  "data-ad-ext-game-layout-player-item",
  "data-ad-ext-game-layout-active",
  "data-ad-ext-game-layout-player-card",
  "data-ad-ext-game-layout-player-body",
  "data-ad-ext-game-layout-player-content",
  "data-ad-ext-game-layout-name-region",
  "data-ad-ext-game-layout-score-region",
  "data-ad-ext-game-layout-score-value",
  "data-ad-ext-game-layout-legs",
  "data-ad-ext-game-layout-stat-region",
  "data-ad-ext-game-layout-checkout-rail",
  "data-ad-ext-game-layout-visible",
]);
const ROOT_PROPERTIES = Object.freeze([
  "--ad-game-layout-rail-width",
  "--ad-game-layout-player-height",
  "--ad-game-layout-thumb-height",
  "--ad-game-layout-thumb-offset",
]);

function setMarker(node, name, value = "true") {
  node?.setAttribute?.(name, value);
}

function clearNode(node) {
  MANAGED_ATTRIBUTES.forEach((name) => node?.removeAttribute?.(name));
  node?.style?.removeProperty?.("--ad-game-layout-player-y");
  node?.style?.removeProperty?.("--ad-game-layout-card-height");
  node?.style?.removeProperty?.("--ad-game-layout-score-span");
  ROOT_PROPERTIES.forEach((name) => node?.style?.removeProperty?.(name));
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

function clearAppliedState(state) {
  if (state.root && state.wheelHandler) {
    state.root.removeEventListener?.("wheel", state.wheelHandler);
  }
  state.inertStates.forEach((original, item) => {
    if (original.present) item.setAttribute?.("inert", original.value || "");
    else item.removeAttribute?.("inert");
  });
  state.nodes.forEach(clearNode);
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

  let nextPlayerY = GAME_LAYOUT_PADDING + GAME_LAYOUT_TURN_HEIGHT;
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

export function mountThemeGameLayout(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards || null;
  const config = context.config || null;
  const appliedState = createAppliedState();
  let firstVisibleIndex = 0;
  let lastMetrics = null;

  if (!documentRef || !domGuards) return () => {};

  const harness = createFeatureMountHarness(context, {
    isSupported: () => true,
    update: () => {
      clearAppliedState(appliedState);
      const featureConfig = config?.getFeatureConfig?.(CONFIG_KEY);
      if (!featureConfig?.enabled || !isThemeGameContextActive({ documentRef, windowRef })) {
        domGuards.removeNodeById(STYLE_ID);
        lastMetrics = null;
        return;
      }

      const surface = resolveModernX01GameLayoutSurface(documentRef, windowRef);
      const rootRect = surface?.root?.getBoundingClientRect?.();
      const metrics = calculateBoardFocusLayout({
        width: rootRect?.width,
        height: rootRect?.height,
        playerCount: surface?.players?.length,
        activeIndex: surface?.activeIndex,
        firstVisibleIndex,
      });
      if (!surface || !metrics.supported) {
        domGuards.removeNodeById(STYLE_ID);
        lastMetrics = null;
        return;
      }

      firstVisibleIndex = metrics.firstVisibleIndex;
      lastMetrics = metrics;
      domGuards.ensureStyle(STYLE_ID, buildThemeGameLayoutStyleText());
      markSurface(appliedState, surface, metrics);
      appliedState.root = surface.root;
      appliedState.wheelHandler = (event) => {
        if (!lastMetrics?.overflow || !Number(event?.deltaY)) return;
        const rect = surface.root.getBoundingClientRect?.();
        const localX = Number(event?.clientX) - Number(rect?.left || 0);
        const localY = Number(event?.clientY) - Number(rect?.top || 0);
        const isInsidePlayerRail =
          localX >= GAME_LAYOUT_PADDING &&
          localX <= GAME_LAYOUT_PADDING + lastMetrics.railWidth &&
          localY >= GAME_LAYOUT_PADDING + GAME_LAYOUT_TURN_HEIGHT &&
          localY <= GAME_LAYOUT_PADDING + GAME_LAYOUT_TURN_HEIGHT + lastMetrics.playerViewportHeight;
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
    { key: `${FEATURE_KEY}:resize`, target: windowRef, type: "resize", handler: () => harness.schedule() },
    { key: `${FEATURE_KEY}:popstate`, target: windowRef, type: "popstate", handler: () => harness.schedule() },
    { key: `${FEATURE_KEY}:hashchange`, target: windowRef, type: "hashchange", handler: () => harness.schedule() },
  ]);
  harness.subscribeToGameState();
  harness.schedule();
  return harness.createCleanup(() => {
    clearAppliedState(appliedState);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const initializeThemeGameLayout = mountThemeGameLayout;
export const initialize = mountThemeGameLayout;
export const mount = mountThemeGameLayout;
