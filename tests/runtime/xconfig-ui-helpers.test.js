import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFeatureSettingPatch,
  themeKeyFromConfigKey,
} from "../../src/features/xconfig-ui/path-utils.js";
import {
  buildShellRenderSignature,
  parseShellRenderSignature,
} from "../../src/features/xconfig-ui/render-signature.js";
import { createShellSyncScheduler } from "../../src/features/xconfig-ui/sync-scheduler.js";

test("xconfig path utils build nested feature setting patches and theme keys", () => {
  assert.deepEqual(
    buildFeatureSettingPatch("checkoutScorePulse", "effect", "glow"),
    {
      features: {
        checkoutScorePulse: {
          effect: "glow",
        },
      },
    }
  );

  assert.deepEqual(
    buildFeatureSettingPatch("themes.cricket", "backgroundOpacity", 40),
    {
      features: {
        themes: {
          cricket: {
            backgroundOpacity: 40,
          },
        },
      },
    }
  );

  assert.equal(themeKeyFromConfigKey("themes.cricket"), "cricket");
  assert.equal(themeKeyFromConfigKey("checkoutScorePulse"), "");
});

test("xconfig render signature helpers round-trip the shell snapshot", () => {
  const signature = buildShellRenderSignature(
    {
      activeTab: "themes",
      activeSettingsFeatureKey: "theme-cricket",
      notice: {
        type: "info",
        message: "Gespeichert",
      },
      updateStatus: {
        capable: true,
        status: "available",
        installedVersion: "2.0.70",
        remoteVersion: "2.0.71",
        available: true,
        checkedAt: 123,
        stale: false,
        error: "",
      },
    },
    [
      {
        featureKey: "theme-cricket",
        enabled: true,
        mounted: false,
        config: {
          backgroundOpacity: 40,
        },
      },
    ],
    true
  );

  const parsed = parseShellRenderSignature(signature);
  assert.equal(parsed?.routeActive, true);
  assert.equal(parsed?.activeSettingsFeatureKey, "theme-cricket");
  assert.equal(parsed?.updateStatus?.remoteVersion, "2.0.71");
  assert.deepEqual(parsed?.features?.[0]?.config, {
    backgroundOpacity: 40,
  });
  assert.equal(parseShellRenderSignature("{invalid"), null);
});

test("xconfig sync scheduler deduplicates queued work and supports cancellation", () => {
  const callbacks = [];
  const cancelled = [];
  let nextHandle = 0;
  const windowRef = {
    requestAnimationFrame(callback) {
      callbacks.push(callback);
      nextHandle += 1;
      return nextHandle;
    },
    cancelAnimationFrame(handle) {
      cancelled.push(handle);
    },
  };
  const state = {
    started: true,
    syncScheduled: false,
    syncHandle: null,
    syncHandleType: "",
  };
  let syncCount = 0;
  const { queueSync, cancelQueuedSync } = createShellSyncScheduler({
    windowRef,
    state,
    onSync() {
      syncCount += 1;
    },
  });

  queueSync();
  queueSync();
  assert.equal(callbacks.length, 1);
  callbacks.shift()?.();
  assert.equal(syncCount, 1);

  queueSync();
  cancelQueuedSync();
  assert.deepEqual(cancelled, [2]);
  assert.equal(state.syncScheduled, false);
});
