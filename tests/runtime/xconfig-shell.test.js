import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import {
  resolveBoardStyleDesignAsset,
  resolveDartDesignAsset,
} from "../../src/shared/feature-assets.node.js";
import { DART_DESIGN_KEYS } from "../../src/shared/feature-assets.manifest.js";
import {
  THEME_GLOBAL_TEMPLATE_PRESETS,
  getThemeGlobalTemplatePreset,
} from "../../src/shared/theme-global-template-presets.js";
import { THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS } from "../../src/shared/theme-global-typography-presets.js";
import { USERSCRIPT_DOWNLOAD_URL } from "../../src/features/xconfig-ui/update-check.js";
import { groupXConfigFeatures } from "../../src/features/xconfig-ui/shell-view.js";
import {
  DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_ATTRIBUTE,
  DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE,
} from "../../src/features/xconfig-ui/dartboard-marker-highlight-preview-contract.js";
import {
  BASE_CLASS as DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS,
  EFFECT_CLASSES as DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES,
} from "../../src/features/dartboard-marker-highlight/style.js";
import {
  ARROW_HALF_WIDTH_VAR as AVG_TREND_ARROW_HALF_WIDTH_VAR,
  ARROW_HEIGHT_VAR as AVG_TREND_ARROW_HEIGHT_VAR,
} from "../../src/features/avg-trend-arrow/style.js";
import {
  EFFECT_CLASSES as CHECKOUT_SCORE_HIGHLIGHT_EFFECT_CLASSES,
  HIGHLIGHT_CLASS as CHECKOUT_SCORE_HIGHLIGHT_HIGHLIGHT_CLASS,
  STYLE_VARIABLES as CHECKOUT_SCORE_HIGHLIGHT_STYLE_VARIABLES,
} from "../../src/features/checkout-score-highlight/style.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { ELECTRIC_FILTER_DEFS_NODE_ID } from "../../src/shared/electric-border-engine.js";
import { FakeEvent, FakeStorage, createFakeWindow, FakeDocument as BaseFakeDocument } from "./fake-dom.js";

class FakeDocument extends BaseFakeDocument {
  constructor(options = {}) {
    super({ ...options, withUserMenu: true });
  }
}

const CHANGELOG_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/CHANGELOG.md";
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

function changeSwitch(documentRef, selector, enabled) {
  const input = documentRef.querySelector(selector);
  assert.ok(input, `missing switch ${selector}`);
  assert.equal(input.getAttribute("role"), "switch");
  assert.ok(input.getAttribute("aria-label"));
  input.checked = enabled;
  input.dispatchEvent(new FakeEvent("change", { bubbles: true }));
}

function clickFeatureToggle(documentRef, featureKey, enabled) {
  changeSwitch(documentRef, `[data-adxconfig-feature-toggle='true'][data-feature-key='${featureKey}']`, enabled);
}

function clickSettingToggle(documentRef, featureKey, settingKey, enabled) {
  changeSwitch(documentRef, `[data-adxconfig-setting='true'][data-feature-key='${featureKey}'][data-setting-key='${settingKey}']`, enabled);
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

test("xConfig shell injects below Legal with its legacy icon, opens route and closes the drawer", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  let drawerCloseClicks = 0;
  documentRef.userMenuTrigger.addEventListener("click", () => {
    drawerCloseClicks += 1;
  });
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
  assert.equal(menuButton.getAttribute("aria-label"), "xConfig");
  assert.equal(String(menuButton.querySelector(".ad-xconfig-menu-label")?.textContent || "").trim(), "xConfig");
  const menuIcon = menuButton.querySelector(".ad-xconfig-menu-icon");
  assert.ok(menuIcon);
  assert.equal(menuIcon.querySelector("path")?.getAttribute("d")?.startsWith("M3 6.5"), true);
  assert.ok(menuButton.querySelector(".side-menu-chevron"));
  assert.ok(documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID));
  assert.equal(documentRef.legalLink.nextElementSibling, menuButton);
  assert.equal(menuButton.parentElement, documentRef.userMenuList);
  assert.ok(menuButton.classList.contains("autodarts-side-menu-item"));
  assert.equal(documentRef.sidebar.contains(menuButton), false);

  menuButton.click();
  await waitForShellOpen(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");
  assert.equal(menuButton.getAttribute("aria-current"), "page");
  assert.equal(drawerCloseClicks, 1);
  assert.equal(documentRef.variantElement.style.display, "none");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.style.display, "block");

  windowRef.history.pushState({}, "", "/lobbies");
  await waitForShellClosed(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "");
  assert.equal(menuButton.getAttribute("aria-current"), null);
  assert.equal(panelHost.style.display, "none");
  assert.equal(documentRef.variantElement.style.display, "");

  runtime.stop();
});

test("xConfig shell normalizes legacy /ad-xconfig path on the new Autodarts domain", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    localStorage,
    href: "https://play.autodarts.com/ad-xconfig",
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

test("xConfig shell repairs a corrupted side-menu node on sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  const broken = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(broken);
  broken.removeAttribute("data-adxconfig-action");
  broken.replaceChildren(documentRef.createElement("span"));

  windowRef.history.pushState({}, "", "/boards");
  await waitFor(() => documentRef.getElementById("ad-xconfig-menu-item")?.getAttribute("data-adxconfig-action") === "open");

  const repaired = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(repaired);
  assert.equal(repaired.getAttribute("data-adxconfig-action"), "open");

  const label = repaired.querySelector(".ad-xconfig-menu-label");
  assert.ok(label);
  assert.equal(String(label.textContent || "").trim(), "xConfig");

  assert.equal(documentRef.legalLink.nextElementSibling, repaired);
  assert.equal(repaired.parentElement, documentRef.userMenuList);

  runtime.stop();
});

test("xConfig back action restores the originating path and query parameters", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    localStorage,
    href: "https://play.autodarts.com/statistics?range=30d",
  });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  assert.equal(windowRef.location.pathname, "/statistics");
  assert.equal(windowRef.location.search, "?range=30d");

  const backButton = documentRef.querySelector("[data-adxconfig-action='close']");
  assert.equal(backButton?.textContent, "← Zurück");
  backButton.click();
  await waitForShellClosed(windowRef, documentRef);

  assert.equal(windowRef.location.pathname, "/statistics");
  assert.equal(windowRef.location.search, "?range=30d");
  assert.equal(windowRef.location.hash, "");

  runtime.stop();
});

test("xConfig shell restores the menu item when the user drawer is remounted", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  const previousDialog = documentRef.userMenuDialog;
  const replacementDialog = previousDialog.cloneNode(true);
  replacementDialog.querySelector("#ad-xconfig-menu-item")?.remove();
  previousDialog.remove();
  documentRef.body.appendChild(replacementDialog);
  documentRef.flushMutations([{
    target: documentRef.body,
    addedNodes: [replacementDialog],
    removedNodes: [previousDialog],
  }]);

  await waitForMenuButton(documentRef);
  const replacementLegalLink = replacementDialog.querySelector("a[href='/legal']");
  const replacementMenuButton = replacementDialog.querySelector("#ad-xconfig-menu-item");
  assert.ok(replacementLegalLink);
  assert.ok(replacementMenuButton);
  assert.equal(replacementLegalLink.nextElementSibling, replacementMenuButton);
  assert.ok(replacementMenuButton.querySelector(".ad-xconfig-menu-icon"));

  runtime.stop();
});

test("xConfig observer ignores self-managed menu/panel mutations and only syncs for external changes", async () => {
  const localStorage = new FakeStorage({
    [CONFIG_STORAGE_KEY]: JSON.stringify({
      featureToggles: {
        x01BustActivePlayerHighlight: false,
      },
      features: {
        x01BustActivePlayerHighlight: {
          enabled: false,
          debug: false,
        },
      },
    }),
  });
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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='cricket-grid-status-effects']"
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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='cricket-grid-status-effects']"
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

  clickSettingToggle(documentRef, "cricket-grid-status-effects", "rowWave", false);
  await waitFor(() => JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)).features.cricketGridStatusEffects.rowWave === false);

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

test("xConfig side-menu injection stays idempotent and keeps its label and icon", async () => {
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
  assert.equal(documentRef.querySelectorAll("#ad-xconfig-menu-item").length, 1);
  assert.equal(label.style.display, "");
  assert.ok(documentRef.querySelector("#ad-xconfig-menu-item .ad-xconfig-menu-icon"));

  documentRef.sidebar.__rect = { width: 260, height: 720 };
  documentRef.flushMutations();
  assert.equal(label.style.display, "");
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
  await waitForRuntimeToSettle(runtime);

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

  await waitForRuntimeToSettle(runtime);
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
  const shellStyleText = String(documentRef.getElementById("ad-xconfig-shell-style")?.textContent || "");
  assert.equal(
    shellStyleText.includes(
      '#ad-xconfig-menu-item[data-update-available="true"] .ad-xconfig-menu-label::after'
    ),
    true
  );
  assert.equal(
    shellStyleText.includes('#ad-xconfig-menu-item[data-update-available="true"]::after'),
    false
  );

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
  windowRef.fetch = async () => {
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const remoteVersion = refreshCount === 0 ? installedVersion : incrementPatchVersion(installedVersion);
    refreshCount += 1;
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
  windowRef.fetch = async () => {
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const remoteVersion = refreshCount === 0 ? installedVersion : incrementPatchVersion(installedVersion);
    refreshCount += 1;
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

  windowRef.fetch = async () => {
    fetchCount += 1;
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const refreshIndex = refreshCount;
    const gate = refreshIndex === 0 ? firstRefreshGate : secondRefreshGate;
    await gate.promise;

    refreshCount += 1;

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
        () => fetchCount >= 2,
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
    assert.equal(fetchCount, 2);

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

  clickFeatureToggle(documentRef, "avg-trend-arrow", true);
  clickFeatureToggle(documentRef, "turn-score-counter", true);

  assert.equal(await waitFor(() => {
    const storedConfig = gmState.get(CONFIG_STORAGE_KEY);
    return (
      Boolean(storedConfig) &&
      storedConfig.featureToggles.avgTrendArrow === true &&
      storedConfig.featureToggles.turnScoreCounter === true
    );
  }, { timeoutMs: 500, intervalMs: 5 }), true);

  const storedConfig = gmState.get(CONFIG_STORAGE_KEY);
  assert.equal(storedConfig.featureToggles.avgTrendArrow, true);
  assert.equal(storedConfig.featureToggles.turnScoreCounter, true);
  assert.equal(runtime.getSnapshot().features["avg-trend-arrow"].enabled, true);
  assert.equal(runtime.getSnapshot().features["turn-score-counter"].enabled, true);

  runtime.stop();
});

test("xConfig shell wires settings modals, toggles and save actions on one page", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  assert.equal(documentRef.querySelector("[role='tablist']"), null);
  assert.equal(documentRef.querySelector("[data-adxconfig-tab]"), null);
  assert.equal(
    documentRef.querySelector(".ad-xconfig-content")?.getAttribute("data-adxconfig-sections"),
    "true"
  );

  clickFeatureToggle(documentRef, "theme-global-background", true);
  await waitForStoredConfig(
    localStorage,
    (config) => config.featureToggles["themes.globalBackground"] === true
  );
  clickFeatureToggle(documentRef, "turn-score-counter", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.turnScoreCounter === true);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.globalBackground"], true);
  assert.equal(storedConfig.featureToggles.turnScoreCounter, true);

  const openCheckoutSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-highlight']"
  );
  assert.ok(openCheckoutSettings);
  openCheckoutSettings.click();
  await waitForSettingsModal(documentRef);

  const effectOptionsBefore = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-highlight'][data-setting-key='effect']"
  );
  assert.equal(
    effectOptionsBefore.filter((node) => node.getAttribute("data-active") === "true").length,
    1
  );

  clickSelectSettingOption(documentRef, "checkout-score-highlight", "effect", "fade-blink");
  await waitForStoredConfig(localStorage, (config) => config.features.checkoutScoreHighlight.effect === "fade-blink");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "fade-blink");
  const effectOptionsAfter = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-highlight'][data-setting-key='effect']"
  );
  const activeEffectOptions = effectOptionsAfter.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(activeEffectOptions.length, 1);
  assert.equal(activeEffectOptions[0].getAttribute("data-setting-value"), "fade-blink");

  const closeSettings = documentRef.querySelector("[data-adxconfig-action='close-settings']");
  assert.ok(closeSettings);
  closeSettings.click();
  await waitForSettingsClosed(documentRef);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-background']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  clickSelectSettingOption(documentRef, "theme-global-background", "backgroundDisplayMode", "tile");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalBackground.backgroundDisplayMode === "tile"
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalBackground.backgroundDisplayMode, "tile");

  documentRef.querySelector("[data-adxconfig-action='close-settings']").click();
  await waitForSettingsClosed(documentRef);
  assert.equal(
    documentRef.querySelector(
      "[data-adxconfig-feature-toggle='true'][data-feature-key='theme-global-presets']"
    ),
    null
  );
  assert.equal(
    documentRef.querySelector(
      ".ad-xconfig-card[data-feature-key='theme-global-presets']"
    )?.getAttribute("data-card-type"),
    "action"
  );

  runtime.stop();
});

