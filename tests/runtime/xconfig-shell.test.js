import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { FakeEvent, FakeStorage, createFakeWindow, FakeDocument } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clickFeatureToggle(documentRef, featureKey, enabled) {
  const selector = `[data-adxconfig-action='set-feature'][data-feature-key='${featureKey}'][data-feature-enabled='${enabled ? "true" : "false"}']`;
  const button = documentRef.querySelector(selector);
  assert.ok(button, `missing toggle button for ${featureKey}`);
  button.click();
}

function clickSettingToggle(documentRef, featureKey, settingKey, enabled) {
  const selector = `[data-adxconfig-action='set-setting-toggle'][data-feature-key='${featureKey}'][data-setting-key='${settingKey}'][data-setting-value='${enabled ? "true" : "false"}']`;
  const button = documentRef.querySelector(selector);
  assert.ok(button, `missing setting toggle button for ${featureKey}.${settingKey}`);
  button.click();
}

test("xConfig shell injects one menu entry, opens route and closes back safely", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  assert.equal(menuButton.getAttribute("data-adxconfig-action"), "open");

  menuButton.click();
  await wait(5);

  assert.equal(windowRef.location.pathname, "/ad-xconfig");
  assert.equal(documentRef.variantElement.style.display, "none");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.style.display, "block");

  const closeButton = documentRef.querySelector("[data-adxconfig-action='close']");
  assert.ok(closeButton);
  closeButton.click();
  await wait(5);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(panelHost.style.display, "none");
  assert.equal(documentRef.variantElement.style.display, "");

  runtime.stop();
});

test("xConfig menu injection stays idempotent and label collapses on narrow sidebar", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  const label = documentRef.querySelector("#ad-xconfig-menu-item .ad-xconfig-menu-label");
  assert.ok(label);
  assert.notEqual(label.style.display, "none");

  documentRef.sidebar.__rect = { width: 96, height: 720 };
  documentRef.flushMutations();
  await wait(5);

  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  assert.equal(label.style.display, "none");

  documentRef.sidebar.__rect = { width: 260, height: 720 };
  documentRef.flushMutations();
  await wait(5);

  assert.equal(label.style.display, "inline");
  runtime.stop();
});

test("xConfig shell stays idempotent across repeated init and DOM mutation sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const first = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  const initialInspect = windowRef.__adXConfig.inspect();
  const second = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  assert.equal(first, second);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);

  documentRef.flushMutations();
  await wait(5);

  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-panel-host").length, 1);
  assert.equal(windowRef.__adXConfig.inspect().observerCount, initialInspect.observerCount);
  assert.equal(windowRef.__adXConfig.inspect().listenerCount, initialInspect.listenerCount);

  first.stop();
});

test("xConfig shell keeps listener and observer counts stable across open/close cycles", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  const initialInspect = windowRef.__adXConfig.inspect();
  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);

  for (let cycle = 0; cycle < 4; cycle += 1) {
    menuButton.click();
    await wait(5);
    const closeButton = documentRef.querySelector("[data-adxconfig-action='close']");
    assert.ok(closeButton);
    closeButton.click();
    documentRef.flushMutations();
    await wait(5);
  }

  const currentInspect = windowRef.__adXConfig.inspect();
  assert.equal(currentInspect.observerCount, initialInspect.observerCount);
  assert.equal(currentInspect.listenerCount, initialInspect.listenerCount);

  runtime.stop();
});

test("xConfig shell wires tabs, settings modal, toggles and save actions", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  clickFeatureToggle(documentRef, "theme-x01", true);
  await wait(5);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);
  clickFeatureToggle(documentRef, "turn-start-sweep", true);
  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);

  const openCheckoutSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(openCheckoutSettings);
  openCheckoutSettings.click();
  await wait(5);

  const effectSelect = documentRef.getElementById("ad-xconfig-field-checkout-score-pulse-effect");
  assert.ok(effectSelect);
  effectSelect.value = "blink";
  effectSelect.dispatchEvent(new FakeEvent("change", { bubbles: true, target: effectSelect }));
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "blink");

  const closeSettings = documentRef.querySelector("[data-adxconfig-action='close-settings']");
  assert.ok(closeSettings);
  closeSettings.click();
  await wait(5);

  documentRef.getElementById("ad-xconfig-tab-themes").click();
  await wait(5);
  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await wait(5);

  clickSettingToggle(documentRef, "theme-x01", "showAvg", false);
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.showAvg, false);

  runtime.stop();
});

