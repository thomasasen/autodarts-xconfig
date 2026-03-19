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
        featureKey: "checkout-score-pulse",
        configKey: "checkoutScorePulse",
        title: "Duplicate",
        initialize: () => () => {},
      },
    ],
  });

  const features = registry.getDefinitions();

  assert.equal(features.length, defaultFeatureDefinitions.length);
  assert.equal(features[0].title, "Checkout Score Pulse");
});

test("feature registry lists runtime metadata against snapshots", () => {
  const registry = createFeatureRegistry();
  const listed = registry.listFeatures({
    features: {
      "checkout-score-pulse": {
        enabled: true,
        mounted: true,
        config: { effect: "scale" },
      },
      "checkout-board-targets": {
        enabled: false,
        mounted: false,
        config: { effect: "pulse" },
      },
    },
  });

  assert.equal(listed.length, defaultFeatureDefinitions.length);
  assert.equal(listed[0].featureKey, "checkout-score-pulse");
  assert.equal(listed[0].enabled, true);
  assert.equal(listed[0].mounted, true);
  assert.deepEqual(listed[0].variants, ["x01"]);
  assert.equal(listed.some((feature) => feature.featureKey === "tv-board-zoom"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "turn-start-sweep"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "triple-double-bull-hits"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "cricket-highlighter"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "cricket-grid-fx"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "dart-marker-emphasis"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "dart-marker-darts"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "remove-darts-notification"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "single-bull-sound"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "turn-points-count"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "x01-score-progress"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "winner-fireworks"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-x01"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-shanghai"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-bermuda"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-cricket"), true);
  assert.equal(listed.some((feature) => feature.featureKey === "theme-bull-off"), true);
  assert.equal(
    listed.find((feature) => feature.featureKey === "checkout-board-targets")?.enabled,
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