test("xConfig shell renders every feature exactly once in ordered domain sections", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const sectionNodes = documentRef.querySelectorAll("[data-adxconfig-section]");
  const sectionIds = sectionNodes.map((sectionNode) =>
    String(sectionNode.getAttribute("data-adxconfig-section") || "")
  );
  assert.deepEqual(sectionIds, ["template", "all-modes", "x01", "cricket-tactics"]);
  assert.equal(documentRef.querySelector("[role='tablist']"), null);
  assert.equal(documentRef.querySelector("[data-adxconfig-tab]"), null);

  const readSectionCards = (sectionId) => {
    const sectionNode = documentRef.querySelector(
      `[data-adxconfig-section='${sectionId}']`
    );
    assert.ok(sectionNode, `missing section ${sectionId}`);
    return sectionNode
      .querySelectorAll(".ad-xconfig-card")
      .map((cardNode) => String(cardNode.getAttribute("data-feature-key") || ""));
  };

  assert.deepEqual(readSectionCards("template"), [
    "theme-global-presets",
    "theme-global-background",
    "theme-global-typography",
  ]);
  assert.deepEqual(readSectionCards("all-modes"), [
    "turn-score-counter",
    "avg-trend-arrow",
    "special-hit-highlights",
    "bot-board-style",
    "turn-dart-display",
    "dart-marker-replacer",
    "dartboard-marker-highlight",
    "take-out-darts-alert",
    "single-bull-hit-sound",
  ]);
  assert.deepEqual(readSectionCards("x01"), [
    "checkout-suggestion-styles",
    "checkout-score-highlight",
    "x01-remaining-score-bar",
    "x01-bust-active-player-highlight",
    "checkout-target-highlights",
    "tv-board-zoom",
  ]);
  assert.deepEqual(readSectionCards("cricket-tactics"), [
    "cricket-target-highlighter",
    "cricket-grid-status-effects",
  ]);

  const allCardFeatureKeys = documentRef.querySelectorAll(".ad-xconfig-card")
    .map((cardNode) => String(cardNode.getAttribute("data-feature-key") || ""));
  assert.equal(allCardFeatureKeys.length, 20);
  assert.equal(new Set(allCardFeatureKeys).size, 20);
  assert.deepEqual(
    sectionNodes.map((sectionNode) => sectionNode.querySelector(".ad-xconfig-section-count")?.textContent),
    ["3 Kacheln", "9 Kacheln", "6 Kacheln", "2 Kacheln"]
  );

  runtime.stop();
});

test("xConfig section grouping keeps unknown future features visible under Weitere", () => {
  const sections = groupXConfigFeatures([
    { featureKey: "turn-score-counter", title: "Runden-Score" },
    { featureKey: "future-feature", title: "Zukünftiges Modul" },
  ]);

  assert.deepEqual(sections.map(({ definition }) => definition.id), ["all-modes", "other"]);
  assert.deepEqual(
    sections.at(-1).entries.map(({ featureKey }) => featureKey),
    ["future-feature"]
  );
  assert.equal(sections.at(-1).definition.title, "Weitere");
});

test("xConfig active cards expose a persistent frame and an explicit switch state", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const cardSelector = ".ad-xconfig-card[data-feature-key='turn-score-counter']";
  assert.equal(documentRef.querySelector(cardSelector)?.getAttribute("data-enabled"), "false");
  assert.deepEqual(
    documentRef.querySelector(cardSelector)
      ?.querySelectorAll(".ad-xconfig-switch-option")
      .map((node) => String(node.textContent || "").trim()),
    ["Aus", "✓ Aktiv"]
  );

  clickFeatureToggle(documentRef, "turn-score-counter", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.turnScoreCounter === true);
  assert.equal(
    await waitFor(() => documentRef.querySelector(cardSelector)?.getAttribute("data-enabled") === "true"),
    true
  );
  assert.equal(documentRef.querySelector(`${cardSelector} [role='switch']`)?.checked, true);
  assert.equal(
    documentRef.querySelector(".ad-xconfig-card[data-feature-key='theme-global-presets']")
      ?.getAttribute("data-enabled"),
    null
  );

  const styleText = String(documentRef.getElementById("ad-xconfig-shell-style")?.textContent || "");
  assert.match(styleText, /\.ad-xconfig-card\[data-enabled="true"\]::after\{[^}]*border:2px solid var\(--color-brand-blue-50,#4a89ff\)/);
  assert.match(styleText, /\.ad-xconfig-switch-input:checked \+ \.ad-xconfig-switch-track \.ad-xconfig-switch-thumb\{[^}]*translateX\(20px\)/);

  runtime.stop();
});

test("xConfig cards show when diagnosis is active", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const cardSelector = ".ad-xconfig-card[data-feature-key='theme-global-typography']";
  const diagnosticBadgeSelector = "[data-adxconfig-status-badge='diagnostic']";
  assert.equal(documentRef.querySelector(cardSelector)?.querySelector(diagnosticBadgeSelector), null);

  documentRef
    .querySelector(`${cardSelector} [data-adxconfig-action='open-settings']`)
    .click();
  await waitForSettingsModal(documentRef);
  clickSettingToggle(documentRef, "theme-global-typography", "debug", true);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalTypography.debug === true
  );
  documentRef.querySelector("[data-adxconfig-action='close-settings']").click();
  await waitForSettingsClosed(documentRef);
  assert.equal(
    await waitFor(() => Boolean(
      documentRef.querySelector(cardSelector)?.querySelector(diagnosticBadgeSelector)
    )),
    true
  );
  assert.equal(
    documentRef.querySelector(cardSelector)?.querySelector(diagnosticBadgeSelector)?.textContent,
    "Diagnose aktiv"
  );

  documentRef
    .querySelector(`${cardSelector} [data-adxconfig-action='open-settings']`)
    .click();
  await waitForSettingsModal(documentRef);
  clickSettingToggle(documentRef, "theme-global-typography", "debug", false);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalTypography.debug === false
  );
  documentRef.querySelector("[data-adxconfig-action='close-settings']").click();
  await waitForSettingsClosed(documentRef);
  assert.equal(
    await waitFor(() => !documentRef.querySelector(cardSelector)?.querySelector(diagnosticBadgeSelector)),
    true
  );

  const styleText = String(documentRef.getElementById("ad-xconfig-shell-style")?.textContent || "");
  assert.match(
    styleText,
    /\.ad-xconfig-status-badge--diagnostic\{[^}]*border:[^}]*background:[^}]*color:/
  );

  runtime.stop();
});

test("xConfig shell marks pending themes and animations as deprecated", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const assertCardStatus = (featureKey, expectedStatus) => {
    const card = documentRef.querySelector(
      `.ad-xconfig-card[data-feature-key='${featureKey}']`
    );
    assert.ok(card, `missing card ${featureKey}`);
    assert.equal(card.getAttribute("data-design-status"), expectedStatus);
    const badge = card.querySelector("[data-adxconfig-status-badge='deprecated']");
    if (expectedStatus === "deprecated") {
      assert.equal(badge?.textContent, "Deprecated");
    } else {
      assert.equal(badge, null);
    }
  };

  [
    "theme-global-background",
    "theme-global-typography",
    "theme-global-presets",
  ].forEach((featureKey) => assertCardStatus(featureKey, "ready"));

  const styleText = String(documentRef.getElementById("ad-xconfig-shell-style")?.textContent || "");
  assert.match(styleText, /\.ad-xconfig-status-badge--deprecated\{[^}]*border:[^}]*background:[^}]*color:/);


  documentRef.querySelectorAll(".ad-xconfig-card").forEach((card) => {
    const featureKey = String(card.getAttribute("data-feature-key") || "");
    const expectedStatus = ["theme-global-background", "theme-global-typography", "theme-global-presets", "bot-board-style", "turn-dart-display", "tv-board-zoom", "checkout-target-highlights", "checkout-suggestion-styles", "checkout-score-highlight", "avg-trend-arrow", "dart-marker-replacer", "dartboard-marker-highlight", "take-out-darts-alert",
      "single-bull-hit-sound", "special-hit-highlights", "x01-remaining-score-bar", "cricket-target-highlighter",
      "cricket-grid-status-effects"].includes(
      featureKey
    )
      ? "ready"
      : "deprecated";
    assertCardStatus(featureKey, expectedStatus);
  });

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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-suggestion-styles']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-suggestion-styles-preview='true']"
  );
  assert.ok(previewSection);
  const previewSuggestion = previewSection.querySelector(".ad-xconfig-checkout-suggestion-demo");
  assert.ok(previewSuggestion);
  assert.equal(
    previewSuggestion.querySelectorAll(".ad-xconfig-checkout-suggestion-demo-field").length,
    3
  );
  assert.equal(
    previewSuggestion.querySelector(".ad-xconfig-checkout-suggestion-demo-total")?.textContent,
    "0"
  );
  const activeStyleOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-suggestion-styles'][data-setting-key='style'][data-active='true']"
  );
  assert.ok(activeStyleOption);
  const cardSelector = ".ad-xconfig-card[data-feature-key='checkout-suggestion-styles']";
  const card = documentRef.querySelector(cardSelector);
  assert.ok(card);
  assert.equal(card.getAttribute("data-preview-kind"), "checkout-suggestion-style");
  const cardPreviewSelector =
    `${cardSelector} [data-adxconfig-feature-card-preview='true'] .ad-xconfig-checkout-suggestion-demo`;
  const cardPreview = documentRef.querySelector(cardPreviewSelector);
  assert.ok(cardPreview);
  assert.equal(
    cardPreview.classList.contains(
      `ad-xconfig-checkout-suggestion-demo--${activeStyleOption.getAttribute("data-setting-value")}`
    ),
    true
  );
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
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-suggestion-styles'][data-setting-key='style']"
  );
  assert.equal(styleOptions.length, 5);
  styleOptions.forEach((optionNode) => {
    assert.ok(optionNode.querySelector(".ad-xconfig-checkout-suggestion-option-preview"));
    const optionPreview = optionNode.querySelector(".ad-xconfig-checkout-suggestion-demo");
    assert.ok(optionPreview);
    assert.equal(
      optionPreview.querySelectorAll(".ad-xconfig-checkout-suggestion-demo-field").length,
      3
    );
  });

  clickSelectSettingOption(documentRef, "checkout-suggestion-styles", "style", "ticket");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutSuggestionStyles.style === "ticket"
  );

  assert.equal(
    await waitFor(() =>
      documentRef
        .querySelector(
          "[data-adxconfig-checkout-suggestion-styles-preview='true'] .ad-xconfig-checkout-suggestion-demo"
        )
        ?.classList.contains("ad-xconfig-checkout-suggestion-demo--ticket") === true
    ),
    true
  );
  assert.equal(
    await waitFor(() =>
      documentRef
        .querySelector(cardPreviewSelector)
        ?.classList.contains("ad-xconfig-checkout-suggestion-demo--ticket") === true
    ),
    true
  );

  runtime.stop();
});

