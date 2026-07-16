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
    players: playerCards.map((node, index) => toPlayerEntry(node, index)),
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

function containsNode(rootNode, node) {
  return Boolean(rootNode && node && (rootNode === node || rootNode.contains?.(node)));
}

function mutationRecordsTouchRoot(records, rootNode) {
  if (!Array.isArray(records) || records.length === 0) {
    return true;
  }

  return records.some((record) => {
    return (
      containsNode(rootNode, record?.target) ||
      Array.from(record?.addedNodes || []).some((node) => containsNode(rootNode, node)) ||
      Array.from(record?.removedNodes || []).some((node) => containsNode(rootNode, node))
    );
  });
}

export function createX01PlayerSurfaceObserverController(options = {}) {
  const documentRef = options.documentRef || null;
  const observerRegistry = options.observerRegistry || null;
  const MutationObserverRef = options.MutationObserverRef || null;
  const keyPrefix = String(options.keyPrefix || "x01-player-surface").trim();
  const onSurfaceMutation =
    typeof options.onSurfaceMutation === "function" ? options.onSurfaceMutation : () => {};
  const onSurfaceChange =
    typeof options.onSurfaceChange === "function" ? options.onSurfaceChange : () => {};
  const lifecycleKey = `${keyPrefix}:lifecycle`;
  const surfaceKey = `${keyPrefix}:surface`;
  let currentRoot = null;
  let surfaceInitialized = false;
  let cleanedUp = false;

  if (
    !documentRef ||
    !observerRegistry ||
    typeof observerRegistry.registerMutationObserver !== "function"
  ) {
    return () => {};
  }

  function disconnect(key) {
    if (typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(key);
    }
  }

  function bindCurrentSurface() {
    if (cleanedUp) {
      return false;
    }

    const nextRoot = queryOne(documentRef, X01_PLAYER_DISPLAY_ROOT_SELECTOR);
    if (nextRoot === currentRoot) {
      surfaceInitialized = true;
      return false;
    }

    const previousRoot = currentRoot;
    const shouldNotifyChange = surfaceInitialized;
    disconnect(surfaceKey);
    currentRoot = nextRoot;

    if (currentRoot) {
      observerRegistry.registerMutationObserver({
        key: surfaceKey,
        target: currentRoot,
        callback: (records = []) => {
          if (currentRoot && mutationRecordsTouchRoot(records, currentRoot)) {
            onSurfaceMutation(records, currentRoot);
          }
        },
        observeOptions: createX01PlayerSurfaceObserveOptions(),
        MutationObserverRef,
      });
    }

    surfaceInitialized = true;
    if (shouldNotifyChange) {
      onSurfaceChange(currentRoot, previousRoot);
    }
    return true;
  }

  const lifecycleTarget = documentRef.documentElement || documentRef.body || documentRef;
  observerRegistry.registerMutationObserver({
    key: lifecycleKey,
    target: lifecycleTarget,
    callback: () => {
      bindCurrentSurface();
    },
    observeOptions: {
      childList: true,
      subtree: true,
    },
    MutationObserverRef,
  });
  bindCurrentSurface();

  return function cleanupX01PlayerSurfaceObserverController() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    disconnect(surfaceKey);
    disconnect(lifecycleKey);
    currentRoot = null;
  };
}
