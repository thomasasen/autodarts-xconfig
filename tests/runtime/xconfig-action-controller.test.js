import test from "node:test";
import assert from "node:assert/strict";

import { createShellActionController } from "../../src/features/xconfig-ui/action-controller.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function datasetKeyFromAttribute(name) {
  return String(name || "")
    .replace(/^data-/, "")
    .replaceAll(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

function datasetAttributeFromKey(key) {
  return `data-${String(key || "").replaceAll(/([A-Z])/g, "-$1").toLowerCase()}`;
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createActionNode(attributes = {}, parentElement = null) {
  const node = {
    attributes: { ...attributes },
    parentElement,
    checked: false,
    getAttribute(name) {
      const key = String(name || "");
      return Object.hasOwn(this.attributes, key)
        ? this.attributes[key]
        : null;
    },
    setAttribute(name, value) {
      const key = String(name || "");
      const normalizedValue = String(value);
      this.attributes[key] = normalizedValue;
      if (key.startsWith("data-")) {
        this.dataset[datasetKeyFromAttribute(key)] = normalizedValue;
      }
    },
  };

  const datasetStore = {};
  Object.entries(node.attributes).forEach(([name, value]) => {
    if (String(name).startsWith("data-")) {
      datasetStore[datasetKeyFromAttribute(name)] = String(value);
    }
  });
  node.dataset = new Proxy(datasetStore, {
    get(target, property) {
      return target[String(property)];
    },
    set(target, property, value) {
      const key = String(property);
      const normalizedValue = String(value);
      target[key] = normalizedValue;
      node.attributes[datasetAttributeFromKey(key)] = normalizedValue;
      return true;
    },
  });

  return node;
}

function createToggleGroup(settingKey) {
  const hiddenInput = { checked: false };
  const selectedButton = createActionNode({
    "data-setting-key": settingKey,
    "data-setting-value": "true",
  });
  const otherButton = createActionNode({
    "data-setting-key": settingKey,
    "data-setting-value": "false",
  });
  const parentElement = {
    querySelectorAll(selector) {
      assert.equal(
        selector,
        `[data-adxconfig-action='set-setting-toggle'][data-setting-key='${settingKey}']`
      );
      return [selectedButton, otherButton];
    },
    querySelector(selector) {
      assert.equal(
        selector,
        `input[data-adxconfig-setting='true'][data-setting-key='${settingKey}']`
      );
      return hiddenInput;
    },
  };

  selectedButton.parentElement = parentElement;
  otherButton.parentElement = parentElement;

  return {
    selectedButton,
    otherButton,
    hiddenInput,
  };
}

test("createShellActionController dispatches navigation and shell-state commands", () => {
  const calls = [];
  const state = { activeSettingsFeatureKey: "" };
  const controller = createShellActionController({
    windowRef: {},
    state,
    queueSync: () => calls.push("sync"),
    navigateToConfigRoute: () => calls.push("open"),
    navigateBack: () => calls.push("close"),
    openReadme: (_windowRef, featureKey) => calls.push(["readme", featureKey]),
    openChangelog: () => calls.push("changelog"),
  });

  controller.handleAction("open");
  controller.handleAction("close");
  controller.handleAction("open-settings", null, { featureKey: "theme-x01" });
  controller.handleAction("close-settings");
  controller.handleAction("close-settings-backdrop");
  controller.handleAction("open-readme", null, { featureKey: "winner-fireworks" });
  controller.handleAction("open-changelog");
  controller.handleAction("unknown-action");

  assert.deepEqual(calls, [
    "open",
    "close",
    "sync",
    "sync",
    "sync",
    ["readme", "winner-fireworks"],
    "changelog",
  ]);
  assert.equal(state.activeSettingsFeatureKey, "");
});

test("createShellActionController dispatches runtime, update and theme commands", async () => {
  const calls = [];
  const notices = [];
  const state = { activeSettingsFeatureKey: "" };
  const controller = createShellActionController({
    windowRef: {
      confirm(message) {
        calls.push(["confirm", message]);
        return true;
      },
    },
    state,
    setNotice: (type, message) => notices.push([type, message]),
    queueSync: () => calls.push("sync"),
    refreshUpdateStatus: (options) => calls.push(["refresh", options]),
    openUserscriptInstall: () => {
      calls.push("install");
      return true;
    },
    runtimeApi: {
      resetConfig: () => {
        calls.push("reset");
        return Promise.resolve("reset-done");
      },
      applyRecommendedDefaults: () => {
        calls.push("defaults");
        return Promise.resolve("defaults-done");
      },
      clearThemeBackgroundImage: () => {
        calls.push("clear-theme-runtime");
      },
      saveConfig: (patch) => {
        calls.push(["save-config", patch]);
        return Promise.resolve("config-updated");
      },
    },
    clearThemeBackgroundImage: (options) => calls.push(["clear-theme", options.themeKey]),
    uploadThemeBackgroundImage: (options) => calls.push(["upload-theme", options.themeKey]),
    themeKeyFromConfigKey: (configKey) => (configKey === "themes.x01" ? "x01" : ""),
    syncTurnDartImageIndicators: (featureKey) => calls.push(["sync-turn-dart", featureKey]),
  });

  controller.handleAction("check-update");
  controller.handleAction("install-update");
  controller.handleAction("reset");
  controller.handleAction("apply-recommended-defaults");
  controller.handleAction("clearThemeBackground", null, {
    configKey: "themes.x01",
  });
  controller.handleAction("uploadThemeBackground", null, {
    configKey: "themes.x01",
  });
  controller.handleAction("clearTurnDartImage", null, {
    featureKey: "theme-global-typography",
    configKey: "themes.globalTypography",
  });
  controller.handleAction(
    "applyThemeGlobalPreset",
    createActionNode({
      "data-feature-action-id": "cyberpunk",
    }),
    {
      featureKey: "theme-global-typography",
      configKey: "themes.globalTypography",
    }
  );

  await flushMicrotasks();

  assert.deepEqual(calls, [
    ["refresh", { force: true, announce: true }],
    "install",
    ["confirm", "Bist du sicher? Der Hard Reset setzt alles auf Standard zurück, deaktiviert alle Module und löscht alle gespeicherten Theme-Bilder."],
    "reset",
    ["confirm", "Bist du sicher? Die empfohlenen Standards aktivieren alle Module und setzen die Konfiguration neu. Deine eigenen Theme-Bilder bleiben erhalten."],
    "defaults",
    ["clear-theme", "x01"],
    ["upload-theme", "x01"],
    [
      "save-config",
      {
        features: {
          themes: {
            globalTypography: {
              turnDartStyle: "original",
              turnDartImageDataUrl: "",
            },
          },
        },
      },
    ],
    [
      "confirm",
      'Preset "Cyberpunk" anwenden? Dadurch werden alle Einstellungen in Templates Global inklusive globalem Wallpaper überschrieben.',
    ],
    [
      "save-config",
      {
        featureToggles: {
          "themes.globalTypography": true,
        },
        features: {
          themes: {
            globalTypography: {
              enabled: true,
              fontPreset: "audiowide",
              applyTo: ["scores", "throws", "names"],
              accentColor: "#2EF2FF",
              scoreColor: "#E8FF5A",
              secondaryTextColor: "#FFD0F5",
              throwLabelColor: "#FF5CD6",
              activePlayerTintIntensity: 15,
              backgroundDisplayMode: "fill",
              backgroundOpacity: 40,
              playerFieldTransparency: 30,
              backgroundImageDataUrl: "",
              backgroundAssetKey: "cyberpunk",
              debug: false,
            },
          },
        },
      },
    ],
    ["sync-turn-dart", "theme-global-typography"],
    "sync",
    "sync",
    "sync",
    "sync",
  ]);
  assert.deepEqual(notices, [
    ["info", "Installations-Tab geöffnet. Bestätige das Update in Tampermonkey."],
    ["info", "Hard Reset ausgeführt."],
    ["info", "Empfohlene Standards angewendet."],
    ["info", "Dart-Bild entfernt."],
    ["success", 'Preset "Cyberpunk" angewendet.'],
  ]);
});

test("createShellActionController dispatches feature and setting payload commands", async () => {
  const calls = [];
  const notices = [];
  const descriptor = {
    fields: [
      {
        control: "select",
        key: "effect",
      },
      {
        control: "action",
        action: "run-feature-action",
        actionId: "preview",
        successMessage: "Aktion erledigt.",
        errorMessage: "Aktion fehlgeschlagen.",
      },
    ],
  };
  const selectButton = createActionNode({
    "data-config-key": "checkoutScorePulse",
    "data-setting-key": "effect",
    "data-setting-value": "glow",
  });
  const toggleGroup = createToggleGroup("enabled");
  const controller = createShellActionController({
    windowRef: {},
    queueSync: () => calls.push("sync"),
    setNotice: (type, message) => notices.push([type, message]),
    runtimeApi: {
      setFeatureEnabled: (featureKey, enabled) => {
        calls.push(["set-feature", featureKey, enabled]);
        return Promise.resolve("feature-updated");
      },
      saveConfig: (patch) => {
        calls.push(["save-config", patch]);
        return Promise.resolve("config-updated");
      },
      runFeatureAction: (featureKey, actionId, options = {}) => {
        calls.push([
          "run-feature-action",
          featureKey,
          actionId,
          options.actionTarget || null,
        ]);
        return Promise.resolve("action-run");
      },
    },
    getXConfigDescriptor: () => descriptor,
    buildFeatureSettingPatch: (configKey, settingKey, value) => ({
      configKey,
      settingKey,
      value,
    }),
    parseFieldValue: (_field, value) => `parsed:${value}`,
    syncSelectOptionButtons: (_documentRef, node, value) => {
      calls.push(["sync-select", node, value]);
    },
  });

  controller.handleAction("set-feature", createActionNode({
    "data-feature-enabled": "true",
  }), {
    featureKey: "checkout-score-pulse",
    title: "Checkout Score Pulse",
  });
  controller.handleAction("set-setting-toggle", toggleGroup.selectedButton, {
    configKey: "checkoutScorePulse",
  });
  controller.handleAction("set-setting-select-option", selectButton, {
    featureKey: "checkout-score-pulse",
    configKey: "checkoutScorePulse",
  });
  const previewTarget = { marker: "preview-target" };
  const actionWrapper = {
    querySelector(selector) {
      assert.equal(selector, "[data-adxconfig-action-preview-target]");
      return previewTarget;
    },
  };
  const actionButtonParent = {
    closest(selector) {
      assert.equal(selector, ".ad-xconfig-setting-action");
      return actionWrapper;
    },
  };
  controller.handleAction("run-feature-action", createActionNode({
    "data-feature-action-id": "preview",
  }, actionButtonParent), {
    featureKey: "winner-fireworks",
  });

  await flushMicrotasks();

  assert.deepEqual(calls, [
    ["set-feature", "checkout-score-pulse", true],
    ["save-config", { configKey: "checkoutScorePulse", settingKey: "enabled", value: true }],
    ["sync-select", selectButton, "glow"],
    ["save-config", { configKey: "checkoutScorePulse", settingKey: "effect", value: "parsed:glow" }],
    ["run-feature-action", "winner-fireworks", "preview", previewTarget],
    "sync",
    "sync",
    "sync",
    "sync",
  ]);
  assert.equal(toggleGroup.hiddenInput.checked, true);
  assert.equal(toggleGroup.selectedButton.getAttribute("data-active"), "true");
  assert.equal(toggleGroup.otherButton.getAttribute("data-active"), "false");
  assert.deepEqual(notices, [
    ["success", "Checkout Score Pulse: An"],
    ["success", "Einstellung gespeichert."],
    ["info", "Aktion erledigt."],
    ["success", "Einstellung gespeichert."],
  ]);
});

test("createShellActionController suppresses stale turn dart upload callbacks after teardown", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const originalCreateElement = documentRef.createElement.bind(documentRef);
  const file = {
    type: "image/png",
    name: "turn-dart.png",
  };
  const bitmap = {
    width: 240,
    height: 80,
    close() {},
  };
  let resolveBitmap = () => {};
  windowRef.createImageBitmap = () =>
    new Promise((resolve) => {
      resolveBitmap = () => resolve(bitmap);
    });

  documentRef.createElement = (tagName) => {
    const normalizedTagName = String(tagName || "").toLowerCase();
    if (normalizedTagName === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {},
            getImageData() {
              return {
                data: new Uint8ClampedArray(240 * 80 * 4).fill(255),
                width: 240,
                height: 80,
              };
            },
          };
        },
        toDataURL(mimeType) {
          return `data:${mimeType};base64,${"a".repeat(40)}`;
        },
      };
    }
    if (normalizedTagName !== "input") {
      return originalCreateElement(tagName);
    }
    return {
      type: "",
      accept: "",
      style: {},
      tabIndex: 0,
      files: [file],
      onchange: null,
      setAttribute() {},
      click() {
        this.onchange?.();
      },
      remove() {},
    };
  };

  const calls = [];
  const state = { started: true };
  const controller = createShellActionController({
    documentRef,
    windowRef,
    state,
    queueSync: () => calls.push("sync"),
    setNotice: (type, message) => calls.push(["notice", type, message]),
    setThemeActionFeedback: (featureKey, type, message) =>
      calls.push(["feedback", featureKey, type, message]),
    syncTurnDartImageIndicators: (featureKey) => calls.push(["indicator", featureKey]),
    runtimeApi: {
      saveConfig: (patch) => {
        calls.push(["save", patch]);
        return Promise.resolve();
      },
    },
  });

  controller.handleAction("uploadTurnDartImage", null, {
    featureKey: "dart-marker-darts",
    configKey: "dartMarkerDarts",
  });

  state.started = false;
  resolveBitmap();
  await wait(5);

  assert.deepEqual(calls, []);
  documentRef.createElement = originalCreateElement;
});
