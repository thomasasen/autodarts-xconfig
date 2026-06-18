import {
  BUST_CRACK_CLASS,
  BUST_CRACK_OVERLAY_CLASS,
  DEMO_CRACK_SETTINGS,
} from "./style.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function randomBetween(random, minimum, maximum) {
  return minimum + random() * (maximum - minimum);
}

function createSvgNode(documentRef, tagName, attributes = {}) {
  const node = documentRef.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
  return node;
}

function buildCurvedSegment(from, to, random) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const midpointProgress = randomBetween(random, 0.3, 0.8);
  const curvatureScale = (5 * DEMO_CRACK_SETTINGS.curvaturePercent) / 100;
  const curve = randomBetween(random, -curvatureScale / 2, curvatureScale / 2) * Math.log(length * Math.E);
  const controlX = from.x + deltaX * midpointProgress + (deltaY / length) * curve;
  const controlY = from.y + deltaY * midpointProgress - (deltaX / length) * curve;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

function buildSplinterSegment(from, to, random) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const progress = randomBetween(random, 0.18, 0.88);
  const centerX = from.x + deltaX * progress;
  const centerY = from.y + deltaY * progress;
  const halfLength = randomBetween(random, 0.45, 1.6);
  const normalX = (deltaY / length) * halfLength;
  const normalY = (-deltaX / length) * halfLength;
  return `M ${(centerX - normalX).toFixed(2)} ${(centerY - normalY).toFixed(2)} L ${(
    centerX + normalX
  ).toFixed(2)} ${(centerY + normalY).toFixed(2)}`;
}

function buildCrackRadii(random, maximumRadius) {
  const radii = [DEMO_CRACK_SETTINGS.initialRadius];
  let radius = DEMO_CRACK_SETTINGS.radiusStart;
  while (radius < maximumRadius && radii.length < 64) {
    radii.push(radius);
    radius *= random() * 1.5 + (1.5 - DEMO_CRACK_SETTINGS.densityPercent / 100);
  }
  return radii;
}

function buildNoiseSegments(from, to, random) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const tangentX = deltaX / length;
  const tangentY = deltaY / length;
  const normalX = tangentY;
  const normalY = -tangentX;
  const count = Math.max(6, Math.round(18 * (DEMO_CRACK_SETTINGS.noiseFrequency / 0.4)));
  const segments = [];
  for (let index = 0; index < count; index += 1) {
    const progress = randomBetween(random, 0.02, 0.98);
    const positiveOffsetSample = random();
    const negativeOffsetSample = random();
    const offset = (positiveOffsetSample - negativeOffsetSample) * (length / 3);
    const centerX = from.x + deltaX * progress + normalX * offset;
    const centerY = from.y + deltaY * progress + normalY * offset;
    const halfLength = randomBetween(random, 0.5, 5);
    const skew = randomBetween(random, -0.2, 0.2);
    const lineX = tangentX + normalX * skew;
    const lineY = tangentY + normalY * skew;
    segments.push(
      `M ${(centerX - lineX * halfLength).toFixed(2)} ${(
        centerY - lineY * halfLength
      ).toFixed(2)} L ${(centerX + lineX * halfLength).toFixed(2)} ${(
        centerY + lineY * halfLength
      ).toFixed(2)}`
    );
  }
  return segments;
}

function buildShardSegments(from, to, random) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const tangentX = deltaX / length;
  const tangentY = deltaY / length;
  const normalX = tangentY;
  const normalY = -tangentX;
  const segments = [];
  const count = Math.max(2, Math.min(6, Math.ceil(length / 8)));
  for (let index = 0; index < count; index += 1) {
    const progress = (index + randomBetween(random, 0.2, 0.8)) / count;
    const centerX = from.x + deltaX * progress;
    const centerY = from.y + deltaY * progress;
    const width = randomBetween(random, 1, 2);
    const height = randomBetween(random, 1, DEMO_CRACK_SETTINGS.fractureSize + 1);
    const tangentOffset = randomBetween(random, -10, 10);
    segments.push(
      `M ${centerX.toFixed(2)} ${centerY.toFixed(2)} L ${(
        centerX + (tangentOffset + width / 2) * tangentX + height * normalX
      ).toFixed(2)} ${(
        centerY + (-tangentOffset + width / 2) * tangentY + height * normalY
      ).toFixed(2)} L ${(centerX + width * tangentX).toFixed(2)} ${(
        centerY + width * tangentY
      ).toFixed(2)} L ${(
        centerX + (-tangentOffset + width / 2) * tangentX - height * normalX
      ).toFixed(2)} ${(
        centerY + (tangentOffset + width / 2) * tangentY - height * normalY
      ).toFixed(2)} Z`
    );
  }
  return segments;
}

function isPointInsideSurface(point, centerX, centerY, width, height) {
  const x = centerX + point.x;
  const y = centerY + point.y;
  return x > 0 && x < width && y > 0 && y < height;
}

