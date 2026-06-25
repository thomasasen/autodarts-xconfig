import { mountCheckoutScoreHighlight } from "./checkout-score-highlight/index.js";
import { mountCheckoutTargetHighlights } from "./checkout-target-highlights/index.js";
import { mountTvBoardZoom } from "./tv-board-zoom/index.js";
import { mountCheckoutSuggestionStyles } from "./checkout-suggestion-styles/index.js";
import {
  mountX01BustActivePlayerHighlight,
  runX01BustActivePlayerHighlightAction,
} from "./x01-bust-active-player-highlight/index.js";
import { mountAvgTrendArrow } from "./avg-trend-arrow/index.js";
import { mountActivePlayerSweep } from "./active-player-sweep/index.js";
import { mountSpecialHitHighlights } from "./special-hit-highlights/index.js";
import { mountCricketTargetHighlighter } from "./cricket-target-highlighter/index.js";
import { mountCricketGridStatusEffects } from "./cricket-grid-status-effects/index.js";
import { mountDartboardMarkerHighlight } from "./dartboard-marker-highlight/index.js";
import { mountDartMarkerReplacer, runDartMarkerReplacerAction } from "./dart-marker-replacer/index.js";
import { mountTakeOutDartsAlert } from "./take-out-darts-alert/index.js";
import { mountSingleBullHitSound, runSingleBullHitSoundAction } from "./single-bull-hit-sound/index.js";
import { mountTurnScoreCounter } from "./turn-score-counter/index.js";
import { mountWinnerCelebrationEffect, runWinnerCelebrationEffectAction } from "./winner-celebration-effect/index.js";
import { mountX01RemainingScoreBar } from "./x01-remaining-score-bar/index.js";
import { mountThemeX01 } from "./themes/x01/index.js";
import { mountThemeGotcha } from "./themes/gotcha/index.js";
import { mountThemeX01TwoPlayer } from "./themes/x01-2player/index.js";
import { mountThemeShanghai } from "./themes/shanghai/index.js";
import { mountThemeBermuda } from "./themes/bermuda/index.js";
import { mountThemeCricket } from "./themes/cricket/index.js";
import { mountThemeBullOff } from "./themes/bull-off/index.js";
import { mountThemeGlobalTypography } from "./themes/global-typography/index.js";
import { normalizeFeatureIdentity, normalizeFeatureKey } from "./feature-metadata.js";
import {
  featureCatalog,
  normalizeFeatureStartupTiming,
} from "../shared/feature-catalog.js";

function readFeatureDebugFlag(context, configKey) {
  const configRef = context?.config;
  if (!configRef || typeof configRef.getFeatureConfig !== "function") {
    return false;
  }

  const featureConfig = configRef.getFeatureConfig(configKey);
  return Boolean(featureConfig && typeof featureConfig === "object" && featureConfig.debug === true);
}

function createFeatureDebugTools(context, featureKey, configKey, fallbackLogger) {
  const loggerRef = context?.logger || fallbackLogger || console;
  const prefix = `[autodarts-xconfig:${featureKey}]`;

  const emit = (methodName, args) => {
    if (!readFeatureDebugFlag(context, configKey)) {
      return;
    }

    const method =
      loggerRef && typeof loggerRef[methodName] === "function"
        ? loggerRef[methodName].bind(loggerRef)
        : null;
    if (!method) {
      return;
    }

    method(prefix, ...args);
  };

  return {
    get enabled() {
      return readFeatureDebugFlag(context, configKey);
    },
    log(...args) {
      emit("info", args);
    },
    warn(...args) {
      emit("warn", args);
    },
    error(...args) {
      emit("error", args);
    },
  };
}