test("xConfig shell leaves the native header and its action menu unobstructed", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const nativeHeader = documentRef.createElement("header");
  const nativeNavigation = documentRef.createElement("nav");
  nativeNavigation.setAttribute("aria-label", "Main navigation");
  const nativeHomeLink = documentRef.createElement("a");
  nativeHomeLink.setAttribute("href", "/");
  nativeHomeLink.textContent = "Home";
  nativeNavigation.appendChild(nativeHomeLink);
  const nativeActions = documentRef.createElement("div");
  ["Open user menu", "Open friends", "Open notifications"].forEach((label) => {
    const button = documentRef.createElement("button");
    button.setAttribute("aria-label", label);
    nativeActions.appendChild(button);
  });
  nativeHeader.appendChild(nativeNavigation);
  nativeHeader.appendChild(nativeActions);
  documentRef.rootElement.insertBefore(nativeHeader, documentRef.layoutShell);
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await waitForMenuButton(documentRef);
  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  assert.equal(documentRef.querySelector(".ad-xconfig-main-nav"), null);
  assert.equal(nativeHeader.isConnected, true);
  assert.notEqual(nativeHeader.style.display, "none");
  assert.notEqual(nativeNavigation.style.display, "none");
  assert.notEqual(nativeActions.style.display, "none");
  assert.deepEqual(
    Array.from(nativeActions.querySelectorAll("button")).map((button) => button.getAttribute("aria-label")),
    ["Open user menu", "Open friends", "Open notifications"]
  );

  const styleText = String(documentRef.getElementById("ad-xconfig-shell-style")?.textContent || "");

  assert.equal(
    styleText.includes("position:relative;width:100%;height:100%"),
    true
  );
  assert.equal(styleText.includes(".ad-xconfig-page{box-sizing:border-box;min-height:100%"), true);
  assert.equal(styleText.includes(".ad-xconfig-main-nav"), false);
  assert.equal(styleText.includes(".ad-xconfig-modal-backdrop{position:fixed;inset:64px 0 0"), true);
  assert.equal(styleText.includes("max-height:calc(100dvh - 96px)"), true);

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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-highlight']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-score-highlight-preview='true']"
  );
  assert.ok(previewSection);
  const previewScore = previewSection.querySelector(
    "[data-adxconfig-checkout-score-highlight-score='true']"
  );
  assert.ok(previewScore);
  assert.equal(previewScore.textContent, "40");
  assert.equal(previewScore.classList.contains(CHECKOUT_SCORE_HIGHLIGHT_HIGHLIGHT_CLASS), true);
  assert.equal(
    previewScore.classList.contains(CHECKOUT_SCORE_HIGHLIGHT_EFFECT_CLASSES["fade-blink"]),
    true
  );
  assert.equal(
    previewScore.style.getPropertyValue(CHECKOUT_SCORE_HIGHLIGHT_STYLE_VARIABLES.color),
    "56, 189, 248"
  );
  assert.equal(
    previewScore.style.getPropertyValue(CHECKOUT_SCORE_HIGHLIGHT_STYLE_VARIABLES.scaleMax),
    "1.08"
  );

  const effectPreviews = documentRef.querySelectorAll(
    "[data-feature-key='checkout-score-highlight'][data-setting-key='effect'] .ad-xconfig-checkout-score-highlight-option-preview"
  );
  assert.equal(effectPreviews.length, 4);
  const glowOptionScore = documentRef.querySelector(
    "[data-feature-key='checkout-score-highlight'][data-setting-key='effect'][data-setting-value='glow-only'] [data-adxconfig-checkout-score-highlight-score='true']"
  );
  assert.ok(glowOptionScore);
  assert.equal(glowOptionScore.classList.contains(CHECKOUT_SCORE_HIGHLIGHT_HIGHLIGHT_CLASS), true);
  assert.equal(glowOptionScore.classList.contains(CHECKOUT_SCORE_HIGHLIGHT_EFFECT_CLASSES["glow-only"]), true);

  const colorButtons = documentRef.querySelectorAll(
    "[data-feature-key='checkout-score-highlight'][data-setting-key='colorTheme'].ad-xconfig-option-item--color-preview"
  );
  assert.equal(colorButtons.length, 4);
  const colorPreviewCards = documentRef.querySelectorAll(
    "[data-feature-key='checkout-score-highlight'][data-setting-key='colorTheme'] .ad-xconfig-checkout-score-highlight-option-preview"
  );
  assert.equal(colorPreviewCards.length, 0);
  const cyanOption = documentRef
    .querySelectorAll(
      "[data-feature-key='checkout-score-highlight'][data-setting-key='colorTheme']"
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
      "[data-feature-key='checkout-score-highlight'][data-setting-key='intensity'] .ad-xconfig-checkout-score-highlight-option-preview"
    ).length,
    0
  );
  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='checkout-score-highlight'][data-setting-key='triggerSource'] .ad-xconfig-checkout-score-highlight-option-preview"
    ).length,
    0
  );

  clickSelectSettingOption(documentRef, "checkout-score-highlight", "intensity", "stark");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutScoreHighlight.intensity === "stark"
  );

  assert.equal(
    await waitFor(() => {
      const refreshedScore = documentRef.querySelector(
        "[data-adxconfig-checkout-score-highlight-preview='true'] [data-adxconfig-checkout-score-highlight-score='true']"
      );
      return (
        refreshedScore?.style.getPropertyValue(CHECKOUT_SCORE_HIGHLIGHT_STYLE_VARIABLES.scaleMax) === "1.12" &&
        refreshedScore?.style.getPropertyValue(CHECKOUT_SCORE_HIGHLIGHT_STYLE_VARIABLES.glowMaxBlur) === "22px"
      );
    }),
    true
  );

  clickSelectSettingOption(documentRef, "checkout-score-highlight", "triggerSource", "score-only");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutScoreHighlight.triggerSource === "score-only"
  );

  assert.equal(
    await waitFor(() =>
      documentRef.querySelector(
        "[data-adxconfig-checkout-score-highlight-preview='true'] .ad-xconfig-checkout-score-highlight-preview-context"
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
  const originalSetInterval = windowRef.setInterval.bind(windowRef);
  const originalClearInterval = windowRef.clearInterval.bind(windowRef);
  let x01PreviewIntervalCallback = null;
  let x01ColorPreviewIntervalCallback = null;
  windowRef.setInterval = (callback, ms, ...args) => {
    if (Number(ms) === 2000) {
      x01PreviewIntervalCallback = () => callback(...args);
      return 20_001;
    }
    if (Number(ms) === 1200) {
      x01ColorPreviewIntervalCallback = () => callback(...args);
      return 20_002;
    }
    return originalSetInterval(callback, ms, ...args);
  };
  windowRef.clearInterval = (handle) => {
    if (Number(handle) === 20_001) {
      x01PreviewIntervalCallback = null;
      return;
    }
    if (Number(handle) === 20_002) {
      x01ColorPreviewIntervalCallback = null;
      return;
    }
    originalClearInterval(handle);
  };
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  clickFeatureToggle(documentRef, "x01-remaining-score-bar", true);
  await waitForStoredConfig(
    localStorage,
    (config) => config.featureToggles.x01RemainingScoreBar === true
  );

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-remaining-score-bar']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-x01-remaining-score-bar-preview='true']"
  );
  assert.ok(previewSection);
  const previewBar = previewSection.querySelector(
    "[data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
  );
  const previewScore = previewSection.querySelector(
    "[data-adxconfig-x01-remaining-score-bar-preview-score='true']"
  );
  const previewRoute = previewSection.querySelector(
    "[data-adxconfig-x01-remaining-score-bar-preview-route='true']"
  );
  assert.ok(previewBar);
  assert.ok(previewScore);
  assert.ok(previewRoute);
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-remaining-score-bar"), "true");
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-remaining-score-bar-color-theme"), "traffic-light");
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-remaining-score-bar-size"), "breit");
  assert.equal(previewBar.getAttribute("data-ad-ext-x01-remaining-score-bar-effect"), "previous-score-trail");
  const previewCss = documentRef.getElementById("ad-xconfig-shell-style").textContent;
  for (const [size, height] of [["schmal", 8], ["standard", 12], ["breit", 20], ["extrabreit", 28]]) {
    assert.ok(previewCss.includes(
      `.ad-xconfig-x01-remaining-score-bar-preview-host.ad-ext-x01-remaining-score-bar--active.ad-ext-x01-remaining-score-bar--size-${size}{\n  --ad-ext-x01-remaining-score-bar-height-active:${height}px;`
    ));
  }
  assert.equal(previewBar.getAttribute("data-adxconfig-x01-remaining-score-bar-preview-cycle"), "true");
  assert.equal(previewScore.textContent, "100%");
  assert.equal(previewRoute.textContent, "100%  75%  45%  20%");
  assert.equal(previewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"), "100%");
  assert.ok(previewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-fill-bg-active"));
  assert.ok(previewBar.querySelector(".ad-ext-x01-remaining-score-bar__track"));
  assert.ok(previewBar.querySelector(".ad-ext-x01-remaining-score-bar__trail"));
  assert.ok(
    previewBar.querySelector(
      ".ad-ext-x01-remaining-score-bar__fill.ad-ext-x01-remaining-score-bar__fill--effect-previous-score-trail"
    )
  );
  assert.equal(typeof x01PreviewIntervalCallback, "function");

  const effectPreviewBars = documentRef.querySelectorAll(
    "[data-feature-key='x01-remaining-score-bar'][data-setting-key='effect'] [data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
  );
  assert.equal(effectPreviewBars.length, 6);
  effectPreviewBars.forEach((effectPreviewBar) => {
    assert.equal(
      effectPreviewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"),
      "80%"
    );
  });

  const ghostTrailPreviewBar = documentRef.querySelector(
    "[data-feature-key='x01-remaining-score-bar'][data-setting-key='effect'][data-setting-value='previous-score-trail'] [data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
  );
  assert.ok(ghostTrailPreviewBar);
  assert.equal(
    ghostTrailPreviewBar.getAttribute("data-adxconfig-x01-remaining-score-bar-preview-loop"),
    "previous-score-trail-drop"
  );

  x01PreviewIntervalCallback();
  assert.equal(previewScore.textContent, "75%");
  assert.equal(previewRoute.textContent, "100%  75%  45%  20%");
  assert.equal(previewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"), "75%");
  assert.equal(
    ghostTrailPreviewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"),
    "15%"
  );
  assert.ok(ghostTrailPreviewBar.querySelector(".ad-ext-x01-remaining-score-bar__trail")?.__lastAnimation);

  x01PreviewIntervalCallback();
  assert.equal(previewScore.textContent, "45%");
  assert.equal(previewRoute.textContent, "100%  75%  45%  20%");
  assert.equal(previewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"), "45%");

  x01PreviewIntervalCallback();
  assert.equal(previewScore.textContent, "20%");
  assert.equal(previewRoute.textContent, "100%  75%  45%  20%");
  assert.equal(previewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"), "20%");

  x01PreviewIntervalCallback();
  assert.equal(previewScore.textContent, "100%");
  assert.equal(previewRoute.textContent, "100%  75%  45%  20%");
  assert.equal(previewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"), "100%");

  const colorPreviewBars = documentRef.querySelectorAll(
    "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'] [data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
  );
  assert.equal(colorPreviewBars.length, 13);
  colorPreviewBars.forEach((colorPreviewBar) => {
    assert.equal(
      colorPreviewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"),
      "100%"
    );
    assert.equal(colorPreviewBar.getAttribute("data-ad-ext-x01-remaining-score-bar-size"), "breit");
    assert.equal(colorPreviewBar.getAttribute("data-ad-ext-x01-remaining-score-bar-effect"), "off");
    assert.ok(colorPreviewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-fill-bg-active"));
  });
  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'][data-preview-effect='x01-remaining-score-bar-color-cycle']"
    ).length,
    5
  );
  assert.equal(
    documentRef.querySelector(
      "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'][data-setting-value='autodarts']"
    )?.getAttribute("data-preview-effect"),
    null
  );
  const trafficLightOption = documentRef.querySelector(
    "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'][data-setting-value='traffic-light']"
  );
  const trafficLightPreviewBar = trafficLightOption?.querySelector(
    "[data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
  );
  assert.ok(trafficLightOption);
  assert.ok(trafficLightPreviewBar);
  const trafficLightStartGradient = trafficLightPreviewBar.style.getPropertyValue(
    "--ad-ext-x01-remaining-score-bar-fill-bg-active"
  );
  documentRef.dispatchEvent(new FakeEvent("pointerover", {
    bubbles: true,
    target: trafficLightOption,
  }));
  assert.equal(typeof x01ColorPreviewIntervalCallback, "function");
  x01ColorPreviewIntervalCallback();
  assert.equal(
    trafficLightPreviewBar.getAttribute("data-adxconfig-x01-remaining-score-bar-preview-score-state"),
    "251"
  );
  assert.equal(
    trafficLightPreviewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"),
    "100%"
  );
  assert.notEqual(
    trafficLightPreviewBar.style.getPropertyValue(
      "--ad-ext-x01-remaining-score-bar-fill-bg-active"
    ),
    trafficLightStartGradient
  );
  documentRef.dispatchEvent(new FakeEvent("pointerout", {
    bubbles: true,
    target: trafficLightOption,
  }));
  assert.equal(x01ColorPreviewIntervalCallback, null);
  assert.equal(
    trafficLightPreviewBar.getAttribute("data-adxconfig-x01-remaining-score-bar-preview-score-state"),
    "501"
  );
  assert.equal(
    trafficLightPreviewBar.style.getPropertyValue("--ad-ext-x01-remaining-score-bar-width"),
    "100%"
  );
  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'].ad-xconfig-option-item--color-preview"
    ).length,
    0
  );
  assert.ok(previewCss.includes(
    ".ad-xconfig-option-item--x01-remaining-score-bar-preview{overflow:hidden}"
  ));
  const checkoutZonePreviewBar = documentRef.querySelector(
    "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'][data-setting-value='checkout-zone-blue'] [data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
  );
  assert.ok(checkoutZonePreviewBar);
  assert.equal(
    checkoutZonePreviewBar.getAttribute("data-ad-ext-x01-remaining-score-bar-color-theme"),
    "checkout-zone-blue"
  );
  assert.equal(
    checkoutZonePreviewBar.style.getPropertyValue(
      "--ad-ext-x01-remaining-score-bar-checkout-threshold-position-active"
    ),
    "33.93%"
  );
  assert.equal(
    checkoutZonePreviewBar.style.getPropertyValue(
      "--ad-ext-x01-remaining-score-bar-fill-overlay-width-active"
    ),
    "33.93%"
  );

  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='x01-remaining-score-bar'][data-setting-key='barSize'] .ad-xconfig-x01-remaining-score-bar-option-preview"
    ).length,
    4
  );
  assert.equal(
    documentRef.querySelectorAll(
      "[data-feature-key='x01-remaining-score-bar'][data-setting-key='effect'] .ad-xconfig-x01-remaining-score-bar-option-preview"
    ).length,
    6
  );

  clickSelectSettingOption(documentRef, "x01-remaining-score-bar", "colorTheme", "checkout-zone-blue");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.x01RemainingScoreBar.colorTheme === "checkout-zone-blue"
  );

  assert.equal(
    await waitFor(() =>
      documentRef.querySelectorAll(
        "[data-feature-key='x01-remaining-score-bar'][data-setting-key='colorTheme'] [data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
      ).length === 13
    ),
    true
  );

  assert.equal(
    await waitFor(() => {
      const refreshedPreviewBar = documentRef.querySelector(
        "[data-adxconfig-x01-remaining-score-bar-preview='true'] [data-adxconfig-x01-remaining-score-bar-preview-bar='true']"
      );
      return (
        refreshedPreviewBar?.getAttribute("data-ad-ext-x01-remaining-score-bar-color-theme") ===
          "checkout-zone-blue" &&
        refreshedPreviewBar?.style.getPropertyValue(
          "--ad-ext-x01-remaining-score-bar-checkout-threshold-position-active"
        ) === "33.93%"
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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-target-highlights']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-target-highlights-preview='true']"
  );
  assert.ok(previewSection);
  const modalBody = documentRef.querySelector(".ad-xconfig-modal-body");
  assert.ok(modalBody);
  const wholeBoards = documentRef.querySelectorAll(
    ".ad-xconfig-checkout-board-preview-board"
  );
  assert.equal(wholeBoards.length, 4);
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
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-target-highlights'][data-setting-key='targetSelectionMode'][data-setting-value='finish']"
  );
  assert.ok(finishOption);
  const finishTarget = finishOption.querySelector(".ad-ext-checkout-target");
  assert.ok(finishTarget);
  assert.equal(finishTarget.getAttribute("data-target-ring"), "D");
  assert.equal(finishTarget.getAttribute("data-target-value"), "20");

  const colorOptions = Array.from(documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-target-highlights'][data-setting-key='colorTheme']"
  ));
  assert.deepEqual(
    colorOptions.map((optionNode) => String(optionNode.getAttribute("data-preview-color-theme") || "")),
    [
      "checkout-board-violet",
      "checkout-board-cyan",
      "checkout-board-amber",
      "checkout-board-lime",
      "checkout-board-rose",
      "checkout-board-white",
    ]
  );
  colorOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--color-preview"), true);
    assert.equal(optionNode.querySelector(".ad-xconfig-checkout-board-preview-board"), null);
  });
  const colorOptionCopy = (value) => String(
    colorOptions
      .find((optionNode) => optionNode.getAttribute("data-setting-value") === value)
      ?.querySelector(".ad-xconfig-option-copy")
      ?.textContent || ""
  );
  assert.match(
    colorOptionCopy("lime"),
    /Färbt Ziele in klarem Signal-Lime\./
  );
  assert.match(
    colorOptionCopy("rose"),
    /Färbt Ziele in kräftigem Rose\./
  );
  assert.match(
    colorOptionCopy("white"),
    /Färbt Ziele in hellem Signalweiß\./
  );

  clickSelectSettingOption(documentRef, "checkout-target-highlights", "colorTheme", "cyan");
  const cyanPreviewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-target-highlights-preview='true']"
  );
  assert.notEqual(cyanPreviewSection, previewSection);
  assert.equal(documentRef.querySelector(".ad-xconfig-modal-body"), modalBody);
  assert.match(
    String(
      cyanPreviewSection
        ?.querySelector(".ad-ext-checkout-target")
        ?.style.getPropertyValue("--ad-ext-target-color") || ""
    ),
    /56,\s*189,\s*248/
  );
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutTargetHighlights.colorTheme === "cyan"
  );
  assert.equal(
    await waitFor(() => {
      const refreshedTarget = documentRef.querySelector(
        "[data-adxconfig-checkout-target-highlights-preview='true'] .ad-ext-checkout-target"
      );
      return /56,\s*189,\s*248/.test(
        String(refreshedTarget?.style.getPropertyValue("--ad-ext-target-color") || "")
      );
    }),
    true
  );

  clickSelectSettingOption(documentRef, "checkout-target-highlights", "colorTheme", "lime");
  const limePreviewSection = documentRef.querySelector(
    "[data-adxconfig-checkout-target-highlights-preview='true']"
  );
  assert.notEqual(limePreviewSection, cyanPreviewSection);
  assert.equal(documentRef.querySelector(".ad-xconfig-modal-body"), modalBody);
  assert.match(
    String(
      limePreviewSection
        ?.querySelector(".ad-ext-checkout-target")
        ?.style.getPropertyValue("--ad-ext-target-color") || ""
    ),
    /132,\s*204,\s*22/
  );
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutTargetHighlights.colorTheme === "lime"
  );
  assert.equal(
    await waitFor(() => {
      const refreshedTarget = documentRef.querySelector(
        "[data-adxconfig-checkout-target-highlights-preview='true'] .ad-ext-checkout-target"
      );
      return /132,\s*204,\s*22/.test(
        String(refreshedTarget?.style.getPropertyValue("--ad-ext-target-color") || "")
      );
    }),
    true
  );

  clickSelectSettingOption(documentRef, "checkout-target-highlights", "colorTheme", "violet");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutTargetHighlights.colorTheme === "violet"
  );
  assert.equal(
    await waitFor(() => {
      const refreshedTarget = documentRef.querySelector(
        "[data-adxconfig-checkout-target-highlights-preview='true'] .ad-ext-checkout-target"
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

  const openBoardTargetSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-target-highlights']"
  );
  assert.ok(openBoardTargetSettings);
  openBoardTargetSettings.click();
  await waitForSettingsModal(documentRef);

  clickSelectSettingOption(documentRef, "checkout-target-highlights", "visualPreset", "fast-blink");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.checkoutTargetHighlights.visualPreset === "fast-blink"
  );

  clickSelectSettingOption(documentRef, "checkout-target-highlights", "segmentStyle", "surface-only");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.checkoutTargetHighlights.visualPreset === "fast-blink" &&
      config.features.checkoutTargetHighlights.segmentStyle === "surface-only"
  );

  clickSelectSettingOption(documentRef, "checkout-target-highlights", "targetSelectionMode", "all");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.checkoutTargetHighlights.visualPreset === "fast-blink" &&
      config.features.checkoutTargetHighlights.segmentStyle === "surface-only" &&
      config.features.checkoutTargetHighlights.targetSelectionMode === "all"
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutTargetHighlights.visualPreset, "fast-blink");
  assert.equal(storedConfig.features.checkoutTargetHighlights.segmentStyle, "surface-only");
  assert.equal(storedConfig.features.checkoutTargetHighlights.targetSelectionMode, "all");

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
  const exportButton = documentRef.querySelector("[data-adxconfig-action='open-settings-export']");
  const importButton = documentRef.querySelector("[data-adxconfig-action='open-settings-import']");
  const backButton = documentRef.querySelector("[data-adxconfig-action='close']");
  const header = documentRef.querySelector(".ad-xconfig-header");
  const updatePanel = documentRef.querySelector("[data-adxconfig-update-panel='true']");

  assert.ok(resetButton);
  assert.ok(recommendedButton);
  assert.ok(exportButton);
  assert.ok(importButton);
  assert.ok(backButton);
  assert.ok(updatePanel);
  [resetButton, recommendedButton, exportButton, importButton, backButton, updatePanel].forEach((node) => {
    assert.equal(header?.contains(node), true);
  });
  assert.match(
    String(updatePanel.querySelector(".ad-xconfig-update-title")?.textContent || ""),
    /Version \d+\.\d+\.\d+/
  );
  assert.ok(updatePanel.querySelector("[data-adxconfig-action='open-changelog']"));
  assert.equal(resetButton.classList.contains("ad-xconfig-btn--danger"), true);
  assert.equal(recommendedButton.classList.contains("ad-xconfig-btn--primary"), true);
  assert.equal(
    Boolean(documentRef.querySelector("[data-adxconfig-action='enable-all-themes']")),
    false
  );

  runtime.stop();
});

