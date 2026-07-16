import test from "node:test";
import assert from "node:assert/strict";

import {
  createHardResetRuntimeConfig,
  createRecommendedRuntimeConfig,
  createRuntimeConfig,
  normalizeRuntimeConfig,
} from "../../src/config/runtime-config.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";

test("runtime config exposes a monotonic revision for cache invalidation", () => {
  const runtimeConfig = createRuntimeConfig();

  assert.equal(runtimeConfig.getRevision(), 0);
  runtimeConfig.setFeatureEnabled("checkoutScoreHighlight", true);
  assert.equal(runtimeConfig.getRevision(), 1);
  runtimeConfig.update({
    features: {
      checkoutScoreHighlight: {
        effect: "blink",
      },
    },
  });
  assert.equal(runtimeConfig.getRevision(), 2);
});

function getStoredFeatureConfig(storedConfig, configKey) {
  if (String(configKey || "").startsWith("themes.")) {
    const themeKey = String(configKey).split(".")[1];
    return storedConfig.features?.themes?.[themeKey] || null;
  }

  return storedConfig.features?.[configKey] || null;
}

test("normalizeRuntimeConfig contains wave-2 feature defaults", () => {
  const config = normalizeRuntimeConfig();

  assert.equal(typeof config.features.checkoutTargetHighlights, "object");
  assert.equal(typeof config.features.tvBoardZoom, "object");
  assert.equal(typeof config.features.checkoutSuggestionStyles, "object");
  assert.equal(typeof config.features.avgTrendArrow, "object");
  assert.equal(typeof config.features.activePlayerSweep, "object");
  assert.equal(typeof config.features.specialHitHighlights, "object");
  assert.equal(typeof config.features.cricketTargetHighlighter, "object");
  assert.equal(typeof config.features.cricketGridStatusEffects, "object");
  assert.equal(typeof config.features.dartboardMarkerHighlight, "object");
  assert.equal(typeof config.features.dartMarkerReplacer, "object");
  assert.equal(typeof config.features.takeOutDartsAlert, "object");
  assert.equal(typeof config.features.singleBullHitSound, "object");
  assert.equal(typeof config.features.turnScoreCounter, "object");
  assert.equal(typeof config.features.x01RemainingScoreBar, "object");
  assert.equal(typeof config.features.winnerCelebrationEffect, "object");
  assert.equal(typeof config.features.themes, "object");
  assert.equal(typeof config.features.themes.x01, "object");
  assert.equal(typeof config.features.themes.gotcha, "object");
  assert.equal(typeof config.features.themes.x01TwoPlayer, "object");
  assert.equal(typeof config.features.themes.shanghai, "object");
  assert.equal(typeof config.features.themes.bermuda, "object");
  assert.equal(typeof config.features.themes.cricket, "object");
  assert.equal(typeof config.features.themes.bullOff, "object");
  assert.equal(config.featureToggles.checkoutTargetHighlights, false);
  assert.equal(config.featureToggles.tvBoardZoom, false);
  assert.equal(config.featureToggles.activePlayerSweep, false);
  assert.equal(config.featureToggles.specialHitHighlights, false);
  assert.equal(config.featureToggles.cricketTargetHighlighter, false);
  assert.equal(config.featureToggles.cricketGridStatusEffects, false);
  assert.equal(config.featureToggles.dartboardMarkerHighlight, false);
  assert.equal(config.featureToggles.dartMarkerReplacer, false);
  assert.equal(config.featureToggles.takeOutDartsAlert, false);
  assert.equal(config.featureToggles.singleBullHitSound, false);
  assert.equal(config.featureToggles.turnScoreCounter, false);
  assert.equal(config.featureToggles.x01RemainingScoreBar, false);
  assert.equal(config.featureToggles.winnerCelebrationEffect, false);
  assert.equal(config.featureToggles["themes.x01"], false);
  assert.equal(config.featureToggles["themes.gotcha"], false);
  assert.equal(config.featureToggles["themes.x01TwoPlayer"], false);
  assert.equal(config.featureToggles["themes.shanghai"], false);
  assert.equal(config.featureToggles["themes.bermuda"], false);
  assert.equal(config.featureToggles["themes.cricket"], false);
  assert.equal(config.featureToggles["themes.bullOff"], false);
  assert.equal(config.features.specialHitHighlights.colorTheme, "kind-signal");
  assert.equal(config.features.specialHitHighlights.animationStyle, "pop-hit");
  assert.equal(config.features.cricketTargetHighlighter.showOpenObjectives, false);
  assert.equal(config.features.cricketTargetHighlighter.irrelevantBoardDimStyle, "smoke");
  assert.equal(config.features.cricketTargetHighlighter.dimIrrelevantBoardTargets, true);
  assert.equal(config.features.dartMarkerReplacer.enableShadow, true);
  assert.equal(config.features.dartMarkerReplacer.enableWobble, true);
  assert.equal(config.features.dartMarkerReplacer.sizePercent, 120);
  assert.equal(config.features.x01RemainingScoreBar.colorTheme, "checkout-focus");
  assert.equal(config.features.x01RemainingScoreBar.barSize, "standard");
  assert.equal(config.features.x01RemainingScoreBar.effect, "bar-pulse");
  assert.equal(config.features.turnScoreCounter.durationMs, 3000);
  assert.equal(config.features.turnScoreCounter.countEffect, "smooth-count");
  assert.equal(config.features.turnScoreCounter.flashOnChange, true);
  assert.equal(config.features.turnScoreCounter.flashMode, "on-change");
  assert.equal(config.features.checkoutTargetHighlights.visualPreset, "soft-pulse");
  assert.equal(config.features.checkoutTargetHighlights.segmentStyle, "surface-outline");
  assert.equal(config.features.checkoutTargetHighlights.singleRing, "both");
  assert.equal(config.features.checkoutTargetHighlights.colorTheme, "amber");
  assert.equal(config.features.checkoutTargetHighlights.targetSelectionMode, "next");
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

  assert.equal(config.features.checkoutScoreHighlight.enabled, false);
  assert.equal(config.features.checkoutScoreHighlight.effect, "grow-only");
  assert.equal(config.features.checkoutTargetHighlights.enabled, false);
  assert.equal(config.features.tvBoardZoom.enabled, false);
  assert.equal(config.features.specialHitHighlights.enabled, false);
  assert.equal(config.features.cricketGridStatusEffects.enabled, false);
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
  assert.equal(config.features.themes.x01TwoPlayer.visualStyle, "studio");
  assert.equal(config.features.themes.x01TwoPlayer.colorScheme, "studio-mint");
  assert.equal(config.features.themes.x01TwoPlayer.activePlayerEmphasis, "standard");
  assert.equal(config.features.themes.x01TwoPlayer.informationDensity, "full");
  assert.equal(config.features.themes.x01TwoPlayer.identityDensity, "full");
  assert.equal(config.features.themes.x01TwoPlayer.playerNameLayout, "single-line");
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

  assert.equal(config.features.checkoutScoreHighlight.enabled, true);
  assert.equal(config.features.checkoutScoreHighlight.effect, "grow-only");
  assert.equal(config.features.checkoutTargetHighlights.visualPreset, "fast-blink");
  assert.equal(config.features.checkoutTargetHighlights.colorTheme, "cyan");
  assert.equal(config.features.checkoutTargetHighlights.segmentStyle, "surface-only");
  assert.equal(config.features.tvBoardZoom.checkoutZoomEnabled, true);
  assert.equal(config.features.tvBoardZoom.t20SetupZoomEnabled, true);
  assert.equal(config.features.checkoutSuggestionStyles.style, "stripe");
  assert.equal(config.features.checkoutSuggestionStyles.labelText, "CHECKOUT");
  assert.equal(config.features.checkoutSuggestionStyles.colorTheme, "amber");
  assert.equal(config.features.activePlayerSweep.sweepStyle, "standard");
  assert.equal(config.features.activePlayerSweep.durationMs, 420);
  assert.equal(config.features.specialHitHighlights.colorTheme, "kind-signal");
  assert.equal(config.features.specialHitHighlights.animationStyle, "electric-jolt");
  assert.equal(config.features.cricketTargetHighlighter.irrelevantBoardDimStyle, "hatch");
  assert.equal(config.features.cricketGridStatusEffects.intensity, "normal");
  assert.equal(config.features.cricketGridStatusEffects.pressureOverlay, true);
  assert.equal(config.features.dartboardMarkerHighlight.effect, "size-pulse");
  assert.equal(config.features.dartboardMarkerHighlight.opacityPercent, 100);
  assert.equal(config.features.dartboardMarkerHighlight.outline, "weiss");
  assert.equal(config.features.dartMarkerReplacer.hideOriginalMarkers, true);
  assert.equal(config.features.dartMarkerReplacer.enableWobble, true);
  assert.equal(config.features.dartMarkerReplacer.sizePercent, 120);
  assert.equal(config.features.takeOutDartsAlert.imageSize, "large");
  assert.equal(config.features.singleBullHitSound.volume, 0.9);
  assert.equal(config.features.turnScoreCounter.durationMs, 3000);
  assert.equal(config.features.turnScoreCounter.countEffect, "smooth-count");
  assert.equal(config.features.turnScoreCounter.flashOnChange, false);
  assert.equal(config.features.winnerCelebrationEffect.style, "top-fireworks");
  assert.equal(config.features.winnerCelebrationEffect.intensity, "standard");
  assert.equal(config.features.winnerCelebrationEffect.durationSeconds, 5);
  assert.equal(config.features.winnerCelebrationEffect.particleAmount, "optimiert");
  assert.equal(config.features.x01RemainingScoreBar.barSize, "breit");
  assert.equal(config.features.x01RemainingScoreBar.effect, "off");
  assert.equal(config.features.themes.x01.enabled, true);
  assert.equal(config.features.themes.gotcha.enabled, true);
  assert.equal(config.features.themes.gotcha.deltaPlacement, "below");
  assert.equal(config.features.themes.gotcha.deltaAlignment, "right");
  assert.equal(config.features.themes.gotcha.deltaItalic, true);
  assert.equal(config.features.themes.x01TwoPlayer.enabled, false);
  assert.equal(config.features.themes.x01TwoPlayer.visualStyle, "studio");
  assert.equal(config.features.themes.x01TwoPlayer.colorScheme, "studio-mint");
  assert.equal(config.features.themes.x01TwoPlayer.activePlayerEmphasis, "standard");
  assert.equal(config.features.themes.x01TwoPlayer.informationDensity, "full");
  assert.equal(config.features.themes.x01TwoPlayer.identityDensity, "full");
  assert.equal(config.features.themes.x01TwoPlayer.playerNameLayout, "single-line");
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

test("createRuntimeConfig normalizes x01 two-player theme presets and old configs", () => {
  const oldConfig = createRuntimeConfig({
    features: {
      themes: {
        x01TwoPlayer: {
          showAvg: false,
        },
      },
    },
  });
  const oldThemeConfig = oldConfig.getFeatureConfig("themes.x01TwoPlayer");
  assert.deepEqual(
    {
      visualStyle: oldThemeConfig.visualStyle,
      colorScheme: oldThemeConfig.colorScheme,
      activePlayerEmphasis: oldThemeConfig.activePlayerEmphasis,
      informationDensity: oldThemeConfig.informationDensity,
      identityDensity: oldThemeConfig.identityDensity,
      playerNameLayout: oldThemeConfig.playerNameLayout,
    },
    {
      visualStyle: "studio",
      colorScheme: "studio-mint",
      activePlayerEmphasis: "standard",
      informationDensity: "full",
      identityDensity: "full",
      playerNameLayout: "single-line",
    }
  );

  const normalized = createRuntimeConfig({
    features: {
      themes: {
        x01TwoPlayer: {
          visualStyle: "invalid",
          colorScheme: "remote-blue",
          activePlayerEmphasis: "maximum",
          informationDensity: "tiny",
          identityDensity: "hidden",
          playerNameLayout: "many-lines",
        },
      },
    },
  });
  const normalizedThemeConfig = normalized.getFeatureConfig("themes.x01TwoPlayer");
  assert.equal(normalizedThemeConfig.visualStyle, "studio");
  assert.equal(normalizedThemeConfig.colorScheme, "studio-mint");
  assert.equal(normalizedThemeConfig.activePlayerEmphasis, "standard");
  assert.equal(normalizedThemeConfig.informationDensity, "full");
  assert.equal(normalizedThemeConfig.identityDensity, "full");
  assert.equal(normalizedThemeConfig.playerNameLayout, "single-line");

  const retiredCompactConfig = createRuntimeConfig({
    features: { themes: { x01TwoPlayer: { identityDensity: "compact" } } },
  });
  assert.equal(
    retiredCompactConfig.getFeatureConfig("themes.x01TwoPlayer").identityDensity,
    "full"
  );
});

test("createRuntimeConfig normalizes wave-2 feature options", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      checkoutTargetHighlights: {
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
      checkoutSuggestionStyles: {
        style: "STRIPE",
        labelText: "finish",
      },
      avgTrendArrow: {
        durationMs: "500",
        size: "gro" + "\u00df",
      },
      activePlayerSweep: {
        durationMs: "620",
        sweepStyle: "STRONG",
      },
      specialHitHighlights: {
        colorTheme: "EMBER-RUSH",
        animationStyle: "CHARGE-RELEASE",
      },
      cricketTargetHighlighter: {
        showOpenTargets: "false",
        showDeadTargets: "false",
        irrelevantBoardDimStyle: "MASK",
        dimIrrelevantBoardTargets: "false",
        colorTheme: "HIGH-CONTRAST",
        intensity: "STRONG",
      },
      cricketGridStatusEffects: {
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
      dartboardMarkerHighlight: {
        size: "9",
        color: "rgb(248, 113, 113)",
        effect: "PULSE",
        opacityPercent: "65",
        outline: "SCHWARZ",
      },
      dartMarkerReplacer: {
        design: "YELLOW",
        animateDarts: "false",
        sizePercent: "115",
        hideOriginalMarkers: "true",
        enableShadow: "false",
        enableWobble: "false",
        flightSpeed: "CINEMATIC",
      },
      takeOutDartsAlert: {
        imageSize: "LARGE",
        pulseAnimation: "false",
        pulseScale: "1.08",
      },
      singleBullHitSound: {
        volume: "0.75",
        cooldownMs: "1000",
        pollIntervalMs: "1200",
      },
      turnScoreCounter: {
        durationMs: "1000",
        countEffect: "ODOMETER",
        flashOnChange: "false",
        flashMode: "PERMANENT",
      },
      x01RemainingScoreBar: {
        colorTheme: "ICE-CIRCUIT",
        thresholdColorMode: "TRAFFIC-LIGHT",
        barSize: "EXTRABREIT",
        effect: "GLASS-CHARGE",
      },
      winnerCelebrationEffect: {
        style: "FIREWORKS",
        colorTheme: "ICE",
        intensity: "STARK",
        durationSeconds: "2",
        particleAmount: "VOLL",
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
          activePlayerTintIntensity: "20",
          backgroundDisplayMode: "tile",
          backgroundOpacity: "70",
          playerFieldTransparency: "45",
          backgroundImageDataUrl: "data:image/png;base64,GGGG",
          backgroundAssetKey: "matrix",
          turnDartStyle: "GRADIENT",
          turnDartTextTemplate: "Wurf #",
          turnDartColor: "#def",
          turnDartGradientColor: "#123456",
          turnDartSizePercent: "135",
          turnDartImageDataUrl: "data:image/png;base64,DDDD",
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

  assert.equal(runtimeConfig.getFeatureConfig("checkoutTargetHighlights").visualPreset, "fast-blink");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutTargetHighlights").segmentStyle, "surface-only");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutTargetHighlights").singleRing, "both");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutTargetHighlights").targetSelectionMode, "all");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").zoomLevel, 3.15);
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").zoomSpeed, "schnell");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").checkoutZoomTarget, "route-first");
  assert.equal(runtimeConfig.getFeatureConfig("tvBoardZoom").t20SetupZoomEnabled, false);
  assert.equal(runtimeConfig.getFeatureConfig("checkoutSuggestionStyles").style, "stripe");
  assert.equal(runtimeConfig.getFeatureConfig("checkoutSuggestionStyles").labelText, "FINISH");
  assert.equal(runtimeConfig.getFeatureConfig("avgTrendArrow").durationMs, 500);
  assert.equal(runtimeConfig.getFeatureConfig("avgTrendArrow").size, "gross");
  assert.equal(runtimeConfig.getFeatureConfig("activePlayerSweep").durationMs, 620);
  assert.equal(runtimeConfig.getFeatureConfig("activePlayerSweep").sweepStyle, "strong");
  assert.equal(runtimeConfig.getFeatureConfig("specialHitHighlights").colorTheme, "ember-rush");
  assert.equal(
    runtimeConfig.getFeatureConfig("specialHitHighlights").animationStyle,
    "pop-hit"
  );
  assert.equal(runtimeConfig.getFeatureConfig("cricketTargetHighlighter").showOpenObjectives, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketTargetHighlighter").showDeadObjectives, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketTargetHighlighter").irrelevantBoardDimStyle, "mask");
  assert.equal(
    runtimeConfig.getFeatureConfig("cricketTargetHighlighter").dimIrrelevantBoardTargets,
    true
  );
  assert.equal(runtimeConfig.getFeatureConfig("cricketTargetHighlighter").colorTheme, "high-contrast");
  assert.equal(runtimeConfig.getFeatureConfig("cricketTargetHighlighter").intensity, "strong");
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").rowWave, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").badgeBeacon, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").markProgress, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").pressureEdge, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").scoringStripe, false);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").deadRowMuted, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").pressureOverlay, true);
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").colorTheme, "high-contrast");
  assert.equal(runtimeConfig.getFeatureConfig("cricketGridStatusEffects").intensity, "strong");
  assert.equal(runtimeConfig.getFeatureConfig("dartboardMarkerHighlight").size, 9);
  assert.equal(
    runtimeConfig.getFeatureConfig("dartboardMarkerHighlight").color,
    "rgb(248, 113, 113)"
  );
  assert.equal(runtimeConfig.getFeatureConfig("dartboardMarkerHighlight").effect, "size-pulse");
  assert.equal(runtimeConfig.getFeatureConfig("dartboardMarkerHighlight").opacityPercent, 65);
  assert.equal(runtimeConfig.getFeatureConfig("dartboardMarkerHighlight").outline, "schwarz");
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").design, "yellow");
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").animateDarts, false);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").sizePercent, 138);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").hideOriginalMarkers, true);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").enableShadow, false);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").enableWobble, false);
  assert.equal(runtimeConfig.getFeatureConfig("dartMarkerReplacer").flightSpeed, "cinematic");
  assert.equal(runtimeConfig.getFeatureConfig("takeOutDartsAlert").imageSize, "large");
  assert.equal(runtimeConfig.getFeatureConfig("takeOutDartsAlert").pulseAnimation, false);
  assert.equal(runtimeConfig.getFeatureConfig("takeOutDartsAlert").pulseScale, 1.08);
  assert.equal(runtimeConfig.getFeatureConfig("singleBullHitSound").volume, 0.75);
  assert.equal(runtimeConfig.getFeatureConfig("singleBullHitSound").cooldownMs, 1000);
  assert.equal(runtimeConfig.getFeatureConfig("singleBullHitSound").pollIntervalMs, 1200);
  assert.equal(runtimeConfig.getFeatureConfig("turnScoreCounter").durationMs, 1000);
  assert.equal(runtimeConfig.getFeatureConfig("turnScoreCounter").countEffect, "rolling-digits");
  assert.equal(runtimeConfig.getFeatureConfig("turnScoreCounter").flashOnChange, false);
  assert.equal(runtimeConfig.getFeatureConfig("turnScoreCounter").flashMode, "permanent");
  assert.equal(runtimeConfig.getFeatureConfig("x01RemainingScoreBar").colorTheme, "ice-circuit");
  assert.equal(runtimeConfig.getFeatureConfig("x01RemainingScoreBar").barSize, "extrabreit");
  assert.equal(runtimeConfig.getFeatureConfig("x01RemainingScoreBar").effect, "glass-light-sweep");
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
    runtimeConfig.getFeatureConfig("themes.globalTypography").activePlayerTintIntensity,
    20
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
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").turnDartStyle, "gradient");
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").turnDartTextTemplate,
    "Wurf #"
  );
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").turnDartColor, "#DDEEFF");
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").turnDartGradientColor,
    "#123456"
  );
  assert.equal(runtimeConfig.getFeatureConfig("themes.globalTypography").turnDartSizePercent, 135);
  assert.equal(
    runtimeConfig.getFeatureConfig("themes.globalTypography").turnDartImageDataUrl,
    "data:image/png;base64,DDDD"
  );
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").style, "top-fireworks");
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").colorTheme, "ice");
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").intensity, "stark");
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").durationSeconds, 2);
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").particleAmount, "voll");
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").includeBullOut, false);
  assert.equal(runtimeConfig.getFeatureConfig("winnerCelebrationEffect").pointerDismiss, false);
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

