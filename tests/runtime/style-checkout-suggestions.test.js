import test from "node:test";
import assert from "node:assert/strict";

import {
  applySuggestionStyle,
  resetSuggestionNode,
} from "../../src/features/style-checkout-suggestions/logic.js";
import { FakeDocument } from "./fake-dom.js";

test("style-checkout-suggestions writes and clears the checkout label through dataset-backed attributes", () => {
  const documentRef = new FakeDocument();
  const node = documentRef.createElement("div");

  applySuggestionStyle(node, {
    style: "badge",
    labelText: "CHECKOUT",
    colorTheme: "amber",
  });

  assert.equal(node.dataset.adExtLabel, "CHECKOUT");
  assert.equal(node.getAttribute("data-ad-ext-label"), "CHECKOUT");

  resetSuggestionNode(node);

  assert.equal(node.dataset.adExtLabel, undefined);
  assert.equal(node.getAttribute("data-ad-ext-label"), null);
});
