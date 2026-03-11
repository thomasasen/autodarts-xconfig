import {
  clearNodeChildren,
  ensureOverlayGroup,
  findBoardSvgGroup,
} from "../../shared/dartboard-svg.js";
import {
  OVERLAY_ID,
  PRESENTATION_CLASS,
  PRESSURE_SUPPRESSED_CLASS,
  SVG_NS,
  TARGET_CLASS,
  TARGET_SLOT_CLASS_PREFIX,
} from "./style.js";
import { buildCricketRenderState as buildCricketRenderStateFromPipeline } from "../cricket-surface/pipeline.js";
import { normalizeCricketPresentationToken } from "../cricket-surface/presentation.js";

const SEGMENT_ORDER = Object.freeze([
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
]);

const RING_RATIOS = Object.freeze({
  outerBullInner: 0.031112,
  outerBullOuter: 0.075556,
  tripleInner: 0.431112,
  tripleOuter: 0.475556,
  doubleInner: 0.711112,
  doubleOuter: 0.755556,
});

const PRESENTATION_KEYS = new Set(["open", "scoring", "pressure", "dead"]);
const BASE_BOARD_TARGETS = Object.freeze([
  ...Array.from({ length: 20 }, (_value, index) => String(index + 1)),
  "BULL",
]);
const SPECIAL_OBJECTIVE_TARGETS = Object.freeze(["DOUBLE", "TRIPLE"]);

function resolvePresentationToken(value) {
  return normalizeCricketPresentationToken(value);
}

function resolveBoardTargets(renderState) {
  const targets = BASE_BOARD_TARGETS.slice();
  const labelSet = new Set(
    Array.isArray(renderState?.targetOrder)
      ? renderState.targetOrder.map((entry) => String(entry || "").trim().toUpperCase())
      : []
  );

  SPECIAL_OBJECTIVE_TARGETS.forEach((label) => {
    if (labelSet.has(label)) {
      targets.push(label);
    }
  });

  return targets;
}

function polar(radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((radius * Math.cos(radians)).toFixed(4)),
    y: Number((radius * Math.sin(radians)).toFixed(4)),
  };
}

