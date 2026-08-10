import { isLikelyBoardMarker } from "../../shared/dartboard-markers.js";
import { resolveBoardRenderSurface } from "../../shared/dartboard-svg.js";
import {
  BOARD_STYLE_IMAGE_CLASS,
  BOARD_STYLE_IMAGE_ID,
} from "./style.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const BOT_ICON_PATH_PREFIX = "M20 9V7";
const BOT_TEXT_PATTERN = /\bbot\s*level\b/i;
const ACTIVE_CRICKET_ATTRIBUTE = "data-ad-ext-theme-cricket-active";
const DEFAULT_DESIGN = "winmau-blade-6-tc";
const DEFAULT_SCOPE = "bot-turns";
const ALLOWED_SCOPES = new Set([DEFAULT_SCOPE, "all-match-boards"]);

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

function queryOne(rootNode, selector) {
  return queryAll(rootNode, selector)[0] || null;
}

function setAttributeIfChanged(node, name, value) {
  if (!node || typeof node.getAttribute !== "function" || typeof node.setAttribute !== "function") {
    return;
  }

  const nextValue = String(value);
  if (node.getAttribute(name) !== nextValue) {
    node.setAttribute(name, nextValue);
  }
}

function setHrefIfChanged(imageNode, assetUrl) {
  const nextUrl = String(assetUrl || "");
  if (!nextUrl) {
    return;
  }

  setAttributeIfChanged(imageNode, "href", nextUrl);
  if (
    typeof imageNode?.setAttributeNS === "function" &&
    imageNode.getAttribute?.("xlink:href") !== nextUrl
  ) {
    imageNode.setAttributeNS(XLINK_NS, "xlink:href", nextUrl);
  }
}

function getActivePlayerIndex(gameState) {
  if (gameState && typeof gameState.getActivePlayerIndex === "function") {
    const activeIndex = Number(gameState.getActivePlayerIndex());
    if (Number.isFinite(activeIndex) && activeIndex >= 0) {
      return Math.trunc(activeIndex);
    }
  }

  const snapshot =
    gameState && typeof gameState.getSnapshot === "function" ? gameState.getSnapshot() : null;
  const activeIndex = Number(snapshot?.activePlayerIndex ?? snapshot?.match?.player);
  return Number.isFinite(activeIndex) && activeIndex >= 0 ? Math.trunc(activeIndex) : null;
}

function getActivePlayerPayload(gameState, activePlayerIndex) {
  if (!Number.isFinite(activePlayerIndex)) {
    return null;
  }

  const snapshot =
    gameState && typeof gameState.getSnapshot === "function" ? gameState.getSnapshot() : null;
  const players = snapshot?.match?.players;
  return Array.isArray(players) ? players[activePlayerIndex] || null : null;
}

function isBotPlayerPayload(player) {
  if (!player || typeof player !== "object") {
    return false;
  }

  if (player.isBot === true || player.bot === true) {
    return true;
  }

  const typeValues = [player.type, player.kind, player.playerType]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  if (typeValues.some((value) => ["bot", "computer", "cpu"].includes(value))) {
    return true;
  }

  const textValues = [
    player.name,
    player.displayName,
    player.label,
    player.user?.name,
    player.user?.displayName,
  ];
  return textValues.some((value) => BOT_TEXT_PATTERN.test(String(value || "")));
}

function getPlayerCards(documentRef) {
  const cards = queryAll(documentRef, ".ad-ext-player");
  const seen = new Set();
  return cards.filter((node) => {
    if (!node || seen.has(node)) {
      return false;
    }
    seen.add(node);
    return true;
  });
}