test("xConfig shell theme background upload and clear actions are clickable and persisted", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    const node = originalCreateElement(tagName);
    if (String(tagName || "").toLowerCase() === "input") {
      const originalClick = typeof node.click === "function" ? node.click.bind(node) : null;
      node.click = () => {
        if (node.type === "file") {
          node.files = [{ name: "bg.png" }];
          if (typeof node.onchange === "function") {
            node.onchange();
          }
          return;
        }
        if (originalClick) {
          originalClick();
        }
      };
    }
    return node;
  };
  windowRef.FileReader = class FakeFileReader {
    readAsDataURL() {
      this.result = "data:image/png;base64,ZmFrZS1kYXRh";
      if (typeof this.onload === "function") {
        this.onload();
      }
    }
  };

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await wait(5);

  const uploadButton = documentRef.getElementById("ad-xconfig-field-theme-x01-uploadThemeBackground");
  assert.ok(uploadButton);
  uploadButton.click();
  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,ZmFrZS1kYXRh");

  const clearButton = documentRef.getElementById("ad-xconfig-field-theme-x01-clearThemeBackground");
  assert.ok(clearButton);
  clearButton.click();
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "");

  runtime.stop();
});

test("xConfig shell restores persisted toggle, setting and background state after reload", async () => {
  const localStorage = new FakeStorage();

  const firstDocument = new FakeDocument();
  const firstWindow = createFakeWindow({ documentRef: firstDocument, localStorage });
  const firstRuntime = await initializeTampermonkeyRuntime({
    windowRef: firstWindow,
    documentRef: firstDocument,
  });
  await wait(5);

  firstDocument.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  clickFeatureToggle(firstDocument, "theme-x01", true);
  await wait(5);
  firstDocument.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);
  clickFeatureToggle(firstDocument, "turn-start-sweep", true);
  await wait(5);

  const openSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await wait(5);

  const effectSelect = firstDocument.getElementById("ad-xconfig-field-checkout-score-pulse-effect");
  assert.ok(effectSelect);
  effectSelect.value = "glow";
  effectSelect.dispatchEvent(new FakeEvent("change", { bubbles: true, target: effectSelect }));
  await wait(5);

  await firstWindow.__adXConfig.setThemeBackgroundImage("x01", "data:image/png;base64,cGVyc2lzdGVk");
  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "glow");
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,cGVyc2lzdGVk");

  firstRuntime.stop();

  const secondDocument = new FakeDocument();
  const secondWindow = createFakeWindow({ documentRef: secondDocument, localStorage });
  const secondRuntime = await initializeTampermonkeyRuntime({
    windowRef: secondWindow,
    documentRef: secondDocument,
  });
  await wait(5);

  const secondSnapshot = secondRuntime.getSnapshot();
  assert.equal(secondSnapshot.features["theme-x01"].enabled, true);
  assert.equal(secondSnapshot.features["turn-start-sweep"].enabled, true);
  assert.equal(secondSnapshot.features["turn-start-sweep"].mounted, true);
  assert.equal(secondSnapshot.features["theme-x01"].mounted, true);
  assert.equal(
    secondSnapshot.features["theme-x01"].config.backgroundImageDataUrl,
    "data:image/png;base64,cGVyc2lzdGVk"
  );

  secondDocument.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const restoredThemeToggle = secondDocument.querySelector(
    "[data-adxconfig-action='set-feature'][data-feature-key='theme-x01'][data-feature-enabled='true']"
  );
  assert.ok(restoredThemeToggle);
  assert.equal(restoredThemeToggle.getAttribute("data-active"), "true");

  secondDocument.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);
  const openSecondSettings = secondDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  openSecondSettings.click();
  await wait(5);

  const restoredEffect = secondDocument.getElementById("ad-xconfig-field-checkout-score-pulse-effect");
  assert.ok(restoredEffect);
  assert.equal(restoredEffect.value, "glow");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);

  secondRuntime.stop();
});
