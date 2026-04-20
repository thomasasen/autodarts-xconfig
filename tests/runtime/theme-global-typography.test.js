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
import { buildStyleText as buildCricketGridFxStyleText } from "../../src/features/cricket-grid-fx/style.js";
import { buildCricketThemeCss } from "../../src/features/themes/cricket/style.js";
import { buildX01ThemeCss } from "../../src/features/themes/x01/style.js";
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
    childNodes,
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
  assert.doesNotMatch(systemStyle, /--ad-ext-theme-accent-color:/);
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

test("theme global typography emits semantic color overrides only for configured roles", () => {
  const colorStyle = buildThemeGlobalTypographyStyleText({
    fontPreset: "system",
    applyTo: ["scores"],
    accentColor: "#9fdb58",
    scoreColor: "#123456",
    secondaryTextColor: "#abcdef",
    throwLabelColor: "#fedcba",
  });

  assert.match(colorStyle, /:root \{/);
  assert.match(colorStyle, /--ad-ext-theme-accent-color: #9FDB58;/);
  assert.match(colorStyle, /--ad-ext-theme-card-active-border-color: #9FDB58;/);
  assert.match(
    colorStyle,
    /--ad-ext-theme-card-active-outline-color: rgba\(159, 219, 88, 0\.24\);/
  );
  assert.match(colorStyle, /--ad-ext-theme-score-active-color: #9FDB58;/);
  assert.match(colorStyle, /--ad-ext-theme-score-winner-color: #9FDB58;/);
  assert.match(colorStyle, /--ad-ext-theme-text-primary-color: #123456;/);
  assert.match(colorStyle, /--ad-ext-theme-score-inactive-color: #123456;/);
  assert.match(colorStyle, /--ad-ext-theme-turn-points-color: #123456;/);
  assert.match(colorStyle, /--ad-ext-theme-text-secondary-color: #ABCDEF;/);
  assert.match(colorStyle, /--ad-ext-theme-name-active-color: #ABCDEF;/);
  assert.match(colorStyle, /--ad-ext-theme-meta-winner-color: #ABCDEF;/);
  assert.match(colorStyle, /--ad-ext-theme-throw-label-color: #FEDCBA;/);
});

test("theme CSS can use Templates Global as the active background fallback visual config", () => {
  const themeCss = buildX01ThemeCss(
    {
      showAvg: true,
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
    },
    {
      visualConfig: {
        enabled: true,
        backgroundDisplayMode: "tile",
        backgroundOpacity: 70,
        playerFieldTransparency: 45,
        backgroundImageDataUrl: "data:image/png;base64,GGGG",
      },
    }
  );

  assert.match(themeCss, /url\("data:image\/png;base64,GGGG"\)/);
  assert.match(themeCss, /background-size:\s*auto\s*!important;/);
  assert.match(themeCss, /background-repeat:\s*repeat\s*!important;/);
});

test("theme CSS can use Templates Global preset wallpaper assets as fallback visuals", () => {
  const themeCss = buildX01ThemeCss(
    {
      showAvg: true,
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
    },
    {
      visualConfig: {
        enabled: true,
        backgroundDisplayMode: "fill",
        backgroundOpacity: 25,
        playerFieldTransparency: 15,
        backgroundImageDataUrl: "",
        backgroundAssetKey: "matrix",
      },
    }
  );

  assert.match(themeCss, /theme-presets\/matrix\.png/);
  assert.doesNotMatch(themeCss, /data:image/);
});

test("cricket theme CSS can use Templates Global semantic colors without typography bleeding into grid-fx cells", () => {
  const themeCss = buildCricketThemeCss({ showAvg: true });
  const gridFxCss = buildCricketGridFxStyleText();
  const typographyCss = buildThemeGlobalTypographyStyleText({
    fontPreset: "archivo-black",
    applyTo: ["scores", "names", "throws"],
    accentColor: "#00d9ff",
    scoreColor: "#ffffff",
    secondaryTextColor: "#dce9ff",
    throwLabelColor: "#8fa9c2",
  });
  const combinedCss = `${themeCss}\n\n${typographyCss}`;

  assert.match(typographyCss, /--ad-ext-theme-accent-color: #00D9FF;/);
  assert.match(typographyCss, /--ad-ext-theme-score-inactive-color: #FFFFFF;/);
  assert.match(typographyCss, /--ad-ext-theme-name-color: #DCE9FF;/);
  assert.match(typographyCss, /--ad-ext-theme-throw-label-color: #8FA9C2;/);
  assert.match(typographyCss, /\.ad-ext-player-score,\s*\.ad-ext-turn-points,\s*#ad-ext-turn > \.score,/s);
  assert.match(
    typographyCss,
    /\.ad-ext-player-score,\s*\.ad-ext-turn-points,\s*#ad-ext-turn > \.score,\s*\.ad-ext-player-name,\s*\.ad-ext-player-name > p,/s
  );
  assert.doesNotMatch(typographyCss, /ad-ext-crfx-cell/);
  assert.doesNotMatch(typographyCss, /ad-ext-crfx-label-cell/);
  assert.doesNotMatch(typographyCss, /ad-ext-cricket-target/);
  assert.match(combinedCss, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-cricket-score-color\)\s*!important;/s);
  assert.match(combinedCss, /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s+\.ad-ext-player-name,[^}]*color:\s*var\(--ad-ext-theme-name-active-color\)\s*!important;/s);
  assert.match(gridFxCss, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-score\s*\{[^}]*repeating-linear-gradient\(/s);
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

  const x01TwoPlayerConfig = createRuntimeConfig({
    featureToggles: {
      "themes.globalTypography": true,
      "themes.x01": false,
      "themes.gotcha": false,
      "themes.x01TwoPlayer": true,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          fontPreset: "system",
          applyTo: ["scores"],
        },
        x01: {
          enabled: false,
        },
        gotcha: {
          enabled: false,
        },
        x01TwoPlayer: {
          enabled: true,
        },
      },
    },
  });
  assert.equal(
    resolveThemeGlobalTypographyActiveTheme({
      config: x01TwoPlayerConfig,
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
    "themes.x01TwoPlayer"
  );

  documentRef.variantElement.textContent = "Gotcha";
  const gotchaConfig = createRuntimeConfig({
    featureToggles: {
      "themes.globalTypography": true,
      "themes.x01": false,
      "themes.gotcha": true,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          fontPreset: "system",
          applyTo: ["scores"],
        },
        x01: {
          enabled: false,
        },
        gotcha: {
          enabled: true,
        },
      },
    },
  });
  assert.equal(
    resolveThemeGlobalTypographyActiveTheme({
      config: gotchaConfig,
      gameState: {
        isX01Variant() {
          return false;
        },
        isCricketVariant() {
          return false;
        },
      },
      documentRef,
      windowRef,
    })?.configKey,
    "themes.gotcha"
  );

  documentRef.variantElement.textContent = "Cricket";
  const cricketConfig = createRuntimeConfig({
    featureToggles: {
      "themes.globalTypography": true,
      "themes.x01": false,
      "themes.cricket": true,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          fontPreset: "system",
          applyTo: ["scores", "names"],
        },
        x01: {
          enabled: false,
        },
        cricket: {
          enabled: true,
          showAvg: true,
        },
      },
    },
  });
  assert.equal(
    resolveThemeGlobalTypographyActiveTheme({
      config: cricketConfig,
      gameState: {
        isX01Variant() {
          return false;
        },
        isCricketVariant() {
          return true;
        },
      },
      documentRef,
      windowRef,
    })?.configKey,
    "themes.cricket"
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

test("theme global typography re-appends its style after theme styles so color overrides stay authoritative", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/abc",
  });
  const toolsHost = documentRef.createElement("autodarts-tools-wxt");
  toolsHost.shadowRoot = createFakeShadowRoot();
  documentRef.body.appendChild(toolsHost);

  const staleTypographyStyle = documentRef.createElement("style");
  staleTypographyStyle.id = STYLE_ID;
  staleTypographyStyle.textContent = ":root { --ad-ext-theme-accent-color: #000000; }";
  documentRef.head.appendChild(staleTypographyStyle);
  const themeStyle = documentRef.createElement("style");
  themeStyle.id = "ad-ext-theme-x01-style";
  themeStyle.textContent = ":root { --ad-ext-theme-accent-color: #9fdb58; }";
  documentRef.head.appendChild(themeStyle);

  const cleanup = mountThemeGlobalTypography({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    config: createEnabledTypographyConfig({
      globalTypography: {
        fontPreset: "system",
        applyTo: ["scores"],
        accentColor: "#ff00a2",
      },
    }),
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

  assert.equal(documentRef.head.lastElementChild?.id, STYLE_ID);

  cleanup();
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
