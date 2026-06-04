import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import { DART_DESIGN_KEYS } from "../../src/shared/feature-assets.manifest.js";
import { THEME_GLOBAL_TEMPLATE_PRESETS } from "../../src/shared/theme-global-template-presets.js";
import { THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS } from "../../src/shared/theme-global-typography-presets.js";
import { USERSCRIPT_DOWNLOAD_URL } from "../../src/features/xconfig-ui/update-check.js";
import {
  DART_MARKER_EMPHASIS_PREVIEW_ATTRIBUTE,
  DART_MARKER_EMPHASIS_PREVIEW_MARKER_ATTRIBUTE,
} from "../../src/features/xconfig-ui/dart-marker-emphasis-preview-contract.js";
import {
  BASE_CLASS as DART_MARKER_EMPHASIS_BASE_CLASS,
  EFFECT_CLASSES as DART_MARKER_EMPHASIS_EFFECT_CLASSES,
} from "../../src/features/dart-marker-emphasis/style.js";
import {
  EFFECT_CLASSES as CHECKOUT_SCORE_PULSE_EFFECT_CLASSES,
  HIGHLIGHT_CLASS as CHECKOUT_SCORE_PULSE_HIGHLIGHT_CLASS,
  STYLE_VARIABLES as CHECKOUT_SCORE_PULSE_STYLE_VARIABLES,
} from "../../src/features/checkout-score-pulse/style.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { ELECTRIC_FILTER_DEFS_NODE_ID } from "../../src/shared/electric-border-engine.js";
import { FakeEvent, FakeStorage, createFakeWindow, FakeDocument } from "./fake-dom.js";

const CHANGELOG_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/CHANGELOG.md";
const DEFAULT_TURN_DART_CONFIG = Object.freeze({
  turnDartStyle: "original",
  turnDartTextTemplate: "",
  turnDartColor: "#FFFFFF",
  turnDartGradientColor: "#F97316",
  turnDartSizePercent: 115,
  turnDartImageDataUrl: "",
});

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, { timeoutMs = 120, intervalMs = 4 } = {}) {
  const now = () => (typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now());
  const deadline = now() + Math.max(0, Number(timeoutMs) || 0);
  while (now() < deadline) {
    if (check()) {
      return true;
    }
    await wait(intervalMs);
  }
  return Boolean(check());
}

async function waitForMenuButton(documentRef) {
  assert.equal(
    await waitFor(() => Boolean(documentRef.getElementById("ad-xconfig-menu-item"))),
    true
  );
}

async function waitForShellOpen(windowRef, documentRef) {
  assert.equal(
    await waitFor(() => {
      const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
      return (
        windowRef.location.hash === "#ad-xconfig" &&
        panelHost &&
        panelHost.style.display === "block" &&
        documentRef.variantElement.style.display === "none"
      );
    }),
    true
  );
}

async function waitForShellClosed(windowRef, documentRef) {
  assert.equal(
    await waitFor(() => {
      const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
      return (
        windowRef.location.hash === "" &&
        (!panelHost || panelHost.style.display === "none") &&
        documentRef.variantElement.style.display === ""
      );
    }),
    true
  );
}

async function waitForActiveTab(documentRef, tabId) {
  assert.equal(
    await waitFor(() => documentRef.getElementById(`ad-xconfig-tab-${tabId}`)?.getAttribute("data-active") === "true"),
    true
  );
}

async function waitForSettingsModal(documentRef) {
  assert.equal(
    await waitFor(() => Boolean(documentRef.querySelector("[data-adxconfig-modal='true']"))),
    true
  );
}

function getRuntimeFootprint(runtimeApi) {
  const snapshot =
    runtimeApi && typeof runtimeApi.getSnapshot === "function"
      ? runtimeApi.getSnapshot()
      : null;
  const inspect =
    runtimeApi && typeof runtimeApi.inspect === "function"
      ? runtimeApi.inspect()
      : null;
  const mountedCount = snapshot
    ? Object.values(snapshot.features || {}).filter((feature) => feature?.mounted === true).length
    : 0;

  return JSON.stringify({
    mountedCount,
    observerCount: inspect?.observerCount || 0,
    listenerCount: inspect?.listenerCount || 0,
  });
}

async function waitForRuntimeToSettle(runtimeApi, options = {}) {
  const timeoutMs = Math.max(40, Number(options.timeoutMs) || 320);
  const intervalMs = Math.max(4, Number(options.intervalMs) || 12);
  const stablePassesRequired = Math.max(1, Number(options.stablePassesRequired) || 3);
  let previousFootprint = "";
  let stablePasses = 0;

  assert.equal(
    await waitFor(() => {
      const nextFootprint = getRuntimeFootprint(runtimeApi);
      if (!nextFootprint) {
        previousFootprint = "";
        stablePasses = 0;
        return false;
      }

      if (nextFootprint === previousFootprint) {
        stablePasses += 1;
      } else {
        previousFootprint = nextFootprint;
        stablePasses = 1;
      }

      return stablePasses >= stablePassesRequired;
    }, { timeoutMs, intervalMs }),
    true
  );
}

async function waitForSettingsClosed(documentRef) {
  assert.equal(
    await waitFor(() => !documentRef.querySelector("[data-adxconfig-modal='true']")),
    true
  );
}

async function waitForStoredConfig(localStorage, check, options = {}) {
  assert.equal(
    await waitFor(() => {
      const rawValue = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!rawValue) {
        return false;
      }
      try {
        return Boolean(check(JSON.parse(rawValue)));
      } catch (_) {
        return false;
      }
    }, options),
    true
  );
}

async function waitForOpenedUrl(windowRef, expectedUrl, options = {}) {
  assert.equal(
    await waitFor(() => windowRef.__openedUrls.at(-1) === expectedUrl, options),
    true
  );
}

function createDeferred() {
  let resolve = null;
  let reject = null;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
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

function clickSelectSettingOption(documentRef, featureKey, settingKey, settingValue) {
  const selector = `[data-adxconfig-action='set-setting-select-option'][data-feature-key='${featureKey}'][data-setting-key='${settingKey}'][data-setting-value='${String(settingValue)}']`;
  const button = documentRef.querySelector(selector);
  assert.ok(button, `missing select option button for ${featureKey}.${settingKey}.${settingValue}`);
  button.click();
}

function clickHeaderAction(documentRef, action) {
  const selector = `[data-adxconfig-action='${action}']`;
  const button = documentRef.querySelector(selector);
  assert.ok(button, `missing header action button for ${action}`);
  button.click();
}

function changeSettingInput(documentRef, selector, value) {
  const input = documentRef.querySelector(selector);
  assert.ok(input, `missing setting input for ${selector}`);
  input.value = value;
  documentRef.dispatchEvent(new FakeEvent("change", {
    bubbles: true,
    cancelable: true,
    target: input,
  }));
}

function readNestedValue(rootValue, pathParts) {
  return (Array.isArray(pathParts) ? pathParts : []).reduce((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return current[part];
  }, rootValue);
}

function getFeatureConfigValue(config, configKey, fieldPath) {
  const pathParts = String(configKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  const featureConfig = readNestedValue(config?.features || {}, pathParts);
  if (!fieldPath) {
    return featureConfig;
  }

  return readNestedValue(featureConfig || {}, String(fieldPath).split(".").filter(Boolean));
}

function incrementPatchVersion(version) {
  const [major = "0", minor = "0", patch = "0"] = String(version || "")
    .split(".")
    .map((part) => String(part || "").trim());
  return `${Number.parseInt(major, 10) || 0}.${Number.parseInt(minor, 10) || 0}.${(Number.parseInt(patch, 10) || 0) + 1}`;
}

function buildUserscriptMeta(version) {
  return `// ==UserScript==
// @name         autodarts-xconfig
// @version      ${version}
// ==/UserScript==
`;
}

function getUrlWithoutQuery(url) {
  const parsed = new URL(String(url || ""));
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

test("xConfig shell injects one menu entry, opens route and closes back safely", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await waitFor(() => {
    return (
      documentRef.querySelectorAll("#ad-xconfig-menu-item").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-panel-host").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-shell-style").length === 0
    );
  });

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  assert.equal(menuButton.getAttribute("data-adxconfig-action"), "open");
  assert.ok(documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID));
  const boardsLink = Array.from(documentRef.sidebar.querySelectorAll("a[href]"))
    .find((link) => String(link.getAttribute("href") || "") === "/boards");
  assert.ok(boardsLink);
  assert.equal(boardsLink.nextElementSibling, menuButton);
  assert.ok(menuButton.classList.contains("chakra-link"));

  menuButton.click();
  await waitForShellOpen(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");
  assert.equal(documentRef.variantElement.style.display, "none");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.style.display, "block");

  windowRef.history.pushState({}, "", "/lobbies");
  await waitForShellClosed(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "");
  assert.equal(panelHost.style.display, "none");
  assert.equal(documentRef.variantElement.style.display, "");

  runtime.stop();
});

test("xConfig shell normalizes legacy /ad-xconfig path to a reload-safe hash route", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    localStorage,
    href: "https://play.autodarts.io/ad-xconfig",
  });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await waitForShellOpen(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");
  assert.equal(documentRef.variantElement.style.display, "none");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.style.display, "block");

  windowRef.history.pushState({}, "", "/lobbies");
  await waitForShellClosed(windowRef, documentRef);

  assert.equal(windowRef.location.hash, "");
  assert.equal(panelHost.style.display, "none");

  runtime.stop();
});

test("xConfig shell keeps sidebar visible when layout has no main element", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument({ contentTagName: "div" });
  const preexistingHost = documentRef.createElement("section");
  preexistingHost.id = "ad-xconfig-panel-host";
  preexistingHost.style.display = "none";
  documentRef.layoutShell.insertBefore(preexistingHost, documentRef.sidebar);
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await waitFor(() => {
    return (
      documentRef.querySelectorAll("#ad-xconfig-menu-item").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-panel-host").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-shell-style").length === 0
    );
  });

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);

  menuButton.click();
  await waitForShellOpen(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost, preexistingHost);
  assert.equal(panelHost.parentNode, documentRef.main);
  assert.equal(panelHost.style.display, "block");
  assert.notEqual(documentRef.sidebar.style.display, "none");
  assert.notEqual(documentRef.main.style.display, "none");
  assert.equal(documentRef.variantElement.style.display, "none");

  windowRef.history.pushState({}, "", "/lobbies");
  await waitForShellClosed(windowRef, documentRef);

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
  await waitFor(() => {
    return (
      documentRef.querySelectorAll("#ad-xconfig-menu-item").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-panel-host").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-shell-style").length === 0
    );
  });

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
  await waitFor(() => {
    return (
      documentRef.querySelectorAll("#ad-xconfig-menu-item").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-panel-host").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-shell-style").length === 0
    );
  });

  const clickEvent = new FakeEvent("click", { bubbles: true, cancelable: true, target: toolsLink });
  const clickAllowed = toolsLink.dispatchEvent(clickEvent);
  await waitFor(() => windowRef.location.pathname === "/lobbies");

  assert.equal(clickAllowed, true);
  assert.equal(clickEvent.defaultPrevented, false);
  assert.equal(windowRef.location.pathname, "/lobbies");

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);
  menuButton.click();
  await waitForShellOpen(windowRef, documentRef);
  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");

  runtime.stop();
});

test("xConfig shell repairs a corrupted sidebar menu node on sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  const broken = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(broken);
  broken.classList.add("ad-xconfig-tab");
  broken.setAttribute("data-adxconfig-tab", "themes");
  broken.removeAttribute("data-adxconfig-action");
  broken.replaceChildren(documentRef.createElement("span"));

  windowRef.history.pushState({}, "", "/boards");
  await waitFor(() => documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-adxconfig-action") === "open");

  const repaired = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(repaired);
  assert.equal(repaired.classList.contains("ad-xconfig-tab"), false);
  assert.equal(repaired.getAttribute("data-adxconfig-tab"), null);
  assert.equal(repaired.getAttribute("data-adxconfig-action"), "open");

  const label = repaired.querySelector(".ad-xconfig-menu-label");
  assert.ok(label);
  assert.equal(String(label.textContent || "").trim(), "AD xConfig");

  const boardsLink = Array.from(documentRef.sidebar.querySelectorAll("a[href]"))
    .find((link) => String(link.getAttribute("href") || "") === "/boards");
  assert.ok(boardsLink);
  assert.equal(boardsLink.nextElementSibling, repaired);

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
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

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
  await waitFor(() => rafCount >= baseline);
  const afterManagedMutations = rafCount;
  assert.ok(afterManagedMutations - baseline <= 1);

  documentRef.flushMutations([
    { target: documentRef.main, addedNodes: [documentRef.createElement("div")], removedNodes: [] },
  ]);
  await waitFor(() => rafCount > afterManagedMutations);
  assert.ok(rafCount > afterManagedMutations);

  runtime.stop();
  assert.equal(
    await waitFor(() => !documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID)),
    true
  );
});