test("createRuntimeConfig normalizes turn-score-counter speed presets and legacy durations", () => {
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 260 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    1000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 416 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    1000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 650 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    1000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 1300 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    1000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 1000 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    1000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 2000 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    3000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 1400 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    5000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 3000 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    3000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: 2250 } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    5000
  );
  assert.equal(
    createRuntimeConfig({ features: { turnScoreCounter: { durationMs: "nope" } } })
      .getFeatureConfig("turnScoreCounter")
      .durationMs,
    3000
  );
});

test("createRuntimeConfig maps legacy checkout-target-highlights effects to visual presets", () => {
  const steadyConfig = createRuntimeConfig({
    features: {
      checkoutTargetHighlights: {
        effect: "GLOW",
      },
    },
  });
  const signalConfig = createRuntimeConfig({
    features: {
      checkoutTargetHighlights: {
        effect: "blink",
      },
    },
  });

  assert.equal(steadyConfig.getFeatureConfig("checkoutTargetHighlights").visualPreset, "slow-glow");
  assert.equal(signalConfig.getFeatureConfig("checkoutTargetHighlights").visualPreset, "fast-blink");
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

test("special-hit-highlights falls back to defaults for invalid theme/style values", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      specialHitHighlights: {
        colorTheme: "invalid-theme",
        animationStyle: "invalid-animation",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("specialHitHighlights").colorTheme, "kind-signal");
  assert.equal(
    runtimeConfig.getFeatureConfig("specialHitHighlights").animationStyle,
    "pop-hit"
  );
});

test("special-hit-highlights keeps default kind-signal when only legacy hitColorMode is provided", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      specialHitHighlights: {
        hitColorMode: "theme-presets",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("specialHitHighlights").colorTheme, "kind-signal");
});

