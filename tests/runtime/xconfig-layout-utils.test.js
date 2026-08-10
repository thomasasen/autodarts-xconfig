import test from "node:test";
import assert from "node:assert/strict";

import {
  currentRoute,
  getContentElement,
  getSidebarElement,
  hasShellNavigationOrLayoutMutation,
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

test("xconfig layout utils normalize routes on old and new Autodarts domains", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    localStorage: new FakeStorage(),
    href: "https://play.autodarts.com/boards?tab=all#section",
  });

  assert.equal(normalizeRoutePath("boards?tab=all"), "/boards");
  assert.equal(toRoutePathname(windowRef, "/matches?state=open"), "/matches");
  assert.equal(
    toRoutePathname(windowRef, "https://play.autodarts.io/matches/legacy?tab=board"),
    "/matches/legacy"
  );
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

test("xconfig layout utils classify only shell-relevant mutations for closed shell sync", () => {
  const documentRef = new FakeDocument();
  const options = {
    menuItemId: "ad-xconfig-menu-item",
    panelHostId: PANEL_HOST_ID,
    rootId: "root",
  };

  const gameNode = documentRef.createElement("span");
  documentRef.turnContainer.appendChild(gameNode);
  assert.equal(
    hasShellNavigationOrLayoutMutation([
      { target: documentRef.turnContainer, addedNodes: [gameNode], removedNodes: [] },
    ], options),
    false
  );

  const scoreDecoration = documentRef.createElement("span");
  documentRef.activeScoreElement.appendChild(scoreDecoration);
  assert.equal(
    hasShellNavigationOrLayoutMutation([
      { target: documentRef.activeScoreElement, addedNodes: [scoreDecoration], removedNodes: [] },
    ], options),
    false
  );

  const boardNode = documentRef.createElement("div");
  boardNode.classList.add("ad-ext-theme-board-svg");
  documentRef.main.appendChild(boardNode);
  assert.equal(
    hasShellNavigationOrLayoutMutation([
      { target: documentRef.main, addedNodes: [boardNode], removedNodes: [] },
    ], options),
    false
  );

  const navLink = documentRef.createElement("a");
  navLink.setAttribute("href", "/matches");
  documentRef.sidebar.appendChild(navLink);
  assert.equal(
    hasShellNavigationOrLayoutMutation([
      { target: documentRef.sidebar, addedNodes: [navLink], removedNodes: [] },
    ], options),
    true
  );

  const replacementMain = documentRef.createElement("main");
  assert.equal(
    hasShellNavigationOrLayoutMutation([
      { target: documentRef.rootElement, addedNodes: [replacementMain], removedNodes: [] },
    ], options),
    true
  );

  const panelHost = documentRef.createElement("section");
  panelHost.id = PANEL_HOST_ID;
  const panelChild = documentRef.createElement("div");
  panelHost.appendChild(panelChild);
  assert.equal(
    hasShellNavigationOrLayoutMutation([
      { target: panelHost, addedNodes: [panelChild], removedNodes: [] },
    ], options),
    false
  );
});