test("xConfig observer ignores closed-shell match content mutations without scanning sidebar", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);
  await waitForRuntimeToSettle(runtime);

  let sidebarRectReads = 0;
  const readSidebarRect = documentRef.sidebar.getBoundingClientRect.bind(documentRef.sidebar);
  documentRef.sidebar.getBoundingClientRect = () => {
    sidebarRectReads += 1;
    return readSidebarRect();
  };

  const turnDecoration = documentRef.createElement("span");
  const scoreDecoration = documentRef.createElement("span");
  const boardDecoration = documentRef.createElement("div");
  boardDecoration.classList.add("ad-ext-theme-board-svg");
  documentRef.turnContainer.appendChild(turnDecoration);
  documentRef.activeScoreElement.appendChild(scoreDecoration);
  documentRef.main.appendChild(boardDecoration);

  documentRef.flushMutations([
    { target: documentRef.turnContainer, addedNodes: [turnDecoration], removedNodes: [] },
    { target: documentRef.activeScoreElement, addedNodes: [scoreDecoration], removedNodes: [] },
    { target: documentRef.main, addedNodes: [boardDecoration], removedNodes: [] },
  ]);

  await wait(20);
  assert.equal(sidebarRectReads, 0);

  runtime.stop();
});

test("xConfig observer still syncs closed-shell sidebar mutations", async () => {
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
  await waitForMenuButton(documentRef);
  await waitForRuntimeToSettle(runtime);

  let sidebarRectReads = 0;
  const readSidebarRect = documentRef.sidebar.getBoundingClientRect.bind(documentRef.sidebar);
  documentRef.sidebar.getBoundingClientRect = () => {
    sidebarRectReads += 1;
    return readSidebarRect();
  };

  const baselineRafCount = rafCount;
  const navLink = documentRef.createElement("a");
  navLink.setAttribute("href", "/tournaments");
  navLink.textContent = "Tournaments";
  documentRef.sidebar.appendChild(navLink);

  documentRef.flushMutations([
    { target: documentRef.sidebar, addedNodes: [navLink], removedNodes: [] },
  ]);

  assert.ok(rafCount > baselineRafCount);
  await waitFor(() => sidebarRectReads > 0);
  assert.ok(sidebarRectReads > 0);

  runtime.stop();
});

test("xConfig settings modal preserves node identity and scroll offsets during external sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='cricket-grid-fx']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

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
  await waitFor(() => documentRef.getElementById("ad-xconfig-panel-host") === panelHost);

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
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='cricket-grid-fx']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

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
  await waitFor(() => JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)).features.cricketGridFx.rowWave === false);

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

  await waitForMenuButton(documentRef);

  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  const label = documentRef.querySelector("#ad-xconfig-menu-item .ad-xconfig-menu-label");
  assert.ok(label);
  assert.notEqual(label.style.display, "none");

  documentRef.sidebar.__rect = { width: 96, height: 720 };
  documentRef.flushMutations();
  await waitFor(() => label.style.display === "none");

  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  assert.equal(label.style.display, "none");

  documentRef.sidebar.__rect = { width: 260, height: 720 };
  documentRef.flushMutations();
  await waitFor(() => label.style.display === "inline");

  assert.equal(label.style.display, "inline");
  runtime.stop();
});

test("xConfig shell stays idempotent across repeated init and DOM mutation sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const first = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForRuntimeToSettle(windowRef.__adXConfig);
  const initialInspect = windowRef.__adXConfig.inspect();
  const second = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  assert.equal(first, second);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);

  documentRef.flushMutations();
  await waitForMenuButton(documentRef);
  await waitForRuntimeToSettle(windowRef.__adXConfig);

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
  await waitForMenuButton(documentRef);

  const initialInspect = windowRef.__adXConfig.inspect();
  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);

  for (let cycle = 0; cycle < 4; cycle += 1) {
    menuButton.click();
    await waitForShellOpen(windowRef, documentRef);
    windowRef.history.pushState({}, "", "/lobbies");
    documentRef.flushMutations();
    await waitForShellClosed(windowRef, documentRef);
  }

  const currentInspect = windowRef.__adXConfig.inspect();
  assert.equal(currentInspect.observerCount, initialInspect.observerCount);
  assert.equal(currentInspect.listenerCount, initialInspect.listenerCount);

  runtime.stop();
});

test("xConfig shell marks the menu and offers install action when a newer userscript version exists", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  windowRef.fetch = async () => {
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta(incrementPatchVersion(installedVersion));
      },
    };
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitFor(() => documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-update-available") === "true");

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);
  assert.match(String(menuButton.getAttribute("title") || ""), /Update verfügbar/);

  menuButton.click();
  await waitFor(() => documentRef.querySelector("[data-adxconfig-update-panel='true']")?.getAttribute("data-update-state") === "available");

  const updatePanel = documentRef.querySelector("[data-adxconfig-update-panel='true']");
  assert.ok(updatePanel);
  assert.equal(updatePanel.getAttribute("data-update-state"), "available");
  const updateTitle = updatePanel.querySelector(".ad-xconfig-update-title");
  assert.ok(updateTitle);
  assert.equal(String(updateTitle.textContent || "").trim(), "Update verfügbar");

  const changelogLink = documentRef.querySelector("[data-adxconfig-action='open-changelog']");
  assert.ok(changelogLink);
  assert.equal(changelogLink.getAttribute("href"), CHANGELOG_URL);
  assert.equal(
    String(changelogLink.querySelector(".ad-xconfig-update-link-label")?.textContent || "").trim(),
    "Was ist neu?"
  );
  changelogLink.click();
  await wait(5);
  assert.equal(windowRef.__openedUrls.at(-1), CHANGELOG_URL);

  const installButton = documentRef.querySelector("[data-adxconfig-action='install-update']");
  assert.ok(installButton);
  installButton.click();
  await wait(5);

  const installUrl = String(windowRef.__openedUrls.at(-1) || "");
  const parsedInstallUrl = new URL(installUrl);
  assert.equal(getUrlWithoutQuery(installUrl), USERSCRIPT_DOWNLOAD_URL);
  assert.match(String(parsedInstallUrl.searchParams.get("_adxconfig_ts") || ""), /^\d+$/);
  const notice = documentRef.querySelector(".ad-xconfig-notice");
  assert.ok(notice);
  assert.match(String(notice.textContent || ""), /Installations-Tab geöffnet/);

  runtime.stop();
});

test("xConfig shell renders an error update panel when the remote version lookup fails", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  windowRef.fetch = async () => {
    throw new Error("network down");
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitFor(() => Boolean(documentRef.getElementById("ad-xconfig-menu-item")));
  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitFor(() => documentRef.querySelector("[data-adxconfig-update-panel='true']")?.getAttribute("data-update-state") === "error");

  const updatePanel = documentRef.querySelector("[data-adxconfig-update-panel='true']");
  assert.ok(updatePanel);
  assert.equal(updatePanel.getAttribute("data-update-state"), "error");

  const updateTitle = updatePanel.querySelector(".ad-xconfig-update-title");
  assert.ok(updateTitle);
  assert.equal(String(updateTitle.textContent || "").trim(), "Update-Prüfung fehlgeschlagen");

  const installButton = documentRef.querySelector("[data-adxconfig-action='install-update']");
  assert.equal(Boolean(installButton), false);

  runtime.stop();
});

test("xConfig shell can recheck update status and promote a current build to update-available", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  let refreshCount = 0;
  let requestsInRefresh = 0;
  windowRef.fetch = async () => {
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const remoteVersion = refreshCount === 0 ? installedVersion : incrementPatchVersion(installedVersion);
    requestsInRefresh += 1;
    if (requestsInRefresh >= 2) {
      refreshCount += 1;
      requestsInRefresh = 0;
    }
    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta(remoteVersion);
      },
    };
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitFor(() => Boolean(documentRef.getElementById("ad-xconfig-menu-item")));
  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitFor(() => documentRef.querySelector("[data-adxconfig-update-panel='true']")?.getAttribute("data-update-state") === "current");

  let updatePanel = documentRef.querySelector("[data-adxconfig-update-panel='true']");
  assert.ok(updatePanel);
  assert.equal(updatePanel.getAttribute("data-update-state"), "current");
  assert.equal(documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-update-available"), null);
  assert.equal(
    String(
      documentRef
        .querySelector("[data-adxconfig-action='open-changelog']")
        ?.querySelector(".ad-xconfig-update-link-label")
        ?.textContent || ""
    ).trim(),
    "Changelog"
  );

  const recheckButton = documentRef.querySelector("[data-adxconfig-action='check-update']");
  assert.ok(recheckButton);
  recheckButton.click();

  await waitFor(() => documentRef.querySelector("[data-adxconfig-update-panel='true']")?.getAttribute("data-update-state") === "available");
  updatePanel = documentRef.querySelector("[data-adxconfig-update-panel='true']");
  assert.ok(updatePanel);
  assert.equal(updatePanel.getAttribute("data-update-state"), "available");
  assert.equal(documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-update-available"), "true");

  const notice = documentRef.querySelector(".ad-xconfig-notice");
  assert.ok(notice);
  assert.match(String(notice.textContent || ""), /Update gefunden/);

  runtime.stop();
});

test("xConfig shell checks update status in the background without manual recheck clicks", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const originalDateNow = Date.now;
  let fakeNow = 1_770_000_000_000;
  Date.now = () => fakeNow;

  const originalSetInterval = windowRef.setInterval.bind(windowRef);
  windowRef.setInterval = (callback, ms, ...args) => {
    return originalSetInterval(() => {
      fakeNow += 61 * 60 * 1000;
      callback(...args);
    }, Math.min(Number(ms) || 0, 10));
  };

  let runtime = null;
  let refreshCount = 0;
  let requestsInRefresh = 0;
  windowRef.fetch = async () => {
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const remoteVersion = refreshCount === 0 ? installedVersion : incrementPatchVersion(installedVersion);
    requestsInRefresh += 1;
    if (requestsInRefresh >= 2) {
      refreshCount += 1;
      requestsInRefresh = 0;
    }
    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta(remoteVersion);
      },
    };
  };

  try {
    runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
    await waitFor(() => refreshCount >= 2, { timeoutMs: 260, intervalMs: 5 });
    await waitFor(
      () => documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-update-available") === "true",
      { timeoutMs: 260, intervalMs: 5 }
    );
    assert.equal(documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-update-available"), "true");
  } finally {
    runtime?.stop();
    Date.now = originalDateNow;
  }
});

test("xConfig shell forces one remote update check on startup even with fresh cached status", async () => {
  const now = Date.now();
  const localStorage = new FakeStorage({
    "autodarts-xconfig:update-status:v1": JSON.stringify({
      remoteVersion: "0.0.0",
      checkedAt: now,
      sourceUrl: "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js",
    }),
  });
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  let callCount = 0;
  windowRef.fetch = async () => {
    callCount += 1;
    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta("0.0.0");
      },
    };
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitFor(() => callCount >= 1, { timeoutMs: 220, intervalMs: 5 });
  assert.equal(callCount >= 1, true);

  runtime.stop();
});

test("xConfig shell aborts inflight update checks on teardown without stale UI updates", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  let fetchCount = 0;
  let aborted = false;

  windowRef.fetch = (_url, options = {}) => {
    fetchCount += 1;
    return new Promise((_resolve, reject) => {
      const signal = options.signal;
      assert.ok(signal);
      signal.addEventListener("abort", () => {
        aborted = true;
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    });
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitFor(() => fetchCount >= 1, { timeoutMs: 220, intervalMs: 5 });
  runtime.stop();
  await waitFor(() => aborted, { timeoutMs: 220, intervalMs: 5 });
  await wait(5);

  assert.equal(aborted, true);
  assert.equal(documentRef.getElementById("ad-xconfig-menu-item"), null);
  assert.equal(documentRef.querySelector(".ad-xconfig-notice"), null);
});

test("xConfig shell replays a manual update check after an inflight check finishes", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const firstRefreshGate = createDeferred();
  const secondRefreshGate = createDeferred();
  let fetchCount = 0;
  let refreshCount = 0;
  let requestsInRefresh = 0;

  windowRef.fetch = async () => {
    fetchCount += 1;
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const refreshIndex = refreshCount;
    const gate = refreshIndex === 0 ? firstRefreshGate : secondRefreshGate;
    await gate.promise;

    requestsInRefresh += 1;
    if (requestsInRefresh >= 2) {
      refreshCount += 1;
      requestsInRefresh = 0;
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return buildUserscriptMeta(
          refreshIndex === 0 ? installedVersion : incrementPatchVersion(installedVersion)
        );
      },
    };
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  try {
    await waitFor(() => Boolean(documentRef.getElementById("ad-xconfig-menu-item")));

    documentRef.getElementById("ad-xconfig-menu-item").click();
    await waitFor(() => Boolean(documentRef.querySelector("[data-adxconfig-action='check-update']")));

    const recheckButton = documentRef.querySelector("[data-adxconfig-action='check-update']");
    assert.ok(recheckButton);
    documentRef.dispatchEvent(new FakeEvent("click", {
      bubbles: true,
      cancelable: true,
      target: recheckButton,
    }));

    await waitForShellOpen(windowRef, documentRef);
    assert.equal(fetchCount, 1);

    firstRefreshGate.resolve();
    await waitFor(() => refreshCount >= 1, { timeoutMs: 260, intervalMs: 5 });
    assert.equal(
      await waitFor(
        () => fetchCount >= 3,
        { timeoutMs: 260, intervalMs: 5 }
      ),
      true
    );

    secondRefreshGate.resolve();

    assert.equal(
      await waitFor(
        () => documentRef.querySelector("[data-adxconfig-update-panel='true']")?.getAttribute("data-update-state") === "available",
        { timeoutMs: 260, intervalMs: 5 }
      ),
      true
    );
    assert.equal(fetchCount, 4);

    const notice = documentRef.querySelector(".ad-xconfig-notice");
    assert.ok(notice);
    assert.match(String(notice.textContent || ""), /Update gefunden/);
  } finally {
    firstRefreshGate.resolve();
    secondRefreshGate.resolve();
    runtime.stop();
  }
});

test("xConfig shell cancels queued syncs on teardown before the frame runs", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const pendingFrames = [];
  let nextHandle = 0;

  windowRef.requestAnimationFrame = (callback) => {
    const handle = ++nextHandle;
    pendingFrames.push({ handle, callback });
    return handle;
  };
  windowRef.cancelAnimationFrame = (handle) => {
    const frame = pendingFrames.find((entry) => entry.handle === handle);
    if (frame) {
      frame.callback = null;
    }
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  assert.equal(pendingFrames.length >= 1, true);

  runtime.stop();

  pendingFrames.slice().forEach((frame) => {
    if (typeof frame.callback === "function") {
      frame.callback();
    }
  });

  await waitFor(() => {
    return (
      documentRef.querySelectorAll("#ad-xconfig-menu-item").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-panel-host").length === 0 &&
      documentRef.querySelectorAll("#ad-xconfig-shell-style").length === 0
    );
  });

  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 0);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-panel-host").length, 0);
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-shell-style").length, 0);
});

