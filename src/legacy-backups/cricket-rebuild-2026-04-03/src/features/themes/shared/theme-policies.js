import {
  applyCricketReadabilityPolicy,
  clearCricketActivePlayerState,
  clearCricketReadabilityPolicy,
  createCricketReadabilityState,
  hasCricketPlayerStateMutation,
  syncCricketActivePlayerState,
} from "./cricket-readability.js";
import { createLayoutHookRetentionState } from "./board-layout-resolver.js";
import {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
} from "./theme-layout-contract.js";

const CRICKET_THEME_FEATURE_KEY = "theme-cricket";

function createCricketThemePolicy() {
  return Object.freeze({
    key: CRICKET_THEME_FEATURE_KEY,
    createState() {
      return {
        cricketReadability: createCricketReadabilityState(),
        layoutHookRetention: createLayoutHookRetentionState({
          enabled: true,
        }),
      };
    },
    getManagedNodeIds() {
      return [THEME_CRICKET_READABILITY.noticeId];
    },
    getManagedClassNames() {
      return [
        THEME_CRICKET_READABILITY.noticeClass,
        THEME_CRICKET_READABILITY.noticeTextClass,
        THEME_CRICKET_READABILITY.toggleClass,
      ];
    },
    getObservedAttributeFilter() {
      return ["class"];
    },
    shouldScheduleMutation(mutations = []) {
      return hasCricketPlayerStateMutation(mutations);
    },
    onActivate(context = {}) {
      syncCricketActivePlayerState(context.documentRef, context.gameState);
      applyCricketReadabilityPolicy(
        context.documentRef,
        context.themeState,
        context.scheduler
      );
    },
    onDeactivate(context = {}) {
      clearCricketActivePlayerState(context.documentRef);
      clearCricketReadabilityPolicy(context.themeState);
    },
  });
}

export function resolveThemePolicy(options = {}) {
  const featureKey = String(options.featureKey || "").trim();
  if (!featureKey) {
    return null;
  }

  if (options.policy && typeof options.policy === "object") {
    return options.policy;
  }

  if (typeof options.policyFactory === "function") {
    const policy = options.policyFactory(options);
    if (policy && typeof policy === "object") {
      return policy;
    }
  }

  if (featureKey === CRICKET_THEME_FEATURE_KEY) {
    return createCricketThemePolicy();
  }

  return null;
}

export { CRICKET_ACTIVE_PLAYER_ATTRIBUTE, THEME_CRICKET_READABILITY };
