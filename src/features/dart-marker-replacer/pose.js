const IMPACT_STYLES = new Set(["classic", "natural", "dramatic"]);

const POSE_RANGES = Object.freeze({
  natural: Object.freeze({
    rotationJitterDeg: [-4.5, 4.5],
    skewYDeg: [-3.5, 3.5],
    scaleX: [0.975, 1.025],
    scaleY: [0.95, 1.04],
    tailLiftPx: [-3, 4],
    shadowStretch: [1.02, 1.22],
    shadowOpacityMultiplier: [0.94, 1.14],
  }),
  dramatic: Object.freeze({
    rotationJitterDeg: [-9, 9],
    skewYDeg: [-7.5, 7.5],
    scaleX: [0.92, 1.07],
    scaleY: [0.87, 1.1],
    tailLiftPx: [-6, 8],
    shadowStretch: [1.08, 1.45],
    shadowOpacityMultiplier: [0.88, 1.28],
  }),
});

export function normalizeDartImpactStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return IMPACT_STYLES.has(normalized) ? normalized : "classic";
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sample(seed, channel, range) {
  const unit = hashString(`${seed}|${channel}`) / 0xffffffff;
  return range[0] + (range[1] - range[0]) * unit;
}

export function resolveDartImpactPose(options = {}) {
  const impactStyle = normalizeDartImpactStyle(options.impactStyle);
  if (impactStyle === "classic") {
    return {
      impactStyle,
      rotationJitterDeg: 0,
      skewYDeg: 0,
      scaleX: 1,
      scaleY: 1,
      tailLiftPx: 0,
      shadowStretch: 1,
      shadowOpacityMultiplier: 1,
    };
  }

  const seed = `${String(options.markerKey || "marker")}|${Number(options.index) || 0}|${impactStyle}`;
  const ranges = POSE_RANGES[impactStyle];
  return {
    impactStyle,
    rotationJitterDeg: sample(seed, "rotation", ranges.rotationJitterDeg),
    skewYDeg: sample(seed, "skew", ranges.skewYDeg),
    scaleX: sample(seed, "scale-x", ranges.scaleX),
    scaleY: sample(seed, "scale-y", ranges.scaleY),
    tailLiftPx: sample(seed, "tail-lift", ranges.tailLiftPx),
    shadowStretch: sample(seed, "shadow-stretch", ranges.shadowStretch),
    shadowOpacityMultiplier: sample(seed, "shadow-opacity", ranges.shadowOpacityMultiplier),
  };
}

function cleanMatrixValue(value) {
  return Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(8));
}

export function buildTipAnchoredPoseTransform(options = {}) {
  const pose = options.pose || resolveDartImpactPose();
  const tipX = Number(options.tip?.x) || 0;
  const tipY = Number(options.tip?.y) || 0;
  const dartLength = Math.max(1, Number(options.dartLength) || 1);
  if (pose.impactStyle === "classic") {
    return {
      transform: "",
      matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    };
  }

  const rotation = (Number(pose.rotationJitterDeg) || 0) * Math.PI / 180;
  const shear = Math.tan((Number(pose.skewYDeg) || 0) * Math.PI / 180) +
    (Number(pose.tailLiftPx) || 0) / dartLength;
  const scaleX = Number(pose.scaleX) || 1;
  const scaleY = Number(pose.scaleY) || 1;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const a = cos * scaleX - sin * shear * scaleX;
  const b = sin * scaleX + cos * shear * scaleX;
  const c = -sin * scaleY;
  const d = cos * scaleY;
  const e = tipX - a * tipX - c * tipY;
  const f = tipY - b * tipX - d * tipY;
  const matrix = Object.fromEntries(
    Object.entries({ a, b, c, d, e, f }).map(([key, value]) => [key, cleanMatrixValue(value)])
  );
  return {
    transform: `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`,
    matrix,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function buildShadowPoseSettings(options = {}) {
  const pose = options.pose || resolveDartImpactPose();
  return {
    opacity: clamp(
      Number(options.baseOpacity) * Number(pose.shadowOpacityMultiplier || 1),
      0,
      1
    ),
    scaleX: clamp(
      Number(options.baseScaleX || 1) * Number(pose.shadowStretch || 1),
      0.2,
      2
    ),
    skewYDeg: clamp(Number(options.baseSkewYDeg) || 0, -25, 25),
  };
}
