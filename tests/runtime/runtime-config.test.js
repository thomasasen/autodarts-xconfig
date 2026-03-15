import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeConfig, normalizeRuntimeConfig } from "../../src/config/runtime-config.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";

test("normalizeRuntimeConfig contains wave-2 feature defaults", () => {
  const config = normalizeRuntimeConfig();

  assert.equal(typeof config.features.checkoutBoardTargets, "object");
  assert.equal(typeof config.features.tvBoardZoom, "object");
  assert.equal(typeof config.features.styleCheckoutSuggestions, "object");
  assert.equal(typeof config.features.averageTrendArrow, "object");
  assert.equal(typeof config.features.turnStartSweep, "object");
  assert.equal(typeof config.features.tripleDoubleBullHits, "object");
  assert.equal(typeof config.features.cricketHighlighter, "object");
  assert.equal(typeof config.features.cricketGridFx, "object");
  assert.equal(typeof config.features.dartMarkerEmphasis, "object");
  assert.equal(typeof config.features.dartMarkerDarts, "object");
  assert.equal(typeof config.features.removeDartsNotification, "object");
  assert.equal(typeof config.features.singleBullSound, "object");
  assert.equal(typeof config.features.turnPointsCount, "object");
  assert.equal(typeof config.features.winnerFireworks, "object");
  assert.equal(typeof config.features.themes, "object");
  assert.equal(typeof config.features.themes.x01, "object");
  assert.equal(typeof config.features.themes.shanghai, "object");
  assert.equal(typeof config.features.themes.bermuda, "object");
  assert.equal(typeof config.features.themes.cricket, "object");
  assert.equal(typeof config.features.themes.bullOff, "object");
  assert.equal(config.featureToggles.checkoutBoardTargets, false);
  assert.equal(config.featureToggles.tvBoardZoom, false);
  assert.equal(config.featureToggles.turnStartSweep, false);
  assert.equal(config.featureToggles.tripleDoubleBullHits, false);
  assert.equal(config.featureToggles.cricketHighlighter, false);
  assert.equal(config.featureToggles.cricketGridFx, false);
  assert.equal(config.featureToggles.dartMarkerEmphasis, false);
  assert.equal(config.featureToggles.dartMarkerDarts, false);
  assert.equal(config.featureToggles.removeDartsNotification, false);
  assert.equal(config.featureToggles.singleBullSound, false);
  assert.equal(config.featureToggles.turnPointsCount, false);
  assert.equal(config.featureToggles.winnerFireworks, false);
  assert.equal(config.featureToggles["themes.x01"], false);
  assert.equal(config.featureToggles["themes.shanghai"], false);
  assert.equal(config.featureToggles["themes.bermuda"], false);
  assert.equal(config.featureToggles["themes.cricket"], false);
  assert.equal(config.featureToggles["themes.bullOff"], false);
  assert.equal(config.features.tripleDoubleBullHits.colorTheme, "kind-signal");
  assert.equal(config.features.tripleDoubleBullHits.animationStyle, "charge-release");
  assert.equal(config.features.cricketHighlighter.showOpenObjectives, false);
  assert.equal(config.features.cricketHighlighter.irrelevantBoardDimStyle, "smoke");
  assert.equal(config.features.cricketHighlighter.dimIrrelevantBoardTargets, true);
  assert.equal(config.features.dartMarkerDarts.enableShadow, true);
  assert.equal(config.features.dartMarkerDarts.enableWobble, true);
});

