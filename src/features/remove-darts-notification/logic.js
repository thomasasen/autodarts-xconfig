import { TAKEOUT_IMAGE_ASSET } from "#feature-assets";
import { CARD_CLASS, IMAGE_CLASS } from "./style.js";
import {
  AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS,
  AUTODARTS_TAKEOUT_NOTICE_TEXTS,
} from "../../shared/autodarts-doc-terms.js";

const PRIMARY_SELECTOR = ".adt-remove";
const FALLBACK_TEXTS = Object.freeze([
  "Remove Darts",
  "Removing Darts",
  "Darts entfernen",
  "Takeout started",
  "Takeout is in Progress",
  "Takeout in Progress",
  "Board Manager await you to takeout the Darts",
]);
const TAKEOUT_STATUS_TEXTS = Object.freeze(AUTODARTS_TAKEOUT_NOTICE_TEXTS);
const NON_TAKEOUT_STATUS_TEXTS = Object.freeze(AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS);
const FALLBACK_SCAN_MIN_INTERVAL_MS = 900;
const FALLBACK_AREA_SELECTORS = Object.freeze([
  ".v-overlay-container",
  ".v-overlay__content",
  ".v-snackbar",
  ".v-alert",
  '[role="alert"]',
  PRIMARY_SELECTOR,
]);
const MATCH_VIEW_SELECTORS = Object.freeze(["main", '[role="main"]', "#app"]);
const FALLBACK_AREA_LIMIT = 10;
const FALLBACK_AREA_WINDOW_SIZE = 3;
const FALLBACK_TEXT_NODE_BUDGET = 700;
const NODE_FILTER_SHOW_TEXT =
  typeof NodeFilter === "object" && Number.isFinite(NodeFilter.SHOW_TEXT)
    ? NodeFilter.SHOW_TEXT
    : 4;
const NODE_FILTER_SHOW_ELEMENT =
  typeof NodeFilter === "object" && Number.isFinite(NodeFilter.SHOW_ELEMENT)
    ? NodeFilter.SHOW_ELEMENT
    : 1;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const NORMALIZED_TAKEOUT_STATUS_TEXTS = Object.freeze(
  TAKEOUT_STATUS_TEXTS.map((text) => normalizeText(text)).filter(Boolean)
);
const NORMALIZED_NON_TAKEOUT_STATUS_TEXTS = Object.freeze(
  NON_TAKEOUT_STATUS_TEXTS.map((text) => normalizeText(text)).filter(Boolean)
);
const NORMALIZED_FALLBACK_TEXTS = Object.freeze(
  FALLBACK_TEXTS.map((text) => normalizeText(text)).filter(Boolean)
);

function includesAnyText(text, candidates) {
  return candidates.some((candidate) => text.includes(candidate));
}

export function classifyRemoveDartsNoticeText(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  if (includesAnyText(normalized, NORMALIZED_NON_TAKEOUT_STATUS_TEXTS)) {
    return "";
  }

  if (includesAnyText(normalized, NORMALIZED_TAKEOUT_STATUS_TEXTS)) {
    return "status";
  }

  if (includesAnyText(normalized, NORMALIZED_FALLBACK_TEXTS)) {
    return "fallback";
  }

  return "";
}

function collectPrimaryNoticesInRoots(roots = []) {
  const notices = new Set();

  roots.forEach((root) => {
    if (!root || typeof root.querySelectorAll !== "function") {
      return;
    }

    root.querySelectorAll(PRIMARY_SELECTOR).forEach((node) => notices.add(node));
  });

  return Array.from(notices);
}

function collectSearchRoots(documentRef) {
  if (!documentRef) {
    return [];
  }

  const roots = [documentRef];
  if (typeof documentRef.createTreeWalker !== "function") {
    return roots;
  }

  const rootNode = documentRef.documentElement || documentRef.body;
  if (!rootNode) {
    return roots;
  }

  const seen = new Set();
  const walker = documentRef.createTreeWalker(rootNode, NODE_FILTER_SHOW_ELEMENT);
  let node = walker.nextNode();

  while (node) {
    const shadowRoot = node.shadowRoot;
    if (shadowRoot && typeof shadowRoot.querySelectorAll === "function" && !seen.has(shadowRoot)) {
      seen.add(shadowRoot);
      roots.push(shadowRoot);
    }
    node = walker.nextNode();
  }

  return roots;
}