function normalizeDefinition(definition, options = {}) {
  if (!definition || typeof definition !== "object") {
    return null;
  }

  const { featureKey, configKey } = normalizeFeatureIdentity(definition);
  const initialize = definition.initialize || definition.mount;

  if (!featureKey || !configKey || typeof initialize !== "function") {
    return null;
  }

  const registryDebug = Boolean(options.debug);
  const logger = options.logger || console;
  const wrappedInitialize = function wrappedInitialize(context) {
    const featureDebug = createFeatureDebugTools(context, featureKey, configKey, logger);

    if (registryDebug && logger && typeof logger.info === "function") {
      logger.info(`[autodarts-xconfig] feature initialize: ${featureKey}`);
    }
    if (featureDebug.enabled) {
      featureDebug.log("Debug aktiviert.");
    }

    const cleanup = initialize({
      ...context,
      featureDebug,
    });

    return function wrappedCleanup() {
      if (registryDebug && logger && typeof logger.info === "function") {
        logger.info(`[autodarts-xconfig] feature cleanup: ${featureKey}`);
      }
      if (featureDebug.enabled) {
        featureDebug.log("Cleanup.");
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
    legacyFeatureKeys: Array.isArray(definition.legacyFeatureKeys)
      ? definition.legacyFeatureKeys.map((key) => String(key || "").trim()).filter(Boolean)
      : [],
    legacyConfigKeys: Array.isArray(definition.legacyConfigKeys)
      ? definition.legacyConfigKeys.map((key) => String(key || "").trim()).filter(Boolean)
      : [],
    startupTiming: normalizeFeatureStartupTiming(definition.startupTiming),
    migratedFrom: String(definition.migratedFrom || "").trim(),
    initialize: wrappedInitialize,
    mount: wrappedInitialize,
    runAction: typeof definition.runAction === "function" ? definition.runAction : null,
  };
}

const featureInitializers = Object.freeze({
  "checkout-score-highlight": mountCheckoutScoreHighlight,
  "checkout-target-highlights": mountCheckoutTargetHighlights,
  "tv-board-zoom": mountTvBoardZoom,
  "checkout-suggestion-styles": mountCheckoutSuggestionStyles,
  "x01-bust-active-player-highlight": mountX01BustActivePlayerHighlight,
  "avg-trend-arrow": mountAvgTrendArrow,
  "active-player-sweep": mountActivePlayerSweep,
  "special-hit-highlights": mountSpecialHitHighlights,
  "cricket-target-highlighter": mountCricketTargetHighlighter,
  "cricket-grid-status-effects": mountCricketGridStatusEffects,
  "dartboard-marker-highlight": mountDartboardMarkerHighlight,
  "dart-marker-replacer": mountDartMarkerReplacer,
  "take-out-darts-alert": mountTakeOutDartsAlert,
  "single-bull-hit-sound": mountSingleBullHitSound,
  "turn-score-counter": mountTurnScoreCounter,
  "winner-celebration-effect": mountWinnerCelebrationEffect,
  "x01-remaining-score-bar": mountX01RemainingScoreBar,
  "theme-global-typography": mountThemeGlobalTypography,
  "theme-x01": mountThemeX01,
  "theme-gotcha": mountThemeGotcha,
  "theme-x01-2player": mountThemeX01TwoPlayer,
  "theme-shanghai": mountThemeShanghai,
  "theme-bermuda": mountThemeBermuda,
  "theme-cricket": mountThemeCricket,
  "theme-bull-off": mountThemeBullOff,
});

const featureActions = Object.freeze({
  "x01-bust-active-player-highlight": runX01BustActivePlayerHighlightAction,
  "dart-marker-replacer": runDartMarkerReplacerAction,
  "single-bull-hit-sound": runSingleBullHitSoundAction,
  "winner-celebration-effect": runWinnerCelebrationEffectAction,
});

export const defaultFeatureDefinitions = Object.freeze(
  featureCatalog.map((entry) =>
    Object.freeze({
      ...entry,
      initialize: featureInitializers[entry.featureKey],
      mount: featureInitializers[entry.featureKey],
      runAction: featureActions[entry.featureKey] || null,
    })
  )
);

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
        startupTiming: definition.startupTiming,
        migratedFrom: definition.migratedFrom,
        enabled: Boolean(runtimeState.enabled),
        mounted: Boolean(runtimeState.mounted),
        config: runtimeState.config || null,
      };
    });
  }

  function hasFeature(featureKey) {
    const normalizedKey = normalizeFeatureKey(featureKey);
    return definitions.some(
      (definition) =>
        definition.featureKey === normalizedKey || definition.legacyFeatureKeys.includes(normalizedKey)
    );
  }

  return {
    getDefinitions,
    listFeatures,
    hasFeature,
  };
}