test("xConfig shell persists rapid back-to-back UI actions without losing earlier changes", async () => {
  const gmState = new Map();
  const localStorage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({
    windowRef,
    documentRef,
    gmGetValue: async (key, fallbackValue) => (gmState.has(key) ? gmState.get(key) : fallbackValue),
    gmSetValue: async (key, value) => {
      await wait(10);
      gmState.set(key, value);
    },
  });
  await waitFor(() => Boolean(documentRef.getElementById("ad-xconfig-menu-item")));

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  clickFeatureToggle(documentRef, "turn-start-sweep", true);
  clickFeatureToggle(documentRef, "winner-fireworks", true);

  assert.equal(await waitFor(() => {
    const storedConfig = gmState.get(CONFIG_STORAGE_KEY);
    return (
      Boolean(storedConfig) &&
      storedConfig.featureToggles.turnStartSweep === true &&
      storedConfig.featureToggles.winnerFireworks === true
    );
  }, { timeoutMs: 500, intervalMs: 5 }), true);

  const storedConfig = gmState.get(CONFIG_STORAGE_KEY);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);
  assert.equal(storedConfig.featureToggles.winnerFireworks, true);
  assert.equal(runtime.getSnapshot().features["turn-start-sweep"].mounted, true);
  assert.equal(runtime.getSnapshot().features["winner-fireworks"].mounted, true);

  runtime.stop();
});

test("xConfig shell wires tabs, settings modal, toggles and save actions", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  let themesTab = documentRef.getElementById("ad-xconfig-tab-themes");
  let animationsTab = documentRef.getElementById("ad-xconfig-tab-animations");
  const tablist = documentRef.querySelector(".ad-xconfig-tabs");
  const tabsTitle = documentRef.getElementById("ad-xconfig-tabs-title");
  const tabsCopy = documentRef.getElementById("ad-xconfig-tabs-copy");
  const tabpanel = documentRef.querySelector(".ad-xconfig-content");
  assert.equal(tablist?.getAttribute("role"), "tablist");
  assert.equal(tablist?.getAttribute("aria-labelledby"), "ad-xconfig-tabs-title");
  assert.equal(tablist?.getAttribute("aria-describedby"), "ad-xconfig-tabs-copy");
  assert.equal(tabsTitle?.textContent, "Wähle deinen Bereich");
  assert.equal(
    tabsCopy?.textContent,
    "Wechsle zwischen Themen für Farben und Layout sowie Animationen für Effekte und Komfortfunktionen."
  );
  assert.equal(themesTab?.getAttribute("role"), "tab");
  assert.equal(themesTab?.getAttribute("aria-selected"), "true");
  assert.equal(animationsTab?.getAttribute("aria-selected"), "false");
  assert.equal(themesTab?.getAttribute("tabindex"), "0");
  assert.equal(animationsTab?.getAttribute("tabindex"), "-1");
  assert.equal(tabpanel?.getAttribute("role"), "tabpanel");
  assert.equal(tabpanel?.getAttribute("aria-labelledby"), "ad-xconfig-tab-themes");

  clickFeatureToggle(documentRef, "theme-x01", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles["themes.x01"] === true);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");
  themesTab = documentRef.getElementById("ad-xconfig-tab-themes");
  animationsTab = documentRef.getElementById("ad-xconfig-tab-animations");
  assert.equal(themesTab?.getAttribute("aria-selected"), "false");
  assert.equal(animationsTab?.getAttribute("aria-selected"), "true");
  assert.equal(themesTab?.getAttribute("tabindex"), "-1");
  assert.equal(animationsTab?.getAttribute("tabindex"), "0");
  assert.equal(
    documentRef.querySelector(".ad-xconfig-content")?.getAttribute("aria-labelledby"),
    "ad-xconfig-tab-animations"
  );
  clickFeatureToggle(documentRef, "turn-start-sweep", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.turnStartSweep === true);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);

  const openCheckoutSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(openCheckoutSettings);
  openCheckoutSettings.click();
  await waitForSettingsModal(documentRef);

  const effectOptionsBefore = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-pulse'][data-setting-key='effect']"
  );
  assert.equal(
    effectOptionsBefore.filter((node) => node.getAttribute("data-active") === "true").length,
    1
  );

  clickSelectSettingOption(documentRef, "checkout-score-pulse", "effect", "blink");
  await waitForStoredConfig(localStorage, (config) => config.features.checkoutScorePulse.effect === "blink");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "blink");
  const effectOptionsAfter = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-pulse'][data-setting-key='effect']"
  );
  const activeEffectOptions = effectOptionsAfter.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(activeEffectOptions.length, 1);
  assert.equal(activeEffectOptions[0].getAttribute("data-setting-value"), "blink");

  const closeSettings = documentRef.querySelector("[data-adxconfig-action='close-settings']");
  assert.ok(closeSettings);
  closeSettings.click();
  await waitForSettingsClosed(documentRef);

  documentRef.getElementById("ad-xconfig-tab-themes").click();
  await waitForActiveTab(documentRef, "themes");
  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  clickSettingToggle(documentRef, "theme-x01", "showAvg", false);
  await waitForStoredConfig(localStorage, (config) => config.features.themes.x01.showAvg === false);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.showAvg, false);

  runtime.stop();
});

test("xConfig shell sorts themes and groups animations by mode relevance", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const themeCardFeatureKeys = documentRef
    .querySelectorAll(".ad-xconfig-card")
    .map((cardNode) => String(cardNode.getAttribute("data-feature-key") || ""))
    .filter((featureKey) => featureKey.startsWith("theme-"));
  assert.deepEqual(themeCardFeatureKeys, [
    "theme-global-typography",
    "theme-bull-off",
    "theme-x01",
    "theme-gotcha",
    "theme-x01-2player",
    "theme-cricket",
    "theme-shanghai",
    "theme-bermuda",
  ]);

  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const groupNodes = documentRef.querySelectorAll("[data-adxconfig-animation-group]");
  const groupIds = groupNodes.map((groupNode) =>
    String(groupNode.getAttribute("data-adxconfig-animation-group") || "")
  );
  assert.deepEqual(groupIds, ["all-modes", "x01", "cricket-tactics"]);
  assert.equal(
    documentRef.querySelectorAll("[data-adxconfig-animation-divider='true']").length,
    groupIds.length - 1
  );

  const readGroupCards = (groupId) => {
    const groupNode = documentRef.querySelector(
      `[data-adxconfig-animation-group='${groupId}']`
    );
    assert.ok(groupNode, `missing group ${groupId}`);
    return groupNode
      .querySelectorAll(".ad-xconfig-card")
      .map((cardNode) => String(cardNode.getAttribute("data-feature-key") || ""));
  };

  assert.deepEqual(readGroupCards("all-modes"), [
    "turn-start-sweep",
    "turn-points-count",
    "average-trend-arrow",
    "triple-double-bull-hits",
    "dart-marker-darts",
    "dart-marker-emphasis",
    "remove-darts-notification",
    "single-bull-sound",
    "winner-fireworks",
  ]);
  assert.deepEqual(readGroupCards("x01"), [
    "style-checkout-suggestions",
    "checkout-score-pulse",
    "x01-score-progress",
    "checkout-board-targets",
    "tv-board-zoom",
  ]);
  assert.deepEqual(readGroupCards("cricket-tactics"), [
    "cricket-highlighter",
    "cricket-grid-fx",
  ]);

  runtime.stop();
});

test("xConfig style checkout suggestions renders live preview and style option samples", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='style-checkout-suggestions']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-style-checkout-suggestions-preview='true']"
  );
  assert.ok(previewSection);
  const previewSuggestion = previewSection.querySelector(".ad-xconfig-checkout-suggestion-demo");
  assert.ok(previewSuggestion);
  const activeStyleOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='style-checkout-suggestions'][data-setting-key='style'][data-active='true']"
  );
  assert.ok(activeStyleOption);
  assert.equal(
    previewSuggestion.classList.contains(
      `ad-xconfig-checkout-suggestion-demo--${activeStyleOption.getAttribute("data-setting-value")}`
    ),
    true
  );
  assert.equal(
    previewSuggestion.querySelector(".ad-xconfig-checkout-suggestion-demo-label")?.textContent,
    "CHECKOUT"
  );
  assert.equal(previewSuggestion.style.getPropertyValue("--ad-ext-accent"), "#f59e0b");

  const styleOptions = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='style-checkout-suggestions'][data-setting-key='style']"
  );
  assert.equal(styleOptions.length, 5);
  styleOptions.forEach((optionNode) => {
    assert.ok(optionNode.querySelector(".ad-xconfig-checkout-suggestion-option-preview"));
    assert.ok(optionNode.querySelector(".ad-xconfig-checkout-suggestion-demo"));
  });

  clickSelectSettingOption(documentRef, "style-checkout-suggestions", "style", "ticket");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.styleCheckoutSuggestions.style === "ticket"
  );

  assert.equal(
    await waitFor(() =>
      documentRef
        .querySelector(
          "[data-adxconfig-style-checkout-suggestions-preview='true'] .ad-xconfig-checkout-suggestion-demo"
        )
        ?.classList.contains("ad-xconfig-checkout-suggestion-demo--ticket") === true
    ),
    true
  );

  runtime.stop();
});

test("xConfig checkout score pulse renders real effect previews and color buttons", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-score-pulse-preview='true']"
  );
  assert.ok(previewSection);
  const previewScore = previewSection.querySelector(
    "[data-adxconfig-checkout-score-pulse-score='true']"
  );
  assert.ok(previewScore);
  assert.equal(previewScore.textContent, "40");
  assert.equal(previewScore.classList.contains(CHECKOUT_SCORE_PULSE_HIGHLIGHT_CLASS), true);
  assert.equal(
    previewScore.classList.contains(CHECKOUT_SCORE_PULSE_EFFECT_CLASSES.scale),
    true
  );
  assert.equal(
    previewScore.style.getPropertyValue(CHECKOUT_SCORE_PULSE_STYLE_VARIABLES.color),
    "159, 219, 88"
  );
  assert.equal(
    previewScore.style.getPropertyValue(CHECKOUT_SCORE_PULSE_STYLE_VARIABLES.scaleMax),
    "1.08"
  );

  const effectPreviews = documentRef.querySelectorAll(
    "[data-feature-key='checkout-score-pulse'][data-setting-key='effect'] .ad-xconfig-checkout-score-pulse-option-preview"
  );
  assert.equal(effectPreviews.length, 4);
  const glowOptionScore = documentRef.querySelector(
    "[data-feature-key='checkout-score-pulse'][data-setting-key='effect'][data-setting-value='glow'] [data-adxconfig-checkout-score-pulse-score='true']"
  );
  assert.ok(glowOptionScore);
  assert.equal(glowOptionScore.classList.contains(CHECKOUT_SCORE_PULSE_HIGHLIGHT_CLASS), true);
  assert.equal(glowOptionScore.classList.contains(CHECKOUT_SCORE_PULSE_EFFECT_CLASSES.glow), true);

  const colorButtons = documentRef.querySelectorAll(
    "[data-feature-key='checkout-score-pulse'][data-setting-key='colorTheme'].ad-xconfig-option-item--color-preview"
  );
  assert.equal(colorButtons.length, 4);
  const colorPreviewCards = documentRef.querySelectorAll(
    "[data-feature-key='checkout-score-pulse'][data-setting-key='colorTheme'] .ad-xconfig-checkout-score-pulse-option-preview"
  );
  assert.equal(colorPreviewCards.length, 0);
  const cyanOption = documentRef
    .querySelectorAll(
      "[data-feature-key='checkout-score-pulse'][data-setting-key='colorTheme']"
    )
    .find((node) => node.getAttribute("data-setting-value") === "56, 189, 248");
  assert.ok(cyanOption);
  assert.equal(
    cyanOption.classList.contains("ad-xconfig-option-item--color-preview"),
    true
  );
  assert.equal(
    cyanOption.getAttribute("data-preview-color-theme"),
    "checkout-score-cyan"
  );

  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='checkout-score-pulse'][data-setting-key='intensity'] .ad-xconfig-checkout-score-pulse-option-preview"
    ).length,
    0
  );
  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='checkout-score-pulse'][data-setting-key='triggerSource'] .ad-xconfig-checkout-score-pulse-option-preview"
    ).length,
    0
  );

  clickSelectSettingOption(documentRef, "checkout-score-pulse", "intensity", "stark");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutScorePulse.intensity === "stark"
  );

  assert.equal(
    await waitFor(() => {
      const refreshedScore = documentRef.querySelector(
        "[data-adxconfig-checkout-score-pulse-preview='true'] [data-adxconfig-checkout-score-pulse-score='true']"
      );
      return (
        refreshedScore?.style.getPropertyValue(CHECKOUT_SCORE_PULSE_STYLE_VARIABLES.scaleMax) === "1.12" &&
        refreshedScore?.style.getPropertyValue(CHECKOUT_SCORE_PULSE_STYLE_VARIABLES.glowMaxBlur) === "22px"
      );
    }),
    true
  );

  clickSelectSettingOption(documentRef, "checkout-score-pulse", "triggerSource", "score-only");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutScorePulse.triggerSource === "score-only"
  );

  assert.equal(
    await waitFor(() =>
      documentRef.querySelector(
        "[data-adxconfig-checkout-score-pulse-preview='true'] .ad-xconfig-checkout-score-pulse-preview-context"
      )?.textContent === "Score-Mathe"
    ),
    true
  );

  runtime.stop();
});

