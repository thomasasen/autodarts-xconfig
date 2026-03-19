import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import { USERSCRIPT_DOWNLOAD_URL } from "../../src/features/xconfig-ui/update-check.js";
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

function clickSelectSettingOption(documentRef, featureKey, settingKey, settingValue) {
  const selector = `[data-adxconfig-action='set-setting-select-option'][data-feature-key='${featureKey}'][data-setting-key='${settingKey}'][data-setting-value='${String(settingValue)}']`;
  const button = documentRef.querySelector(selector);
  assert.ok(button, `missing select option button for ${featureKey}.${settingKey}.${settingValue}`);
  button.click();
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

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");
  assert.equal(documentRef.variantElement.style.display, "none");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.style.display, "block");

  windowRef.history.pushState({}, "", "/lobbies");
  await wait(5);

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

  await wait(5);

  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");
  assert.equal(documentRef.variantElement.style.display, "none");

  const panelHost = documentRef.getElementById("ad-xconfig-panel-host");
  assert.ok(panelHost);
  assert.equal(panelHost.style.display, "block");

  windowRef.history.pushState({}, "", "/lobbies");
  await wait(5);

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

  await wait(5);

  const menuButton = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(menuButton);

  menuButton.click();
  await wait(5);

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
  assert.equal(windowRef.location.pathname, "/lobbies");
  assert.equal(windowRef.location.hash, "#ad-xconfig");

  runtime.stop();
});

test("xConfig shell repairs a corrupted sidebar menu node on sync", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  const broken = documentRef.getElementById("ad-xconfig-menu-item");
  assert.ok(broken);
  broken.classList.add("ad-xconfig-tab");
  broken.setAttribute("data-adxconfig-tab", "themes");
  broken.removeAttribute("data-adxconfig-action");
  broken.replaceChildren(documentRef.createElement("span"));

  windowRef.history.pushState({}, "", "/boards");
  await wait(8);

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
    windowRef.history.pushState({}, "", "/lobbies");
    documentRef.flushMutations();
    await wait(5);
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
  let callCount = 0;
  windowRef.fetch = async () => {
    callCount += 1;
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const remoteVersion = callCount === 1 ? installedVersion : incrementPatchVersion(installedVersion);
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
  let callCount = 0;
  windowRef.fetch = async () => {
    callCount += 1;
    const installedVersion = String(windowRef.__adXConfig?.apiVersion || "0.0.0");
    const remoteVersion = callCount === 1 ? installedVersion : incrementPatchVersion(installedVersion);
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
    await waitFor(() => callCount >= 2, { timeoutMs: 260, intervalMs: 5 });
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

  const effectOptionsBefore = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='checkout-score-pulse'][data-setting-key='effect']"
  );
  assert.equal(
    effectOptionsBefore.filter((node) => node.getAttribute("data-active") === "true").length,
    1
  );

  clickSelectSettingOption(documentRef, "checkout-score-pulse", "effect", "blink");
  await wait(5);

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

test("xConfig shell sorts themes and groups animations by mode relevance", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const themeCardFeatureKeys = documentRef
    .querySelectorAll(".ad-xconfig-card")
    .map((cardNode) => String(cardNode.getAttribute("data-feature-key") || ""))
    .filter((featureKey) => featureKey.startsWith("theme-"));
  assert.deepEqual(themeCardFeatureKeys, [
    "theme-bull-off",
    "theme-x01",
    "theme-cricket",
    "theme-shanghai",
    "theme-bermuda",
  ]);

  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);

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

test("xConfig shell enables all themes with a compact action button in the themes tab", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const enableAllThemesButton = documentRef.querySelector(
    "[data-adxconfig-action='enable-all-themes']"
  );
  assert.ok(enableAllThemesButton);
  assert.equal(enableAllThemesButton.classList.contains("ad-xconfig-btn--compact"), true);
  enableAllThemesButton.click();
  assert.equal(await waitFor(() => {
    const storedSnapshot = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
    return (
      storedSnapshot.featureToggles["themes.x01"] === true &&
      storedSnapshot.featureToggles["themes.shanghai"] === true &&
      storedSnapshot.featureToggles["themes.bermuda"] === true &&
      storedSnapshot.featureToggles["themes.cricket"] === true &&
      storedSnapshot.featureToggles["themes.bullOff"] === true
    );
  }, { timeoutMs: 500, intervalMs: 6 }), true);

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.featureToggles["themes.shanghai"], true);
  assert.equal(storedConfig.featureToggles["themes.bermuda"], true);
  assert.equal(storedConfig.featureToggles["themes.cricket"], true);
  assert.equal(storedConfig.featureToggles["themes.bullOff"], true);

  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);
  assert.equal(
    Boolean(documentRef.querySelector("[data-adxconfig-action='enable-all-themes']")),
    false
  );

  runtime.stop();
});

