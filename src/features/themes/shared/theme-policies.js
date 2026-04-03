import {
  applyCricketReadabilityPolicy,
  clearCricketActivePlayerState,
  clearCricketReadabilityPolicy,
  createCricketReadabilityState,
  hasCricketPlayerStateMutation,
  syncCricketActivePlayerState,
  syncCricketActivePlayerStateFromRenderState,
} from "./cricket-readability.js";
import { createLayoutHookRetentionState } from "./board-layout-resolver.js";
import { acquireSharedCricketRuntime } from "../../cricket-surface/shared-runtime.js";
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
        cricketRuntimeUnsubscribe: null,
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
      if (!context.themeState.cricketRuntimeUnsubscribe) {
        const sharedRuntime = acquireSharedCricketRuntime(context.runtimeContext || {});
        if (sharedRuntime) {
          context.themeState.cricketRuntimeUnsubscribe = sharedRuntime.subscribe({
            featureKey: `${CRICKET_THEME_FEATURE_KEY}:theme-policy`,
            onRenderState: ({ renderState }) => {
              syncCricketActivePlayerStateFromRenderState(
                context.documentRef,
                renderState,
                context.gameState
              );
            },
          });
        }
      }
      syncCricketActivePlayerState(context.documentRef, context.gameState);
      applyCricketReadabilityPolicy(
        context.documentRef,
        context.themeState,
        context.scheduler
      );
    },
    onDeactivate(context = {}) {
      try {
        context.themeState.cricketRuntimeUnsubscribe?.();
      } catch (_) {
        // Keep theme cleanup fail-soft.
      }
      context.themeState.cricketRuntimeUnsubscribe = null;
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
