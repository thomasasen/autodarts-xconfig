import test from "node:test";
import assert from "node:assert/strict";

import {
  BOARD_CONTROLS_PORTAL_ATTRIBUTE,
  cleanupBoardControlsPortal,
  syncBoardControlsPortal,
} from "../../src/features/themes/shared/board-controls-portal.js";
import { BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE } from "../../src/shared/board-input-mode.js";
import { FakeDocument, FakeEvent, createFakeWindow } from "./fake-dom.js";

function createGroup(documentRef, kind, controls) {
  const sourceRoot = documentRef.createElement("div");
  sourceRoot.__rect = { top: kind === "primary" ? 24 : 84, left: 760, width: 260, height: 48 };
  controls.forEach((node) => sourceRoot.appendChild(node));
  documentRef.main.appendChild(sourceRoot);
  return { actionNodes: controls, kind, sourceRoot };
}

function createButton(documentRef, text) {
  const node = documentRef.createElement("button");
  node.textContent = text;
  return node;
}

test("shared board-control portal mirrors separated groups with direct click and keyboard mappings", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const undoButton = createButton(documentRef, "Undo");
  const nextButton = createButton(documentRef, "Next");
  const liveTab = documentRef.createElement("div");
  liveTab.setAttribute("role", "tab");
  liveTab.setAttribute("aria-label", "Live Mode");
  liveTab.setAttribute("aria-selected", "false");
  const virtualSwitch = documentRef.createElement("div");
  virtualSwitch.setAttribute("role", "switch");
  virtualSwitch.setAttribute("aria-label", "Virtual Board");
  virtualSwitch.setAttribute("aria-checked", "true");

  let undoClicks = 0;
  let liveClicks = 0;
  let virtualClicks = 0;
  undoButton.addEventListener("click", () => { undoClicks += 1; });
  liveTab.addEventListener("click", () => { liveClicks += 1; });
  virtualSwitch.addEventListener("click", () => { virtualClicks += 1; });

  const groups = [
    createGroup(documentRef, "primary", [undoButton, nextButton]),
    createGroup(documentRef, "input-mode", [liveTab, virtualSwitch]),
  ];
  const themeState = { boardControlsPortal: null, layoutHookTargets: { boardControlGroups: groups } };

  assert.equal(syncBoardControlsPortal({ documentRef, themeState, windowRef }), true);
  const portalNode = documentRef.querySelector(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`);
  const mirrorGroups = portalNode.querySelectorAll("[data-ad-ext-board-controls-kind]");
  const mirrorUndo = mirrorGroups[0].querySelector("button");
  const mirrorLive = mirrorGroups[1].querySelector("[role='tab']");
  const mirrorVirtual = mirrorGroups[1].querySelector("[role='switch']");

  assert.equal(mirrorGroups.length, 2);
  assert.equal(groups[0].sourceRoot.getAttribute("aria-hidden"), "true");
  assert.equal(
    groups[0].sourceRoot.getAttribute(BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE),
    "true"
  );
  assert.equal(
    mirrorGroups[0].firstElementChild.getAttribute(BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE),
    null
  );
  assert.equal(undoButton.getAttribute("tabindex"), "-1");
  assert.equal(mirrorGroups[0].firstElementChild.getAttribute("aria-hidden"), null);
  assert.equal(mirrorLive.getAttribute("tabindex"), "0");

  mirrorUndo.click();
  mirrorLive.click();
  mirrorVirtual.dispatchEvent(new FakeEvent("keydown", { key: "Enter", target: mirrorVirtual }));
  assert.equal(undoClicks, 1);
  assert.equal(liveClicks, 1);
  assert.equal(virtualClicks, 1);

  cleanupBoardControlsPortal(themeState);
  assert.equal(groups[0].sourceRoot.getAttribute("aria-hidden"), null);
  assert.equal(
    groups[0].sourceRoot.getAttribute(BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE),
    null
  );
  assert.equal(undoButton.getAttribute("tabindex"), null);
  assert.equal(documentRef.querySelector(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`), null);
});

