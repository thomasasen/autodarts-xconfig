export const SUGGESTION_SELECTOR = ".suggestion";
const CHECKOUT_MARKER_PATTERN = /\bCHECKOUT\b/i;

function isElementStyleVisible(element, windowRef) {
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

function isElementVisible(element, windowRef) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  if (!(rect.width > 0 && rect.height > 0)) {
    return false;
  }

  return isElementStyleVisible(element, windowRef);
}

function parseExplicitRouteSegments(text, x01Rules) {
  if (x01Rules && typeof x01Rules.parseExplicitCheckoutSegments === "function") {
    return x01Rules.parseExplicitCheckoutSegments(text);
  }

  const normalizedText = String(text || "").toUpperCase();
  const tokens =
    normalizedText.match(/\b(?:DBULL|DB|BULLSEYE|BULL|SB|OB|25|[TDS](?:[1-9]|1\d|20|25))\b/g) || [];

  return tokens
    .map((token) => {
      if (token === "DBULL" || token === "DB" || token === "BULLSEYE" || token === "BULL") {
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

function normalizeRouteTextCandidate(value) {
  return String(value || "").trim();
}

function getSuggestionLeafTextValues(node) {
  if (!node || typeof node.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(node.querySelectorAll("*"))
    .filter((element) => {
      if (!element || typeof element.querySelectorAll !== "function") {
        return false;
      }
      return element.querySelectorAll("*").length === 0;
    })
    .map((element) => normalizeRouteTextCandidate(element.textContent))
    .filter(Boolean);
}

function resolveSuggestionRouteText(node, x01Rules) {
  const candidateValues = [
    normalizeRouteTextCandidate(node?.innerText),
    normalizeRouteTextCandidate(node?.textContent),
    ...getSuggestionLeafTextValues(node),
  ];
  const seenCandidates = new Set();
  const uniqueCandidates = candidateValues.filter((candidate) => {
    if (!candidate || seenCandidates.has(candidate)) {
      return false;
    }
    seenCandidates.add(candidate);
    return true;
  });

  for (const candidate of uniqueCandidates) {
    const parsedSegments = parseExplicitRouteSegments(candidate, x01Rules);
    if (parsedSegments.length) {
      return {
        text: candidate,
        segments: parsedSegments,
      };
    }
  }

  return {
    text: uniqueCandidates[0] || "",
    segments: [],
  };
}

function isCheckoutMarkedSuggestionNode(node) {
  const candidateValues = [
    normalizeRouteTextCandidate(node?.innerText),
    normalizeRouteTextCandidate(node?.textContent),
    ...getSuggestionLeafTextValues(node),
  ];

  return candidateValues.some((candidate) => CHECKOUT_MARKER_PATTERN.test(candidate));
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

function toRouteEntry(node, allNodes, x01Rules) {
  const { text, segments } = resolveSuggestionRouteText(node, x01Rules);
  if (!segments.length) {
    return null;
  }

  return {
    node,
    text,
    rect: node.getBoundingClientRect?.() || null,
    domIndex: getStableNodeIndex(node, allNodes),
    segments,
    isCheckoutMarked: isCheckoutMarkedSuggestionNode(node),
  };
}

function preferCheckoutMarkedEntries(entries) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const checkoutMarkedEntries = normalizedEntries.filter((entry) => entry?.isCheckoutMarked);
  return checkoutMarkedEntries.length ? checkoutMarkedEntries : normalizedEntries;
}

export function collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const allSuggestionNodes = Array.from(documentRef.querySelectorAll(SUGGESTION_SELECTOR));
  const visibleEntries = allSuggestionNodes
    .filter((node) => isElementVisible(node, windowRef))
    .map((node) => toRouteEntry(node, allSuggestionNodes, x01Rules))
    .filter(Boolean)
    .sort(compareSuggestionNodes);

  if (visibleEntries.length) {
    return preferCheckoutMarkedEntries(visibleEntries);
  }

  const styleVisibleEntries = allSuggestionNodes
    .filter((node) => isElementStyleVisible(node, windowRef))
    .map((node) => toRouteEntry(node, allSuggestionNodes, x01Rules))
    .filter(Boolean)
    .sort(compareSuggestionNodes);
  if (styleVisibleEntries.length) {
    return preferCheckoutMarkedEntries(styleVisibleEntries);
  }

  return preferCheckoutMarkedEntries(allSuggestionNodes
    .map((node) => toRouteEntry(node, allSuggestionNodes, x01Rules))
    .filter(Boolean)
    .sort(compareSuggestionNodes));
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

export function getCheckoutFinishSegmentFromRoute(routeSegments, outMode, x01Rules) {
  const normalizedRouteSegments = Array.isArray(routeSegments) ? routeSegments : [];
  const lastSegment = normalizedRouteSegments.length
    ? String(normalizedRouteSegments.at(-1) || "")
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

export function canUseCheckoutFinishSegmentNow(options = {}) {
  const x01Rules = options.x01Rules;
  const outMode = String(options.outMode || "");
  const routeSegments = normalizeRouteSegments(options.routeSegments, x01Rules);
  const finishSegment =
    String(options.finishSegment || "").trim() ||
    getCheckoutFinishSegmentFromRoute(routeSegments, outMode, x01Rules);

  if (!finishSegment) {
    return false;
  }

  const activeScore = Number(options.activeScore);
  if (Number.isFinite(activeScore)) {
    if (typeof x01Rules?.canFinishWithSegment === "function") {
      return x01Rules.canFinishWithSegment(activeScore, finishSegment, outMode);
    }

    const parsedSegment =
      typeof x01Rules?.parseSegment === "function" ? x01Rules.parseSegment(finishSegment) : null;
    if (parsedSegment?.score !== activeScore) {
      return false;
    }

    if (typeof x01Rules?.isOneDartCheckoutSegmentForOutMode === "function") {
      return x01Rules.isOneDartCheckoutSegmentForOutMode(finishSegment, outMode);
    }

    if (typeof x01Rules?.isOneDartCheckoutSegment === "function") {
      return x01Rules.isOneDartCheckoutSegment(finishSegment);
    }

    return false;
  }

  return routeSegments.length === 1;
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

export function mapRouteSegmentsToBoardTargets(routeSegments, x01Rules) {
  const normalizedRouteSegments = Array.isArray(routeSegments) ? routeSegments : [];
  const seen = new Set();
  return normalizedRouteSegments
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

function normalizeDartsRemaining(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 3;
  }

  const normalized = Math.trunc(numeric);
  if (normalized < 0) {
    return 0;
  }
  if (normalized > 3) {
    return 3;
  }
  return normalized;
}

function normalizeRouteSegments(routeSegments, x01Rules) {
  const normalizedRouteSegments = Array.isArray(routeSegments) ? routeSegments : [];
  return normalizedRouteSegments
    .map((segmentName) =>
      typeof x01Rules?.normalizeSegmentName === "function"
        ? x01Rules.normalizeSegmentName(segmentName)
        : String(segmentName || "").trim()
    )
    .filter(Boolean);
}

function validateVisibleCheckoutRoute(routeSegments = [], options = {}) {
  const normalizedRouteSegments = normalizeRouteSegments(routeSegments, options.x01Rules);
  const x01Rules = options.x01Rules;
  const activeScore = Number(options.activeScore);
  const outMode = String(options.outMode || "");
  const dartsRemaining = normalizeDartsRemaining(options.dartsRemaining);

  if (!normalizedRouteSegments.length || !Number.isFinite(activeScore) || dartsRemaining < 1) {
    return null;
  }

  if (typeof x01Rules?.evaluateThrowOutcome !== "function") {
    return null;
  }

  const acceptedSegments = [];
  let remainingScore = activeScore;
  let remainingDarts = dartsRemaining;

  for (const segmentName of normalizedRouteSegments.slice(0, dartsRemaining)) {
    const outcome = x01Rules.evaluateThrowOutcome({
      scoreBefore: remainingScore,
      segmentName,
      outMode,
    });
    if (!outcome || outcome.isBust) {
      return null;
    }

    acceptedSegments.push(segmentName);
    remainingDarts -= 1;

    if (outcome.isFinish) {
      return {
        routeSegments: acceptedSegments.slice(),
        visibleSegmentsUsed: acceptedSegments.length,
        completedWithFallback: false,
      };
    }

    if (remainingDarts < 1) {
      return null;
    }

    if (
      typeof x01Rules.isCheckoutPossibleFromScoreForOutModeWithDarts === "function" &&
      !x01Rules.isCheckoutPossibleFromScoreForOutModeWithDarts(
        outcome.scoreAfter,
        outMode,
        remainingDarts
      )
    ) {
      return null;
    }

    remainingScore = outcome.scoreAfter;
  }

  const fallbackRoute =
    typeof x01Rules?.getPreferredCheckoutRoute === "function"
      ? x01Rules.getPreferredCheckoutRoute(remainingScore, outMode, remainingDarts)
      : [];
  if (!fallbackRoute.length) {
    return null;
  }

  return {
    routeSegments: [...acceptedSegments, ...fallbackRoute],
    visibleSegmentsUsed: acceptedSegments.length,
    completedWithFallback: true,
  };
}

function resolveVisibleSetupSegment(routeSegments = [], options = {}) {
  const normalizedRouteSegments = normalizeRouteSegments(routeSegments, options.x01Rules);
  const firstSegment = normalizedRouteSegments[0] || "";
  const activeScore = Number(options.activeScore);
  const outMode = String(options.outMode || "");
  const x01Rules = options.x01Rules;

  if (
    !firstSegment ||
    !Number.isFinite(activeScore) ||
    typeof x01Rules?.evaluateThrowOutcome !== "function"
  ) {
    return "";
  }

  const outcome = x01Rules.evaluateThrowOutcome({
    scoreBefore: activeScore,
    segmentName: firstSegment,
    outMode,
  });
  if (!outcome || outcome.isBust) {
    return "";
  }

  return firstSegment;
}

export function resolveAuthoritativeCheckoutRoute(options = {}) {
  const routeSegments = normalizeRouteSegments(options.routeSegments, options.x01Rules);
  const activeScore = Number(options.activeScore);
  const outMode = String(options.outMode || "");
  const dartsRemaining = normalizeDartsRemaining(options.dartsRemaining);
  const x01Rules = options.x01Rules;
  const smartCheckoutActive = Number.isFinite(activeScore) && activeScore > 1 && activeScore < 180;

  if (!smartCheckoutActive) {
    return {
      routeSegments: routeSegments.slice(),
      selectionSource: routeSegments.length ? "visible-route" : "none",
      visibleSegmentsUsed: routeSegments.length,
    };
  }

  const validatedVisibleRoute = validateVisibleCheckoutRoute(routeSegments, {
    activeScore,
    outMode,
    dartsRemaining,
    x01Rules,
  });
  if (validatedVisibleRoute) {
    return {
      routeSegments: validatedVisibleRoute.routeSegments.slice(),
      selectionSource: validatedVisibleRoute.completedWithFallback
        ? "validated-visible-route+fallback"
        : "validated-visible-route",
      visibleSegmentsUsed: validatedVisibleRoute.visibleSegmentsUsed,
    };
  }

  const scoreRoute =
    typeof x01Rules?.getPreferredCheckoutRoute === "function"
      ? x01Rules.getPreferredCheckoutRoute(activeScore, outMode, dartsRemaining)
      : [];
  if (scoreRoute.length) {
    return {
      routeSegments: scoreRoute.slice(),
      selectionSource: "score-route",
      visibleSegmentsUsed: 0,
    };
  }

  const visibleSetupSegment = resolveVisibleSetupSegment(routeSegments, {
    activeScore,
    outMode,
    x01Rules,
  });
  if (visibleSetupSegment) {
    return {
      routeSegments: [visibleSetupSegment],
      selectionSource: "visible-setup-segment",
      visibleSegmentsUsed: 1,
    };
  }

  return {
    routeSegments: [],
    selectionSource: routeSegments.length ? "invalid-visible-route" : "none",
    visibleSegmentsUsed: 0,
  };
}

function mapCheckoutSelectionSourceToSurfaceKind(selectionSource) {
  switch (String(selectionSource || "")) {
    case "visible-route":
    case "validated-visible-route":
      return "visible-explicit-checkout";
    case "validated-visible-route+fallback":
      return "visible-prefix+fallback";
    case "score-route":
      return "score-route";
    case "visible-setup-segment":
      return "visible-setup-only";
    default:
      return "none";
  }
}

export function resolveCheckoutSurfaceSemantics(options = {}) {
  const visibleRouteSegments = normalizeRouteSegments(options.routeSegments, options.x01Rules);
  const routeResolution = resolveAuthoritativeCheckoutRoute({
    ...options,
    routeSegments: visibleRouteSegments,
  });
  const authoritativeRouteSegments = normalizeRouteSegments(
    routeResolution?.routeSegments,
    options.x01Rules
  );
  const selectionSource = String(routeResolution?.selectionSource || "none");
  const visibleSegmentsUsed = Number.isFinite(routeResolution?.visibleSegmentsUsed)
    ? Number(routeResolution.visibleSegmentsUsed)
    : 0;
  const authoritativeFinishSegment = getCheckoutFinishSegmentFromRoute(
    authoritativeRouteSegments,
    options.outMode,
    options.x01Rules
  );

  return {
    visibleRouteSegments: visibleRouteSegments.slice(),
    authoritativeRouteSegments: authoritativeRouteSegments.slice(),
    selectionSource,
    visibleSegmentsUsed,
    firstVisibleSegment: getFirstCheckoutRouteSegment(visibleRouteSegments),
    visibleFinishSegment: getCheckoutFinishSegmentFromRoute(
      visibleRouteSegments,
      options.outMode,
      options.x01Rules
    ),
    authoritativeFinishSegment,
    canUseAuthoritativeFinishNow: canUseCheckoutFinishSegmentNow({
      routeSegments: authoritativeRouteSegments,
      finishSegment: authoritativeFinishSegment,
      activeScore: options.activeScore,
      outMode: options.outMode,
      x01Rules: options.x01Rules,
    }),
    singleVisibleSegment: getSingleSuggestionSegmentFromRoute(visibleRouteSegments),
    surfaceKind: mapCheckoutSelectionSourceToSurfaceKind(selectionSource),
  };
}