test("xConfig settings modal renders explanatory notes for checkbox, select and action fields", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  const openThemeSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='theme-x01']"
  );
  assert.ok(openThemeSettings);
  openThemeSettings.click();
  await wait(5);

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
    noteTexts.includes("Öffnet die Dateiauswahl und speichert ein eigenes Bild nur für dieses Theme."),
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
  await wait(5);

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

test("xConfig dart design options render split layout with preview and active badge slot", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);
  documentRef.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);

  const openSettings = documentRef.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='dart-marker-darts']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await wait(5);

  const designOptions = documentRef.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='dart-marker-darts'][data-setting-key='design']"
  );
  assert.equal(designOptions.length, 13);

  designOptions.forEach((optionNode) => {
    assert.equal(optionNode.classList.contains("ad-xconfig-option-item--dart-design"), true);
    const preview = optionNode.querySelector(".ad-xconfig-option-preview");
    assert.ok(preview);
    assert.match(String(preview.getAttribute("src") || ""), /Dart_/);
    const activeSlot = optionNode.querySelector("[data-option-active-slot='true']");
    assert.ok(activeSlot);
  });

  const activeBefore = designOptions.filter(
    (node) => node.getAttribute("data-active") === "true"
  );
  assert.equal(activeBefore.length, 1);
  const activeBeforeSlot = activeBefore[0].querySelector("[data-option-active-slot='true']");
  assert.ok(activeBeforeSlot);
  assert.ok(activeBeforeSlot.querySelector(".ad-xconfig-option-active"));

  clickSelectSettingOption(documentRef, "dart-marker-darts", "design", "red");
  await wait(5);
  clickSettingToggle(documentRef, "dart-marker-darts", "enableShadow", false);
  await wait(5);
  clickSettingToggle(documentRef, "dart-marker-darts", "enableWobble", false);
  await wait(5);

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.dartMarkerDarts.design, "red");
  assert.equal(storedConfig.features.dartMarkerDarts.enableShadow, false);
  assert.equal(storedConfig.features.dartMarkerDarts.enableWobble, false);

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
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  for (const descriptor of xconfigDescriptors) {
    const tabId = descriptor.tab === "themes" ? "themes" : "animations";
    const tabButton = documentRef.getElementById(`ad-xconfig-tab-${tabId}`);
    assert.ok(tabButton, `missing tab button for ${descriptor.featureKey}`);
    tabButton.click();
    await wait(5);

    const cardReadmeButton = documentRef.querySelector(
      `.ad-xconfig-card[data-feature-key='${descriptor.featureKey}'] [data-adxconfig-action='open-readme'][data-feature-key='${descriptor.featureKey}']`
    );
    assert.ok(cardReadmeButton, `missing card README button for ${descriptor.featureKey}`);
    cardReadmeButton.click();
    await wait(5);

    assert.equal(
      windowRef.__openedUrls.at(-1),
      `https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#${descriptor.readmeAnchor}`
    );
  }

  runtime.stop();
});

test("xConfig shell links every settings modal README button to the matching README anchor", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

  for (const descriptor of xconfigDescriptors) {
    if (!Array.isArray(descriptor.fields) || !descriptor.fields.length) {
      continue;
    }

    const tabId = descriptor.tab === "themes" ? "themes" : "animations";
    const tabButton = documentRef.getElementById(`ad-xconfig-tab-${tabId}`);
    assert.ok(tabButton, `missing tab button for ${descriptor.featureKey}`);
    tabButton.click();
    await wait(5);

    const settingsButton = documentRef.querySelector(
      `.ad-xconfig-card[data-feature-key='${descriptor.featureKey}'] [data-adxconfig-action='open-settings'][data-feature-key='${descriptor.featureKey}']`
    );
    assert.ok(settingsButton, `missing settings button for ${descriptor.featureKey}`);
    settingsButton.click();
    await wait(5);

    const modalReadmeButton = documentRef.querySelector(
      `.ad-xconfig-modal [data-adxconfig-action='open-readme'][data-feature-key='${descriptor.featureKey}']`
    );
    assert.ok(modalReadmeButton, `missing modal README button for ${descriptor.featureKey}`);
    modalReadmeButton.click();
    await wait(5);

    assert.equal(
      windowRef.__openedUrls.at(-1),
      `https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md#${descriptor.readmeAnchor}`
    );

    const closeSettingsButton = documentRef.querySelector("[data-adxconfig-action='close-settings']");
    assert.ok(closeSettingsButton, `missing modal close button for ${descriptor.featureKey}`);
    closeSettingsButton.click();
    await wait(5);
  }

  runtime.stop();
});

