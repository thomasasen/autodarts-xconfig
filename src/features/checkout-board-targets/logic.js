import {
  EFFECT_CLASSES,
  OUTLINE_CLASS,
  OVERLAY_ID,
  SVG_NS,
  TARGET_CLASS,
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

function applyShapeStyle(shapeNode, radius, visualConfig) {
  if (!shapeNode || !shapeNode.classList || !shapeNode.style) {
    return;
  }

  shapeNode.classList.add(TARGET_CLASS, EFFECT_CLASSES[visualConfig.effect] || EFFECT_CLASSES.pulse);
  const strokeWidth = Math.max(1, radius * visualConfig.strokeWidthRatio);

  shapeNode.style.setProperty("--ad-ext-target-color", visualConfig.theme.color);
  shapeNode.style.setProperty("--ad-ext-target-stroke", visualConfig.theme.strokeColor);
  shapeNode.style.setProperty("--ad-ext-target-stroke-width", `${strokeWidth}px`);
  shapeNode.style.setProperty("--ad-ext-target-outline-width", `${strokeWidth + 1.5}px`);
  shapeNode.style.setProperty("--ad-ext-target-duration", `${visualConfig.animationMs}ms`);
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-stroke-alpha",
    String(visualConfig.outlineIntensity.strokeAlpha)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-base-opacity",
    String(visualConfig.outlineIntensity.baseOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-pulse-min-opacity",
    String(visualConfig.outlineIntensity.pulseMinOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-pulse-max-opacity",
    String(visualConfig.outlineIntensity.pulseMaxOpacity)
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-width-down-px",
    `${visualConfig.outlineIntensity.widthDownPx}px`
  );
  shapeNode.style.setProperty(
    "--ad-ext-target-outline-width-up-px",
    `${visualConfig.outlineIntensity.widthUpPx}px`
  );
  if (shapeNode.dataset && shapeNode.dataset.noStroke === "true") {
    shapeNode.style.stroke = "none";
    shapeNode.style.strokeWidth = "0";
  }
}

function cloneShapeAsOutline(shapeNode, ownerDocument) {
  const outline = ownerDocument.createElementNS(SVG_NS, shapeNode.tagName);
  Array.from(shapeNode.attributes || []).forEach((attribute) => {
    outline.setAttribute(attribute.name, attribute.value);
  });
  return outline;
}

function applyOutlineStyle(outlineNode, radius, visualConfig) {
  if (!outlineNode || !outlineNode.classList || !outlineNode.style) {
    return;
  }

  const strokeWidth = Math.max(1, radius * visualConfig.strokeWidthRatio);
  outlineNode.classList.add(OUTLINE_CLASS);
  outlineNode.style.setProperty("--ad-ext-target-outline-width", `${strokeWidth + 1.5}px`);
  outlineNode.style.setProperty("--ad-ext-target-duration", `${visualConfig.animationMs}ms`);
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-stroke-alpha",
    String(visualConfig.outlineIntensity.strokeAlpha)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-base-opacity",
    String(visualConfig.outlineIntensity.baseOpacity)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-pulse-min-opacity",
    String(visualConfig.outlineIntensity.pulseMinOpacity)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-pulse-max-opacity",
    String(visualConfig.outlineIntensity.pulseMaxOpacity)
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-width-down-px",
    `${visualConfig.outlineIntensity.widthDownPx}px`
  );
  outlineNode.style.setProperty(
    "--ad-ext-target-outline-width-up-px",
    `${visualConfig.outlineIntensity.widthUpPx}px`
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
  clearOverlay(overlay);

  if (!checkoutTargets.length) {
    return;
  }

  const selectedTargets = checkoutTargets.slice(0, 1);
  const ownerDocument = overlay.ownerDocument;

  selectedTargets.forEach((target) => {
    const shapes = buildTargetShapes(ownerDocument, board.radius, target, visualConfig);
    shapes.forEach((shapeNode) => {
      applyShapeStyle(shapeNode, board.radius, visualConfig);
      overlay.appendChild(shapeNode);

      const outline = cloneShapeAsOutline(shapeNode, ownerDocument);
      applyOutlineStyle(outline, board.radius, visualConfig);
      overlay.appendChild(outline);
    });
  });
}