test("createRuntimeConfig normalizes wave-2 feature options", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      checkoutBoardTargets: {
        effect: "GLOW",
        singleRing: "INNER",
      },
      tvBoardZoom: {
        zoomLevel: "3.15",
        zoomSpeed: "SCHNELL",
      },
      styleCheckoutSuggestions: {
        style: "STRIPE",
        labelText: "finish",
      },
      averageTrendArrow: {
        durationMs: "500",
        size: "gro" + "\u00df",
      },
      turnStartSweep: {
        durationMs: "620",
        sweepStyle: "STRONG",
      },
      tripleDoubleBullHits: {
        colorTheme: "EMBER-RUSH",
        animationStyle: "CHARGE-RELEASE",
      },
      cricketHighlighter: {
        showOpenTargets: "false",
        showDeadTargets: "false",
        irrelevantBoardDimStyle: "MASK",
        dimIrrelevantBoardTargets: "false",
        colorTheme: "HIGH-CONTRAST",
        intensity: "STRONG",
      },
      cricketGridFx: {
        rowWave: "false",
        badgeBeacon: "true",
        markProgress: "false",
        threatEdge: "true",
        scoringLane: "false",
        deadRowCollapse: "true",
        deltaChips: "false",
        hitSpark: "true",
        roundTransitionWipe: "false",
        opponentPressureOverlay: "true",
        colorTheme: "HIGH-CONTRAST",
        intensity: "STRONG",
      },
      dartMarkerEmphasis: {
        size: "9",
        color: "rgb(248, 113, 113)",
        effect: "PULSE",
        opacityPercent: "65",
        outline: "SCHWARZ",
      },
      dartMarkerDarts: {
        design: "YELLOW",
        animateDarts: "false",
        sizePercent: "115",
        hideOriginalMarkers: "true",
        enableShadow: "false",
        enableWobble: "false",
        flightSpeed: "CINEMATIC",
      },
      removeDartsNotification: {
        imageSize: "LARGE",
        pulseAnimation: "false",
        pulseScale: "1.08",
      },
      singleBullSound: {
        volume: "0.75",
        cooldownMs: "1000",
        pollIntervalMs: "1200",
      },
      turnPointsCount: {
        durationMs: "650",
      },
      winnerFireworks: {
        style: "FIREWORKS",
        colorTheme: "ICE",
        intensity: "STARK",
        includeBullOut: "false",
        pointerDismiss: "false",
      },
      themes: {
        x01: {
          showAvg: "false",
          backgroundDisplayMode: "FIT",
          backgroundOpacity: "40",
          playerFieldTransparency: "30",
          backgroundImageDataUrl: "data:image/png;base64,AAAA",
        },
        shanghai: {
          showAvg: "0",
          backgroundDisplayMode: "tile",
          backgroundOpacity: "70",
          playerFieldTransparency: "45",
          backgroundImageDataUrl: "invalid-url",
        },
        bermuda: {
          backgroundDisplayMode: "stretch",
          backgroundOpacity: "55",
          playerFieldTransparency: "15",
        },
        cricket: {
          showAvg: "true",
          backgroundDisplayMode: "center",
          backgroundOpacity: "85",
          playerFieldTransparency: "5",
        },
        bullOff: {
          contrastPreset: "HIGH",
          backgroundDisplayMode: "fill",
          backgroundOpacity: "25",
          playerFieldTransparency: "10",
        },
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("checkoutBoardTargets").effect, "glow");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutBoardTargets").singleRing, "inner");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").zoomLevel, 3.15);
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").zoomSpeed, "schnell");
  assert.equal(runtimeConfig.getFeatureConfig("styleCheckoutSuggestions").style, "stripe");
  assert.equal(runtimeConfig.getFeatureConfig("styleCheckoutSuggestions").labelText, "FINISH");
  assert.equal(runtimeConfig.getFeatureConfig("averageTrendArrow").durationMs, 500);
  assert.equal(runtimeConfig.getFeatureConfig("averageTrendArrow").size, "gross");
  assert.equal(runtimeConfig.getFeatureConfig("turnStartSweep").durationMs, 620);
  assert.equal(runtimeConfig.getFeatureConfig("turnStartSweep").sweepStyle, "strong");
  assert.equal(runtimeConfig.getFeatureConfig("tripleDoubleBullHits").colorTheme, "ember-rush");
  assert.equal(
    runtimeConfig.getFeatureConfig("tripleDoubleBullHits").animationStyle,
    "charge-release"
  );
  assert.equal(runtimeConfig.getFeatureConfig("cricketHighlighter").showOpenObjectives, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketHighlighter").showDeadObjectives, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketHighlighter").irrelevantBoardDimStyle, "mask");
  assert.equal(
    runtimeConfig.getFeatureConfig("cricketHighlighter").dimIrrelevantBoardTargets,
    true
  );
  assert.equal(runtimeConfig.getFeatureConfig("cricketHighlighter").colorTheme, "high-contrast");
  assert.equal(runtimeConfig.getFeatureConfig("cricketHighlighter").intensity, "strong");
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").rowWave, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").badgeBeacon, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").markProgress, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").pressureEdge, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").scoringStripe, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").deadRowMuted, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").pressureOverlay, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").colorTheme, "high-contrast");
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridFx").intensity, "strong");
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerEmphasis").size, 9);
  assert.equal(
    runtimeConfig.getFeatureConfig("dartMarkerEmphasis").color,
    "rgb(248, 113, 113)"
  );
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerEmphasis").effect, "pulse");
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerEmphasis").opacityPercent, 65);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerEmphasis").outline, "schwarz");
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").design, "yellow");
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").animateDarts, false);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").sizePercent, 115);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").hideOriginalMarkers, true);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").enableShadow, false);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").enableWobble, false);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerDarts").flightSpeed, "cinematic");
  assert.equal(runtimeConfig.getFeatureConfig("removeDartsNotification").imageSize, "large");
  assert.equal(runtimeConfig.getFeatureConfig("removeDartsNotification").pulseAnimation, false);
  assert.equal(runtimeConfig.getFeatureConfig("removeDartsNotification").pulseScale, 1.08);
  assert.equal(runtimeConfig.getFeatureConfig("singleBullSound").volume, 0.75);
  assert.equal(runtimeConfig.getFeatureConfig("singleBullSound").cooldownMs, 1000);
  assert.equal(runtimeConfig.getFeatureConfig("singleBullSound").pollIntervalMs, 1200);
  assert.equal(runtimeConfig.getFeatureConfig("turnPointsCount").durationMs, 650);
  assert.equal(runtimeConfig.getFeatureConfig("winnerFireworks").style, "fireworks");
  assert.equal(runtimeConfig.getFeatureConfig("winnerFireworks").colorTheme, "ice");
  assert.equal(runtimeConfig.getFeatureConfig("winnerFireworks").intensity, "stark");
  assert.equal(runtimeConfig.getFeatureConfig("winnerFireworks").includeBullOut, false);
  assert.equal(runtimeConfig.getFeatureConfig("winnerFireworks").pointerDismiss, false);
  assert.equal(runtimeConfig.getFeatureConfig("themes.x01").showAvg, false);
  assert.equal(runtimeConfig.getFeatureConfig("themes.x01").backgroundDisplayMode, "fit");
  assert.equal(runtimeConfig.getFeatureConfig("themes.x01").backgroundOpacity, 40);
  assert.equal(runtimeConfig.getFeatureConfig("themes.x01").playerFieldTransparency, 30);
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.x01").backgroundImageDataUrl,
    "data:image/png;base64,AAAA"
  );
  assert.equal(runtimeConfig.getFeatureConfig("themes.shanghai").showAvg, false);
  assert.equal(runtimeConfig.getFeatureConfig("themes.shanghai").backgroundDisplayMode, "tile");
  assert.equal(runtimeConfig.getFeatureConfig("themes.shanghai").backgroundOpacity, 70);
  assert.equal(runtimeConfig.getFeatureConfig("themes.shanghai").playerFieldTransparency, 45);
  assert.equal(runtimeConfig.getFeatureConfig("themes.shanghai").backgroundImageDataUrl, "");
  assert.equal(runtimeConfig.getFeatureConfig("themes.bermuda").backgroundDisplayMode, "stretch");
  assert.equal(runtimeConfig.getFeatureConfig("themes.bermuda").backgroundOpacity, 55);
  assert.equal(runtimeConfig.getFeatureConfig("themes.bermuda").playerFieldTransparency, 15);
  assert.equal(runtimeConfig.getFeatureConfig("themes.cricket").showAvg, true);
  assert.equal(runtimeConfig.getFeatureConfig("themes.cricket").backgroundDisplayMode, "center");
  assert.equal(runtimeConfig.getFeatureConfig("themes.cricket").backgroundOpacity, 85);
  assert.equal(runtimeConfig.getFeatureConfig("themes.cricket").playerFieldTransparency, 5);
  assert.equal(runtimeConfig.getFeatureConfig("themes.bullOff").contrastPreset, "high");
  assert.equal(runtimeConfig.getFeatureConfig("themes.bullOff").backgroundDisplayMode, "fill");
});