test("portal patches host state in place and rebuilds only for genuine host DOM replacement", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const liveRadio = documentRef.createElement("input");
  liveRadio.type = "radio";
  liveRadio.setAttribute("type", "radio");
  liveRadio.setAttribute("aria-label", "Live-Modus");
  liveRadio.setAttribute("aria-checked", "false");
  liveRadio.setAttribute("data-state", "inactive");
  const group = createGroup(documentRef, "input-mode", [liveRadio]);
  const originalClone = group.sourceRoot.cloneNode.bind(group.sourceRoot);
  let cloneCount = 0;
  group.sourceRoot.cloneNode = (deep) => {
    cloneCount += 1;
    return originalClone(deep);
  };
  const themeState = { boardControlsPortal: null, layoutHookTargets: { boardControlGroups: [group] } };

  syncBoardControlsPortal({ documentRef, themeState, windowRef });
  const firstMirrorRoot = themeState.boardControlsPortal.entries[0].mirrorRoot;
  liveRadio.checked = true;
  liveRadio.setAttribute("aria-checked", "true");
  liveRadio.setAttribute("data-active", "true");
  liveRadio.setAttribute("data-state", "checked");
  liveRadio.setAttribute("aria-label", "Live Board");
  liveRadio.setAttribute("title", "Live Board auswählen");
  liveRadio.value = "live";
  syncBoardControlsPortal({ documentRef, themeState, windowRef });

  const retainedEntry = themeState.boardControlsPortal.entries[0];
  const retainedMirrorRadio = retainedEntry.mirrorRoot.querySelector("input");
  assert.equal(retainedEntry.mirrorRoot, firstMirrorRoot);
  assert.equal(cloneCount, 1);
  assert.equal(retainedMirrorRadio.checked, true);
  assert.equal(retainedMirrorRadio.getAttribute("aria-checked"), "true");
  assert.equal(retainedMirrorRadio.getAttribute("data-active"), "true");
  assert.equal(retainedMirrorRadio.getAttribute("data-state"), "checked");
  assert.equal(retainedMirrorRadio.getAttribute("aria-label"), "Live Board");
  assert.equal(retainedMirrorRadio.getAttribute("title"), "Live Board auswählen");
  assert.equal(retainedMirrorRadio.value, "live");

  const replacementRadio = documentRef.createElement("input");
  replacementRadio.type = "radio";
  replacementRadio.setAttribute("type", "radio");
  replacementRadio.setAttribute("aria-label", "Live-Modus");
  const replacementGroup = createGroup(documentRef, "input-mode", [replacementRadio]);
  group.sourceRoot.remove();
  themeState.layoutHookTargets.boardControlGroups = [replacementGroup];
  syncBoardControlsPortal({ documentRef, themeState, windowRef });

  assert.notEqual(themeState.boardControlsPortal.entries[0].mirrorRoot, firstMirrorRoot);
  assert.equal(group.sourceRoot.getAttribute("aria-hidden"), null);
  assert.equal(documentRef.querySelectorAll(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`).length, 1);
});

test("portal patches text and rebinds same-shape action replacements", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const originalButton = createButton(documentRef, "Live mode");
  originalButton.setAttribute("aria-label", "Live mode");
  const group = createGroup(documentRef, "input-mode", [originalButton]);
  const themeState = {
    boardControlsPortal: null,
    layoutHookTargets: { boardControlGroups: [group] },
  };
  let originalClicks = 0;
  let replacementClicks = 0;
  originalButton.addEventListener("click", () => { originalClicks += 1; });

  syncBoardControlsPortal({ documentRef, themeState, windowRef });
  const firstMirrorRoot = themeState.boardControlsPortal.entries[0].mirrorRoot;
  originalButton.textContent = "Live Board";
  originalButton.setAttribute("aria-label", "Live Board");
  syncBoardControlsPortal({ documentRef, themeState, windowRef });
  assert.equal(themeState.boardControlsPortal.entries[0].mirrorRoot, firstMirrorRoot);
  assert.equal(firstMirrorRoot.querySelector("button").textContent, "Live Board");

  const replacementButton = createButton(documentRef, "Live Board");
  replacementButton.setAttribute("aria-label", "Live Board");
  replacementButton.addEventListener("click", () => { replacementClicks += 1; });
  group.sourceRoot.replaceChildren(replacementButton);
  group.actionNodes = [replacementButton];
  syncBoardControlsPortal({ documentRef, themeState, windowRef });

  const replacementMirrorRoot = themeState.boardControlsPortal.entries[0].mirrorRoot;
  assert.notEqual(replacementMirrorRoot, firstMirrorRoot);
  replacementMirrorRoot.querySelector("button").click();
  assert.equal(originalClicks, 0);
  assert.equal(replacementClicks, 1);
});

test("portal never invents a live-board action when layout discovery supplies none", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const undoButton = createButton(documentRef, "Undo");
  const primaryGroup = createGroup(documentRef, "primary", [undoButton]);
  const themeState = {
    boardControlsPortal: null,
    layoutHookTargets: { boardControlGroups: [primaryGroup] },
  };

  syncBoardControlsPortal({ documentRef, themeState, windowRef });
  const portalText = String(themeState.boardControlsPortal.portalNode.textContent || "");
  assert.equal(/live|virtual/i.test(portalText), false);

  themeState.layoutHookTargets.boardControlGroups = [];
  assert.equal(syncBoardControlsPortal({ documentRef, themeState, windowRef }), false);
  assert.equal(themeState.boardControlsPortal, null);
});

test("portal hides controls that are not mapped as available host actions", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const nextButton = createButton(documentRef, "Next");
  const disabledUndoButton = createButton(documentRef, "Undo");
  disabledUndoButton.disabled = true;
  disabledUndoButton.setAttribute("disabled", "");
  const group = createGroup(documentRef, "primary", [nextButton, disabledUndoButton]);
  group.actionNodes = [nextButton];
  const themeState = {
    boardControlsPortal: null,
    layoutHookTargets: { boardControlGroups: [group] },
  };

  syncBoardControlsPortal({ documentRef, themeState, windowRef });
  const mirrorButtons = themeState.boardControlsPortal.entries[0].mirrorRoot.querySelectorAll("button");
  assert.equal(mirrorButtons[0].getAttribute("hidden"), null);
  assert.equal(mirrorButtons[1].getAttribute("hidden"), "");
  assert.equal(mirrorButtons[1].getAttribute("aria-hidden"), "true");
  assert.equal(mirrorButtons[1].getAttribute("tabindex"), "-1");
});

test("overlapping active themes share one portal until the last owner cleans up", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const liveButton = createButton(documentRef, "Live Board");
  const group = createGroup(documentRef, "input-mode", [liveButton]);
  const layoutHookTargets = { boardControlGroups: [group] };
  const x01State = { boardControlsPortal: null, layoutHookTargets };
  const twoPlayerState = { boardControlsPortal: null, layoutHookTargets };

  syncBoardControlsPortal({ documentRef, themeState: x01State, windowRef });
  syncBoardControlsPortal({ documentRef, themeState: twoPlayerState, windowRef });

  assert.equal(x01State.boardControlsPortal, twoPlayerState.boardControlsPortal);
  assert.equal(documentRef.querySelectorAll(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`).length, 1);

  cleanupBoardControlsPortal(x01State);
  assert.equal(x01State.boardControlsPortal, null);
  assert.notEqual(twoPlayerState.boardControlsPortal, null);
  assert.equal(group.sourceRoot.getAttribute("aria-hidden"), "true");
  assert.equal(documentRef.querySelectorAll(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`).length, 1);

  cleanupBoardControlsPortal(twoPlayerState);
  assert.equal(group.sourceRoot.getAttribute("aria-hidden"), null);
  assert.equal(documentRef.querySelector(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`), null);
});

test("portal keeps mirror groups inside narrow and low viewports", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.innerWidth = 800;
  windowRef.innerHeight = 100;
  const liveButton = createButton(documentRef, "Live Board");
  const group = createGroup(documentRef, "input-mode", [liveButton]);
  const themeState = {
    boardControlsPortal: null,
    layoutHookTargets: { boardControlGroups: [group] },
  };

  syncBoardControlsPortal({ documentRef, themeState, windowRef });
  const wrapperStyle = themeState.boardControlsPortal.entries[0].wrapperNode.style;
  assert.equal(wrapperStyle.getPropertyValue("left"), "536.0px");
  assert.equal(wrapperStyle.getPropertyValue("top"), "48.0px");
  assert.equal(wrapperStyle.getPropertyValue("width"), "260.0px");
});
