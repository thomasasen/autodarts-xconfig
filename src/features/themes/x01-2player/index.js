import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import { PREVIEW_PLACEMENT, STYLE_ID, buildX01TwoPlayerThemeCss } from "./style.js";

const FEATURE_KEY = "theme-x01-2player";
const CONFIG_KEY = "themes.x01TwoPlayer";

const PLAYER_DISPLAY_ID = "ad-ext-player-display";

function countSnapshotPlayers(gameState) {
  const snapshot =
    gameState && typeof gameState.getSnapshot === "function" ? gameState.getSnapshot() : null;
  const players = Array.isArray(snapshot?.match?.players) ? snapshot.match.players : null;
  return players ? players.length : null;
}

function countVisiblePlayerCards(documentRef, windowRef) {
  if (!documentRef || typeof documentRef.getElementById !== "function") {
    return 0;
  }

  const playerDisplayNode = documentRef.getElementById(PLAYER_DISPLAY_ID);
  const playerCards = Array.from(playerDisplayNode?.children || []);
  if (!playerCards.length) {
    return 0;
  }

  return playerCards.filter((playerNode) => {
    if (playerNode?.nodeType !== 1) {
      return false;
    }

    if (playerNode.hasAttribute?.("hidden")) {
      return false;
    }

    if (String(playerNode.getAttribute?.("aria-hidden") || "").trim().toLowerCase() === "true") {
      return false;
    }

    const computedStyle =
      windowRef && typeof windowRef.getComputedStyle === "function"
        ? windowRef.getComputedStyle(playerNode)
        : null;
    if (computedStyle) {
      if (computedStyle.display === "none" || computedStyle.visibility === "hidden") {
        return false;
      }
    }

    return true;
  }).length;
}

function isExactTwoPlayerContext(options = {}) {
  const snapshotCount = countSnapshotPlayers(options.gameState);
  if (Number.isFinite(snapshotCount)) {
    return snapshotCount === 2;
  }

  return countVisiblePlayerCards(options.documentRef, options.windowRef) === 2;
}

export function mountThemeX01TwoPlayer(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "x01",
    matchMode: "equals",
    previewPlacement: PREVIEW_PLACEMENT,
    buildThemeCss: buildX01TwoPlayerThemeCss,
    isSupportedContext: isExactTwoPlayerContext,
  });
}

export const initializeThemeX01TwoPlayer = mountThemeX01TwoPlayer;
export const initialize = mountThemeX01TwoPlayer;
export const mount = mountThemeX01TwoPlayer;
