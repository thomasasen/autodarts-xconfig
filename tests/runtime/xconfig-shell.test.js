import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { FakeDocument, FakeEvent, FakeStorage, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("xConfig shell injects one menu entry and toggles the panel route safely", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);

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

test("xConfig shell stays idempotent across repeated runtime init and DOM mutation sync", async () => {
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

  first.stop();
});

test("xConfig shell persists feature toggles and settings via UI controls", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const themeAvgToggle = documentRef.getElementById("ad-xconfig-field-theme-x01-showAvg");
  assert.ok(themeAvgToggle);
  themeAvgToggle.checked = false;
  themeAvgToggle.dispatchEvent(new FakeEvent("change", { bubbles: true, target: themeAvgToggle }));
  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.showAvg, false);

  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);

  const turnStartSweepToggle = documentRef.getElementById("ad-xconfig-toggle-turn-start-sweep");
  assert.ok(turnStartSweepToggle);
  turnStartSweepToggle.checked = true;
  turnStartSweepToggle.dispatchEvent(new FakeEvent("change", { bubbles: true, target: turnStartSweepToggle }));
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);
  assert.equal(runtime.getSnapshot().features["turn-start-sweep"].mounted, true);

  const effectSelect = documentRef.getElementById("ad-xconfig-field-checkout-score-pulse-effect");
  assert.ok(effectSelect);
  effectSelect.value = "blink";
  effectSelect.dispatchEvent(new FakeEvent("change", { bubbles: true, target: effectSelect }));
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "blink");

  runtime.stop();
});
