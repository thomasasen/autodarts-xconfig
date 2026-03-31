import {
  EFFECT_CLASSES,
  OUTLINE_CLASS,
  OVERLAY_ID,
  SVG_NS,
  TARGET_CLASS,
  TARGET_FAMILY_ATTRIBUTE,
} from "./style.js";

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

function createWedge(ownerDocument, radius, innerRatio, outerRatio, startDeg, endDeg, edgePaddingPx) {
  const path = ownerDocument.createElementNS(SVG_NS, "path");
  const innerRadius = Math.max(0, radius * innerRatio);
  const outerRadius = Math.max(innerRadius + 0.5, radius * outerRatio + (edgePaddingPx || 0));
  path.setAttribute("d", wedgePath(innerRadius, outerRadius, startDeg, endDeg));
  return path;
}

function createBull(ownerDocument, radius, innerRatio, outerRatio, solid, options = {}) {
  const edgePaddingPx = options.edgePaddingPx || 0;
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
  if (options.noStroke) {
    ring.dataset.noStroke = "true";
  }
  return ring;
}

function getBoardRadius(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }

  return Array.from(rootNode.querySelectorAll("circle")).reduce((max, circle) => {
    const radius = Number.parseFloat(circle?.getAttribute?.("r"));
    return Number.isFinite(radius) && radius > max ? radius : max;
  }, 0);
}

export function findBoard(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const svgNodes = Array.from(documentRef.querySelectorAll("svg"));
  if (!svgNodes.length) {
    return null;
  }

  let bestSvg = null;
  let bestScore = -1;

  svgNodes.forEach((svgNode) => {
    const numberCount = new Set(
      Array.from(svgNode.querySelectorAll("text"))
        .map((node) => Number.parseInt(node?.textContent || "", 10))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 20)
    ).size;
    const radius = getBoardRadius(svgNode);
    const score = numberCount * 1000 + radius;
    if (score > bestScore) {
      bestSvg = svgNode;
      bestScore = score;
    }
  });

  if (!bestSvg) {
    return null;
  }

  let bestGroup = null;
  let bestRadius = 0;
  Array.from(bestSvg.querySelectorAll("g")).forEach((group) => {
    const groupRadius = getBoardRadius(group);
    if (groupRadius > bestRadius) {
      bestRadius = groupRadius;
      bestGroup = group;
    }
  });

  const radius = bestRadius || getBoardRadius(bestSvg);
  if (!radius) {
    return null;
  }

  return {
    svg: bestSvg,
    group: bestGroup || bestSvg,
    radius,
  };
}

export function ensureOverlay(boardGroup) {
  if (!boardGroup || typeof boardGroup.querySelector !== "function") {
    return null;
  }

  let overlay = boardGroup.querySelector(`#${OVERLAY_ID}`);
  if (overlay) {
    return overlay;
  }

  const ownerDocument = boardGroup.ownerDocument;
  if (!ownerDocument || typeof ownerDocument.createElementNS !== "function") {
    return null;
  }

  overlay = ownerDocument.createElementNS(SVG_NS, "g");
  overlay.id = OVERLAY_ID;
  if (typeof boardGroup.appendChild === "function") {
    boardGroup.appendChild(overlay);
  }
  return overlay;
}

export function clearOverlay(overlay) {
  if (!overlay || typeof overlay.firstChild === "undefined") {
    return;
  }

  while (overlay.firstChild) {
    overlay.removeChild(overlay.firstChild);
  }
}

function buildRenderableNodeKey(node) {
  if (!node || typeof node.getAttribute !== "function") {
    return "";
  }

  const className = String(node.getAttribute("class") || "");
  const role = className.includes(OUTLINE_CLASS) ? "outline" : "shape";
  return [
    role,
    String(node.tagName || ""),
    String(node.getAttribute("data-target-ring") || ""),
    String(node.getAttribute("data-target-value") || ""),
    String(node.getAttribute("d") || ""),
    String(node.getAttribute("r") || ""),
    String(node.getAttribute("fill-rule") || ""),
  ].join("|");
}

