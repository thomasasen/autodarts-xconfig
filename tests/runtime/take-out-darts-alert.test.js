import test from "node:test";
import assert from "node:assert/strict";

import { TAKEOUT_IMAGE_ASSET } from "#feature-assets";
import {
  clearTakeOutDartsAlertState,
  createTakeOutDartsAlertState,
  requestImmediateFallbackScan,
  updateTakeOutDartsAlert,
} from "../../src/features/take-out-darts-alert/logic.js";
import {
  CARD_CLASS,
  HIDDEN_NOTICE_CLASS,
  IMAGE_CLASS,
  OVERLAY_ROOT_CLASS,
} from "../../src/features/take-out-darts-alert/style.js";
import { FakeDocument, useHtmlCollectionChildren } from "./fake-dom.js";

function createSingleNodeTreeWalker(nodeOrNull) {
  let consumed = false;
  return {
    nextNode() {
      if (consumed) {
        return null;
      }
      consumed = true;
      return nodeOrNull || null;
    },
  };
}

test("take-out-darts-alert hides the host notice and mounts an isolated overlay", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  notice.classList.add("adt-remove");
  notice.textContent = "Remove Darts";
  documentRef.main.appendChild(notice);

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.equal(notice.classList.contains(CARD_CLASS), false);
  const overlayNode = documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`);
  assert.ok(overlayNode);
  const cardNode = overlayNode.querySelector(`.${CARD_CLASS}`);
  assert.ok(cardNode);
  const imageNode = overlayNode.querySelector(`.${IMAGE_CLASS}`);
  assert.ok(imageNode);
  assert.equal(String(imageNode.src || ""), String(TAKEOUT_IMAGE_ASSET));

  clearTakeOutDartsAlertState(state);
  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);
});

test("take-out-darts-alert hides the visible wrapper when .adt-remove is nested inside a card", () => {
  const documentRef = new FakeDocument();
  const overlay = documentRef.createElement("div");
  const card = documentRef.createElement("div");
  const notice = documentRef.createElement("div");
  notice.classList.add("adt-remove");
  notice.textContent = "Removing Darts";
  card.appendChild(notice);
  overlay.appendChild(card);
  documentRef.main.appendChild(overlay);

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(overlay.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(card.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(card.querySelector(`.${IMAGE_CLASS}`)), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), true);

  clearTakeOutDartsAlertState(state);
  assert.equal(card.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);
});

test("take-out-darts-alert still promotes the visible wrapper when the wrapper exposes HTMLCollection-style children", () => {
  const documentRef = new FakeDocument();
  const overlay = documentRef.createElement("div");
  const card = documentRef.createElement("div");
  const notice = documentRef.createElement("div");
  notice.textContent = "Removing Darts";
  card.appendChild(notice);
  overlay.appendChild(card);
  documentRef.main.appendChild(overlay);
  useHtmlCollectionChildren(card);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Removing Darts",
      parentElement: notice,
    });
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(card.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));
});

test("take-out-darts-alert fallback recognizes 'Remove Darts' text", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Remove Darts",
      parentElement: notice,
    });
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));
});

test("take-out-darts-alert fallback recognizes board-manager takeout states", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Takeout is in Progress",
      parentElement: notice,
    });
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));
});

test("take-out-darts-alert ignores fallback matches inside xConfig shell content", () => {
  const documentRef = new FakeDocument();
  const panelHost = documentRef.createElement("div");
  panelHost.id = "ad-xconfig-panel-host";
  const titleNode = documentRef.createElement("h3");
  titleNode.textContent = "Take Out Darts Alert";
  panelHost.appendChild(titleNode);
  documentRef.main.appendChild(panelHost);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Take Out Darts Alert",
      parentElement: titleNode,
    });
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(titleNode.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);
});

test("take-out-darts-alert ignores throw-only board-manager status texts", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Board Manager is ready and await your throw",
      parentElement: notice,
    });
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);
});

test("take-out-darts-alert prioritizes explicit takeout status over mixed scan noise", () => {
  const documentRef = new FakeDocument();
  const throwNode = documentRef.createElement("div");
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(throwNode);
  documentRef.main.appendChild(notice);

  let index = 0;
  const nodes = [
    {
      nodeValue: "Throw detected",
      parentElement: throwNode,
    },
    {
      nodeValue: "Takeout started",
      parentElement: notice,
    },
  ];

  documentRef.createTreeWalker = (_rootNode, nodeFilter) => {
    if (nodeFilter !== 4) {
      return createSingleNodeTreeWalker(null);
    }

    return {
      nextNode() {
        if (index >= nodes.length) {
          return null;
        }
        const node = nodes[index];
        index += 1;
        return node;
      },
    };
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(throwNode.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));
});

test("take-out-darts-alert pauses while #ad-xconfig route is active", () => {
  const documentRef = new FakeDocument();
  documentRef.defaultView = {
    location: {
      pathname: "/matches",
      hash: "#ad-xconfig",
    },
  };
  const notice = documentRef.createElement("div");
  notice.classList.add("adt-remove");
  notice.textContent = "Remove Darts";
  documentRef.main.appendChild(notice);

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);
});

test("take-out-darts-alert can force fallback scan despite throttle window", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  let fallbackScanCount = 0;
  let textValue = "";

  documentRef.createTreeWalker = (_rootNode, nodeFilter) => {
    if (nodeFilter === 4) {
      fallbackScanCount += 1;
      return createSingleNodeTreeWalker(
        textValue
          ? {
              nodeValue: textValue,
              parentElement: notice,
            }
          : null
      );
    }

    return createSingleNodeTreeWalker(null);
  };

  const state = createTakeOutDartsAlertState();

  updateTakeOutDartsAlert({ documentRef, state });
  assert.equal(fallbackScanCount > 0, true);
  const firstScanCount = fallbackScanCount;
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);

  textValue = "Remove Darts";
  updateTakeOutDartsAlert({ documentRef, state });
  assert.equal(fallbackScanCount, firstScanCount);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);

  requestImmediateFallbackScan(state);
  updateTakeOutDartsAlert({ documentRef, state });
  assert.equal(fallbackScanCount > firstScanCount, true);
  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));
});

test("take-out-darts-alert removes overlay and restores the host when the notice disappears", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  notice.classList.add("adt-remove");
  notice.textContent = "Remove Darts";
  documentRef.main.appendChild(notice);

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));

  notice.classList.remove("adt-remove");
  notice.textContent = "Ready";
  requestImmediateFallbackScan(state);
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), false);
  assert.equal(Boolean(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`)), false);
});

test("take-out-darts-alert scans preferred fallback areas before global body scope", () => {
  const documentRef = new FakeDocument();
  const overlayArea = documentRef.createElement("div");
  overlayArea.classList.add("v-overlay-container");
  const notice = documentRef.createElement("div");
  overlayArea.appendChild(notice);
  documentRef.main.appendChild(overlayArea);

  documentRef.createTreeWalker = (rootNode) => {
    if (rootNode === overlayArea) {
      return createSingleNodeTreeWalker({
        nodeValue: "Remove Darts",
        parentElement: notice,
      });
    }

    return createSingleNodeTreeWalker(null);
  };

  const state = createTakeOutDartsAlertState();
  updateTakeOutDartsAlert({ documentRef, state });

  assert.equal(notice.classList.contains(HIDDEN_NOTICE_CLASS), true);
  assert.ok(documentRef.body.querySelector(`.${OVERLAY_ROOT_CLASS}`));
});