function wedgePath(innerRadius, outerRadius, startDeg, endDeg) {
  const p0 = polar(outerRadius, startDeg);
  const p1 = polar(outerRadius, endDeg);
  const p2 = polar(innerRadius, endDeg);
  const p3 = polar(innerRadius, startDeg);
  const largeArc = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function ringPath(innerRadius, outerRadius) {
  const outer = [
    `M 0 ${-outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 0 ${outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 0 ${-outerRadius}`,
    "Z",
  ].join(" ");
  const inner = [
    `M 0 ${-innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 0 ${innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 0 ${-innerRadius}`,
    "Z",
  ].join(" ");
  return `${outer} ${inner}`;
}

function segmentAngles(value) {
  const index = SEGMENT_ORDER.indexOf(Number(value));
  if (index < 0) {
    return null;
  }
  const center = index * 18;
  return {
    start: center - 9,
    end: center + 9,
  };
}

function createWedge(ownerDocument, radius, innerRatio, outerRatio, angles, edgePaddingPx) {
  const path = ownerDocument.createElementNS(SVG_NS, "path");
  const innerRadius = Math.max(0, radius * innerRatio);
  const outerRadius = Math.max(innerRadius + 0.5, radius * outerRatio + edgePaddingPx);
  path.setAttribute("d", wedgePath(innerRadius, outerRadius, angles.start, angles.end));
  return path;
}

function createBull(ownerDocument, radius, innerRatio, outerRatio, solid, edgePaddingPx) {
  if (solid) {
    const circle = ownerDocument.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", String(Math.max(0, radius * outerRatio + edgePaddingPx)));
    return circle;
  }

  const innerRadius = Math.max(0, radius * innerRatio);
  const outerRadius = Math.max(innerRadius + 0.5, radius * outerRatio + edgePaddingPx);
  const ring = ownerDocument.createElementNS(SVG_NS, "path");
  ring.setAttribute("d", ringPath(innerRadius, outerRadius));
  ring.setAttribute("fill-rule", "evenodd");
  return ring;
}

function buildShapesForLabel(ownerDocument, radius, targetLabel, visualConfig) {
  if (!ownerDocument || !radius) {
    return [];
  }

  const normalizedLabel = String(targetLabel || "").trim().toUpperCase();

  if (normalizedLabel === "BULL") {
    const outerBullRing = createBull(
      ownerDocument,
      radius,
      RING_RATIOS.outerBullInner,
      RING_RATIOS.outerBullOuter,
      false,
      visualConfig.edgePaddingPx
    );
    outerBullRing.dataset.targetSlot = "bull-outer-ring";

    const innerBullCore = createBull(
      ownerDocument,
      radius,
      0,
      RING_RATIOS.outerBullInner,
      true,
      visualConfig.edgePaddingPx
    );
    innerBullCore.dataset.targetSlot = "bull-core";

    return [outerBullRing, innerBullCore];
  }

  if (normalizedLabel === "DOUBLE" || normalizedLabel === "TRIPLE") {
    const innerRatio =
      normalizedLabel === "DOUBLE" ? RING_RATIOS.doubleInner : RING_RATIOS.tripleInner;
    const outerRatio =
      normalizedLabel === "DOUBLE" ? RING_RATIOS.doubleOuter : RING_RATIOS.tripleOuter;
    const slotName = normalizedLabel === "DOUBLE" ? "double-ring" : "triple-ring";
    const rings = [];

    SEGMENT_ORDER.forEach((segmentValue) => {
      const angles = segmentAngles(segmentValue);
      if (!angles) {
        return;
      }
      const ring = createWedge(
        ownerDocument,
        radius,
        innerRatio,
        outerRatio,
        angles,
        visualConfig.edgePaddingPx
      );
      ring.dataset.targetSlot = slotName;
      rings.push(ring);
    });

    return rings;
  }

  const numericLabel = Number.parseInt(normalizedLabel, 10);
  if (!(numericLabel >= 1 && numericLabel <= 20)) {
    return [];
  }

  const angles = segmentAngles(numericLabel);
  if (!angles) {
    return [];
  }

  const singleInner = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.outerBullOuter,
    RING_RATIOS.tripleInner,
    angles,
    visualConfig.edgePaddingPx
  );
  singleInner.dataset.targetSlot = "single-inner";

  const tripleRing = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.tripleInner,
    RING_RATIOS.tripleOuter,
    angles,
    visualConfig.edgePaddingPx
  );
  tripleRing.dataset.targetSlot = "triple-ring";

  const singleOuter = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.tripleOuter,
    RING_RATIOS.doubleInner,
    angles,
    visualConfig.edgePaddingPx
  );
  singleOuter.dataset.targetSlot = "single-outer";

  const doubleRing = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.doubleInner,
    RING_RATIOS.doubleOuter,
    angles,
    visualConfig.edgePaddingPx
  );
  doubleRing.dataset.targetSlot = "double-ring";

  return [singleInner, tripleRing, singleOuter, doubleRing];
}

function setStyleVar(node, name, value) {
  if (!node?.style || typeof node.style.setProperty !== "function") {
    return;
  }
  node.style.setProperty(name, String(value ?? ""));
}

function clampAlpha(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Math.max(0, Math.min(1, Number(fallback) || 0));
  }
  return Math.max(0, Math.min(1, numeric));
}

function rgbaColor(color, alpha) {
  const r = Number.isFinite(color?.r) ? Math.round(color.r) : 0;
  const g = Number.isFinite(color?.g) ? Math.round(color.g) : 0;
  const b = Number.isFinite(color?.b) ? Math.round(color.b) : 0;
  return `rgba(${r}, ${g}, ${b}, ${clampAlpha(alpha)})`;
}