function syncRenderableNode(targetNode, sourceNode) {
  if (
    !targetNode ||
    !sourceNode ||
    typeof targetNode.setAttribute !== "function" ||
    typeof sourceNode.getAttribute !== "function"
  ) {
    return targetNode;
  }

  const staleAttributeNames = new Set(
    Array.from(targetNode.attributes || []).map((attribute) => attribute.name)
  );
  staleAttributeNames.delete("class");
  staleAttributeNames.delete("style");

  const sourceClassName = String(sourceNode.getAttribute("class") || "").trim();
  if (sourceClassName) {
    targetNode.setAttribute("class", sourceClassName);
  } else {
    try {
      targetNode.removeAttribute("class");
    } catch (_) {
      // Ignore environments that expose className without removeAttribute support.
    }
  }

  Array.from(sourceNode.attributes || []).forEach((attribute) => {
    targetNode.setAttribute(attribute.name, attribute.value);
    staleAttributeNames.delete(attribute.name);
  });

  staleAttributeNames.forEach((attributeName) => {
    try {
      targetNode.removeAttribute(attributeName);
    } catch (_) {
      // Keep sync fail-soft in restrictive SVG shims.
    }
  });

  if (targetNode.style && sourceNode.style) {
    const sourceStyleEntries =
      sourceNode.style._values instanceof Map
        ? Array.from(sourceNode.style._values.entries())
        : Array.from({ length: Number(sourceNode.style.length) || 0 }, (_, index) => {
            const propertyName =
              typeof sourceNode.style.item === "function"
                ? sourceNode.style.item(index)
                : sourceNode.style[index];
            return [propertyName, sourceNode.style.getPropertyValue(propertyName)];
          }).filter(([propertyName]) => Boolean(propertyName));
    const staleStyleNames =
      targetNode.style._values instanceof Map
        ? new Set(Array.from(targetNode.style._values.keys()))
        : new Set(
            Array.from({ length: Number(targetNode.style.length) || 0 }, (_, index) =>
              typeof targetNode.style.item === "function"
                ? targetNode.style.item(index)
                : targetNode.style[index]
            ).filter(Boolean)
          );

    sourceStyleEntries.forEach(([propertyName, propertyValue]) => {
      targetNode.style.setProperty(propertyName, propertyValue);
      staleStyleNames.delete(propertyName);
    });

    staleStyleNames.forEach((propertyName) => {
      targetNode.style.removeProperty(propertyName);
    });
  }

  return targetNode;
}

function resolveTargetFamily(target) {
  if (target?.ring === "D" || target?.ring === "T") {
    return "outer";
  }
  if (target?.ring === "DB" || target?.ring === "SB") {
    return "bull";
  }
  return "single";
}

