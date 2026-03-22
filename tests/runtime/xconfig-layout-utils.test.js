import test from "node:test";
import assert from "node:assert/strict";

import {
  currentRoute,
  getContentElement,
  getSidebarElement,
  isConfigHash,
  isLegacyConfigPath,
  normalizeRoutePath,
  removeNodeById,
  toRoutePathname,
} from "../../src/features/xconfig-ui/layout-utils.js";
import { FakeDocument, FakeStorage, createFakeWindow } from "./fake-dom.js";

const CONFIG_PATH = "/ad-xconfig";
const CONFIG_HASH = "#ad-xconfig";
const PANEL_HOST_ID = "ad-xconfig-panel-host";
const SIDEBAR_ROUTE_HINTS = new Set([
  "/lobbies",
  "/boards",
  "/matches",
  "/tournaments",
  "/statistics",
  "/plus",
  "/settings",
]);

test("xconfig layout utils normalize routes and config locations consistently", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    localStorage: new FakeStorage(),
    href: "https://play.autodarts.io/boards?tab=all#section",
  });

  assert.equal(normalizeRoutePath("boards?tab=all"), "/boards");
  assert.equal(toRoutePathname(windowRef, "/matches?state=open"), "/matches");
  assert.equal(currentRoute(windowRef), "/boards?tab=all#section");
  assert.equal(isLegacyConfigPath("/ad-xconfig", CONFIG_PATH), true);
  assert.equal(isConfigHash("ad-xconfig", CONFIG_HASH), true);
});

test("xconfig layout utils resolve sidebar and content slots without a main element", () => {
  const documentRef = new FakeDocument({ contentTagName: "div" });
  const windowRef = createFakeWindow({
    documentRef,
    localStorage: new FakeStorage(),
  });
  const panelHost = documentRef.createElement("section");
  panelHost.id = PANEL_HOST_ID;
  documentRef.layoutShell.insertBefore(panelHost, documentRef.sidebar);

  const sidebar = getSidebarElement(windowRef, documentRef, {
    panelHostId: PANEL_HOST_ID,
    sidebarRouteHints: SIDEBAR_ROUTE_HINTS,
  });
  const content = getContentElement(windowRef, documentRef, sidebar, {
    panelHostId: PANEL_HOST_ID,
    sidebarRouteHints: SIDEBAR_ROUTE_HINTS,
  });

  assert.equal(sidebar, documentRef.sidebar);
  assert.equal(content, documentRef.main);

  removeNodeById(documentRef, PANEL_HOST_ID);
  assert.equal(documentRef.getElementById(PANEL_HOST_ID), null);
});
