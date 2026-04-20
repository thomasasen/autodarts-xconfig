import test from "node:test";
import assert from "node:assert/strict";

import {
  createHardResetRuntimeConfig,
  createRecommendedRuntimeConfig,
  createRuntimeConfig,
  normalizeRuntimeConfig,
} from "../../src/config/runtime-config.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";

function getStoredFeatureConfig(storedConfig, configKey) {
  if (String(configKey || "").startsWith("themes.")) {
    const themeKey = String(configKey).split(".")[1];
    return storedConfig.features?.themes?.[themeKey] || null;
  }

  return storedConfig.features?.[configKey] || null;
}

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
  assert.equal(typeof config.features.x01ScoreProgress, "object");
  assert.equal(typeof config.features.winnerFireworks, "object");
  assert.equal(typeof config.features.themes, "object");
  assert.equal(typeof config.features.themes.x01, "object");
  assert.equal(typeof config.features.themes.gotcha, "object");
  assert.equal(typeof config.features.themes.x01TwoPlayer, "object");
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
  assert.equal(config.featureToggles.x01ScoreProgress, false);
  assert.equal(config.featureToggles.winnerFireworks, false);
  assert.equal(config.featureToggles["themes.x01"], false);
  assert.equal(config.featureToggles["themes.gotcha"], false);
  assert.equal(config.featureToggles["themes.x01TwoPlayer"], false);
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
  assert.equal(config.features.x01ScoreProgress.colorTheme, "checkout-focus");
  assert.equal(config.features.x01ScoreProgress.barSize, "standard");
  assert.equal(config.features.x01ScoreProgress.effect, "pulse-core");
  assert.equal(config.features.turnPointsCount.flashOnChange, true);
  assert.equal(config.features.turnPointsCount.flashMode, "on-change");
  assert.equal(config.features.checkoutBoardTargets.visualPreset, "focus");
  assert.equal(config.features.checkoutBoardTargets.segmentStyle, "surface-outline");
  assert.equal(config.features.checkoutBoardTargets.singleRing, "both");
  assert.equal(config.features.checkoutBoardTargets.colorTheme, "amber");
  assert.equal(config.features.checkoutBoardTargets.targetSelectionMode, "next");
  assert.equal(config.features.tvBoardZoom.checkoutZoomTarget, "finish-only");
  assert.equal(config.features.tvBoardZoom.t20SetupZoomEnabled, true);
});

test("createHardResetRuntimeConfig disables every feature and clears theme images", () => {
  const config = createHardResetRuntimeConfig({
    features: {
      themes: {
        globalTypography: {
          backgroundImageDataUrl: "data:image/png;base64,GGGG",
          backgroundAssetKey: "cyberpunk",
        },
        x01: {
          backgroundImageDataUrl: "data:image/png;base64,AAAA",
        },
      },
    },
  });

  defaultFeatureDefinitions.forEach((definition) => {
    assert.equal(config.featureToggles[definition.configKey], false, definition.configKey);
    assert.equal(getStoredFeatureConfig(config, definition.configKey).enabled, false, definition.configKey);
  });

  assert.equal(config.features.checkoutScorePulse.enabled, false);
  assert.equal(config.features.checkoutScorePulse.effect, "scale");
  assert.equal(config.features.checkoutBoardTargets.enabled, false);
  assert.equal(config.features.tvBoardZoom.enabled, false);
  assert.equal(config.features.tripleDoubleBullHits.enabled, false);
  assert.equal(config.features.cricketGridFx.enabled, false);
  assert.equal(config.features.themes.globalTypography.enabled, false);
  assert.equal(config.features.themes.globalTypography.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.globalTypography.backgroundAssetKey, "");
  assert.equal(config.features.themes.x01.enabled, false);
  assert.equal(config.features.themes.x01.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.gotcha.enabled, false);
  assert.equal(config.features.themes.gotcha.deltaPlacement, "below");
  assert.equal(config.features.themes.gotcha.deltaAlignment, "right");
  assert.equal(config.features.themes.gotcha.deltaItalic, true);
  assert.equal(config.features.themes.gotcha.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.x01TwoPlayer.enabled, false);
  assert.equal(config.features.themes.x01TwoPlayer.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.shanghai.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.bullOff.debug, false);
});

