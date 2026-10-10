import test from "node:test";
import assert from "node:assert/strict";
import { getFeatureConfigSpec, createRecommendedFeatureConfig } from "../../src/config/feature-config-spec.js";
import { getXConfigDescriptor } from "../../src/features/xconfig-ui/descriptors.js";
import { getEffectClass, EFFECT_CLASSES } from "../../src/features/checkout-score-highlight/style.js";
import { resolveZoomSpeedConfig } from "../../src/features/tv-board-zoom/style.js";

const contracts = [
  ["checkout-score-highlight", "checkoutScoreHighlight", {
    effect: [["grow-glow", "Vergrößern & leuchten"], ["glow-only", "Nur leuchten"], ["grow-only", "Nur vergrößern"], ["fade-blink", "Sanft blinken"]],
    intensity: [["dezent", "Dezent"], ["standard", "Standard"], ["stark", "Stark"]],
    triggerSource: [["suggestion-first", "Vorschlag zuerst"], ["score-only", "Nur Score"], ["suggestion-only", "Nur Vorschlag"]],
  }],
  ["tv-board-zoom", "tvBoardZoom", {
    zoomLevel: [[2.35, "Leicht"], [2.75, "Mittel"], [3.15, "Stark"]],
    zoomStyle: [["standard", "Standard"], ["cinematic", "Cinematic"]],
    zoomSpeed: [["schnell", "Schnell"], ["mittel", "Mittel"], ["langsam", "Langsam"]],
    checkoutZoomTarget: [["finish-only", "Nur Finish-Feld"], ["route-first", "Erstes Routenfeld"]],
  }],
];

for (const [featureKey, configKey, fields] of contracts) {
  test(`${featureKey} preserves every option, label, default and recommendation`, () => {
    const spec = getFeatureConfigSpec(configKey);
    const descriptor = getXConfigDescriptor(featureKey);
    const defaults = spec.normalizeConfig();
    const recommended = createRecommendedFeatureConfig(configKey);
    for (const [key, expected] of Object.entries(fields)) {
      const field = descriptor.fields.find((entry) => entry.key === key);
      assert.deepEqual(field.options.map(({ value, label }) => [value, label]), expected);
      for (const [value] of expected) assert.equal(spec.normalizeConfig({ [key]: value })[key], value);
      assert.equal(spec.normalizeConfig({ [key]: "invalid" })[key], defaults[key]);
      assert.ok(expected.some(([value]) => value === defaults[key]));
      assert.ok(expected.some(([value]) => value === recommended[key]));
    }
  });
}

test("standalone checkout effects and zoom speeds preserve legacy aliases and fallback behavior", () => {
  const aliases = { pulse: "grow-glow", glow: "glow-only", scale: "grow-only", blink: "fade-blink" };
  for (const [alias, value] of Object.entries(aliases)) {
    assert.equal(getEffectClass(` ${alias.toUpperCase()} `), EFFECT_CLASSES[value]);
    assert.equal(getFeatureConfigSpec("checkoutScoreHighlight").normalizeConfig({ effect: alias }).effect, value);
  }
  assert.equal(getEffectClass("invalid"), EFFECT_CLASSES["grow-only"]);
  assert.deepEqual(resolveZoomSpeedConfig("invalid"), resolveZoomSpeedConfig("mittel"));
  assert.deepEqual(resolveZoomSpeedConfig("invalid", "cinematic"), resolveZoomSpeedConfig("mittel", "cinematic"));
  assert.equal(resolveZoomSpeedConfig("schnell").zoomInMs, 140);
  assert.equal(resolveZoomSpeedConfig("mittel", "cinematic").zoomInMs, 420);
});
