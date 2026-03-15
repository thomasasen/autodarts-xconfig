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