test("normalized feature configs expose a boolean debug flag for every registered script", () => {
  const runtimeConfig = createRuntimeConfig();

  defaultFeatureDefinitions.forEach((definition) => {
    const normalizedFeatureConfig = runtimeConfig.getFeatureConfig(definition.configKey);
    assert.equal(
      typeof normalizedFeatureConfig.debug,
      "boolean",
      `missing debug boolean for ${definition.configKey}`
    );
  });
});

test("triple-double-bull-hits falls back to defaults for invalid theme/style values", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      tripleDoubleBullHits: {
        colorTheme: "invalid-theme",
        animationStyle: "invalid-animation",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("tripleDoubleBullHits").colorTheme, "kind-signal");
  assert.equal(
    runtimeConfig.getFeatureConfig("tripleDoubleBullHits").animationStyle,
    "charge-release"
  );
});

test("triple-double-bull-hits keeps default kind-signal when only legacy hitColorMode is provided", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      tripleDoubleBullHits: {
        hitColorMode: "theme-presets",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("tripleDoubleBullHits").colorTheme, "kind-signal");
});

test("cricket highlighter dim style supports enum values and legacy boolean mapping", () => {
  const defaults = createRuntimeConfig();
  assert.equal(defaults.getFeatureConfig("cricketHighlighter").irrelevantBoardDimStyle, "smoke");
  assert.equal(defaults.getFeatureConfig("cricketHighlighter").dimIrrelevantBoardTargets, true);

  const explicitOff = createRuntimeConfig({
    features: {
      cricketHighlighter: {
        irrelevantBoardDimStyle: "off",
      },
    },
  });
  assert.equal(explicitOff.getFeatureConfig("cricketHighlighter").irrelevantBoardDimStyle, "off");
  assert.equal(explicitOff.getFeatureConfig("cricketHighlighter").dimIrrelevantBoardTargets, false);

  const invalidStyle = createRuntimeConfig({
    features: {
      cricketHighlighter: {
        irrelevantBoardDimStyle: "unknown-style",
      },
    },
  });
  assert.equal(invalidStyle.getFeatureConfig("cricketHighlighter").irrelevantBoardDimStyle, "smoke");
  assert.equal(invalidStyle.getFeatureConfig("cricketHighlighter").dimIrrelevantBoardTargets, true);

  const legacyDisabled = createRuntimeConfig({
    features: {
      cricketHighlighter: {
        dimIrrelevantBoardTargets: false,
      },
    },
  });
  assert.equal(legacyDisabled.getFeatureConfig("cricketHighlighter").irrelevantBoardDimStyle, "off");
  assert.equal(legacyDisabled.getFeatureConfig("cricketHighlighter").dimIrrelevantBoardTargets, false);

  const legacyEnabled = createRuntimeConfig({
    features: {
      cricketHighlighter: {
        dimIrrelevantBoardTargets: true,
      },
    },
  });
  assert.equal(legacyEnabled.getFeatureConfig("cricketHighlighter").irrelevantBoardDimStyle, "smoke");
  assert.equal(legacyEnabled.getFeatureConfig("cricketHighlighter").dimIrrelevantBoardTargets, true);
});

test("runtime config keeps unknown feature fields for forward-compatible setting removal", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      themes: {
        x01: {
          showAvg: false,
          retiredBackgroundFlag: "legacy-value",
        },
      },
    },
  });

  const themeConfig = runtimeConfig.getFeatureConfig("themes.x01");
  assert.equal(themeConfig.showAvg, false);
  assert.equal(themeConfig.retiredBackgroundFlag, "legacy-value");

  const normalized = runtimeConfig.getNormalized();
  assert.equal(normalized.features.themes.x01.retiredBackgroundFlag, "legacy-value");
});
