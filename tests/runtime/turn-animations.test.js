import test from "node:test";
import assert from "node:assert/strict";

import { animateArrowNode } from "../../src/features/avg-trend-arrow/logic.js";
import { ANIMATE_CLASS } from "../../src/features/avg-trend-arrow/style.js";
import { FakeDocument } from "./fake-dom.js";

test("animateArrowNode retriggers the animation class on fake-dom nodes without offsetWidth", async () => {
  const documentRef = new FakeDocument();
  const arrowNode = documentRef.createElement("span");
  const timeoutByArrow = new Map();

  animateArrowNode(arrowNode, 320, timeoutByArrow);

  assert.equal(arrowNode.classList.contains(ANIMATE_CLASS), true);
  assert.equal(timeoutByArrow.has(arrowNode), true);
  clearTimeout(timeoutByArrow.get(arrowNode));
});