function resolveActivePlayerNode(documentRef, activePlayerIndex) {
  const explicitActive =
    queryOne(documentRef, ".ad-ext-player.ad-ext-player-active") ||
    queryOne(documentRef, `.ad-ext-player[${ACTIVE_CRICKET_ATTRIBUTE}="true"]`);
  if (explicitActive) {
    return explicitActive;
  }

  const playerCards = getPlayerCards(documentRef);
  if (Number.isFinite(activePlayerIndex) && playerCards[activePlayerIndex]) {
    return playerCards[activePlayerIndex];
  }

  const nonInactiveCards = playerCards.filter(
    (node) => !node.classList?.contains?.("ad-ext-player-inactive")
  );
  return nonInactiveCards.length === 1 ? nonInactiveCards[0] : null;
}

function hasBotIcon(playerNode) {
  return queryAll(playerNode, "path").some((pathNode) =>
    String(pathNode?.getAttribute?.("d") || "").startsWith(BOT_ICON_PATH_PREFIX)
  );
}

function hasBotText(playerNode) {
  if (!playerNode) {
    return false;
  }

  const textNodes = [
    playerNode,
    ...queryAll(playerNode, ".ad-ext-player-name"),
    ...queryAll(playerNode, "[aria-label]"),
  ];
  return textNodes.some((node) => {
    const text = [node?.textContent, node?.getAttribute?.("aria-label")]
      .map((value) => String(value || ""))
      .join(" ");
    return BOT_TEXT_PATTERN.test(text);
  });
}

export function isBotTurn(documentRef, gameState = null) {
  const activePlayerIndex = getActivePlayerIndex(gameState);
  const activePlayerPayload = getActivePlayerPayload(gameState, activePlayerIndex);
  if (isBotPlayerPayload(activePlayerPayload)) {
    return true;
  }

  const activePlayerNode = resolveActivePlayerNode(
    documentRef,
    activePlayerIndex
  );
  return Boolean(activePlayerNode && (hasBotIcon(activePlayerNode) || hasBotText(activePlayerNode)));
}

export function resolveBotBoardStyleConfig(featureConfig = {}) {
  const scope = String(featureConfig.scope || "").trim().toLowerCase();
  return {
    enabled: featureConfig.enabled === true,
    design: String(featureConfig.design || DEFAULT_DESIGN).trim().toLowerCase() || DEFAULT_DESIGN,
    scope: ALLOWED_SCOPES.has(scope) ? scope : DEFAULT_SCOPE,
  };
}

function isManagedOverlayNode(node) {
  const id = String(node?.id || node?.getAttribute?.("id") || "")
    .trim()
    .toLowerCase();
  return Boolean(id && id !== BOARD_STYLE_IMAGE_ID && id.startsWith("ad-ext-"));
}

function isLikelyNativeHitHighlight(node) {
  const className =
    typeof node?.className === "string"
      ? node.className
      : String(node?.className?.baseVal || node?.getAttribute?.("class") || "");
  return className
    .split(/\s+/)
    .some((classToken) => /(?:^|[_-])highlight(?:[_-]|$)/i.test(classToken));
}

function isForegroundNode(node) {
  return (
    isManagedOverlayNode(node) ||
    isLikelyNativeHitHighlight(node) ||
    isLikelyBoardMarker(node)
  );
}

function findLastNativeGeometryNode(boardGroup, imageNode) {
  const children = Array.from(boardGroup?.children || []);
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const childNode = children[index];
    if (childNode && childNode !== imageNode && !isForegroundNode(childNode)) {
      return childNode;
    }
  }
  return null;
}

function liftForegroundNodes(boardGroup, imageNode) {
  const children = Array.from(boardGroup?.children || []);
  const imageIndex = children.indexOf(imageNode);
  if (imageIndex < 0) {
    return;
  }

  const foregroundNodesBelowImage = children
    .slice(0, imageIndex)
    .filter((childNode) => isForegroundNode(childNode));
  const insertionReference = imageNode.nextElementSibling;
  foregroundNodesBelowImage.forEach((foregroundNode) => {
    if (insertionReference) {
      insertionReference.before(foregroundNode);
    } else {
      boardGroup.appendChild(foregroundNode);
    }
  });
}

