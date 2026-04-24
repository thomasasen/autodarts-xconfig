export const X01_PLAYER_DISPLAY_ROOT_SELECTOR = "#ad-ext-player-display";
export const X01_PLAYER_CARD_SELECTOR = ".ad-ext-player, [id^=\"ad-ext-player-\"]";
export const X01_PLAYER_SCORE_SELECTOR = ".ad-ext-player-score";
export const X01_PLAYER_NAME_SELECTOR = ".ad-ext-player-name";
export const X01_PLAYER_SURFACE_SOURCE_TOOLS = "tools-for-autodarts";
export const X01_PLAYER_SURFACE_SOURCE_NONE = "none";

const PLAYER_ID_PATTERN = /^ad-ext-player-\d+$/;

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

function isElementNode(node) {
  return Boolean(node && Number(node.nodeType) === 1);
}

function isPlayerCardNode(node, playerDisplayRoot = null) {
  if (!isElementNode(node) || node === playerDisplayRoot) {
    return false;
  }

  return (
    node.classList?.contains?.("ad-ext-player") === true ||
    PLAYER_ID_PATTERN.test(String(node.id || "").trim())
  );
}

function collectDescendantPlayerCards(rootNode) {
  const cards = [];
  const seen = new Set();
  const stack = Array.from(rootNode?.children || []);

  while (stack.length) {
    const node = stack.shift();
    if (!node) {
      continue;
    }

    if (isPlayerCardNode(node, rootNode) && !seen.has(node)) {
      seen.add(node);
      cards.push(node);
    }

    stack.push(...Array.from(node.children || []));
  }

  return cards;
}

function getPlayerCards(playerDisplayRoot) {
  const seen = new Set();
  const cards = [];

  queryAll(playerDisplayRoot, X01_PLAYER_CARD_SELECTOR).forEach((node) => {
    if (!isPlayerCardNode(node, playerDisplayRoot) || seen.has(node)) {
      return;
    }
    seen.add(node);
    cards.push(node);
  });

  collectDescendantPlayerCards(playerDisplayRoot).forEach((node) => {
    if (!seen.has(node)) {
      seen.add(node);
      cards.push(node);
    }
  });

  return cards.filter((node) => node?.isConnected !== false);
}

function readPlayerId(node) {
  const id = String(node?.id || "").trim();
  return id || "";
}

function readScopedText(node, selector) {
  return normalizeText(queryOne(node, selector)?.textContent || "");
}

function isPlayerActive(node) {
  if (node?.classList?.contains?.("ad-ext-player-active")) {
    return true;
  }
  if (node?.classList?.contains?.("ad-ext-player-inactive")) {
    return false;
  }
  return false;
}

function toPlayerEntry(node, index) {
  return {
    node,
    index,
    id: readPlayerId(node),
    nameText: readScopedText(node, X01_PLAYER_NAME_SELECTOR),
    scoreText: readScopedText(node, X01_PLAYER_SCORE_SELECTOR),
    isActive: isPlayerActive(node),
  };
}

function createEmptySnapshot() {
  return {
    playerDisplayRoot: null,
    playerCards: [],
    players: [],
    source: X01_PLAYER_SURFACE_SOURCE_NONE,
  };
}

export function getX01PlayerSurfaceSnapshot(documentRef) {
  const playerDisplayRoot = queryOne(documentRef, X01_PLAYER_DISPLAY_ROOT_SELECTOR);
  if (!playerDisplayRoot) {
    return createEmptySnapshot();
  }

  const playerCards = getPlayerCards(playerDisplayRoot);
  return {
    playerDisplayRoot,
    playerCards,
    players: playerCards.map(toPlayerEntry),
    source: X01_PLAYER_SURFACE_SOURCE_TOOLS,
  };
}

export function findX01PlayerSurface(documentRef) {
  return getX01PlayerSurfaceSnapshot(documentRef);
}

export function createX01PlayerSurfaceObserveOptions() {
  return {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  };
}