function createCrackGroup(documentRef, random, index, surface) {
  const centerX = randomBetween(random, surface.width * 0.12, surface.width * 0.88);
  const centerY = randomBetween(random, surface.height * 0.14, surface.height * 0.86);
  const group = createSvgNode(documentRef, "g", {
    class: BUST_CRACK_CLASS,
    "data-crack-index": index,
    "data-crack-x": centerX.toFixed(2),
    "data-crack-y": centerY.toFixed(2),
    transform: `translate(${centerX.toFixed(2)} ${centerY.toFixed(2)})`,
  });

  const levels = [];
  const radialSegments = [];
  const webSegments = [];
  const splinterSegments = [];
  const noiseSegments = [];
  const shardSegments = [];
  const crackRadii = buildCrackRadii(random, Math.hypot(surface.width, surface.height) * 1.1);
  for (let rayIndex = 0; rayIndex < DEMO_CRACK_SETTINGS.rays; rayIndex += 1) {
    let angle =
      (Math.PI * 2 * rayIndex) / (DEMO_CRACK_SETTINGS.rays + 1) + Math.PI / 18;
    let previousPoint = null;
    for (let levelIndex = 0; levelIndex < crackRadii.length; levelIndex += 1) {
      if (
        previousPoint &&
        !isPointInsideSurface(previousPoint, centerX, centerY, surface.width, surface.height)
      ) {
        break;
      }
      const radius = crackRadii[levelIndex];
      angle += randomBetween(
        random,
        -Math.PI / (36 * DEMO_CRACK_SETTINGS.rays),
        Math.PI / (36 * DEMO_CRACK_SETTINGS.rays)
      );
      const level = Math.max(1, levelIndex);
      const variedRadius = radius + randomBetween(random, -radius / (2 * level), radius / (2 * level));
      const point = {
        x: Math.cos(angle) * variedRadius,
        y: Math.sin(angle) * variedRadius,
      };
      levels[levelIndex] ||= [];
      levels[levelIndex][rayIndex] = point;
      if (previousPoint) {
        radialSegments.push(buildCurvedSegment(previousPoint, point, random));
        if (random() < 0.62) {
          splinterSegments.push(buildSplinterSegment(previousPoint, point, random));
        }
        noiseSegments.push(...buildNoiseSegments(previousPoint, point, random));
        shardSegments.push(...buildShardSegments(previousPoint, point, random));
      }
      previousPoint = point;
    }
  }

  levels.forEach((level, levelIndex) => {
    level.forEach((from, rayIndex) => {
      const adjacent = level[(rayIndex + 1) % DEMO_CRACK_SETTINGS.rays];
      if (adjacent && random() < DEMO_CRACK_SETTINGS.ringConnectionPercent / 100) {
        webSegments.push(buildCurvedSegment(from, adjacent, random));
        noiseSegments.push(...buildNoiseSegments(from, adjacent, random));
        shardSegments.push(...buildShardSegments(from, adjacent, random));
      }
      const outerAdjacent =
        levels[levelIndex + 1]?.[(rayIndex + 1) % DEMO_CRACK_SETTINGS.rays];
      if (
        outerAdjacent &&
        random() < DEMO_CRACK_SETTINGS.diagonalConnectionPercent / 100
      ) {
        webSegments.push(buildCurvedSegment(from, outerAdjacent, random));
        noiseSegments.push(...buildNoiseSegments(from, outerAdjacent, random));
        shardSegments.push(...buildShardSegments(from, outerAdjacent, random));
      }
    });
  });

  const radialPathData = radialSegments.join(" ");
  group.appendChild(createSvgNode(documentRef, "path", {
    class: "ad-ext-x01-bust-crack-reflection",
    d: radialPathData,
  }));
  group.appendChild(createSvgNode(documentRef, "path", {
    class: "ad-ext-x01-bust-crack-main",
    d: radialPathData,
  }));
  group.appendChild(createSvgNode(documentRef, "path", {
    class: "ad-ext-x01-bust-crack-web",
    d: webSegments.join(" "),
  }));
  group.appendChild(createSvgNode(documentRef, "path", {
    class: "ad-ext-x01-bust-crack-splinters",
    d: splinterSegments.join(" "),
  }));
  group.appendChild(createSvgNode(documentRef, "path", {
    class: "ad-ext-x01-bust-crack-noise",
    d: noiseSegments.join(" "),
  }));
  group.appendChild(createSvgNode(documentRef, "path", {
    class: "ad-ext-x01-bust-crack-shards",
    d: shardSegments.join(" "),
  }));

  return group;
}

export function removeBustCracks(node) {
  node?.querySelector?.(`.${BUST_CRACK_OVERLAY_CLASS}`)?.remove?.();
}

export function renderBustCracks(node, crackCount, options = {}) {
  removeBustCracks(node);
  const documentRef = options.documentRef || node?.ownerDocument || null;
  const count = Math.max(0, Math.min(3, Number.parseInt(crackCount, 10) || 0));
  if (!node || !documentRef || count === 0) {
    return null;
  }

  const random = typeof options.random === "function" ? options.random : Math.random;
  const bounds = node.getBoundingClientRect?.() || {};
  const surface = {
    width: Math.max(1, Number(bounds.width) || 320),
    height: Math.max(1, Number(bounds.height) || 120),
  };
  const overlay = createSvgNode(documentRef, "svg", {
    class: BUST_CRACK_OVERLAY_CLASS,
    viewBox: `0 0 ${surface.width} ${surface.height}`,
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });
  for (let crackIndex = 0; crackIndex < count; crackIndex += 1) {
    overlay.appendChild(createCrackGroup(documentRef, random, crackIndex, surface));
  }
  node.appendChild(overlay);
  return overlay;
}