test("createRecommendedRuntimeConfig applies the documented recommended profile and preserves theme images", () => {
  const config = createRecommendedRuntimeConfig({
    features: {
      themes: {
        globalTypography: {
          backgroundImageDataUrl: "data:image/png;base64,GGGG",
        },
        x01: {
          backgroundImageDataUrl: "data:image/png;base64,AAAA",
        },
        cricket: {
          backgroundImageDataUrl: "data:image/png;base64,BBBB",
        },
      },
    },
  });

  defaultFeatureDefinitions.forEach((definition) => {
    const expectedEnabled =
      definition.featureKey === "theme-global-typography" ||
      definition.featureKey === "theme-x01-2player"
        ? false
        : true;
    assert.equal(config.featureToggles[definition.configKey], expectedEnabled, definition.configKey);
    assert.equal(
      getStoredFeatureConfig(config, definition.configKey).enabled,
      expectedEnabled,
      definition.configKey
    );
  });

  assert.equal(config.features.checkoutScorePulse.enabled, true);
  assert.equal(config.features.checkoutScorePulse.effect, "scale");
  assert.equal(config.features.checkoutBoardTargets.visualPreset, "signal");
  assert.equal(config.features.checkoutBoardTargets.colorTheme, "cyan");
  assert.equal(config.features.checkoutBoardTargets.segmentStyle, "surface-only");
  assert.equal(config.features.tvBoardZoom.checkoutZoomEnabled, true);
  assert.equal(config.features.tvBoardZoom.t20SetupZoomEnabled, true);
  assert.equal(config.features.styleCheckoutSuggestions.style, "stripe");
  assert.equal(config.features.styleCheckoutSuggestions.labelText, "CHECKOUT");
  assert.equal(config.features.styleCheckoutSuggestions.colorTheme, "amber");
  assert.equal(config.features.turnStartSweep.sweepStyle, "standard");
  assert.equal(config.features.turnStartSweep.durationMs, 420);
  assert.equal(config.features.tripleDoubleBullHits.colorTheme, "kind-signal");
  assert.equal(config.features.tripleDoubleBullHits.animationStyle, "electric-arc");
  assert.equal(config.features.cricketHighlighter.irrelevantBoardDimStyle, "hatch");
  assert.equal(config.features.cricketGridFx.intensity, "normal");
  assert.equal(config.features.cricketGridFx.pressureOverlay, true);
  assert.equal(config.features.dartMarkerEmphasis.effect, "pulse");
  assert.equal(config.features.dartMarkerEmphasis.opacityPercent, 100);
  assert.equal(config.features.dartMarkerEmphasis.outline, "weiss");
  assert.equal(config.features.dartMarkerDarts.hideOriginalMarkers, true);
  assert.equal(config.features.dartMarkerDarts.enableWobble, true);
  assert.equal(config.features.removeDartsNotification.imageSize, "large");
  assert.equal(config.features.singleBullSound.volume, 0.9);
  assert.equal(config.features.turnPointsCount.flashOnChange, false);
  assert.equal(config.features.winnerFireworks.style, "fireworks");
  assert.equal(config.features.winnerFireworks.intensity, "standard");
  assert.equal(config.features.x01ScoreProgress.barSize, "breit");
  assert.equal(config.features.x01ScoreProgress.effect, "off");
  assert.equal(config.features.themes.x01.enabled, true);
  assert.equal(config.features.themes.gotcha.enabled, true);
  assert.equal(config.features.themes.gotcha.deltaPlacement, "below");
  assert.equal(config.features.themes.gotcha.deltaAlignment, "right");
  assert.equal(config.features.themes.gotcha.deltaItalic, true);
  assert.equal(config.features.themes.x01TwoPlayer.enabled, false);
  assert.equal(config.features.themes.shanghai.enabled, true);
  assert.equal(config.features.themes.cricket.enabled, true);
  assert.equal(config.features.themes.globalTypography.enabled, false);
  assert.equal(
    config.features.themes.globalTypography.backgroundImageDataUrl,
    "data:image/png;base64,GGGG"
  );
  assert.equal(config.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,AAAA");
  assert.equal(config.features.themes.gotcha.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.x01TwoPlayer.backgroundImageDataUrl, "");
  assert.equal(config.features.themes.cricket.backgroundImageDataUrl, "data:image/png;base64,BBBB");
  assert.equal(config.features.themes.bullOff.backgroundImageDataUrl, "");
});

test("createRuntimeConfig normalizes wave-2 feature options", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      checkoutBoardTargets: {
        visualPreset: "SIGNAL",
        segmentStyle: "SURFACE-ONLY",
        effect: "GLOW",
        singleRing: "INNER",
        targetSelectionMode: "ALL",
      },
      tvBoardZoom: {
        zoomLevel: "3.15",
        zoomSpeed: "SCHNELL",
        checkoutZoomTarget: "ROUTE-FIRST",
        t20SetupZoomEnabled: "false",
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
        flashOnChange: "false",
        flashMode: "PERMANENT",
      },
      x01ScoreProgress: {
        colorTheme: "ICE-CIRCUIT",
        thresholdColorMode: "TRAFFIC-LIGHT",
        barSize: "EXTRABREIT",
        effect: "GLASS-CHARGE",
      },
      winnerFireworks: {
        style: "FIREWORKS",
        colorTheme: "ICE",
        intensity: "STARK",
        includeBullOut: "false",
        pointerDismiss: "false",
      },
      themes: {
        globalTypography: {
          enabled: "true",
          fontPreset: "fragment-mono",
          applyTo: "scores-and-names",
          accentColor: "#abc",
          scoreColor: "#123456",
          secondaryTextColor: "#fed",
          throwLabelColor: "#0F0f0f",
          backgroundDisplayMode: "tile",
          backgroundOpacity: "70",
          playerFieldTransparency: "45",
          backgroundImageDataUrl: "data:image/png;base64,GGGG",
          backgroundAssetKey: "matrix",
        },
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

  assert.equal(runtimeConfig.getFeatureConfig("checkoutBoardTargets").visualPreset, "signal");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutBoardTargets").segmentStyle, "surface-only");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutBoardTargets").singleRing, "both");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutBoardTargets").targetSelectionMode, "all");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").zoomLevel, 3.15);
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").zoomSpeed, "schnell");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").checkoutZoomTarget, "route-first");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").t20SetupZoomEnabled, false);
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
  assert.equal(runtimeConfig.getFeatureConfig("turnPointsCount").flashOnChange, false);
  assert.equal(runtimeConfig.getFeatureConfig("turnPointsCount").flashMode, "permanent");
  assert.equal(runtimeConfig.getFeatureConfig("x01ScoreProgress").colorTheme, "ice-circuit");
  assert.equal(runtimeConfig.getFeatureConfig("x01ScoreProgress").barSize, "extrabreit");
  assert.equal(runtimeConfig.getFeatureConfig("x01ScoreProgress").effect, "glass-charge");
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").enabled, true);
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").fontPreset, "fragment-mono");
  assert.deepEqual(runtimeConfig.getFeatureConfig("themes.globalTypography").applyTo, ["scores", "names"]);
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").accentColor, "#AABBCC");
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").scoreColor, "#123456");
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").secondaryTextColor,
    "#FFEEDD"
  );
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").throwLabelColor,
    "#0F0F0F"
  );
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").backgroundDisplayMode,
    "tile"
  );
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").backgroundOpacity, 70);
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").playerFieldTransparency,
    45
  );
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").backgroundImageDataUrl,
    "data:image/png;base64,GGGG"
  );
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").backgroundAssetKey,
    "matrix"
  );
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

