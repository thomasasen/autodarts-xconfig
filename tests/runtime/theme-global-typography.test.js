import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeConfig } from "../../src/config/runtime-config.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import {
  mountThemeGlobalTypography,
  resolveThemeGlobalTypographyActiveTheme,
} from "../../src/features/themes/global-typography/index.js";
import {
  STYLE_ID,
  TOOLS_SHADOW_STYLE_ID,
  buildThemeGlobalTypographyStyleText,
} from "../../src/features/themes/global-typography/style.js";
import { FakeDocument, FakeEvent, createFakeWindow } from "./fake-dom.js";

function createImmediateSchedulerFactory() {
  return (callback) => ({
    schedule() {
      callback();
    },
    cancel() {},
  });
}

function createEnabledTypographyConfig(overrides = {}) {
  return createRuntimeConfig({
    featureToggles: {
      "themes.globalTypography": true,
      "themes.x01": true,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          fontPreset: "system",
          applyTo: ["scores"],
          debug: false,
          ...overrides.globalTypography,
        },
        x01: {
          enabled: true,
          ...overrides.x01,
        },
      },
    },
  });
}

function createFakeShadowRoot() {
  const childNodes = [];

  return {
    appendChild(node) {
      if (!node) {
        return node;
      }
      childNodes.push(node);
      node.parentNode = this;
      return node;
    },
    removeChild(node) {
      const index = childNodes.indexOf(node);
      if (index >= 0) {
        childNodes.splice(index, 1);
      }
      if (node) {
        node.parentNode = null;
      }
      return node;
    },
    getElementById(id) {
      return childNodes.find((node) => node?.id === id) || null;
    },
    querySelector(selector) {
      const idMatch = /^#(.+)$/.exec(String(selector || "").trim());
      return idMatch ? this.getElementById(idMatch[1]) : null;
    },
  };
}

test("theme global typography builds stable CSS with fallback stacks and only one selected remote font", () => {
  const systemStyle = buildThemeGlobalTypographyStyleText({
    fontPreset: "system",
    applyTo: ["scores", "throws"],
  });
  assert.doesNotMatch(systemStyle, /fonts\.bunny\.net/);
  assert.match(systemStyle, /\.ad-ext-player-score/);
  assert.match(systemStyle, /#ad-ext-turn > \.ad-ext-turn-throw/);
  assert.match(systemStyle, /#ad-ext-turn > \.suggestion/);
  assert.match(systemStyle, /\.ad-ext-checkout-suggestion/);
  assert.match(systemStyle, /"Open Sans", "Segoe UI", Tahoma, sans-serif/);

  const remoteStyle = buildThemeGlobalTypographyStyleText({
    fontPreset: "fragment-mono",
    applyTo: ["scores", "names"],
  });
  assert.match(remoteStyle, /https:\/\/fonts\.bunny\.net\/css\?family=Fragment\+Mono/);
  assert.equal((remoteStyle.match(/fonts\.bunny\.net/g) || []).length, 1);
  assert.match(remoteStyle, /\.ad-ext-player-name/);
  assert.doesNotMatch(remoteStyle, /#ad-ext-turn > \.ad-ext-turn-throw/);
  assert.match(remoteStyle, /"Fragment Mono", "SFMono-Regular", Consolas/);
});

test("theme global typography only resolves an active theme inside the matching game context", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/abc",
  });

  const x01Config = createEnabledTypographyConfig();
  assert.equal(
    resolveThemeGlobalTypographyActiveTheme({
      config: x01Config,
      gameState: {
        isX01Variant() {
          return true;
        },
        isCricketVariant() {
          return false;
        },
      },
      documentRef,
      windowRef,
    })?.configKey,
    "themes.x01"
  );

  const inactiveConfig = createRuntimeConfig({
    featureToggles: {
      "themes.globalTypography": true,
      "themes.x01": false,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
        },
        x01: {
          enabled: false,
        },
      },
    },
  });
  assert.equal(
    resolveThemeGlobalTypographyActiveTheme({
      config: inactiveConfig,
      gameState: {
        isX01Variant() {
          return true;
        },
        isCricketVariant() {
          return false;
        },
      },
      documentRef,
      windowRef,
    }),
    null
  );

  const lobbyWindow = createFakeWindow({
    documentRef: new FakeDocument(),
    href: "https://play.autodarts.io/lobbies",
  });
  assert.equal(
    resolveThemeGlobalTypographyActiveTheme({
      config: x01Config,
      gameState: {
        isX01Variant() {
          return true;
        },
        isCricketVariant() {
          return false;
        },
      },
      documentRef: lobbyWindow.document,
      windowRef: lobbyWindow,
    }),
    null
  );
});

test("theme global typography mounts only for enabled theme contexts and removes its style outside them", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/abc",
  });
  const documentScore = documentRef.createElement("div");
  documentScore.classList.add("score");
  documentRef.turnContainer.appendChild(documentScore);
  const toolsHost = documentRef.createElement("autodarts-tools-wxt");
  toolsHost.shadowRoot = createFakeShadowRoot();
  documentRef.body.appendChild(toolsHost);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const config = createEnabledTypographyConfig({
    globalTypography: {
      fontPreset: "system",
      applyTo: ["scores", "throws"],
    },
  });

  const cleanup = mountThemeGlobalTypography({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    config,
    gameState: {
      subscribe() {
        return () => {};
      },
      isX01Variant() {
        return true;
      },
      isCricketVariant() {
        return false;
      },
    },
    registries: {
      observers,
      listeners,
    },
    helpers: {
      createRafScheduler: createImmediateSchedulerFactory(),
    },
  });

  const styleNode = documentRef.getElementById(STYLE_ID);
  assert.ok(styleNode);
  assert.doesNotMatch(String(styleNode.textContent || ""), /fonts\.bunny\.net/);
  assert.match(String(styleNode.textContent || ""), /#ad-ext-turn > \.ad-ext-turn-throw/);
  const shadowStyleNode = toolsHost.shadowRoot.getElementById(TOOLS_SHADOW_STYLE_ID);
  assert.ok(shadowStyleNode);
  assert.match(String(shadowStyleNode.textContent || ""), /\.ad-ext-checkout-suggestion/);

  windowRef.history.pushState({}, "", "/lobbies");
  windowRef.dispatchEvent(new FakeEvent("popstate", { bubbles: false, target: windowRef }));
  assert.equal(documentRef.getElementById(STYLE_ID), null);
  assert.equal(toolsHost.shadowRoot.getElementById(TOOLS_SHADOW_STYLE_ID), null);

  cleanup();
  assert.equal(documentRef.getElementById(STYLE_ID), null);
  assert.equal(toolsHost.shadowRoot.getElementById(TOOLS_SHADOW_STYLE_ID), null);
});

test("theme global typography does not mount without an active xConfig theme for the current variant", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/abc",
  });
  const config = createRuntimeConfig({
    featureToggles: {
      "themes.globalTypography": true,
      "themes.x01": false,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          fontPreset: "archivo-black",
          applyTo: ["scores"],
        },
        x01: {
          enabled: false,
        },
      },
    },
  });

  const cleanup = mountThemeGlobalTypography({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    config,
    gameState: {
      subscribe() {
        return () => {};
      },
      isX01Variant() {
        return true;
      },
      isCricketVariant() {
        return false;
      },
    },
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    helpers: {
      createRafScheduler: createImmediateSchedulerFactory(),
    },
  });

  assert.equal(documentRef.getElementById(STYLE_ID), null);
  cleanup();
});