test("xConfig X01 score progress renders configured size effect and color previews", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-score-progress']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-x01-score-progress-preview='true']"
  );
  assert.ok(previewSection);
  const previewBar = previewSection.querySelector(
    "[data-adxconfig-x01-score-progress-preview-bar='true']"
  );
  assert.ok(previewBar);
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-score-progress"), "true");
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-score-progress-color-theme"), "checkout-focus");
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-score-progress-size"), "standard");
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-score-progress-effect"), "pulse-core");
  assert.equal(previewBar.style.getPropertyValue("--ad-ext-x01-score-progress-width"), "68%");
  assert.ok(previewBar.style.getPropertyValue("--ad-ext-x01-score-progress-fill-bg-active"));
  assert.ok(previewBar.querySelector(".ad-ext-x01-score-progress__track"));
  assert.ok(previewBar.querySelector(".ad-ext-x01-score-progress__trail"));
  assert.ok(
    previewBar.querySelector(
      ".ad-ext-x01-score-progress__fill.ad-ext-x01-score-progress__fill--effect-pulse-core"
    )
  );

  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='x01-score-progress'][data-setting-key='barSize'] .ad-xconfig-x01-score-progress-option-preview"
    ).length,
    4
  );
  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='x01-score-progress'][data-setting-key='effect'] .ad-xconfig-x01-score-progress-option-preview"
    ).length,
    6
  );

  clickSelectSettingOption(documentRef, "x01-score-progress", "colorTheme", "traffic-light");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.x01ScoreProgress.colorTheme === "traffic-light"
  );

  assert.equal(
    await waitFor(() => {
      const refreshedPreviewBar = documentRef.querySelector(
        "[data-adxconfig-x01-score-progress-preview='true'] [data-adxconfig-x01-score-progress-preview-bar='true']"
      );
      return (
        refreshedPreviewBar?.getAttribute("data-ad-ext-x01-score-progress-color-theme") ===
          "traffic-light" &&
        Boolean(refreshedPreviewBar?.style.getPropertyValue("--ad-ext-x01-score-progress-fill-bg-active"))
      );
    }),
    true
  );

  runtime.stop();
});

test("xConfig checkout board targets renders board and segment previews", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-board-targets']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-board-targets-preview='true']"
  );
  assert.ok(previewSection);
  const wholeBoards = documentRef.querySelectorAll(
    ".ad-xconfig-checkout-board-preview-board"
  );
  assert.equal(wholeBoards.length, 7);
  wholeBoards.forEach((boardNode) => {
    assert.equal(boardNode.getAttribute("viewBox"), "-82.2 -82.2 164.4 164.4");
    const rings = Array.from(boardNode.querySelectorAll(".ad-xconfig-checkout-board-preview-ring"));
    assert.equal(rings.some((ringNode) => Number(ringNode.getAttribute("r")) > 76.3), false);
  });
  assert.ok(previewSection.querySelector(".ad-ext-checkout-target"));

  const sectorPreviews = documentRef.querySelectorAll(
    ".ad-xconfig-checkout-board-preview-sector-svg"
  );
  assert.equal(sectorPreviews.length, 5);
  sectorPreviews.forEach((sectorNode) => {
    assert.equal(sectorNode.querySelectorAll(".ad-xconfig-checkout-board-preview-sector-part").length, 4);
    const targetNodes = sectorNode.querySelectorAll(".ad-ext-checkout-target");
    assert.equal(targetNodes.length, 1);
    assert.equal(targetNodes[0].getAttribute("data-target-ring"), "S");
    assert.equal(targetNodes[0].getAttribute("data-target-value"), "6");
  });

  const finishOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-board-targets'][data-setting-key='targetSelectionMode'][data-setting-value='finish']"
  );
  assert.ok(finishOption);
  const finishTarget = finishOption.querySelector(".ad-ext-checkout-target");
  assert.ok(finishTarget);
  assert.equal(finishTarget.getAttribute("data-target-ring"), "D");
  assert.equal(finishTarget.getAttribute("data-target-value"), "20");

  clickSelectSettingOption(documentRef, "checkout-board-targets", "colorTheme", "cyan");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutBoardTargets.colorTheme === "cyan"
  );
  assert.equal(
    await waitFor(() => {
      const refreshedTarget = documentRef.querySelector(
        "[data-adxconfig-checkout-board-targets-preview='true'] .ad-ext-checkout-target"
      );
      return /56,\s*189,\s*248/.test(
        String(refreshedTarget?.style.getPropertyValue("--ad-ext-target-color") || "")
      );
    }),
    true
  );
  clickSelectSettingOption(documentRef, "checkout-board-targets", "colorTheme", "violet");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutBoardTargets.colorTheme === "violet"
  );
  assert.equal(
    await waitFor(() => {
      const refreshedTarget = documentRef.querySelector(
        "[data-adxconfig-checkout-board-targets-preview='true'] .ad-ext-checkout-target"
      );
      return /168,\s*85,\s*247/.test(
        String(refreshedTarget?.style.getPropertyValue("--ad-ext-target-color") || "")
      );
    }),
    true
  );

  runtime.stop();
});

test("xConfig shell persists checkout board target and TV zoom select settings", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openBoardTargetSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-board-targets']"
  );
  assert.ok(openBoardTargetSettings);
  openBoardTargetSettings.click();
  await waitForSettingsModal(documentRef);

  clickSelectSettingOption(documentRef, "checkout-board-targets", "visualPreset", "signal");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutBoardTargets.visualPreset === "signal"
  );

  clickSelectSettingOption(documentRef, "checkout-board-targets", "segmentStyle", "surface-only");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.checkoutBoardTargets.visualPreset === "signal" &&
      config.features.checkoutBoardTargets.segmentStyle === "surface-only"
  );

  clickSelectSettingOption(documentRef, "checkout-board-targets", "targetSelectionMode", "all");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.checkoutBoardTargets.visualPreset === "signal" &&
      config.features.checkoutBoardTargets.segmentStyle === "surface-only" &&
      config.features.checkoutBoardTargets.targetSelectionMode === "all"
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutBoardTargets.visualPreset, "signal");
  assert.equal(storedConfig.features.checkoutBoardTargets.segmentStyle, "surface-only");
  assert.equal(storedConfig.features.checkoutBoardTargets.targetSelectionMode, "all");

  const openZoomSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='tv-board-zoom']"
  );
  assert.ok(openZoomSettings);
  openZoomSettings.click();
  await waitFor(() => Boolean(
    documentRef.querySelector(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='tv-board-zoom'][data-setting-key='checkoutZoomTarget']"
    )
  ));

  clickSelectSettingOption(documentRef, "tv-board-zoom", "checkoutZoomTarget", "route-first");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.tvBoardZoom.checkoutZoomTarget === "route-first"
  );

  clickSettingToggle(documentRef, "tv-board-zoom", "t20SetupZoomEnabled", false);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.tvBoardZoom.t20SetupZoomEnabled === false
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.tvBoardZoom.checkoutZoomTarget, "route-first");
  assert.equal(storedConfig.features.tvBoardZoom.t20SetupZoomEnabled, false);

  runtime.stop();
});

test("xConfig shell renders reset and recommended default header actions", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const resetButton = documentRef.querySelector("[data-adxconfig-action='reset']");
  const recommendedButton = documentRef.querySelector(
    "[data-adxconfig-action='apply-recommended-defaults']"
  );

  assert.ok(resetButton);
  assert.ok(recommendedButton);
  assert.equal(resetButton.classList.contains("ad-xconfig-btn--danger"), true);
  assert.equal(recommendedButton.classList.contains("ad-xconfig-btn--primary"), true);
  assert.equal(
    Boolean(documentRef.querySelector("[data-adxconfig-action='enable-all-themes']")),
    false
  );

  runtime.stop();
});

test("xConfig shell hard reset clears all modules and recommended defaults preserve theme images", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const confirmMessages = [];
  windowRef.confirm = (message) => {
    confirmMessages.push(String(message || ""));
    return true;
  };
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  try {
    await waitForMenuButton(documentRef);

    documentRef.getElementById("ad-xconfig-menu-item").click();
    await waitForShellOpen(windowRef, documentRef);

    await runtime.setFeatureEnabled("theme-x01", true);
    await runtime.setThemeBackgroundImage("x01", "data:image/png;base64,ZmFrZS1oZWFkZXI=");
    await runtime.saveConfig({
      features: {
        checkoutScorePulse: {
          effect: "blink",
        },
        styleCheckoutSuggestions: {
          style: "badge",
        },
      },
    });

    clickHeaderAction(documentRef, "reset");
    await assert.equal(
      await waitFor(() =>
        confirmMessages.some((message) =>
          message.includes("Hard Reset") && message.includes("Theme-Bilder")
        ),
        { timeoutMs: 120, intervalMs: 4 }
      ),
      true
    );
    await waitForStoredConfig(localStorage, (config) => {
      const allDisabled = runtime.listFeatures().every((feature) => {
        const toggleValue = config.featureToggles[feature.configKey];
        const featureConfig = getFeatureConfigValue(config, feature.configKey);
        return toggleValue === false && featureConfig?.enabled === false;
      });

      return (
        allDisabled &&
        config.features.checkoutScorePulse.effect === "scale" &&
        config.features.themes.x01.backgroundImageDataUrl === ""
      );
    }, { timeoutMs: 2000, intervalMs: 8 });

    await waitFor(() => {
      const noticeText = String(documentRef.querySelector(".ad-xconfig-notice")?.textContent || "");
      return noticeText.includes("Hard Reset ausgeführt.");
    });

    await runtime.setThemeBackgroundImage("x01", "data:image/png;base64,cmVwbGF5LWhlYWRlcg==");
    await runtime.saveConfig({
      features: {
        checkoutScorePulse: {
          effect: "blink",
        },
        styleCheckoutSuggestions: {
          style: "badge",
        },
      },
    });

    clickHeaderAction(documentRef, "apply-recommended-defaults");
    await assert.equal(
      await waitFor(() =>
        confirmMessages.some((message) =>
          message.includes("empfohlenen Standards") && message.includes("Theme-Bilder")
        ),
        { timeoutMs: 120, intervalMs: 4 }
      ),
      true
    );
    await waitForStoredConfig(localStorage, (config) => {
      const expectedRecommendedState = runtime.listFeatures().every((feature) => {
        const toggleValue = config.featureToggles[feature.configKey];
        const featureConfig = getFeatureConfigValue(config, feature.configKey);
        if (
          feature.featureKey === "theme-global-typography" ||
          feature.featureKey === "theme-x01-2player"
        ) {
          return toggleValue === false && featureConfig?.enabled === false;
        }
        return toggleValue === true && featureConfig?.enabled === true;
      });

      return (
        expectedRecommendedState &&
        config.features.checkoutBoardTargets.visualPreset === "signal" &&
        config.features.checkoutBoardTargets.colorTheme === "cyan" &&
        config.features.styleCheckoutSuggestions.style === "stripe" &&
        config.features.styleCheckoutSuggestions.labelText === "CHECKOUT" &&
        config.features.turnStartSweep.sweepStyle === "standard" &&
        config.features.tripleDoubleBullHits.animationStyle === "electric-arc" &&
        config.features.cricketHighlighter.irrelevantBoardDimStyle === "hatch" &&
        config.features.cricketGridFx.intensity === "normal" &&
        config.features.cricketGridFx.pressureOverlay === true &&
        config.features.dartMarkerEmphasis.effect === "pulse" &&
        config.features.dartMarkerDarts.hideOriginalMarkers === true &&
        config.features.dartMarkerDarts.enableShadowBlur === true &&
        config.features.dartMarkerDarts.enableWobble === true &&
        config.features.dartMarkerDarts.enableFlightBlur === true &&
        config.features.removeDartsNotification.imageSize === "large" &&
        config.features.singleBullSound.volume === 0.9 &&
        config.features.winnerFireworks.style === "fireworks" &&
        config.features.winnerFireworks.intensity === "standard" &&
        config.features.winnerFireworks.durationSeconds === 5 &&
        config.features.winnerFireworks.particleAmount === "optimiert" &&
        config.features.x01ScoreProgress.barSize === "breit" &&
        config.features.x01ScoreProgress.effect === "off" &&
        config.features.themes.x01.backgroundImageDataUrl === "data:image/png;base64,cmVwbGF5LWhlYWRlcg=="
      );
    }, { timeoutMs: 2000, intervalMs: 8 });

    await waitFor(() => {
      const noticeText = String(documentRef.querySelector(".ad-xconfig-notice")?.textContent || "");
      return noticeText.includes("Empfohlene Standards angewendet.");
    });
  } finally {
    runtime.stop();
  }
});

