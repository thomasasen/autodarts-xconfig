import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShadowPoseSettings,
  buildTipAnchoredPoseTransform,
  normalizeDartImpactStyle,
  resolveDartImpactPose,
  resolveDartRotationDeg,
} from "../../src/features/dart-marker-replacer/pose.js";

test("classic dart impact pose is neutral and invalid styles fall back to classic", () => {
  assert.equal(normalizeDartImpactStyle("natural"), "natural");
  assert.equal(normalizeDartImpactStyle("dramatic"), "dramatic");
  assert.equal(normalizeDartImpactStyle("unknown"), "classic");
  const pose = resolveDartImpactPose({ markerKey: "10:20", index: 0, impactStyle: "classic" });
  assert.deepEqual(pose, {
    impactStyle: "classic",
    rotationJitterDeg: 0,
    skewYDeg: 0,
    scaleX: 1,
    scaleY: 1,
    tailLiftPx: 0,
    shadowStretch: 1,
    shadowOpacityMultiplier: 1,
  });
  assert.equal(buildTipAnchoredPoseTransform({ tip: { x: 12, y: 34 }, dartLength: 80, pose }).transform, "");
});

test("realistic dart direction keeps the flight above the tip across the board and at misses", () => {
  const boardCenter = { x: 400, y: 350 };
  for (const offset of [
    { x: 0, y: -200 }, { x: 0, y: 200 }, { x: -200, y: 0 },
    { x: 200, y: 0 }, { x: 0, y: 0 }, { x: -300, y: 400 },
    { x: 500, y: -600 },
  ]) {
    const center = { x: boardCenter.x + offset.x, y: boardCenter.y + offset.y };
    const options = { center, boardCenter, boardRadius: 200, realisticDirection: true };
    const rotation = resolveDartRotationDeg(options);
    assert.ok(rotation < -45 && rotation > -135, `upward flight at ${JSON.stringify(offset)}`);
    const scaled = resolveDartRotationDeg({
      ...options,
      center: { x: center.x * 2 + 100, y: center.y * 2 - 50 },
      boardCenter: { x: boardCenter.x * 2 + 100, y: boardCenter.y * 2 - 50 },
      boardRadius: 400,
    });
    assert.ok(Math.abs(rotation - scaled) < 1e-8, "zoom and translation preserve direction");
  }
  assert.equal(resolveDartRotationDeg({
    center: { x: 400, y: 550 }, boardCenter, boardRadius: 200,
  }), -270, "disabled option preserves the lower-board radial direction");
});

test("flat perspective foreshortens the dart independently of impact style and fixes its tip", () => {
  const tip = { x: 766.3948619086914, y: 862.5449351985626 };
  for (const impactStyle of ["classic", "natural", "dramatic"]) {
    const pose = resolveDartImpactPose({ markerKey: "lower-board", index: 2, impactStyle });
    const normal = buildTipAnchoredPoseTransform({ tip, dartLength: 257, pose });
    const flat = buildTipAnchoredPoseTransform({ tip, dartLength: 257, pose, flatPerspective: true });
    const normalLength = Math.hypot(normal.matrix.a, normal.matrix.b);
    assert.ok(Math.hypot(flat.matrix.a, flat.matrix.b) < normalLength * 0.7);
    assert.equal(flat.matrix.c, normal.matrix.c, "preserves transverse image width");
    assert.equal(flat.matrix.d, normal.matrix.d);
    assert.ok(Math.abs(flat.matrix.a * tip.x + flat.matrix.c * tip.y + flat.matrix.e - tip.x) < 1e-5);
    assert.ok(Math.abs(flat.matrix.b * tip.x + flat.matrix.d * tip.y + flat.matrix.f - tip.y) < 1e-5);
  }
});

test("natural dart impact poses are deterministic, stable, and marker-specific", () => {
  const options = { markerKey: "10:20", index: 0, impactStyle: "natural" };
  const pose = resolveDartImpactPose(options);
  assert.deepEqual(resolveDartImpactPose(options), pose);
  assert.notDeepEqual(resolveDartImpactPose({ ...options, markerKey: "11:20" }), pose);
  assert.ok(pose.rotationJitterDeg >= -4.5 && pose.rotationJitterDeg <= 4.5);
  assert.ok(pose.skewYDeg >= -3.5 && pose.skewYDeg <= 3.5);
  assert.ok(pose.scaleX >= 0.975 && pose.scaleX <= 1.025);
  assert.ok(pose.scaleY >= 0.95 && pose.scaleY <= 1.04);
});

test("dramatic pose has bounded values and keeps its tip fixed", () => {
  const pose = resolveDartImpactPose({ markerKey: "50:80", index: 2, impactStyle: "dramatic" });
  assert.ok(pose.rotationJitterDeg >= -9 && pose.rotationJitterDeg <= 9);
  assert.ok(pose.tailLiftPx >= -6 && pose.tailLiftPx <= 8);
  assert.ok(pose.shadowStretch >= 1.08 && pose.shadowStretch <= 1.45);

  const tip = { x: 194, y: 70 };
  const { transform, matrix } = buildTipAnchoredPoseTransform({ tip, dartLength: 86, pose });
  assert.match(transform, /^matrix\(/);
  assert.ok(Math.abs(matrix.a * tip.x + matrix.c * tip.y + matrix.e - tip.x) < 1e-6);
  assert.ok(Math.abs(matrix.b * tip.x + matrix.d * tip.y + matrix.f - tip.y) < 1e-6);
});

test("shadow pose preserves classic values and clamps posed opacity", () => {
  const classic = resolveDartImpactPose({ impactStyle: "classic" });
  assert.deepEqual(buildShadowPoseSettings({ pose: classic, baseOpacity: 0.28, baseScaleX: 1.1, baseSkewYDeg: 3 }), {
    opacity: 0.28,
    scaleX: 1.1,
    skewYDeg: 3,
  });
  assert.equal(buildShadowPoseSettings({ pose: { shadowOpacityMultiplier: 10, shadowStretch: 1 }, baseOpacity: 0.5, baseScaleX: 1 }).opacity, 1);
});
