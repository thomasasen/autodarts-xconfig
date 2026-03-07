import { TAKEOUT_IMAGE_ASSET } from "#feature-assets";
import { CARD_CLASS, IMAGE_CLASS } from "./style.js";

const PRIMARY_SELECTOR = ".adt-remove";
const FALLBACK_TEXTS = Object.freeze(["Removing Darts", "Darts entfernen"]);
const NODE_FILTER_SHOW_TEXT =
  typeof NodeFilter === "object" && Number.isFinite(NodeFilter.SHOW_TEXT)
    ? NodeFilter.SHOW_TEXT
    : 4;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function collectPrimaryNotices(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }
  return Array.from(documentRef.querySelectorAll(PRIMARY_SELECTOR));
}

function shouldRunFallbackSearch(state) {
  const now = Date.now();
  if (now - state.lastFallbackScanAt < 900) {
    return false;
  }
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

  const textMatches = FALLBACK_TEXTS.map((text) => normalizeText(text));
  const walker = documentRef.createTreeWalker(
    documentRef.body || documentRef.documentElement,
    NODE_FILTER_SHOW_TEXT
  );
  const matches = new Set();
  let budget = 750;
  let node = walker.nextNode();

  while (node && budget > 0) {
    budget -= 1;
    const normalized = normalizeText(node.nodeValue);
    if (normalized) {
      const found = textMatches.some((needle) => normalized.includes(needle));
      if (found && node.parentElement) {
        matches.add(node.parentElement);
      }
    }
    node = walker.nextNode();
  }

  return Array.from(matches);
}

function createImageNode(documentRef) {
  const image = documentRef.createElement("img");
  image.className = IMAGE_CLASS;
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
  };
}

export function clearRemoveDartsNotificationState(state) {
  if (!state) {
    return;
  }

  state.trackedNotices.forEach((noticeNode) => cleanupNotice(noticeNode));
  state.trackedNotices.clear();
}

export function updateRemoveDartsNotification(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;

  if (!documentRef || !state) {
    clearRemoveDartsNotificationState(state);
    return;
  }

  const primary = collectPrimaryNotices(documentRef);
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
