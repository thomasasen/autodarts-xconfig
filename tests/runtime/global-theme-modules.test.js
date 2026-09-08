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
    activePlayerTintIntensity: 20,
    turnDartStyle: "gradient",
  });
  assert.match(typographyCss, /Fragment\+Mono/);
  assert.match(typographyCss, /\.ad-ext-player-name/);
  assert.match(typographyCss, /ad-ext-player-active/);
  assert.doesNotMatch(typographyCss, /img\[alt="Dart"\]/);

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
