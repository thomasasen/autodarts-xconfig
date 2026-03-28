import test from "node:test";
import assert from "node:assert/strict";

import { mountThemeFeature } from "../../src/features/themes/shared/mount-theme-feature.js";
import { resolveThemePolicy } from "../../src/features/themes/shared/theme-policies.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("resolveThemePolicy returns the cricket policy only for the cricket theme", () => {
  const cricketPolicy = resolveThemePolicy({
    featureKey: "theme-cricket",
  });

  assert.ok(cricketPolicy);
  assert.equal(typeof cricketPolicy.createState, "function");
  assert.equal(typeof cricketPolicy.getManagedNodeIds, "function");
  assert.equal(typeof cricketPolicy.getManagedClassNames, "function");
  assert.equal(typeof cricketPolicy.getObservedAttributeFilter, "function");
  assert.equal(typeof cricketPolicy.shouldScheduleMutation, "function");
  assert.equal(typeof cricketPolicy.onActivate, "function");
  assert.equal(typeof cricketPolicy.onDeactivate, "function");
  assert.deepEqual(cricketPolicy.getManagedNodeIds(), [
    "ad-ext-theme-cricket-readability-notice",
  ]);
  assert.deepEqual(
    cricketPolicy.getManagedClassNames().sort(),
    [
      "ad-ext-theme-cricket-readability-notice",
      "ad-ext-theme-cricket-readability-text",
      "ad-ext-theme-cricket-readability-toggle",
    ].sort()
  );
  assert.deepEqual(cricketPolicy.getObservedAttributeFilter(), ["class"]);
  assert.equal(resolveThemePolicy({ featureKey: "theme-x01" }), null);
});

test("mountThemeFeature honors an injected policy without changing the theme lifecycle", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "x01";
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/test-match",
  });

  const observerCalls = [];
  const listenerCalls = [];
  const removedStyles = [];
  const policyCalls = [];

  const domGuards = {
    ensureStyle() {},
    removeNodeById(styleId) {
      removedStyles.push(styleId);
    },
  };
  const observerRegistry = {
    registerMutationObserver(options) {
      observerCalls.push(options);
      return () => {};
    },
    disconnect() {},
  };
  const listenerRegistry = {
    register(options) {
      listenerCalls.push(options);
      return () => {};
    },
    remove() {},
  };

  const cleanup = mountThemeFeature(
    {
      documentRef,
      windowRef,
      domGuards,
      gameState: {
        isX01Variant() {
          return true;
        },
      },
      config: {
        getFeatureConfig() {
          return {};
        },
      },
      registries: {
        observers: observerRegistry,
        listeners: listenerRegistry,
      },
      helpers: {
        createRafScheduler(callback) {
          let scheduled = false;
          return {
            schedule() {
              if (scheduled) {
                return;
              }
              scheduled = true;
              setTimeout(() => {
                scheduled = false;
                callback();
              }, 0);
            },
            cancel() {
              scheduled = false;
            },
          };
        },
      },
    },
    {
      featureKey: "theme-x01",
      configKey: "themes.x01",
      styleId: "test-theme-style",
      variantName: "x01",
      buildThemeCss() {
        return "body { color: red; }";
      },
      policy: {
        createState() {
          policyCalls.push("createState");
          return { marker: "policy-state" };
        },
        getManagedNodeIds() {
          return ["policy-node"];
        },
        getManagedClassNames() {
          return ["policy-class"];
        },
        getObservedAttributeFilter() {
          return ["data-policy"];
        },
        shouldScheduleMutation(mutations = []) {
          policyCalls.push(`mutations:${mutations.length}`);
          return true;
        },
        onActivate(context = {}) {
          policyCalls.push(`activate:${String(context.themeState?.marker || "")}`);
        },
        onDeactivate(context = {}) {
          policyCalls.push(`deactivate:${String(context.themeState?.marker || "")}`);
        },
      },
    }
  );

  await wait(20);

  assert.ok(policyCalls.includes("createState"));
  assert.ok(policyCalls.some((entry) => entry.startsWith("activate:policy-state")));
  assert.equal(observerCalls.length, 1);
  assert.ok(
    observerCalls[0].observeOptions.attributeFilter.includes("data-policy")
  );
  assert.equal(listenerCalls.length, 2);

  cleanup();
  assert.ok(policyCalls.some((entry) => entry.startsWith("deactivate:policy-state")));
  assert.ok(removedStyles.includes("test-theme-style"));
});