function placeImageInLayer(boardGroup, imageNode) {
  if (!boardGroup || !imageNode) {
    return;
  }

  const lastNativeGeometryNode = findLastNativeGeometryNode(boardGroup, imageNode);
  const insertionReference = lastNativeGeometryNode?.nextElementSibling || null;
  if (insertionReference !== imageNode) {
    if (insertionReference) {
      insertionReference.before(imageNode);
    } else {
      boardGroup.appendChild(imageNode);
    }
  }

  liftForegroundNodes(boardGroup, imageNode);
}

function removeDuplicateImages(documentRef, keepNode = null) {
  queryAll(documentRef, `#${BOARD_STYLE_IMAGE_ID}`).forEach((node) => {
    if (node !== keepNode) {
      node.remove?.();
    }
  });
}

function ensureBoardStyleImage(documentRef, state, boardGroup) {
  let imageNode = state?.imageNode;
  if (imageNode && (imageNode.isConnected === false || imageNode.parentNode !== boardGroup)) {
    imageNode.remove?.();
    imageNode = null;
    state.signature = "";
  }

  if (!imageNode) {
    imageNode = queryOne(boardGroup, `#${BOARD_STYLE_IMAGE_ID}`);
  }

  if (!imageNode) {
    const ownerDocument = boardGroup?.ownerDocument || documentRef;
    imageNode = ownerDocument?.createElementNS?.(SVG_NS, "image") || null;
    if (!imageNode) {
      return null;
    }
    imageNode.id = BOARD_STYLE_IMAGE_ID;
    imageNode.classList?.add?.(BOARD_STYLE_IMAGE_CLASS);
    setAttributeIfChanged(imageNode, "aria-hidden", "true");
    setAttributeIfChanged(imageNode, "focusable", "false");
    setAttributeIfChanged(imageNode, "pointer-events", "none");
    setAttributeIfChanged(imageNode, "preserveAspectRatio", "xMidYMid meet");
  }

  removeDuplicateImages(documentRef, imageNode);
  placeImageInLayer(boardGroup, imageNode);
  state.imageNode = imageNode;
  state.boardGroup = boardGroup;
  return imageNode;
}

export function createBotBoardStyleState() {
  return {
    imageNode: null,
    boardGroup: null,
    signature: "",
  };
}

export function clearBotBoardStyle(documentRef, state) {
  removeDuplicateImages(documentRef);
  if (state) {
    state.imageNode = null;
    state.boardGroup = null;
    state.signature = "";
  }
}

export function updateBotBoardStyle(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const gameState = options.gameState || null;
  const assetResolver = options.assetResolver;
  const config = resolveBotBoardStyleConfig(options.featureConfig);

  const shouldRender =
    config.enabled &&
    (config.scope === "all-match-boards" || isBotTurn(documentRef, gameState));
  if (!documentRef || !state || !shouldRender || typeof assetResolver !== "function") {
    clearBotBoardStyle(documentRef, state);
    return null;
  }

  const board = resolveBoardRenderSurface(documentRef);
  const radius = Number(board?.radius);
  if (!board?.group || !Number.isFinite(radius) || radius <= 0) {
    clearBotBoardStyle(documentRef, state);
    return null;
  }

  const assetUrl = String(assetResolver(config.design) || "").trim();
  if (!assetUrl) {
    clearBotBoardStyle(documentRef, state);
    return null;
  }

  const imageNode = ensureBoardStyleImage(documentRef, state, board.group);
  if (!imageNode) {
    clearBotBoardStyle(documentRef, state);
    return null;
  }

  const diameter = radius * 2;
  const signature = [config.design, assetUrl, radius].join("|");
  if (state.signature !== signature) {
    setHrefIfChanged(imageNode, assetUrl);
    setAttributeIfChanged(imageNode, "x", -radius);
    setAttributeIfChanged(imageNode, "y", -radius);
    setAttributeIfChanged(imageNode, "width", diameter);
    setAttributeIfChanged(imageNode, "height", diameter);
    state.signature = signature;
  }

  placeImageInLayer(board.group, imageNode);
  return imageNode;
}