test("xConfig settings modal renders explanatory notes for checkbox, select and action fields", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  const modal = documentRef.querySelector("[data-adxconfig-modal='true']");
  assert.ok(modal);
  const noteTexts = documentRef
    .querySelectorAll(".ad-xconfig-modal .ad-xconfig-note")
    .map((node) => String(node.textContent || ""));

  assert.ok(
    noteTexts.includes("Blendet die AVG-Anzeige im Theme ein oder aus."),
    "missing checkbox explanation note"
  );
  assert.ok(
    noteTexts.includes("Legt fest, wie ein eigenes Hintergrundbild im Spielbereich platziert wird."),
    "missing select explanation note"
  );
  assert.ok(
    noteTexts.includes(
      "Öffnet die Dateiauswahl, optimiert das Bild auf maximal 1920×1080 und speichert es lokal bis 1,5 MiB nur für dieses Theme."
    ),
    "missing action explanation note"
  );

  const displayModeOptionNotes = documentRef.querySelectorAll(
    "[data-adxconfig-option-note='true'][data-setting-key='backgroundDisplayMode']"
  );
  assert.equal(displayModeOptionNotes.length, 5, "missing select option explanations");

  const fillOption = documentRef.querySelector(
    "[data-adxconfig-option-note='true'][data-setting-key='backgroundDisplayMode'][data-option-value='fill']"
  );
  assert.ok(fillOption);
  assert.equal(fillOption.getAttribute("data-active"), "true");
  assert.match(
    String(fillOption.getAttribute("data-option-description") || ""),
    /Füllt die Fläche komplett/
  );

  const tileOption = documentRef.querySelector(
    "[data-adxconfig-option-note='true'][data-setting-key='backgroundDisplayMode'][data-option-value='tile']"
  );
  assert.ok(tileOption);
  assert.equal(tileOption.getAttribute("data-active"), "false");
  assert.match(
    String(tileOption.getAttribute("data-option-description") || ""),
    /gekachelt wie ein Muster/
  );
  const displayModeOptionList = modal.querySelector(
    "[data-adxconfig-setting='true'][data-setting-control='select'][data-setting-key='backgroundDisplayMode']"
  );
  assert.ok(displayModeOptionList);
  const displayModeInputWrap = displayModeOptionList.closest(".ad-xconfig-setting-input");
  assert.ok(displayModeInputWrap);
  assert.equal(displayModeInputWrap.children[0].classList.contains("ad-xconfig-note"), true);
  assert.equal(displayModeInputWrap.children[1].classList.contains("ad-xconfig-option-list"), true);

  clickSelectSettingOption(documentRef, "theme-x01", "backgroundDisplayMode", "tile");
  await waitForStoredConfig(localStorage, (config) => config.features.themes.x01.backgroundDisplayMode === "tile");

  assert.equal(fillOption.getAttribute("data-active"), "false");
  assert.equal(tileOption.getAttribute("data-active"), "true");
  const activeDisplayModeOptions = documentRef.querySelectorAll(
    "[data-adxconfig-option-note='true'][data-setting-key='backgroundDisplayMode'][data-active='true']"
  );
  assert.equal(activeDisplayModeOptions.length, 1);
  const tileActiveBadge = tileOption.querySelector(".ad-xconfig-option-active");
  const fillActiveBadge = fillOption.querySelector(".ad-xconfig-option-active");
  assert.ok(tileActiveBadge);
  assert.equal(String(tileActiveBadge.textContent || "").trim(), "Aktuell");
  assert.equal(fillActiveBadge, null);

  assert.equal(
    documentRef.querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='showAvg']").length,
    0,
    "checkboxes should not render select option explanation lists"
  );
  assert.equal(
    documentRef.querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='uploadThemeBackground']").length,
    0,
    "actions should not render select option explanation lists"
  );

  runtime.stop();
});

test("xConfig triple-double-bull style buttons expose color and animation previews", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='triple-double-bull-hits']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const colorOptions = documentRef.querySelectorAll(
    "[data-adxconfig-option-note='true'][data-setting-key='colorTheme']"
  );
  const previewColorThemes = colorOptions.map((optionNode) =>
    String(optionNode.getAttribute("data-preview-color-theme") || "")
  );

  assert.deepEqual(previewColorThemes, [
    "kind-signal",
    "ember-rush",
    "ice-circuit",
    "volt-lime",
    "crimson-steel",
    "arctic-mint",
    "champagne-night",
  ]);
  colorOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--color-preview"), true);
  });

  const animationOptions = documentRef.querySelectorAll(
    "[data-adxconfig-option-note='true'][data-setting-key='animationStyle']"
  );
  const previewEffects = animationOptions.map((optionNode) =>
    String(optionNode.getAttribute("data-preview-effect") || "")
  );

  assert.deepEqual(previewEffects, [
    "emphasis",
    "shake",
    "pulse",
    "turn",
    "sheen",
    "shockwave",
    "electric-arc",
  ]);
  animationOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--effect-preview"), true);
  });

  runtime.stop();
});

test("xConfig turn-start-sweep setting buttons expose sweep previews", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='turn-start-sweep']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const durationOptions = documentRef.querySelectorAll(
    "[data-adxconfig-option-note='true'][data-setting-key='durationMs']"
  );
  const durationPreviewEffects = durationOptions.map((optionNode) =>
    String(optionNode.getAttribute("data-preview-effect") || "")
  );

  assert.deepEqual(durationPreviewEffects, [
    "turn-start-sweep-fast",
    "turn-start-sweep-standard-speed",
    "turn-start-sweep-slow",
  ]);
  durationOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--effect-preview"), true);
  });

  const styleOptions = documentRef.querySelectorAll(
    "[data-adxconfig-option-note='true'][data-setting-key='sweepStyle']"
  );
  const stylePreviewEffects = styleOptions.map((optionNode) =>
    String(optionNode.getAttribute("data-preview-effect") || "")
  );

  assert.deepEqual(stylePreviewEffects, [
    "turn-start-sweep-subtle",
    "turn-start-sweep-standard-style",
    "turn-start-sweep-strong",
  ]);
  styleOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--effect-preview"), true);
  });

  runtime.stop();
});

test("xConfig average-trend-arrow settings expose real arrow preview hosts", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='average-trend-arrow']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const durationPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='durationMs']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(durationPreviewEffects, [
    "average-trend-arrow-duration-220",
    "average-trend-arrow-duration-320",
    "average-trend-arrow-duration-500",
  ]);

  const sizePreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='size']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(sizePreviewEffects, [
    "average-trend-arrow-size-klein",
    "average-trend-arrow-size-standard",
    "average-trend-arrow-size-gross",
  ]);

  documentRef.querySelectorAll("[data-preview-effect^='average-trend-arrow-']").forEach((optionNode) => {
    assert.equal(
      optionNode.classList.contains("ad-xconfig-option-item--average-trend-arrow-preview"),
      true
    );
    const previewNode = optionNode.querySelector("[data-adxconfig-average-trend-preview-host='true']");
    const arrowNode = optionNode.querySelector("[data-adxconfig-average-trend-preview='true']");
    assert.ok(previewNode);
    assert.ok(arrowNode);
    assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-arrow"), true);
    assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-visible"), true);
    assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-up"), true);
    assert.equal(
      Array.from(optionNode.querySelector(".ad-xconfig-option-layout--average-trend-arrow").children)
        .indexOf(previewNode) <
        Array.from(optionNode.querySelector(".ad-xconfig-option-layout--average-trend-arrow").children)
          .findIndex((node) => node.getAttribute?.("data-option-active-slot") === "true"),
      true
    );
  });

  runtime.stop();
});

test("xConfig dart-marker-emphasis settings expose real marker preview hosts", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='dart-marker-emphasis']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const sizePreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='size']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(sizePreviewEffects, [
    "dart-marker-emphasis-size-4",
    "dart-marker-emphasis-size-6",
    "dart-marker-emphasis-size-9",
  ]);

  const effectPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='effect']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(effectPreviewEffects, [
    "dart-marker-emphasis-effect-glow",
    "dart-marker-emphasis-effect-pulse",
    "dart-marker-emphasis-effect-none",
  ]);

  const visibilityPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='opacityPercent']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(visibilityPreviewEffects, [
    "dart-marker-emphasis-opacityPercent-65",
    "dart-marker-emphasis-opacityPercent-85",
    "dart-marker-emphasis-opacityPercent-100",
  ]);

  const previewOptions = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true']")
    .filter((optionNode) =>
      String(optionNode.getAttribute("data-preview-effect") || "")
        .startsWith("dart-marker-emphasis-")
    );
  assert.equal(previewOptions.length, 9);
  previewOptions.forEach((optionNode) => {
    assert.equal(
      optionNode.classList.contains("ad-xconfig-option-item--dart-marker-emphasis-preview"),
      true
    );
    const previewNode = optionNode.querySelector(
      `[${DART_MARKER_EMPHASIS_PREVIEW_ATTRIBUTE}='true']`
    );
    const marker = optionNode.querySelector(
      `[${DART_MARKER_EMPHASIS_PREVIEW_MARKER_ATTRIBUTE}='true']`
    );
    assert.ok(previewNode);
    assert.ok(marker);
    assert.equal(marker.classList.contains(DART_MARKER_EMPHASIS_BASE_CLASS), true);
    assert.equal(marker.classList.contains(DART_MARKER_EMPHASIS_EFFECT_CLASSES.glow), false);
    assert.equal(marker.classList.contains(DART_MARKER_EMPHASIS_EFFECT_CLASSES.pulse), false);
    assert.equal(
      Array.from(optionNode.querySelector(".ad-xconfig-option-layout--dart-marker-emphasis").children)
        .indexOf(previewNode) <
        Array.from(optionNode.querySelector(".ad-xconfig-option-layout--dart-marker-emphasis").children)
          .findIndex((node) => node.getAttribute?.("data-option-active-slot") === "true"),
      true
    );
  });

  const markerByEffect = (previewEffect) =>
    documentRef
      .querySelector(`[data-preview-effect='${previewEffect}']`)
      ?.querySelector(`[${DART_MARKER_EMPHASIS_PREVIEW_MARKER_ATTRIBUTE}='true']`);
  assert.equal(markerByEffect("dart-marker-emphasis-size-4")?.getAttribute("r"), "4");
  assert.equal(markerByEffect("dart-marker-emphasis-size-9")?.getAttribute("r"), "9");
  assert.equal(markerByEffect("dart-marker-emphasis-opacityPercent-65")?.style.opacity, "0.65");
  assert.equal(markerByEffect("dart-marker-emphasis-opacityPercent-100")?.style.opacity, "1");

  runtime.stop();
});

test("xConfig turn-points-count settings expose real effect preview hosts", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='turn-points-count']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const countEffectPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='countEffect']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(countEffectPreviewEffects, [
    "turn-points-count-countup",
    "turn-points-count-odometer",
    "turn-points-count-steps",
  ]);

  const speedPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='durationMs']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(speedPreviewEffects, [
    "turn-points-count-fast",
    "turn-points-count-standard-speed",
    "turn-points-count-slow",
  ]);

  const flashPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='flashMode']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(flashPreviewEffects, [
    "turn-points-count-flash-change",
    "turn-points-count-flash-permanent",
  ]);

  documentRef.querySelectorAll("[data-preview-effect^='turn-points-count-']").forEach((optionNode) => {
    assert.equal(
      optionNode.classList.contains("ad-xconfig-option-item--turn-points-count-preview"),
      true
    );
    const previewNode = optionNode.querySelector("[data-adxconfig-turn-points-preview='true']");
    const scoreNode = optionNode.querySelector("[data-adxconfig-turn-points-preview-score='true']");
    assert.ok(previewNode);
    assert.ok(scoreNode);
    assert.equal(scoreNode.textContent, "501");
    assert.equal(scoreNode.classList.contains("ad-ext-turn-points"), false);
    assert.equal(scoreNode.classList.contains("ad-xconfig-turn-points-preview-score"), true);
    assert.equal(
      Array.from(optionNode.querySelector(".ad-xconfig-option-layout--turn-points-count").children)
        .indexOf(previewNode) <
        Array.from(optionNode.querySelector(".ad-xconfig-option-layout--turn-points-count").children)
          .findIndex((node) => node.getAttribute?.("data-option-active-slot") === "true"),
      true
    );
  });

  runtime.stop();
});

test("xConfig x01 score progress settings no longer expose a design selector", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-score-progress']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  assert.equal(
    Boolean(
      documentRef.querySelector(
        "[data-adxconfig-setting='true'][data-setting-key='designPreset']"
      )
    ),
    false
  );
  assert.ok(
    documentRef.querySelector(
      "[data-adxconfig-setting='true'][data-setting-key='colorTheme']"
    )
  );
  assert.ok(
    documentRef.querySelector(
      "[data-adxconfig-setting='true'][data-setting-key='barSize']"
    )
  );
  assert.ok(
    documentRef.querySelector(
      "[data-adxconfig-setting='true'][data-setting-key='effect']"
    )
  );

  runtime.stop();
});