function applyOverlayStyleVars(overlay, visualConfig, radius) {
  if (!overlay || !visualConfig) {
    return;
  }

  const theme = visualConfig.theme || {};
  const intensity = visualConfig.intensity || {};
  const baseColor = visualConfig.baseColor || { r: 90, g: 90, b: 90 };
  const mutedColor = visualConfig.mutedColor || { r: 33, g: 33, b: 33 };
  const deadColor = visualConfig.deadColor || { r: 112, g: 118, b: 128 };
  const showOpenObjectives = visualConfig.showOpenObjectives === true;
  const highlightOpacity = clampAlpha(intensity.highlightOpacity, 0.45);
  const strokeBoost = clampAlpha(intensity.strokeBoost, 0.2);
  const openOpacity = showOpenObjectives ? clampAlpha(intensity.open, 0.3) : 0;

  setStyleVar(overlay, "--ad-ext-cricket-open-fill", rgbaColor(baseColor, openOpacity));
  setStyleVar(
    overlay,
    "--ad-ext-cricket-open-stroke",
    rgbaColor(baseColor, showOpenObjectives ? Math.min(1, openOpacity + 0.12) : 0)
  );
  setStyleVar(overlay, "--ad-ext-cricket-open-opacity", showOpenObjectives ? "1" : "0");

  const deadAlpha = Math.max(0.2, clampAlpha(intensity.dead, 0.98) * 0.42);
  const inactiveAlpha = Math.max(0.16, clampAlpha(intensity.inactive, 0.8) * 0.44);
  const mutedStrokeAlpha = Math.max(0.18, Math.min(1, deadAlpha + 0.14));

  setStyleVar(
    overlay,
    "--ad-ext-cricket-dead-fill",
    rgbaColor(deadColor, deadAlpha)
  );
  setStyleVar(overlay, "--ad-ext-cricket-dead-stroke", rgbaColor(deadColor, mutedStrokeAlpha));
  setStyleVar(overlay, "--ad-ext-cricket-dead-opacity", "1");

  setStyleVar(
    overlay,
    "--ad-ext-cricket-inactive-fill",
    rgbaColor(mutedColor, inactiveAlpha)
  );
  setStyleVar(
    overlay,
    "--ad-ext-cricket-inactive-stroke",
    rgbaColor(mutedColor, Math.max(0.14, Math.min(1, inactiveAlpha + 0.1)))
  );
  setStyleVar(overlay, "--ad-ext-cricket-inactive-opacity", "1");

  setStyleVar(
    overlay,
    "--ad-ext-cricket-scoring-fill",
    rgbaColor(theme.scoring, highlightOpacity)
  );
  setStyleVar(
    overlay,
    "--ad-ext-cricket-scoring-stroke",
    rgbaColor(theme.scoring, Math.min(1, highlightOpacity + strokeBoost))
  );
  setStyleVar(overlay, "--ad-ext-cricket-scoring-opacity", "1");

  const subtlePressureFill = Math.max(0.12, highlightOpacity * 0.38);
  const subtlePressureStroke = Math.max(0.34, Math.min(1, highlightOpacity + strokeBoost * 0.74));

  setStyleVar(
    overlay,
    "--ad-ext-cricket-pressure-fill",
    rgbaColor(theme.pressure, subtlePressureFill)
  );
  setStyleVar(
    overlay,
    "--ad-ext-cricket-pressure-stroke",
    rgbaColor(theme.pressure, subtlePressureStroke)
  );
  setStyleVar(overlay, "--ad-ext-cricket-pressure-opacity", "1");

  const strokeWidth = `${Math.max(1, Number(radius) * Number(visualConfig.strokeWidthRatio || 0.006))}px`;
  setStyleVar(overlay, "--ad-ext-cricket-stroke-width", strokeWidth);
}

