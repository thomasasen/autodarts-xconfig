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
import { mountSingleBullSound, runSingleBullSoundAction } from "./single-bull-sound/index.js";
import { mountTurnPointsCount } from "./turn-points-count/index.js";
import { mountWinnerFireworks, runWinnerFireworksAction } from "./winner-fireworks/index.js";
import { mountX01ScoreProgress } from "./x01-score-progress/index.js";
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
    startupTiming: normalizeFeatureStartupTiming(definition.startupTiming),
    migratedFrom: String(definition.migratedFrom || "").trim(),
    initialize: wrappedInitialize,
    mount: wrappedInitialize,
    runAction: typeof definition.runAction === "function" ? definition.runAction : null,
  };
}

const featureInitializers = Object.freeze({
  "checkout-score-pulse": mountCheckoutScorePulse,
  "checkout-board-targets": mountCheckoutBoardTargets,
  "tv-board-zoom": mountTvBoardZoom,
  "style-checkout-suggestions": mountStyleCheckoutSuggestions,
  "average-trend-arrow": mountAverageTrendArrow,
  "turn-start-sweep": mountTurnStartSweep,
  "triple-double-bull-hits": mountTripleDoubleBullHits,
  "cricket-highlighter": mountCricketHighlighter,
  "cricket-grid-fx": mountCricketGridFx,
  "dart-marker-emphasis": mountDartMarkerEmphasis,
  "dart-marker-darts": mountDartMarkerDarts,
  "remove-darts-notification": mountRemoveDartsNotification,
  "single-bull-sound": mountSingleBullSound,
  "turn-points-count": mountTurnPointsCount,
  "winner-fireworks": mountWinnerFireworks,
  "x01-score-progress": mountX01ScoreProgress,
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
  "single-bull-sound": runSingleBullSoundAction,
  "winner-fireworks": runWinnerFireworksAction,
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
    return definitionsByKey.has(normalizeFeatureKey(featureKey));
  }

  return {
    getDefinitions,
    listFeatures,
    hasFeature,
  };
}
