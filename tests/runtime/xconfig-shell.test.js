import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { FakeEvent, FakeStorage, createFakeWindow, FakeDocument } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, { timeoutMs = 120, intervalMs = 4 } = {}) {
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  while (Date.now() < deadline) {
    if (check()) {
      return true;
    }
    await wait(intervalMs);
  }
  return Boolean(check());
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
  const boardsLink = Array.from(documentRef.sidebar.querySelectorAll("a[href]"))
    .find((link) => String(link.getAttribute("href") || "") === "/boards");
  assert.ok(boardsLink);
  assert.equal(boardsLink.nextElementSibling, menuButton);
  assert.ok(menuButton.classList.contains("chakra-link"));

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

test("xConfig shell keeps sidebar visible when layout has no main element", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument({ contentTagName: "div" });
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);

  menuButton.click();
  await wait(5);

  assert.equal(windowRef.location.pathname, "/ad-xconfig");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.parentNode, documentRef.main);
  assert.equal(panelHost.style.display, "block");
  assert.notEqual(documentRef.sidebar.style.display, "none");
  assert.notEqual(documentRef.main.style.display, "none");
  assert.equal(documentRef.variantElement.style.display, "none");

  const closeButton = documentRef.querySelector("[data-adxconfig-action='close']");
  assert.ok(closeButton);
  closeButton.click();
  await wait(5);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(panelHost.style.display, "none");
  assert.notEqual(documentRef.sidebar.style.display, "none");
  assert.notEqual(documentRef.main.style.display, "none");
  assert.equal(documentRef.variantElement.style.display, "");

  runtime.stop();
});

test("xConfig shell does not hijack external links that accidentally reuse xConfig action attributes", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  const toolsLink = documentRef.createElement("a");
  toolsLink.id = "autodarts-tools-menu-item";
  toolsLink.classList.add("chakra-link");
  toolsLink.setAttribute("href", "/tools");
  toolsLink.setAttribute("data-adxconfig-action", "open");
  toolsLink.setAttribute("aria-label", "AD xConfig");
  toolsLink.setAttribute("title", "AD xConfig");
  toolsLink.textContent = "Tools";
  documentRef.sidebar.appendChild(toolsLink);
  documentRef.flushMutations();
  await wait(5);

  const clickEvent = new FakeEvent("click", { bubbles: true, cancelable: true, target: toolsLink });
  const clickAllowed = toolsLink.dispatchEvent(clickEvent);
  await wait(5);

  assert.equal(clickAllowed, true);
  assert.equal(clickEvent.defaultPrevented, false);
  assert.equal(windowRef.location.pathname, "/lobbies");

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);
  menuButton.click();
  await wait(5);
  assert.equal(windowRef.location.pathname, "/ad-xconfig");

  runtime.stop();
});

test("xConfig observer ignores self-managed menu/panel mutations and only syncs for external changes", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  let rafCount = 0;
  const nativeRaf = windowRef.requestAnimationFrame.bind(windowRef);
  windowRef.requestAnimationFrame = (callback) => {
    rafCount += 1;
    return nativeRaf(callback);
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(8);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(8);

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(panelHost);
  assert.ok(menuButton);
  assert.ok(panelHost.firstElementChild);

  const baseline = rafCount;
  documentRef.flushMutations([
    { target: panelHost, addedNodes: [panelHost.firstElementChild], removedNodes: [] },
    { target: menuButton, addedNodes: [menuButton.firstElementChild], removedNodes: [] },
  ]);
  await wait(8);
  const afterManagedMutations = rafCount;
  assert.ok(afterManagedMutations - baseline <= 1);

  documentRef.flushMutations([
    { target: documentRef.main, addedNodes: [documentRef.createElement("div")], removedNodes: [] },
  ]);
  await wait(8);
  assert.ok(rafCount > afterManagedMutations);

  runtime.stop();
});