test("xConfig turn points settings expose flash toggle plus mode selector and persist changes", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='turn-points-count']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const flashSetting = documentRef.querySelector(
    "[data-adxconfig-setting='true'][data-setting-key='flashOnChange']"
  );
  assert.ok(flashSetting);
  const durationSetting = documentRef.querySelector(
    "[data-adxconfig-setting='true'][data-setting-key='durationMs']"
  );
  assert.ok(durationSetting);
  const countEffectSetting = documentRef.querySelector(
    "[data-adxconfig-setting='true'][data-setting-key='countEffect']"
  );
  assert.ok(countEffectSetting);
  const flashModeSetting = documentRef.querySelector(
    "[data-adxconfig-setting='true'][data-setting-key='flashMode']"
  );
  assert.ok(flashModeSetting);

  const noteTexts = documentRef
    .querySelectorAll(".ad-xconfig-modal .ad-xconfig-note")
    .map((node) => String(node.textContent || ""));
  assert.ok(
    noteTexts.some((text) => /Aufblitz-Effekt/.test(text)),
    "missing turn-points flash setting note"
  );
  assert.ok(
    noteTexts.some((text) => /Anzeigetafel|Geschwindigkeit/.test(text)),
    "missing turn-points speed setting note"
  );
  assert.ok(
    noteTexts.some((text) => /CountUp|Odometer|Zählstil/.test(text)),
    "missing turn-points count style setting note"
  );

  clickSelectSettingOption(documentRef, "turn-points-count", "durationMs", 5000);
  await waitForStoredConfig(localStorage, (config) => config.features.turnPointsCount.durationMs === 5000);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnPointsCount.durationMs, 5000);

  clickSelectSettingOption(documentRef, "turn-points-count", "countEffect", "odometer");
  await waitForStoredConfig(localStorage, (config) => config.features.turnPointsCount.countEffect === "odometer");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnPointsCount.countEffect, "odometer");

  clickSettingToggle(documentRef, "turn-points-count", "flashOnChange", false);
  await waitForStoredConfig(localStorage, (config) => config.features.turnPointsCount.flashOnChange === false);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnPointsCount.flashOnChange, false);

  clickSelectSettingOption(documentRef, "turn-points-count", "flashMode", "permanent");
  await waitForStoredConfig(localStorage, (config) => config.features.turnPointsCount.flashMode === "permanent");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnPointsCount.flashMode, "permanent");

  clickSettingToggle(documentRef, "turn-points-count", "flashOnChange", true);
  await waitForStoredConfig(localStorage, (config) => config.features.turnPointsCount.flashOnChange === true);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnPointsCount.flashOnChange, true);

  clickSelectSettingOption(documentRef, "turn-points-count", "flashMode", "on-change");
  await waitForStoredConfig(localStorage, (config) => config.features.turnPointsCount.flashMode === "on-change");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnPointsCount.flashMode, "on-change");

  runtime.stop();
});

test("xConfig dart design options render split layout with preview and active badge slot", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='dart-marker-darts']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const designOptions = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-darts'][data-setting-key='design']"
  );
  assert.equal(designOptions.length, DART_DESIGN_KEYS.length);
  assert.deepEqual(
    designOptions.map((optionNode) => optionNode.getAttribute("data-setting-value")),
    DART_DESIGN_KEYS
  );

  const sizeOptions = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-darts'][data-setting-key='sizePercent']"
  );
  assert.deepEqual(
    sizeOptions.map((optionNode) => optionNode.getAttribute("data-setting-value")),
    ["108", "120", "138"]
  );

  designOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--dart-design"), true);
    const preview = optionNode.querySelector(".ad-xconfig-option-preview");
    assert.ok(preview);
    assert.match(String(preview.getAttribute("src") || ""), /Dart_/);
    const activeSlot = optionNode.querySelector("[data-option-active-slot='true']");
    assert.ok(activeSlot);
  });

  const settingsModal = documentRef.querySelector(".ad-xconfig-modal");
  assert.ok(settingsModal);
  const dartDemoSection = documentRef.querySelector(
    "[data-adxconfig-settings-section='dart-demo']"
  );
  assert.ok(dartDemoSection);
  assert.ok(
    dartDemoSection.querySelector(
      "[data-adxconfig-action-preview-target='dart-marker-darts']"
    )
  );
  const settingsSummaryNotes = Array.from(
    documentRef.querySelectorAll("[data-adxconfig-settings-summary='true'] .ad-xconfig-note")
  ).map((node) => String(node.textContent || "").trim());
  assert.match(
    settingsSummaryNotes.join(" "),
    /schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen/i
  );

  const activeBefore = designOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(activeBefore.length, 1);
  const activeBeforeSlot = activeBefore[0].querySelector("[data-option-active-slot='true']");
  assert.ok(activeBeforeSlot);
  assert.ok(activeBeforeSlot.querySelector(".ad-xconfig-option-active"));

  clickSelectSettingOption(documentRef, "dart-marker-darts", "design", "red");
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerDarts.design === "red");
  clickSettingToggle(documentRef, "dart-marker-darts", "enableShadow", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerDarts.enableShadow === false);
  clickSettingToggle(documentRef, "dart-marker-darts", "enableShadowBlur", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerDarts.enableShadowBlur === false);
  clickSettingToggle(documentRef, "dart-marker-darts", "enableWobble", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerDarts.enableWobble === false);
  clickSettingToggle(documentRef, "dart-marker-darts", "enableFlightBlur", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerDarts.enableFlightBlur === false);

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.dartMarkerDarts.design, "red");
  assert.equal(storedConfig.features.dartMarkerDarts.enableShadow, false);
  assert.equal(storedConfig.features.dartMarkerDarts.enableShadowBlur, false);
  assert.equal(storedConfig.features.dartMarkerDarts.enableWobble, false);
  assert.equal(storedConfig.features.dartMarkerDarts.enableFlightBlur, false);

  const activeAfter = designOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(activeAfter.length, 1);
  assert.equal(activeAfter[0].getAttribute("data-setting-value"), "red");

  const redOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-darts'][data-setting-key='design'][data-setting-value='red']"
  );
  assert.ok(redOption);
  assert.ok(redOption.querySelector("[data-option-active-slot='true'] .ad-xconfig-option-active"));

  const autodartsOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-darts'][data-setting-key='design'][data-setting-value='autodarts']"
  );
  assert.ok(autodartsOption);
  assert.equal(
    Boolean(autodartsOption.querySelector("[data-option-active-slot='true'] .ad-xconfig-option-active")),
    false
  );

  runtime.stop();
});

test("xConfig shell links every card README button to the matching README anchor", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  for (const descriptor of xconfigDescriptors) {
    const tabId = descriptor.tab === "themes" ? "themes" : "animations";
    const tabButton = documentRef.getElementById(`ad-xconfig-tab-${tabId}`);
    assert.ok(tabButton, `missing tab button for ${descriptor.featureKey}`);
    tabButton.click();
    await waitForActiveTab(documentRef, tabId);

    const cardReadmeButton = documentRef.querySelector(
      `.ad-xconfig-card[data-feature-key='${descriptor.featureKey}'] [data-adxconfig-action='open-readme'][data-feature-key='${descriptor.featureKey}']`
    );
    assert.ok(cardReadmeButton, `missing card README button for ${descriptor.featureKey}`);
    cardReadmeButton.click();
    await waitForOpenedUrl(
      windowRef,
      `https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#${descriptor.readmeAnchor}`
    );

    assert.equal(
      windowRef.__openedUrls.at(-1),
      `https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#${descriptor.readmeAnchor}`
    );
  }

  runtime.stop();
});

test("xConfig shell renders Templates Global font options as preview buttons and scopes preview font loading to the modal", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const themeCards = documentRef.querySelectorAll(".ad-xconfig-card");
  assert.ok(themeCards.length > 0);
  assert.equal(themeCards[0]?.getAttribute("data-feature-key"), "theme-global-typography");
  assert.equal(documentRef.getElementById("ad-xconfig-preview-fonts-style"), null);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-typography']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const sectionTitles = documentRef
    .querySelectorAll(".ad-xconfig-settings-section-title")
    .map((node) => String(node.textContent || "").trim());
  assert.deepEqual(sectionTitles, ["Presets", "Schrift", "Farben", "Wurffeld-Darts", "Hintergrund"]);

  const presetButtons = documentRef.querySelectorAll(
    "[data-adxconfig-action='applyThemeGlobalPreset'][data-feature-key='theme-global-typography']"
  );
  assert.equal(presetButtons.length, THEME_GLOBAL_TEMPLATE_PRESETS.length);
  assert.deepEqual(
    presetButtons.map((button) => String(button.textContent || "").trim()),
    THEME_GLOBAL_TEMPLATE_PRESETS.map((preset) => preset.label)
  );

  const previewStyleNode = documentRef.getElementById("ad-xconfig-preview-fonts-style");
  assert.ok(previewStyleNode);
  assert.match(String(previewStyleNode.textContent || ""), /fonts\.bunny\.net/);

  const fontOptionButtons = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='fontPreset']"
  );
  assert.equal(fontOptionButtons.length, THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.length);
  assert.equal(
    new Set(THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.map((preset) => preset.value)).size,
    THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.length
  );
  assert.deepEqual(
    fontOptionButtons.map((button) =>
      String(button.querySelector(".ad-xconfig-option-label")?.textContent || "").trim()
    ),
    THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.map((preset) => preset.label)
  );
  assert.deepEqual(
    THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.slice(1).map((preset) => preset.label),
    THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS
      .slice(1)
      .map((preset) => preset.label)
      .slice()
      .sort((left, right) => left.localeCompare(right, "de", { sensitivity: "base" }))
  );

  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.forEach((preset) => {
    const optionButton = documentRef.querySelector(
      `[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='fontPreset'][data-setting-value='${preset.value}']`
    );
    assert.ok(optionButton, `missing option button for ${preset.value}`);
    assert.equal(optionButton.classList.contains("ad-xconfig-option-item--typography-font"), true);

    const optionLabels = optionButton.querySelectorAll(".ad-xconfig-option-label");
    assert.equal(optionLabels.length, 1, `unexpected preview layout for ${preset.value}`);
    assert.equal(String(optionLabels[0].textContent || "").trim(), preset.label);

    if (preset.value === "system") {
      assert.equal(optionLabels[0].getAttribute("data-adxconfig-preview-font"), null);
      return;
    }

    assert.equal(optionLabels[0].getAttribute("data-adxconfig-preview-font"), preset.value);
    assert.match(String(optionLabels[0].style.fontFamily || ""), new RegExp(preset.familyName));
  });

  assert.equal(
    documentRef.querySelectorAll(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='fontPreset'] .ad-xconfig-option-copy"
    ).length,
    0
  );

  const shellStyleNode = documentRef.getElementById("ad-xconfig-shell-style");
  assert.ok(shellStyleNode);
  assert.equal(
    String(shellStyleNode.textContent || "").includes("padding:.79rem .9rem;min-height:4.51rem"),
    true
  );
  assert.equal(
    String(shellStyleNode.textContent || "").includes("font-size:1.19rem;line-height:1.2;font-weight:600;letter-spacing:.01em"),
    true
  );

  const scopeOptionButtons = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='applyTo']"
  );
  assert.equal(scopeOptionButtons.length, 3);
  assert.equal(
    scopeOptionButtons.filter((node) => node.getAttribute("data-active") === "true").length,
    1
  );
  assert.equal(
    scopeOptionButtons.find((node) => node.getAttribute("data-setting-value") === "scores")?.getAttribute("data-active"),
    "true"
  );

  clickSelectSettingOption(documentRef, "theme-global-typography", "applyTo", "throws");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      Array.isArray(config.features?.themes?.globalTypography?.applyTo) &&
      config.features.themes.globalTypography.applyTo.includes("scores") &&
      config.features.themes.globalTypography.applyTo.includes("throws")
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.deepEqual(storedConfig.features.themes.globalTypography.applyTo, ["scores", "throws"]);
  assert.equal(
    documentRef.querySelector(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='applyTo'][data-setting-value='throws']"
    )?.getAttribute("data-active"),
    "true"
  );

  clickSelectSettingOption(documentRef, "theme-global-typography", "applyTo", "scores");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      Array.isArray(config.features?.themes?.globalTypography?.applyTo) &&
      config.features.themes.globalTypography.applyTo.length === 1 &&
      config.features.themes.globalTypography.applyTo[0] === "throws"
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.deepEqual(storedConfig.features.themes.globalTypography.applyTo, ["throws"]);

  const colorFields = documentRef.querySelectorAll(
    "[data-adxconfig-color-field='true'][data-feature-key='theme-global-typography']"
  );
  assert.equal(colorFields.length, 6);
  assert.deepEqual(
    colorFields.map((node) => String(node.getAttribute("data-setting-key") || "").trim()),
    [
      "accentColor",
      "scoreColor",
      "secondaryTextColor",
      "throwLabelColor",
      "turnDartColor",
      "turnDartGradientColor",
    ]
  );
  const backgroundSelectFields = documentRef.querySelectorAll(
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-control='select']"
  );
  assert.equal(
    backgroundSelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "backgroundDisplayMode"
    ),
    true
  );
  assert.equal(
    backgroundSelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "backgroundOpacity"
    ),
    true
  );
  assert.equal(
    backgroundSelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "playerFieldTransparency"
    ),
    true
  );
  assert.equal(
    backgroundSelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "activePlayerTintIntensity"
    ),
    true
  );
  assert.equal(
    backgroundSelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "turnDartStyle"
    ),
    true
  );
  assert.equal(
    backgroundSelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "turnDartSizePercent"
    ),
    true
  );
  assert.ok(documentRef.getElementById("ad-xconfig-field-theme-global-typography-uploadThemeBackground"));
  assert.ok(documentRef.getElementById("ad-xconfig-field-theme-global-typography-clearThemeBackground"));
  assert.ok(documentRef.getElementById("ad-xconfig-field-theme-global-typography-uploadTurnDartImage"));
  assert.ok(documentRef.getElementById("ad-xconfig-field-theme-global-typography-clearTurnDartImage"));
  const turnDartTextInput = documentRef.querySelector(
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-key='turnDartTextTemplate'][data-setting-control='text']"
  );
  assert.ok(turnDartTextInput);
  assert.equal(turnDartTextInput.getAttribute("placeholder"), "Wurf #");
  const turnDartImageStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(turnDartImageStatus);
  assert.equal(turnDartImageStatus.getAttribute("data-turn-dart-image-state"), "empty");
  assert.equal(
    String(turnDartImageStatus.querySelector(".ad-xconfig-theme-image-status-summary")?.textContent || ""),
    "Aktuelles Dart-Bild: keines."
  );

  clickSelectSettingOption(documentRef, "theme-global-typography", "activePlayerTintIntensity", 20);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.activePlayerTintIntensity === 20
  );

  changeSettingInput(
    documentRef,
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-key='turnDartTextTemplate']",
    "Wurf #"
  );
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.turnDartTextTemplate === "Wurf #"
  );

  changeSettingInput(
    documentRef,
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-key='accentColor'][data-color-input-role='picker']",
    "#123456"
  );
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.accentColor === "#123456"
  );

  let accentField = documentRef.querySelector(
    "[data-adxconfig-color-field='true'][data-feature-key='theme-global-typography'][data-setting-key='accentColor']"
  );
  assert.ok(accentField);
  assert.equal(accentField.getAttribute("data-color-value"), "#123456");
  assert.equal(accentField.getAttribute("data-invalid"), "false");
  assert.equal(
    accentField.querySelector("[data-adxconfig-color-status='true']")?.textContent,
    "Gespeichert: #123456"
  );

  changeSettingInput(
    documentRef,
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-key='secondaryTextColor'][data-color-input-role='hex']",
    "#abc"
  );
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.secondaryTextColor === "#AABBCC"
  );

  let storedTypographyConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedTypographyConfig.features.themes.globalTypography.secondaryTextColor, "#AABBCC");

  let secondaryField = documentRef.querySelector(
    "[data-adxconfig-color-field='true'][data-feature-key='theme-global-typography'][data-setting-key='secondaryTextColor']"
  );
  assert.ok(secondaryField);
  assert.equal(secondaryField.getAttribute("data-color-value"), "#AABBCC");
  assert.equal(
    secondaryField.querySelector("[data-adxconfig-setting='true'][data-color-input-role='hex']")?.value,
    "#AABBCC"
  );

  changeSettingInput(
    documentRef,
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-key='throwLabelColor'][data-color-input-role='hex']",
    "invalid"
  );
  await wait(5);

  const throwLabelField = documentRef.querySelector(
    "[data-adxconfig-color-field='true'][data-feature-key='theme-global-typography'][data-setting-key='throwLabelColor']"
  );
  assert.ok(throwLabelField);
  assert.equal(throwLabelField.getAttribute("data-invalid"), "true");
  assert.equal(
    throwLabelField.querySelector("[data-adxconfig-setting='true'][data-color-input-role='hex']")?.value,
    "invalid"
  );
  assert.equal(
    throwLabelField.querySelector("[data-adxconfig-color-status='true']")?.textContent,
    "Ungültiger Hex-Code. Erlaubt sind #RGB oder #RRGGBB."
  );

  storedTypographyConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedTypographyConfig.features.themes.globalTypography.throwLabelColor, "");

  const resetAccentButton = accentField.querySelector(
    "[data-adxconfig-action='clear-setting-color'][data-setting-key='accentColor']"
  );
  assert.ok(resetAccentButton);
  resetAccentButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.accentColor === ""
  );

  accentField = documentRef.querySelector(
    "[data-adxconfig-color-field='true'][data-feature-key='theme-global-typography'][data-setting-key='accentColor']"
  );
  assert.ok(accentField);
  assert.equal(accentField.getAttribute("data-color-value"), "");
  assert.equal(
    accentField.querySelector("[data-adxconfig-color-status='true']")?.textContent,
    "Theme-Default aktiv."
  );

  const closeSettingsButton = documentRef.querySelector("[data-adxconfig-action='close-settings']");
  assert.ok(closeSettingsButton);
  closeSettingsButton.click();
  await waitForSettingsClosed(documentRef);
  await waitFor(() => !documentRef.getElementById("ad-xconfig-preview-fonts-style"));

  runtime.stop();
});