test("xConfig shell previews partial settings imports and applies the selected mode", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  try {
    await waitForMenuButton(documentRef);
    documentRef.getElementById("ad-xconfig-menu-item").click();
    await waitForShellOpen(windowRef, documentRef);

    clickHeaderAction(documentRef, "open-settings-export");
    await waitFor(() => Boolean(documentRef.querySelector("[data-adxconfig-transfer-dialog='export']")));
    assert.ok(documentRef.querySelector("[data-adxconfig-transfer-include-assets='true']"));
    clickHeaderAction(documentRef, "close-settings-transfer");
    await waitFor(() => !documentRef.querySelector("[data-adxconfig-transfer-dialog]"));

    const exported = await runtime.createSettingsExport({ includeAssets: false });
    exported.payload.features.tvBoardZoom.enabled = true;
    exported.payload.features.tvBoardZoom.settings.zoomLevel = 3.15;
    exported.payload.features.tvBoardZoom.settings.zoomSpeed = "warp";

    clickHeaderAction(documentRef, "open-settings-import");
    const fileInput = documentRef.body.children.find((node) => node.tagName === "INPUT");
    assert.ok(fileInput);
    fileInput.files = [{
      name: "teilimport.json",
      size: 2048,
      text: async () => JSON.stringify(exported.payload),
    }];
    fileInput.onchange();

    await waitFor(() => {
      const dialog = documentRef.querySelector("[data-adxconfig-transfer-dialog='import']");
      const confirm = documentRef.querySelector("[data-adxconfig-action='confirm-settings-import']");
      return Boolean(dialog && confirm && !confirm.disabled);
    }, { timeoutMs: 1000, intervalMs: 8 });

    const stats = documentRef.querySelectorAll(".ad-xconfig-transfer-stat");
    assert.ok(stats.some((node) => String(node.textContent).includes("Ausgelassen: 1")));
    assert.ok(documentRef.querySelector(".ad-xconfig-transfer-issue--skipped"));

    const replaceButton = documentRef.querySelector(
      "[data-adxconfig-action='set-settings-import-mode'][data-import-mode='replace']"
    );
    replaceButton.click();
    await waitFor(() => {
      const active = documentRef.querySelector(
        "[data-adxconfig-action='set-settings-import-mode'][data-import-mode='replace']"
      );
      return active?.getAttribute("data-active") === "true";
    });

    clickHeaderAction(documentRef, "confirm-settings-import");
    await waitFor(() => Boolean(documentRef.querySelector("[data-adxconfig-transfer-dialog='result']")), {
      timeoutMs: 1000,
      intervalMs: 8,
    });
    const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
    assert.equal(storedConfig.featureToggles.tvBoardZoom, true);
    assert.equal(storedConfig.features.tvBoardZoom.zoomLevel, 3.15);
    assert.equal(storedConfig.features.tvBoardZoom.zoomSpeed, "mittel");
  } finally {
    runtime.stop();
  }
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

    await runtime.setFeatureEnabled("theme-global-background", true);
    await runtime.setThemeBackgroundImage(
      "globalBackground",
      "data:image/png;base64,ZmFrZS1oZWFkZXI="
    );
    await runtime.saveConfig({
      features: {
        checkoutScoreHighlight: {
          effect: "fade-blink",
        },
        checkoutSuggestionStyles: {
          style: "badge",
        },
      },
    });

    clickHeaderAction(documentRef, "reset");
    await assert.equal(
      await waitFor(() =>
        confirmMessages.some((message) =>
          message.includes("Hard Reset") && message.includes("Dart-Upload")
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
        config.features.checkoutScoreHighlight.effect === "grow-only" &&
        config.features.themes.globalBackground.backgroundImageDataUrl === "" &&
        config.features.turnDartDisplay.turnDartImageDataUrl === ""
      );
    }, { timeoutMs: 2000, intervalMs: 8 });

    await waitFor(() => {
      const noticeText = String(documentRef.querySelector(".ad-xconfig-notice")?.textContent || "");
      return noticeText.includes("Hard Reset ausgeführt.");
    });

    await runtime.setThemeBackgroundImage(
      "globalBackground",
      "data:image/png;base64,cmVwbGF5LWhlYWRlcg=="
    );
    await runtime.saveConfig({
      features: {
        checkoutScoreHighlight: {
          effect: "fade-blink",
        },
        checkoutSuggestionStyles: {
          style: "badge",
        },
      },
    });

    clickHeaderAction(documentRef, "apply-recommended-defaults");
    await assert.equal(
      await waitFor(() =>
        confirmMessages.some((message) =>
          message.includes("empfohlenen Standards") && message.includes("Dart-Upload")
        ),
        { timeoutMs: 120, intervalMs: 4 }
      ),
      true
    );
    await waitForStoredConfig(localStorage, (config) => {
      const expectedRecommendedState = runtime.listFeatures().every((feature) => {
        const toggleValue = config.featureToggles[feature.configKey];
        const featureConfig = getFeatureConfigValue(config, feature.configKey);
        return toggleValue === false && featureConfig?.enabled === false;
      });

      return (
        expectedRecommendedState &&
        config.features.checkoutTargetHighlights.visualPreset === "fast-blink" &&
        config.features.checkoutTargetHighlights.colorTheme === "violet" &&
        config.features.checkoutSuggestionStyles.style === "stripe" &&
        config.features.checkoutSuggestionStyles.labelText === "CHECKOUT" &&
        config.features.specialHitHighlights.animationStyle === "electric-jolt" &&
        config.features.cricketTargetHighlighter.irrelevantBoardDimStyle === "hatch" &&
        config.features.cricketGridStatusEffects.intensity === "normal" &&
        config.features.cricketGridStatusEffects.colorTheme === "high-contrast" &&
        config.features.cricketGridStatusEffects.pressureOverlay === true &&
        config.features.dartboardMarkerHighlight.effect === "size-pulse" &&
        config.features.dartMarkerReplacer.hideOriginalMarkers === true &&
        config.features.dartMarkerReplacer.design === "germangiant" &&
        config.features.dartMarkerReplacer.enableShadowBlur === true &&
        config.features.dartMarkerReplacer.enableWobble === true &&
        config.features.dartMarkerReplacer.enableFlightBlur === true &&
        config.features.takeOutDartsAlert.imageSize === "large" &&
        config.features.singleBullHitSound.volume === 0.9 &&
        config.features.x01RemainingScoreBar.barSize === "breit" &&
        config.features.x01RemainingScoreBar.effect === "previous-score-trail" &&
        config.features.themes.globalBackground.backgroundImageDataUrl ===
          "data:image/png;base64,cmVwbGF5LWhlYWRlcg=="
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
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-background']"
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
    noteTexts.includes("Legt fest, wie ein eigenes Hintergrundbild im Spielbereich platziert wird."),
    "missing select explanation note"
  );
  assert.ok(
    noteTexts.includes(
      "Speichert ein globales Hintergrundbild bis 1,5 MiB."
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
  assert.ok(displayModeInputWrap.closest(".ad-xconfig-setting-row").querySelector(".ad-xconfig-setting-copy .ad-xconfig-note"));
  assert.equal(displayModeInputWrap.children[0].classList.contains("ad-xconfig-option-list"), true);

  clickSelectSettingOption(documentRef, "theme-global-background", "backgroundDisplayMode", "tile");
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalBackground.backgroundDisplayMode === "tile"
  );

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
    documentRef.querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='debug']").length,
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
  const originalSetInterval = windowRef.setInterval.bind(windowRef);
  const originalClearInterval = windowRef.clearInterval.bind(windowRef);
  let hitPreviewIntervalCallback = null;
  windowRef.setInterval = (callback, ms, ...args) => {
    if (Number(ms) === 1800) {
      hitPreviewIntervalCallback = () => callback(...args);
      return 18_001;
    }
    return originalSetInterval(callback, ms, ...args);
  };
  windowRef.clearInterval = (handle) => {
    if (Number(handle) === 18_001) {
      hitPreviewIntervalCallback = null;
      return;
    }
    originalClearInterval(handle);
  };
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='special-hit-highlights']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const previewSection = documentRef.querySelector(
    "[data-adxconfig-special-hit-highlights-preview='true']"
  );
  const previewRow = previewSection?.querySelector(
    "[data-adxconfig-special-hit-highlights-preview-row='true']"
  );
  const previewSegment = previewSection?.querySelector(
    "[data-adxconfig-special-hit-highlights-preview-segment='true']"
  );
  assert.ok(previewSection);
  assert.ok(previewRow);
  assert.ok(previewSegment);
  assert.equal(previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-score"), "60");
  assert.equal(previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-step"), "T20");
  assert.equal(previewSegment.textContent, "T20");
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight"), true);
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight--modern"), true);
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight--triple"), true);
  assert.equal(typeof hitPreviewIntervalCallback, "function");

  hitPreviewIntervalCallback();
  assert.equal(previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-score"), "38");
  assert.equal(previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-step"), "D19");
  assert.equal(previewSegment.textContent, "D19");
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight--double"), true);

  hitPreviewIntervalCallback();
  assert.equal(previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-score"), "50");
  assert.equal(previewSegment.textContent, "BULL");
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight--bull-inner"), true);

  hitPreviewIntervalCallback();
  assert.equal(previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-score"), "25");
  assert.equal(previewSegment.textContent, "25");
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight--bull-outer"), true);

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
    "pop-hit",
    "side-shake",
    "glow-pop",
    "flip-spin",
    "light-sweep",
    "shockwave-ring",
    "electric-jolt",
  ]);
  animationOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--effect-preview"), true);
  });

  clickSelectSettingOption(documentRef, "special-hit-highlights", "colorTheme", "ice-circuit");
  assert.equal(
    previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-color-theme"),
    "ice-circuit"
  );
  assert.equal(previewRow.classList.contains("ad-ext-hit-theme--ice-circuit"), true);

  clickSelectSettingOption(documentRef, "special-hit-highlights", "animationStyle", "side-shake");
  assert.equal(
    previewRow.getAttribute("data-adxconfig-special-hit-highlights-preview-animation-style"),
    "side-shake"
  );
  assert.equal(previewRow.classList.contains("ad-ext-hit-animation--side-shake"), true);

  documentRef.querySelector("[data-adxconfig-action='close-settings']").click();
  assert.equal(
    await waitFor(() => documentRef.querySelector("[data-adxconfig-modal='true']") === null),
    true
  );
  assert.equal(hitPreviewIntervalCallback, null);
  assert.equal(previewRow.classList.contains("ad-ext-hit-highlight"), false);

  runtime.stop();
  assert.equal(documentRef.getElementById("ad-xconfig-special-hit-highlights-preview-style"), null);
});

test("xConfig avg-trend-arrow settings expose real arrow preview hosts", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='avg-trend-arrow']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const durationPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='durationMs']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(durationPreviewEffects, [
    "avg-trend-arrow-duration-220",
    "avg-trend-arrow-duration-320",
    "avg-trend-arrow-duration-500",
  ]);

  const sizePreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='size']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(sizePreviewEffects, [
    "avg-trend-arrow-size-klein",
    "avg-trend-arrow-size-standard",
    "avg-trend-arrow-size-gross",
  ]);

  documentRef.querySelectorAll("[data-preview-effect^='avg-trend-arrow-']").forEach((optionNode) => {
    assert.equal(
      optionNode.classList.contains("ad-xconfig-option-item--avg-trend-arrow-preview"),
      true
    );
    const previewNode = optionNode.querySelector("[data-adxconfig-avg-trend-preview-host='true']");
    const arrowNode = optionNode.querySelector("[data-adxconfig-avg-trend-preview='true']");
    assert.ok(previewNode);
    assert.ok(arrowNode);
    assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-arrow"), true);
    assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-visible"), true);
    assert.equal(arrowNode.classList.contains("ad-ext-avg-trend-up"), true);
    assert.match(arrowNode.style.getPropertyValue(AVG_TREND_ARROW_HALF_WIDTH_VAR), /em$/);
    assert.match(arrowNode.style.getPropertyValue(AVG_TREND_ARROW_HEIGHT_VAR), /em$/);
    assert.equal(
      Array.from(optionNode.querySelector(".ad-xconfig-option-layout--avg-trend-arrow").children)
        .indexOf(previewNode) <
        Array.from(optionNode.querySelector(".ad-xconfig-option-layout--avg-trend-arrow").children)
          .findIndex((node) => node.getAttribute?.("data-option-active-slot") === "true"),
      true
    );
  });

  runtime.stop();
});