test("createRuntimeConfig migrates legacy feature config keys without overwriting canonical values", () => {
  const runtimeConfig = createRuntimeConfig({
    featureToggles: {
      checkoutScorePulse: true,
      checkoutScoreHighlight: false,
      winnerFireworks: true,
    },
    features: {
      checkoutScorePulse: {
        enabled: true,
        effect: "blink",
        colorTheme: "56,189,248",
      },
      checkoutScoreHighlight: {
        effect: "glow-only",
      },
      turnPointsCount: {
        enabled: true,
        countEffect: "odometer",
      },
      winnerFireworks: {
        style: "cannon",
      },
    },
  });
  const normalized = runtimeConfig.getNormalized();

  assert.equal(runtimeConfig.isFeatureEnabled("checkoutScorePulse"), false);
  assert.equal(runtimeConfig.isFeatureEnabled("winnerFireworks"), true);
  assert.equal(normalized.features.checkoutScorePulse, undefined);
  assert.equal(normalized.features.turnPointsCount, undefined);
  assert.equal(normalized.features.winnerFireworks, undefined);
  assert.equal(normalized.featureToggles.checkoutScorePulse, undefined);
  assert.equal(normalized.featureToggles.winnerFireworks, undefined);
  assert.equal(normalized.features.checkoutScoreHighlight.enabled, true);
  assert.equal(normalized.features.checkoutScoreHighlight.effect, "glow-only");
  assert.equal(normalized.features.checkoutScoreHighlight.colorTheme, "56, 189, 248");
  assert.equal(normalized.features.turnScoreCounter.enabled, true);
  assert.equal(normalized.features.turnScoreCounter.countEffect, "rolling-digits");
  assert.equal(normalized.features.winnerCelebrationEffect.style, "center-cannon");
});