test("xConfig shell renders mapped preview backgrounds and compact shell header", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  await wait(5);

  documentRef.getElementById("ad-xconfig-menu-item").click();
  await wait(5);

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

test("xConfig shell theme background upload and clear actions persist and expose status feedback", async () => {
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
  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,ZmFrZS1kYXRh");
  const uploadFeedback = documentRef.querySelector(
    "[data-adxconfig-theme-action-feedback='true'][data-feature-key='theme-x01']"
  );
  assert.ok(uploadFeedback);
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
  assert.equal(status.getAttribute("data-theme-image-type"), "image/png");
  assert.equal(status.getAttribute("data-theme-image-size"), "9");

  const uploadedSummary = status.querySelector(".ad-xconfig-theme-image-status-summary");
  assert.ok(uploadedSummary);
  assert.match(String(uploadedSummary.textContent || ""), /image\/png/);
  assert.match(String(uploadedSummary.textContent || ""), /9 B/);

  const preview = status.querySelector(".ad-xconfig-theme-image-preview");
  assert.ok(preview);
  assert.equal(preview.getAttribute("src"), "data:image/png;base64,ZmFrZS1kYXRh");

  const themeCardNote = documentRef.querySelector(
    ".ad-xconfig-card[data-feature-key='theme-x01'] .ad-xconfig-note"
  );
  assert.ok(themeCardNote);
  assert.match(String(themeCardNote.textContent || ""), /image\/png/);

  const clearButton = documentRef.getElementById("ad-xconfig-field-theme-x01-clearThemeBackground");
  assert.ok(clearButton);
  clearButton.click();
  await wait(5);

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

test("xConfig shell reports invalid theme upload payloads as error and keeps previous state", async () => {
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
  clickFeatureToggle(firstDocument, "x01-score-progress", true);
  await wait(5);

  const openSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  assert.ok(openSettings);
  openSettings.click();
  await wait(5);

  clickSelectSettingOption(firstDocument, "checkout-score-pulse", "effect", "glow");
  await wait(5);

  const openX01ProgressSettings = firstDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='x01-score-progress']"
  );
  assert.ok(openX01ProgressSettings);
  openX01ProgressSettings.click();
  await wait(5);

  clickSelectSettingOption(firstDocument, "x01-score-progress", "effect", "ghost-trail");
  await wait(5);

  await firstWindow.__adXConfig.setThemeBackgroundImage("x01", "data:image/png;base64,cGVyc2lzdGVk");
  await wait(5);

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
  await wait(5);

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
  await wait(5);

  const restoredThemeToggle = secondDocument.querySelector(
    "[data-adxconfig-action='set-feature'][data-feature-key='theme-x01'][data-feature-enabled='true']"
  );
  assert.ok(restoredThemeToggle);
  assert.equal(restoredThemeToggle.getAttribute("data-active"), "true");

  secondDocument.getElementById("ad-xconfig-tab-animations").click();
  await wait(5);
  const restoredX01ProgressToggle = secondDocument.querySelector(
    "[data-adxconfig-action='set-feature'][data-feature-key='x01-score-progress'][data-feature-enabled='true']"
  );
  assert.ok(restoredX01ProgressToggle);
  assert.equal(restoredX01ProgressToggle.getAttribute("data-active"), "true");
  const openSecondSettings = secondDocument.querySelector(
    "[data-adxconfig-action='open-settings'][data-feature-key='checkout-score-pulse']"
  );
  openSecondSettings.click();
  await wait(5);

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
  await wait(5);

  const restoredX01EffectOptions = secondDocument.querySelectorAll(
    "[data-adxconfig-action='set-setting-select-option'][data-feature-key='x01-score-progress'][data-setting-key='effect']"
  );
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