test("xConfig dartboard-marker-highlight settings expose real marker preview hosts", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='dartboard-marker-highlight']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const sizePreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='size']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(sizePreviewEffects, [
    "dartboard-marker-highlight-size-4",
    "dartboard-marker-highlight-size-6",
    "dartboard-marker-highlight-size-9",
  ]);

  const effectPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='effect']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(effectPreviewEffects, [
    "dartboard-marker-highlight-effect-soft-glow",
    "dartboard-marker-highlight-effect-size-pulse",
    "dartboard-marker-highlight-effect-none",
  ]);

  const visibilityPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='opacityPercent']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(visibilityPreviewEffects, [
    "dartboard-marker-highlight-opacityPercent-65",
    "dartboard-marker-highlight-opacityPercent-85",
    "dartboard-marker-highlight-opacityPercent-100",
  ]);

  const previewOptions = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true']")
    .filter((optionNode) =>
      String(optionNode.getAttribute("data-preview-effect") || "")
        .startsWith("dartboard-marker-highlight-")
    );
  assert.equal(previewOptions.length, 9);
  previewOptions.forEach((optionNode) => {
    assert.equal(
      optionNode.classList.contains("ad-xconfig-option-item--dartboard-marker-highlight-preview"),
      true
    );
    const previewNode = optionNode.querySelector(
      `[${DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_ATTRIBUTE}='true']`
    );
    const marker = optionNode.querySelector(
      `[${DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE}='true']`
    );
    assert.ok(previewNode);
    assert.ok(marker);
    assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS), true);
    assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["soft-glow"]), false);
    assert.equal(marker.classList.contains(DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]), false);
    assert.equal(
      Array.from(optionNode.querySelector(".ad-xconfig-option-layout--dartboard-marker-highlight").children)
        .indexOf(previewNode) <
        Array.from(optionNode.querySelector(".ad-xconfig-option-layout--dartboard-marker-highlight").children)
          .findIndex((node) => node.getAttribute?.("data-option-active-slot") === "true"),
      true
    );
  });

  const markerByEffect = (previewEffect) =>
    documentRef
      .querySelector(`[data-preview-effect='${previewEffect}']`)
      ?.querySelector(`[${DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE}='true']`);
  assert.equal(markerByEffect("dartboard-marker-highlight-size-4")?.getAttribute("r"), "4");
  assert.equal(markerByEffect("dartboard-marker-highlight-size-9")?.getAttribute("r"), "9");
  assert.equal(markerByEffect("dartboard-marker-highlight-opacityPercent-65")?.style.opacity, "0.65");
  assert.equal(markerByEffect("dartboard-marker-highlight-opacityPercent-100")?.style.opacity, "1");

  runtime.stop();
});