function ensureStripedPattern(overlay, options = {}) {
  const ownerDocument = overlay?.ownerDocument;
  const svgRoot = overlay?.ownerSVGElement;
  if (!ownerDocument || !svgRoot) {
    return "";
  }

  let defs = svgRoot.querySelector("defs");
  if (!defs) {
    defs = ownerDocument.createElementNS(SVG_NS, "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild || null);
  }

  const patternId = String(options.patternId || "").trim();
  if (!patternId) {
    return "";
  }
  let pattern = defs.querySelector(`#${patternId}`);
  if (!pattern) {
    pattern = ownerDocument.createElementNS(SVG_NS, "pattern");
    pattern.setAttribute("id", patternId);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "8");
    pattern.setAttribute("height", "8");
    pattern.setAttribute("patternTransform", "rotate(135)");
    defs.appendChild(pattern);
  }

  while (pattern.firstChild) {
    pattern.removeChild(pattern.firstChild);
  }

  const baseColor = options.color || { r: 0, g: 0, b: 0 };
  const baseAlpha = clampAlpha(options.baseAlpha, 0.6);
  const stripeAlpha = clampAlpha(options.stripeAlpha, 0.3);
  const baseRect = ownerDocument.createElementNS(SVG_NS, "rect");
  baseRect.setAttribute("width", "8");
  baseRect.setAttribute("height", "8");
  baseRect.setAttribute("fill", rgbaColor(baseColor, baseAlpha));
  pattern.appendChild(baseRect);

  const stripe = ownerDocument.createElementNS(SVG_NS, "path");
  stripe.setAttribute("d", "M0 0 H8 V4 H0 Z");
  stripe.setAttribute("fill", rgbaColor(baseColor, stripeAlpha));
  pattern.appendChild(stripe);

  return `url(#${patternId})`;
}

function ensurePresentationPatterns(overlay, visualConfig) {
  const scoringColor = visualConfig?.theme?.scoring || { r: 0, g: 178, b: 135 };
  const pressureColor = visualConfig?.theme?.pressure || { r: 239, g: 68, b: 68 };
  const mutedColor = visualConfig?.mutedColor || { r: 33, g: 33, b: 33 };
  const deadColor = visualConfig?.deadColor || { r: 112, g: 118, b: 128 };
  return {
    scoring: ensureStripedPattern(overlay, {
      patternId: "ad-ext-cricket-scoring-pattern",
      color: scoringColor,
      baseAlpha: 0.72,
      stripeAlpha: 0.32,
    }),
    pressure: ensureStripedPattern(overlay, {
      patternId: "ad-ext-cricket-pressure-pattern",
      color: pressureColor,
      baseAlpha: 0.64,
      stripeAlpha: 0.28,
    }),
    dead: ensureStripedPattern(overlay, {
      patternId: "ad-ext-cricket-dead-pattern",
      color: deadColor,
      baseAlpha: 0.46,
      stripeAlpha: 0.22,
    }),
    inactive: ensureStripedPattern(overlay, {
      patternId: "ad-ext-cricket-inactive-pattern",
      color: mutedColor,
      baseAlpha: 0.3,
      stripeAlpha: 0.12,
    }),
  };
}

function applyShapeStyle(shape, presentation, targetLabel) {
  if (!shape || !shape.classList || !shape.style) {
    return;
  }
  const normalizedPresentation = resolvePresentationToken(presentation);
  const presentationClass = PRESENTATION_CLASS[normalizedPresentation] || PRESENTATION_CLASS.open;
  Object.values(PRESENTATION_CLASS).forEach((className) => {
    shape.classList.remove(className);
  });
  shape.classList.remove(PRESSURE_SUPPRESSED_CLASS);
  shape.classList.add(TARGET_CLASS, presentationClass);

  const targetSlot = String(shape?.dataset?.targetSlot || "").trim().toLowerCase();
  if (targetSlot) {
    shape.classList.add(`${TARGET_SLOT_CLASS_PREFIX}${targetSlot}`);
  }

  if (normalizedPresentation === "scoring" && String(shape.dataset?.patternScoring || "")) {
    shape.style.fill = String(shape.dataset.patternScoring);
  } else if (
    normalizedPresentation === "pressure" &&
    String(shape.dataset?.patternPressure || "")
  ) {
    shape.style.fill = String(shape.dataset.patternPressure);
  } else if (normalizedPresentation === "dead" && String(shape.dataset?.patternDead || "")) {
    shape.style.fill = String(shape.dataset.patternDead);
  } else if (
    normalizedPresentation === "inactive" &&
    String(shape.dataset?.patternInactive || "")
  ) {
    shape.style.fill = String(shape.dataset.patternInactive);
  } else {
    shape.style.removeProperty("fill");
  }

  if (shape.dataset) {
    shape.dataset.targetLabel = String(targetLabel || "");
    shape.dataset.targetPresentation = normalizedPresentation;
  }
}