test("xConfig shell applies Templates Global presets with confirmation and asset-backed preview wallpaper", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const confirmMessages = [];
  windowRef.confirm = (message) => {
    confirmMessages.push(String(message || ""));
    return true;
  };
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-typography']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const presetButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-typography-preset-cyberpunk"
  );
  assert.ok(presetButton);
  presetButton.click();

  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.featureToggles?.["themes.globalTypography"] === true &&
      config.features?.themes?.globalTypography?.enabled === true &&
      config.features.themes.globalTypography.fontPreset === "audiowide" &&
      config.features.themes.globalTypography.backgroundAssetKey === "cyberpunk" &&
      config.features.themes.globalTypography.backgroundImageDataUrl === ""
  );

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.globalTypography"], true);
  assert.deepEqual(storedConfig.features.themes.globalTypography, {
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
    ...DEFAULT_TURN_DART_CONFIG,
    debug: false,
  });

  assert.equal(confirmMessages.length, 1);
  assert.match(confirmMessages[0], /Preset "Cyberpunk"/);
  assert.match(confirmMessages[0], /Wallpaper/);

  let status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(status);
  assert.equal(
    await waitFor(
      () =>
        documentRef
          .querySelector(
            "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-typography']"
          )
          ?.getAttribute("data-theme-image-state") === "present",
      { timeoutMs: 500, intervalMs: 8 }
    ),
    true
  );
  status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "present");
  assert.equal(status.getAttribute("data-theme-image-type"), "preset-asset");

  const summary = status.querySelector(".ad-xconfig-theme-image-status-summary");
  assert.ok(summary);
  assert.match(String(summary.textContent || ""), /Preset Cyberpunk/);

  const preview = status.querySelector(".ad-xconfig-theme-image-preview");
  assert.ok(preview);
  assert.match(String(preview.getAttribute("src") || ""), /theme-presets\/cyberpunk\.jpg/);

  const themeCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-typography']"
  );
  assert.ok(themeCard);
  assert.match(String(themeCard.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);
  assert.equal(themeCard.getAttribute("data-card-kind"), "theme-global");

  const themeGlobalSummary = themeCard.querySelector("[data-adxconfig-theme-global-summary='true']");
  assert.ok(themeGlobalSummary);
  const themeGlobalBadges = themeGlobalSummary
    .querySelectorAll(".ad-xconfig-card-global-badge")
    .map((node) => String(node.textContent || ""));
  assert.deepEqual(themeGlobalBadges, ["Global"]);

  const themeGlobalValues = themeGlobalSummary
    .querySelectorAll(".ad-xconfig-card-global-value")
    .map((node) => String(node.textContent || ""));
  assert.deepEqual(themeGlobalValues, []);

  const themeCardCopy = themeCard.querySelector(".ad-xconfig-card-copy");
  assert.match(String(themeCardCopy?.textContent || ""), /gemeinsamen Look/);
  assert.match(String(themeCardCopy?.textContent || ""), /Themes ohne eigenes Bild/);

  const themeCardNote = themeCard.querySelector(".ad-xconfig-note");
  assert.ok(themeCardNote);
  assert.match(String(themeCardNote.textContent || ""), /Globales Preset-Wallpaper: Cyberpunk/);

  const themeCardPreview = themeCard.querySelector(".ad-xconfig-card-bg img");
  assert.ok(themeCardPreview);
  assert.match(String(themeCardPreview.getAttribute("src") || ""), /theme-presets\/cyberpunk\.jpg/);

  runtime.stop();
});

test("xConfig shell links every settings modal README button to the matching README anchor", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  for (const descriptor of xconfigDescriptors) {
    if (!Array.isArray(descriptor.fields) || !descriptor.fields.length) {
      continue;
    }

    const tabId = descriptor.tab === "themes" ? "themes" : "animations";
    const tabButton = documentRef.getElementById(`ad-xconfig-tab-${tabId}`);
    assert.ok(tabButton, `missing tab button for ${descriptor.featureKey}`);
    tabButton.click();
    await waitForActiveTab(documentRef, tabId);

    const settingsButton = documentRef.querySelector(
      `.ad-xconfig-card[data-feature-key='${descriptor.featureKey}'] [data-adxconfig-action='open-settings'][data-feature-key='${descriptor.featureKey}']`
    );
    assert.ok(settingsButton, `missing settings button for ${descriptor.featureKey}`);
    settingsButton.click();
    await waitForSettingsModal(documentRef);

    const modalReadmeButton = documentRef.querySelector(
      `.ad-xconfig-modal [data-adxconfig-action='open-readme'][data-feature-key='${descriptor.featureKey}']`
    );
    assert.ok(modalReadmeButton, `missing modal README button for ${descriptor.featureKey}`);
    modalReadmeButton.click();
    await waitForOpenedUrl(
      windowRef,
      `https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#${descriptor.readmeAnchor}`
    );

    assert.equal(
      windowRef.__openedUrls.at(-1),
      `https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#${descriptor.readmeAnchor}`
    );

    const closeSettingsButton = documentRef.querySelector("[data-adxconfig-action='close-settings']");
    assert.ok(closeSettingsButton, `missing modal close button for ${descriptor.featureKey}`);
    closeSettingsButton.click();
    await waitForSettingsClosed(documentRef);
  }

  runtime.stop();
});

test("xConfig shell renders mapped preview backgrounds and compact shell header", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const styleNode = documentRef.getElementById("ad-xconfig-shell-style");
  assert.ok(styleNode);
  assert.equal(String(styleNode.textContent || "").includes("flex-direction:column"), true);
  assert.equal(
    String(styleNode.textContent || "").includes(".ad-xconfig-card-head{display:flex;justify-content:space-between;align-items:flex-start"),
    true
  );
  assert.equal(
    String(styleNode.textContent || "").includes(".ad-xconfig-card--theme-global{grid-column:1/-1;min-height:16.5rem"),
    true
  );
  assert.equal(String(styleNode.textContent || "").includes(".ad-xconfig-card-global-grid"), false);
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
  await waitForActiveTab(documentRef, "animations");

  [
    "checkout-score-pulse",
    "x01-score-progress",
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

test("xConfig shell theme background upload and clear actions persist and expose status feedback", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    if (String(tagName || "").toLowerCase() === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {},
          };
        },
        toDataURL(mimeType) {
          if (mimeType === "image/webp") {
            return `data:image/webp;base64,${"a".repeat(40)}`;
          }
          return "data:image/png;base64,ZmFrZS1kYXRh";
        },
      };
    }

    const node = originalCreateElement(tagName);
    if (String(tagName || "").toLowerCase() === "input") {
      const originalClick = typeof node.click === "function" ? node.click.bind(node) : null;
      node.click = () => {
        if (node.type === "file") {
          node.files = [{ name: "bg.png", type: "image/png" }];
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
  windowRef.createImageBitmap = async () => ({
    width: 2400,
    height: 1800,
    close() {},
  });
  windowRef.FileReader = class FakeFileReader {
    readAsDataURL() {
      this.result = "data:image/png;base64,ZmFrZS1kYXRh";
      if (typeof this.onload === "function") {
        this.onload();
      }
    }
  };

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  let status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-x01']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");
  const emptySummary = status.querySelector(".ad-xconfig-theme-image-status-summary");
  assert.ok(emptySummary);
  assert.equal(String(emptySummary.textContent || "").trim(), "Aktuelles Bild: keines.");

  const uploadButton = documentRef.getElementById("ad-xconfig-field-theme-x01-uploadThemeBackground");
  assert.ok(uploadButton);
  uploadButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.x01.backgroundImageDataUrl === `data:image/webp;base64,${"a".repeat(40)}`
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(
    storedConfig.features.themes.x01.backgroundImageDataUrl,
    `data:image/webp;base64,${"a".repeat(40)}`
  );
  const uploadFeedback = documentRef.querySelector(
    "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-x01']"
  );
  assert.ok(uploadFeedback);
  assert.match(String(uploadFeedback.textContent || ""), /optimiert gespeichert/);
  assert.match(String(uploadFeedback.textContent || ""), /bg\.png/);
  assert.equal(
    uploadFeedback.classList.contains("ad-xconfig-theme-action-feedback--success"),
    true
  );

  status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-x01']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "present");
  assert.equal(status.getAttribute("data-theme-image-type"), "upload");
  assert.equal(status.getAttribute("data-theme-image-size"), "30");

  const uploadedSummary = status.querySelector(".ad-xconfig-theme-image-status-summary");
  assert.ok(uploadedSummary);
  assert.match(String(uploadedSummary.textContent || ""), /image\/webp/);
  assert.match(String(uploadedSummary.textContent || ""), /30 B/);

  const preview = status.querySelector(".ad-xconfig-theme-image-preview");
  assert.ok(preview);
  assert.equal(preview.getAttribute("src"), `data:image/webp;base64,${"a".repeat(40)}`);

  const themeCardNote = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-x01'] .ad-xconfig-note"
  );
  assert.ok(themeCardNote);
  assert.match(String(themeCardNote.textContent || ""), /Hintergrundbild/);

  const clearButton = documentRef.getElementById("ad-xconfig-field-theme-x01-clearThemeBackground");
  assert.ok(clearButton);
  clearButton.click();
  await waitForStoredConfig(localStorage, (config) => config.features.themes.x01.backgroundImageDataUrl === "");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "");
  assert.match(String(uploadFeedback.textContent || ""), /entfernt/);
  assert.equal(
    uploadFeedback.classList.contains("ad-xconfig-theme-action-feedback--info"),
    true
  );

  status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-x01']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");

  const clearedCardNote = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-x01'] .ad-xconfig-note"
  );
  assert.ok(clearedCardNote);
  assert.equal(
    String(clearedCardNote.textContent || "").trim(),
    "Kein eigenes Hintergrundbild gespeichert."
  );

  runtime.stop();
});