test("xConfig turn-score-counter settings expose real effect preview hosts", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='turn-score-counter']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const countEffectPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='countEffect']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(countEffectPreviewEffects, [
    "turn-score-counter-smooth-count",
    "turn-score-counter-rolling-digits",
    "turn-score-counter-step-count",
  ]);

  const speedPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='durationMs']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(speedPreviewEffects, [
    "turn-score-counter-fast",
    "turn-score-counter-standard-speed",
    "turn-score-counter-slow",
  ]);

  const flashPreviewEffects = documentRef
    .querySelectorAll("[data-adxconfig-option-note='true'][data-setting-key='flashMode']")
    .map((optionNode) => String(optionNode.getAttribute("data-preview-effect") || ""));
  assert.deepEqual(flashPreviewEffects, [
    "turn-score-counter-flash-change",
    "turn-score-counter-flash-permanent",
  ]);

  documentRef.querySelectorAll("[data-preview-effect^='turn-score-counter-']").forEach((optionNode) => {
    assert.equal(
      optionNode.classList.contains("ad-xconfig-option-item--turn-score-counter-preview"),
      true
    );
    const previewNode = optionNode.querySelector("[data-adxconfig-turn-score-preview='true']");
    const scoreNode = optionNode.querySelector("[data-adxconfig-turn-score-preview-score='true']");
    assert.ok(previewNode);
    assert.ok(scoreNode);
    assert.equal(scoreNode.textContent, "501");
    assert.equal(scoreNode.classList.contains("ad-ext-turn-points"), false);
    assert.equal(scoreNode.classList.contains("ad-xconfig-turn-score-preview-score"), true);
    assert.equal(
      Array.from(optionNode.querySelector(".ad-xconfig-option-layout--turn-score-counter").children)
        .indexOf(previewNode) <
        Array.from(optionNode.querySelector(".ad-xconfig-option-layout--turn-score-counter").children)
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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-remaining-score-bar']"
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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='turn-score-counter']"
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
    noteTexts.some((text) => /Aufblitzen/.test(text)),
    "missing turn-points flash setting note"
  );
  assert.ok(
    noteTexts.some((text) => /Anzeigetafel|Geschwindigkeit/.test(text)),
    "missing turn-points speed setting note"
  );
  assert.ok(
    noteTexts.some((text) => /Zahl sichtbar zum neuen Wert/.test(text)),
    "missing turn-points count style setting note"
  );

  clickSelectSettingOption(documentRef, "turn-score-counter", "durationMs", 5000);
  await waitForStoredConfig(localStorage, (config) => config.features.turnScoreCounter.durationMs === 5000);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnScoreCounter.durationMs, 5000);

  clickSelectSettingOption(documentRef, "turn-score-counter", "countEffect", "rolling-digits");
  await waitForStoredConfig(localStorage, (config) => config.features.turnScoreCounter.countEffect === "rolling-digits");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnScoreCounter.countEffect, "rolling-digits");

  clickSettingToggle(documentRef, "turn-score-counter", "flashOnChange", false);
  await waitForStoredConfig(localStorage, (config) => config.features.turnScoreCounter.flashOnChange === false);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnScoreCounter.flashOnChange, false);

  clickSelectSettingOption(documentRef, "turn-score-counter", "flashMode", "permanent");
  await waitForStoredConfig(localStorage, (config) => config.features.turnScoreCounter.flashMode === "permanent");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnScoreCounter.flashMode, "permanent");

  clickSettingToggle(documentRef, "turn-score-counter", "flashOnChange", true);
  await waitForStoredConfig(localStorage, (config) => config.features.turnScoreCounter.flashOnChange === true);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnScoreCounter.flashOnChange, true);

  clickSelectSettingOption(documentRef, "turn-score-counter", "flashMode", "on-change");
  await waitForStoredConfig(localStorage, (config) => config.features.turnScoreCounter.flashMode === "on-change");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnScoreCounter.flashMode, "on-change");

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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='dart-marker-replacer']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const designOptions = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-replacer'][data-setting-key='design']"
  );
  assert.equal(designOptions.length, DART_DESIGN_KEYS.length);
  assert.deepEqual(
    designOptions.map((optionNode) => optionNode.getAttribute("data-setting-value")),
    DART_DESIGN_KEYS
  );

  const sizeOptions = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-replacer'][data-setting-key='sizePercent']"
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
      "[data-adxconfig-action-preview-target='dart-marker-replacer']"
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

  clickSelectSettingOption(documentRef, "dart-marker-replacer", "design", "red");
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerReplacer.design === "red");
  clickSettingToggle(documentRef, "dart-marker-replacer", "enableShadow", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerReplacer.enableShadow === false);
  clickSettingToggle(documentRef, "dart-marker-replacer", "enableShadowBlur", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerReplacer.enableShadowBlur === false);
  clickSettingToggle(documentRef, "dart-marker-replacer", "enableWobble", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerReplacer.enableWobble === false);
  clickSettingToggle(documentRef, "dart-marker-replacer", "enableFlightBlur", false);
  await waitForStoredConfig(localStorage, (config) => config.features.dartMarkerReplacer.enableFlightBlur === false);

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.dartMarkerReplacer.design, "red");
  assert.equal(storedConfig.features.dartMarkerReplacer.enableShadow, false);
  assert.equal(storedConfig.features.dartMarkerReplacer.enableShadowBlur, false);
  assert.equal(storedConfig.features.dartMarkerReplacer.enableWobble, false);
  assert.equal(storedConfig.features.dartMarkerReplacer.enableFlightBlur, false);

  const activeAfter = designOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(activeAfter.length, 1);
  assert.equal(activeAfter[0].getAttribute("data-setting-value"), "red");

  const redOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-replacer'][data-setting-key='design'][data-setting-value='red']"
  );
  assert.ok(redOption);
  assert.ok(redOption.querySelector("[data-option-active-slot='true'] .ad-xconfig-option-active"));

  const autodartsOption = documentRef.querySelector(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-replacer'][data-setting-key='design'][data-setting-value='autodarts']"
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

test("xConfig shell renders a compact searchable global font picker and loads the selected card preview font", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const themeCards = documentRef.querySelectorAll(".ad-xconfig-card");
  assert.ok(themeCards.length > 0);
  assert.equal(themeCards[0]?.getAttribute("data-feature-key"), "theme-global-presets");
  assert.equal(themeCards[1]?.getAttribute("data-feature-key"), "theme-global-background");
  assert.equal(themeCards[2]?.getAttribute("data-feature-key"), "theme-global-typography");
  const initialPreviewStyleNode = documentRef.getElementById("ad-xconfig-preview-fonts-style");
  assert.ok(initialPreviewStyleNode);
  assert.match(String(initialPreviewStyleNode.textContent || ""), /family=Aldrich/);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-typography']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  const sectionTitles = documentRef
    .querySelectorAll(".ad-xconfig-settings-section-title")
    .map((node) => String(node.textContent || "").trim());
  assert.deepEqual(sectionTitles, ["Schrift", "Farben"]);

  const previewStyleNode = documentRef.getElementById("ad-xconfig-preview-fonts-style");
  assert.ok(previewStyleNode);
  assert.equal(String(previewStyleNode.textContent || "").match(/@import\s+url/g)?.length, 1);
  assert.match(String(previewStyleNode.textContent || ""), /family=Aldrich/);

  const fontOptionButtons = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='fontPreset']"
  );
  assert.equal(fontOptionButtons.length, THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.length);
  const fontPicker = documentRef.querySelector("[data-adxconfig-font-picker='true']");
  assert.ok(fontPicker);
  assert.equal(fontPicker.getAttribute("open"), null);
  const initialFontOption = fontOptionButtons.find(
    (button) => button.getAttribute("data-active") === "true"
  );
  assert.ok(initialFontOption);
  assert.equal(
    String(
      fontPicker.querySelector("[data-adxconfig-font-picker-current-name='true']")?.textContent || ""
    ).trim(),
    String(initialFontOption.querySelector(".ad-xconfig-option-label")?.textContent || "").trim()
  );
  assert.deepEqual(
    fontPicker
      .querySelector("[data-adxconfig-font-picker-current-preview='true']")
      ?.children.map((node) => String(node.textContent || "")),
    ["THOMAS", "501", "T20"]
  );
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
    const optionSamples = optionButton.querySelectorAll(".ad-xconfig-font-option-sample");
    assert.equal(optionLabels.length, 1, `unexpected preview layout for ${preset.value}`);
    assert.equal(optionSamples.length, 1, `missing score preview for ${preset.value}`);
    assert.equal(String(optionLabels[0].textContent || "").trim(), preset.label);
    assert.equal(String(optionSamples[0].textContent || "").trim(), "501");

    if (preset.value === "system") {
      assert.equal(optionButton.getAttribute("data-adxconfig-preview-font"), null);
      assert.equal(optionLabels[0].getAttribute("data-adxconfig-preview-font"), null);
      assert.equal(optionSamples[0].getAttribute("data-adxconfig-preview-font"), null);
      return;
    }

    assert.equal(optionButton.getAttribute("data-adxconfig-preview-font"), preset.value);
    assert.equal(optionLabels[0].getAttribute("data-adxconfig-preview-font"), preset.value);
    assert.equal(optionSamples[0].getAttribute("data-adxconfig-preview-font"), preset.value);
    assert.match(String(optionLabels[0].style.fontFamily || ""), new RegExp(preset.familyName));
    assert.match(String(optionSamples[0].style.fontFamily || ""), new RegExp(preset.familyName));
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
    String(shellStyleNode.textContent || "").includes(
      "grid-template-columns:repeat(2,minmax(0,1fr));max-height:min(28rem,55vh)"
    ),
    true
  );
  assert.equal(
    String(shellStyleNode.textContent || "").includes("min-height:3.35rem;padding:.55rem .7rem"),
    true
  );
  assert.equal(
    String(shellStyleNode.textContent || "").includes(
      ".ad-xconfig-turn-dart-asset-option-list .ad-xconfig-option-layout--dart-design{grid-template-columns:minmax(0,1fr) minmax(0,120px) auto}"
    ),
    true
  );
  assert.equal(
    String(shellStyleNode.textContent || "").includes(
      ".ad-xconfig-turn-dart-asset-option-list .ad-xconfig-option-preview{width:120px;max-width:100%;height:40px;object-fit:contain;object-position:right center"
    ),
    true
  );
  assert.equal(
    String(shellStyleNode.textContent || "").includes(
      ".ad-xconfig-turn-dart-image-preview{width:120px;max-width:100%;height:40px;object-fit:contain;object-position:right center"
    ),
    true
  );

  const fontSearch = fontPicker.querySelector("[data-adxconfig-font-search='true']");
  const emptyFontSearch = fontPicker.querySelector(".ad-xconfig-font-picker-empty");
  const audiowideOption = fontOptionButtons.find(
    (button) => button.getAttribute("data-setting-value") === "audiowide"
  );
  const aldrichOption = fontOptionButtons.find(
    (button) => button.getAttribute("data-setting-value") === "aldrich"
  );
  assert.ok(fontSearch);
  assert.ok(emptyFontSearch);
  assert.ok(audiowideOption);
  assert.ok(aldrichOption);

  fontSearch.value = "audio";
  fontSearch.dispatchEvent(new FakeEvent("input", { bubbles: true, target: fontSearch }));
  assert.equal(aldrichOption.getAttribute("hidden"), "");
  assert.equal(audiowideOption.getAttribute("hidden"), null);
  assert.equal(emptyFontSearch.getAttribute("hidden"), "");
  assert.equal(String(previewStyleNode.textContent || "").match(/@import\s+url/g)?.length, 1);

  fontSearch.value = "nicht vorhanden";
  fontSearch.dispatchEvent(new FakeEvent("input", { bubbles: true, target: fontSearch }));
  assert.equal(fontOptionButtons.every((button) => button.getAttribute("hidden") === ""), true);
  assert.equal(emptyFontSearch.getAttribute("hidden"), null);

  fontSearch.value = "";
  fontSearch.dispatchEvent(new FakeEvent("input", { bubbles: true, target: fontSearch }));
  assert.equal(fontOptionButtons.every((button) => button.getAttribute("hidden") === null), true);
  documentRef.dispatchEvent(new FakeEvent("pointerover", {
    bubbles: true,
    target: audiowideOption,
  }));
  assert.equal(String(previewStyleNode.textContent || "").match(/@import\s+url/g)?.length, 2);
  assert.match(String(previewStyleNode.textContent || ""), /family=Audiowide/);
  documentRef.dispatchEvent(new FakeEvent("pointerover", {
    bubbles: true,
    target: audiowideOption,
  }));
  assert.equal(String(previewStyleNode.textContent || "").match(/@import\s+url/g)?.length, 2);
  documentRef.dispatchEvent(new FakeEvent("focusin", {
    bubbles: true,
    target: aldrichOption,
  }));
  assert.equal(String(previewStyleNode.textContent || "").match(/@import\s+url/g)?.length, 2);
  assert.match(String(previewStyleNode.textContent || ""), /family=Aldrich/);
  fontPicker.open = true;
  fontPicker.setAttribute("open", "");
  audiowideOption.click();
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.fontPreset === "audiowide"
  );
  assert.equal(fontPicker.getAttribute("open"), null);
  assert.equal(
    String(
      fontPicker.querySelector("[data-adxconfig-font-picker-current-name='true']")?.textContent || ""
    ).trim(),
    "Audiowide"
  );
  assert.equal(
    fontPicker
      .querySelector("[data-adxconfig-font-picker-current-preview='true']")
      ?.getAttribute("data-adxconfig-preview-font"),
    "audiowide"
  );

  const scopeOptionButtons = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='applyTo']"
  );
  assert.equal(scopeOptionButtons.length, 3);
  assert.equal(
    scopeOptionButtons.filter((node) => node.getAttribute("data-active") === "true").length,
    3
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
      !config.features.themes.globalTypography.applyTo.includes("throws") &&
      config.features.themes.globalTypography.applyTo.includes("names")
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.deepEqual(storedConfig.features.themes.globalTypography.applyTo, ["scores", "names"]);
  assert.equal(
    documentRef.querySelector(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='theme-global-typography'][data-setting-key='applyTo'][data-setting-value='throws']"
    )?.getAttribute("data-active"),
    "false"
  );

  clickSelectSettingOption(documentRef, "theme-global-typography", "applyTo", "scores");
  await waitForStoredConfig(
    localStorage,
    (config) =>
      Array.isArray(config.features?.themes?.globalTypography?.applyTo) &&
      config.features.themes.globalTypography.applyTo.length === 1 &&
      config.features.themes.globalTypography.applyTo[0] === "names"
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.deepEqual(storedConfig.features.themes.globalTypography.applyTo, ["names"]);

  const colorFields = documentRef.querySelectorAll(
    "[data-adxconfig-color-field='true'][data-feature-key='theme-global-typography']"
  );
  assert.equal(colorFields.length, 4);
  assert.deepEqual(
    colorFields.map((node) => String(node.getAttribute("data-setting-key") || "").trim()),
    [
      "accentColor",
      "scoreColor",
      "secondaryTextColor",
      "throwLabelColor",
    ]
  );
  const typographySelectFields = documentRef.querySelectorAll(
    "[data-adxconfig-setting='true'][data-feature-key='theme-global-typography'][data-setting-control='select']"
  );
  assert.equal(
    typographySelectFields.some(
      (node) => node.getAttribute("data-setting-key") === "activePlayerTintIntensity"
    ),
    true
  );

  clickSelectSettingOption(documentRef, "theme-global-typography", "activePlayerTintIntensity", 20);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features?.themes?.globalTypography?.activePlayerTintIntensity === 20
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
  assert.equal(
    storedTypographyConfig.features.themes.globalTypography.throwLabelColor,
    "#8FA9C2"
  );

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

test("xConfig shell applies global presets immediately with asset-backed preview wallpaper", async () => {
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

  await runtime.saveConfig({
    features: {
      turnDartDisplay: {
        turnDartStyle: "solid",
        turnDartColor: "#123456",
      },
    },
  });

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-presets']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(documentRef);

  assert.deepEqual(
    documentRef.querySelectorAll(".ad-xconfig-settings-section-title")
      .map((node) => String(node.textContent || "")),
    ["Empfohlen", "Atmosphäre", "Regional", "Cinematic"]
  );
  assert.equal(
    documentRef.querySelectorAll(".ad-xconfig-theme-preset-card").length,
    THEME_GLOBAL_TEMPLATE_PRESETS.length
  );
  const renderedPresetNames = documentRef.querySelectorAll(".ad-xconfig-theme-preset-name")
    .map((node) => String(node.textContent || ""));
  ["Spider-Man", "John Wick", "Avengers Endgame", "Gladiator", "Dark Side"].forEach((name) => {
    assert.ok(renderedPresetNames.includes(name), `missing unchanged preset name ${name}`);
  });

  const presetButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-presets-preset-cyberpunk"
  );
  assert.ok(presetButton);
  assert.match(
    String(presetButton.querySelector(".ad-xconfig-theme-preset-wallpaper")?.getAttribute("src") || ""),
    /theme-presets\/cyberpunk\.jpg/
  );
  const cyberpunkPreset = getThemeGlobalTemplatePreset("cyberpunk");
  assert.equal(
    presetButton.style.getPropertyValue("--ad-xconfig-theme-preset-accent"),
    cyberpunkPreset.accentColor
  );
  assert.match(
    presetButton.style.getPropertyValue("--ad-xconfig-theme-preset-font"),
    /Audiowide/
  );
  assert.deepEqual(
    presetButton
      .querySelectorAll(".ad-xconfig-theme-preset-swatch")
      .map((swatch) => swatch.style.backgroundColor),
    [
      cyberpunkPreset.accentColor,
      cyberpunkPreset.scoreColor,
      cyberpunkPreset.secondaryTextColor,
      cyberpunkPreset.throwLabelColor,
    ]
  );
  presetButton.click();

  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.featureToggles?.["themes.globalTypography"] === true &&
      config.featureToggles?.["themes.globalBackground"] === true &&
      config.features?.themes?.globalTypography?.enabled === true &&
      config.features.themes.globalTypography.fontPreset === "audiowide" &&
      config.features?.themes?.globalBackground?.enabled === true &&
      config.features.themes.globalBackground.backgroundAssetKey === "cyberpunk" &&
      config.features.themes.globalBackground.backgroundImageDataUrl === ""
  );

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.globalTypography"], true);
  assert.equal(storedConfig.featureToggles["themes.globalBackground"], true);
  assert.deepEqual(storedConfig.features.themes.globalTypography, {
    enabled: true,
    fontPreset: "audiowide",
    applyTo: ["scores", "names"],
    accentColor: "#2EF2FF",
    scoreColor: "#E8FF5A",
    secondaryTextColor: "#FFD0F5",
    throwLabelColor: "#FF5CD6",
    activePlayerTintIntensity: 15,
    debug: false,
  });
  assert.deepEqual(storedConfig.features.themes.globalBackground, {
    enabled: true,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 20,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "cyberpunk",
    debug: false,
  });
  assert.equal(storedConfig.features.turnDartDisplay.turnDartStyle, "solid");
  assert.equal(storedConfig.features.turnDartDisplay.turnDartColor, "#123456");

  assert.equal(confirmMessages.length, 0);

  const themeCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-presets']"
  );
  assert.ok(themeCard);
  assert.match(String(themeCard.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);
  assert.equal(themeCard.getAttribute("data-card-kind"), "theme-global");

  const themeGlobalSummary = themeCard.querySelector("[data-adxconfig-theme-global-summary='true']");
  assert.ok(themeGlobalSummary);
  const themeGlobalBadges = themeGlobalSummary
    .querySelectorAll(".ad-xconfig-card-global-badge")
    .map((node) => String(node.textContent || ""));
  assert.deepEqual(themeGlobalBadges, ["Global · alle Spielmodi"]);

  const themeGlobalValues = themeGlobalSummary
    .querySelectorAll(".ad-xconfig-card-global-value")
    .map((node) => String(node.textContent || ""));
  assert.deepEqual(themeGlobalValues, []);

  const themeCardCopy = themeCard.querySelector(".ad-xconfig-card-copy");
  assert.match(String(themeCardCopy?.textContent || ""), /Vorlagen/);
  assert.equal(
    themeCard.querySelector("[data-adxconfig-feature-toggle='true']"),
    null
  );

  const themeCardPreview = themeCard.querySelector(".ad-xconfig-card-bg img");
  assert.ok(themeCardPreview);
  assert.match(String(themeCardPreview.getAttribute("src") || ""), /theme-presets\/cyberpunk\.jpg/);
  assert.equal(themeCard.getAttribute("data-preview-kind"), "theme-global-presets");
  assert.match(
    String(themeCard.querySelector(".ad-xconfig-theme-card-preview-label")?.textContent || ""),
    /Aktuelle Vorlage: Cyberpunk/
  );

  const backgroundCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-background']"
  );
  assert.match(
    String(backgroundCard?.querySelector(".ad-xconfig-card-bg img")?.getAttribute("src") || ""),
    /theme-presets\/cyberpunk\.jpg/
  );
  assert.doesNotMatch(String(backgroundCard?.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);

  const typographyCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-typography']"
  );
  assert.doesNotMatch(String(typographyCard?.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);
  assert.equal(typographyCard?.getAttribute("data-preview-kind"), "theme-global-typography");
  const typographySample = typographyCard?.querySelector(".ad-xconfig-theme-card-preview-sample");
  assert.ok(typographySample);
  assert.equal(typographySample.dataset.adxconfigPreviewFont, "audiowide");
  assert.equal(
    typographySample.style.getPropertyValue("--ad-xconfig-theme-card-score"),
    cyberpunkPreset.scoreColor
  );

  await waitFor(() => documentRef.querySelector(
    ".ad-xconfig-theme-preset-card[data-theme-preset-key='cyberpunk']"
  )?.getAttribute("data-theme-preset-state") === "active");
  const activePresetButton = documentRef.querySelector(
    ".ad-xconfig-theme-preset-card[data-theme-preset-key='cyberpunk']"
  );
  assert.equal(activePresetButton?.getAttribute("aria-pressed"), "true");
  assert.equal(activePresetButton?.getAttribute("data-theme-preset-state"), "active");
  assert.equal(
    String(activePresetButton?.querySelector(".ad-xconfig-theme-preset-state")?.textContent || ""),
    "Aktiv"
  );

  const undoButton = documentRef.querySelector(
    "[data-adxconfig-action='undoThemeGlobalPreset']"
  );
  assert.ok(undoButton);
  undoButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.featureToggles?.["themes.globalTypography"] === false &&
      config.featureToggles?.["themes.globalBackground"] === false
  );

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
  const styleText = String(styleNode.textContent || "");
  assert.match(styleText, /\.ad-xconfig-card\{[^}]*min-height:224px[^}]*border-radius:12px[^}]*border:0/);
  assert.match(styleText, /\.ad-xconfig-card-bg\{[^}]*position:absolute[^}]*inset:0 0 0 33\.333%/);
  assert.match(
    styleText,
    /\.ad-xconfig-card-bg::after\{[^}]*linear-gradient\(90deg,rgba\(27,31,41,\.92\) 0%,rgba\(27,31,41,\.72\) 35%,rgba\(27,31,41,\.44\) 62%,rgba\(27,31,41,\.16\) 82%,rgba\(27,31,41,\.02\) 100%\)/
  );
  assert.match(
    styleText,
    /@media\(max-width:640px\)\{[^}]*\.ad-xconfig-card-bg::after\{background:linear-gradient\(90deg,rgba\(27,31,41,\.90\) 0%,rgba\(27,31,41,\.72\) 55%,rgba\(27,31,41,\.46\) 78%,rgba\(27,31,41,\.28\) 100%\)/
  );
  assert.match(
    styleText,
    /\.ad-xconfig-card-title,[^}]*\.ad-xconfig-card-copy,[^}]*\.ad-xconfig-switch-state\{text-shadow:0 2px 7px rgba\(0,0,0,\.88\)\}/
  );
  const presetCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-presets']"
  );
  const backgroundCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-background']"
  );
  const typographyCard = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-typography']"
  );
  assert.ok(presetCard);
  assert.match(String(presetCard.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);
  assert.doesNotMatch(String(backgroundCard?.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);
  assert.doesNotMatch(String(typographyCard?.getAttribute("class") || ""), /ad-xconfig-card--theme-global/);
  const preview = presetCard.querySelector(".ad-xconfig-card-bg");
  const content = presetCard.querySelector(".ad-xconfig-card-content");
  assert.equal(preview.parentNode, content.parentNode);
  assert.equal(content.querySelector(".ad-xconfig-card-bg"), null);
  assert.equal(presetCard.querySelectorAll("[role='switch']").length, 0);
  assert.equal(backgroundCard?.querySelectorAll("[role='switch']").length, 1);
  assert.equal(typographyCard?.querySelectorAll("[role='switch']").length, 1);
  assert.deepEqual(
    backgroundCard
      ?.querySelectorAll(".ad-xconfig-switch-option")
      .map((node) => String(node.textContent || "").trim()),
    ["Aus", "✓ Aktiv"]
  );
  const settingsIcon = backgroundCard?.querySelector(".ad-xconfig-card-settings-icon");
  assert.ok(settingsIcon);
  assert.equal(settingsIcon.getAttribute("data-adxconfig-action"), "open-settings");
  assert.equal(settingsIcon.getAttribute("title"), "Einstellungen");
  assert.ok(settingsIcon.querySelector("svg"));
  assert.deepEqual(
    backgroundCard
      ?.querySelectorAll(".ad-xconfig-variant")
      .map((node) => String(node.textContent || "")),
    []
  );
  assert.equal(
    String(backgroundCard?.querySelector(".ad-xconfig-card-global-badge")?.textContent || ""),
    "Global · alle Spielmodi"
  );
  assert.equal(
    Array.from(documentRef.querySelectorAll(".ad-xconfig-card .ad-xconfig-variant"))
      .some((node) => /Einstellung/.test(String(node.textContent || ""))),
    false
  );
  assert.match(styleText, /\.ad-xconfig-switch\{[^}]*width:114px[^}]*height:44px/);
  assert.match(styleText, /\.ad-xconfig-switch-track\{[^}]*width:48px[^}]*height:28px[^}]*border-radius:999px[^}]*background:#353b46/);
  assert.match(styleText, /\.ad-xconfig-switch-input:checked \+ \.ad-xconfig-switch-track\{[^}]*background:var\(--color-brand-blue-50,#4a89ff\)/);
  documentRef.querySelectorAll("[data-adxconfig-section='template'] .ad-xconfig-card").forEach((card) => {
    const featureKey = String(card.getAttribute("data-feature-key") || "");
    assert.ok(card.querySelector(".ad-xconfig-card-bg img"), `missing theme card image for ${featureKey}`);
    assert.ok(card.querySelector(".ad-xconfig-card-global-badge"), `missing retained theme tag for ${featureKey}`);
  });

  ["all-modes", "x01", "cricket-tactics"].flatMap((sectionId) =>
    documentRef.querySelectorAll(`[data-adxconfig-section='${sectionId}'] .ad-xconfig-card`)
  ).forEach((card) => {
    const featureKey = String(card.getAttribute("data-feature-key") || "");
    assert.ok(card.querySelector(".ad-xconfig-card-bg img"), `missing animation card image for ${featureKey}`);
    assert.ok(card.querySelector(".ad-xconfig-variant"), `missing retained animation tag for ${featureKey}`);
  });

  assert.match(styleText, /@media\(max-width:1023px\)\{[^}]*\.ad-xconfig-grid\{grid-template-columns:1fr\}/);
  assert.equal(styleText.includes("@media(max-width:640px)"), true);
  assert.equal(styleText.includes(".ad-xconfig-header{padding:12px}"), true);

  assert.equal(
    documentRef.querySelector(
      ".ad-xconfig-card[data-feature-key='avg-trend-arrow']"
    )?.getAttribute("data-preview-kind"),
    "avg-trend-arrow"
  );
  assert.equal(
    documentRef.querySelector(
      ".ad-xconfig-card[data-feature-key='checkout-target-highlights']"
    )?.getAttribute("data-preview-kind"),
    "checkout-target-highlights"
  );
  assert.equal(
    documentRef.querySelector(
      ".ad-xconfig-card[data-feature-key='take-out-darts-alert']"
    )?.getAttribute("data-preview-kind"),
    "take-out-darts-alert"
  );
  assert.equal(
    documentRef.querySelector(
      ".ad-xconfig-card[data-feature-key='turn-score-counter']"
    )?.getAttribute("data-preview-kind"),
    "turn-score-counter"
  );

  runtime.stop();
});