function resolvePresentationForStateEntry(stateEntry, isRelevantTarget) {
  if (!isRelevantTarget) {
    return "inactive";
  }
  // Board colors are always derived from active-player board perspective.
  return resolvePresentationToken(stateEntry?.boardPresentation || stateEntry?.presentation || "open");
}

function ensureOverlayShapeCache(overlay, board, visualConfig, boardTargets, cache = null) {
  if (!overlay || !board?.radius) {
    return null;
  }

  const geometryKey = [
    Number(board.radius).toFixed(2),
    Number(visualConfig?.edgePaddingPx || 0).toFixed(2),
    Array.isArray(boardTargets) ? boardTargets.join(",") : "",
  ].join("|");

  const cacheContainer = cache && typeof cache === "object" ? cache : null;
  const cachedShapeState = cacheContainer?.overlayShapeState || null;
  const canReuse =
    cachedShapeState &&
    cachedShapeState.overlay === overlay &&
    cachedShapeState.geometryKey === geometryKey;

  if (canReuse) {
    return cachedShapeState;
  }

  clearNodeChildren(overlay);
  const shapesByTarget = new Map();
  (Array.isArray(boardTargets) ? boardTargets : BASE_BOARD_TARGETS).forEach((targetLabel) => {
    const shapes = buildShapesForLabel(overlay.ownerDocument, board.radius, targetLabel, visualConfig);
    shapes.forEach((shape) => overlay.appendChild(shape));
    shapesByTarget.set(targetLabel, shapes);
  });

  const nextState = {
    overlay,
    geometryKey,
    shapesByTarget,
  };

  if (cacheContainer) {
    cacheContainer.overlayShapeState = nextState;
  }
  return nextState;
}

function resolveBoardSnapshot(documentRef, cache = null) {
  const cachedBoard = cache?.board;
  const board =
    cachedBoard?.group && cachedBoard.group.isConnected !== false
      ? cachedBoard
      : findBoardSvgGroup(documentRef);
  if (cache && typeof cache === "object") {
    cache.board = board;
  }
  return board;
}

export function buildCricketRenderState(options = {}) {
  return buildCricketRenderStateFromPipeline(options);
}