test("special-hit-highlights maps retired animation styles to one-shot replacements", () => {
  const pulseConfig = createRuntimeConfig({
    features: {
      specialHitHighlights: {
        animationStyle: "neon-pulse",
      },
    },
  });
  const turnConfig = createRuntimeConfig({
    features: {
      specialHitHighlights: {
        animationStyle: "flip-edge",
      },
    },
  });

  assert.equal(pulseConfig.getFeatureConfig("specialHitHighlights").animationStyle, "glow-pop");
  assert.equal(turnConfig.getFeatureConfig("specialHitHighlights").animationStyle, "flip-spin");
});

test("cricket highlighter dim style supports enum values and legacy boolean mapping", () => {
  const defaults = createRuntimeConfig();
  assert.equal(defaults.getFeatureConfig("cricketTargetHighlighter").irrelevantBoardDimStyle, "smoke");
  assert.equal(defaults.getFeatureConfig("cricketTargetHighlighter").dimIrrelevantBoardTargets, true);

  const explicitOff = createRuntimeConfig({
    features: {
      cricketTargetHighlighter: {
        irrelevantBoardDimStyle: "off",
      },
    },
  });
  assert.equal(explicitOff.getFeatureConfig("cricketTargetHighlighter").irrelevantBoardDimStyle, "off");
  assert.equal(explicitOff.getFeatureConfig("cricketTargetHighlighter").dimIrrelevantBoardTargets, false);

  const invalidStyle = createRuntimeConfig({
    features: {
      cricketTargetHighlighter: {
        irrelevantBoardDimStyle: "unknown-style",
      },
    },
  });
  assert.equal(invalidStyle.getFeatureConfig("cricketTargetHighlighter").irrelevantBoardDimStyle, "smoke");
  assert.equal(invalidStyle.getFeatureConfig("cricketTargetHighlighter").dimIrrelevantBoardTargets, true);

  const legacyDisabled = createRuntimeConfig({
    features: {
      cricketTargetHighlighter: {
        dimIrrelevantBoardTargets: false,
      },
    },
  });
  assert.equal(legacyDisabled.getFeatureConfig("cricketTargetHighlighter").irrelevantBoardDimStyle, "off");
  assert.equal(legacyDisabled.getFeatureConfig("cricketTargetHighlighter").dimIrrelevantBoardTargets, false);

  const legacyEnabled = createRuntimeConfig({
    features: {
      cricketTargetHighlighter: {
        dimIrrelevantBoardTargets: true,
      },
    },
  });
  assert.equal(legacyEnabled.getFeatureConfig("cricketTargetHighlighter").irrelevantBoardDimStyle, "smoke");
  assert.equal(legacyEnabled.getFeatureConfig("cricketTargetHighlighter").dimIrrelevantBoardTargets, true);
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

test("x01-remaining-score-bar falls back to thresholdColorMode when colorTheme is missing", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01RemainingScoreBar: {
        colorTheme: "",
        thresholdColorMode: "danger-endgame",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("x01RemainingScoreBar").colorTheme, "danger-endgame");
});

test("x01-remaining-score-bar maps legacy effect keys to the reduced effect set", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01RemainingScoreBar: {
        effect: "spark-trail",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("x01RemainingScoreBar").effect, "previous-score-trail");
});

