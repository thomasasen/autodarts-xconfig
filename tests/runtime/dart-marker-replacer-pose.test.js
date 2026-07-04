import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShadowPoseSettings,
  buildTipAnchoredPoseTransform,
  normalizeDartImpactStyle,
  resolveDartImpactPose,
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
