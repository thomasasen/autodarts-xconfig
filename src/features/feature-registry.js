import { mountCheckoutScorePulse } from "./checkout-score-pulse/index.js";
import { mountCheckoutBoardTargets } from "./checkout-board-targets/index.js";
import { mountTvBoardZoom } from "./tv-board-zoom/index.js";
import { mountStyleCheckoutSuggestions } from "./style-checkout-suggestions/index.js";
import { mountAverageTrendArrow } from "./average-trend-arrow/index.js";
import { mountTurnStartSweep } from "./turn-start-sweep/index.js";
import { mountTripleDoubleBullHits } from "./triple-double-bull-hits/index.js";
import { mountCricketHighlighter } from "./cricket-highlighter/index.js";
import { mountCricketGridFx } from "./cricket-grid-fx/index.js";
import { mountDartMarkerEmphasis } from "./dart-marker-emphasis/index.js";
import { mountDartMarkerDarts } from "./dart-marker-darts/index.js";
import { mountRemoveDartsNotification } from "./remove-darts-notification/index.js";
import { mountSingleBullSound } from "./single-bull-sound/index.js";
import { mountTurnPointsCount } from "./turn-points-count/index.js";
import { mountWinnerFireworks } from "./winner-fireworks/index.js";
import { mountThemeX01 } from "./themes/x01/index.js";
import { mountThemeShanghai } from "./themes/shanghai/index.js";
import { mountThemeBermuda } from "./themes/bermuda/index.js";
import { mountThemeCricket } from "./themes/cricket/index.js";
import { mountThemeBullOff } from "./themes/bull-off/index.js";

function normalizeDefinition(definition, options = {}) {
  if (!definition || typeof definition !== "object") {
    return null;
  }

  const featureKey = String(definition.featureKey || "").trim();
  const configKey = String(definition.configKey || "").trim();
  const initialize = definition.initialize || definition.mount;

  if (!featureKey || !configKey || typeof initialize !== "function") {
    return null;
  }

  const debug = Boolean(options.debug);
  const logger = options.logger || console;
  const wrappedInitialize = function wrappedInitialize(context) {
    if (debug && logger && typeof logger.info === "function") {
      logger.info(`[autodarts-xconfig] feature initialize: ${featureKey}`);
    }

    const cleanup = initialize(context);

    return function wrappedCleanup() {
      if (debug && logger && typeof logger.info === "function") {
        logger.info(`[autodarts-xconfig] feature cleanup: ${featureKey}`);
      }

      if (typeof cleanup === "function") {
        return cleanup();
      }

      return undefined;
    };
  };

  return {
    featureKey,
    configKey,
    title: String(definition.title || featureKey).trim(),
    variants: Array.isArray(definition.variants)
      ? definition.variants.map((variant) => String(variant || "").trim()).filter(Boolean)
      : [],
    migratedFrom: String(definition.migratedFrom || "").trim(),
    initialize: wrappedInitialize,
    mount: wrappedInitialize,
  };
}