test("x01-remaining-score-bar maps retired electric aliases to fast-signal-sweep", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01RemainingScoreBar: {
        effect: "ELECTRIC-SURGE",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("x01RemainingScoreBar").effect, "fast-signal-sweep");
  const arcBurstConfig = createRuntimeConfig({
    features: {
      x01RemainingScoreBar: {
        effect: "arc-burst",
      },
    },
  });
  assert.equal(arcBurstConfig.getFeatureConfig("x01RemainingScoreBar").effect, "fast-signal-sweep");
});

test("special-hit-highlights accepts electric-jolt as animation style option", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      specialHitHighlights: {
        animationStyle: "ELECTRIC-ARC",
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("specialHitHighlights").animationStyle, "electric-jolt");
});

test("turn-score-counter maps legacy flashPermanent flag to permanent flash mode", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      turnScoreCounter: {
        flashPermanent: true,
      },
    },
  });

  assert.equal(runtimeConfig.getFeatureConfig("turnScoreCounter").flashMode, "permanent");
});

test("x01-remaining-score-bar drops retired design preset fields from normalized config", () => {
  const runtimeConfig = createRuntimeConfig({
    features: {
      x01RemainingScoreBar: {
        designPreset: "liquid-glass",
        colorTheme: "checkout-focus",
      },
    },
  });

  const featureConfig = runtimeConfig.getFeatureConfig("x01RemainingScoreBar");
  assert.equal(Object.hasOwn(featureConfig, "designPreset"), false);

  const normalized = runtimeConfig.getNormalized();
  assert.equal(
    Object.hasOwn(normalized.features.x01RemainingScoreBar, "designPreset"),
    false
  );
});
