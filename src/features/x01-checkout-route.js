export const SUGGESTION_SELECTOR = ".suggestion";

function isElementVisible(element, windowRef) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  if (!(rect.width > 0 && rect.height > 0)) {
    return false;
  }

  try {
    const style = windowRef?.getComputedStyle?.(element);
    if (!style) {
      return true;
    }
    return !(
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    );
  } catch (_) {
    return true;
  }
}

function parseExplicitRouteSegments(text, x01Rules) {
  if (x01Rules && typeof x01Rules.parseExplicitCheckoutSegments === "function") {
    return x01Rules.parseExplicitCheckoutSegments(text);
  }

  const normalizedText = String(text || "").toUpperCase();
  const tokens =
    normalizedText.match(/\b(?:DB|BULLSEYE|BULL|SB|OB|[TDS](?:[1-9]|1\d|20|25))\b/g) || [];

  return tokens
    .map((token) => {
      if (token === "DB" || token === "BULLSEYE" || token === "BULL") {
        return "BULL";
      }
      if (token === "SB" || token === "OB") {
        return "S25";
      }
      return typeof x01Rules?.normalizeSegmentName === "function"
        ? x01Rules.normalizeSegmentName(token)
        : token;
    })
    .filter(Boolean);
}

function getStableNodeIndex(node, allNodes) {
  const index = Array.isArray(allNodes) ? allNodes.indexOf(node) : -1;
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function compareSuggestionNodes(left, right) {
  const leftRect = left?.rect || {};
  const rightRect = right?.rect || {};
  const leftX = Number.isFinite(leftRect.left) ? leftRect.left : 0;
  const rightX = Number.isFinite(rightRect.left) ? rightRect.left : 0;
  if (leftX !== rightX) {
    return leftX - rightX;
  }

  const leftY = Number.isFinite(leftRect.top) ? leftRect.top : 0;
  const rightY = Number.isFinite(rightRect.top) ? rightRect.top : 0;
  if (leftY !== rightY) {
    return leftY - rightY;
  }

  return Number(left?.domIndex || 0) - Number(right?.domIndex || 0);
}

export function collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const allSuggestionNodes = Array.from(documentRef.querySelectorAll(SUGGESTION_SELECTOR));
  return allSuggestionNodes
    .filter((node) => isElementVisible(node, windowRef))
    .map((node) => {
      const text = String(node?.textContent || "").trim();
      const segments = parseExplicitRouteSegments(text, x01Rules);
      if (!segments.length) {
        return null;
      }

      return {
        node,
        text,
        rect: node.getBoundingClientRect?.() || null,
        domIndex: getStableNodeIndex(node, allSuggestionNodes),
        segments,
      };
    })
    .filter(Boolean)
    .sort(compareSuggestionNodes);
}

export function collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules) {
  return collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules).flatMap(
    (entry) => entry.segments
  );
}

export function getFirstCheckoutRouteSegment(routeSegments = []) {
  return Array.isArray(routeSegments) && routeSegments.length ? String(routeSegments[0] || "") : "";
}

export function getSingleSuggestionSegmentFromRoute(routeSegments = []) {
  return Array.isArray(routeSegments) && routeSegments.length === 1
    ? String(routeSegments[0] || "")
    : "";
}

export function getCheckoutFinishSegmentFromRoute(routeSegments = [], outMode, x01Rules) {
  const lastSegment = Array.isArray(routeSegments) && routeSegments.length
    ? String(routeSegments[routeSegments.length - 1] || "")
    : "";
  if (!lastSegment) {
    return "";
  }

  if (typeof x01Rules?.isOneDartCheckoutSegmentForOutMode === "function") {
    return x01Rules.isOneDartCheckoutSegmentForOutMode(lastSegment, outMode) ? lastSegment : "";
  }

  if (typeof x01Rules?.isOneDartCheckoutSegment === "function") {
    return x01Rules.isOneDartCheckoutSegment(lastSegment) ? lastSegment : "";
  }

  return "";
}

export function segmentNameToBoardTarget(segmentName, x01Rules) {
  const parsed =
    typeof x01Rules?.parseSegment === "function" ? x01Rules.parseSegment(segmentName) : null;
  if (!parsed) {
    return null;
  }

  if (parsed.normalized === "BULL" || (parsed.ring === "D" && parsed.value === 25)) {
    return { ring: "DB" };
  }

  if (parsed.ring === "S" && parsed.value === 25) {
    return { ring: "SB" };
  }

  return {
    ring: parsed.ring,
    value: parsed.value,
  };
}

export function mapRouteSegmentsToBoardTargets(routeSegments = [], x01Rules) {
  const seen = new Set();
  return (Array.isArray(routeSegments) ? routeSegments : [])
    .map((segment) => segmentNameToBoardTarget(segment, x01Rules))
    .filter((target) => {
      if (!target) {
        return false;
      }

      const key = `${target.ring}:${Number.isFinite(target.value) ? target.value : ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}
