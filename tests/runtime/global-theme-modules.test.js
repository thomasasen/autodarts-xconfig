import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeConfig } from "../../src/config/runtime-config.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { mountThemeGlobalBackground } from "../../src/features/themes/global-background/index.js";
import { STYLE_ID as BACKGROUND_STYLE_ID } from "../../src/features/themes/global-background/style.js";
import { mountThemeGlobalTypography } from "../../src/features/themes/global-typography/index.js";
import {
  STYLE_ID as TYPOGRAPHY_STYLE_ID,
  buildThemeGlobalTypographyStyleText,
} from "../../src/features/themes/global-typography/style.js";
import { buildThemeVisualSettingsCss } from "../../src/features/themes/shared/theme-visuals.js";
import { mountTurnDartDisplay } from "../../src/features/turn-dart-display/index.js";
import {
  TURN_DART_DISPLAY_STYLE_ID,
  buildTurnDartDisplayStyleText,
} from "../../src/features/turn-dart-display/style.js";
import { FakeDocument, FakeEvent, createFakeWindow } from "./fake-dom.js";

function createImmediateSchedulerFactory() {
  return (callback) => ({ schedule: callback, cancel() {} });
}

function mountContext(config, documentRef, windowRef) {
  return {
    config,
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    gameState: { subscribe() { return () => {}; } },
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    helpers: { createRafScheduler: createImmediateSchedulerFactory() },
  };
}

test("global background, typography and turn darts build isolated CSS", () => {
  const typographyCss = buildThemeGlobalTypographyStyleText({
    fontPreset: "fragment-mono",
    applyTo: ["scores", "names"],
    accentColor: "#9fdb58",
    scoreColor: "#f7f8fa",
    secondaryTextColor: "#d9e0ea",
    throwLabelColor: "#aab5c5",
    activePlayerTintIntensity: 20,
    turnDartStyle: "gradient",
  });
  assert.match(typographyCss, /Fragment\+Mono/);
  assert.match(typographyCss, /\.ad-ext-player-name/);
  assert.match(typographyCss, /ad-ext-player-active/);
  assert.match(typographyCss, /main \.overflow-clip:has\(\.bg-mono-white\.rounded-full\)/);
  assert.match(typographyCss, /color: #F7F8FA !important/);
  assert.match(typographyCss, /color: #D9E0EA !important/);
  assert.match(typographyCss, /color: #AAB5C5 !important/);
  assert.match(typographyCss, /background-color: #9FDB58 !important/);
  assert.doesNotMatch(typographyCss, /img\[alt="Dart"\]/);

  const backgroundCss = buildThemeVisualSettingsCss({
    backgroundOpacity: 20,
    playerFieldTransparency: 10,
  });
  assert.match(backgroundCss, /main \.overflow-clip:has\(\[role="button"\]\)/);
  assert.match(backgroundCss, /main \.grid > \.relative\.isolate\.overflow-hidden/);
  assert.match(backgroundCss, /background: rgba\(8, 12, 24, 0\.900\) !important/);

  const dartCss = buildTurnDartDisplayStyleText({
    turnDartStyle: "gradient",
    turnDartColor: "#22c55e",
    turnDartGradientColor: "#ef4444",
    turnDartSizePercent: 135,
    turnDartShineEnabled: true,
  });
  assert.match(dartCss, /img\[alt="Dart"\]/);
  assert.match(decodeURIComponent(dartCss), /stop-color="#22C55E"/);
  assert.doesNotMatch(dartCss, /font-family: "Fragment Mono"/);
});

test("global typography keeps modern match font scopes independent", () => {
  const buildScopeCss = (scope) => buildThemeGlobalTypographyStyleText({
    fontPreset: "fragment-mono",
    applyTo: [scope],
  });

  const scoresCss = buildScopeCss("scores");
  assert.match(scoresCss, /main \.overflow-clip \.font-number\.overflow-hidden/);
  assert.match(scoresCss, /main \.bg-surface-surface > \.font-number/);
  assert.doesNotMatch(scoresCss, /:first-child \.font-number/);
  assert.doesNotMatch(scoresCss, /main \.font-display/);

  const throwsCss = buildScopeCss("throws");
  assert.match(throwsCss, /main \.bg-surface-surface > :first-child \.font-number/);
  assert.match(throwsCss, /main \.text-checkout-suggestion/);
  assert.doesNotMatch(throwsCss, /\.font-number\.overflow-hidden/);
  assert.doesNotMatch(throwsCss, /main \.font-display/);

  const namesCss = buildScopeCss("names");
  assert.match(namesCss, /main \.font-display/);
  assert.doesNotMatch(namesCss, /\.font-number/);
  assert.doesNotMatch(namesCss, /\.text-checkout-suggestion/);
});

test("global modules mount independently on matches and clean up after a route change", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/test",
  });
  const config = createRuntimeConfig({
    featureToggles: {
      "themes.globalBackground": true,
      "themes.globalTypography": false,
      turnDartDisplay: true,
    },
    features: {
      themes: {
        globalBackground: {
          enabled: true,
          backgroundImageDataUrl: "data:image/png;base64,AAAA",
        },
        globalTypography: { enabled: false },
      },
      turnDartDisplay: {
        enabled: true,
        turnDartStyle: "solid",
        turnDartColor: "#ffffff",
      },
    },
  });

  const cleanups = [
    mountThemeGlobalBackground(mountContext(config, documentRef, windowRef)),
    mountThemeGlobalTypography(mountContext(config, documentRef, windowRef)),
    mountTurnDartDisplay(mountContext(config, documentRef, windowRef)),
  ];
  assert.ok(documentRef.getElementById(BACKGROUND_STYLE_ID));
  assert.equal(documentRef.getElementById(TYPOGRAPHY_STYLE_ID), null);
  assert.ok(documentRef.getElementById(TURN_DART_DISPLAY_STYLE_ID));

  windowRef.history.pushState({}, "", "/lobbies");
  windowRef.dispatchEvent(new FakeEvent("popstate", { bubbles: false, target: windowRef }));
  assert.equal(documentRef.getElementById(BACKGROUND_STYLE_ID), null);
  assert.equal(documentRef.getElementById(TURN_DART_DISPLAY_STYLE_ID), null);

  cleanups.forEach((cleanup) => cleanup());
});
