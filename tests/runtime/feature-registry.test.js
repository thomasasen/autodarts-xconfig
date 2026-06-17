import test from "node:test";
import assert from "node:assert/strict";

import {
  createFeatureRegistry,
  defaultFeatureDefinitions,
} from "../../src/features/feature-registry.js";

test("feature registry ignores duplicate feature keys deterministically", () => {
  const registry = createFeatureRegistry({
    definitions: [
      ...defaultFeatureDefinitions,
      {
        featureKey: "checkout-score-highlight",
        configKey: "checkoutScoreHighlight",
        title: "Duplicate",
        initialize: () => () => {},
      },
    ],
  });

  const features = registry.getDefinitions();

  assert.equal(features.length, defaultFeatureDefinitions.length);
  assert.equal(features[0].title, "Checkout Score Highlight");
});

test("feature registry lists runtime metadata against snapshots", () => {
  const registry = createFeatureRegistry();
  const listed = registry.listFeatures({
    features: {
      "checkout-score-highlight": {
        enabled: true,
        mounted: true,
        config: { effect: "scale" },
      },
      "checkout-target-highlights": {
        enabled: false,
        mounted: false,
        config: { effect: "pulse" },
      },
    },
  });

  assert.equal(listed.length, defaultFeatureDefinitions.length);
  assert.equal(listed[0].featureKey, "checkout-score-highlight");
  assert.equal(listed[0].enabled, true);
  assert.equal(listed[0].mounted, true);
  assert.deepEqual(listed[0].variants, ["x01"]);
  assert.equal(typeof listed[0].startupTiming, "string");
  assert.equal(listed.some((feature) => feature.featureKey === "tv-board-zoom"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "active-player-sweep"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "special-hit-highlights"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "cricket-target-highlighter"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "cricket-grid-status-effects"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "dartboard-marker-highlight"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "dart-marker-replacer"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "take-out-darts-alert"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "single-bull-hit-sound"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "turn-score-counter"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "x01-remaining-score-bar"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "winner-celebration-effect"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-x01"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-gotcha"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-x01-2player"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-shanghai"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-bermuda"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-cricket"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-bull-off"), true);
  assert.equal(
    listed.find((feature) => feature.featureKey === "checkout-target-highlights")?.enabled,
    false
  );
});

test("feature registry wires per-feature debug helper based on config.debug", () => {
  const calls = [];
  const logger = {
    info: (...args) => calls.push(["info", ...args]),
    warn: (...args) => calls.push(["warn", ...args]),
    error: (...args) => calls.push(["error", ...args]),
  };
  const registry = createFeatureRegistry({
    logger,
    definitions: [
      {
        featureKey: "debug-check",
        configKey: "debugCheck",
        initialize: (context) => {
          context.featureDebug.log("mount");
          return () => context.featureDebug.log("unmount");
        },
      },
    ],
  });

  const [definition] = registry.getDefinitions();
  assert.equal(definition.startupTiming, "deferred");
  const cleanup = definition.mount({
    config: {
      getFeatureConfig: () => ({ debug: true }),
    },
    logger,
  });
  cleanup();

  assert.equal(
    calls.some((entry) => entry.join(" ").includes("[autodarts-xconfig:debug-check] mount")),
    true
  );
  assert.equal(
    calls.some((entry) => entry.join(" ").includes("[autodarts-xconfig:debug-check] unmount")),
    true
  );
});