function getViewKey(documentRef) {
  const locationRef = documentRef?.defaultView?.location;
  if (!locationRef) {
    return "";
  }

  const pathname = String(locationRef.pathname || "");
  const search = String(locationRef.search || "");
  const hash = String(locationRef.hash || "");
  return `${pathname}|${search}|${hash}`;
}

function syncViewState(documentRef, state) {
  const viewKey = getViewKey(documentRef);
  if (viewKey === state.currentViewKey) {
    return;
  }

  state.currentViewKey = viewKey;
  state.fallbackAreasDirty = true;
  state.fallbackAreas = [];
  state.fallbackWindowOffset = 0;
}

function collectFallbackAreas(documentRef, state, roots) {
  syncViewState(documentRef, state);

  if (!state.fallbackAreasDirty && Array.isArray(state.fallbackAreas) && state.fallbackAreas.length) {
    return state.fallbackAreas;
  }

  const candidates = [];
  const seen = new Set();

  const addCandidate = (node) => {
    if (!node || seen.has(node) || node.isConnected === false) {
      return false;
    }

    seen.add(node);
    candidates.push(node);
    return candidates.length >= FALLBACK_AREA_LIMIT;
  };

  const collectFromRoot = (root, selectors) => {
    if (!root || typeof root.querySelectorAll !== "function") {
      return false;
    }

    for (const selector of selectors) {
      const nodes = root.querySelectorAll(selector);
      for (const node of nodes) {
        if (addCandidate(node)) {
          return true;
        }
      }
    }

    return false;
  };

  for (const root of roots) {
    if (collectFromRoot(root, FALLBACK_AREA_SELECTORS)) {
      break;
    }

    if (collectFromRoot(root, MATCH_VIEW_SELECTORS)) {
      break;
    }

    if (candidates.length < FALLBACK_AREA_LIMIT) {
      if (root === documentRef) {
        addCandidate(documentRef.body || documentRef.documentElement);
      } else {
        addCandidate(root.host || root);
      }
    }

    if (candidates.length >= FALLBACK_AREA_LIMIT) {
      break;
    }
  }

  if (!candidates.length) {
    addCandidate(documentRef.body || documentRef.documentElement);
  }

  state.fallbackAreas = candidates.slice(0, FALLBACK_AREA_LIMIT);
  state.fallbackAreasDirty = false;

  if (!state.fallbackAreas.length) {
    state.fallbackWindowOffset = 0;
  } else if (state.fallbackWindowOffset >= state.fallbackAreas.length) {
    state.fallbackWindowOffset = state.fallbackWindowOffset % state.fallbackAreas.length;
  }

  return state.fallbackAreas;
}

function getFallbackScanAreas(state, areas) {
  if (!Array.isArray(areas) || !areas.length) {
    return [];
  }

  const windowSize = Math.max(1, Math.min(FALLBACK_AREA_WINDOW_SIZE, areas.length));
  const selected = [];

  for (let index = 0; index < windowSize; index += 1) {
    selected.push(areas[(state.fallbackWindowOffset + index) % areas.length]);
  }

  state.fallbackWindowOffset = (state.fallbackWindowOffset + windowSize) % areas.length;
  return selected;
}

function shouldRunFallbackSearch(state) {
  const now = Date.now();
  const forceImmediateScan = state.needsImmediateFallbackScan === true;

  if (!forceImmediateScan && now - state.lastFallbackScanAt < FALLBACK_SCAN_MIN_INTERVAL_MS) {
    return false;
  }

  state.needsImmediateFallbackScan = false;
  state.lastFallbackScanAt = now;
  return true;
}

