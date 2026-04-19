import test from "node:test";
import assert from "node:assert/strict";

import { getRenderableArea, isNodeVisible } from "../../src/shared/dom-visibility.js";
import { FakeDocument } from "./fake-dom.js";

test("shared dom visibility prefers renderable area before client rect fallback", () => {
  const documentRef = new FakeDocument();
  const node = documentRef.createElement("div");
  documentRef.body.appendChild(node);

  let clientRectReads = 0;
  node.getBoundingClientRect = () => ({
    width: 120,
    height: 48,
  });
  node.getClientRects = () => {
    clientRectReads += 1;
    throw new Error("getClientRects should not be needed for area-positive nodes");
  };

  assert.equal(getRenderableArea(node) > 0, true);
  assert.equal(isNodeVisible(node), true);
  assert.equal(clientRectReads, 0);
});

test("shared dom visibility keeps inline text fallback when the node has client rects but no area", () => {
  const documentRef = new FakeDocument();
  const node = documentRef.createElement("span");
  documentRef.body.appendChild(node);

  node.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
  });
  node.getClientRects = () => [{ width: 12, height: 16 }];

  assert.equal(isNodeVisible(node), true);
});