test("xConfig settings modal preserves node identity and scroll offsets during external sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(8);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(8);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(8);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='cricket-grid-fx']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await wait(8);

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  const shell = panelHost?.querySelector?.(".ad-xconfig-shell") || null;
  const modal = panelHost?.querySelector?.(".ad-xconfig-modal") || null;
  const modalBody = panelHost?.querySelector?.(".ad-xconfig-modal-body") || null;
  assert.ok(panelHost);
  assert.ok(shell);
  assert.ok(modal);
  assert.ok(modalBody);

  panelHost.scrollTop = 120;
  modal.scrollTop = 180;
  modalBody.scrollTop = 260;

  documentRef.flushMutations([
    {
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  await wait(8);

  const panelHostAfter = documentRef.getElementById("ad-xconfig-panel-host");
  const shellAfter = panelHostAfter?.querySelector?.(".ad-xconfig-shell") || null;
  const modalAfter = panelHostAfter?.querySelector?.(".ad-xconfig-modal") || null;
  const modalBodyAfter = panelHostAfter?.querySelector?.(".ad-xconfig-modal-body") || null;

  assert.equal(panelHostAfter, panelHost);
  assert.equal(shellAfter, shell);
  assert.equal(modalAfter, modal);
  assert.equal(modalBodyAfter, modalBody);
  assert.equal(Number(panelHostAfter?.scrollTop || 0), 120);
  assert.equal(Number(modalAfter?.scrollTop || 0), 180);
  assert.equal(Number(modalBodyAfter?.scrollTop || 0), 260);

  runtime.stop();
});

test("xConfig settings modal keeps container identity while applying setting updates", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(8);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(8);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(8);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='cricket-grid-fx']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await wait(8);

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  const modal = panelHost?.querySelector?.(".ad-xconfig-modal") || null;
  const modalBody = panelHost?.querySelector?.(".ad-xconfig-modal-body") || null;
  assert.ok(panelHost);
  assert.ok(modal);
  assert.ok(modalBody);

  panelHost.scrollTop = 64;
  modal.scrollTop = 96;
  modalBody.scrollTop = 192;

  clickSettingToggle(documentRef, "cricket-grid-fx", "rowWave", false);
  await wait(12);

  const panelHostAfter = documentRef.getElementById("ad-xconfig-panel-host");
  const modalAfter = panelHostAfter?.querySelector?.(".ad-xconfig-modal") || null;
  const modalBodyAfter = panelHostAfter?.querySelector?.(".ad-xconfig-modal-body") || null;

  assert.equal(panelHostAfter, panelHost);
  assert.equal(modalAfter, modal);
  assert.equal(modalBodyAfter, modalBody);
  assert.equal(Number(panelHostAfter?.scrollTop || 0), 64);
  assert.equal(Number(modalAfter?.scrollTop || 0), 96);
  assert.equal(Number(modalBodyAfter?.scrollTop || 0), 192);

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

test("xConfig shell links cards and settings modal to the matching README anchor", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);

  const cardReadmeButton = documentRef.querySelector(
    "[data-adxconfig-action='open-readme'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(cardReadmeButton);
  cardReadmeButton.click();
  await wait(5);

  assert.equal(
    windowRef.__openedUrls.at(-1),
    "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#animation-autodarts-animate-checkout-score-pulse"
  );

  const settingsButton = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(settingsButton);
  settingsButton.click();
  await wait(5);

  const modalReadmeButtons = documentRef.querySelectorAll(
    "[data-adxconfig-action='open-readme'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(modalReadmeButtons.length >= 2);
  modalReadmeButtons[1].click();
  await wait(5);

  assert.equal(
    windowRef.__openedUrls.at(-1),
    "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#animation-autodarts-animate-checkout-score-pulse"
  );

  runtime.stop();
});

test("xConfig shell renders mapped preview backgrounds and compact legacy back button", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const backButton = documentRef.querySelector("[data-adxconfig-action='close']");
  assert.ok(backButton);
  assert.equal(backButton.classList.contains("ad-xconfig-back-btn"), true);
  const styleNode = documentRef.getElementById("ad-xconfig-shell-style");
  assert.ok(styleNode);
  assert.equal(String(styleNode.textContent || "").includes("flex-direction:column"), true);
  assert.equal(
    String(styleNode.textContent || "").includes(".ad-xconfig-card-head{display:flex;justify-content:space-between;align-items:flex-start"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes(".ad-xconfig-onoff-btn + .ad-xconfig-onoff-btn"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes(".ad-xconfig-onoff{position:relative;display:inline-flex;align-self:flex-start"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes("height:2.2rem;min-height:2.2rem"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes("height:100%;padding:0 .45rem"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes("display:flex;align-items:center;justify-content:center"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes('.ad-xconfig-onoff-btn[data-active="false"]'),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes('.ad-xconfig-onoff-btn--off[data-active="true"]'),
    true
  );

  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);

  [
    "checkout-score-pulse",
    "checkout-board-targets",
    "tv-board-zoom",
    "turn-start-sweep",
  ].forEach((featureKey) => {
    const card = documentRef.querySelector(`.ad-xconfig-card[data-feature-key='${featureKey}']`);
    assert.ok(card, `missing card for ${featureKey}`);
    assert.ok(card.querySelector(".ad-xconfig-card-bg img"), `missing preview background for ${featureKey}`);
  });

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

test("xConfig shell runs feature preview actions for winner fireworks", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const originalSetTimeout = windowRef.setTimeout.bind(windowRef);
  windowRef.setTimeout = (callback, ms, ...args) => {
    return originalSetTimeout(callback, Math.min(Number(ms) || 0, 60), ...args);
  };
  windowRef.confetti = function fakeConfetti() {};

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='winner-fireworks']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await wait(5);

  const firstPreviewButton = documentRef.getElementById(
    "ad-xconfig-field-winner-fireworks-run-feature-action"
  );
  assert.ok(firstPreviewButton);
  const firstPreviewClick = new FakeEvent("click", {
    bubbles: true,
    cancelable: true,
    target: firstPreviewButton,
  });
  firstPreviewButton.dispatchEvent(firstPreviewClick);
  assert.equal(firstPreviewClick.defaultPrevented, true);
  assert.equal(
    await waitFor(() => Boolean(documentRef.getElementById("ad-ext-winner-fireworks-preview"))),
    true
  );

  windowRef.dispatchEvent(new FakeEvent("pointerdown", { bubbles: true }));
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-preview")), false);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-style-preview")), false);

  const secondPreviewButton = documentRef.getElementById(
    "ad-xconfig-field-winner-fireworks-run-feature-action"
  );
  assert.ok(secondPreviewButton);
  const secondPreviewClick = new FakeEvent("click", {
    bubbles: true,
    cancelable: true,
    target: secondPreviewButton,
  });
  secondPreviewButton.dispatchEvent(secondPreviewClick);
  assert.equal(secondPreviewClick.defaultPrevented, true);
  assert.equal(
    await waitFor(() => Boolean(documentRef.getElementById("ad-ext-winner-fireworks-preview"))),
    true
  );
  await wait(90);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-preview")), false);

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
