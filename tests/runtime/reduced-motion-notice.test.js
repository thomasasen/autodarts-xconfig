import test from "node:test";
import assert from "node:assert/strict";
import { createReducedMotionNoticeController } from "../../src/features/xconfig-ui/reduced-motion-notice.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function createHarness({ matches = false, platform = "Win32", userAgent = "Chrome", legacy = false } = {}) {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.navigator = { platform, userAgent };
  const listeners = new Set();
  const mediaQuery = { matches };
  if (legacy) {
    mediaQuery.addListener = (listener) => listeners.add(listener);
    mediaQuery.removeListener = (listener) => listeners.delete(listener);
  } else {
    mediaQuery.addEventListener = (type, listener) => {
      assert.equal(type, "change");
      listeners.add(listener);
    };
    mediaQuery.removeEventListener = (type, listener) => {
      assert.equal(type, "change");
      listeners.delete(listener);
    };
  }
  windowRef.matchMedia = (query) => {
    assert.equal(query, "(prefers-reduced-motion: reduce)");
    return mediaQuery;
  };
  const shell = documentRef.createElement("div");
  const header = documentRef.createElement("header");
  shell.appendChild(header);
  documentRef.body.appendChild(shell);
  const controller = createReducedMotionNoticeController({ windowRef, documentRef, getShell: () => shell });
  const getNotice = () => shell.querySelector("[data-adxconfig-reduced-motion]");
  function changeMotion(value) {
    mediaQuery.matches = value;
    listeners.forEach((listener) => listener());
  }
  return { controller, shell, header, getNotice, changeMotion, listeners, documentRef, windowRef };
}

test("reduced motion notice appears above the header and disappears immediately when disabled", () => {
  const h = createHarness();
  h.controller.start();
  assert.equal(h.getNotice(), null);
  h.changeMotion(true);
  const notice = h.getNotice();
  assert.equal(h.shell.firstChild, notice);
  assert.match(notice.querySelector("span").textContent, /Animationen reduziert oder ausgeschaltet/);
  assert.equal(notice.querySelector("a").getAttribute("href"), "ms-settings:easeofaccess-visualeffects");
  h.changeMotion(false);
  assert.equal(h.getNotice(), null);
  assert.equal(h.shell.firstChild, h.header);
  h.controller.stop();
});

test("reduced motion notice is present initially, stays unique and returns after shell content replacement", () => {
  const h = createHarness({ matches: true });
  h.controller.start();
  h.controller.start();
  h.controller.sync();
  assert.equal(h.listeners.size, 1);
  assert.equal(h.shell.querySelectorAll("[data-adxconfig-reduced-motion]").length, 1);
  h.getNotice().remove();
  h.controller.sync();
  assert.equal(h.shell.firstChild, h.getNotice());
  h.controller.stop();
  assert.equal(h.getNotice(), null);
  assert.equal(h.listeners.size, 0);
  h.controller.start();
  assert.ok(h.getNotice());
  assert.equal(h.listeners.size, 1);
  h.controller.stop();
});

test("reduced motion notice provides working web help instead of a Windows URI on other platforms", () => {
  const h = createHarness({ matches: true, platform: "MacIntel", userAgent: "Safari" });
  h.controller.start();
  const link = h.getNotice().querySelector("a");
  assert.match(link.getAttribute("href"), /^https:\/\/developer.mozilla.org\//);
  assert.equal(link.getAttribute("target"), "_blank");
  assert.equal(link.getAttribute("rel"), "noopener noreferrer");
  h.controller.stop();
});

test("reduced motion notice explains the Firefox override without offering a blocked internal link", () => {
  const h = createHarness({ matches: true, platform: "Linux", userAgent: "Firefox/140" });
  h.controller.start();
  const help = h.getNotice().querySelectorAll("small")[1].textContent;
  assert.match(help, /about:config/);
  assert.match(help, /ui.prefersReducedMotion suchen und als Zahl auf 0/);
  assert.match(h.getNotice().querySelector("a").getAttribute("href"), /^https:/);
  h.controller.stop();
});

for (const { browser, platform, userAgent, windows, firefox } of [
  { browser: "Chrome on Windows", platform: "Win32", userAgent: "Chrome/140", windows: true, firefox: false },
  { browser: "Chrome on Linux", platform: "Linux x86_64", userAgent: "X11 Linux Chrome/140", windows: false, firefox: false },
  { browser: "Firefox on Windows", platform: "Win32", userAgent: "Firefox/140", windows: true, firefox: true },
  { browser: "Firefox on Linux", platform: "Linux x86_64", userAgent: "Firefox/140", windows: false, firefox: true },
  { browser: "Edge on Windows", platform: "Win32", userAgent: "Chrome/140 Edg/140", windows: true, firefox: false },
]) {
  test(`reduced motion notice offers appropriate settings actions for ${browser}`, () => {
    const h = createHarness({ matches: true, platform, userAgent });
    h.controller.start();
    const notice = h.getNotice();
    const link = notice.querySelector("a");
    assert.equal(link.getAttribute("href").startsWith("ms-settings:"), windows);
    assert.equal(Boolean(notice.querySelector("button")), firefox);
    if (!windows) {
      const help = notice.querySelector("small").textContent;
      assert.match(help, /GNOME/);
      assert.match(help, /KDE Plasma/);
      assert.match(link.textContent, /Linux-Anleitung/);
    }
    h.controller.stop();
  });
}

test("reduced motion Firefox button copies the settings address and explains the next step", async () => {
  const h = createHarness({ matches: true, platform: "Linux", userAgent: "Firefox/140" });
  const copied = [];
  h.windowRef.navigator.clipboard = { writeText: async (value) => copied.push(value) };
  h.controller.start();
  h.getNotice().querySelector("button").click();
  await Promise.resolve();
  assert.deepEqual(copied, ["about:config"]);
  assert.match(h.getNotice().querySelector("[role='status']").textContent, /Adresse kopiert/);
  assert.match(h.getNotice().querySelector("[role='status']").textContent, /ui.prefersReducedMotion auf 0/);
  h.controller.stop();
});

for (const clipboard of [undefined, { writeText: async () => { throw new Error("denied"); } }]) {
  test(`reduced motion Firefox button provides a manual fallback when clipboard is ${clipboard ? "denied" : "unavailable"}`, async () => {
    const h = createHarness({ matches: true, userAgent: "Firefox/140" });
    h.windowRef.navigator.clipboard = clipboard;
    h.controller.start();
    const button = h.getNotice().querySelector("button");
    button.click();
    await Promise.resolve();
    assert.match(h.getNotice().querySelector("[role='status']").textContent, /about:config manuell/);
    assert.equal(button.disabled, false);
    h.controller.stop();
  });
}

test("reduced motion notice supports legacy media listeners and removes them on stop", () => {
  const h = createHarness({ legacy: true });
  h.controller.start();
  h.changeMotion(true);
  assert.ok(h.getNotice());
  h.controller.stop();
  assert.equal(h.listeners.size, 0);
  h.changeMotion(true);
  assert.equal(h.getNotice(), null);
});

test("reduced motion notice tolerates unavailable matchMedia and a not-yet-rendered shell", () => {
  const h = createHarness();
  delete h.windowRef.matchMedia;
  h.controller.start();
  h.controller.sync();
  h.controller.stop();
  assert.equal(h.getNotice(), null);
  const controller = createReducedMotionNoticeController({
    documentRef: h.documentRef,
    windowRef: { matchMedia: () => ({ matches: true }) },
    getShell: () => null,
  });
  controller.start();
  controller.sync();
  controller.stop();
});