test("createRuntimeConfig maps legacy checkout-board-targets effects to visual presets", () => {
  const steadyConfig = createRuntimeConfig({
    features: {
      checkoutBoardTargets: {
        effect: "GLOW",
      },
    },
  });
  const signalConfig = createRuntimeConfig({
    features: {
      checkoutBoardTargets: {
        effect: "blink",
      },
    },
  });

  assert.equal(steadyConfig.getFeatureConfig("checkoutBoardTargets").visualPreset, "steady");
  assert.equal(signalConfig.getFeatureConfig("checkoutBoardTargets").visualPreset, "signal");
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

test("x01-score-progress falls back to thresholdColorMode when colorTheme is missing", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01ScoreProgress: {
        colorTheme: "",
        thresholdColorMode: "danger-endgame",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("x01ScoreProgress").colorTheme, "danger-endgame");
});

test("x01-score-progress maps legacy effect keys to the reduced effect set", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01ScoreProgress: {
        effect: "spark-trail",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("x01ScoreProgress").effect, "ghost-trail");
});

test("x01-score-progress maps retired electric aliases to signal-sweep", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01ScoreProgress: {
        effect: "ELECTRIC-SURGE",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("x01ScoreProgress").effect, "signal-sweep");
  const arcBurstConfig = createRuntimeConfig({
    features: {
      x01ScoreProgress: {
        effect: "arc-burst",
      },
    },
  });
  assert.equal(arcBurstConfig.getFeatureConfig("x01ScoreProgress").effect, "signal-sweep");
});

test("triple-double-bull-hits accepts electric-arc as animation style option", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      tripleDoubleBullHits: {
        animationStyle: "ELECTRIC-ARC",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("tripleDoubleBullHits").animationStyle, "electric-arc");
});

test("turn-points-count maps legacy flashPermanent flag to permanent flash mode", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      turnPointsCount: {
        flashPermanent: true,
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("turnPointsCount").flashMode, "permanent");
});

test("x01-score-progress drops retired design preset fields from normalized config", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01ScoreProgress: {
        designPreset: "liquid-glass",
        colorTheme: "checkout-focus",
      },
    },
  });

  const featureConfig = runtimeConfig.getFeatureConfig("x01ScoreProgress");
  assert.equal(Object.hasOwn(featureConfig, "designPreset"), false);

  const normalized = runtimeConfig.getNormalized();
  assert.equal(
    Object.hasOwn(normalized.features.x01ScoreProgress, "designPreset"),
    false
  );
});
