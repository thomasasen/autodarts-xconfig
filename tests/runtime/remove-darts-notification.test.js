import test from "node:test";
import assert from "node:assert/strict";

import { TAKEOUT_IMAGE_ASSET } from "#feature-assets";
import {
  clearRemoveDartsNotificationState,
  createRemoveDartsNotificationState,
  requestImmediateFallbackScan,
  updateRemoveDartsNotification,
} from "../../src/features/remove-darts-notification/logic.js";
import { CARD_CLASS, IMAGE_CLASS } from "../../src/features/remove-darts-notification/style.js";
import { FakeDocument } from "./fake-dom.js";

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

test("remove-darts-notification injects hand image for primary .adt-remove notices", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  notice.classList.add("adt-remove");
  notice.textContent = "Remove Darts";
  documentRef.main.appendChild(notice);

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(notice.classList.contains(CARD_CLASS), true);
  const imageNode = notice.querySelector(`.${IMAGE_CLASS}`);
  assert.ok(imageNode);
  assert.equal(String(imageNode.src || ""), String(TAKEOUT_IMAGE_ASSET));

  clearRemoveDartsNotificationState(state);
  assert.equal(notice.classList.contains(CARD_CLASS), false);
  assert.equal(Boolean(notice.querySelector(`.${IMAGE_CLASS}`)), false);
});

test("remove-darts-notification decorates the visible wrapper when .adt-remove is nested inside a card", () => {
  const documentRef = new FakeDocument();
  const overlay = documentRef.createElement("div");
  const card = documentRef.createElement("div");
  const notice = documentRef.createElement("div");
  notice.classList.add("adt-remove");
  notice.textContent = "Removing Darts";
  card.appendChild(notice);
  overlay.appendChild(card);
  documentRef.main.appendChild(overlay);

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(overlay.classList.contains(CARD_CLASS), false);
  assert.equal(card.classList.contains(CARD_CLASS), true);
  assert.equal(notice.classList.contains(CARD_CLASS), false);
  assert.equal(Boolean(card.querySelector(`.${IMAGE_CLASS}`)), true);
  assert.equal(Boolean(notice.querySelector(`.${IMAGE_CLASS}`)), false);

  clearRemoveDartsNotificationState(state);
  assert.equal(card.classList.contains(CARD_CLASS), false);
  assert.equal(Boolean(card.querySelector(`.${IMAGE_CLASS}`)), false);
});

test("remove-darts-notification fallback recognizes 'Remove Darts' text", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Remove Darts",
      parentElement: notice,
    });
  };

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(notice.classList.contains(CARD_CLASS), true);
  assert.ok(notice.querySelector(`.${IMAGE_CLASS}`));
});

test("remove-darts-notification fallback recognizes board-manager takeout states", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Takeout is in Progress",
      parentElement: notice,
    });
  };

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(notice.classList.contains(CARD_CLASS), true);
  assert.ok(notice.querySelector(`.${IMAGE_CLASS}`));
});

test("remove-darts-notification ignores fallback matches inside xConfig shell content", () => {
  const documentRef = new FakeDocument();
  const panelHost = documentRef.createElement("div");
  panelHost.id = "ad-xconfig-panel-host";
  const titleNode = documentRef.createElement("h3");
  titleNode.textContent = "Remove Darts Notification";
  panelHost.appendChild(titleNode);
  documentRef.main.appendChild(panelHost);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Remove Darts Notification",
      parentElement: titleNode,
    });
  };

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(titleNode.classList.contains(CARD_CLASS), false);
  assert.equal(Boolean(titleNode.querySelector(`.${IMAGE_CLASS}`)), false);
});

test("remove-darts-notification ignores throw-only board-manager status texts", () => {
  const documentRef = new FakeDocument();
  const notice = documentRef.createElement("div");
  documentRef.main.appendChild(notice);

  documentRef.createTreeWalker = () => {
    return createSingleNodeTreeWalker({
      nodeValue: "Board Manager is ready and await your throw",
      parentElement: notice,
    });
  };

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(notice.classList.contains(CARD_CLASS), false);
  assert.equal(Boolean(notice.querySelector(`.${IMAGE_CLASS}`)), false);
});

test("remove-darts-notification prioritizes explicit takeout status over mixed scan noise", () => {
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

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(throwNode.classList.contains(CARD_CLASS), false);
  assert.equal(notice.classList.contains(CARD_CLASS), true);
  assert.ok(notice.querySelector(`.${IMAGE_CLASS}`));
});

test("remove-darts-notification pauses while #ad-xconfig route is active", () => {
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

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(notice.classList.contains(CARD_CLASS), false);
  assert.equal(Boolean(notice.querySelector(`.${IMAGE_CLASS}`)), false);
});

test("remove-darts-notification can force fallback scan despite throttle window", () => {
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

  const state = createRemoveDartsNotificationState();

  updateRemoveDartsNotification({ documentRef, state });
  assert.equal(fallbackScanCount > 0, true);
  const firstScanCount = fallbackScanCount;
  assert.equal(Boolean(notice.querySelector(`.${IMAGE_CLASS}`)), false);

  textValue = "Remove Darts";
  updateRemoveDartsNotification({ documentRef, state });
  assert.equal(fallbackScanCount, firstScanCount);
  assert.equal(Boolean(notice.querySelector(`.${IMAGE_CLASS}`)), false);

  requestImmediateFallbackScan(state);
  updateRemoveDartsNotification({ documentRef, state });
  assert.equal(fallbackScanCount > firstScanCount, true);
  assert.ok(notice.querySelector(`.${IMAGE_CLASS}`));
});

test("remove-darts-notification scans preferred fallback areas before global body scope", () => {
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

  const state = createRemoveDartsNotificationState();
  updateRemoveDartsNotification({ documentRef, state });

  assert.equal(notice.classList.contains(CARD_CLASS), true);
  assert.ok(notice.querySelector(`.${IMAGE_CLASS}`));
});
