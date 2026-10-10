import test from "node:test";
import assert from "node:assert/strict";
import { buildShellRenderSignature, createShellRenderSignatureBuilder } from "../../src/features/xconfig-ui/render-signature.js";

test("local UI asset signatures retain exact-content equality across fresh config objects", () => {
  const build = createShellRenderSignatureBuilder();
  const state = { activeSettingsFeatureKey: "theme-global-background" };
  const features = [{ featureKey: "background", config: {
    backgroundImageDataUrl: `data:image/png;base64,${"A".repeat(100000)}`,
    unknown: { ordered: [1, 2], dataUrl: "data:image/png;base64,OTHER" },
  } }];
  const stored = structuredClone(features);
  const first = build(state, features, true);
  assert.equal(build(state, structuredClone(features), true), first);
  assert.ok(first.length < 1500);
  assert.deepEqual(features, stored);
  assert.equal(JSON.parse(buildShellRenderSignature(state, features, true)).features[0].config.backgroundImageDataUrl,
    stored[0].config.backgroundImageDataUrl, "the existing full signature helper retains its contract");
  features[0].config.backgroundImageDataUrl = features[0].config.backgroundImageDataUrl.slice(0, -1) + "B";
  const changed = build(state, features, true);
  assert.notEqual(changed, first, "same-size image changes invalidate the signature");
  assert.equal(build(state, structuredClone(features), true), changed);
  features[0].config.unknown.ordered.reverse();
  assert.notEqual(build(state, features, true), changed);
});

test("asset clearing, feature removal, route changes and independent shells invalidate only their own signatures", () => {
  const build = createShellRenderSignatureBuilder();
  const other = createShellRenderSignatureBuilder();
  const state = {};
  const features = [{ featureKey: "dart", config: { turnDartImageDataUrl: "data:image/png;base64,ABC", style: "image" } }];
  const original = build(state, features, true);
  assert.equal(other(state, features, true), original);
  const reference = other(state, features, true);
  features[0].config.turnDartImageDataUrl = "";
  assert.notEqual(build(state, features, true), original);
  features[0].config.turnDartImageDataUrl = "data:image/png;base64,ABC";
  assert.equal(other(state, features, true), reference);
  assert.notEqual(build(state, features, false), build(state, features, true));
  assert.notEqual(build(state, [], true), build(state, features, true));
  features[0].config.style = "original";
  assert.notEqual(other(state, features, true), reference);
});