export const defaultFeatureDefinitions = Object.freeze([
  Object.freeze({
    featureKey: "checkout-score-pulse",
    configKey: "checkoutScorePulse",
    title: "Checkout Score Pulse",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Animate Checkout Score Pulse.user.js",
    initialize: mountCheckoutScorePulse,
    mount: mountCheckoutScorePulse,
  }),
  Object.freeze({
    featureKey: "checkout-board-targets",
    configKey: "checkoutBoardTargets",
    title: "Checkout Board Targets",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Animate Checkout Board Targets.user.js",
    initialize: mountCheckoutBoardTargets,
    mount: mountCheckoutBoardTargets,
  }),
  Object.freeze({
    featureKey: "tv-board-zoom",
    configKey: "tvBoardZoom",
    title: "TV Board Zoom",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Animate TV Board Zoom.user.js",
    initialize: mountTvBoardZoom,
    mount: mountTvBoardZoom,
  }),
  Object.freeze({
    featureKey: "style-checkout-suggestions",
    configKey: "styleCheckoutSuggestions",
    title: "Style Checkout Suggestions",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Style Checkout Suggestions.user.js",
    initialize: mountStyleCheckoutSuggestions,
    mount: mountStyleCheckoutSuggestions,
  }),
  Object.freeze({
    featureKey: "average-trend-arrow",
    configKey: "averageTrendArrow",
    title: "Average Trend Arrow",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Average Trend Arrow.user.js",
    initialize: mountAverageTrendArrow,
    mount: mountAverageTrendArrow,
  }),
  Object.freeze({
    featureKey: "turn-start-sweep",
    configKey: "turnStartSweep",
    title: "Turn Start Sweep",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Turn Start Sweep.user.js",
    initialize: mountTurnStartSweep,
    mount: mountTurnStartSweep,
  }),
  Object.freeze({
    featureKey: "triple-double-bull-hits",
    configKey: "tripleDoubleBullHits",
    title: "Triple/Double/Bull Hits",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Triple Double Bull Hits.user.js",
    initialize: mountTripleDoubleBullHits,
    mount: mountTripleDoubleBullHits,
  }),
  Object.freeze({
    featureKey: "cricket-highlighter",
    configKey: "cricketHighlighter",
    title: "Cricket Highlighter",
    variants: ["cricket", "tactics"],
    migratedFrom: "Animation/Autodarts Animate Cricket Target Highlighter.user.js",
    initialize: mountCricketHighlighter,
    mount: mountCricketHighlighter,
  }),
  Object.freeze({
    featureKey: "cricket-grid-fx",
    configKey: "cricketGridFx",
    title: "Cricket Grid FX",
    variants: ["cricket", "tactics"],
    migratedFrom: "Animation/Autodarts Animate Cricket Grid FX.user.js",
    initialize: mountCricketGridFx,
    mount: mountCricketGridFx,
  }),
  Object.freeze({
    featureKey: "dart-marker-emphasis",
    configKey: "dartMarkerEmphasis",
    title: "Dart Marker Emphasis",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Dart Marker Emphasis.user.js",
    initialize: mountDartMarkerEmphasis,
    mount: mountDartMarkerEmphasis,
  }),
  Object.freeze({
    featureKey: "dart-marker-darts",
    configKey: "dartMarkerDarts",
    title: "Dart Marker Darts",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Dart Marker Darts.user.js",
    initialize: mountDartMarkerDarts,
    mount: mountDartMarkerDarts,
  }),
  Object.freeze({
    featureKey: "remove-darts-notification",
    configKey: "removeDartsNotification",
    title: "Remove Darts Notification",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Remove Darts Notification.user.js",
    initialize: mountRemoveDartsNotification,
    mount: mountRemoveDartsNotification,
  }),
  Object.freeze({
    featureKey: "single-bull-sound",
    configKey: "singleBullSound",
    title: "Single Bull Sound",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Single Bull Sound.user.js",
    initialize: mountSingleBullSound,
    mount: mountSingleBullSound,
  }),
  Object.freeze({
    featureKey: "turn-points-count",
    configKey: "turnPointsCount",
    title: "Turn Points Count",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Turn Points Count.user.js",
    initialize: mountTurnPointsCount,
    mount: mountTurnPointsCount,
  }),
  Object.freeze({
    featureKey: "winner-fireworks",
    configKey: "winnerFireworks",
    title: "Winner Fireworks",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Winner Fireworks.user.js",
    initialize: mountWinnerFireworks,
    mount: mountWinnerFireworks,
  }),
  Object.freeze({
    featureKey: "theme-x01",
    configKey: "themes.x01",
    title: "Theme X01",
    variants: ["x01"],
    migratedFrom: "Template/Autodarts Theme X01.user.js",
    initialize: mountThemeX01,
    mount: mountThemeX01,
  }),
  Object.freeze({
    featureKey: "theme-shanghai",
    configKey: "themes.shanghai",
    title: "Theme Shanghai",
    variants: ["shanghai"],
    migratedFrom: "Template/Autodarts Theme Shanghai.user.js",
    initialize: mountThemeShanghai,
    mount: mountThemeShanghai,
  }),
  Object.freeze({
    featureKey: "theme-bermuda",
    configKey: "themes.bermuda",
    title: "Theme Bermuda",
    variants: ["bermuda"],
    migratedFrom: "Template/Autodarts Theme Bermuda.user.js",
    initialize: mountThemeBermuda,
    mount: mountThemeBermuda,
  }),
  Object.freeze({
    featureKey: "theme-cricket",
    configKey: "themes.cricket",
    title: "Theme Cricket",
    variants: ["cricket", "tactics"],
    migratedFrom: "Template/Autodarts Theme Cricket.user.js",
    initialize: mountThemeCricket,
    mount: mountThemeCricket,
  }),
  Object.freeze({
    featureKey: "theme-bull-off",
    configKey: "themes.bullOff",
    title: "Theme Bull-off",
    variants: ["bull-off"],
    migratedFrom: "Template/Autodarts Theme Bull-off.user.js",
    initialize: mountThemeBullOff,
    mount: mountThemeBullOff,
  }),
]);

export function createFeatureRegistry(options = {}) {
  const debug = Boolean(options.debug);
  const logger = options.logger || console;
  const rawDefinitions = Array.isArray(options.definitions)
    ? options.definitions
    : defaultFeatureDefinitions;

  const definitions = [];
  const definitionsByKey = new Map();

  rawDefinitions.forEach((definition) => {
    const normalized = normalizeDefinition(definition, { debug, logger });
    if (!normalized) {
      return;
    }

    if (definitionsByKey.has(normalized.featureKey)) {
      if (debug && logger && typeof logger.warn === "function") {
        logger.warn(
          `[autodarts-xconfig] duplicate feature definition ignored: ${normalized.featureKey}`
        );
      }
      return;
    }

    definitions.push(normalized);
    definitionsByKey.set(normalized.featureKey, normalized);
  });

  function getDefinitions() {
    return definitions.map((definition) => ({ ...definition }));
  }

  function listFeatures(snapshot = null) {
    const featureState = snapshot && typeof snapshot === "object" ? snapshot.features || {} : {};

    return definitions.map((definition) => {
      const runtimeState = featureState[definition.featureKey] || {};
      return {
        featureKey: definition.featureKey,
        configKey: definition.configKey,
        title: definition.title,
        variants: definition.variants.slice(),
        migratedFrom: definition.migratedFrom,
        enabled: Boolean(runtimeState.enabled),
        mounted: Boolean(runtimeState.mounted),
        config: runtimeState.config || null,
      };
    });
  }

  function hasFeature(featureKey) {
    return definitionsByKey.has(String(featureKey || "").trim());
  }

  return {
    getDefinitions,
    listFeatures,
    hasFeature,
  };
}