test("xConfig shell supports global background upload and clear actions for Templates Global", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    if (String(tagName || "").toLowerCase() === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {},
          };
        },
        toDataURL(mimeType) {
          if (mimeType === "image/webp") {
            return `data:image/webp;base64,${"g".repeat(40)}`;
          }
          return "data:image/png;base64,ZmFrZS1kYXRh";
        },
      };
    }

    const node = originalCreateElement(tagName);
    if (String(tagName || "").toLowerCase() === "input") {
      const originalClick = typeof node.click === "function" ? node.click.bind(node) : null;
      node.click = () => {
        if (node.type === "file") {
          node.files = [{ name: "global-bg.png", type: "image/png" }];
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
  windowRef.createImageBitmap = async () => ({
    width: 2400,
    height: 1800,
    close() {},
  });
  windowRef.FileReader = class FakeFileReader {
    readAsDataURL() {
      this.result = "data:image/png;base64,ZmFrZS1kYXRh";
      if (typeof this.onload === "function") {
        this.onload();
      }
    }
  };

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-typography']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  let status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");

  let turnDartStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(turnDartStatus);
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-state"), "empty");

  const uploadTurnDartButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-typography-uploadTurnDartImage"
  );
  assert.ok(uploadTurnDartButton);
  uploadTurnDartButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.themes.globalTypography.turnDartStyle === "image" &&
      config.features.themes.globalTypography.turnDartImageDataUrl ===
        `data:image/webp;base64,${"g".repeat(40)}`
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalTypography.turnDartStyle, "image");
  assert.equal(
    storedConfig.features.themes.globalTypography.turnDartImageDataUrl,
    `data:image/webp;base64,${"g".repeat(40)}`
  );

  turnDartStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(turnDartStatus);
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-state"), "present");
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-type"), "image/webp");
  const turnDartPreview = turnDartStatus.querySelector(".ad-xconfig-turn-dart-image-preview");
  assert.ok(turnDartPreview);
  assert.equal(turnDartPreview.getAttribute("src"), `data:image/webp;base64,${"g".repeat(40)}`);

  const clearTurnDartButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-typography-clearTurnDartImage"
  );
  assert.ok(clearTurnDartButton);
  clearTurnDartButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.themes.globalTypography.turnDartStyle === "original" &&
      config.features.themes.globalTypography.turnDartImageDataUrl === ""
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalTypography.turnDartStyle, "original");
  assert.equal(storedConfig.features.themes.globalTypography.turnDartImageDataUrl, "");

  turnDartStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(turnDartStatus);
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-state"), "empty");
  assert.equal(turnDartStatus.querySelector(".ad-xconfig-turn-dart-image-preview"), null);

  const uploadButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-typography-uploadThemeBackground"
  );
  assert.ok(uploadButton);
  uploadButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.themes.globalTypography.backgroundImageDataUrl ===
      `data:image/webp;base64,${"g".repeat(40)}`
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(
    storedConfig.features.themes.globalTypography.backgroundImageDataUrl,
    `data:image/webp;base64,${"g".repeat(40)}`
  );
  const uploadFeedback = documentRef.querySelector(
    "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(uploadFeedback);
  assert.match(String(uploadFeedback.textContent || ""), /optimiert gespeichert/);
  assert.match(String(uploadFeedback.textContent || ""), /global-bg\.png/);

  status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-typography']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "present");
  assert.equal(status.getAttribute("data-theme-image-type"), "upload");

  const themeCardNote = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-typography'] .ad-xconfig-note"
  );
  assert.ok(themeCardNote);
  assert.match(String(themeCardNote.textContent || ""), /Globales Fallback-Bild/);

  const clearButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-typography-clearThemeBackground"
  );
  assert.ok(clearButton);
  clearButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalTypography.backgroundImageDataUrl === ""
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalTypography.backgroundImageDataUrl, "");
  assert.match(String(uploadFeedback.textContent || ""), /entfernt/);

  const clearedCardNote = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-typography'] .ad-xconfig-note"
  );
  assert.ok(clearedCardNote);
  assert.equal(
    String(clearedCardNote.textContent || "").trim(),
    "Kein globales Fallback-Hintergrundbild gespeichert."
  );

  runtime.stop();
});

test("xConfig shell reports invalid theme upload payloads as error and keeps previous state", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    const node = originalCreateElement(tagName);
    if (String(tagName || "").toLowerCase() === "input") {
      const originalClick = typeof node.click === "function" ? node.click.bind(node) : null;
      node.click = () => {
        if (node.type === "file") {
          node.files = [{ name: "not-an-image.txt" }];
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
      this.result = "data:text/plain;base64,QUJDRA==";
      if (typeof this.onload === "function") {
        this.onload();
      }
    }
  };

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  const uploadButton = documentRef.getElementById("ad-xconfig-field-theme-x01-uploadThemeBackground");
  assert.ok(uploadButton);
  uploadButton.click();
  await waitFor(() => {
    const errorFeedback = documentRef.querySelector(
      "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-x01']"
    );
    return Boolean(errorFeedback) && /kein unterstütztes Bild/.test(String(errorFeedback.textContent || ""));
  });

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "");

  const errorFeedback = documentRef.querySelector(
    "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-x01']"
  );
  assert.ok(errorFeedback);
  assert.match(String(errorFeedback.textContent || ""), /kein unterstütztes Bild/);
  assert.equal(
    errorFeedback.classList.contains("ad-xconfig-theme-action-feedback--error"),
    true
  );

  const status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-x01']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");

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
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='winner-fireworks']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

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
  await waitFor(() => !documentRef.getElementById("ad-ext-winner-fireworks-preview"));

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

test("xConfig single-bull-sound settings expose and run the configured sound preview", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const audioInstances = [];
  windowRef.Audio = class FakeSingleBullAudio {
    constructor(src) {
      this.src = src;
      this.volume = 0;
      this.currentTime = -1;
      this.playCalls = 0;
      audioInstances.push(this);
    }

    play() {
      this.playCalls += 1;
      return Promise.resolve();
    }

    pause() {}
  };

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(documentRef, "animations");

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='single-bull-sound']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-settings-section='sound-test']"
  );
  assert.ok(previewSection);
  assert.equal(
    previewSection.querySelector(".ad-xconfig-settings-section-title")?.textContent,
    "Sound-Test"
  );

  const quietVolumeButton = documentRef
    .querySelectorAll("[data-adxconfig-action='set-setting-select-option']")
    .find((button) =>
      button.getAttribute("data-feature-key") === "single-bull-sound" &&
      button.getAttribute("data-setting-key") === "volume" &&
      button.getAttribute("data-setting-value") === "0.5"
    );
  assert.ok(quietVolumeButton);
  quietVolumeButton.click();
  assert.equal(
    await waitFor(() => quietVolumeButton.getAttribute("data-active") === "true"),
    true
  );
  assert.equal(
    await waitFor(() => {
      const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
      return storedConfig?.features?.singleBullSound?.volume === 0.5;
    }),
    true
  );

  const previewButton = documentRef.getElementById(
    "ad-xconfig-field-single-bull-sound-run-feature-action"
  );
  assert.ok(previewButton);
  const previewClick = new FakeEvent("click", {
    bubbles: true,
    cancelable: true,
    target: previewButton,
  });
  previewButton.dispatchEvent(previewClick);
  assert.equal(previewClick.defaultPrevented, true);
  assert.equal(
    await waitFor(() => audioInstances.some((audio) => audio.playCalls > 0)),
    true
  );

  const previewAudio = audioInstances.findLast?.((audio) => audio.playCalls > 0) ||
    audioInstances.filter((audio) => audio.playCalls > 0).at(-1);
  assert.ok(previewAudio);
  assert.match(previewAudio.src, /singlebull\.mp3$/);
  assert.equal(previewAudio.volume, 0.5);
  assert.equal(previewAudio.currentTime, 0);

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
  await waitForMenuButton(firstDocument);

  firstDocument.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(firstWindow, firstDocument);

  clickFeatureToggle(firstDocument, "theme-x01", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles["themes.x01"] === true);
  firstDocument.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(firstDocument, "animations");
  clickFeatureToggle(firstDocument, "turn-start-sweep", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.turnStartSweep === true);
  clickFeatureToggle(firstDocument, "x01-score-progress", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.x01ScoreProgress === true);

  const openSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(firstDocument);

  clickSelectSettingOption(firstDocument, "checkout-score-pulse", "effect", "glow");
  await waitForStoredConfig(localStorage, (config) => config.features.checkoutScorePulse.effect === "glow");

  const openX01ProgressSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-score-progress']"
  );
  assert.ok(openX01ProgressSettings);
  openX01ProgressSettings.click();
  await waitFor(() => Boolean(
    firstDocument.querySelector(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-score-progress'][data-setting-key='effect']"
    )
  ));

  clickSelectSettingOption(firstDocument, "x01-score-progress", "effect", "ghost-trail");
  await waitForStoredConfig(localStorage, (config) => config.features.x01ScoreProgress.effect === "ghost-trail");

  await firstWindow.__adXConfig.setThemeBackgroundImage("x01", "data:image/png;base64,cGVyc2lzdGVk");
  await waitForStoredConfig(localStorage, (config) => config.features.themes.x01.backgroundImageDataUrl === "data:image/png;base64,cGVyc2lzdGVk");

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);
  assert.equal(storedConfig.featureToggles.x01ScoreProgress, true);
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "glow");
  assert.equal(storedConfig.features.x01ScoreProgress.effect, "ghost-trail");
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,cGVyc2lzdGVk");

  firstRuntime.stop();

  const secondDocument = new FakeDocument();
  const secondWindow = createFakeWindow({ documentRef: secondDocument, localStorage });
  const secondRuntime = await initializeTampermonkeyRuntime({
    windowRef: secondWindow,
    documentRef: secondDocument,
  });
  await waitForMenuButton(secondDocument);
  await waitForRuntimeToSettle(secondRuntime);

  const secondSnapshot = secondRuntime.getSnapshot();
  assert.equal(secondSnapshot.features["theme-x01"].enabled, true);
  assert.equal(secondSnapshot.features["turn-start-sweep"].enabled, true);
  assert.equal(secondSnapshot.features["x01-score-progress"].enabled, true);
  assert.equal(secondSnapshot.features["turn-start-sweep"].mounted, true);
  assert.equal(secondSnapshot.features["theme-x01"].mounted, true);
  assert.equal(secondSnapshot.features["x01-score-progress"].mounted, true);
  assert.equal(secondSnapshot.features["x01-score-progress"].config.effect, "ghost-trail");
  assert.equal(
    secondSnapshot.features["theme-x01"].config.backgroundImageDataUrl,
    "data:image/png;base64,cGVyc2lzdGVk"
  );

  secondDocument.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(secondWindow, secondDocument);

  const restoredThemeToggle = secondDocument.querySelector(
    "[data-adxconfig-action='set-feature'][data-feature-key='theme-x01'][data-feature-enabled='true']"
  );
  assert.ok(restoredThemeToggle);
  assert.equal(restoredThemeToggle.getAttribute("data-active"), "true");

  secondDocument.getElementById("ad-xconfig-tab-animations").click();
  await waitForActiveTab(secondDocument, "animations");
  const restoredX01ProgressToggle = secondDocument.querySelector(
    "[data-adxconfig-action='set-feature'][data-feature-key='x01-score-progress'][data-feature-enabled='true']"
  );
  assert.ok(restoredX01ProgressToggle);
  assert.equal(restoredX01ProgressToggle.getAttribute("data-active"), "true");
  const openSecondSettings = secondDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  openSecondSettings.click();
  await waitForSettingsModal(secondDocument);

  const restoredEffectOptions = secondDocument.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-pulse'][data-setting-key='effect']"
  );
  const restoredActiveEffects = restoredEffectOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(restoredActiveEffects.length, 1);
  assert.equal(restoredActiveEffects[0].getAttribute("data-setting-value"), "glow");

  const openRestoredX01Settings = secondDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-score-progress']"
  );
  assert.ok(openRestoredX01Settings);
  openRestoredX01Settings.click();
  await waitFor(() => {
    return secondDocument.querySelectorAll(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-score-progress'][data-setting-key='effect']"
    ).length > 0;
  });

  const restoredX01EffectOptions = secondDocument.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-score-progress'][data-setting-key='effect']"
  );
  await waitFor(() => restoredX01EffectOptions.some(
    (node) => node.getAttribute("data-active") === "true"
  ));
  const restoredActiveX01Effects = restoredX01EffectOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(restoredActiveX01Effects.length, 1);
  assert.equal(restoredActiveX01Effects[0].getAttribute("data-setting-value"), "ghost-trail");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);
  assert.equal(storedConfig.featureToggles.x01ScoreProgress, true);

  secondRuntime.stop();
});