function clampToRange(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scaleToward(value, neutralValue, emphasis) {
  return neutralValue + (value - neutralValue) * emphasis;
}

function resolvePriorityProfile(visualConfig, targetIndex, targetCount) {
  const priorityProfiles = Array.isArray(visualConfig.routePriorityProfiles)
    ? visualConfig.routePriorityProfiles
    : [];
  const fallbackProfile = priorityProfiles[priorityProfiles.length - 1] || {
    opacityEmphasis: 1,
    motionEmphasis: 1,
    outlineEmphasis: 1,
    animationDelayMs: 0,
  };

  if (!targetCount || targetCount <= 1) {
    return priorityProfiles[0] || fallbackProfile;
  }
  return priorityProfiles[targetIndex] || fallbackProfile;
}

function resolveTargetStyleProfile(target, radius, visualConfig, renderContext = {}) {
  const baseStrokeWidth = Math.max(1, radius * visualConfig.strokeWidthRatio);
  const baseOutlineWidth = baseStrokeWidth + 1.5;
  const family = resolveTargetFamily(target);
  const effectProfiles = visualConfig.effectProfiles?.[visualConfig.effect] || {};
  const baseEffectProfile = effectProfiles.base || {};
  const familyEffectProfile =
    family === "outer"
      ? effectProfiles.outer || baseEffectProfile
      : family === "bull"
        ? effectProfiles.bull || baseEffectProfile
        : baseEffectProfile;
  const priorityProfile =
    renderContext.priorityProfile ||
    resolvePriorityProfile(
      visualConfig,
      Number(renderContext.targetIndex) || 0,
      Number(renderContext.targetCount) || 0
    );
  const opacityEmphasis = clampToRange(Number(priorityProfile.opacityEmphasis || 1), 0, 1);
  const motionEmphasis = clampToRange(Number(priorityProfile.motionEmphasis || 1), 0, 1);
  const outlineEmphasis = clampToRange(Number(priorityProfile.outlineEmphasis || 1), 0, 1);
  const strokeWidthBoostPx = Number(familyEffectProfile.strokeWidthBoostPx || 0);
  const outlineWidthBoostPx = Number(familyEffectProfile.outlineWidthBoostPx || 0);
  const resolvedStrokeWidth = scaleToward(
    baseStrokeWidth + strokeWidthBoostPx,
    baseStrokeWidth,
    outlineEmphasis
  );
  const resolvedOutlineWidth = scaleToward(
    baseOutlineWidth + outlineWidthBoostPx,
    baseOutlineWidth,
    outlineEmphasis
  );
  const resolvedOutlineBaseOpacity = scaleToward(
    Math.max(
      Number(visualConfig.outlineIntensity.baseOpacity || 0),
      Number(familyEffectProfile.outlineBaseOpacityFloor || 0)
    ),
    0.3,
    outlineEmphasis
  );
  const resolvedOutlinePulseMinOpacity = scaleToward(
    Math.max(
      Number(visualConfig.outlineIntensity.pulseMinOpacity || 0),
      Number(familyEffectProfile.outlinePulseMinOpacityFloor || 0)
    ),
    0.2,
    outlineEmphasis
  );
  const resolvedOutlinePulseMaxOpacity = scaleToward(
    Math.max(
      Number(visualConfig.outlineIntensity.pulseMaxOpacity || 0),
      Number(familyEffectProfile.outlinePulseMaxOpacityFloor || 0)
    ),
    0.78,
    outlineEmphasis
  );

  return {
    family,
    strokeWidthPx: resolvedStrokeWidth,
    outlineWidthPx: resolvedOutlineWidth,
    pulseMinOpacity: clampToRange(
      scaleToward(Number(familyEffectProfile.minOpacity || baseEffectProfile.minOpacity || 0.25), 0.18, opacityEmphasis),
      0,
      1
    ),
    pulseMaxOpacity: clampToRange(
      scaleToward(Number(familyEffectProfile.maxOpacity || baseEffectProfile.maxOpacity || 1), 0.74, opacityEmphasis),
      0,
      1
    ),
    pulseMinScale: scaleToward(
      Number(familyEffectProfile.minScale || baseEffectProfile.minScale || 1),
      1,
      motionEmphasis
    ),
    pulseMaxScale: scaleToward(
      Number(familyEffectProfile.maxScale || baseEffectProfile.maxScale || 1),
      1,
      motionEmphasis
    ),
    filter: String(familyEffectProfile.filter || baseEffectProfile.filter || "none"),
    glowFilterMin: String(
      familyEffectProfile.filterMin || baseEffectProfile.filterMin || familyEffectProfile.filter || baseEffectProfile.filter || "none"
    ),
    glowFilterMax: String(
      familyEffectProfile.filterMax || baseEffectProfile.filterMax || familyEffectProfile.filter || baseEffectProfile.filter || "none"
    ),
    blinkFilterMin: String(
      familyEffectProfile.filterMin || baseEffectProfile.filterMin || "none"
    ),
    blinkFilterMax: String(
      familyEffectProfile.filterMax || baseEffectProfile.filterMax || familyEffectProfile.filter || baseEffectProfile.filter || "none"
    ),
    outlineBaseOpacity: clampToRange(resolvedOutlineBaseOpacity, 0, 1),
    outlinePulseMinOpacity: clampToRange(resolvedOutlinePulseMinOpacity, 0, 1),
    outlinePulseMaxOpacity: clampToRange(resolvedOutlinePulseMaxOpacity, 0, 1),
    outlineWidthDownPx: scaleToward(
      Math.max(
        Number(visualConfig.outlineIntensity.widthDownPx || 0),
        Number(familyEffectProfile.outlineWidthDownPxFloor || 0)
      ),
      0.5,
      outlineEmphasis
    ),
    outlineWidthUpPx: scaleToward(
      Math.max(
        Number(visualConfig.outlineIntensity.widthUpPx || 0),
        Number(familyEffectProfile.outlineWidthUpPxFloor || 0)
      ),
      1,
      outlineEmphasis
    ),
    animationDelayMs: Number(priorityProfile.animationDelayMs || 0),
  };
}

function applyTargetMetadata(shapeNode, target, styleProfile) {
  if (!shapeNode || typeof shapeNode.setAttribute !== "function") {
    return;
  }

  shapeNode.setAttribute(TARGET_FAMILY_ATTRIBUTE, String(styleProfile.family || "single"));
  shapeNode.setAttribute("data-target-ring", String(target?.ring || ""));
  if (Number.isFinite(target?.value)) {
    shapeNode.setAttribute("data-target-value", String(target.value));
  }
}

function applyShapeStyle(shapeNode, visualConfig, styleProfile) {
  if (!shapeNode || !shapeNode.classList || !shapeNode.style) {
    return;
  }

  shapeNode.classList.add(TARGET_CLASS, EFFECT_CLASSES[visualConfig.effect] || EFFECT_CLASSES.focus);
  const strokeWidth = styleProfile.strokeWidthPx;

  shapeNode.style.setProperty("--ad-ext-target-color", visualConfig.theme.color);
  shapeNode.style.setProperty("--ad-ext-target-stroke", visualConfig.theme.strokeColor);
  shapeNode.style.setProperty("--ad-ext-target-stroke-width", `${strokeWidth}px`);
  shapeNode.style.setProperty("--ad-ext-target-outline-width", `${styleProfile.outlineWidthPx}px`);
  shapeNode.style.setProperty("--ad-ext-target-duration", `${visualConfig.animationMs}ms`);
  shapeNode.style.setProperty(
    "--ad-ext-target-animation-delay",
    `${styleProfile.animationDelayMs}ms`
  );
  shapeNode.style.setProperty("--ad-ext-target-filter", styleProfile.filter);
  shapeNode.style.setProperty("--ad-ext-target-glow-filter-min", styleProfile.glowFilterMin);
  shapeNode.style.setProperty("--ad-ext-target-glow-filter-max", styleProfile.glowFilterMax);
  shapeNode.style.setProperty("--ad-ext-target-blink-filter-min", styleProfile.blinkFilterMin);
  shapeNode.style.setProperty("--ad-ext-target-blink-filter-max", styleProfile.blinkFilterMax);
  shapeNode.style.setProperty(
    "--ad-ext-target-pulse-min-opacity",
    String(styleProfile.pulseMinOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-pulse-max-opacity",
    String(styleProfile.pulseMaxOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-pulse-min-scale",
    String(styleProfile.pulseMinScale)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-pulse-max-scale",
    String(styleProfile.pulseMaxScale)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-stroke-alpha",
    String(visualConfig.outlineIntensity.strokeAlpha)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-base-opacity",
    String(styleProfile.outlineBaseOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-pulse-min-opacity",
    String(styleProfile.outlinePulseMinOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-pulse-max-opacity",
    String(styleProfile.outlinePulseMaxOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-width-down-px",
    `${styleProfile.outlineWidthDownPx}px`
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-width-up-px",
    `${styleProfile.outlineWidthUpPx}px`
  );
  if (
    visualConfig.renderShapeStroke === false ||
    (shapeNode.dataset && shapeNode.dataset.noStroke === "true")
  ) {
    shapeNode.style.setProperty("stroke", "none");
    shapeNode.style.setProperty("stroke-width", "0");
  }
}

function cloneShapeAsOutline(shapeNode, ownerDocument) {
  const outline = ownerDocument.createElementNS(SVG_NS, shapeNode.tagName);
  Array.from(shapeNode.attributes || []).forEach((attribute) => {
    if (attribute.name === "class" || attribute.name === "style") {
      return;
    }
    outline.setAttribute(attribute.name, attribute.value);
  });
  return outline;
}

function applyOutlineStyle(outlineNode, visualConfig, styleProfile) {
  if (!outlineNode || !outlineNode.classList || !outlineNode.style) {
    return;
  }

  outlineNode.classList.add(OUTLINE_CLASS);
  outlineNode.style.setProperty("--ad-ext-target-outline-width", `${styleProfile.outlineWidthPx}px`);
  outlineNode.style.setProperty("--ad-ext-target-duration", `${visualConfig.animationMs}ms`);
  outlineNode.style.setProperty(
    "--ad-ext-target-animation-delay",
    `${styleProfile.animationDelayMs}ms`
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-stroke-alpha",
    String(visualConfig.outlineIntensity.strokeAlpha)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-base-opacity",
    String(styleProfile.outlineBaseOpacity)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-pulse-min-opacity",
    String(styleProfile.outlinePulseMinOpacity)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-pulse-max-opacity",
    String(styleProfile.outlinePulseMaxOpacity)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-width-down-px",
    `${styleProfile.outlineWidthDownPx}px`
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-width-up-px",
    `${styleProfile.outlineWidthUpPx}px`
  );
}

function buildTargetShapes(ownerDocument, radius, target, visualConfig) {
  const shapes = [];
  if (!ownerDocument || !target || !target.ring) {
    return shapes;
  }

  if (target.ring === "DB") {
    shapes.push(
      createBull(ownerDocument, radius, 0, RING_RATIOS.outerBullInner, true, {
        edgePaddingPx: visualConfig.edgePaddingPx,
      })
    );
    return shapes;
  }

  if (target.ring === "SB") {
    shapes.push(
      createBull(
        ownerDocument,
        radius,
        RING_RATIOS.outerBullInner,
        RING_RATIOS.outerBullOuter,
        false,
        {
          edgePaddingPx: visualConfig.edgePaddingPx,
          noStroke: true,
        }
      )
    );
    return shapes;
  }

  const angles = segmentAngles(target.value);
  if (!angles) {
    return shapes;
  }

  if (target.ring === "T") {
    shapes.push(
      createWedge(
        ownerDocument,
        radius,
        RING_RATIOS.tripleInner,
        RING_RATIOS.tripleOuter,
        angles.start,
        angles.end,
        visualConfig.edgePaddingPx
      )
    );
    return shapes;
  }

  if (target.ring === "D") {
    shapes.push(
      createWedge(
        ownerDocument,
        radius,
        RING_RATIOS.doubleInner,
        RING_RATIOS.doubleOuter,
        angles.start,
        angles.end,
        visualConfig.edgePaddingPx
      )
    );
    return shapes;
  }

  const innerSingle = () =>
    createWedge(
      ownerDocument,
      radius,
      RING_RATIOS.outerBullOuter,
      RING_RATIOS.tripleInner,
      angles.start,
      angles.end,
      visualConfig.edgePaddingPx
    );
  const outerSingle = () =>
    createWedge(
      ownerDocument,
      radius,
      RING_RATIOS.tripleOuter,
      RING_RATIOS.doubleInner,
      angles.start,
      angles.end,
      visualConfig.edgePaddingPx
    );

  if (visualConfig.singleRing === "inner") {
    shapes.push(innerSingle());
  } else if (visualConfig.singleRing === "outer") {
    shapes.push(outerSingle());
  } else {
    shapes.push(innerSingle(), outerSingle());
  }

  return shapes;
}

export function renderCheckoutTargets(options = {}) {
  const board = options.board;
  const checkoutTargets = Array.isArray(options.checkoutTargets) ? options.checkoutTargets : [];
  const visualConfig = options.visualConfig;

  if (!board || !board.group || !board.radius || !visualConfig) {
    return;
  }

  const overlay = ensureOverlay(board.group);
  if (!overlay) {
    return;
  }

  if (!checkoutTargets.length) {
    clearOverlay(overlay);
    return;
  }

  const ownerDocument = overlay.ownerDocument;

  const renderedKeys = new Set();
  const uniqueTargets = [];
  checkoutTargets.forEach((target) => {
    const key = `${target?.ring || ""}:${Number.isFinite(target?.value) ? target.value : ""}`;
    if (renderedKeys.has(key)) {
      return;
    }
    renderedKeys.add(key);
    uniqueTargets.push(target);
  });

  const renderEntries = uniqueTargets
    .map((target, targetIndex) => ({
      target,
      targetIndex,
      priorityProfile: resolvePriorityProfile(visualConfig, targetIndex, uniqueTargets.length),
    }))
    .sort((left, right) => right.targetIndex - left.targetIndex);

  const existingNodesByKey = new Map(
    Array.from(overlay.children || []).map((node) => [buildRenderableNodeKey(node), node])
  );
  const nextNodes = [];

  renderEntries.forEach(({ target, targetIndex, priorityProfile }) => {
    const key = `${target?.ring || ""}:${Number.isFinite(target?.value) ? target.value : ""}`;
    if (!key) {
      return;
    }

    const shapes = buildTargetShapes(ownerDocument, board.radius, target, visualConfig);
    const styleProfile = resolveTargetStyleProfile(target, board.radius, visualConfig, {
      targetIndex,
      targetCount: uniqueTargets.length,
      priorityProfile,
    });
    shapes.forEach((shapeNode) => {
      applyTargetMetadata(shapeNode, target, styleProfile);
      applyShapeStyle(shapeNode, visualConfig, styleProfile);
      const shapeKey = buildRenderableNodeKey(shapeNode);
      const reusableShapeNode = existingNodesByKey.get(shapeKey);
      if (reusableShapeNode && reusableShapeNode.tagName === shapeNode.tagName) {
        syncRenderableNode(reusableShapeNode, shapeNode);
        existingNodesByKey.delete(shapeKey);
        nextNodes.push(reusableShapeNode);
      } else {
        nextNodes.push(shapeNode);
      }

      if (visualConfig.renderOutline === false) {
        return;
      }

      const outline = cloneShapeAsOutline(shapeNode, ownerDocument);
      applyTargetMetadata(outline, target, styleProfile);
      applyOutlineStyle(outline, visualConfig, styleProfile);
      const outlineKey = buildRenderableNodeKey(outline);
      const reusableOutlineNode = existingNodesByKey.get(outlineKey);
      if (reusableOutlineNode && reusableOutlineNode.tagName === outline.tagName) {
        syncRenderableNode(reusableOutlineNode, outline);
        existingNodesByKey.delete(outlineKey);
        nextNodes.push(reusableOutlineNode);
      } else {
        nextNodes.push(outline);
      }
    });
  });

  Array.from(overlay.children || []).forEach((childNode) => {
    if (nextNodes.includes(childNode)) {
      return;
    }
    overlay.removeChild(childNode);
  });

  nextNodes.forEach((node, index) => {
    const referenceNode = overlay.children[index] || null;
    if (referenceNode === node) {
      return;
    }
    overlay.insertBefore(node, referenceNode);
  });
}