test("Bot Board Style card uses and updates the selected board as its background", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const previewSelector =
    ".ad-xconfig-card[data-feature-key='bot-board-style'] .ad-xconfig-card-bg img";
  assert.equal(
    documentRef.querySelector(previewSelector)?.getAttribute("src"),
    resolveBoardStyleDesignAsset("winmau-blade-6-tc")
  );
  assert.equal(
    documentRef.querySelector(
      ".ad-xconfig-card[data-feature-key='bot-board-style']"
    )?.getAttribute("data-preview-kind"),
    "board"
  );

  documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='bot-board-style']"
  ).click();
  await waitForSettingsModal(documentRef);
  clickSelectSettingOption(documentRef, "bot-board-style", "design", "target-tor");

  assert.equal(
    await waitFor(() => (
      documentRef.querySelector(previewSelector)?.getAttribute("src") ===
      resolveBoardStyleDesignAsset("target-tor")
    )),
    true
  );
  assert.equal(
    JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)).features.botBoardStyle.design,
    "target-tor"
  );

  runtime.stop();
});

test("Dart Marker Replacer card features and updates the selected dart", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);

  const cardSelector = ".ad-xconfig-card[data-feature-key='dart-marker-replacer']";
  const previewSelector = `${cardSelector} .ad-xconfig-card-bg img`;
  assert.equal(
    documentRef.querySelector(cardSelector)?.getAttribute("data-preview-kind"),
    "dart-marker"
  );
  assert.equal(
    documentRef.querySelector(previewSelector)?.getAttribute("src"),
    resolveDartDesignAsset("germangiant")
  );

  documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='dart-marker-replacer']"
  ).click();
  await waitForSettingsModal(documentRef);
  clickSelectSettingOption(documentRef, "dart-marker-replacer", "design", "red");

  assert.equal(
    await waitFor(() => (
      documentRef.querySelector(previewSelector)?.getAttribute("src") ===
      resolveDartDesignAsset("red")
    )),
    true
  );
  assert.equal(
    JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)).features.dartMarkerReplacer.design,
    "red"
  );

  runtime.stop();
});