function collectFallbackNotices(documentRef, state) {
  if (!documentRef || typeof documentRef.createTreeWalker !== "function") {
    return [];
  }

  if (!shouldRunFallbackSearch(state)) {
    return [];
  }

  const roots = collectSearchRoots(documentRef);
  const deepPrimary = collectPrimaryNoticesInRoots(roots);
  if (deepPrimary.length) {
    return deepPrimary;
  }

  const areas = collectFallbackAreas(documentRef, state, roots);
  const scanAreas = getFallbackScanAreas(state, areas);
  const statusMatches = new Set();
  const fallbackMatches = new Set();

  let budget = FALLBACK_TEXT_NODE_BUDGET;
  let foundStatusMatch = false;

  for (const area of scanAreas) {
    if (!area || budget <= 0 || foundStatusMatch) {
      continue;
    }

    const walker = documentRef.createTreeWalker(area, NODE_FILTER_SHOW_TEXT);
    let node = walker.nextNode();

    while (node && budget > 0) {
      budget -= 1;
      const matchKind = classifyRemoveDartsNoticeText(node.nodeValue);
      if (node.parentElement && matchKind === "status") {
        statusMatches.add(node.parentElement);
        foundStatusMatch = true;
      } else if (node.parentElement && matchKind === "fallback") {
        fallbackMatches.add(node.parentElement);
      }
      node = walker.nextNode();
    }
  }

  return statusMatches.size ? Array.from(statusMatches) : Array.from(fallbackMatches);
}

function createImageNode(documentRef) {
  const image = documentRef.createElement("img");
  image.classList?.add?.(IMAGE_CLASS);
  image.src = TAKEOUT_IMAGE_ASSET;
  image.alt = "Darts entfernen";
  image.decoding = "async";
  image.loading = "eager";
  return image;
}

function applyReplacement(noticeNode, documentRef) {
  if (!noticeNode || !noticeNode.classList) {
    return;
  }

  noticeNode.classList.add(CARD_CLASS);

  let imageNode = noticeNode.querySelector?.(`.${IMAGE_CLASS}`) || null;
  if (!imageNode) {
    imageNode = createImageNode(documentRef);
    noticeNode.appendChild(imageNode);
  } else {
    imageNode.src = TAKEOUT_IMAGE_ASSET;
    imageNode.alt = "Darts entfernen";
  }
}

function cleanupNotice(noticeNode) {
  if (!noticeNode || !noticeNode.classList) {
    return;
  }

  noticeNode.classList.remove(CARD_CLASS);
  const imageNode = noticeNode.querySelector?.(`.${IMAGE_CLASS}`) || null;
  if (imageNode && imageNode.parentNode && typeof imageNode.parentNode.removeChild === "function") {
    imageNode.parentNode.removeChild(imageNode);
  }
}

export function createRemoveDartsNotificationState() {
  return {
    trackedNotices: new Set(),
    lastFallbackScanAt: 0,
    needsImmediateFallbackScan: false,
    currentViewKey: "",
    fallbackAreasDirty: true,
    fallbackAreas: [],
    fallbackWindowOffset: 0,
  };
}

export function clearRemoveDartsNotificationState(state) {
  if (!state) {
    return;
  }

  state.trackedNotices.forEach((noticeNode) => cleanupNotice(noticeNode));
  state.trackedNotices.clear();
  state.needsImmediateFallbackScan = false;
  state.fallbackAreasDirty = true;
  state.fallbackAreas = [];
  state.fallbackWindowOffset = 0;
}

export function requestImmediateFallbackScan(state) {
  if (!state || typeof state !== "object") {
    return;
  }

  state.needsImmediateFallbackScan = true;
  state.fallbackAreasDirty = true;
}

export function updateRemoveDartsNotification(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;

  if (!documentRef || !state) {
    clearRemoveDartsNotificationState(state);
    return;
  }

  const primaryRoots = collectSearchRoots(documentRef);
  const primary = collectPrimaryNoticesInRoots(primaryRoots);
  if (primary.length) {
    state.needsImmediateFallbackScan = false;
  }
  const notices = primary.length ? primary : collectFallbackNotices(documentRef, state);
  const noticeSet = new Set(notices);

  state.trackedNotices.forEach((noticeNode) => {
    if (noticeSet.has(noticeNode)) {
      return;
    }
    cleanupNotice(noticeNode);
    state.trackedNotices.delete(noticeNode);
  });

  notices.forEach((noticeNode) => {
    state.trackedNotices.add(noticeNode);
    applyReplacement(noticeNode, documentRef);
  });
}