export function renderCricketHighlights(options = {}) {
  const documentRef = options.documentRef;
  const visualConfig = options.visualConfig;
  const renderState = options.renderState;

  if (!documentRef || !visualConfig || !renderState || !(renderState.stateMap instanceof Map)) {
    return false;
  }

  const debugStats = options.debugStats && typeof options.debugStats === "object"
    ? options.debugStats
    : null;

  const board = resolveBoardSnapshot(documentRef, options.cache);
  if (!board?.group || !board.radius) {
    if (debugStats) {
      debugStats.renderedShapeCount = 0;
      debugStats.highlightedTargetCount = 0;
      debugStats.nonOpenTargetCount = 0;
      debugStats.openTargetCount = 0;
      debugStats.renderedOpenTargetCount = 0;
      debugStats.inactiveTargetCount = 0;
      debugStats.shapeCountByTarget = {};
      debugStats.shapeCountByPresentation = {};
    }
    return false;
  }

  const overlay = ensureOverlayGroup(board.group, OVERLAY_ID, SVG_NS);
  if (!overlay) {
    return false;
  }

  applyOverlayStyleVars(overlay, visualConfig, board.radius);
  const boardTargets = resolveBoardTargets(renderState);
  const patterns = ensurePresentationPatterns(overlay, visualConfig);
  const overlayShapeState = ensureOverlayShapeCache(
    overlay,
    board,
    visualConfig,
    boardTargets,
    options.cache
  );

  if (!overlayShapeState?.shapesByTarget) {
    return false;
  }

  const activeTargetSet = new Set(
    Array.isArray(renderState.targetOrder) && renderState.targetOrder.length
      ? renderState.targetOrder
      : Array.from(renderState.stateMap.keys())
  );

  let renderedShapeCount = 0;
  let highlightedTargetCount = 0;
  let nonOpenTargetCount = 0;
  let openTargetCount = 0;
  let renderedOpenTargetCount = 0;
  let inactiveTargetCount = 0;
  const shapeCountByTarget = {};
  const shapeCountByPresentation = {};

  boardTargets.forEach((targetLabel) => {
    const isRelevantTarget = activeTargetSet.has(targetLabel);
    const stateEntry = renderState.stateMap.get(targetLabel) || null;
    const presentation = resolvePresentationForStateEntry(stateEntry, isRelevantTarget);

    if (!PRESENTATION_KEYS.has(presentation) && presentation !== "inactive") {
      return;
    }

    if (!isRelevantTarget) {
      inactiveTargetCount += 1;
    } else if (presentation !== "open") {
      nonOpenTargetCount += 1;
    } else {
      openTargetCount += 1;
    }

    const highlightActive = Boolean(stateEntry?.isHighlightActive);
    const shouldRenderTarget = !(
      (isRelevantTarget && presentation === "open" && visualConfig.showOpenObjectives === false) ||
      (isRelevantTarget && presentation === "dead" && !visualConfig.showDeadObjectives) ||
      (isRelevantTarget && presentation !== "dead" && !highlightActive)
    );

    const shapes = overlayShapeState.shapesByTarget.get(targetLabel) || [];
    shapeCountByTarget[targetLabel] = (shapeCountByTarget[targetLabel] || 0) + shapes.length;

    if (shouldRenderTarget) {
      shapeCountByPresentation[presentation] =
        (shapeCountByPresentation[presentation] || 0) + shapes.length;
    }

    shapes.forEach((shape) => {
      if (shape?.dataset) {
        shape.dataset.patternScoring = patterns.scoring;
        shape.dataset.patternPressure = patterns.pressure;
        shape.dataset.patternDead = patterns.dead;
        shape.dataset.patternInactive = patterns.inactive;
      }
      applyShapeStyle(shape, presentation, targetLabel);
      shape.style.display = shouldRenderTarget ? "" : "none";
      if (shouldRenderTarget) {
        renderedShapeCount += 1;
      }
    });

    if (shouldRenderTarget && shapes.length > 0) {
      highlightedTargetCount += 1;
      if (isRelevantTarget && presentation === "open") {
        renderedOpenTargetCount += 1;
      }
    }
  });

  if (debugStats) {
    debugStats.renderedShapeCount = renderedShapeCount;
    debugStats.highlightedTargetCount = highlightedTargetCount;
    debugStats.nonOpenTargetCount = nonOpenTargetCount;
    debugStats.openTargetCount = openTargetCount;
    debugStats.renderedOpenTargetCount = renderedOpenTargetCount;
    debugStats.inactiveTargetCount = inactiveTargetCount;
    debugStats.shapeCountByTarget = shapeCountByTarget;
    debugStats.shapeCountByPresentation = shapeCountByPresentation;
  }

  return true;
}

export function clearCricketHighlights(documentRef) {
  const board = findBoardSvgGroup(documentRef);
  if (!board?.group) {
    return;
  }
  const overlay = board.group.querySelector?.(`#${OVERLAY_ID}`);
  if (overlay) {
    clearNodeChildren(overlay);
    if (overlay.parentNode && typeof overlay.parentNode.removeChild === "function") {
      overlay.parentNode.removeChild(overlay);
    }
  }
}