test("xConfig shell global background upload and clear actions persist and expose status feedback", async () => {
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
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-background']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  let status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-background']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");
  const emptySummary = status.querySelector(".ad-xconfig-theme-image-status-summary");
  assert.ok(emptySummary);
  assert.equal(String(emptySummary.textContent || "").trim(), "Aktuelles Bild: keines.");

  const uploadButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-background-uploadThemeBackground"
  );
  assert.ok(uploadButton);
  uploadButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.themes.globalBackground.backgroundImageDataUrl ===
      `data:image/webp;base64,${"a".repeat(40)}`
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(
    storedConfig.features.themes.globalBackground.backgroundImageDataUrl,
    `data:image/webp;base64,${"a".repeat(40)}`
  );
  const uploadFeedback = documentRef.querySelector(
    "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-global-background']"
  );
  assert.ok(uploadFeedback);
  assert.match(String(uploadFeedback.textContent || ""), /optimiert gespeichert/);
  assert.match(String(uploadFeedback.textContent || ""), /bg\.png/);
  assert.equal(
    uploadFeedback.classList.contains("ad-xconfig-theme-action-feedback--success"),
    true
  );

  status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-background']"
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
    ".ad-xconfig-card[data-feature-key='theme-global-background'] .ad-xconfig-note"
  );
  assert.ok(themeCardNote);
  assert.match(String(themeCardNote.textContent || ""), /Hintergrundbild/);

  const clearButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-background-clearThemeBackground"
  );
  assert.ok(clearButton);
  clearButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalBackground.backgroundImageDataUrl === ""
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalBackground.backgroundImageDataUrl, "");
  assert.match(String(uploadFeedback.textContent || ""), /entfernt/);
  assert.equal(
    uploadFeedback.classList.contains("ad-xconfig-theme-action-feedback--info"),
    true
  );

  status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-background']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");

  const clearedCardNote = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-global-background'] .ad-xconfig-note"
  );
  assert.ok(clearedCardNote);
  assert.equal(
    String(clearedCardNote.textContent || "").trim(),
    "Kein globales Hintergrundbild gespeichert."
  );

  runtime.stop();
});

test("xConfig shell supports independent turn dart upload and clear actions", async () => {
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
          node.files = [{ name: "turn-dart.png", type: "image/png" }];
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
    "[data-adxconfig-action='open-settings'][data-feature-key='turn-dart-display']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  let turnDartStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='turn-dart-display']"
  );
  assert.ok(turnDartStatus);
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-state"), "empty");

  const uploadTurnDartButton = documentRef.getElementById(
    "ad-xconfig-field-turn-dart-display-uploadTurnDartImage"
  );
  assert.ok(uploadTurnDartButton);
  uploadTurnDartButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.turnDartDisplay.turnDartStyle === "image" &&
      config.features.turnDartDisplay.turnDartImageDataUrl ===
        `data:image/webp;base64,${"g".repeat(40)}`
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnDartDisplay.turnDartStyle, "image");
  assert.equal(
    storedConfig.features.turnDartDisplay.turnDartImageDataUrl,
    `data:image/webp;base64,${"g".repeat(40)}`
  );

  turnDartStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='turn-dart-display']"
  );
  assert.ok(turnDartStatus);
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-state"), "present");
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-type"), "image/webp");
  const turnDartPreview = turnDartStatus.querySelector(".ad-xconfig-turn-dart-image-preview");
  assert.ok(turnDartPreview);
  assert.equal(turnDartPreview.getAttribute("src"), `data:image/webp;base64,${"g".repeat(40)}`);

  const clearTurnDartButton = documentRef.getElementById(
    "ad-xconfig-field-turn-dart-display-clearTurnDartImage"
  );
  assert.ok(clearTurnDartButton);
  clearTurnDartButton.click();
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.turnDartDisplay.turnDartStyle === "original" &&
      config.features.turnDartDisplay.turnDartImageDataUrl === ""
  );

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.turnDartDisplay.turnDartStyle, "original");
  assert.equal(storedConfig.features.turnDartDisplay.turnDartImageDataUrl, "");

  turnDartStatus = documentRef.querySelector(
    "[data-adxconfig-turn-dart-image-status='true'][data-feature-key='turn-dart-display']"
  );
  assert.ok(turnDartStatus);
  assert.equal(turnDartStatus.getAttribute("data-turn-dart-image-state"), "empty");
  assert.equal(turnDartStatus.querySelector(".ad-xconfig-turn-dart-image-preview"), null);

  runtime.stop();
});

test("xConfig shell reports invalid global background uploads and keeps previous state", async () => {
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
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-global-background']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await waitForSettingsModal(documentRef);

  const uploadButton = documentRef.getElementById(
    "ad-xconfig-field-theme-global-background-uploadThemeBackground"
  );
  assert.ok(uploadButton);
  uploadButton.click();
  await waitFor(() => {
    const errorFeedback = documentRef.querySelector(
      "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-global-background']"
    );
    return Boolean(errorFeedback) && /kein unterstütztes Bild/.test(String(errorFeedback.textContent || ""));
  });

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalBackground.backgroundImageDataUrl, "");

  const errorFeedback = documentRef.querySelector(
    "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-global-background']"
  );
  assert.ok(errorFeedback);
  assert.match(String(errorFeedback.textContent || ""), /kein unterstütztes Bild/);
  assert.equal(
    errorFeedback.classList.contains("ad-xconfig-theme-action-feedback--error"),
    true
  );

  const status = documentRef.querySelector(
    "[data-adxconfig-theme-image-status='true'][data-feature-key='theme-global-background']"
  );
  assert.ok(status);
  assert.equal(status.getAttribute("data-theme-image-state"), "empty");

  runtime.stop();
});

test("xConfig single-bull-hit-sound settings expose and run the configured sound preview", async () => {
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

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='single-bull-hit-sound']"
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
      button.getAttribute("data-feature-key") === "single-bull-hit-sound" &&
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
      return storedConfig?.features?.singleBullHitSound?.volume === 0.5;
    }),
    true
  );

  const previewButton = documentRef.getElementById(
    "ad-xconfig-field-single-bull-hit-sound-run-feature-action"
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

  clickFeatureToggle(firstDocument, "theme-global-background", true);
  await waitForStoredConfig(
    localStorage,
    (config) => config.featureToggles["themes.globalBackground"] === true
  );
  clickFeatureToggle(firstDocument, "turn-score-counter", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.turnScoreCounter === true);
  clickFeatureToggle(firstDocument, "x01-remaining-score-bar", true);
  await waitForStoredConfig(localStorage, (config) => config.featureToggles.x01RemainingScoreBar === true);

  const openSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-highlight']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await waitForSettingsModal(firstDocument);

  clickSelectSettingOption(firstDocument, "checkout-score-highlight", "effect", "glow-only");
  await waitForStoredConfig(localStorage, (config) => config.features.checkoutScoreHighlight.effect === "glow-only");

  const openX01ProgressSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-remaining-score-bar']"
  );
  assert.ok(openX01ProgressSettings);
  openX01ProgressSettings.click();
  await waitFor(() => Boolean(
    firstDocument.querySelector(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-remaining-score-bar'][data-setting-key='effect']"
    )
  ));

  clickSelectSettingOption(firstDocument, "x01-remaining-score-bar", "effect", "previous-score-trail");
  await waitForStoredConfig(localStorage, (config) => config.features.x01RemainingScoreBar.effect === "previous-score-trail");

  await firstWindow.__adXConfig.setThemeBackgroundImage(
    "globalTypography",
    "data:image/png;base64,cGVyc2lzdGVk"
  );
  await waitForStoredConfig(
    localStorage,
    (config) =>
      config.features.themes.globalBackground.backgroundImageDataUrl ===
      "data:image/png;base64,cGVyc2lzdGVk"
  );

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.globalBackground"], true);
  assert.equal(storedConfig.featureToggles.turnScoreCounter, true);
  assert.equal(storedConfig.featureToggles.x01RemainingScoreBar, true);
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "glow-only");
  assert.equal(storedConfig.features.x01RemainingScoreBar.effect, "previous-score-trail");
  assert.equal(
    storedConfig.features.themes.globalBackground.backgroundImageDataUrl,
    "data:image/png;base64,cGVyc2lzdGVk"
  );

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
  assert.equal(secondSnapshot.features["theme-global-background"].enabled, true);
  assert.equal(secondSnapshot.features["turn-score-counter"].enabled, true);
  assert.equal(secondSnapshot.features["x01-remaining-score-bar"].enabled, true);
  assert.equal(secondSnapshot.features["turn-score-counter"].mounted, true);
  assert.equal(secondSnapshot.features["theme-global-background"].mounted, true);
  assert.equal(secondSnapshot.features["x01-remaining-score-bar"].mounted, true);
  assert.equal(secondSnapshot.features["x01-remaining-score-bar"].config.effect, "previous-score-trail");
  assert.equal(
    secondSnapshot.features["theme-global-background"].config.backgroundImageDataUrl,
    "data:image/png;base64,cGVyc2lzdGVk"
  );

  secondDocument.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(secondWindow, secondDocument);

  const restoredThemeToggle = secondDocument.querySelector(
    "[data-adxconfig-feature-toggle='true'][data-feature-key='theme-global-background']"
  );
  assert.ok(restoredThemeToggle);
  assert.equal(restoredThemeToggle.checked, true);

  const restoredX01ProgressToggle = secondDocument.querySelector(
    "[data-adxconfig-feature-toggle='true'][data-feature-key='x01-remaining-score-bar']"
  );
  assert.ok(restoredX01ProgressToggle);
  assert.equal(restoredX01ProgressToggle.checked, true);
  const openSecondSettings = secondDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-highlight']"
  );
  openSecondSettings.click();
  await waitForSettingsModal(secondDocument);

  const restoredEffectOptions = secondDocument.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-highlight'][data-setting-key='effect']"
  );
  const restoredActiveEffects = restoredEffectOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(restoredActiveEffects.length, 1);
  assert.equal(restoredActiveEffects[0].getAttribute("data-setting-value"), "glow-only");

  const openRestoredX01Settings = secondDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-remaining-score-bar']"
  );
  assert.ok(openRestoredX01Settings);
  openRestoredX01Settings.click();
  await waitFor(() => {
    return secondDocument.querySelectorAll(
      "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-remaining-score-bar'][data-setting-key='effect']"
    ).length > 0;
  });

  const restoredX01EffectOptions = secondDocument.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-remaining-score-bar'][data-setting-key='effect']"
  );
  await waitFor(() => restoredX01EffectOptions.some(
    (node) => node.getAttribute("data-active") === "true"
  ));
  const restoredActiveX01Effects = restoredX01EffectOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(restoredActiveX01Effects.length, 1);
  assert.equal(restoredActiveX01Effects[0].getAttribute("data-setting-value"), "previous-score-trail");

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.globalBackground"], true);
  assert.equal(storedConfig.featureToggles.turnScoreCounter, true);
  assert.equal(storedConfig.featureToggles.x01RemainingScoreBar, true);

  secondRuntime.stop();
});



test("xConfig switches save once per change and preserve the checked setting after reopening", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await waitForMenuButton(documentRef);
  documentRef.getElementById("ad-xconfig-menu-item").click();
  await waitForShellOpen(windowRef, documentRef);
  let writes = 0;
  const setItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    if (key === CONFIG_STORAGE_KEY) writes += 1;
    setItem(key, value);
  };
  clickFeatureToggle(documentRef, "theme-global-typography", true);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalTypography.enabled === true
  );
  assert.equal(writes, 1);
  const open = () => documentRef
    .querySelector("[data-adxconfig-action='open-settings'][data-feature-key='theme-global-typography']")
    .click();
  open();
  await waitForSettingsModal(documentRef);
  writes = 0;
  clickSettingToggle(documentRef, "theme-global-typography", "debug", true);
  await waitForStoredConfig(
    localStorage,
    (config) => config.features.themes.globalTypography.debug === true
  );
  assert.equal(writes, 1);
  documentRef.querySelector("[data-adxconfig-action='close-settings']").click();
  await waitFor(() => !documentRef.querySelector("[data-adxconfig-modal='true']"));
  open();
  await waitForSettingsModal(documentRef);
  assert.equal(
    documentRef.querySelector("[data-adxconfig-setting='true'][data-setting-key='debug']").checked,
    true
  );
  runtime.stop();
});
